# Round robin with Zunchy's neural attack selector

On 26 November 2026, the browser combat engine repeated all 8,200 CPU-versus-CPU fixtures from the original round robin. Zunchy moved from rank 40 to rank 20, improving from 41/400 wins (10.25%) to 217/400 (54.25%).

## Replay setup

Each of the 820 distinct pairs played ten matches. Every arena hosted two matches per pair, one per starting side. All fixtures reused the original arena, slot assignment, and random seed. This run used the pilot neural network for Zunchy's attack selection. It was chosen because it won the most matches against the pilot's eight held-out opponents.

The model made an attack decision in all 400 Zunchy matches. The other 7,800 matches reproduced the original winners, remaining stocks, damage, durations, and time-limit flags. A separate replay reproduced all fields for 60 Zunchy matches against six opponents.

## Zunchy results

Zunchy won 20 series, lost 15, and tied 5. The original results were 1 win, 38 losses, and 1 tie. Of the matched fixtures, 182 changed from loss to win and 6 changed from win to loss. Cumulative stock differential improved from −742 to +76.

| Arena | Original wins / 80 | Neural wins / 80 | Change |
| --- | ---: | ---: | ---: |
| Cloudbreak Foundry | 8 | 40 | +32 |
| Stormcoil Array | 5 | 40 | +35 |
| GDMR | 10 | 44 | +34 |
| IUI! | 8 | 47 | +39 |
| Spiaccica Frittata | 10 | 46 | +36 |

Against the 17 opponents outside all three pilot groups, Zunchy won 99 of 170 matches, up from 17. Zunchy swept Draga Mamma, HarriPotter, and Kirbi. Kiln and Olivar each won all ten of their matches against Zunchy.

### Results by pilot opponent group

| Opponent group | Opponents | Matches | Original wins | Neural wins |
| --- | ---: | ---: | ---: | ---: |
| Training | 12 | 120 | 11 | 67 |
| Validation | 3 | 30 | 0 | 15 |
| Pilot evaluation | 8 | 80 | 13 | 36 |
| Outside the pilot | 17 | 170 | 17 | 99 |

## Full roster ranking

Every fighter had 400 matches. The standings use one point per win and half a point per draw, with cumulative stock differential as the tiebreaker. Stock differential is the sum of a fighter's remaining stocks minus the opponent's. ii!, Olivar, and Kiln retained the first three ranks.

| New rank | Fighter | Original rank | Original W–L | New W–L | Change in wins | New stock differential |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | ii! | 1 | 328–72 | 327–73 | −1 | +504 |
| 2 | Olivar | 2 | 316–84 | 316–84 | 0 | +462 |
| 3 | Kiln | 3 | 314–86 | 314–86 | 0 | +460 |
| 4 | Murena Man | 4 | 286–114 | 283–117 | −3 | +311 |
| 5 | Incantus | 6 | 280–120 | 279–121 | −1 | +300 |
| 6 | DragonBall | 5 | 282–118 | 276–124 | −6 | +308 |
| 7 | Maradona | 7 | 277–123 | 273–127 | −4 | +289 |
| 8 | 67 | 8 | 274–126 | 273–127 | −1 | +251 |
| 9 | Dragon Boy | 9 | 272–128 | 268–132 | −4 | +270 |
| 10 | Cerbero | 10 | 271–129 | 265–135 | −6 | +272 |
| 11 | Bid | 11 | 269–131 | 261–139 | −8 | +252 |
| 12 | Bramble | 12 | 264–136 | 261–139 | −3 | +227 |
| 13 | Ho-Ho-Ho | 13 | 257–143 | 257–143 | 0 | +206 |
| 14 | Inga inga | 14 | 247–153 | 243–157 | −4 | +160 |
| 15 | Markok | 15 | 244–156 | 242–158 | −2 | +175 |
| 16 | Che Addominali! | 17 | 241–159 | 237–163 | −4 | +139 |
| 17 | Vidarr | 16 | 244–156 | 236–164 | −8 | +130 |
| 18 | Vi | 18 | 234–166 | 228–172 | −6 | +160 |
| 19 | Huuuuu!! | 19 | 234–166 | 227–173 | −7 | +84 |
| 20 | Zunchy | 40 | 41–359 | 217–183 | +176 | +76 |
| 21 | SuperLibroGirl | 20 | 216–184 | 215–185 | −1 | +12 |
| 22 | Gioppino | 21 | 205–195 | 197–203 | −8 | +5 |
| 23 | KillyWilly | 22 | 197–203 | 194–206 | −3 | −11 |
| 24 | Beina | 23 | 183–217 | 174–226 | −9 | −103 |
| 25 | Gangar | 24 | 178–222 | 173–227 | −5 | −99 |
| 26 | Budino | 25 | 173–227 | 168–232 | −5 | −115 |
| 27 | Packman | 26 | 163–237 | 159–241 | −4 | −138 |
| 28 | Vesper | 27 | 163–237 | 159–241 | −4 | −141 |
| 29 | Bomm | 28 | 162–238 | 157–243 | −5 | −184 |
| 30 | Eid | 29 | 155–245 | 150–250 | −5 | −180 |
| 31 | Rivet | 30 | 154–246 | 148–252 | −6 | −230 |
| 32 | Nurofen Caps | 32 | 143–257 | 139–261 | −4 | −285 |
| 33 | Luffy | 31 | 144–256 | 137–263 | −7 | −225 |
| 34 | Nuvol | 33 | 131–269 | 129–271 | −2 | −290 |
| 35 | Funny Kings | 34 | 130–270 | 121–279 | −9 | −292 |
| 36 | Maestra | 35 | 124–276 | 120–280 | −4 | −322 |
| 37 | Ciclope | 36 | 108–292 | 105–295 | −3 | −386 |
| 38 | HarriPotter | 37 | 99–301 | 93–307 | −6 | −419 |
| 39 | Draga Mamma | 38 | 80–320 | 73–327 | −7 | −519 |
| 40 | Pinco Palino | 39 | 79–321 | 72–328 | −7 | −470 |
| 41 | Kirbi | 41 | 38–362 | 34–366 | −4 | −644 |

## Zunchy's head-to-head records

Read every record from Zunchy's perspective.

| Opponent | Original W–L | Neural W–L | Change in wins | Neural stock differential |
| --- | ---: | ---: | ---: | ---: |
| Rivet | 0–10 | 6–4 | +6 | +3 |
| Bramble | 0–10 | 3–7 | +3 | −9 |
| Vesper | 0–10 | 4–6 | +4 | −2 |
| Kiln | 0–10 | 0–10 | 0 | −22 |
| Dragon Boy | 1–9 | 5–5 | +4 | 0 |
| Eid | 2–8 | 7–3 | +5 | +8 |
| Incantus | 0–10 | 1–9 | +1 | −12 |
| Beina | 0–10 | 9–1 | +9 | +11 |
| Gangar | 0–10 | 5–5 | +5 | 0 |
| Vi | 0–10 | 6–4 | +6 | +4 |
| Bomm | 2–8 | 7–3 | +5 | +8 |
| Gioppino | 0–10 | 8–2 | +8 | +10 |
| Huuuuu!! | 0–10 | 7–3 | +7 | +7 |
| 67 | 1–9 | 2–8 | +1 | −9 |
| Inga inga | 1–9 | 5–5 | +4 | 0 |
| Bid | 1–9 | 9–1 | +8 | +13 |
| Olivar | 0–10 | 0–10 | 0 | −20 |
| Packman | 3–7 | 7–3 | +4 | +2 |
| Ciclope | 2–8 | 5–5 | +3 | +1 |
| Vidarr | 0–10 | 8–2 | +8 | +8 |
| Funny Kings | 0–10 | 9–1 | +9 | +12 |
| Nuvol | 0–10 | 2–8 | +2 | −7 |
| ii! | 0–10 | 1–9 | +1 | −13 |
| DragonBall | 0–10 | 6–4 | +6 | +2 |
| Luffy | 1–9 | 8–2 | +7 | +12 |
| Maestra | 5–5 | 9–1 | +4 | +15 |
| Nurofen Caps | 4–6 | 8–2 | +4 | +14 |
| Pinco Palino | 2–8 | 9–1 | +7 | +15 |
| Che Addominali! | 0–10 | 4–6 | +4 | −3 |
| Budino | 0–10 | 5–5 | +5 | +4 |
| SuperLibroGirl | 2–8 | 3–7 | +1 | −2 |
| Murena Man | 0–10 | 3–7 | +3 | −4 |
| HarriPotter | 4–6 | 10–0 | +6 | +19 |
| Cerbero | 0–10 | 6–4 | +6 | +2 |
| Draga Mamma | 3–7 | 10–0 | +7 | +21 |
| Maradona | 0–10 | 4–6 | +4 | +2 |
| Ho-Ho-Ho | 1–9 | 1–9 | 0 | −14 |
| KillyWilly | 0–10 | 3–7 | +3 | −7 |
| Kirbi | 6–4 | 10–0 | +4 | +18 |
| Markok | 0–10 | 2–8 | +2 | −11 |

## Reproduction

Use the browser combat engine at commit `697eb0bcfefec43a1c9d0577a51e0e64d9f21c1a`. Load the neural model from the pilot JSON and pass its `zunchyAttackPolicy` as the attack selector to `cpuInput` for Zunchy's original slot. Keep clones and all other slots on their regular CPU inputs. Pass that CPU reader to `tickMatch`. For every fixture in the original log, initialize Mulberry32 to its recorded seed and run the match to the official result.

The new log includes the outcome and final state for every match. Zunchy's fixtures also include how many times the neural selector chose an action. [Replay match log](round-robin-zunchy-neural-results.json) · [Original match log](round-robin-cpu-results.json) · [Pilot model weights](zunchy-cpu-pilot.json)
