import { $, node, button } from './dom.js';
import { defeatedEnemies } from '../combat/adventure.js';
import { fighterIdentity } from '../fighters/mimora/mirror.js';

const dialog = $('dialog');
const content = $('dialog-content');

export function showDialog(type, kicker, title) {
  $('dialog-kicker').textContent = kicker;
  $('dialog-title').textContent = title;
  $('close-dialog').hidden = type === 'results';
  content.replaceChildren();
  if (!dialog.open) dialog.showModal();
}

export function hideDialog() {
  if (dialog.open) dialog.close();
}

export function handleDismiss(dismiss) {
  $('close-dialog').addEventListener('click', dismiss);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismiss(); });
}

export function renderControls(hasTouch) {
  content.append($('controls-template').content.cloneNode(true));
  content.querySelector('.touch-guide').hidden = !hasTouch;
  const scroller = content.querySelector('.controls-scroll');
  scroller.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    scroller.scrollLeft += (event.key === 'ArrowLeft' ? -1 : 1) * scroller.clientWidth * .15;
  });
  $('close-dialog').focus();
}

export function renderPause(disconnected, resumeMatch, goHome, leaveLabel = 'Return to roster') {
  const actions = node('div', 'dialog-actions');
  const resume = button('Resume', resumeMatch, 'primary-button');
  resume.disabled = Boolean(disconnected);
  actions.append(resume, button(leaveLabel, goHome));
  if (disconnected) content.append(node('p', 'dialog-note', 'Reconnect the controller and press A to reclaim its seat.'));
  content.append(actions);
  (resume.disabled ? actions.lastElementChild : resume).focus();
}

export function renderCampaignMap(acts, completed, chooseLevel, rewardOptions) {
  const navigation = node('div', 'campaign-acts');
  navigation.setAttribute('aria-label', 'Campaign acts');
  const heading = node('h3', 'campaign-act-name');
  const list = node('ol', 'campaign-levels');
  const actButtons = acts.map((act, index) => {
    const control = button(`Act ${act.numeral}`, () => showAct(index));
    control.setAttribute('aria-label', `Act ${act.numeral} ${act.name}`);
    navigation.append(control);
    return control;
  });
  function showAct(active) {
    const act = acts[active];
    heading.textContent = act.name;
    actButtons.forEach((control, index) => control.setAttribute('aria-pressed', String(index === active)));
    list.replaceChildren();
    const offset = acts.slice(0, active).reduce((sum, item) => sum + item.levels.length, 0);
    for (const [position, level] of act.levels.entries()) {
      const index = offset + position;
      const row = node('li');
      const label = `${index + 1}. ${level.name}`;
      const levelButton = button(index === completed ? `${label} · Play` : label, () => chooseLevel(level), index === completed ? 'primary-button' : 'text-button');
      levelButton.disabled = index > completed;
      row.append(levelButton, node('span', '', index < completed ? 'Cleared' : index > completed ? 'Locked' : ''));
      list.append(row);
    }
  }
  content.append(navigation, heading, list);
  if (rewardOptions?.rescued) content.append(node('p', 'campaign-reward', 'Nuvol rescued'));
  if (rewardOptions?.unlocked) {
    let equipped = rewardOptions.equipped;
    const toggle = button('', () => { equipped = rewardOptions.toggle(); updateToggle(); });
    function updateToggle() {
      toggle.textContent = `Wind stabilizer ${equipped ? 'on' : 'off'}`;
      toggle.setAttribute('aria-pressed', String(equipped));
    }
    updateToggle();
    const actions = node('div', 'dialog-actions');
    actions.append(toggle);
    content.append(actions);
  }
  let remaining = completed;
  const firstUncleared = acts.findIndex(({ levels }) => (remaining -= levels.length) < 0);
  showAct(firstUncleared < 0 ? acts.length - 1 : firstUncleared);
  (list.querySelector('.primary-button') ?? list.lastElementChild?.querySelector('button'))?.focus();
}

export function renderCampaignResults(nextLevel, clearMessage, continueCampaign, showMap) {
  if (clearMessage) content.append(node('p', 'dialog-note', clearMessage));
  const actions = node('div', 'dialog-actions');
  if (nextLevel) actions.append(button('Next level', () => continueCampaign(nextLevel), 'primary-button'));
  actions.append(button('Campaign map', showMap, nextLevel ? 'text-button' : 'primary-button'));
  content.append(actions);
  actions.firstElementChild.focus();
}

export function renderResults(match, restart, goHome) {
  const { adventure, mobSmash, fighters } = match;
  const challenge = adventure ?? mobSmash;
  if (challenge) content.append(node('p', 'dialog-note', `${defeatedEnemies(challenge)} of ${challenge.totalEnemies} opponents defeated.`));
  const list = node('ul', 'result-list');
  for (const entry of [...(challenge?.party ?? fighters)].sort((a, b) => b.stocks - a.stocks || a.damage - b.damage)) {
    const row = node('li');
    row.append(node('strong', '', `P${entry.slot + 1} ${fighterIdentity(entry).name}${entry.cpu ? ' · CPU' : ''}`), node('span', '', `${entry.stocks} ${entry.stocks === 1 ? 'stock' : 'stocks'} left`));
    list.append(row);
  }
  const actions = node('div', 'dialog-actions');
  const rematch = button(challenge ? 'Restart challenge' : 'Rematch', restart, 'primary-button');
  actions.append(rematch, button('Return to roster', goHome));
  content.append(list, actions);
  rematch.focus();
}

export function navigateDialog(pad) {
  const buttons = [...dialog.querySelectorAll('button:not(:disabled):not([hidden])')];
  if (buttons.length && (pad.navX || pad.navY)) {
    const active = buttons.indexOf(document.activeElement);
    buttons[(active + (pad.navX || -pad.navY) + buttons.length) % buttons.length].focus();
  }
  if (pad.acceptPressed) document.activeElement?.click?.();
}
