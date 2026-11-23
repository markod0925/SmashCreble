import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportWeb } from './export.mjs';

const wii = fileURLToPath(new URL('.', import.meta.url));
const windows = process.platform === 'win32';
const suffix = windows ? '.exe' : '';
const [version, ...rest] = process.argv.slice(2);

function run(executable, args, cwd) {
  const result = spawnSync(executable, args, { stdio: 'inherit', cwd });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} exited with status ${result.status ?? result.signal}`);
}

function verifyDol(dol) {
  if (dol.length <= 0x100) throw new Error('Empty Wii executable.');
  const entry = dol.readUInt32BE(0xe0);
  let validEntry = false;
  for (let i = 0; i < 18; i++) {
    const offset = dol.readUInt32BE(i * 4);
    const address = dol.readUInt32BE(0x48 + i * 4);
    const size = dol.readUInt32BE(0x90 + i * 4);
    if (!size) continue;
    if (offset < 0x100 || offset + size > dol.length) throw new Error('Invalid Wii executable section.');
    if (i < 7 && entry >= address && entry < address + size) validEntry = true;
  }
  if (!validEntry) throw new Error('Wii executable entry point is outside the code sections.');
}

async function buildEngine(work, compiler, flags) {
  const version = '2025-09-13';
  const archive = join(wii, 'vendor', `quickjs-${version}.tar.xz`);
  const hash = createHash('sha256').update(await readFile(archive)).digest('hex');
  if (hash !== '6f1f322aea3bb3a90858db85c9fe717013fde4df7dfcafe2f57e78f5bb4b4a0c') {
    throw new Error('Unexpected QuickJS source archive.');
  }
  run('tar', ['-xf', archive, '-C', work]);
  const engine = join(work, `quickjs-${version}`);
  const quickjs = join(engine, 'quickjs.c');
  let source = await readFile(quickjs, 'utf8');
  // Use newlib's allocator and timezone fallback. The Wii build does not use JS worker threads.
  for (const [from, to] of [
    ['#elif defined(__linux__) || defined(__GLIBC__)\n#include <malloc.h>', '#elif defined(GEKKO) || defined(__linux__) || defined(__GLIBC__)\n#include <malloc.h>'],
    ['#if !defined(EMSCRIPTEN)\n#define CONFIG_ATOMICS', '#if !defined(EMSCRIPTEN) && !defined(GEKKO)\n#define CONFIG_ATOMICS'],
    ['ti = time;\n#if defined(_WIN32)', 'ti = time;\n#if defined(_WIN32) || defined(GEKKO)'],
  ]) {
    if (!source.includes(from)) throw new Error('QuickJS Wii compatibility patch did not match.');
    source = source.replace(from, to);
  }
  await writeFile(quickjs, source);
  const objects = ['quickjs', 'dtoa', 'libregexp', 'libunicode', 'cutils'].map((name) => {
    const object = join(work, `${name}.o`);
    run(compiler, [...flags, '-std=gnu11', '-fwrapv', '-D_GNU_SOURCE', `-DCONFIG_VERSION="${version}"`,
      '-c', join(engine, `${name}.c`), '-o', object]);
    return object;
  });
  return { engine, objects };
}

async function main() {
  if (rest.length || (version !== '--export-only' && !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(version ?? ''))) {
    throw new Error('Usage: node wii/release.mjs <release-version> or --export-only');
  }
  const build = join(wii, 'build');
  await mkdir(build, { recursive: true });
  if (version === '--export-only') {
    const output = join(build, 'generated');
    await exportWeb(output);
    console.log(`Exported Web data to ${output}`);
    return;
  }

  const localSdk = join(wii, '.sdk', 'opt', 'devkitpro');
  const hasLocalSdk = await access(join(localSdk, 'devkitPPC', 'bin', `powerpc-eabi-g++${suffix}`))
    .then(() => true, () => false);
  const sdk = process.env.DEVKITPRO ?? (hasLocalSdk ? localSdk : windows ? 'C:/devkitPro' : '/opt/devkitpro');
  const ppc = process.env.DEVKITPPC ?? join(sdk, 'devkitPPC');
  const compiler = join(ppc, 'bin', `powerpc-eabi-g++${suffix}`);
  const cCompiler = join(ppc, 'bin', `powerpc-eabi-gcc${suffix}`);
  const elf2dol = join(sdk, 'tools', 'bin', `elf2dol${suffix}`);
  const libogc = join(sdk, 'libogc');
  try {
    await Promise.all([access(compiler), access(cCompiler), access(elf2dol), access(join(libogc, 'include', 'gccore.h'))]);
  } catch (error) {
    throw new Error(`Missing devkitPro Wii toolchain file: ${error.path}. Install the Wii development packages or set DEVKITPRO.`);
  }

  const work = await mkdtemp(join(build, 'release-'));
  const generated = join(work, 'generated');
  const elf = join(work, 'rift-ruckus.elf');
  const output = join(wii, 'dist', version);
  const payload = join(work, 'package');
  const app = join(payload, 'apps', 'RiftRuckus');
  const dol = join(app, 'boot.dol');
  try {
    await exportWeb(generated);
    await mkdir(app, { recursive: true });
    const flags = ['-O2', '-DGEKKO', '-mrvl', '-mcpu=750', '-meabi', '-mhard-float',
      '-ffunction-sections', '-fdata-sections'];
    const { engine, objects } = await buildEngine(work, cCompiler, flags);
    run(compiler, [
      ...flags, '-std=c++17', '-Wall', '-Wextra', '-Wl,--gc-sections',
      '-I', generated, '-I', join(libogc, 'include'), '-isystem', engine, join(wii, 'main.cpp'), join(wii, 'fight.cpp'),
      join(generated, 'web_assets.S'),
      ...objects,
      '-L', join(libogc, 'lib', 'wii'), '-lwiiuse', '-lbte', '-logc', '-lm',
      '-o', elf,
    ], generated);
    run(elf2dol, [elf, dol]);
    verifyDol(await readFile(dol));
    await writeFile(join(app, 'meta.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<app version="1">
  <name>Rift Ruckus Wii</name>
  <version>${version}</version>
  <short_description>Local platform fighter prototype</short_description>
  <long_description>Choose a fighter and play Cloudbreak Foundry with up to four local players.</long_description>
</app>
`);
    await cp(join(wii, 'README.md'), join(payload, 'README.md'));
    await cp(join(wii, 'vendor', 'QuickJS-LICENSE'), join(payload, 'QuickJS-LICENSE'));
    await mkdir(join(wii, 'dist'), { recursive: true });
    await rename(payload, output);
    console.log(`Wii release ready: ${output}`);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
