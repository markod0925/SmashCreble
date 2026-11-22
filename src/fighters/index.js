import * as rivet from './rivet/profile.js';
import * as bramble from './bramble/profile.js';
import * as vesper from './vesper/profile.js';
import * as kiln from './kiln/profile.js';
import * as dragonBoy from './dragon-boy/profile.js';
import * as eid from './eid/profile.js';
import * as incantus from './incantus/profile.js';
import * as beina from './beina/profile.js';
import * as gangar from './gangar/profile.js';
import * as vi from './vi/profile.js';
import * as bomm from './bomm/profile.js';
import * as gioppino from './gioppino/profile.js';
import * as huuuuu from './huuuuu/profile.js';
import * as shark67 from './shark-67/profile.js';
import * as ingaInga from './inga-inga/profile.js';
import * as bid from './bid/profile.js';
import * as olivar from './olivar/profile.js';
import * as packman from './packman/profile.js';

const roster = [rivet, bramble, vesper, kiln, dragonBoy, eid, incantus, beina, gangar, vi, bomm, gioppino, huuuuu, shark67, ingaInga, bid, olivar, packman];

export const fighters = roster.map(({ fighter }) => fighter);
export const signatureAttacks = Object.assign({}, ...roster.map(({ attacks }) => attacks));
export const projectileLaunchers = Object.assign({}, ...roster.map(({ projectiles }) => projectiles));
