# Smash Creble for Wii

This native Homebrew Channel build features all 41 fighters from the Web roster. Play Versus with one to four local players or Mob Smash with one to three. Both modes support Cloudbreak Foundry, Stormcoil Array, GDMR, IUI!, and Spiaccica Frittata.

The Wii renderer uses prebuilt display lists for Cloudbreak Foundry and the distant trees in IUI!. Cloudbreak Foundry's background clouds are still. The shared battle renderer draws moving platforms and hazards using the current simulation state. Clones with prebuilt idle, running, and airborne poses use those poses during ordinary movement.

During a match the Wii renderer uses low-polygon surfaces derived from the Web fighter meshes. The exporter creates six views of each primitive. The renderer selects a view for each animated part using the arena camera. Roster portraits, arenas, and effects drawn outside fighter models use the original geometry.

## Build a release

Install Node.js, a `tar` command that can extract XZ archives, and the [devkitPro Wii development tools](https://devkitpro.org/wiki/Getting_Started), including devkitPPC, libogc 3.x, and gamecube-tools. The script checks `DEVKITPRO`, a workspace-local SDK under `wii/.sdk/opt/devkitpro`, and the default installation path (`C:/devkitPro` on Windows or `/opt/devkitpro` on Linux), in that order. It accepts a separate `DEVKITPPC` path when needed.

Run this from the project root when a Web snapshot is ready:

```sh
node wii/release.mjs 0.1.0-wii.6
```

The script exports the roster portraits and geometry and embeds the Web combat and battle scene modules. It builds the bundled QuickJS engine from source, compiles the native Wii application, converts the ELF to DOL, and verifies its section table and entry point. The release includes `wii/dist/<version>/apps/SmashCreble/boot.dol`, Homebrew Channel metadata, and the QuickJS license. Pick a new version for each release. The script picks up changes to the shared modules when building a new release.

To inspect the generated data without a Wii toolchain, run `node wii/release.mjs --export-only`. Generated files go in `wii/build/generated`.

## Play on Wii

Copy the release's `apps/SmashCreble` directory into `apps` on the SD card and launch **Smash Creble Wii** from the Homebrew Channel.

| Action | Wii Remote + Nunchuk | Wii Remote held sideways, pointing left | Classic Controller |
| --- | --- | --- | --- |
| Browse the roster | Nunchuk stick | D-pad in the sideways orientation | D-pad |
| Confirm fighter | A (Wii Remote) | 2 | A |
| Cancel fighter confirmation | B (Wii Remote) | 1 | B |
| Switch between Versus and Mob Smash | - | - | - |
| Change arena after confirming | Stick left or right | D-pad left or right | D-pad left or right |
| Change Mob Smash KO target after confirming | Stick up or down | D-pad up or down | D-pad up or down |
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

Each connected controller gets a numbered preview and a cursor. Press **+** once at least one player has confirmed a fighter. In Versus, every connected controller joins with the fighter under its cursor. Randomly chosen CPU fighters fill the remaining slots.

In Mob Smash, each player confirms a fighter to join. Set a shared target of 10, 20, 50, or 100 KOs before starting. One CPU opponent enters for each player, with replacements arriving as opponents are knocked out. Teammates and their clones cannot hit each other. The challenge ends when the team reaches its KO target or loses its last stock. The HUD shows the shared KO count.

A disconnected human participant pauses an active match until that controller channel is available again.
