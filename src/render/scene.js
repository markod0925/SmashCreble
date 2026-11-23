import { rules } from '../combat/arena.js';
import { combatants } from '../combat/state.js';
import { boundTime, captureProgress, capturingAttack, frozenTime, isZombie, shockedTime } from '../combat/status.js';
import { bommBurstScale } from '../fighters/bomm/profile.js';
import { borrowedPower } from '../fighters/bomm/profile.js';
import { drawBoundWrap, drawSarcophagus } from '../fighters/huuuuu/model.js';
import { assaultRemaining } from '../fighters/olivar/companions.js';
import { drawDanceSnake } from '../fighters/shark-67/model.js';
import { drawIce, drawSerpentBind } from '../fighters/vidarr/model.js';
import { playerColors } from '../player-colors.js';
import { drawBattleArena, drawHero } from './arena.js';
import { drawCharacter, drawProjectiles, portraitCamera } from './characters.js';
import { BattleEffects } from './effects.js';
import { TAU, zero } from './math.js';
import { drawShockSkeleton } from './skeleton.js';
import { WebGLRenderer } from './webgl.js';

export class Graphics {
  constructor(canvas) {
    this.renderer = new WebGLRenderer(canvas);
    this.resetBattle();
  }

  resetBattle() {
    this.effects = new BattleEffects();
  }

  addEffects(events) {
    this.effects.add(events);
  }

  hero(fighter, time) {
    drawHero(this.renderer, fighter, time);
  }

  portrait(fighter) {
    const { targetY = 1.77, fov = .423, heading = .18 } = portraitCamera(fighter);
    this.renderer.begin(444, 250, [2.7, 2.73, 6], [.02, targetY, 0], fov);
    drawCharacter(this.renderer, fighter, [0, 0, 0], .08, { heading, pose: true });
    const copy = document.createElement('canvas');
    copy.width = this.renderer.canvas.width;
    copy.height = this.renderer.canvas.height;
    copy.getContext('2d').drawImage(this.renderer.canvas, 0, 0);
    return copy.toDataURL('image/png');
  }

  battle(match, time, dt) {
    const renderer = this.renderer;
    const [width, height] = renderer.measure();
    const horizontalFit = Math.max(1, 1.55 / (width / height));
    const shakeX = this.effects.cameraOffset(time, dt);
    const { x = 0, height: cameraHeight = 7.8, distance = 29.5, targetY = 1.8, fov = .64 } = match.arena.definition.camera ?? {};
    renderer.begin(width, height, [x + shakeX, cameraHeight, distance * horizontalFit], [x + shakeX, targetY, 0], fov);
    drawBattleArena(renderer, match.arena, time);
    const star = match.superstar;
    if (star && !star.holder && !star.cooldown) {
      const y = star.y + Math.sin(time * 4) * .16;
      renderer.object('star', [star.x, y, .69], [1.33, 1.33, .74], '#ffce63', [0, Math.sin(time * 2.6) * .58, Math.sin(time * 3) * .12], .65);
      renderer.object('gem', [star.x, y, .57], [1.72, 1.68, .5], '#ffd878', [0, time, 0], .93, .22);
    }
    const tagPoints = [];
    const dance = match.dance;
    const caseOwners = new Set(match.projectiles.filter(({ kind }) => kind === 'tetheredBriefcase').map(({ owner }) => owner));
    for (const fighter of combatants(match)) {
      const clone = Boolean(fighter.owner);
      const capture = capturingAttack(fighter, match);
      const progress = capture ? captureProgress(capture) : 0;
      if (capture?.sarcophagus) drawSarcophagus(renderer, fighter, progress);
      if (progress >= 1) {
        tagPoints.push(null);
        continue;
      }
      const shrink = capture?.sarcophagus ? 0 : capture?.type === 'gangarGulp' ? progress : Math.pow(progress, 3);
      const burstScale = bommBurstScale(fighter, match);
      const size = fighter.fighter.size * (1 - shrink * .93) * burstScale;
      if (!clone) tagPoints.push(renderer.project(fighter.x, fighter.y + 3.94 * size, .5));
      if (!fighter.stocks || fighter.respawn > 0) continue;
      const depth = clone ? fighter.depth : capture?.type === 'gangarGulp' ? .21 + progress * .87 : .21;
      const shadowScale = (clone ? .5 : 1) * burstScale;
      if (fighter.grounded) renderer.object('disk', [fighter.x, fighter.y + .019, clone ? depth : .2], [1.58 * shadowScale, .026, .95 * shadowScale], '#192731', zero, .87, .58);
      const model = size === fighter.fighter.size ? fighter.fighter : { ...fighter.fighter, size };
      const zombie = isZombie(fighter, match);
      const power = borrowedPower(fighter, match);
      const fuseColor = power && (match.time - power.arrivesAt > 1e-9 ? power.previousColor : power.color);
      const frozen = frozenTime(fighter, match);
      const danceBeat = dance ? dance.elapsed * TAU * 2 + fighter.slot * .7 : 0;
      const dancing = dance && !frozen;
      const sway = dancing ? Math.sin(danceBeat) : 0;
      const bounce = dancing ? Math.abs(Math.cos(danceBeat)) * .18 : 0;
      const poseTime = frozen ? time + frozen : dancing ? danceBeat / 14 : time;
      const shock = shockedTime(fighter, match);
      if (shock > 0) drawShockSkeleton(renderer, model, [fighter.x, fighter.y, depth], fighter.facing, shock);
      else drawCharacter(renderer, model, [fighter.x + sway * .15, fighter.y + bounce, depth], poseTime, {
        heading: fighter.facing * (dance ? .51 : .93) + sway * .31, facing: fighter.facing,
        running: dancing ? .65 : fighter.grounded ? Math.min(1, Math.abs(fighter.vx) / 7) : 0,
        airborne: !dance && !fighter.grounded, verticalSpeed: fighter.vy, landing: fighter.landing, attack: fighter.attack, charging: fighter.charging,
        guarding: fighter.guarding, flash: fighter.invulnerable && Math.sin(time * 55) > .15,
        wobble: frozen ? 0 : dance ? sway * .24 : fighter.stagger ? Math.sin(time * 18) * .18 : capture ? Math.sin(time * 12) * .14 : zombie ? Math.sin(time * 12) * .16 : 0,
        zombie,
        fuseColor,
        caseAway: caseOwners.has(fighter),
        danceTime: dance?.elapsed ?? null,
        leadsDance: dance?.owner === fighter,
        companionClock: rules.duration - match.time - match.countdown + frozen,
        companionAssault: fighter.companionAssault,
        companionRemaining: assaultRemaining(fighter, match),
      });
      const bound = boundTime(fighter, match);
      if (bound > 0) {
        if (fighter.boundStyle === 'serpents') drawSerpentBind(renderer, [fighter.x, fighter.y, depth], size, poseTime);
        else drawBoundWrap(renderer, [fighter.x, fighter.y, depth], fighter.fighter, size, bound);
      }
      if (frozen) drawIce(renderer, [fighter.x, fighter.y, depth], size, frozen);
      if (fighter.poison) {
        for (let i = 0; i < 3; i++) {
          const phase = ((dance?.elapsed ?? time) * 1.35 + i / 3) % 1;
          renderer.object('gem', [fighter.x + Math.sin(phase * TAU + i * 2) * .73 * size, fighter.y + (.64 + phase * 1.96) * size, depth + .85],
            [.12, .17, .12], '#a1ed77', [0, phase * TAU, i], .76, 1 - phase);
        }
      }
      const top = fighter.y + 3.53 * size;
      if (star?.holder === fighter) renderer.object('star', [fighter.x, top, .5], [.52, .52, .4], '#ffdb70', [0, Math.sin(time * 3) * .45, 0], .92);
      else renderer.object('gem', [fighter.x, top, .5], clone ? [.22, .2, .18] : [.36, .33, .27], playerColors[fighter.slot], [0, time, Math.PI], .95);
      if (fighter.stagger || capture?.type === 'incantusChomp') {
        for (const side of [-1, 1]) {
          const angle = side * Math.PI / 2 + time * 7;
          renderer.object('star', [fighter.x + Math.sin(angle) * .65 * size, top - .24 * size, .54 + Math.cos(angle) * .43],
            [.25, .25, .2], '#deaeff', [0, angle, -angle], .94);
        }
      }
      if (fighter.charging) {
        const scale = clone ? .5 : 1;
        const charge = (.35 + fighter.charge * .55) * scale;
        renderer.object('gem', [fighter.x + fighter.facing * .56 * scale, fighter.y + 1.21 * scale, .71], [charge, charge, .34 * scale], '#ffda8f', [0, time * 5, time], 1, .74);
      }
    }
    drawProjectiles(renderer, match.projectiles, time);
    if (dance) {
      for (const snake of dance.snakes) drawDanceSnake(renderer, snake, dance.elapsed);
      this.drawMusic(dance);
    }
    this.effects.draw(renderer, match, time, dt);
    return tagPoints;
  }

  drawMusic({ owner, elapsed }) {
    const renderer = this.renderer;
    for (let i = 0; i < 5; i++) {
      const progress = (elapsed * .9 + i / 5) % 1;
      const x = owner.x - owner.facing * (.42 + progress * 1.39) + Math.sin(progress * TAU + i) * .36;
      const y = owner.y + 2.11 + progress * 2.05;
      const color = ['#ffbe76', '#78f6cd', '#f89eb3'][i % 3];
      const scale = 1 - progress * .51;
      const alpha = Math.min(1, progress * 7, (1 - progress) * 4);
      renderer.object('bevel', [x, y, 1.4], [.225 * scale, .144 * scale, .1], color, [0, 0, .2], .92, alpha);
      renderer.object('box', [x + .09 * scale, y + .125 * scale, 1.4], [.044 * scale, .264 * scale, .063], color, zero, .92, alpha);
      renderer.object('box', [x + .153 * scale, y + .226 * scale, 1.4], [.155 * scale, .047 * scale, .062], color, [0, 0, -.27], .92, alpha);
    }
  }
}
