#include <gccore.h>
#include <ogc/conf.h>
#include <ogc/lwp_watchdog.h>
#include <wiiuse/wpad.h>

#include <cstdio>

#include "fight.hpp"

namespace {
struct Vertex { float x, y, z; uint32_t color; };
#include "web_meshes.inc"

constexpr unsigned fifoSize = 256 * 1024;
alignas(32) unsigned char fifo[fifoSize];
GXRModeObj* mode;
void* framebuffers[2];
unsigned bufferIndex = 0;
Mtx camera;
Mtx44 perspective;
Mtx44 overlay;

// Keep the static arena and HUD transforms in separate GX matrix slots.
constexpr unsigned stageMatrix = GX_PNMTX0;
constexpr unsigned hudMatrix = GX_PNMTX1;
constexpr unsigned playerMatrices[] = {GX_PNMTX2, GX_PNMTX3, GX_PNMTX4, GX_PNMTX5};

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

    guVector eye{0, 9, 36}, up{0, 1, 0}, target{0, 2.4f, 0};
    guLookAt(camera, &eye, &up, &target);
    const float aspect = CONF_GetAspectRatio() == CONF_ASPECT_16_9 ? 16.0f / 9 : 4.0f / 3;
    guPerspective(perspective, 40, aspect, 1, 100);
    guOrtho(overlay, 0, 480, 0, 640, 0, 1);
    Mtx identity;
    guMtxIdentity(identity);
    GX_LoadPosMtxImm(camera, stageMatrix);
    GX_LoadPosMtxImm(identity, hudMatrix);
    GX_CopyDisp(framebuffers[bufferIndex], GX_TRUE);
    GX_DrawDone();
    VIDEO_SetNextFramebuffer(framebuffers[bufferIndex]);
    VIDEO_SetBlack(FALSE);
    VIDEO_Flush();
    VIDEO_WaitVSync();
    if (mode->viTVMode & VI_NON_INTERLACE) VIDEO_WaitVSync();
}

struct Mesh {
    const Vertex* vertices;
    uint16_t count;

    template<size_t size>
    constexpr Mesh(const Vertex (&data)[size]) : vertices(data), count(size) {
        static_assert(size < 65536);
    }
};

constexpr Mesh walk[] = {walk0, walk1, walk2, walk3, walk4, walk5};

void draw(Mesh mesh, unsigned matrix) {
    GX_SetCurrentMtx(matrix);
    GX_Begin(GX_TRIANGLES, GX_VTXFMT0, mesh.count);
    for (uint16_t vertex = 0; vertex < mesh.count; ++vertex) {
        const auto& point = mesh.vertices[vertex];
        GX_Position3f32(point.x, point.y, point.z);
        GX_Color1u32(point.color);
    }
    GX_End();
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
    case 'C': return "74447"; case 'E': return "74647"; case 'F': return "74644";
    case 'I': return "72227"; case 'J': return "11157"; case 'K': return "55655";
    case 'N': return "57555"; case 'O': return "75557"; case 'P': return "75744";
    case 'R': return "75655"; case 'S': return "74717"; case 'T': return "72222";
    case 'U': return "55557"; case 'W': return "55572"; case '+': return "02720";
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

void render(const Fight& fight, const std::array<bool, 4>& joined, bool inMatch, bool paused, float elapsed) {
    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_TRUE);
    GX_LoadProjectionMtx(perspective, GX_PERSPECTIVE);
    draw(stage, stageMatrix);
    for (int slot = 0; slot < 4; ++slot) {
        const auto& player = fight.players[slot];
        if (!joined[slot] || (inMatch && (!player.stocks || player.respawn > 0))) continue;
        if (inMatch && player.invulnerable > 0 && int(elapsed * 16) % 2) continue;
        const auto& spawn = web::spawns[slot];
        const Mesh pose = player.attackAge >= 0 ? Mesh(punch) :
            inMatch && player.ground < 0 ? Mesh(air) :
            std::abs(player.vx) > .2f ? walk[int(elapsed * 14) % std::size(walk)] : Mesh(idle);
        Mtx model, view;
        guMtxScale(model, inMatch ? player.facing : spawn.facing, 1, 1);
        model[0][3] = inMatch ? player.x : spawn.x;
        model[1][3] = inMatch ? player.y : spawn.y;
        guMtxConcat(camera, model, view);
        GX_LoadPosMtxImm(view, playerMatrices[slot]);
        draw(pose, playerMatrices[slot]);
    }

    GX_LoadProjectionMtx(overlay, GX_ORTHOGRAPHIC);
    GX_SetCurrentMtx(hudMatrix);
    GX_SetZMode(GX_FALSE, GX_ALWAYS, GX_FALSE);
    char text[32];
    if (!inMatch) {
        label(230, 42, "RIFT RUCKUS", 4);
        label(236, 390, "2 JOIN  + START", 3);
    } else {
        const int seconds = int(std::ceil(fight.time));
        std::snprintf(text, sizeof(text), "%d:%02d", seconds / 60, seconds % 60);
        label(290, 37, text, 4);
        if (paused) label(270, 120, "PAUSED", 4);
        else if (fight.finished) {
            if (fight.winner >= 0) std::snprintf(text, sizeof(text), "P%d WINS", fight.winner + 1);
            else std::snprintf(text, sizeof(text), "DRAW");
            label(260, 120, text, 4);
            label(266, 153, "+ START", 3);
        } else if (fight.countdown > 0) {
            std::snprintf(text, sizeof(text), "%d", int(std::ceil(fight.countdown)));
            label(310, 120, text, 6);
        }
    }
    for (int slot = 0; slot < 4; ++slot) {
        const float x = 49.0f + slot * 141.0f;
        const auto& player = fight.players[slot];
        const uint32_t color = joined[slot] ? web::spawns[slot].color : 0x6e7b8affu;
        rect(x, 425, 117, 24, 0x101622ddu);
        std::snprintf(text, sizeof(text), "P%d", slot + 1);
        label(x + 7, 432, text, 2, color);
        if (joined[slot] && (!inMatch || (player.stocks && player.respawn <= 0))) {
            const auto& spawn = web::spawns[slot];
            guVector world{inMatch ? player.x : spawn.x, (inMatch ? player.y : spawn.y) + 3.5f, 0};
            guVector view;
            guVecMultiply(camera, &world, &view);
            const float screenX = 320.0f + 320.0f * perspective[0][0] * view.x / -view.z;
            const float screenY = 240.0f - 240.0f * perspective[1][1] * view.y / -view.z;
            if (screenX > 25 && screenX < 615 && screenY > 25 && screenY < 410) {
                rect(screenX - 10, screenY - 2, 20, 14, 0x101622ddu);
                label(screenX - 7, screenY, text, 2, color);
            }
        }
        if (!inMatch || !joined[slot]) continue;
        std::snprintf(text, sizeof(text), "%d%%", int(player.damage));
        label(x + 30, 432, text, 2);
        for (int stock = 0; stock < player.stocks; ++stock) rect(x + 77 + stock * 11, 433, 7, 7, color);
    }
    bufferIndex ^= 1;
    GX_SetZMode(GX_TRUE, GX_LEQUAL, GX_TRUE);
    GX_CopyDisp(framebuffers[bufferIndex], GX_TRUE);
    GX_DrawDone();
    VIDEO_SetNextFramebuffer(framebuffers[bufferIndex]);
    VIDEO_Flush();
    VIDEO_WaitVSync();
}

struct Remote {
    bool connected = false, start = false, exit = false;
    Input input;
};

Remote readRemote(int slot) {
    uint32_t extension;
    if (WPAD_Probe(slot, &extension) != WPAD_ERR_NONE) return {};
    const auto held = WPAD_ButtonsHeld(slot);
    const auto pressed = WPAD_ButtonsDown(slot);
    if (extension == WPAD_EXP_CLASSIC) {
        return {true, bool(pressed & (WPAD_CLASSIC_BUTTON_PLUS | WPAD_BUTTON_PLUS)),
            bool(pressed & (WPAD_CLASSIC_BUTTON_HOME | WPAD_BUTTON_HOME)),
            {int(bool(held & WPAD_CLASSIC_BUTTON_RIGHT)) - int(bool(held & WPAD_CLASSIC_BUTTON_LEFT)),
             bool(pressed & WPAD_CLASSIC_BUTTON_A), bool(pressed & WPAD_CLASSIC_BUTTON_B)}};
    }
    return {true, bool(pressed & WPAD_BUTTON_PLUS), bool(pressed & WPAD_BUTTON_HOME),
        {int(bool(held & WPAD_BUTTON_DOWN)) - int(bool(held & WPAD_BUTTON_UP)),
         bool(pressed & WPAD_BUTTON_2), bool(pressed & WPAD_BUTTON_1)}};
}
}

int main() {
    initVideo();
    WPAD_Init();
    Fight fight;
    std::array<bool, 4> joined{};
    std::array<Input, 4> inputs{};
    bool inMatch = false;
    float accumulator = 0;
    float elapsed = 0;
    auto previous = gettime();
    while (SYS_MainLoop()) {
        const auto now = gettime();
        const float delta = std::min(.05f, float(ticks_to_microsecs(now - previous)) / 1000000);
        previous = now;
        elapsed += delta;
        bool start = false, paused = false;
        WPAD_ScanPads();
        for (int slot = 0; slot < 4; ++slot) {
            const auto remote = readRemote(slot);
            if (remote.exit) {
                WPAD_Shutdown();
                return 0;
            }
            if (!inMatch || fight.finished) {
                if (!remote.connected) joined[slot] = false;
                if (remote.input.jump) joined[slot] = true;
            }
            if (!joined[slot]) continue;
            paused |= !remote.connected;
            start |= remote.start;
            inputs[slot].x = remote.input.x;
            inputs[slot].jump |= remote.input.jump;
            inputs[slot].punch |= remote.input.punch;
        }
        if (start && (!inMatch || fight.finished) && std::count(joined.begin(), joined.end(), true) >= 2) {
            fight.start(joined);
            inMatch = true;
            inputs = {};
            accumulator = 0;
        } else if (inMatch && !paused && !fight.finished) {
            accumulator += delta;
            while (accumulator >= web::step) {
                fight.tick(inputs);
                for (auto& input : inputs) input.jump = input.punch = false;
                accumulator -= web::step;
            }
        } else {
            inputs = {};
            accumulator = 0;
        }
        render(fight, joined, inMatch, paused, elapsed);
    }
    WPAD_Shutdown();
    return 0;
}
