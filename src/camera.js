import { canvas, player, state } from "./state.js";
import { getCurrentMap } from "./utils/helpers.js";

export const camera = {
  x: 0,
  y: 0,
  width: canvas.width,
  height: canvas.height,
  lastMapId: null
};

export function updateCamera({ snap = false } = {}) {
  const map = getCurrentMap();
  const worldWidth = map.width || canvas.width;
  const worldHeight = map.height || canvas.height;

  if (camera.lastMapId !== state.currentMapId) {
    camera.lastMapId = state.currentMapId;
    snap = true;
  }

  camera.width = canvas.width;
  camera.height = canvas.height;

  const targetX = clamp(player.x + player.width / 2 - camera.width / 2, 0, Math.max(0, worldWidth - camera.width));
  const targetY = clamp(player.y + player.height / 2 - camera.height / 2, 0, Math.max(0, worldHeight - camera.height));

  if (snap) {
    camera.x = targetX;
    camera.y = targetY;
    return;
  }

  camera.x += (targetX - camera.x) * 0.14;
  camera.y += (targetY - camera.y) * 0.14;
  camera.x = clamp(camera.x, 0, Math.max(0, worldWidth - camera.width));
  camera.y = clamp(camera.y, 0, Math.max(0, worldHeight - camera.height));
}

export function snapCameraToPlayer() {
  updateCamera({ snap: true });
}

export function worldToScreen(x, y) {
  return {
    x: x - camera.x,
    y: y - camera.y
  };
}

export function isRectVisible(rect, margin = 120) {
  return rect.x + rect.width >= camera.x - margin &&
    rect.x <= camera.x + camera.width + margin &&
    rect.y + rect.height >= camera.y - margin &&
    rect.y <= camera.y + camera.height + margin;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
