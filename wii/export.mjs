import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { defaultArena } from '../src/arenas/index.js';
import { createArena, rules } from '../src/combat/arena.js';
import { cloneScale } from '../src/combat/state.js';
import { fighters } from '../src/fighters/index.js';
import { playerColors } from '../src/player-colors.js';
import { drawBattleArena } from '../src/render/arena.js';
import { drawCharacter } from '../src/render/characters.js';
import { shapes } from '../src/render/geometry.js';
import { multiply, transform } from '../src/render/math.js';
import { clonePoses, cloneRoster } from './clone-poses.mjs';

function number(value) {
  if (!Number.isFinite(value)) throw new Error(`Invalid Wii export number: ${value}`);
  return `${value.toExponential(8)}f`;
}

const values = (items) => items.map(number).join(', ');
const color = (hex) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error(`Invalid Wii export color: ${hex}`);
  return `0x${hex.slice(1)}ffu`;
};

function capture(drawScene, project, include = () => true) {
  const vertices = [];
  const renderer = {
    mesh(shape, matrix, hex, glow = 0, alpha = 1) {
      if (!include(alpha)) return;
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
        const rgba = [...rgb.map((channel) => Math.min(255, Math.round(channel * shade))), Math.round(alpha * 255)];
        if (![...position, ...rgba].every(Number.isFinite)) throw new Error(`Invalid Wii vertex: ${shape}`);
        vertices.push({ position, rgba });
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
  if (!vertices.length || vertices.length > 0xffff || vertices.length % 3) {
    throw new Error(`Invalid Wii display list vertex count: ${vertices.length}`);
  }
  if (project) project(vertices);
  // GX_TRIANGLES | GX_VTXFMT0, a big-endian vertex count, then direct XYZ and RGBA8.
  // The GPU reads display lists in 32-byte blocks. Zero bytes are GX NOPs.
  const bytesPerVertex = 16;
  const packet = Buffer.alloc(Math.ceil((3 + vertices.length * bytesPerVertex) / 32) * 32);
  packet[0] = 0x90;
  packet.writeUInt16BE(vertices.length, 1);
  vertices.forEach(({ position, rgba }, index) => {
    const offset = 3 + index * bytesPerVertex;
    position.forEach((coordinate, axis) => packet.writeFloatBE(coordinate, offset + axis * 4));
    packet.set(rgba, offset + 12);
  });
  return packet;
}

function cardPosition(index) {
  const columns = 6;
  const rows = Math.ceil(fighters.length / columns);
  const rowHeight = Math.min(73, 292 / rows);
  return [164 + index % columns * 62, 108 + Math.floor(index / columns) * rowHeight, rowHeight];
}

function fitPortrait(vertices, centerX, centerY, rowHeight) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const vertex of vertices) {
    const [x, y, z] = vertex.position;
    const height = y * .97 - z * .24;
    vertex.position = [x, height, y * .24 + z * .97];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, height);
    maxY = Math.max(maxY, height);
  }
  const scale = Math.min(44 / (maxX - minX), (rowHeight - 23) / (maxY - minY));
  for (const vertex of vertices) {
    const [x, y, z] = vertex.position;
    vertex.position = [centerX + (x - (minX + maxX) / 2) * scale,
      centerY + ((minY + maxY) / 2 - y) * scale, Math.max(-.95, Math.min(-.05, -.5 + z * .05))];
  }
}

async function collectModules(name, modules = new Map()) {
  if (modules.has(name)) return modules;
  const replacements = {
    'src/render/arena.js': 'wii/render-arena.mjs',
    'src/render/arena.browser.js': 'src/render/arena.js',
    'src/render/characters.js': 'wii/render-characters.mjs',
    'src/render/characters.browser.js': 'src/render/characters.js',
    'src/render/math.js': 'wii/render-math.mjs',
    'src/render/math.browser.js': 'src/render/math.js',
  };
  const source = await readFile(new URL(`../${replacements[name] ?? name}`, import.meta.url), 'utf8');
  modules.set(name, Buffer.from(source + '\0'));
  for (const match of source.matchAll(/^\s*(?:import|export)\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/gm)) {
    if (!match[1].startsWith('.')) throw new Error(`Unsupported Wii module import: ${match[1]}`);
    await collectModules(posix.normalize(posix.join(posix.dirname(name), match[1])), modules);
  }
  return modules;
}

function indexGeometry() {
  const geometry = Object.entries(shapes).map(([name, values]) => {
    const positions = new Map();
    const normals = new Map();
    const triangles = [];
    const index = (entries, vector) => {
      const key = vector.join(',');
      if (!entries.has(key)) entries.set(key, { index: entries.size, vector });
      return entries.get(key).index;
    };
    for (let i = 0; i < values.length; i += 18) {
      const normal = values.slice(i + 3, i + 6).map((value) => Math.round(value * 1e7) / 1e7);
      triangles.push(index(normals, normal));
      for (let vertex = i; vertex < i + 18; vertex += 6) {
        triangles.push(index(positions, values.slice(vertex, vertex + 3).map(Math.fround)));
      }
    }
    if (normals.size > 0xffff || positions.size > 0xffff || values.length / 6 > 0xffff) {
      throw new Error(`Wii geometry is too large: ${name}`);
    }
    return { name, triangles, positions: [...positions.values()].flatMap(({ vector }) => vector),
      normals: [...normals.values()].flatMap(({ vector }) => vector) };
  });
  const floats = (values) => {
    const bytes = Buffer.alloc(values.length * 4);
    values.forEach((value, index) => bytes.writeFloatBE(value, index * 4));
    return bytes;
  };
  const data = [];
  for (const { name, positions, normals, triangles } of geometry) {
    const indices = Buffer.alloc(triangles.length * 2);
    triangles.forEach((value, i) => indices.writeUInt16BE(value, i * 2));
    data.push([`positions_${name}`, floats(positions)], [`normals_${name}`, floats(normals)], [`triangles_${name}`, indices]);
  }
  return { data, geometry };
}

async function writeAssets(output, meshes, visuals, clonePoses) {
  const modules = [...await collectModules('wii/runtime.mjs')];
  const { data, geometry } = indexGeometry();
  const assets = [...meshes, ...data, ...modules.map(([, bytes], index) => [`module${index}`, bytes])];
  const declarations = [];
  const assembly = ['.section .rodata'];
  let offset = 0;
  for (const [name, bytes] of assets) {
    declarations.push(`extern "C" const unsigned char ${name}[${bytes.length}];`);
    assembly.push('.balign 32', `.globl ${name}`, `${name}:`, `.incbin "web_assets.bin", ${offset}, ${bytes.length}`);
    offset += bytes.length;
  }
  const largest = Math.max(...meshes.filter(([name]) => name.endsWith('_portrait')).map(([, bytes]) => bytes.length));
  declarations.push(`constexpr size_t playerListSize = ${largest};`, 'constexpr FighterVisual fighterVisuals[] = {',
    ...visuals.map(({ name, position }) => `  {${name}, ${values(position)}},`), '};',
    'constexpr Geometry geometry[] = {',
    ...geometry.map(({ name, positions, normals, triangles }) =>
      `  {positions_${name}, normals_${name}, triangles_${name}, ${positions.length / 3}, ${normals.length / 3}, ${triangles.length / 4}},`), '};',
    'constexpr Pose clonePoses[] = {',
    ...clonePoses.map((name) => `  {${name}, sizeof(${name})},`), '};',
    'constexpr ModuleSource modules[] = {',
    ...modules.map(([name], index) => `  {"${name}", module${index}, sizeof(module${index}) - 1},`), '};');
  await Promise.all([
    writeFile(join(output, 'web_meshes.inc'), declarations.join('\n') + '\n'),
    writeFile(join(output, 'web_assets.S'), assembly.join('\n') + '\n'),
    writeFile(join(output, 'web_assets.bin'), Buffer.concat(assets.map(([, bytes]) => bytes))),
  ]);
}

export async function exportWeb(output) {
  if (defaultArena.id !== 'cloudbreak-foundry' || defaultArena.platforms.some(({ motion }) => motion) ||
      defaultArena.environment || defaultArena.spawns.length !== playerColors.length || playerColors.length !== 4) {
    throw new Error('The Wii build needs the static Cloudbreak Foundry layout and four player spawns.');
  }
  const tables = `// Generated from the Web game. Do not edit.
namespace web {
constexpr float step = ${number(rules.step)};
constexpr FighterSpec roster[] = {
${fighters.map((entry) => {
    const name = entry.name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().replace(/[^A-Z0-9 .!&'-]/g, ' ');
    return `  {${JSON.stringify(name)}, ${color(entry.color)}},`;
  }).join('\n')}
};
constexpr uint32_t playerColors[] = {${playerColors.map(color).join(', ')}};
}
`;
  const arena = createArena(defaultArena);
  const drawArena = (renderer) => drawBattleArena(renderer, arena, 0);
  const meshes = [
    ['arenaOpaque', capture(drawArena, null, (alpha) => alpha === 1)],
    ['arenaTranslucent', capture(drawArena, null, (alpha) => alpha < 1)],
  ];
  const visuals = fighters.map((entry, index) => {
    const position = cardPosition(index);
    const name = `fighter${index}_portrait`;
    meshes.push([name, capture((renderer) => drawCharacter(renderer, entry, [0, 0, 0], 0, { heading: .5, pose: true }),
      (vertices) => fitPortrait(vertices, ...position))]);
    return { name, position };
  });
  const poseAssets = [];
  for (const fighter of cloneRoster) {
    const model = { ...fighter, size: fighter.size * cloneScale };
    for (const facing of [-1, 1]) {
      const direction = facing < 0 ? 'left' : 'right';
      for (const { name: pose, time, options } of clonePoses) {
        const name = `clone_${fighter.id.replaceAll('-', '_')}_${direction}_${pose}`;
        meshes.push([name, capture((renderer) =>
          drawCharacter(renderer, model, [0, 0, 0], time, { facing, heading: facing * .93, ...options }))]);
        poseAssets.push(name);
      }
    }
  }
  await mkdir(output, { recursive: true });
  await Promise.all([writeFile(join(output, 'web_rules.inc'), tables), writeAssets(output, meshes, visuals, poseAssets)]);
}
