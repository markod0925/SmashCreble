#pragma once

#include "fight.hpp"

struct Selection {
    static constexpr int columns = 6;
    static constexpr int count = int(std::size(web::roster));
    std::array<size_t, 4> choices = {0, 1 % count, 2 % count, 3 % count};
    std::array<bool, 4> connected{}, ready{};
    std::array<int, 4> direction{};
    std::array<float, 4> repeat{};

    bool canStart() const {
        return std::any_of(ready.begin(), ready.end(), [](bool confirmed) { return confirmed; });
    }

    void update(int slot, bool attached, float x, float y, bool confirm, bool cancel, float dt) {
        connected[slot] = attached;
        if (!attached || cancel) ready[slot] = false;
        if (!attached || ready[slot]) {
            direction[slot] = 0;
            return;
        }
        const bool horizontal = std::abs(x) >= std::abs(y);
        const float axis = horizontal ? x : y;
        const int move = std::abs(axis) < .55f ? 0 : (axis > 0 ? 1 : -1) * (horizontal ? 1 : -columns);
        repeat[slot] -= dt;
        if (move && (move != direction[slot] || repeat[slot] <= 0)) {
            const int index = int(choices[slot]);
            const int row = index / columns;
            const int column = index % columns;
            if (horizontal) {
                const int rowSize = std::min(columns, count - row * columns);
                choices[slot] = row * columns + (column + move + rowSize) % rowSize;
            } else {
                const int rows = (count + columns - 1) / columns;
                const int nextRow = (row + move / columns + rows) % rows;
                choices[slot] = std::min(count - 1, nextRow * columns + column);
            }
            repeat[slot] = move == direction[slot] ? .13f : .33f;
        }
        direction[slot] = move;
        if (confirm) ready[slot] = true;
    }
};
