# Rift Ruckus for Wii

This native Homebrew Channel prototype supports two to four local players using Rivet in Cloudbreak Foundry. It includes movement, double jump, a neutral punch, knockback, stocks, respawns, and a match timer. The Windows/browser game remains the authoring project. The prototype has its own simplified C++ combat implementation. It omits the full roster, special moves, CPU players, and audio.

## Build a release

Install Node.js and the [devkitPro Wii development tools](https://devkitpro.org/wiki/Getting_Started), including devkitPPC, libogc 3.x, and gamecube-tools. The script checks `DEVKITPRO`, a workspace-local SDK under `wii/.sdk/opt/devkitpro`, and the default installation path (`C:/devkitPro` on Windows or `/opt/devkitpro` on Linux), in that order. It accepts a separate `DEVKITPPC` path when needed.

Run this from the project root when a Web snapshot is ready:

```sh
node wii/release.mjs 0.1.0-wii.1
```

The script loads the Web modules, captures the stage and fighter meshes, samples the neutral punch, and exports the supported match rules and spawn data. It compiles the Wii application, converts the resulting ELF to DOL, verifies its section table and entry point, and writes `wii/dist/<version>/apps/RiftRuckus/boot.dol` with its Homebrew Channel metadata. Pick a new version for each release. Changes to supported Web assets and values are picked up on the next release. New combat mechanics and changes to the prototype's supported slice require extending its C++ code.

To inspect the generated data without a Wii toolchain, run `node wii/release.mjs --export-only`. Generated files go in `wii/build/generated`.

## Play on Wii

Copy the release's `apps/RiftRuckus` directory into `apps` on the SD card and launch **Rift Ruckus Wii** from the Homebrew Channel.

| Action | Wii Remote held sideways, pointing left | Classic Controller |
| --- | --- | --- |
| Join or jump | 2 | A |
| Move | D-pad left or right in the sideways orientation | D-pad left or right |
| Punch | 1 | B |
| Start or rematch | + | + |
| Exit | HOME | HOME |

Join with at least two controllers before starting. A disconnected player pauses an active match until that controller channel is available again. The first hardware check should cover all four controllers, disconnect and reconnect, a full match, and a rematch.
