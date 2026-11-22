import * as rivet from '../fighters/rivet/model.js';
import * as bramble from '../fighters/bramble/model.js';
import * as vesper from '../fighters/vesper/model.js';
import * as kiln from '../fighters/kiln/model.js';
import * as dragonBoy from '../fighters/dragon-boy/model.js';
import * as eid from '../fighters/eid/model.js';
import * as incantus from '../fighters/incantus/model.js';
import * as beina from '../fighters/beina/model.js';
import * as gangar from '../fighters/gangar/model.js';
import * as vi from '../fighters/vi/model.js';
import * as bomm from '../fighters/bomm/model.js';
import * as gioppino from '../fighters/gioppino/model.js';
import * as huuuuu from '../fighters/huuuuu/model.js';
import * as shark67 from '../fighters/shark-67/model.js';
import * as ingaInga from '../fighters/inga-inga/model.js';
import * as bid from '../fighters/bid/model.js';
import * as olivar from '../fighters/olivar/model.js';
import * as packman from '../fighters/packman/model.js';

const models = { rivet, bramble, vesper, kiln, 'dragon-boy': dragonBoy, eid, incantus, beina, gangar, vi, bomm, gioppino, huuuuu, 'shark-67': shark67, 'inga-inga': ingaInga, bid, olivar, packman };
const projectileModels = Object.assign({}, ...Object.values(models).map(({ projectiles }) => projectiles));

export function drawCharacter(renderer, fighter, position, time, options = {}) {
  if (options.zombie) renderer.setZombie(.81);
  models[fighter.id].draw(renderer, fighter, position, time, options);
  if (options.zombie) renderer.setZombie(0);
  if (options.guarding) renderer.object('bevel', [position[0], position[1] + 1.27, position[2]], [2.45, 2.94, 2], '#77dcff', [0, time, 0], .85, .24);
}

export function portraitCamera(fighter) {
  return models[fighter.id].portrait ?? {};
}

export function drawProjectiles(renderer, projectiles, time) {
  for (const projectile of projectiles) projectileModels[projectile.kind](renderer, projectile, time);
}
