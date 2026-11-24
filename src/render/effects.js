import { TAU, zero } from './math.js';
import { powerStealCloud } from '../fighters/bomm/model.js';
import { powerStealTravelTime } from '../fighters/bomm/profile.js';
import { drawTomatoSplat } from '../fighters/funny-kings/model.js';
import { drawThunderbolt } from '../fighters/nuvol/model.js';
import { drawShockSkeleton } from './skeleton.js';
import { drawTrace67 } from './trace.js';

export class BattleEffects {
  constructor() {
    this.effects = [];
    this.shake = 0;
  }

  cameraOffset(time, dt) {
    this.shake = Math.max(0, this.shake - dt * 1.4);
    return Math.sin(time * 81) * this.shake;
  }

  add(events) {
    for (const event of events) {
      if (event.type === 'swing') continue;
      if (event.type === 'powerSteal') {
        this.effects.push({ ...event, lifetime: powerStealTravelTime, age: 0 });
        continue;
      }
      if (event.tracePath) {
        this.effects.push({ ...event, lifetime: event.duration + event.afterglow, age: 0 });
        continue;
      }
      if (event.type === 'tomatoSplat') {
        this.effects.push({ ...event, lifetime: .55, age: 0 });
        continue;
      }
      if (event.type === 'nuvolBolt' || event.type === 'shockEcho') {
        this.effects.push({ ...event, lifetime: .29, age: 0 });
        continue;
      }
      if (event.type === 'explosion') {
        this.effects.push({ ...event, type: 'blastFlash', lifetime: .32, age: 0 });
        this.shake = Math.max(this.shake, Math.min(.26, event.strength * .066));
      }
      const count = { ko: 33, hit: 13, block: 8, break: 16, jump: 5, special: 15, superstar: 20, blink: 14, chomp: 17, laser: 8, cloneIn: 8, clonePop: 11, explosion: 22, zombieBite: 12, bandageBind: 10, coffinBurst: 18, poison: 9, lanceThrow: 5, swordSlash: 12, bladeVolley: 15, frost: 14, frostBite: 19, serpentBind: 10, shove: 10 }[event.type] ?? 0;
      const lifetime = event.type === 'ko' ? .75 : .35;
      const force = event.type === 'ko' ? 8 : event.type === 'hit' ? 5 : event.type === 'explosion' ? 3 + event.strength : 2.7;
      for (let i = 0; i < count; i++) {
        const angle = i * TAU / count;
        const speed = force * (.42 + Math.random());
        this.effects.push({ ...event, vx: Math.cos(angle) * speed + (event.xDir ?? 0) * 1.2, vy: Math.sin(angle) * speed, z: .76 + Math.random(), lifetime, age: 0, angle });
      }
      if (event.type === 'hit' || event.type === 'ko') this.shake = Math.max(this.shake, event.type === 'ko' ? .32 : Math.min(.18, event.strength * .006));
    }
  }

  draw(renderer, match, time, dt) {
    for (const effect of this.effects) {
      effect.age = effect.startedAt === undefined ? effect.age + dt : effect.startedAt - match.time;
      if (effect.age >= effect.lifetime) continue;
      if (effect.type === 'powerSteal') {
        if (effect.target.stocks && !effect.target.respawn) powerStealCloud(renderer, effect, match, time);
        continue;
      }
      if (effect.tracePath) {
        drawTrace67(renderer, effect);
        continue;
      }
      if (effect.type === 'tomatoSplat') {
        drawTomatoSplat(renderer, effect);
        continue;
      }
      if (effect.type === 'nuvolBolt') {
        drawThunderbolt(renderer, effect);
        continue;
      }
      if (effect.type === 'shockEcho') {
        drawShockSkeleton(renderer, effect.fighter, [effect.x, effect.y, effect.depth], effect.facing, effect.lifetime - effect.age);
        continue;
      }
      const life = 1 - effect.age / effect.lifetime;
      if (effect.type === 'blastFlash') {
        const radius = effect.strength * (.24 + (1 - life) * .81);
        renderer.object('bevel', [effect.x, effect.y + .16, .65], [radius * 2, radius * 1.23, radius * .8], '#ff995c', [0, time, .21], .94, .61 * life);
        renderer.object('gem', [effect.x, effect.y + .25, .99], [radius * 1.3, radius * .88, radius * .63], '#ffedab', [.15, time * 1.7, .3], 1, .7 * life);
        continue;
      }
      const scale = Math.max(.01, life * (effect.type === 'ko' ? .42 : .22));
      if (effect.type === 'blink') {
        renderer.object('box', [effect.x + effect.vx * effect.age * .6, effect.y + effect.vy * effect.age * 1.7, effect.z], [scale * .42, scale * 3.8, scale * .42], effect.color, zero, .95, life);
      } else if (effect.type === 'cloneIn' || effect.type === 'clonePop') {
        renderer.object('star', [effect.x + effect.vx * effect.age, effect.y + effect.vy * effect.age, effect.z], [scale * 1.5, scale * 1.5, scale], effect.color, [0, effect.angle, effect.age * 7], .94, life);
      } else renderer.object('gem', [effect.x + effect.vx * effect.age, effect.y + effect.vy * effect.age, effect.z], [scale * 1.6, scale, scale], effect.color, [0, effect.angle, effect.age * 8], .9, life);
    }
    this.effects = this.effects.filter((effect) => effect.age < effect.lifetime);
  }
}
