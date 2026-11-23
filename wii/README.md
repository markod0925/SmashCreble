# Rift Ruckus for Wii

This native Homebrew Channel build supports one to four local players in Cloudbreak Foundry. The Wii release uses the Web roster, fighter models, combat rules, moves, and battle effects. The browser game remains the authoring project.

The Wii renderer draws Cloudbreak Foundry from prebuilt display lists and keeps its background clouds still. Clones use prebuilt idle, running, and airborne poses during ordinary movement. Their attacks and status effects use the shared battle renderer. The Wii build uses the Web geometry and clone behavior.

## Build a release

Install Node.js, a `tar` command that can extract XZ archives, and the [devkitPro Wii development tools](https://devkitpro.org/wiki/Getting_Started), including devkitPPC, libogc 3.x, and gamecube-tools. The script checks `DEVKITPRO`, a workspace-local SDK under `wii/.sdk/opt/devkitpro`, and the default installation path (`C:/devkitPro` on Windows or `/opt/devkitpro` on Linux), in that order. It accepts a separate `DEVKITPPC` path when needed.

Run this from the project root when a Web snapshot is ready:

```sh
node wii/release.mjs 0.1.0-wii.6
```

The script exports the roster portraits and geometry and embeds the Web combat and battle scene modules. It builds the bundled QuickJS engine from source, compiles the native Wii application, converts the ELF to DOL, and verifies its section table and entry point. The release includes `wii/dist/<version>/apps/RiftRuckus/boot.dol`, Homebrew Channel metadata, and the QuickJS license. Pick a new version for each release. The script picks up changes to the shared modules when building a new release.

To inspect the generated data without a Wii toolchain, run `node wii/release.mjs --export-only`. Generated files go in `wii/build/generated`.

## Play on Wii

Copy the release's `apps/RiftRuckus` directory into `apps` on the SD card and launch **Rift Ruckus Wii** from the Homebrew Channel.

| Action | Wii Remote + Nunchuk | Wii Remote held sideways, pointing left | Classic Controller |
| --- | --- | --- | --- |
| Browse the roster | Nunchuk stick | D-pad in the sideways orientation | D-pad |
| Confirm fighter | A (Wii Remote) | 2 | A |
| Cancel fighter confirmation | B (Wii Remote) | 1 | B |
| Jump in a match | C (Nunchuk) | 2 | A |
| Move or aim | Nunchuk stick | D-pad in the sideways orientation | D-pad |
| Light attack | A (Wii Remote) | 1 | B |
| Special, tap or hold depending on the fighter | B (Wii Remote) | B | X |
| Upward recovery | Up + B | Up + B | Up + X |
| Heavy attack, where available | - | - | Y |
| Shield | Hold Z (Nunchuk) | Hold A | Hold ZL or ZR |
| Dodge | Z + C | A + 2 | ZL or ZR + A |
| Superstar move, after collecting the star | A + B | 1 + B | B + X |
| Start or return to character select after the match | + | + | + |
| Exit | HOME | HOME | HOME |

Each connected controller gets a numbered preview and a cursor. Press + once anyone has confirmed a fighter. Other connected controllers enter with the fighter under their cursor. With one controller, the match runs as solo practice. A disconnected participant pauses an active match until that controller channel is available again.
