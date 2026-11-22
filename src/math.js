export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);
export const direction = (value, fallback = 1) => Math.sign(value) || fallback;
