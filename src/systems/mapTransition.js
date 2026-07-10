import { canvas, ctx, runtime } from "../state.js";

const FADE_DURATION = 360;

export function beginMapTransition() {
  runtime.mapTransitionStartedAt = performance.now();
}

export function isMapTransitionActive() {
  if (!runtime.mapTransitionStartedAt) {
    return false;
  }

  if (performance.now() - runtime.mapTransitionStartedAt >= FADE_DURATION) {
    runtime.mapTransitionStartedAt = 0;
    return false;
  }

  return true;
}

export function drawMapTransition() {
  if (!isMapTransitionActive()) {
    return;
  }

  const elapsed = performance.now() - runtime.mapTransitionStartedAt;
  if (elapsed >= FADE_DURATION) {
    runtime.mapTransitionStartedAt = 0;
    return;
  }

  const alpha = 0.38 * (1 - elapsed / FADE_DURATION);
  ctx.fillStyle = `rgba(12, 13, 18, ${alpha.toFixed(3)})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
