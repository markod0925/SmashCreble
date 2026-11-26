# Zunchy CPU attack selection pilot

Both learned attack selectors won substantially more matches than the current Zunchy CPU in the browser simulator. The biggest measured change in attack usage was taking damage or losing a stock less often while charging. The linear model had the better mirror record by one match, and the neural network won eight more matches against the eight other fighters.

## Complete match results

Each version played 50 mirror matches against the current Zunchy CPU and 400 matches against eight other opponents that were held out of training and validation. Each series used all five standard arenas, with five seeds per arena and both starting sides for every seed. All versions used the same fixture schedule.

| Zunchy controller | Model parameters | Mirror wins | Wins against other fighters | Stock differential against other fighters |
| --- | ---: | ---: | ---: | ---: |
| Current CPU | — | 25/50 | 70/400 (17.5%) | -633 |
| Linear model | 95 | 48/50 | 203/400 (50.8%) | +21 |
| Neural network | 293 | 47/50 | 211/400 (52.8%) | +40 |

| Opponent | Current CPU wins | Linear model wins | Neural network wins |
| --- | ---: | ---: | ---: |
| Kirbi | 33/50 | 47/50 | 46/50 |
| Draga Mamma | 22/50 | 45/50 | 45/50 |
| Pinco Palino | 12/50 | 47/50 | 47/50 |
| Bramble | 0/50 | 10/50 | 15/50 |
| Kiln | 0/50 | 6/50 | 8/50 |
| ii! | 0/50 | 11/50 | 10/50 |
| Olivar | 0/50 | 5/50 | 11/50 |
| SuperLibroGirl | 3/50 | 32/50 | 29/50 |

## Charge outcomes

These counts cover the 400 matches against other fighters for each controller. A charge is marked as punished once if Zunchy takes damage or loses a stock during the observed charge. A volley makes contact when a bomb reaches the main opponent and resolves a hit, block, or capture.

| Zunchy controller | Charges | Punished charges | Bomb volleys | Volleys making contact |
| --- | ---: | ---: | ---: | ---: |
| Current CPU | 6,275 | 2,303 (36.7%) | 2,678 | 1,444 (53.9%) |
| Linear model | 3,050 | 509 (16.7%) | 1,609 | 878 (54.6%) |
| Neural network | 3,456 | 531 (15.4%) | 1,802 | 989 (54.9%) |

The learned controllers attempted fewer charges, with similar contact rates once they launched a volley. Both learned controllers still lost most matches against Bramble, Kiln, ii!, and Olivar. Superstar timing needs its own evaluation. The linear model selected Superstar once and the neural network selected it zero times across the validation decisions, including decisions when Superstar was unavailable.

## Training

The pilot recorded 2,755 offensive decisions from 120 matches and used 639 decisions from 30 separate matches for validation. For each sampled decision, the simulator replayed the same game state and random generator state for the current CPU and each legal alternative. The alternatives were wait, light attack, tap special, hold special, and Superstar when available. The engine continued with the current CPU after the first decision.

The training target was the change in stock differential plus the net damage exchange divided by 100 over 2.5 simulated seconds. The 100-to-one weighting was a training choice. The linear model scores the available actions from 18 game-state features. The neural network adds one hidden layer of 12 units. Both selectors run through the browser combat engine's CPU input hook. The existing recovery, arena escape, and charged-special handling run before the hook.

## Reproduction

From the project directory, run `node scripts/zunchy-cpu-pilot.mjs`. The script trains both models and runs the 1,350 benchmark matches. It writes the learned weights, opponent splits, and every benchmark result to the pilot JSON. The optional `--quick` flag exercises the same path with a smaller schedule.

[Pilot weights and match results](zunchy-cpu-pilot.json)
