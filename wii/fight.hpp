#pragma once

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <iterator>

struct Platform { float left, right, y; };
struct Spawn { float x, y, facing; int platform; uint32_t color; };
struct Attack { float duration, from, until, range, height, damage, force, x, y, lift; };

#include "web_rules.inc"

struct Input {
    int x = 0;
    bool jump = false;
    bool punch = false;
};

struct Player {
    float x = 0, y = 0, vx = 0, vy = 0, facing = 1;
    float damage = 0, stun = 0, invulnerable = 0, respawn = 0, attackAge = -1;
    int stocks = 0, jumps = 0, ground = -1;
    unsigned victims = 0;
};

struct Fight {
    std::array<Player, 4> players{};
    float time = web::matchTime;
    float countdown = web::countdown;
    bool finished = false;
    int winner = -1;

    void place(int slot, bool initial) {
        const auto& point = web::spawns[slot];
        const int stocks = players[slot].stocks;
        players[slot] = Player{};
        auto& player = players[slot];
        player.stocks = stocks;
        player.x = point.x;
        player.y = point.y + (initial ? 0 : web::respawnHeight);
        player.facing = point.facing;
        player.jumps = web::jumps;
        player.ground = initial ? point.platform : -1;
        player.invulnerable = initial ? 0 : 1.5f;
    }

    void start(const std::array<bool, 4>& joined) {
        *this = Fight{};
        for (int slot = 0; slot < 4; ++slot) {
            players[slot].stocks = joined[slot] ? web::stocks : 0;
            place(slot, true);
        }
    }

    void move(int slot, const Input& input) {
        auto& player = players[slot];
        if (!player.stocks) return;
        const auto dt = web::step;
        if (player.respawn > 0) {
            player.respawn -= dt;
            if (player.respawn <= 0) place(slot, false);
            return;
        }
        player.invulnerable = std::max(0.0f, player.invulnerable - dt);
        player.stun = std::max(0.0f, player.stun - dt);
        if (player.stun == 0) {
            if (player.attackAge < 0 && input.x) player.facing = float(input.x);
            if (input.jump && player.jumps > 0) {
                --player.jumps;
                player.vy = web::jump * (player.ground >= 0 ? 1.0f : .88f);
                player.ground = -1;
            }
            if (input.punch && player.attackAge < 0) {
                player.attackAge = 0;
                player.victims = 0;
            }
            const float target = input.x * web::speed * (player.attackAge < 0 ? 1.0f : .54f);
            const float change = dt * (player.ground >= 0 ? 65.0f : 32.0f);
            player.vx += std::clamp(target - player.vx, -change, change);
        } else {
            player.vx *= std::pow(.51f, dt);
        }

        player.x += player.vx * dt;
        if (player.ground >= 0) {
            const auto& floor = web::platforms[player.ground];
            if (player.x < floor.left || player.x > floor.right) {
                player.ground = -1;
                player.jumps = std::min(player.jumps, 1);
            }
        }
        if (player.ground < 0) {
            const float oldY = player.y;
            player.vy = std::max(-25.0f, player.vy - dt * web::gravity);
            player.y += player.vy * dt;
            for (unsigned index = 0; index < std::size(web::platforms); ++index) {
                const auto& floor = web::platforms[index];
                if (oldY >= floor.y && player.y <= floor.y && player.vy <= 0 &&
                    player.x >= floor.left && player.x <= floor.right) {
                    player.ground = int(index);
                    player.y = floor.y;
                    player.vy = 0;
                    player.jumps = web::jumps;
                }
            }
        }
        if (std::abs(player.x) > web::bounds[0] || player.y > web::bounds[1] || player.y < web::bounds[2]) {
            --player.stocks;
            player.attackAge = -1;
            player.respawn = .87f;
        }
    }

    void attack(int slot) {
        auto& player = players[slot];
        if (!player.stocks || player.attackAge < 0) return;
        player.attackAge += web::step;
        if (player.attackAge >= web::light.duration) {
            player.attackAge = -1;
            return;
        }
        if (player.attackAge < web::light.from || player.attackAge > web::light.until) return;
        for (int index = 0; index < 4; ++index) {
            auto& target = players[index];
            if (index == slot || !target.stocks || target.respawn > 0 || target.invulnerable > 0 ||
                (player.victims & (1u << index))) continue;
            const auto dx = target.x - player.x;
            if (std::abs(dx) > web::light.range || dx * player.facing < -.23f ||
                std::abs(target.y - player.y) > web::light.height) continue;
            player.victims |= 1u << index;
            target.damage += web::light.damage;
            const auto launch = web::light.force + target.damage * .145f;
            target.vx = player.facing * web::light.x * launch;
            target.vy = web::light.y * launch + web::light.lift;
            target.stun = std::clamp(launch * .024f, .15f, .79f);
            target.invulnerable = .12f;
            target.ground = -1;
            target.attackAge = -1;
        }
    }

    void tick(const std::array<Input, 4>& input) {
        if (finished) return;
        if (countdown > 0) {
            countdown = std::max(0.0f, countdown - web::step);
            return;
        }
        time = std::max(0.0f, time - web::step);
        int alive = 0;
        for (int slot = 0; slot < 4; ++slot) {
            move(slot, input[slot]);
            if (players[slot].stocks) ++alive;
        }
        for (int slot = 0; slot < 4; ++slot) attack(slot);
        if (alive > 1 && time > 0) return;
        finished = true;
        int best = -1;
        for (int slot = 0; slot < 4; ++slot) {
            const auto& player = players[slot];
            if (!player.stocks) continue;
            if (best < 0 || player.stocks > players[best].stocks ||
                (player.stocks == players[best].stocks && player.damage < players[best].damage)) {
                best = winner = slot;
            } else if (player.stocks == players[best].stocks && player.damage == players[best].damage) {
                winner = -1;
            }
        }
    }
};
