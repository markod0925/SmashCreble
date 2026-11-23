import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { arenas } from '../src/arenas/index.js';
import { rules } from '../src/combat/arena.js';
import { handleAttackInput } from '../src/combat/attacks.js';
import { createMatch } from '../src/combat/state.js';
import { draw } from '../src/fighters/rivet/model.js';
import { fighter } from '../src/fighters/rivet/profile.js';
import { playerColors } from '../src/player-colors.js';
import { drawBattleArena } from '../src/render/arena.js';
import { shapes } from '../src/render/geometry.js';
import { multiply, transform } from '../src/render/math.js';

function number(value) {
  if (!Number.isFinite(value)) throw new Error(`Invalid Wii export number: ${value}`);
  return `${value.toExponential(8)}f`;
}

const values = (items) => items.map(number).join(', ');
const color = (hex) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid Wii export color: ${hex}`);
  return `0x${hex.slice(1)}ffu`;
};

function capture(drawScene) {
  const vertices = [];
  const renderer = {
    mesh(shape, matrix, hex, glow = 0, alpha = 1) {
      const rgb = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
      const mesh = shapes[shape];
      if (!mesh || mesh.length % 18) throw new Error(`Invalid Wii mesh: ${shape}`);
      for (let vertex = 0; vertex < mesh.length; vertex += 6) {
        const [x, y, z, nx, ny, nz] = mesh.slice(vertex, vertex + 6);
        const position = [0, 1, 2].map((row) =>
          x * matrix[row] + y * matrix[4 + row] + z * matrix[8 + row] + matrix[12 + row]);
        const normal = [0, 1, 2].map((row) => [nx, ny, nz].reduce((sum, component, axis) => {
          const column = matrix.slice(axis * 4, axis * 4 + 3);
          return sum + component * column[row] / (Math.hypot(...column) ** 2);
        }, 0));
        const sun = Math.max(0, (normal[0] * -.42 + normal[1] * .79 + normal[2] * .47) /
          Math.hypot(...normal) / Math.hypot(.42, .79, .47));
        const shade = (.50 + sun * .53) * (1 - glow) + glow;
        const rgba = [...rgb.map((channel) => Math.min(255, Math.round(channel * shade))), Math.round(alpha * 255)]
          .map((byte) => byte.toString(16).padStart(2, '0')).join('');
        vertices.push(`  {${values(position)}, 0x${rgba}u},`);
      }
    },
    object(shape, position, size, hex, rotation = [0, 0, 0], glow = 0, alpha = 1) {
      this.mesh(shape, transform(position, size, rotation), hex, glow, alpha);
    },
    parts(parts, root, flash) {
      for (const part of parts) this.mesh(part.shape, multiply(root, part.matrix), flash ? '#ffffff' : part.color, part.glow);
    },
  };
  drawScene(renderer);
  if (!vertices.length) throw new Error('Empty Wii mesh.');
  return vertices.join('\n');
}

export async function exportWeb(output) {
  const definition = arenas.find(({ id }) => id === 'cloudbreak-foundry');
  if (!definition || definition.platforms.some((platform) => platform.motion) || definition.airDrift ||
      definition.spawns.length !== playerColors.length || playerColors.length !== 4) {
    throw new Error('The Wii prototype needs static Cloudbreak Foundry and four player spawns.');
  }
  const match = createMatch(playerColors.map((_, slot) => ({ slot, fighter, cpu: false })), definition);
  if (match.fighters.some(({ grounded }) => !grounded)) throw new Error('Wii spawn platform missing.');
  const [player] = match.fighters;
  handleAttackInput(player, { x: 0, y: 0, lightPressed: true }, match, rules.step);
  const attack = player.attack;
  if (attack?.type !== 'light') throw new Error('The Wii prototype needs Rivet’s neutral light attack.');
  const direction = player.facing;
  const tables = `// Generated from the Web game. Do not edit.
namespace web {
constexpr float step = ${number(rules.step)};
constexpr float matchTime = ${number(rules.duration)};
constexpr float countdown = ${number(match.countdown)};
constexpr float gravity = ${number(rules.gravity)};
constexpr float speed = ${number(fighter.speed)};
constexpr float jump = ${number(fighter.jump)};
constexpr int stocks = ${rules.stocks};
constexpr int jumps = ${player.jumps};
constexpr float bounds[] = {${values([definition.bounds.side, definition.bounds.top, definition.bounds.bottom])}};
constexpr float respawnHeight = ${number(definition.respawnHeight)};
constexpr Platform platforms[] = {
${match.arena.platforms.map(({left, right, y}) => `  {${values([left, right, y])}},`).join('\n')}
};
constexpr Spawn spawns[] = {
${match.fighters.map(({x, y, facing, grounded}, slot) =>
    `  {${values([x, y, facing])}, ${match.arena.platforms.indexOf(grounded)}, ${color(playerColors[slot])}},`).join('\n')}
};
constexpr Attack light = {${values([attack.duration, attack.from, attack.until, attack.range,
    attack.vertical, attack.damage, attack.force, attack.x * direction, attack.y, attack.lift])}};
}
`;
  const meshes = [
    ['stage', (renderer) => drawBattleArena(renderer, match.arena, 0)],
    ['idle', (renderer) => draw(renderer, fighter, [0, 0, 0], 0, { heading: .5 })],
    ['air', (renderer) => draw(renderer, fighter, [0, 0, 0], 0, { heading: .5, airborne: true })],
    ['punch', (renderer) => draw(renderer, fighter, [0, 0, 0], 0, { heading: .5, attack: { age: attack.from, duration: attack.duration } })],
    ...Array.from({ length: 6 }, (_, i) => [`walk${i}`,
      (renderer) => draw(renderer, fighter, [0, 0, 0], i * Math.PI / 45, { heading: .5, running: 1 })]),
  ];
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'web_rules.inc'), tables);
  await writeFile(join(output, 'web_meshes.inc'), '// Generated from the Web game. Do not edit.\n' +
    meshes.map(([name, scene]) => `const Vertex ${name}[] = {\n${capture(scene)}\n};\n`).join('\n'));
}
