import { canvas, ctx, player, runtime, state } from "../state.js";
import { worldToScreen } from "../camera.js";
import { getResolvedObjective } from "../systems/navigation.js";
import { isOverlayOpen } from "../systems/modal.js";

const SAFE_MARGIN = 34;
const TOP_SAFE_MARGIN = 54;

export function drawNavigationGuidance() {
  if (!state.navigation?.showWorldGuidance || isOverlayOpen() || runtime.photoMode?.active) return;
  const target = getResolvedObjective();
  if (!target || target.unavailable || target.mapId !== state.currentMapId) return;
  const screen = worldToScreen(target.x, target.y);
  const inside = screen.x >= SAFE_MARGIN && screen.x <= canvas.width - SAFE_MARGIN && screen.y >= TOP_SAFE_MARGIN && screen.y <= canvas.height - SAFE_MARGIN;
  if (inside) drawWorldTargetMarker(screen.x, screen.y, target);
  else drawEdgeArrow(screen.x, screen.y, target);
}

function drawWorldTargetMarker(x, y, target) {
  const pulse = Math.floor(performance.now() / 240) % 2;
  const markerY = Math.round(y - 30 - pulse * 2);
  ctx.save();
  ctx.translate(Math.round(x), markerY);
  ctx.fillStyle = "#151515";
  drawDiamond(0, 0, 9);
  ctx.fillStyle = target.stage === "reachParking" ? "#8ee3ff" : "#ffe15b";
  drawDiamond(0, 0, 6);
  ctx.fillStyle = "#fff8d6";
  ctx.fillRect(-2, -2, 4, 4);
  drawLabel(target.stageLabel || target.label, 0, -17);
  ctx.restore();
}

function drawEdgeArrow(targetX, targetY, target) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  const scale = Math.min(
    (canvas.width / 2 - SAFE_MARGIN) / Math.max(1, Math.abs(dx)),
    (canvas.height / 2 - TOP_SAFE_MARGIN) / Math.max(1, Math.abs(dy))
  );
  const x = Math.round(centerX + dx * scale);
  const y = Math.round(Math.max(TOP_SAFE_MARGIN, Math.min(canvas.height - SAFE_MARGIN, centerY + dy * scale)));
  const angle = Math.atan2(dy, dx);
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const distance = Math.round(Math.hypot(target.x - playerCenterX, target.y - playerCenterY) / 10);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#151515";
  drawArrow(0, 0, 13);
  ctx.fillStyle = "#ffe15b";
  drawArrow(-2, 0, 9);
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  drawLabel(`${shorten(target.stageLabel || target.label)} · ${distance}m`, 0, y < 92 ? 24 : -25);
  ctx.restore();
}

function drawArrow(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x - size + 2, y - size + 3);
  ctx.lineTo(x - size + 2, y + size - 3);
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drawLabel(text, x, y) {
  ctx.font = "700 10px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(230, Math.ceil(ctx.measureText(text).width) + 12);
  ctx.fillStyle = "rgba(21, 21, 21, 0.92)";
  ctx.fillRect(Math.round(x - width / 2), Math.round(y - 8), width, 16);
  ctx.strokeStyle = "#ffe15b";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x - width / 2), Math.round(y - 8), width, 16);
  ctx.fillStyle = "#fff8d6";
  ctx.fillText(text, x, y + 1, width - 6);
}

function shorten(text) {
  return text.length > 22 ? `${text.slice(0, 20)}…` : text;
}
