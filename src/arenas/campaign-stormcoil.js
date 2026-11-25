import { campaignImpact, setCampaignCheckpoint } from '../combat/campaign.js';
import { approach, clamp } from '../math.js';
import { drawStormcoil } from '../render/campaign-stormcoil.js';

const deck = (id, left, right, y = 0) => ({ id, left, right, y, main: true });
const ledge = (id, left, right, y) => ({ id, left, right, y });
const at = (player, { x, y, radius }) => player.grounded &&
  Math.abs(player.x - x) <= radius && Math.abs(player.y - y) < .55;

const gustPeriod = 6;

function stormEnvironment(zones, shelters) {
  return (elapsed) => {
    const phase = elapsed % gustPeriod;
    const direction = Math.floor(elapsed / gustPeriod) % 2 ? -1 : 1;
    const gust = clamp(Math.min((phase - 1.65) / .42, (4.1 - phase) / .45), 0, 1);
    return { zones, shelters, direction, gust, warning: phase >= .65 && phase < 1.65 };
  };
}

function stormDrift({ x, y }, { zones, shelters, direction, gust }) {
  if (shelters.some(({ left, right, y: floor }) => x >= left && x <= right && y >= floor && y < floor + 2.15)) return 0;
  for (const { left, right, bottom, top } of zones) {
    const edge = Math.min(x - left, right - x, y - bottom, top - y);
    if (edge > 0) return direction * gust * 2.35 * Math.min(edge, 1);
  }
  return 0;
}

function liftPlatform(lift) {
  const { id, left, right, bottom } = lift;
  return {
    id, left, right, y: bottom,
    motion: (_environment, _elapsed, arena) => [0, (arena.campaign?.state.lifts?.[id].y ?? bottom) - bottom],
  };
}

function callLift(lift) {
  if (lift.phase === 'bottom') lift.wait = Math.max(lift.wait, 1.2);
  else lift.phase = 'down';
}

function advanceLift(layout, lift, arena, players, dt, holdAtTop) {
  const platform = arena.platforms.find(({ id }) => id === layout.id);
  if (lift.called && !players.some(({ grounded }) => grounded === platform)) {
    callLift(lift);
    lift.called = false;
  }
  if (lift.phase === 'bottom' || lift.phase === 'top') {
    // Overlapping landings let players walk aboard at either stop.
    for (const player of players) {
      if (!player.grounded || player.grounded === platform || Math.abs(player.y - platform.y) > .35 ||
          player.x < platform.left + .28 || player.x > platform.right - .28) continue;
      player.grounded = platform;
      player.y = platform.y;
    }
  }
  if (lift.phase === 'bottom') {
    if (!players.some(({ x, y }) => x >= layout.left - 5 && x <= layout.right + 5 && y >= layout.bottom - 1.8)) return;
    lift.wait -= dt;
    if (lift.wait <= 0) lift.phase = 'up';
  } else if (lift.phase === 'top') {
    if (holdAtTop && lift.carriedRider) return;
    lift.wait -= dt;
    if (lift.wait <= 0) lift.phase = 'down';
  } else if (lift.phase === 'up') {
    lift.y = approach(lift.y, layout.top, layout.speed * dt);
    if (lift.y < layout.top) return;
    lift.phase = 'top';
    lift.wait = 3.8;
    lift.carriedRider = players.some(({ grounded }) => grounded === platform);
  } else {
    lift.y = approach(lift.y, layout.bottom, layout.speed * dt);
    if (lift.y > layout.bottom) return;
    lift.phase = 'bottom';
    lift.wait = 1.7;
  }
}

function setUpStormcoil(match, layout) {
  const { state, rewards } = match.adventure.campaign;
  state.lifts = Object.fromEntries(layout.lifts.map(({ id, bottom }) => [id, { y: bottom, phase: 'bottom', wait: 1.7 }]));
  state.callPressed = false;
  state.holdPressed = false;
  state.rescued = rewards.has('stormcoil-rescue');
  state.checkpointReached = false;
  state.gustWarning = false;
  if (layout.winch) state.winch = { phase: 'idle', time: 0, affected: new Set() };
}

function advanceWinch(match, players, dt, machine) {
  const { winch } = match.adventure.campaign.state;
  if (winch.phase === 'repaired') return;
  if (winch.phase === 'idle' && !players.some(({ x, y }) => x >= machine.x - 9 && y >= machine.floor - 1.6)) return;
  winch.time += dt;
  if (winch.phase === 'idle' && winch.time >= .65) {
    winch.phase = 'warning';
    winch.time = 0;
    match.events.push({ type: 'swing', x: machine.x, y: machine.floor + 1, color: '#ffcc76' });
  } else if (winch.phase === 'warning' && winch.time >= 1.35) {
    winch.phase = 'push';
    winch.time = 0;
    winch.affected.clear();
  } else if (winch.phase === 'push' && winch.time >= .43) {
    winch.phase = 'repair';
    winch.time = 0;
  } else if (winch.phase === 'repair' && winch.time >= 4.25) {
    winch.phase = 'idle';
    winch.time = 0;
  }
  if (winch.phase !== 'push') return;
  for (const player of players) {
    if (winch.affected.has(player.slot) || Math.abs(player.x - machine.x) > 2.6 || Math.abs(player.y - machine.floor) > .85) continue;
    campaignImpact(match, player, machine.x, { damage: 4, force: 2.7, maxLaunch: 4.1, lift: 1.2 });
    winch.affected.add(player.slot);
  }
}

function advanceStormcoil(match, players, dt, layout) {
  const { state, rewards } = match.adventure.campaign;
  const { arena } = match;
  const liftCall = Boolean(layout.call && players.some((player) => at(player, layout.call)));
  if (liftCall && !state.callPressed) {
    state.lifts[layout.call.lift].called = true;
    match.events.push({ type: 'block', x: layout.call.x, y: layout.call.y + .15, color: '#95f4ff' });
  }
  state.callPressed = liftCall;
  state.holdPressed = Boolean(layout.hold && players.some((player) => at(player, layout.hold)));
  for (const lift of layout.lifts) advanceLift(lift, state.lifts[lift.id], arena, players, dt, state.holdPressed);

  const { warning, zones } = arena.environment;
  if (warning && !state.gustWarning) {
    const nearby = zones.find(({ left, right }) => players.some(({ x }) => x >= left - 5 && x <= right + 5));
    if (nearby) match.events.push({ type: 'swing', x: nearby.left, y: nearby.bottom, color: '#baf7ff' });
  }
  state.gustWarning = warning;

  if (layout.rescue && !state.rescued && players.some((player) => at(player, layout.rescue))) {
    const { x, y } = layout.rescue;
    state.rescued = true;
    rewards.add('stormcoil-rescue');
    rewards.add('wind-stabilizer');
    match.events.push({ type: 'block', x, y: y + 1, color: '#a4f9df' });
  }
  if (layout.transferCheckpoint && !state.checkpointReached && players.some(({ grounded }) => grounded?.id === layout.transferCheckpoint.platform)) {
    state.checkpointReached = true;
    setCampaignCheckpoint(match, layout.transferCheckpoint);
  }
  if (layout.winch) advanceWinch(match, players, dt, layout.winch);
}

function stormcoilPrompt(match, layout) {
  const { party, campaign } = match.adventure;
  if (campaign.opened) return undefined;
  const players = party.filter(({ respawn }) => !respawn);
  if (!players.length) return undefined;
  const front = players.reduce((leader, player) => player.x > leader.x ? player : leader);
  if (layout.winch && front.x > layout.winch.x - 5 && front.y > layout.winch.floor - .3) return undefined;
  const riding = campaign.state.lifts[front.grounded?.id];
  if (riding) {
    if (riding.phase !== 'top') return 'Stay on the lift until it stops';
    if (layout.rescue && !campaign.state.rescued && front.grounded.id === 'rescue-lift') return 'Left for Nuvol, right for the next lift';
    return 'Walk off the lift to the right';
  }
  const nearbyLift = layout.lifts.find(({ left, right, bottom }) =>
    front.x >= left - 4 && front.x <= right + 2 && Math.abs(front.y - bottom) < .62);
  if (nearbyLift) return campaign.state.lifts[nearbyLift.id].phase === 'bottom' ? 'Step onto the lift' : 'Wait for the lift to come down';
  return undefined;
}

function stormcoil(level, layout) {
  return {
    ...level,
    environment: stormEnvironment(layout.zones, layout.shelters), airDrift: stormDrift,
    setup(match) { setUpStormcoil(match, layout); },
    advance(match, players, dt) { advanceStormcoil(match, players, dt, layout); },
    prompt(match) { return stormcoilPrompt(match, layout); },
    draw(renderer, campaign, time, view, arena) { drawStormcoil(renderer, campaign, time, view, arena, layout); },
  };
}

const flagLift = { id: 'flags-lift', left: 18.7, right: 26.2, bottom: -.85, top: 4.45, speed: 2.9 };
const rescueLift = { id: 'rescue-lift', left: 13.9, right: 21, bottom: -.65, top: 3.65, speed: 2.8 };
const skyLift = { id: 'sky-lift', left: 27.2, right: 34.8, bottom: 3.4, top: 6.67, speed: 2.65 };
const winchLift = { id: 'winch-lift', left: 15.3, right: 23.15, bottom: 0, top: 4.95, speed: 2.85 };
const winch = { x: 27, floor: 4.55 };

export const stormcoilLevels = [
  stormcoil({
    id: 'stormcoil-windsocks', name: 'Follow the Windsocks',
    introduction: 'Follow the flags. Use the lower path if a gust pushes you off.',
    platforms: [
      deck('arrival', -15, 4), deck('lower-walk', 3.9, 44, -.85),
      ledge('first-shelter', 3, 9.1, 1.05), ledge('second-shelter', 10, 17.35, 1.95),
      liftPlatform(flagLift), deck('exit-deck', 25.9, 46, 4.12),
      ledge('lower-step', 34, 38, .55), ledge('upper-step', 36.4, 41.1, 2.25),
    ],
    lights: [-2, 3],
    camera: { targetY: 2.55, height: 7.5, distance: 25, fov: .65 },
    exit: 41, exitY: 4.07, exitPrompt: 'Walk to the exit!', checkpoint: { platform: 'exit-deck', x: 37 },
    steps: [{ type: 'reach', x: 39.7, y: 4.07, radius: 2.2, prompt: 'Ride the lift to the upper path', marker: false }],
  }, {
    lifts: [flagLift], zones: [{ left: 3.4, right: 23.4, bottom: 1, top: 5.15 }],
    flags: [{ x: 4, y: 1.05 }, { x: 13, y: 1.95 }, { x: 26.2, y: 4.12 }],
    shelters: [{ left: 3, right: 9.1, y: 1.05 }, { left: 10, right: 17.35, y: 1.95 }],
    call: { x: 17.4, y: -.85, radius: 1.4, lift: flagLift.id },
    transferCheckpoint: { platform: 'exit-deck', x: 28.5 },
  }),
  stormcoil({
    id: 'stormcoil-side-passage', name: 'The Side Passage',
    introduction: 'Ride the lifts to the exit. Look left at the first landing to find Nuvol.',
    platforms: [
      deck('arrival', -15, 4), deck('lower-walk', 3.85, 43, -.65),
      ledge('alcove-step', 6.75, 11.4, .95), deck('rescue-alcove', 6.5, 14.9, 3.4),
      liftPlatform(rescueLift), deck('sky-walk', 20.8, 27.9, 3.4),
      liftPlatform(skyLift), deck('exit-deck', 34.55, 46, 6.35),
      ledge('return-step', 37, 42, 1.35), ledge('return-landing', 33, 40.4, 3.25),
      ledge('return-top', 36.4, 42.5, 4.85),
    ],
    lights: [-2, 3],
    camera: { targetY: 3.35, height: 8.4, distance: 26, fov: .67 },
    exit: 41, exitY: 6.3, exitPrompt: 'Walk to the exit!', checkpoint: { platform: 'exit-deck', x: 39 },
    steps: [{ type: 'reach', x: 40, y: 6.3, radius: 2.2, prompt: 'Ride both lifts to reach the exit', marker: false }],
  }, {
    lifts: [rescueLift, skyLift],
    zones: [{ left: 14.3, right: 31.2, bottom: 1.9, top: 7.5 }],
    flags: [{ x: 3, y: 0 }, { x: 23.75, y: 3.4 }, { x: 39, y: 6.35 }],
    shelters: [{ left: 20.8, right: 27.9, y: 3.4 }],
    rescue: { x: 10.75, y: 3.4, radius: 2.05 },
    transferCheckpoint: { platform: 'sky-walk', x: 24 },
  }),
  stormcoil({
    id: 'stormcoil-winch', name: 'The Winch',
    introduction: 'Ride up to the winch. Hit the repair stop while the winch leans out.',
    platforms: [
      deck('arrival', -15, 22.3), deck('lower-walk', 21.9, 37, -1.1),
      ledge('first-step', 14.2, 18.65, 1.65), ledge('second-step', 17.1, 21.65, 3.2),
      liftPlatform(winchLift), deck('work-deck', 22.86, 43, winch.floor),
      ledge('return-step', 33.2, 37, .35), ledge('return-landing', 32.2, 36.25, 2.05), ledge('return-top', 33.4, 39, 3.52),
    ],
    lights: [-2, 4, 9],
    camera: { targetY: 3.1, height: 8.1, distance: 25, fov: .67 },
    gate: 32, gateY: 4.5, exit: 38, exitY: 4.5, checkpoint: { platform: 'work-deck', x: 33.5 },
    steps: [{
      type: 'switch', x: 29.1, y: winch.floor + 1.05,
      ready: (match) => match.adventure.campaign.state.winch.phase === 'repair',
      done(match) { match.adventure.campaign.state.winch.phase = 'repaired'; },
      prompt: 'Hit the repair stop!', waitingPrompt: 'Ride up and wait for the winch to lean',
    }],
  }, {
    lifts: [winchLift], winch,
    zones: [{ left: 8.15, right: 24.25, bottom: 1.55, top: 6.5 }],
    flags: [{ x: 5, y: 0 }, { x: 12.6, y: 0 }, { x: 22.9, y: winch.floor }],
    shelters: [{ left: 22.86, right: 29, y: winch.floor }],
    hold: { x: 12.6, y: 0, radius: 1.35 },
    transferCheckpoint: { platform: 'work-deck', x: 24.3 },
  }),
];
