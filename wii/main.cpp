#include <gccore.h>
#include <ogc/conf.h>
#include <ogc/lwp_watchdog.h>
#include <wiiuse/wpad.h>

#include <cstdio>
#include <cstring>

#include "selection.hpp"

namespace {
static_assert((GX_TRIANGLES | GX_VTXFMT0) == 0x90);

struct Mesh {
    const unsigned char* commands;
    uint32_t bytes;

    template<size_t size>
    constexpr Mesh(const unsigned char (&data)[size]) : commands(data), bytes(size) {
        static_assert(size % 32 == 0);
    }
};

struct FighterVisual {
    Mesh portrait;
    float x, y, rowHeight;
};

#include "web_meshes.inc"
static_assert(std::size(fighterVisuals) == std::size(web::roster));

struct alignas(32) PlayerList {
    unsigned char commands[playerListSize];
};

std::array<PlayerList, 4> playerLists;

constexpr unsigned fifoSize = 256 * 1024;
alignas(32) unsigned char fifo[fifoSize];
GXRModeObj* mode;
void* framebuffers[2];
unsigned bufferIndex = 0;
Mtx camera;
Mtx44 perspective;
Mtx44 overlay;

// Keep all world-space display lists on one fixed matrix and reserve a second one for the HUD.
constexpr unsigned arenaMatrix = GX_PNMTX0;
constexpr unsigned hudMatrix = GX_PNMTX1;

void initVideo() {
    VIDEO_Init();
    mode = VIDEO_GetPreferredMode(nullptr);
    for (auto& framebuffer : framebuffers) {
        framebuffer = MEM_K0_TO_K1(SYS_AllocateFramebuffer(mode));
    }
    VIDEO_Configure(mode);
    GX_Init(fifo, fifoSize);
    GX_SetCopyClear({19, 27, 43, 255}, GX_MAX_Z24);
    GX_SetViewport(0, 0, mode->fbWidth, mode->efbHeight, 0, 1);
    GX_SetScissor(0, 0, mode->fbWidth, mode->efbHeight);
    const auto height = GX_SetDispCopyYScale(GX_GetYScaleFactor(mode->efbHeight, mode->xfbHeight));
    GX_SetDispCopySrc(0, 0, mode->fbWidth, mode->efbHeight);
    GX_SetDispCopyDst(mode->fbWidth, height);
    GX_SetCopyFilter(mode->aa, mode->sample_pattern, GX_TRUE, mode->vfilter);
    GX_SetFieldMode(mode->field_rendering, mode->viHeight == 2 * mode->xfbHeight);
    GX_SetPixelFmt(mode->aa ? GX_PF_RGB565_Z16 : GX_PF_RGB8_Z24, GX_ZC_LINEAR);
    GX_SetCullMode(GX_CULL_NONE);
    GX_SetNumTexGens(0);
    GX_SetNumChans(1);
    GX_SetNumTevStages(1);
    GX_SetChanCtrl(GX_COLOR0A0, GX_DISABLE, GX_SRC_REG, GX_SRC_VTX, 0, GX_DF_NONE, GX_AF_NONE);
    GX_SetTevOrder(GX_TEVSTAGE0, GX_TEXCOORDNULL, GX_TEXMAP_NULL, GX_COLOR0A0);
    GX_SetTevOp(GX_TEVSTAGE0, GX_PASSCLR);
    GX_SetBlendMode(GX_BM_BLEND, GX_BL_SRCALPHA, GX_BL_INVSRCALPHA, GX_LO_CLEAR);
    GX_SetColorUpdate(GX_TRUE);
    GX_SetVtxAttrFmt(GX_VTXFMT0, GX_VA_POS, GX_POS_XYZ, GX_F32, 0);
    GX_SetVtxAttrFmt(GX_VTXFMT0, GX_VA_CLR0, GX_CLR_RGBA, GX_RGBA8, 0);
    GX_ClearVtxDesc();
    GX_SetVtxDesc(GX_VA_POS, GX_DIRECT);
    GX_SetVtxDesc(GX_VA_CLR0, GX_DIRECT);

    DCFlushRange(const_cast<unsigned char*>(arenaOpaque), sizeof(arenaOpaque));
    DCFlushRange(const_cast<unsigned char*>(arenaTranslucent), sizeof(arenaTranslucent));
    for (const auto& visual : fighterVisuals) {
        DCFlushRange(const_cast<unsigned char*>(visual.portrait.commands), visual.portrait.bytes);
    }

    guVector eye{0, 9, 36}, up{0, 1, 0}, target{0, 2.4f, 0};
    guLookAt(camera, &eye, &up, &target);
    const float aspect = CONF_GetAspectRatio() == CONF_ASPECT_16_9 ? 16.0f / 9 : 4.0f / 3;
    guPerspective(perspective, 40, aspect, 1, 100);
    guOrtho(overlay, 0, 480, 0, 640, 0, 1);
    Mtx identity;
    guMtxIdentity(identity);
    GX_LoadPosMtxImm(camera, arenaMatrix);
    GX_LoadPosMtxImm(identity, hudMatrix);
    GX_CopyDisp(framebuffers[bufferIndex], GX_TRUE);
    GX_DrawDone();
    VIDEO_SetNextFramebuffer(framebuffers[bufferIndex]);
    VIDEO_SetBlack(FALSE);
    VIDEO_Flush();
    VIDEO_WaitVSync();
    if (mode->viTVMode & VI_NON_INTERLACE) VIDEO_WaitVSync();
}

void drawWorld(Mesh mesh, unsigned char* commands, float x, float y, float facing) {
    // Transform the pose into world coordinates so all 3D draws use the static camera matrix.
    std::memcpy(commands, mesh.commands, mesh.bytes);
    const unsigned count = unsigned(commands[1]) * 256 + commands[2];
    auto* vertex = commands + 3;
    for (unsigned index = 0; index < count; ++index, vertex += 16) {
        float xy[2];
        std::memcpy(xy, vertex, sizeof(xy));
        xy[0] = x + xy[0] * facing;
        xy[1] += y;
        std::memcpy(vertex, xy, sizeof(xy));
    }
    DCFlushRange(commands, mesh.bytes);
    GX_CallDispList(commands, mesh.bytes);
}

void rect(float x, float y, float width, float height, uint32_t color) {
    GX_Begin(GX_QUADS, GX_VTXFMT0, 4);
    GX_Position3f32(x, y, 0); GX_Color1u32(color);
    GX_Position3f32(x + width, y, 0); GX_Color1u32(color);
    GX_Position3f32(x + width, y + height, 0); GX_Color1u32(color);
    GX_Position3f32(x, y + height, 0); GX_Color1u32(color);
    GX_End();
}

const char* glyph(char character) {
    switch (character) {
    case '0': return "75557"; case '1': return "26227"; case '2': return "71747";
    case '3': return "71717"; case '4': return "55711"; case '5': return "74717";
    case '6': return "74757"; case '7': return "71111"; case '8': return "75757";
    case '9': return "75717"; case 'A': return "25755"; case 'D': return "65556";
    case 'B': return "65656"; case 'C': return "74447"; case 'E': return "74647"; case 'F': return "74644";
    case 'G': return "74557"; case 'H': return "55755"; case 'I': return "72227"; case 'J': return "11157";
    case 'K': return "55655"; case 'L': return "44447"; case 'M': return "57755";
    case 'N': return "57555"; case 'O': return "75557"; case 'P': return "75744";
    case 'Q': return "75573"; case 'R': return "75655"; case 'S': return "74717"; case 'T': return "72222";
    case 'U': return "55557"; case 'V': return "55552"; case 'W': return "55572";
    case 'X': return "55255"; case 'Y': return "55222"; case 'Z': return "71247";
    case '+': return "02720"; case '/': return "11244"; case '.': return "00002";
    case '!': return "22202"; case '&': return "25356"; case '\'': return "22000";
    case ':': return "02020"; case '%': return "51445"; case '-': return "00700";
    default: return "00000";
    }
}

void label(float x, float y, const char* text, float size, uint32_t color = 0xffffffffu) {
    for (; *text; ++text, x += 4 * size) {
        const char* rows = glyph(*text);
        for (int row = 0; row < 5; ++row) {
            for (int column = 0; column < 3; ++column) {
                if ((rows[row] - '0') & (4 >> column)) {
                    rect(x + column * size, y + row * size, size, size, color);
                }
            }
        }
    }
}

void centerLabel(float x, float y, const char* text, float size, uint32_t color = 0xffffffffu) {
    label(x - (4 * std::strlen(text) - 1) * size / 2, y, text, size, color);
}

void beginOverlay() {
    GX_LoadProjectionMtx(overlay, GX_ORTHOGRAPHIC);
    GX_SetCurrentMtx(hudMatrix);
    GX_SetZMode(GX_FALSE, GX_ALWAYS, GX_FALSE);
}

void present() {
    bufferIndex ^= 1;
    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_TRUE);
    GX_CopyDisp(framebuffers[bufferIndex], GX_TRUE);
    // Finish reading the display lists before the next frame rewrites them.
    GX_DrawDone();
    VIDEO_SetNextFramebuffer(framebuffers[bufferIndex]);
    VIDEO_Flush();
    VIDEO_WaitVSync();
}

void renderSelection(const Selection& selection, bool error) {
    constexpr uint32_t muted = 0xa9b6c8ffu;
    constexpr float sideX[] = {81, 81, 559, 559};
    constexpr float sideY[] = {154, 286, 154, 286};
    beginOverlay();
    centerLabel(320, 37, "SELECT FIGHTERS", 4);
    for (const auto& card : fighterVisuals) {
        rect(card.x - 29, card.y - card.rowHeight / 2 + 7, 58, card.rowHeight - 4, 0x263345ffu);
    }
    for (int slot = 0; slot < 4; ++slot) {
        const float x = sideX[slot];
        const float y = sideY[slot];
        const auto color = selection.connected[slot] ? web::playerColors[slot] : 0x566478ffu;
        rect(x - 41, y - 43, 82, 112, color);
        rect(x - 39, y - 41, 78, 108, 0x1a2434ffu);
        char title[] = {'P', char('1' + slot), 0};
        centerLabel(x, y - 34, title, 2.3f, color);
        centerLabel(x, y + 50, !selection.connected[slot] ? "OPEN" : selection.ready[slot] ? "READY" : "PICK", 2.0f, color);
    }

    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_TRUE);
    for (const auto& visual : fighterVisuals) {
        GX_CallDispList(const_cast<unsigned char*>(visual.portrait.commands), visual.portrait.bytes);
    }
    for (int slot = 0; slot < 4; ++slot) {
        if (!selection.connected[slot]) continue;
        const auto& visual = fighterVisuals[selection.choices[slot]];
        drawWorld(visual.portrait, playerLists[slot].commands, sideX[slot] - visual.x, sideY[slot] - visual.y, 1);
    }

    GX_SetZMode(GX_FALSE, GX_ALWAYS, GX_FALSE);
    for (size_t index = 0; index < std::size(fighterVisuals); ++index) {
        const auto& card = fighterVisuals[index];
        const auto& fighter = web::roster[index];
        const auto size = std::min(1.45f, 53.0f / (4 * std::strlen(fighter.name)));
        centerLabel(card.x, card.y + card.rowHeight / 2 - 7, fighter.name, size, fighter.color);
    }
    for (int slot = 0; slot < 4; ++slot) {
        if (!selection.connected[slot]) continue;
        const auto& card = fighterVisuals[selection.choices[slot]];
        const auto color = web::playerColors[slot];
        const auto* name = web::roster[selection.choices[slot]].name;
        const float chipX = card.x - 26 + slot * 13;
        const float chipY = card.y - card.rowHeight / 2 + 9;
        rect(chipX, chipY, 11, 9, color);
        char marker[] = {char('1' + slot), 0};
        label(chipX + 3, chipY + 2, marker, 1.0f, 0x101622ffu);
        centerLabel(sideX[slot], sideY[slot] + 33, name,
            std::min(1.6f, 74.0f / (4 * std::strlen(name))));
    }
    centerLabel(320, 405, "MOVE TO PICK     A / 2 CONFIRM     B / 1 BACK", 1.65f, muted);
    centerLabel(320, 429, error ? "FIGHT COULD NOT START" : selection.canStart() ? "+ START" : "CONFIRM A FIGHTER",
        2.3f, error ? 0xffad6cffu : selection.canStart() ? 0x76f3d3ffu : muted);
    present();
}

void renderMatch(const Fight& fight, const std::array<bool, 4>& joined, bool paused) {
    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_TRUE);
    GX_LoadProjectionMtx(perspective, GX_PERSPECTIVE);
    GX_SetCurrentMtx(arenaMatrix);
    GX_CallDispList(const_cast<unsigned char*>(arenaOpaque), sizeof(arenaOpaque));
    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_FALSE);
    GX_CallDispList(const_cast<unsigned char*>(arenaTranslucent), sizeof(arenaTranslucent));
    fight.draw();

    beginOverlay();
    char text[32];
    const auto& frame = fight.frame;
    const int seconds = int(std::ceil(frame.time));
    std::snprintf(text, sizeof(text), "%d:%02d", seconds / 60, seconds % 60);
    label(290, 37, text, 4);
    if (paused) label(270, 120, "PAUSED", 4);
    else if (frame.finished) {
        if (fight.solo) std::snprintf(text, sizeof(text), "PRACTICE OVER");
        else if (frame.winner >= 0) std::snprintf(text, sizeof(text), "P%d WINS", int(frame.winner) + 1);
        else std::snprintf(text, sizeof(text), "DRAW");
        centerLabel(320, 120, text, 4);
        centerLabel(320, 153, "+ SELECT FIGHTERS", 3);
    } else if (frame.countdown > 0) {
        std::snprintf(text, sizeof(text), "%d", int(std::ceil(frame.countdown)));
        centerLabel(320, 120, text, 6);
    }
    for (int slot = 0; slot < 4; ++slot) {
        const float x = 49.0f + slot * 141.0f;
        const auto& player = frame.fighters[slot];
        const uint32_t color = joined[slot] ? web::playerColors[slot] : 0x6e7b8affu;
        rect(x, 425, 117, 24, 0x101622ddu);
        std::snprintf(text, sizeof(text), "P%d", slot + 1);
        label(x + 7, 432, text, 2, color);
        if (joined[slot] && player.visible) {
            guVector world{player.tagX, player.tagY, .5f};
            guVector view;
            guVecMultiply(camera, &world, &view);
            const float screenX = 320.0f + 320.0f * perspective[0][0] * view.x / -view.z;
            const float screenY = 240.0f - 240.0f * perspective[1][1] * view.y / -view.z;
            if (screenX > 25 && screenX < 615 && screenY > 25 && screenY < 410) {
                rect(screenX - 10, screenY - 2, 20, 14, 0x101622ddu);
                label(screenX - 7, screenY, text, 2, color);
                if (player.guarding) rect(screenX - 10, screenY + 12, 20 * player.shield, 3, color);
            }
        }
        if (!joined[slot]) continue;
        std::snprintf(text, sizeof(text), "%d%%", int(player.damage));
        label(x + 30, 432, text, 2);
        for (int stock = 0; stock < player.stocks; ++stock) rect(x + 77 + stock * 11, 433, 7, 7, color);
    }
    present();
}

struct Remote {
    bool connected = false, start = false, exit = false;
    Input input;
    bool confirm = false, cancel = false;
};

unsigned combatButtons(uint32_t buttons, uint32_t jumpMask, uint32_t lightMask, uint32_t specialMask,
    uint32_t guardMask, uint32_t heavyMask) {
    return ((buttons & jumpMask) ? jump : 0u) | ((buttons & lightMask) ? light : 0u) |
        ((buttons & specialMask) ? special : 0u) | ((buttons & guardMask) ? guard : 0u) |
        ((buttons & heavyMask) ? heavy : 0u);
}

float stickAxis(int position, int center, int minimum, int maximum) {
    const int delta = position - center;
    const int range = delta < 0 ? center - minimum : maximum - center;
    if (range <= 0) return 0;
    const float value = std::clamp(float(delta) / range, -1.0f, 1.0f);
    const float magnitude = std::max(0.0f, (std::abs(value) - .22f) / .78f);
    return std::copysign(magnitude, value);
}

Remote readRemote(int slot) {
    uint32_t extension;
    if (WPAD_Probe(slot, &extension) != WPAD_ERR_NONE) return {};
    const auto held = WPAD_ButtonsHeld(slot);
    const auto pressed = WPAD_ButtonsDown(slot);
    if (extension == WPAD_EXP_NUNCHUK) {
        expansion_t data{};
        WPAD_Expansion(slot, &data);
        float x = 0, y = 0;
        if (data.type == WPAD_EXP_NUNCHUK) {
            const auto& stick = data.nunchuk.js;
            x = stickAxis(stick.pos.x, stick.center.x, stick.min.x, stick.max.x);
            y = stickAxis(stick.pos.y, stick.center.y, stick.min.y, stick.max.y);
        }
        const auto map = [](uint32_t buttons) {
            return combatButtons(buttons, WPAD_NUNCHUK_BUTTON_C, WPAD_BUTTON_A, WPAD_BUTTON_B,
                WPAD_NUNCHUK_BUTTON_Z, WPAD_BUTTON_MINUS);
        };
        return {true, bool(pressed & WPAD_BUTTON_PLUS), bool(pressed & WPAD_BUTTON_HOME),
            {x, y, map(held), map(pressed)}, bool(pressed & WPAD_BUTTON_A), bool(pressed & WPAD_BUTTON_B)};
    }
    if (extension == WPAD_EXP_CLASSIC) {
        const auto map = [](uint32_t buttons) {
            return combatButtons(buttons, WPAD_CLASSIC_BUTTON_A, WPAD_CLASSIC_BUTTON_B, WPAD_CLASSIC_BUTTON_X,
                WPAD_CLASSIC_BUTTON_ZL | WPAD_CLASSIC_BUTTON_ZR, WPAD_CLASSIC_BUTTON_Y);
        };
        return {true, bool(pressed & (WPAD_CLASSIC_BUTTON_PLUS | WPAD_BUTTON_PLUS)),
            bool(pressed & (WPAD_CLASSIC_BUTTON_HOME | WPAD_BUTTON_HOME)),
            {float(bool(held & WPAD_CLASSIC_BUTTON_RIGHT)) - float(bool(held & WPAD_CLASSIC_BUTTON_LEFT)),
             float(bool(held & WPAD_CLASSIC_BUTTON_UP)) - float(bool(held & WPAD_CLASSIC_BUTTON_DOWN)), map(held), map(pressed)},
             bool(pressed & WPAD_CLASSIC_BUTTON_A), bool(pressed & WPAD_CLASSIC_BUTTON_B)};
    }
    const auto map = [](uint32_t buttons) {
        return combatButtons(buttons, WPAD_BUTTON_2, WPAD_BUTTON_1, WPAD_BUTTON_B, WPAD_BUTTON_A, WPAD_BUTTON_MINUS);
    };
    return {true, bool(pressed & WPAD_BUTTON_PLUS), bool(pressed & WPAD_BUTTON_HOME),
        {float(bool(held & WPAD_BUTTON_DOWN)) - float(bool(held & WPAD_BUTTON_UP)),
         float(bool(held & WPAD_BUTTON_RIGHT)) - float(bool(held & WPAD_BUTTON_LEFT)), map(held), map(pressed)},
         bool(pressed & WPAD_BUTTON_2), bool(pressed & WPAD_BUTTON_1)};
}
}

int main() {
    initVideo();
    WPAD_Init();
    Fight fight(modules, std::size(modules), geometry, std::size(geometry), clonePoses, std::size(clonePoses));
    Selection selection;
    std::array<bool, 4> joined{};
    std::array<Input, 4> inputs{};
    bool inMatch = false;
    bool error = false;
    float accumulator = 0;
    auto previous = gettime();
    while (SYS_MainLoop()) {
        const auto now = gettime();
        const float delta = std::min(.05f, float(ticks_to_microsecs(now - previous)) / 1000000);
        previous = now;
        bool start = false, paused = false;
        WPAD_ScanPads();
        for (int slot = 0; slot < 4; ++slot) {
            const auto remote = readRemote(slot);
            if (remote.exit) {
                WPAD_Shutdown();
                return 0;
            }
            start |= remote.start;
            if (!inMatch) {
                selection.update(slot, remote.connected, remote.input.x, remote.input.y,
                    remote.confirm, remote.cancel, delta);
                continue;
            }
            if (!joined[slot]) continue;
            paused |= !remote.connected;
            inputs[slot].x = remote.input.x;
            inputs[slot].y = remote.input.y;
            inputs[slot].held = remote.input.held;
            inputs[slot].pressed |= remote.input.pressed;
        }
        if (!inMatch && start && selection.canStart()) {
            joined = selection.connected;
            inputs = {};
            accumulator = 0;
            inMatch = fight.start(joined, selection.choices) && fight.advance(0, 0, inputs);
            error = !inMatch;
        } else if (inMatch && fight.frame.finished && start) {
            selection.ready.fill(false);
            inMatch = false;
        } else if (inMatch && !paused && !fight.frame.finished) {
            accumulator += delta;
            const auto steps = int(accumulator / web::step);
            if (steps) {
                inMatch = fight.advance(steps, steps * web::step, inputs);
                error = !inMatch;
                for (auto& input : inputs) input.pressed = 0;
                accumulator -= steps * web::step;
            }
        } else {
            inputs = {};
            accumulator = 0;
        }
        if (inMatch) renderMatch(fight, joined, paused && !fight.frame.finished);
        else renderSelection(selection, error);
    }
    WPAD_Shutdown();
    return 0;
}
