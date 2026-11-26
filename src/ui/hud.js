import { $, node } from './dom.js';
import { enemyColor, playerColors } from '../player-colors.js';
import { defeatedEnemies } from '../combat/adventure.js';
import { rules } from '../combat/arena.js';
import { campaignPrompt } from '../combat/campaign.js';
import { isDancing } from '../combat/dance.js';
import { boundTime, dazedTime, frozenTime, isZombie, sleepTime, slowTime } from '../combat/status.js';
import { borrowedPower } from '../fighters/bomm/profile.js';
import { mirrorTime } from '../fighters/mimora/mirror.js';
import { assaultRemaining } from '../fighters/olivar/companions.js';
import { danceSeconds } from '../fighters/shark-67/profile.js';
import { playSound } from '../audio.js';
import { clamp } from '../math.js';

export class BattleHud {
  constructor(portrait) {
    this.portrait = portrait;
  }

  reset(match) {
    $('hud').replaceChildren();
    $('battle-tags').replaceChildren();
    const { adventure, mobSmash } = match;
    $('timer').setAttribute('aria-label', adventure?.campaign ? 'Current objective' : adventure ? 'Adventure progress' : mobSmash ? 'KO progress' : 'Time remaining');
    $('timer').setAttribute('aria-live', adventure?.campaign || mobSmash ? 'polite' : 'off');
    this.enemies = new Map();
    this.players = (adventure?.party ?? mobSmash?.party ?? match.fighters).map(({ slot, fighter, cpu }) => {
      const card = node('div', 'hud-card');
      card.style.setProperty('--player', playerColors[slot]);
      const amount = node('span', 'damage');
      const stockLine = node('span', 'stocks');
      stockLine.hidden = Boolean(match.adventure?.campaign);
      const stocks = Array.from({ length: rules.stocks }, () => node('span', 'stock'));
      stockLine.append(...stocks);
      const star = node('span', 'hud-star', '★');
      star.title = 'Superattack ready';
      star.hidden = true;
      card.append(this.portrait(fighter, 'hud-face'), node('strong', '', fighter.name), amount, stockLine);
      if (fighter.moves) card.append(star);
      const power = ['bomm', 'budino', 'mimora'].includes(fighter.id) ? node('span', 'hud-power') : null;
      if (power) {
        power.hidden = true;
        card.append(power);
      }
      $('hud').append(card);
      const tag = node('span', 'player-tag', `P${slot + 1}${cpu ? ' CPU' : ''}`);
      tag.style.setProperty('--player', playerColors[slot]);
      $('battle-tags').append(tag);
      return { card, amount, stockLine, stocks, tag, star, power };
    });
    this.lastCountdown = Math.ceil(match.countdown);
    const countdown = $('countdown');
    countdown.hidden = false;
    countdown.textContent = String(this.lastCountdown);
  }

  update(match) {
    const seconds = Math.ceil(match.time);
    const { adventure, mobSmash } = match;
    const timer = adventure?.campaign ? campaignPrompt(adventure.campaign, match)
      : adventure ? `Defeated ${defeatedEnemies(adventure)} / ${adventure.totalEnemies}`
      : mobSmash ? `KOs ${defeatedEnemies(mobSmash)} / ${mobSmash.totalEnemies}`
      : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    if ($('timer').textContent !== timer) $('timer').textContent = timer;
    const challenge = adventure ?? mobSmash;
    const party = challenge?.party ?? match.fighters;
    if (challenge) this.updateEnemies(challenge.enemies);
    party.forEach((fighter, i) => {
      const { card, amount, stockLine, stocks, star, power, tag } = this.players[i];
      const damage = `${Math.floor(fighter.damage)}%`;
      if (amount.textContent !== damage) amount.textContent = damage;
      amount.classList.toggle('danger', fighter.damage >= 80);
      card.classList.toggle('eliminated', !fighter.stocks);
      star.hidden = match.superstar?.holder !== fighter;
      const zombie = isZombie(fighter, match);
      const bound = Math.ceil(boundTime(fighter, match));
      const frozen = Math.ceil(frozenTime(fighter, match));
      const dazed = Math.ceil(dazedTime(fighter, match));
      const sleeping = Math.ceil(sleepTime(fighter, match));
      const slowed = Math.ceil(slowTime(fighter, match));
      const dancing = isDancing(fighter, match) ? Math.ceil(danceSeconds - match.dance.elapsed - 1e-9) : 0;
      const sprouts = Math.ceil(assaultRemaining(fighter, match) - 1e-9);
      const status = sleeping ? ` · ASLEEP ${sleeping}s` : dazed ? ` · DAZED ${dazed}s` : frozen ? ` · FROZEN ${frozen}s` : dancing ? ` · DANCE ${dancing}s` : bound ? ` · BOUND ${bound}s` : fighter.poison ? ' · POISONED'
        : zombie ? ' · ZOMBIE' : slowed ? ` · SLOWED ${slowed}s` : sprouts > 0 ? ` · SPROUTS ${sprouts}s` : '';
      const tagLabel = `P${fighter.slot + 1}${fighter.cpu ? ' CPU' : ''}${status}`;
      if (tag.textContent !== tagLabel) tag.textContent = tagLabel;
      tag.classList.toggle('zombie', zombie);
      tag.classList.toggle('bound', bound > 0);
      tag.classList.toggle('poisoned', Boolean(fighter.poison));
      tag.classList.toggle('dancing', dancing > 0);
      tag.classList.toggle('frozen', frozen > 0);
      tag.classList.toggle('dazed', dazed > 0);
      if (power) {
        const borrowed = borrowedPower(fighter, match);
        const reserve = !fighter.respawn && fighter.reserveAmmo;
        const mirrored = Math.ceil(mirrorTime(fighter, match));
        const label = mirrored ? `${fighter.fighter.name} · ${mirrored}s`
          : borrowed ? `${borrowed.name} · ${Math.ceil(match.time - borrowed.expiresAt)}s` : reserve ? `RESERVE · ${reserve}` : '';
        power.hidden = !label || !fighter.stocks;
        if (power.textContent !== label) {
          power.textContent = label;
          power.style.color = borrowed?.color ?? fighter.fighter.color;
        }
      }
      stockLine.setAttribute('aria-label', `${fighter.stocks} stocks`);
      stocks.forEach((el, stock) => el.classList.toggle('lost', stock >= fighter.stocks));
    });
  }

  updateEnemies(enemies) {
    for (const [enemy, tag] of this.enemies) {
      if (enemy.stocks) continue;
      tag.remove();
      this.enemies.delete(enemy);
    }
    for (const enemy of enemies) {
      if (!enemy.stocks) continue;
      let tag = this.enemies.get(enemy);
      if (!tag) {
        tag = node('span', 'player-tag enemy-tag');
        tag.style.setProperty('--player', enemyColor);
        this.enemies.set(enemy, tag);
        $('battle-tags').append(tag);
      }
      const label = `${enemy.fighter.name} · ${Math.floor(enemy.damage)}%`;
      if (tag.textContent !== label) tag.textContent = label;
    }
  }

  updateCountdown(match) {
    const value = Math.ceil(match.countdown);
    if (value !== this.lastCountdown) {
      this.lastCountdown = value;
      $('countdown').textContent = value || (match.adventure ? 'GO!' : 'FIGHT!');
      playSound(value ? 'countdown' : 'go');
    }
    $('countdown').hidden = !value && match.time < rules.duration - .68;
  }

  updateTags(match, points) {
    points.forEach((point, i) => {
      const player = match.fighters[i];
      const tag = this.players[i]?.tag ?? this.enemies.get(player);
      if (!tag) return;
      const [x, y] = point ?? [-1, -1];
      const offscreenParty = Boolean(match.adventure && point && !player.cpu && (x < 2 || x > 98));
      tag.hidden = !player.stocks || player.respawn > 0 || (!offscreenParty && (x < 1 || x > 99 || y < 2 || y > 91));
      tag.classList.toggle('offscreen-left', offscreenParty && x < 2);
      tag.classList.toggle('offscreen-right', offscreenParty && x > 98);
      tag.style.left = `${offscreenParty ? clamp(x, 4, 96) : x}%`;
      tag.style.top = `${offscreenParty ? clamp(y, 15, 82) : y}%`;
    });
  }
}
