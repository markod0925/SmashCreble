let sound = true;
let audio;
let danceBeat = -1;
let playingDance;
const musicVoices = new Set();

export function audioReady() {
  if (!sound || !window.AudioContext) return;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
}

const soundEffects = {
  select: [430, 680, .085, 'sine', .12],
  countdown: [300, 380, .13, 'triangle', .15],
  go: [450, 720, .19, 'triangle', .17],
  swing: [180, 74, .07, 'triangle', .09],
  jump: [230, 420, .08, 'sine', .1],
  hit: [171, 52, .13, 'square', .075],
  ko: [380, 52, .35, 'sawtooth', .14],
  special: [300, 680, .16, 'triangle', .12],
  superstar: [550, 1030, .24, 'sine', .16],
  blink: [260, 870, .19, 'triangle', .14],
  chomp: [235, 54, .19, 'square', .09],
  laser: [860, 315, .15, 'sawtooth', .095],
  cloneIn: [560, 1040, .25, 'sine', .135],
  clonePop: [600, 230, .13, 'triangle', .095],
  powerSteal: [360, 920, .28, 'sine', .13],
  explosion: [146, 39, .24, 'triangle', .18],
  zombieBite: [239, 84, .18, 'triangle', .12],
  bandageBind: [510, 172, .23, 'triangle', .1],
  coffinBurst: [168, 47, .32, 'triangle', .19],
  poison: [421, 244, .17, 'triangle', .10],
  lanceThrow: [280, 108, .17, 'triangle', .1],
  swordSlash: [630, 249, .21, 'triangle', .13],
  bladeVolley: [875, 333, .23, 'triangle', .14],
  packmanTrace: [310, 1090, .31, 'triangle', .17],
  pincoTrace: [360, 1220, .34, 'triangle', .16],
  frost: [1140, 514, .31, 'sine', .17],
  frostBite: [430, 94, .24, 'triangle', .17],
  serpentBind: [420, 132, .23, 'sawtooth', .055],
  tomatoSplat: [283, 51, .16, 'triangle', .16],
  nuvolBolt: [850, 103, .24, 'sawtooth', .14],
  shockEcho: [690, 233, .11, 'triangle', .079],
  shout: [520, 812, .32, 'triangle', .115],
  shove: [260, 53, .22, 'triangle', .17],
  dazzleBurst: [420, 1430, .48, 'sine', .14],
  wandLightning: [1290, 110, .32, 'sawtooth', .105],
  toothShot: [550, 230, .066, 'triangle', .088],
  cerberoSit: [136, 36, .48, 'triangle', .19],
  zunchyShrink: [975, 259, .43, 'sine', .16],
  block: [700, 450, .12, 'triangle', .09],
  break: [650, 89, .25, 'sawtooth', .09],
  finish: [450, 910, .39, 'triangle', .13],
};

export function playSound(effect) {
  if (!sound || audio?.state !== 'running') return;
  const [start, end, duration, wave, level] = soundEffects[effect];
  const voice = audio.createOscillator();
  const gain = audio.createGain();
  const time = audio.currentTime;
  voice.type = wave;
  voice.frequency.setValueAtTime(start, time);
  voice.frequency.exponentialRampToValueAtTime(end, time + duration);
  gain.gain.setValueAtTime(.001, time);
  gain.gain.linearRampToValueAtTime(level, time + .014);
  gain.gain.exponentialRampToValueAtTime(.001, time + duration);
  voice.connect(gain).connect(audio.destination);
  voice.start(time);
  voice.stop(time + duration);
}

const leadNotes = [72, 75, 79, 77, 75, 82, 79, 75, 70, 74, 77, 79, 74, 77, 82, 77];
const bassNotes = [36, 36, 43, 36, 39, 39, 46, 39, 34, 34, 41, 34, 31, 31, 43, 31];

function danceNote(midi, duration, wave, volume) {
  if (duration <= .015) return;
  const time = audio.currentTime;
  const voice = audio.createOscillator();
  const gain = audio.createGain();
  voice.type = wave;
  voice.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  gain.gain.setValueAtTime(.001, time);
  gain.gain.linearRampToValueAtTime(volume, time + .012);
  gain.gain.exponentialRampToValueAtTime(.001, time + duration);
  voice.connect(gain).connect(audio.destination);
  voice.onended = () => {
    musicVoices.delete(voice);
    voice.disconnect();
    gain.disconnect();
  };
  musicVoices.add(voice);
  voice.start(time);
  voice.stop(time + duration);
}

export function updateDanceMusic(dance) {
  if (!dance || !sound || audio?.state !== 'running') {
    if (playingDance) {
      for (const voice of musicVoices) voice.stop();
      playingDance = null;
      danceBeat = -1;
    }
    return;
  }
  const beatLength = .25;
  const beat = Math.floor(dance.elapsed / beatLength);
  if (playingDance === dance && danceBeat === beat) return;
  playingDance = dance;
  danceBeat = beat;
  const length = (beat + 1) * beatLength - dance.elapsed;
  danceNote(leadNotes[beat % leadNotes.length], length * .86, 'square', .035);
  danceNote(bassNotes[beat % bassNotes.length], length * .96, 'triangle', .095);
}

export function toggleSound() {
  sound = !sound;
  if (!sound) updateDanceMusic(null);
  return sound;
}
