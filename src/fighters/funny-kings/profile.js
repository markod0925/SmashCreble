export const fighter = {
  id: 'funny-kings', name: 'Funny Kings', role: 'Two-faced royalty', color: '#bf88dd',
  description: 'Two grinning kings share one suit, one blade arm, and a glove-topped hand bomb.',
  special: 'Tomato Toss', specialDescription: 'Tap B or L to throw a splattering tomato. Hold it to launch a midrange fan of blades.',
  speed: 7.35, jump: 12.75, weight: 1.11, power: 1.08, size: 1.06,
  moves: { light: 'kingsSlaps', tap: 'kingsTomato', hold: 'kingsBlades', super: 'kingsFinale' },
};

export const attacks = {
  kingsSlaps: {
    duration: .49, from: .088, until: .155, range: 1.76, vertical: 1.32, damage: 4, force: 2.8, y: .22, lift: .71,
    followUp: { from: .245, until: .368, range: 2, damage: 6, force: 7.7, y: .48, lift: 2.8 },
  },
  kingsTomato: { duration: .57, from: .16, range: 7.7, projectile: 'kingsTomato' },
  kingsBlades: { duration: .72, from: .24, range: 5.5, projectile: 'kingsBlade', cue: 'bladeVolley' },
  kingsFinale: { duration: 1.03, from: .32, range: 7.5, projectile: 'kingsFinale', cue: 'bladeVolley' },
};

function splatTomato(projectile, match, target) {
  match.events.push({
    type: 'tomatoSplat', x: projectile.x, y: projectile.y, target,
    offsetY: target ? projectile.y - target.y : 0,
    xDir: Math.sign(projectile.vx), color: '#f06c51',
  });
}

function launchTomato(owner, attack, match) {
  const { facing, victims, range } = attack;
  const speed = 13.2;
  match.projectiles.push({
    kind: attack.projectile, owner, victims,
    x: owner.x + facing * .75, y: owner.y + 1.52,
    vx: facing * speed, vy: .93, gravity: 13.2, remaining: range / speed, onImpact: splatTomato,
    hit: { damage: 9, force: 7.1, x: facing, y: .42, lift: 2.7 },
  });
}

const fanBlade = { damage: 15, force: 10 };
const finaleBlade = { damage: 22, force: 15.5 };

function spawnBlade(owner, attack, match, angle, speed, hit) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  match.projectiles.push({
    kind: 'kingsBlade', owner, victims: attack.victims, angle,
    x: owner.x + dx * .51, y: owner.y + 1.46 + dy * .36,
    vx: dx * speed, vy: dy * speed, remaining: attack.range / speed,
    hit: { ...hit, x: dx, y: Math.max(.29, dy), lift: 2.9 },
  });
}

function launchBlades(owner, attack, match) {
  const forward = attack.facing > 0 ? 0 : Math.PI;
  for (const [i, tilt] of [-.17, 0, .19].entries()) {
    spawnBlade(owner, attack, match, forward + tilt, 16.2 + i * .72, fanBlade);
  }
}

function launchFinale(owner, attack, match) {
  const rays = 24;
  for (let i = 0; i < rays; i++) {
    const angle = i * Math.PI * 2 / rays;
    if (i % 2 === 0) {
      spawnBlade(owner, attack, match, angle, 15.6, finaleBlade);
      continue;
    }
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const speed = 12.3;
    match.projectiles.push({
      kind: 'kingsHandBomb', owner, victims: attack.victims, angle,
      x: owner.x + dx * .57, y: owner.y + 1.47 + dy * .45,
      vx: dx * speed, vy: dy * speed, gravity: 2.4, remaining: attack.range / speed,
      blast: 1.19, blastColor: '#f599ac',
      hit: { damage: 21, force: 14.2, y: .57, lift: 3.3 },
    });
  }
}

export const projectiles = { kingsTomato: launchTomato, kingsBlade: launchBlades, kingsFinale: launchFinale };
