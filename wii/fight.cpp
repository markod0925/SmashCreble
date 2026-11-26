#include "fight.hpp"

#include <gccore.h>
#include <quickjs.h>

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <malloc.h>
#include <vector>

struct Fight::Engine {
    struct Batch { size_t offset; bool opaque; };
    const ModuleSource* modules;
    size_t moduleCount;
    const Geometry* geometry;
    size_t geometryCount;
    const Pose* clonePoses;
    size_t clonePoseCount;
    std::array<float, 3> cameraDirection{};
    JSRuntime* runtime = nullptr;
    JSContext* context = nullptr;
    JSValue initialize = JS_UNDEFINED, start = JS_UNDEFINED, advance = JS_UNDEFINED;
    bool ready = false;
    std::array<float, 16> controls{};
    std::array<float, 16> matrix{};
    std::vector<Batch> batches;
    std::vector<uint32_t> colors;
    std::vector<std::array<float, 3>> points;
    unsigned char* commands = nullptr;
    size_t used = 0, capacity = 0;

    Engine(const ModuleSource* sources, size_t count, const Geometry* shapes, size_t shapeCount,
        const Pose* poses, size_t poseCount)
        : modules(sources), moduleCount(count), geometry(shapes), geometryCount(shapeCount),
          clonePoses(poses), clonePoseCount(poseCount) {}

    ~Engine() {
        if (context) {
            JS_FreeValue(context, initialize);
            JS_FreeValue(context, start);
            JS_FreeValue(context, advance);
            JS_FreeContext(context);
        }
        if (runtime) JS_FreeRuntime(runtime);
        std::free(commands);
    }

    static JSModuleDef* load(JSContext* ctx, const char* name, void* opaque) {
        const auto& engine = *static_cast<Engine*>(opaque);
        for (size_t i = 0; i < engine.moduleCount; ++i) {
            const auto& module = engine.modules[i];
            if (std::strcmp(module.name, name)) continue;
            JSValue compiled = JS_Eval(ctx, reinterpret_cast<const char*>(module.bytes), module.length,
                module.name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
            if (JS_IsException(compiled)) return nullptr;
            auto* result = static_cast<JSModuleDef*>(JS_VALUE_GET_PTR(compiled));
            JS_FreeValue(ctx, compiled);
            return result;
        }
        JS_ThrowReferenceError(ctx, "Unknown Wii module: %s", name);
        return nullptr;
    }

    bool check(JSValue value) const {
        const bool rejected = JS_PromiseState(context, value) == JS_PROMISE_REJECTED;
        const bool failed = rejected || JS_IsException(value);
        const auto exception = rejected ? JS_PromiseResult(context, value) :
            failed ? JS_GetException(context) : JS_UNDEFINED;
        JS_FreeValue(context, value);
        if (!failed) return true;
        const char* message = JS_ToCString(context, exception);
        if (message) {
            std::fprintf(stderr, "Smash Creble Wii: %s\n", message);
            JS_FreeCString(context, message);
        }
        JS_FreeValue(context, exception);
        return false;
    }

    bool reserve(size_t needed) {
        if (needed <= capacity) return true;
        const size_t size = std::max(needed, capacity ? capacity * 2 : size_t(512 * 1024));
        auto* next = static_cast<unsigned char*>(memalign(32, size));
        if (!next) return false;
        if (used) std::memcpy(next, commands, used);
        std::free(commands);
        commands = next;
        capacity = size;
        return true;
    }

    bool beginMesh(size_t bytes, bool opaque) {
        if (!reserve(used + bytes + 64)) return false;
        if (batches.empty() || batches.back().opaque != opaque) {
            align();
            batches.push_back({used, opaque});
        }
        return true;
    }

    static JSValue drawClone(JSContext* context, JSValueConst, int argc, JSValueConst* args) {
        auto& engine = *static_cast<Engine*>(JS_GetContextOpaque(context));
        uint32_t index;
        double x, y, z;
        if (argc != 4) return JS_ThrowTypeError(context, "Expected a clone pose and its position");
        if (JS_ToUint32(context, &index, args[0]) || JS_ToFloat64(context, &x, args[1]) ||
            JS_ToFloat64(context, &y, args[2]) || JS_ToFloat64(context, &z, args[3])) return JS_EXCEPTION;
        if (index >= engine.clonePoseCount) return JS_ThrowRangeError(context, "Unknown Wii clone pose");
        const auto& pose = engine.clonePoses[index];
        const auto* input = pose.commands;
        const size_t vertexCount = unsigned(input[1]) * 256 + input[2];
        const size_t bytes = 3 + vertexCount * 16;
        if (bytes > pose.bytes || !engine.beginMesh(bytes, true)) return JS_ThrowOutOfMemory(context);
        auto* output = engine.commands + engine.used;
        std::memcpy(output, input, 3);
        const float offset[]{float(x), float(y), float(z)};
        for (size_t i = 3; i < bytes; i += 16) {
            float point[3];
            std::memcpy(point, input + i, sizeof(point));
            for (int row = 0; row < 3; ++row) point[row] += offset[row];
            std::memcpy(output + i, point, sizeof(point));
            std::memcpy(output + i + sizeof(point), input + i + sizeof(point), sizeof(uint32_t));
        }
        engine.used += bytes;
        return JS_UNDEFINED;
    }

    static JSValue newMatrix(JSContext* context, const float (&values)[16]) {
        const auto* bytes = reinterpret_cast<const uint8_t*>(values);
        JSValue buffer = JS_NewArrayBufferCopy(context, bytes, sizeof(values));
        if (JS_IsException(buffer)) return buffer;
        // QuickJS reads the optional offset and length slots even when they are undefined.
        JSValue args[] = {buffer, JS_UNDEFINED, JS_UNDEFINED};
        const auto result = JS_NewTypedArray(context, std::size(args), args, JS_TYPED_ARRAY_FLOAT32);
        JS_FreeValue(context, buffer);
        return result;
    }

    static bool readMatrix(JSContext* context, JSValueConst value, float (&result)[16]) {
        size_t offset, length, stride, size;
        const auto buffer = JS_GetTypedArrayBuffer(context, value, &offset, &length, &stride);
        if (JS_IsException(buffer)) return false;
        const auto* bytes = JS_GetArrayBuffer(context, &size, buffer);
        const bool valid = bytes && length == sizeof(result) && stride == sizeof(float) &&
            offset <= size && length <= size - offset;
        if (valid) std::memcpy(result, bytes + offset, sizeof(result));
        JS_FreeValue(context, buffer);
        if (!valid && bytes) JS_ThrowTypeError(context, "Expected a 4x4 matrix");
        return valid;
    }

    static JSValue multiply(JSContext* context, JSValueConst, int argc, JSValueConst* args) {
        float a[16], b[16], result[16];
        if (argc != 2) return JS_ThrowTypeError(context, "Expected two matrices");
        if (!readMatrix(context, args[0], a) || !readMatrix(context, args[1], b)) return JS_EXCEPTION;
        for (int col = 0; col < 16; col += 4) {
            for (int row = 0; row < 4; ++row) {
                result[col + row] = a[row] * b[col] + a[4 + row] * b[col + 1] +
                    a[8 + row] * b[col + 2] + a[12 + row] * b[col + 3];
            }
        }
        return newMatrix(context, result);
    }

    static JSValue transform(JSContext* context, JSValueConst, int argc, JSValueConst* args) {
        if (argc != 9) return JS_ThrowTypeError(context, "Expected position, scale and Euler angles");
        float values[9];
        for (int i = 0; i < argc; ++i) {
            double value;
            if (JS_ToFloat64(context, &value, args[i])) return JS_EXCEPTION;
            values[i] = float(value);
        }
        const auto [x, y, z, sx, sy, sz, rx, ry, rz] = values;
        const float a = rx ? std::cos(rx) : 1, b = ry ? std::cos(ry) : 1, c = rz ? std::cos(rz) : 1;
        const float d = rx ? std::sin(rx) : 0, e = ry ? std::sin(ry) : 0, f = rz ? std::sin(rz) : 0;
        const float matrix[] = {
            b * c * sx, b * f * sx, -e * sx, 0,
            (d * e * c - a * f) * sy, (d * e * f + a * c) * sy, d * b * sy, 0,
            (a * e * c + d * f) * sz, (a * e * f - d * c) * sz, a * b * sz, 0,
            x, y, z, 1,
        };
        return newMatrix(context, matrix);
    }

    static JSValue mesh(JSContext* ctx, JSValueConst, int argc, JSValueConst* argv) {
        auto& engine = *static_cast<Engine*>(JS_GetContextOpaque(ctx));
        if (argc != 6) return JS_ThrowTypeError(ctx, "Expected Wii mesh parameters");
        uint32_t shapeIndex, rgb;
        double glow, alpha, zombie;
        if (JS_ToUint32(ctx, &shapeIndex, argv[0]) || JS_ToUint32(ctx, &rgb, argv[1]) ||
            JS_ToFloat64(ctx, &glow, argv[2]) || JS_ToFloat64(ctx, &alpha, argv[3]) ||
            JS_ToFloat64(ctx, &zombie, argv[4])) return JS_EXCEPTION;
        const auto& matrix = engine.matrix;
        if (shapeIndex >= web::shapeCount) return JS_ThrowReferenceError(ctx, "Unknown Wii mesh");
        if (JS_ToBool(ctx, argv[5])) {
            float best = -1;
            unsigned view = 0;
            for (unsigned axis = 0; axis < 3; ++axis) {
                const float* column = matrix.data() + axis * 4;
                float dot = 0, magnitude = 0;
                for (unsigned i = 0; i < 3; ++i) {
                    dot += column[i] * engine.cameraDirection[i];
                    magnitude += column[i] * column[i];
                }
                const float score = magnitude > 0 ? dot * dot / magnitude : -1;
                if (score > best) {
                    best = score;
                    view = axis * 2 + unsigned(dot >= 0);
                }
            }
            shapeIndex = web::shapeCount + shapeIndex * 6 + view;
        }
        if (shapeIndex >= engine.geometryCount) return JS_ThrowReferenceError(ctx, "Missing Wii mesh view");
        const auto* shape = engine.geometry + shapeIndex;
        const unsigned opacity = unsigned(std::clamp(alpha, 0.0, 1.0) * 255 + .5);
        if (!opacity) return JS_UNDEFINED;
        const bool opaque = alpha >= 1;
        constexpr size_t vertexBytes = 16;
        const size_t vertexCount = shape->triangleCount * 3;
        if (!engine.beginMesh(3 + vertexCount * vertexBytes, opaque)) return JS_ThrowOutOfMemory(ctx);
        auto* output = engine.commands + engine.used;
        *output++ = GX_TRIANGLES | GX_VTXFMT0;
        *output++ = vertexCount >> 8;
        *output++ = vertexCount & 255;
        engine.used += 3 + vertexCount * vertexBytes;

        engine.points.resize(shape->positionCount);
        for (size_t i = 0; i < shape->positionCount; ++i) {
            float point[3];
            std::memcpy(point, shape->positions + i * sizeof(point), sizeof(point));
            for (unsigned row = 0; row < 3; ++row) {
                engine.points[i][row] = matrix[row] * point[0] + matrix[4 + row] * point[1] +
                    matrix[8 + row] * point[2] + matrix[12 + row];
            }
        }
        // Transform each distinct position and light each distinct normal once per mesh.
        float basis[9];
        for (int col = 0; col < 3; ++col) {
            const float* axis = matrix.data() + col * 4;
            const float magnitude = axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2];
            const float inverse = magnitude > 0 ? 1 / magnitude : 0;
            for (int row = 0; row < 3; ++row) basis[col * 3 + row] = axis[row] * inverse;
        }
        const float red = float(rgb >> 16 & 255);
        const float green = float(rgb >> 8 & 255);
        const float blue = float(rgb & 255);
        const float glowAmount = float(glow), zombieAmount = float(zombie);
        const auto colorByte = [](float value) { return static_cast<uint32_t>(std::clamp(value, 0.0f, 255.0f) + .5f); };
        engine.colors.resize(shape->normalCount);
        for (size_t i = 0; i < shape->normalCount; ++i) {
            float normal[3];
            std::memcpy(normal, shape->normals + i * sizeof(normal), sizeof(normal));
            float n[3];
            for (int row = 0; row < 3; ++row) {
                n[row] = basis[row] * normal[0] + basis[row + 3] * normal[1] + basis[row + 6] * normal[2];
            }
            const float length = std::sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
            const float inverse = length > 0 ? 1 / length : 0;
            const float sun = std::max(0.0f, (-.42f * n[0] + .79f * n[1] + .47f * n[2]) *
                (inverse / std::sqrt(.42f * .42f + .79f * .79f + .47f * .47f)));
            const float rim = std::max(0.0f, (.83f * n[0] + .31f * n[1] - .56f * n[2]) *
                (inverse / std::sqrt(.83f * .83f + .31f * .31f + .56f * .56f)));
            const float shade = (.50f + sun * .53f + rim * .19f) * (1 - glowAmount) + glowAmount;
            const float rimTint = 255 * rim * (1 - glowAmount);
            const float r = red * shade + .12f * rimTint;
            const float g = green * shade + .062f * rimTint;
            const float b = blue * shade + .047f * rimTint;
            const float brightness = .299f * r + .587f * g + .114f * b;
            engine.colors[i] = (colorByte(r + zombieAmount * (25.5f + .69f * brightness - r)) << 24) |
                (colorByte(g + zombieAmount * (53.55f + 1.06f * brightness - g)) << 16) |
                (colorByte(b + zombieAmount * (18.36f + .46f * brightness - b)) << 8) | opacity;
        }
        const auto* triangle = shape->triangles;
        for (size_t i = 0; i < shape->triangleCount; ++i, triangle += 8) {
            const auto rgba = engine.colors[unsigned(triangle[0]) * 256 + triangle[1]];
            const auto* index = triangle + 2;
            for (int vertex = 0; vertex < 3; ++vertex, index += 2, output += vertexBytes) {
                const auto& point = engine.points[unsigned(index[0]) * 256 + index[1]];
                std::memcpy(output, point.data(), sizeof(float) * point.size());
                std::memcpy(output + 12, &rgba, sizeof(rgba));
            }
        }
        return JS_UNDEFINED;
    }

    void align() {
        const size_t aligned = (used + 31) & ~size_t(31);
        if (aligned != used) std::memset(commands + used, 0, aligned - used);
        used = aligned;
    }

    bool init(MatchFrame& frame) {
        runtime = JS_NewRuntime();
        if (!runtime) return false;
        context = JS_NewContext(runtime);
        if (!context) return false;
        JS_SetContextOpaque(context, this);
        JS_SetModuleLoaderFunc(runtime, nullptr, load, this);
        JSValue global = JS_GetGlobalObject(context);
        JS_SetPropertyStr(context, global, "wiiMesh", JS_NewCFunction(context, mesh, "wiiMesh", 6));
        JS_SetPropertyStr(context, global, "wiiDrawClone", JS_NewCFunction(context, drawClone, "wiiDrawClone", 4));
        JS_SetPropertyStr(context, global, "wiiMultiply", JS_NewCFunction(context, multiply, "wiiMultiply", 2));
        JS_SetPropertyStr(context, global, "wiiTransform", JS_NewCFunction(context, transform, "wiiTransform", 9));
        const auto& root = modules[0];
        if (!check(JS_Eval(context, reinterpret_cast<const char*>(root.bytes), root.length,
                root.name, JS_EVAL_TYPE_MODULE))) {
            JS_FreeValue(context, global);
            return false;
        }
        initialize = JS_GetPropertyStr(context, global, "wiiInit");
        start = JS_GetPropertyStr(context, global, "wiiStart");
        advance = JS_GetPropertyStr(context, global, "wiiAdvance");
        JS_FreeValue(context, global);
        JSValue args[] = {
            JS_NewArrayBuffer(context, reinterpret_cast<uint8_t*>(controls.data()), sizeof(controls), nullptr, nullptr, false),
            JS_NewArrayBuffer(context, reinterpret_cast<uint8_t*>(&frame), sizeof(frame), nullptr, nullptr, false),
            JS_NewArrayBuffer(context, reinterpret_cast<uint8_t*>(matrix.data()), sizeof(matrix), nullptr, nullptr, false),
        };
        ready = check(JS_Call(context, initialize, JS_UNDEFINED, std::size(args), args));
        for (const auto arg : args) JS_FreeValue(context, arg);
        return ready;
    }
};

static_assert(offsetof(MatchFrame, mobDefeated) == sizeof(float) * 32);
static_assert(sizeof(MatchFrame) == sizeof(float) * 34);

Fight::Fight(const ModuleSource* modules, size_t moduleCount, const Geometry* geometry, size_t geometryCount,
    const Pose* clonePoses, size_t clonePoseCount)
    : engine(new Engine(modules, moduleCount, geometry, geometryCount, clonePoses, clonePoseCount)) {
    engine->init(frame);
}

Fight::~Fight() { delete engine; }

bool Fight::start(size_t arena, int koTarget, const std::array<bool, 4>& humans,
    const std::array<size_t, 4>& choices, const std::array<float, 3>& cameraDirection) {
    if (!engine->ready) return false;
    engine->cameraDirection = cameraDirection;
    auto* context = engine->context;
    JSValue args[] = {JS_NewUint32(context, arena), JS_NewInt32(context, koTarget),
        JS_UNDEFINED, JS_UNDEFINED, JS_UNDEFINED, JS_UNDEFINED};
    for (int slot = 0; slot < 4; ++slot) {
        args[2 + slot] = JS_NewInt32(context, humans[slot] ? int(choices[slot]) : -1);
    }
    return engine->check(JS_Call(context, engine->start, JS_UNDEFINED, std::size(args), args));
}

bool Fight::advance(int steps, float dt, const std::array<Input, 4>& input) {
    auto& vm = *engine;
    vm.batches.clear();
    vm.used = 0;
    for (int slot = 0; slot < 4; ++slot) {
        const auto& state = input[slot];
        vm.controls[slot * 4] = state.x;
        vm.controls[slot * 4 + 1] = state.y;
        vm.controls[slot * 4 + 2] = float(state.held);
        vm.controls[slot * 4 + 3] = float(state.pressed);
    }
    JSValue args[] = {JS_NewInt32(vm.context, steps), JS_NewFloat64(vm.context, dt)};
    const bool ok = vm.check(JS_Call(vm.context, vm.advance, JS_UNDEFINED, 2, args));
    if (ok) vm.align();
    else vm.batches.clear();
    return ok;
}

void Fight::draw() const {
    const auto& vm = *engine;
    if (!vm.used || vm.batches.empty()) return;
    DCFlushRange(vm.commands, vm.used);
    GX_SetZMode(GX_TRUE, GX_LEQUAL, vm.batches.front().opaque);
    for (size_t i = 0; i < vm.batches.size(); ++i) {
        const auto& batch = vm.batches[i];
        const size_t end = i + 1 < vm.batches.size() ? vm.batches[i + 1].offset : vm.used;
        if (i && batch.opaque != vm.batches[i - 1].opaque) GX_SetZMode(GX_TRUE, GX_LEQUAL, batch.opaque);
        GX_CallDispList(vm.commands + batch.offset, end - batch.offset);
    }
}
