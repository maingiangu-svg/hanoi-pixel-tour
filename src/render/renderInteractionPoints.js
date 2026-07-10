import { ctx } from "../state.js";
import { isRectVisible } from "../camera.js";
import { getVisibleInteractionPoints, isInteractionPointCompleted } from "../systems/interactionPoints.js";

export function drawInteractionPoints(map) {
  getVisibleInteractionPoints(map).forEach((point) => {
    const rect = { x: point.x - 22, y: point.y - 30, width: 44, height: 52 };
    if (!isRectVisible(rect, 32)) {
      return;
    }

    const discovered = isInteractionPointCompleted(point);
    drawPixelGlowPoint(point, discovered);
  });
}

function drawPixelGlowPoint(point, discovered) {
  const time = performance.now();
  const pulse = Math.sin(time / (discovered ? 1050 : 760));
  const bob = Math.round(pulse * (discovered ? 1 : 2));
  const x = Math.round(point.x);
  const y = Math.round(point.y + bob);
  const size = discovered ? 5 : (pulse > 0 ? 7 : 6);
  const dark = "#151515";
  const core = discovered ? "#f1d87a" : "#fff36d";
  const light = discovered ? "#fff3b0" : "#fff8d6";
  const shadow = discovered ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.28)";

  ctx.fillStyle = shadow;
  ctx.fillRect(x - 8, y + 11, 16, 4);

  ctx.fillStyle = dark;
  ctx.fillRect(x - 2, y - 14, 4, 5);
  ctx.fillRect(x - 2, y + 10, 4, 5);
  ctx.fillRect(x - 14, y - 2, 5, 4);
  ctx.fillRect(x + 10, y - 2, 5, 4);
  ctx.fillRect(x - size - 2, y - size - 2, size * 2 + 4, size * 2 + 4);

  ctx.fillStyle = core;
  ctx.fillRect(x - size, y - size, size * 2, size * 2);
  ctx.fillStyle = light;
  ctx.fillRect(x - Math.max(2, size - 2), y - Math.max(2, size - 2), Math.max(4, size), Math.max(4, size));

  if (!discovered) {
    ctx.fillStyle = "#fff8d6";
    ctx.fillRect(x - 1, y - 20, 2, 5);
    ctx.fillRect(x - 1, y + 16, 2, 5);
    ctx.fillRect(x - 20, y - 1, 5, 2);
    ctx.fillRect(x + 16, y - 1, 5, 2);
  }
}
