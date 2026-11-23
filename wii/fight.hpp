#pragma once

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <iterator>

struct FighterSpec { const char* name; uint32_t color; };
#include "web_rules.inc"

enum Button : unsigned { jump = 1, light = 2, special = 4, guard = 8, heavy = 16, dodge = 32 };

struct Input {
    float x = 0, y = 0;
    unsigned held = 0, pressed = 0;
};

struct FighterFrame {
    float damage, stocks, shield, visible, tagX, tagY, guarding;
};

struct MatchFrame {
    float time, countdown, finished, winner;
    std::array<FighterFrame, 4> fighters;
};

struct Geometry {
    const unsigned char* positions;
    const unsigned char* normals;
    const unsigned char* triangles;
    size_t positionCount, normalCount, triangleCount;
};
struct Pose { const unsigned char* commands; size_t bytes; };
struct ModuleSource { const char* name; const unsigned char* bytes; size_t length; };

class Fight {
public:
    Fight(const ModuleSource* modules, size_t moduleCount, const Geometry* geometry, size_t geometryCount,
        const Pose* clonePoses, size_t clonePoseCount);
    ~Fight();
    Fight(const Fight&) = delete;
    Fight& operator=(const Fight&) = delete;

    bool start(const std::array<bool, 4>& joined, const std::array<size_t, 4>& choices);
    bool advance(int steps, float dt, const std::array<Input, 4>& input);
    void draw() const;

    MatchFrame frame{};
    bool solo = false;

private:
    struct Engine;
    Engine* engine;
};
