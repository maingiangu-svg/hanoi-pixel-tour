import { canvas, player, runtime, state } from "./state.js";
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

  const cutsceneCamera = runtime.cutscene?.active ? runtime.cutscene.camera : null;
  if (cutsceneCamera?.locked) {
    camera.x = clamp(cutsceneCamera.focusX - camera.width / 2, 0, Math.max(0, worldWidth - camera.width));
    camera.y = clamp(cutsceneCamera.focusY - camera.height / 2, 0, Math.max(0, worldHeight - camera.height));
    return;
  }

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const focus = runtime.environmentInteraction?.active ? runtime.environmentInteraction.cameraFocus : null;
  const focusStrength = Math.max(0, Math.min(1, Number(focus?.strength) || 0));
  const centerX = focus ? playerCenterX + (focus.x - playerCenterX) * focusStrength : playerCenterX;
  const centerY = focus ? playerCenterY + (focus.y - playerCenterY) * focusStrength : playerCenterY;
  const targetX = clamp(centerX - camera.width / 2, 0, Math.max(0, worldWidth - camera.width));
  const targetY = clamp(centerY - camera.height / 2, 0, Math.max(0, worldHeight - camera.height));

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

export function applyWorldCameraTransform(context) {
  const cutscene = runtime.cutscene?.active ? runtime.cutscene : null;
  const zoom = Math.max(1, Number(cutscene?.camera?.zoom) || 1);
  const shakeX = Number(cutscene?.visual?.shakeX) || 0;
  const shakeY = Number(cutscene?.visual?.shakeY) || 0;
  context.translate(canvas.width / 2 + shakeX, canvas.height / 2 + shakeY);
  context.scale(zoom, zoom);
  context.translate(-canvas.width / 2, -canvas.height / 2);
  context.translate(-Math.round(camera.x), -Math.round(camera.y));
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
