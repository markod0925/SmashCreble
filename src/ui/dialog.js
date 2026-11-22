import { $, node, button } from './dom.js';

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

export function renderControls() {
  content.append($('controls-template').content.cloneNode(true));
  const scroller = content.querySelector('.controls-scroll');
  scroller.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    event.stopPropagation();
    scroller.scrollLeft += (event.key === 'ArrowLeft' ? -1 : 1) * scroller.clientWidth * .15;
  });
  $('close-dialog').focus();
}

export function renderPause(disconnected, resumeMatch, goHome) {
  const actions = node('div', 'dialog-actions');
  const resume = button('Resume', resumeMatch, 'primary-button');
  resume.disabled = Boolean(disconnected);
  actions.append(resume, button('Return to roster', goHome));
  if (disconnected) content.append(node('p', 'dialog-note', 'Reconnect the controller and press A to reclaim its seat.'));
  content.append(actions);
  (resume.disabled ? actions.lastElementChild : resume).focus();
}

export function renderResults(fighters, restart, goHome) {
  const list = node('ul', 'result-list');
  for (const entry of [...fighters].sort((a, b) => b.stocks - a.stocks || a.damage - b.damage)) {
    const row = node('li');
    row.append(node('strong', '', `P${entry.slot + 1} ${entry.fighter.name}${entry.cpu ? ' · CPU' : ''}`), node('span', '', `${entry.stocks} ${entry.stocks === 1 ? 'stock' : 'stocks'} left`));
    list.append(row);
  }
  const actions = node('div', 'dialog-actions');
  const rematch = button('Rematch', restart, 'primary-button');
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
