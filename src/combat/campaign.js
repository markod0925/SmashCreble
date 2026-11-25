import { campaignArena } from '../arenas/campaign-layout.js';
import { approach, clamp, direction } from '../math.js';
import { createPlatform, platformCenter } from './arena.js';
import { strike } from './hits.js';
import { bodyCenter, createMatch, spawn } from './state.js';

const guardSource = { fighter: { power: 1, color: '#e29c65' }, team: 'enemies' };
const phases = { idle: 'warning', warning: 'active', active: 'rest', rest: 'idle' };
const phaseTimes = { idle: .75, warning: 1.15, active: .9, rest: 3 };

export function createCampaignMatch(lineup, level, { module = null, rewards = [] } = {}) {
  const humans = lineup.filter(({ cpu }) => !cpu);
  if (!humans.length) throw new RangeError('Campaign requires a human player.');
  const match = createMatch(humans, campaignArena(level, module));
  for (const player of match.fighters) player.team = 'party';
  const { guard } = level;
  const steps = level.steps ?? (level.objective ? [level.objective] : []);
  const campaign = {
    level, steps, step: 0, objective: createObjective(steps[0]), opened: !steps.length,
    hits: new WeakMap(), state: {}, module, rewards: new Set(rewards),
    guard: guard && { ...guard, phase: 'idle', time: 0, facing: -1, hit: new Set() },
  };
  match.adventure = { party: [...match.fighters], enemies: [], campaign };
  match.arena.campaign = campaign;
  level.setup?.(match);
  return match;
}

function createObjective(step) {
  return step && { ...step, targetX: step.x };
}

export function campaignObjectiveReady(match) {
  const { campaign } = match.adventure;
  return campaign.objective?.ready?.(match) ?? (campaign.guard?.type !== 'keeper' || campaign.guard.phase === 'rest');
}

export function campaignPrompt(campaign, match) {
  const { level, objective } = campaign;
  const guidance = match && level.prompt?.(match);
  if (guidance) return guidance;
  if (campaign.opened) return level.exitPrompt ?? (level.bridge ? 'Cross the bridge!' : 'Go through the gate!');
  if (match ? !campaignObjectiveReady(match) : campaign.guard?.type === 'keeper' && campaign.guard.phase !== 'rest') {
    if (typeof objective.waitingPrompt === 'function') return objective.waitingPrompt(match);
    return objective.waitingPrompt ?? 'Wait for the keeper to rest';
  }
  if (objective.prompt) return objective.prompt;
  if (objective.type === 'crate') return 'Hit the crate toward the stop';
  return objective.type === 'reach' ? 'Follow the marker!' : 'Hit the switch!';
}

function touchesObjective({ x, y }, hitX, hitY, width, height) {
  return Math.abs(x - hitX) <= width && Math.abs(y - hitY) <= height;
}

export function campaignObjectHit(match, players, object) {
  const { campaign } = match.adventure;
  let usedAttacks = campaign.hits.get(object);
  if (!usedAttacks) {
    usedAttacks = new WeakSet();
    campaign.hits.set(object, usedAttacks);
  }
  for (const player of players) {
    const { attack } = player;
    if (!attack?.fired || attack.age > (attack.until ?? attack.from + .12) || usedAttacks.has(attack)) continue;
    const dx = object.x - player.x;
    if (!attack.all && dx * attack.facing < -.75) continue;
    if (!touchesObjective(object, player.x, player.y + bodyCenter(player, match) + (attack.offset ?? 0),
      (attack.range ?? 1.5) + (object.hitWidth ?? .85), (attack.vertical ?? 1) + (object.hitHeight ?? .45))) continue;
    usedAttacks.add(attack);
    return true;
  }
  for (const projectile of match.projectiles) {
    if (projectile.owner.team !== 'party' || usedAttacks.has(projectile) ||
        !touchesObjective(object, projectile.x, projectile.y, object.hitWidth ?? .95, object.hitHeight ?? 1.05)) continue;
    usedAttacks.add(projectile);
    return true;
  }
  return false;
}

function spawnEntry(platform, x) {
  const inset = Math.min(1, (platform.right - platform.left) / 2);
  const position = clamp(x, platform.left + inset, platform.right - inset);
  return { platform: platform.id, x: (position - platformCenter(platform)) / Math.cos(platform.angle), facing: 1 };
}

export function setCampaignCheckpoint(match, { platform: id, x }) {
  const platform = match.arena.platforms.find((platform) => platform.id === id);
  if (!platform || platform.inactive) throw new RangeError(`Campaign checkpoint platform is unavailable: ${id}`);
  const { party } = match.adventure;
  match.adventure.checkpoint = [];
  for (const [index, player] of party.entries()) match.adventure.checkpoint[player.slot] = spawnEntry(platform, x - index * 1.4);
}

export function addCampaignPlatform(match, layout) {
  const { arena } = match;
  const existing = arena.platforms.find(({ id }) => id === layout.id);
  if (existing) {
    existing.inactive = false;
    return existing;
  }
  const platform = createPlatform(layout, arena);
  arena.platforms.push(platform);
  return platform;
}

export function disableCampaignPlatform(match, id) {
  const platform = match.arena.platforms.find((item) => item.id === id);
  if (!platform) return;
  platform.inactive = true;
  for (const player of [...match.fighters, ...match.clones]) {
    if (player.grounded === platform) player.grounded = null;
  }
}

export function campaignImpact(match, player, x, { damage = 5, force = 3.5, maxLaunch = 6, lift = 2 } = {}) {
  return strike({ ...guardSource, x }, player, { damage, force, maxLaunch, x: direction(player.x - x), y: .5, lift }, match);
}

function completeCampaignStep(match) {
  const { campaign } = match.adventure;
  const { objective, level } = campaign;
  objective.done?.(match);
  if (objective.checkpoint) setCampaignCheckpoint(match, objective.checkpoint);
  match.events.push({ type: 'block', x: objective.x, y: objective.y, color: '#ffdf8e' });
  const next = campaign.steps[++campaign.step];
  if (next) {
    campaign.objective = createObjective(next);
    return;
  }
  campaign.opened = true;
  if (level.bridge) addCampaignPlatform(match, level.bridge);
  if (level.checkpoint) setCampaignCheckpoint(match, level.checkpoint);
}

function advanceObjective(match, players, dt) {
  const { campaign } = match.adventure;
  if (campaign.opened) return;
  const { objective } = campaign;
  const ready = campaignObjectiveReady(match);
  if (objective.type === 'crate') {
    if (ready && campaignObjectHit(match, players, objective)) objective.targetX = Math.min(objective.stop, objective.targetX + objective.push);
    objective.x = approach(objective.x, objective.targetX, 11 * dt);
    if (objective.x === objective.stop) completeCampaignStep(match);
    return;
  }
  if (!ready) return;
  if (objective.type === 'reach') {
    const reached = players.some(({ x, y, grounded }) => grounded &&
      Math.abs(x - objective.x) <= (objective.radius ?? 1.8) && y >= (objective.minY ?? objective.y) - .3);
    if (reached) completeCampaignStep(match);
    return;
  }
  if (campaignObjectHit(match, players, objective)) completeCampaignStep(match);
}

function advanceGuard(guard, players, match, dt) {
  if (!guard || match.adventure.campaign.opened) return;
  if (guard.phase === 'idle' && !players.some(({ x }) => Math.abs(x - guard.x) < 13)) return;
  guard.time += dt;
  if (guard.time >= phaseTimes[guard.phase]) {
    guard.time = 0;
    guard.phase = phases[guard.phase];
    if (guard.phase === 'warning') {
      const target = players.reduce((nearest, player) => Math.abs(player.x - guard.x) < Math.abs(nearest.x - guard.x) ? player : nearest);
      guard.facing = direction(target.x - guard.x, -1);
    } else if (guard.phase === 'active') {
      guard.hit.clear();
      match.events.push({ type: 'swing', x: guard.x, y: .3, color: guardSource.fighter.color });
    }
  }
  if (guard.phase !== 'active') return;
  if (guard.type === 'sentry') guard.x = clamp(guard.x + guard.facing * guard.speed * dt, guard.left, guard.right);
  for (const player of players) {
    if (guard.hit.has(player) || player.y > 1.4 || Math.abs(player.x - guard.x) > (guard.type === 'keeper' ? 2.8 : 1.2)) continue;
    if (campaignImpact(match, player, guard.x)) guard.hit.add(player);
  }
}

function bringPartyTogether(match, players) {
  const leader = players.reduce((lead, player) => player.x > lead.x ? player : lead);
  const platform = leader.grounded;
  if (!platform || platform.inactive) return;
  for (const player of players) {
    if (leader.x - player.x < 15 && leader.y - player.y < 8) continue;
    const entry = spawnEntry(platform, leader.x - 2 - player.slot);
    Object.assign(player, spawn(player.slot, true, player.fighter, match.arena, entry), { invulnerable: 1.5 });
  }
}

export function advanceCampaign(match, dt) {
  const { campaign, party } = match.adventure;
  const players = party.filter(({ respawn }) => !respawn);
  if (!players.length) return;
  advanceGuard(campaign.guard, players, match, dt);
  const { level } = campaign;
  level.advance?.(match, players, dt);
  advanceObjective(match, players, dt);
  bringPartyTogether(match, players);
  if (campaign.opened && players.some(({ x, y, grounded }) => grounded && x >= level.exit && y >= (level.exitY ?? -Infinity) - .35)) {
    match.result = { completed: true };
  }
}
