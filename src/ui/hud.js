import { $, node } from './dom.js';
import { playerColors } from '../player-colors.js';
import { rules } from '../combat/arena.js';
import { boundTime, frozenTime, isZombie } from '../combat/status.js';
import { borrowedPower } from '../fighters/bomm/profile.js';
import { assaultRemaining } from '../fighters/olivar/companions.js';
import { danceSeconds } from '../fighters/shark-67/profile.js';
import { playSound } from '../audio.js';

export class BattleHud {
  constructor(portrait) {
    this.portrait = portrait;
  }

  reset(match) {
    $('hud').replaceChildren();
    $('battle-tags').replaceChildren();
    this.players = match.fighters.map(({ slot, fighter, cpu }) => {
      const card = node('div', 'hud-card');
      card.style.setProperty('--player', playerColors[slot]);
      const amount = node('span', 'damage');
      const stockLine = node('span', 'stocks');
      const stocks = Array.from({ length: rules.stocks }, () => node('span', 'stock'));
      stockLine.append(...stocks);
      const star = node('span', 'hud-star', '★');
      star.title = 'Superattack ready';
      star.hidden = true;
      card.append(this.portrait(fighter, 'hud-face'), node('strong', '', fighter.name), amount, stockLine);
      if (fighter.moves) card.append(star);
      const power = fighter.id === 'bomm' ? node('span', 'hud-power') : null;
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
    const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    if ($('timer').textContent !== timer) $('timer').textContent = timer;
    match.fighters.forEach((fighter, i) => {
      const { card, amount, stockLine, stocks, star, power, tag } = this.players[i];
      const damage = `${Math.floor(fighter.damage)}%`;
      if (amount.textContent !== damage) amount.textContent = damage;
      amount.classList.toggle('danger', fighter.damage >= 80);
      card.classList.toggle('eliminated', !fighter.stocks);
      star.hidden = match.superstar?.holder !== fighter;
      const zombie = isZombie(fighter, match);
      const bound = Math.ceil(boundTime(fighter, match));
      const frozen = Math.ceil(frozenTime(fighter, match));
      const dancing = match.dance ? Math.ceil(danceSeconds - match.dance.elapsed - 1e-9) : 0;
      const sprouts = Math.ceil(assaultRemaining(fighter, match) - 1e-9);
      const status = frozen ? ` · FROZEN ${frozen}s` : dancing ? ` · DANCE ${dancing}s` : bound ? ` · BOUND ${bound}s` : fighter.poison ? ' · POISONED'
        : zombie ? ' · ZOMBIE' : sprouts > 0 ? ` · SPROUTS ${sprouts}s` : '';
      const tagLabel = `P${fighter.slot + 1}${fighter.cpu ? ' CPU' : ''}${status}`;
      if (tag.textContent !== tagLabel) tag.textContent = tagLabel;
      tag.classList.toggle('zombie', zombie);
      tag.classList.toggle('bound', bound > 0);
      tag.classList.toggle('poisoned', Boolean(fighter.poison));
      tag.classList.toggle('dancing', dancing > 0);
      tag.classList.toggle('frozen', frozen > 0);
      if (power) {
        const borrowed = borrowedPower(fighter, match);
        power.hidden = !borrowed || !fighter.stocks;
        if (borrowed) {
          const label = `${borrowed.name} · ${Math.ceil(match.time - borrowed.expiresAt)}s`;
          if (power.textContent !== label) {
            power.textContent = label;
            power.style.color = borrowed.color;
          }
        }
      }
      stockLine.setAttribute('aria-label', `${fighter.stocks} stocks`);
      stocks.forEach((el, stock) => el.classList.toggle('lost', stock >= fighter.stocks));
    });
  }

  updateCountdown(match) {
    const value = Math.ceil(match.countdown);
    if (value !== this.lastCountdown) {
      this.lastCountdown = value;
      $('countdown').textContent = value || 'FIGHT!';
      playSound(value ? 'countdown' : 'go');
    }
    $('countdown').hidden = !value && match.time < rules.duration - .68;
  }

  updateTags(match, points) {
    points.forEach((point, i) => {
      const player = match.fighters[i];
      const tag = this.players[i].tag;
      const [x, y] = point ?? [-1, -1];
      tag.hidden = !player.stocks || player.respawn > 0 || x < 1 || x > 99 || y < 2 || y > 91;
      tag.style.left = `${x}%`;
      tag.style.top = `${y}%`;
    });
  }
}
