import { addCampaignPlatform, campaignImpact, disableCampaignPlatform } from '../combat/campaign.js';
import { clamp } from '../math.js';
import { drawCoreRelayRoom, drawFinalClimb, drawRegulator } from '../render/campaign-regulator.js';
import { floor, ledge } from './campaign-layout.js';

const relayPanel = { ...ledge('relay-glass', 21, 29, .2), visual: false };
const grate = ledge('relay-grate', 29, 36, -.3);
const relaySteps = [
  { type: 'switch', x: 10, y: 1.15, gate: 15, prompt: 'Hit the wind relay', checkpoint: { platform: 'arrival', x: 11 } },
  {
    type: 'switch', x: 23, y: .68, gate: 31, prompt: 'Break the glass panel', marker: false,
    checkpoint: { platform: 'lower-garden', x: 26 },
    done(match) {
      disableCampaignPlatform(match, relayPanel.id);
      addCampaignPlatform(match, grate);
    },
  },
  { type: 'crate', x: 41, y: .8, stop: 47, push: 3, gate: 50, prompt: 'Hit the weight onto its rails' },
];

function relayAirDrift({ x, footY }, { gust }, arena) {
  return x > -1 && x < 13 && footY > .35 && !arena.campaign?.step ? gust : 0;
}

function lift(id, left, right, y, rise, offset = 0) {
  return {
    ...ledge(id, left, right, y),
    motion(_environment, time) {
      const phase = (time + offset) % 7;
      const progress = phase < 4 ? clamp((phase - 1.6) / 1.55, 0, 1) : 1 - clamp((phase - 5) / 1.55, 0, 1);
      return [0, rise * (1 - Math.cos(progress * Math.PI)) / 2];
    },
  };
}

const climbLifts = [lift('core-lift-a', 5, 13, .03, 2.65), lift('core-lift-b', 23, 32, 2.65, 2.58, 1), lift('core-lift-c', 40, 48, 5.2, 2.58)];
const liftDestinations = [2.65, 5.2, 7.75];
const liftWaitingPoint = [7, 25, 42];

function advanceClimb(match, players) {
  const active = Math.min(match.adventure.campaign.step, climbLifts.length - 1);
  const layout = climbLifts[active];
  const platform = match.arena.platforms.find(({ id }) => id === layout.id);
  if (platform.y > layout.y + .045) return;
  for (const player of players) {
    if (!player.grounded || player.grounded === platform || Math.abs(player.y - platform.y) > .28 ||
        player.x < platform.left + .35 || player.x > platform.right - .35) continue;
    player.grounded = platform;
    player.y = platform.y;
  }
}

function climbPrompt(match) {
  const { campaign, party } = match.adventure;
  const active = Math.min(campaign.step, climbLifts.length - 1);
  const layout = climbLifts[active];
  const platform = match.arena.platforms.find(({ id }) => id === layout.id);
  if (party.some((player) => player.grounded === platform && !player.respawn)) {
    return platform.y >= liftDestinations[active] ? 'Walk off the lift to the right' : 'Stay on the lift until it stops';
  }
  if (party.some(({ x, y, respawn }) => !respawn && Math.abs(x - liftWaitingPoint[active]) < 2 && Math.abs(y - layout.y) < .3)) {
    return 'Wait for the lift to come down';
  }
}
const climbSteps = [
  {
    type: 'reach', x: 14.5, y: 2.65, gate: 17, gateY: 2.65, radius: 2,
    prompt: 'Ride the lift to the first shelter', checkpoint: { platform: 'lower-shelter', x: 16 },
    done: (match) => addCampaignPlatform(match, ledge('first-shortcut', 7.5, 13, 1.35)),
  },
  {
    type: 'reach', x: 33.5, y: 5.2, gate: 36, gateY: 5.2, radius: 2,
    prompt: 'Ride the next lift to the shelter', checkpoint: { platform: 'upper-shelter', x: 35 },
    done: (match) => addCampaignPlatform(match, ledge('second-shortcut', 25, 32, 3.95)),
  },
];

const pulsePhases = { idle: 'warning', warning: 'pulse', pulse: 'rest', rest: 'idle' };
const pulseTimes = { idle: .65, warning: 1.35, pulse: .45, rest: 4 };
const pulseRadius = 3.45;

function preparePulse(match) {
  match.adventure.campaign.state.pulse = { phase: 'idle', time: 0, hit: new Set() };
}

function pulseAnchor(campaign) {
  const { x, y } = campaign.steps[Math.min(campaign.step, campaign.steps.length - 1)];
  return { x: x - 2.7, y: Math.max(0, y - 1.1), radius: pulseRadius };
}

function advanceRegulator(match, players, dt) {
  const { campaign } = match.adventure;
  if (campaign.opened) return;
  const { pulse } = campaign.state;
  const source = pulseAnchor(campaign);
  if (pulse.phase === 'idle' && !players.some(({ x }) => Math.abs(x - source.x) < 10)) return;
  pulse.time += dt;
  if (pulse.time >= pulseTimes[pulse.phase]) {
    pulse.time -= pulseTimes[pulse.phase];
    pulse.phase = pulsePhases[pulse.phase];
    if (pulse.phase === 'pulse') {
      pulse.hit.clear();
      match.events.push({ type: 'swing', x: source.x, y: source.y, color: '#f9ab7f' });
    }
  }
  if (pulse.phase !== 'pulse') return;
  for (const player of players) {
    if (pulse.hit.has(player) || Math.abs(player.x - source.x) > source.radius || Math.abs(player.y - source.y) > 1.1) continue;
    if (campaignImpact(match, player, source.x, { damage: 4, force: 2.8, maxLaunch: 5, lift: 1.5 })) pulse.hit.add(player);
  }
}

const recovering = (match) => match.adventure.campaign.state.pulse.phase === 'rest';
const finalSteps = [
  {
    type: 'switch', x: 8, y: 1.1, gate: 13, prompt: 'Hit the first control!',
    checkpoint: { platform: 'arrival', x: 11 }, done: preparePulse,
  },
  {
    type: 'switch', x: 23, y: 2.8, gate: 28, prompt: 'Hit the raised control!',
    checkpoint: { platform: 'raised-control', x: 24 }, done: preparePulse,
  },
  {
    type: 'crate', x: 35, y: .8, stop: 40, push: 2.5, gate: 43,
    prompt: 'Hit the weight toward the stop!', checkpoint: { platform: 'arrival', x: 42 }, done: preparePulse,
  },
  { type: 'switch', x: 49, y: 1.25, gate: 53, prompt: 'Hit the core switch!' },
].map((step) => ({
  ...step, ready: recovering,
  waitingPrompt: (match) => match.adventure.campaign.state.pulse.phase === 'idle'
    ? 'Follow the lights to the control' : 'Wait for the pulse to end',
}));

export const regulatorLevels = [
  {
    id: 'regulator-relays', name: 'The Relay Room',
    introduction: 'Bring the wind, glass, and weight relays back online.', exitPrompt: 'Go to the next room!',
    platforms: [
      floor('arrival', -15, 22), relayPanel, floor('lower-garden', 20, 38, -1.55),
      ledge('return-step', 34, 40, -.8), floor('last-room', 36, 62),
    ],
    lights: [-2, 5, 17, { x: 30, y: -1.55 }, 39], steps: relaySteps, exit: 56,
    checkpoint: { platform: 'last-room', x: 52 },
    environment: (time) => ({ gust: 1.8 * (1 + Math.sin(time * 1.7)) }), airDrift: relayAirDrift,
    prompt(match) {
      const { campaign, party } = match.adventure;
      if (campaign.step === 2 && !campaign.opened && party.some(({ x, y, respawn }) => x > 30 && y < -.3 && !respawn)) {
        return 'Jump up to the weight';
      }
    },
    draw: drawCoreRelayRoom,
  },
  {
    id: 'regulator-climb', name: 'The Final Climb',
    introduction: 'Ride the lifts and follow the lights up to the core.', exitPrompt: 'Ride the last lift to the core!',
    platforms: [
      floor('arrival', -15, 9), ledge('lower-shelter', 11, 27, 2.65), ledge('upper-shelter', 30, 44, 5.2),
      ledge('core-landing', 46, 59, 7.75), ...climbLifts,
    ],
    steps: climbSteps, exit: 54, exitY: 7.75, bounds: { bottom: -3.5 },
    lights: [0, { x: 19, y: 2.65 }, { x: 37, y: 5.2 }, { x: 50, y: 7.75 }],
    advance: advanceClimb, prompt: climbPrompt, draw: drawFinalClimb,
  },
  {
    id: 'regulator-core', name: 'The Regulator',
    introduction: 'Wait for each pulse to finish, then strike the lit control.', exitPrompt: 'Walk through the new connection!',
    platforms: [floor('arrival', -15, 64), ledge('core-step', 14, 19, 1.25), ledge('raised-control', 19, 26, 1.75), ledge('pulse-shelter', 29, 34, 2.8)],
    lights: [0, 14, 29, 44], steps: finalSteps, exit: 56, checkpoint: { platform: 'arrival', x: 53 },
    setup: preparePulse, advance: advanceRegulator,
    draw(renderer, campaign, time, view) {
      drawRegulator(renderer, campaign, time, view, pulseAnchor(campaign));
    },
  },
];
