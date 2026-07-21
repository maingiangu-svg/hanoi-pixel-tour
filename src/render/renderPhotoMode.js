import { canvas, ctx, player, runtime, state } from "../state.js";
import { isRectVisible } from "../camera.js";
import { getPhotoSpotsForMap } from "../data/photoSpots.js";
import { getPlayerCenter } from "../utils/helpers.js";
import {
  evaluatePhotoComposition,
  getFacingHint,
  getNearestPhotoSpot,
  hasCapturedPhotoSpot,
  isPhotoModeActive
} from "../systems/photoMode.js";
import { isViewModeActive } from "../systems/viewMode.js";

export function drawPhotoSpots(map) {
  if (isPhotoModeActive()) {
    return;
  }

  const center = getPlayerCenter();
  const nearby = getNearestPhotoSpot({ withinInteractionRange: true });
  const time = performance.now();
  getPhotoSpotsForMap(map.id).forEach((spot) => {
    const distance = Math.hypot(center.x - spot.x, center.y - spot.y);
    if (distance > spot.visibleRange || !isRectVisible({ x: spot.x - 18, y: spot.y - 24, width: 36, height: 48 }, 20)) {
      return;
    }

    drawCameraMarker(spot, time, hasCapturedPhotoSpot(spot.id));
    if (nearby?.spot.id === spot.id) {
      const prompt = player.facing === spot.requiredFacing
        ? "[P] Chụp ảnh"
        : `Quay ${getFacingHint(spot.requiredFacing)} · [P]`;
      drawPhotoPrompt(prompt, spot.x, spot.y - 34);
    }
  });
}

export function drawPhotoModeOverlay() {
  if (isPhotoModeActive()) {
    drawFrame();
    drawPhotoStatus();
  }

  const flashRemaining = runtime.photoFlashUntil - performance.now();
  if (flashRemaining > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.72, flashRemaining / 220);
    ctx.fillStyle = "#fff8d6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
}

function drawCameraMarker(spot, time, captured) {
  const pulse = Math.sin(time / (captured ? 420 : 260));
  const bob = Math.round(pulse * (captured ? 1 : 2));
  const x = Math.round(spot.x - 10);
  const y = Math.round(spot.y - 18 + bob);
  ctx.save();
  ctx.globalAlpha = captured ? 0.62 : 0.92;
  ctx.fillStyle = "#151515";
  ctx.fillRect(x - 2, y + 2, 24, 17);
  ctx.fillStyle = captured ? "#c7b978" : "#fff36d";
  ctx.fillRect(x, y, 20, 13);
  ctx.fillRect(x + 4, y - 3, 8, 4);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 7, y + 3, 8, 8);
  ctx.fillStyle = captured ? "#75858b" : "#d8f3ff";
  ctx.fillRect(x + 9, y + 5, 4, 4);
  if (!captured && pulse > 0.45) {
    ctx.fillStyle = "#fff8d6";
    ctx.fillRect(x + 20, y - 2, 3, 3);
    ctx.fillRect(x + 23, y - 5, 3, 3);
  }
  ctx.restore();
}

function drawPhotoPrompt(text, centerX, y) {
  ctx.save();
  ctx.font = "900 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(210, Math.ceil(ctx.measureText(text).width) + 18);
  const x = Math.round(centerX - width / 2);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x - 2, y - 11, width + 4, 24);
  ctx.fillStyle = "#fff3b0";
  ctx.fillRect(x, y - 9, width, 20);
  ctx.fillStyle = "#151515";
  ctx.fillText(text, centerX, y + 1);
  ctx.restore();
}

function drawFrame() {
  const inset = 38;
  const corner = Math.max(28, Math.round(Math.min(canvas.width, canvas.height) * 0.055));
  ctx.save();
  ctx.fillStyle = "rgba(12, 13, 18, 0.18)";
  ctx.fillRect(0, 0, canvas.width, inset);
  ctx.fillRect(0, canvas.height - inset, canvas.width, inset);
  ctx.fillRect(0, inset, inset, canvas.height - inset * 2);
  ctx.fillRect(canvas.width - inset, inset, inset, canvas.height - inset * 2);

  ctx.strokeStyle = "#fff3b0";
  ctx.lineWidth = 4;
  drawCorner(inset, inset, corner, 1, 1);
  drawCorner(canvas.width - inset, inset, corner, -1, 1);
  drawCorner(inset, canvas.height - inset, corner, 1, -1);
  drawCorner(canvas.width - inset, canvas.height - inset, corner, -1, -1);

  if (!isViewModeActive()) {
    const cx = Math.round(canvas.width / 2);
    const cy = Math.round(canvas.height / 2);
    ctx.fillStyle = "rgba(21, 21, 21, 0.82)";
    ctx.fillRect(cx - 15, cy - 1, 30, 3);
    ctx.fillRect(cx - 1, cy - 15, 3, 30);
    ctx.fillStyle = "#fff3b0";
    ctx.fillRect(cx - 7, cy, 14, 1);
    ctx.fillRect(cx, cy - 7, 1, 14);
  }
  ctx.restore();
}

function drawCorner(x, y, size, directionX, directionY) {
  ctx.beginPath();
  ctx.moveTo(x + directionX * size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + directionY * size);
  ctx.stroke();
}

function drawPhotoStatus() {
  const nearest = getNearestPhotoSpot({ withinInteractionRange: true });
  const evaluation = evaluatePhotoComposition(nearest?.spot);
  const title = nearest?.spot.title || "Tìm một điểm có biểu tượng máy ảnh";
  const status = evaluation.valid
    ? `${evaluation.ratingLabel} · Enter/Space để chụp`
    : evaluation.reason;
  const width = Math.min(canvas.width - 96, 520);
  const x = Math.round((canvas.width - width) / 2);
  const y = canvas.height - 82;

  ctx.save();
  ctx.fillStyle = "#151515";
  ctx.fillRect(x - 3, y - 3, width + 6, 48);
  ctx.fillStyle = evaluation.valid ? "#fff3b0" : "#e4dfca";
  ctx.fillRect(x, y, width, 42);
  ctx.textAlign = "center";
  ctx.fillStyle = "#151515";
  ctx.font = "900 12px 'Courier New', monospace";
  ctx.fillText(title, canvas.width / 2, y + 16);
  ctx.font = "700 10px 'Courier New', monospace";
  ctx.fillText(`${status} · Esc thoát`, canvas.width / 2, y + 32);
  ctx.restore();
}
