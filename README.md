# Rift Ruckus

Rift Ruckus is a local platform fighter for Windows PCs. Combat takes place on a 2D plane in a low-poly 3D arena. The seventeen fighters, their models, the arena, and the synthesized sound effects are original to the project.

## Play on Windows

1. Install Node.js if it is missing. Double-click `Play.cmd` to start the local server and open the game in your default browser. You can also run `npm start` or `node server.mjs` in the project directory.
2. If the browser does not open automatically, visit `http://127.0.0.1:4173` in a desktop browser with WebGL enabled. Keep the launcher window open while you play. The game uses no external assets or packages.
3. Pick a fighter, select **Play match**, and select **Start fight**. The default setup is a keyboard player against a CPU. Lobby buttons let you add CPUs, change fighters, and remove seats.

Pair Bluetooth controllers in Windows first, focus the game tab, then press the bottom face button or Start to join. Up to four controllers can play simultaneously. The first two controllers take over the default keyboard and CPU seats as they join. To play with both keyboard and controllers, use **Add keyboard** in the lobby. The game uses the browser’s [standard Gamepad mapping](https://www.w3.org/TR/gamepad/#remapping). A gamepad that the browser exposes without that mapping may need its Windows-compatible controller mode. Start begins the fight from the lobby and pauses during a match. The match pauses if a joined controller disconnects.

## Controls

| Action | Keyboard | Controller (Xbox labels) |
| --- | --- | --- |
| Move and aim | WASD or arrows | Left stick or D-pad |
| Jump and double jump | Space | A |
| Light attack | J | X |
| Charge and release heavy attack | K | Y |
| Fighter special | L | B |
| Upward recovery | Up + L | Up + B |
| Shield | Shift | LT or RT |
| Dodge while shielding | I | LB or RB |
| Drop through a raised platform | Down + Space | Down + A |
| Pause | Esc | Start |

Each fighter starts with three stocks. Damage makes subsequent hits launch a fighter farther. Cross a blast boundary and you lose a stock. The last fighter with a stock wins. At the three-minute limit, remaining stocks decide the result, then lower damage breaks a tie. Equal stocks and equal damage are a draw.

### Superstar fighter controls

Jump and double jump use Space or X. Hold Down with the jump button to drop through a raised platform.

| Dragon Boy | Eid | Incantus | Beina | Gangar | Vi | Bomm | Gioppino | Huuuuu!! | 67 | Inga inga | Bid | Olivar | Keyboard | Controller (Xbox labels) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Claw & Kick | Kick & Punch | Belly Bump | Kick & Punch | Punch & Kick | Horn Jab | Headbutts | Punch & Kicks | Slap | Kick & Headbutt | Headbutt | Claw Swipe | Kick & Punch | J | A |
| Flame Breath | Pulse Shot | Ear Stench | Peel Flip | Lunge Bite | Hoof Kick | Quick Bomb | Zombie Bite | Choking Puff | Briefcase Swing | Lance Throw | Flying Kicks | Sprout Blade | Tap L | Tap B |
| Spine Shot | Blink Scythe | Stagger Hex | Banana Toss | Eye Lasers | Rainbow Arc | Power Steal | Brain Toss | Bandage Bind | 67 Venom Snakes | Draw & Slash | Goblin Pair | Sprout Assault | Hold L | Hold B |
| Scale Burst | Robot Spin | Hypnotic Chomp | Banana Barrage | Gulp & Spit | Clone Herd | Bomm Burst | Zombie Horde | Sarcophagus | Snake Dance | Blade Storm | Goblin Horde | Laser Burst | J + L | A + B |

Touch the golden Superstar at center stage to stock one super attack. The star above the fighter and on the HUD shows when the move is ready. The Superstar returns after the move is used or its holder is knocked out. Upward recovery still uses Up + L or Up + B.

## Original roster

| Fighter | Role | Special |
| --- | --- | --- |
| Rivet | Scrap engineer | **Arc Bolt** fires an electric projectile. |
| Bramble | Root guardian | **Thorn Bloom** strikes on both sides. |
| Vesper | Rift courier | **Phase Dash** lunges forward and strikes nearby rivals. |
| Kiln | Furnace brawler | **Furnace Lift** jumps and launches nearby rivals. |
| Dragon Boy | Scaled striker | **Flame Breath** burns nearby rivals and **Spine Shot** launches back spines. **Scale Burst** sends scales in all directions. |
| Eid | Robot girl | **Pulse Shot** fires a blaster pulse and **Blink Scythe** teleports forward into a scythe strike. **Robot Spin** transforms Eid into an armored robot that fires and swings her scythe while spinning. |
| Incantus | Hypnotist | **Ear Stench** releases clouds from his ears. **Stagger Hex** slows affected rivals and briefly blocks their attacks. **Hypnotic Chomp** pulls an exposed rival toward Incantus, swallows them and spits them out. |
| Beina | Banana acrobat | **Peel Flip** opens her peel and tumbles vertically into nearby rivals. **Banana Toss** throws a spread of arcing bananas. **Banana Barrage** leaps and fires several volleys through the air. |
| Gangar | Fanged brute | **Lunge Bite** snaps at nearby rivals. **Eye Lasers** fire two beams straight ahead. **Gulp & Spit** grabs a nearby rival, swallows them, and spits them out. |
| Vi | Unicorn | **Hoof Kick** strikes with a forehoof and **Rainbow Arc** hits rivals along a rainbow. **Clone Herd** fills the herd to six half-size CPU copies with Vi’s attacks. A copy disappears on the first hit, when it falls out of the arena, or when Vi is eliminated. |
| Bomm | Walking bomb | **Headbutts** strike twice at close range. **Quick Bomb** lobs one bomb. **Power Steal** copies the secondary attack of the nearest rival in front for ten seconds of match time. A cloud flies from the rival to Bomm, then his fuse takes on the rival’s color. During the steal, a tap uses the copied attack. **Bomm Burst** blasts nearby rivals while Bomm keeps his stocks. He swells up after the blast, then shrinks and moves 35% slower for five seconds. |
| Gioppino | Zombie brawler | **Zombie Bite** turns a rival into a slower zombie for five seconds. **Brain Toss** throws a spread of cartoon brains. **Zombie Horde** fills the horde to six half-size CPU copies that use Gioppino’s attacks and disappear on their first hit. |
| Huuuuu!! | Mummy | **Slap** hits at close range. **Choking Puff** releases a cloud on both sides. **Bandage Bind** unwinds bandages from the mummy's body, wraps the first rival hit, and blocks their movement, jumps, shields, and attacks for five seconds. **Sarcophagus** seals a nearby rival in a coffin before dealing damage. |
| 67 | Radio shark | **Kick & Headbutt** chains two close-range hits. **Briefcase Swing** sends a tethered case out to midrange and reels it back. **67 Venom Snakes** releases green diamond-shaped serpents that damage and poison rivals for four seconds. **Snake Dance** plays a synth tune and locks all fighters in place for a seven-second dance while six snakes chase and bite 67's rivals. |
| Inga inga | Armored guard | **Headbutt** hits at close range. **Lance Throw** sends a lance straight ahead. **Draw & Slash** unsheathes a sword and sweeps it in front of the guard. **Blade Storm** sends two staggered volleys of spinning swords and daggers out in a full circle. |
| Bid | Goblin summoner | **Claw Swipe** scratches a nearby rival. **Flying Kicks** leaps into two kicks. **Goblin Pair** fills the group to two goblins and **Goblin Horde** fills it to five. These half-size CPU goblins use Bid's attacks in combat and disappear on the first hit, when they fall out of the arena, or when Bid is eliminated. |
| Olivar | Space explorer | Three small space sprouts orbit Olivar. **Sprout Blade** lines them up into a blade for two slashes. **Sprout Assault** enlarges them and sends them after the nearest opponent for five seconds, then they return and can form the blade again. **Laser Burst** fires a full circle of laser pulses. |

## Code layout

- `src/main.js` connects the main menu, lobby, and match loop.
- `src/fighters/<fighter-id>/profile.js` contains a fighter's stats, move definitions, and projectile launch behavior. The adjacent `model.js` contains their 3D rig, animations, and move visuals. Rivet, Bramble, Vesper, and Kiln share a rig builder and animation code in `src/fighters/standard-model.js`.
- `src/combat/` handles the match clock, stocks, movement, attacks, hit resolution, projectiles, and CPU controls.
- `src/render/` contains the WebGL renderer, geometry, arena, cameras, and effects. The roster portraits and match use the same fighter models.
- `src/ui/` contains the roster, lobby, dialogs, and HUD. Keyboard and controller input live in `src/input.js`, and synthesized effects live in `src/audio.js`.

To add a fighter, create a folder with a profile and a model. Register the profile in `src/fighters/index.js` and the model in `src/render/characters.js`. The roster, portraits, and lobby read from those registries. Update the roster copy and control guide in `index.html` when adding a fighter.
