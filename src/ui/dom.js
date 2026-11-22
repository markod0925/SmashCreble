export const $ = (id) => document.getElementById(id);

export function node(tag, className, label) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (label !== undefined) el.textContent = label;
  return el;
}

export function button(label, action, className = 'text-button') {
  const el = node('button', className, label);
  el.type = 'button';
  el.addEventListener('click', action);
  return el;
}
