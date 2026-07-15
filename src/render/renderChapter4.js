import { isRectVisible } from "../camera.js";
import { canvas, ctx, runtime, state } from "../state.js";
import {
  getChapter4Progress,
  getChapter4RevealPoint,
  isChapter4Active,
  isChapter4PortalWaiting
} from "../systems/chapter4.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { drawOldPhoto } from "./renderChapter2.js";

const PORTAL_X = 2046;
const PORTAL_Y = 612;
const PORTAL_WAITING_ATMOSPHERE = Object.freeze({ storm: 0.58, lightning: 0 });

export function drawChapter4Story(map) {
  if (map.id !== "longBien" || (!isChapter4Active() && !isChapter4PortalWaiting())) return;
  const scene = getRevealScene();
  const progress = getChapter4Progress();
  const portalAmount = Math.max(Number(scene?.state?.portal) || 0, progress.portalOpen ? 1 : 0);
  const glowAmount = Math.max(Number(scene?.state?.pendantGlow) || 0, progress.portalOpen ? 0.72 : 0);
  if (portalAmount > 0) drawBridgePortal(PORTAL_X, PORTAL_Y, portalAmount, glowAmount);

  if (!isChapter4Active() || runtime.cutscene?.active) return;
  const point = getChapter4RevealPoint();
  if (!isRectVisible({ x: point.x - 60, y: point.y - 90, width: 120, height: 150 }, 110)) return;
  const center = getPlayerCenter();
  if (Math.hypot(center.x - point.x, center.y - point.y) <= point.visibleRange) {
    drawStoryMarker(point.x, point.y - 52, performance.now() / 430);
  }
}

export function drawChapter4CutsceneBackdrop() {
  const scene = getRevealScene();
  if (!scene) {
    if (!isChapter4PortalWaiting()) return false;
    drawCinematicStorm(PORTAL_WAITING_ATMOSPHERE);
    return true;
  }
  const sceneState = scene.state;
  drawCinematicStorm(sceneState);
  if (sceneState.view === "old-photo") drawPhotoReveal();
  if (sceneState.view === "pendant-compare") drawPendantComparison(sceneState.pendantGlow);
  if (sceneState.view === "memory" && sceneState.flash) drawMemoryFrame(sceneState.flash);
  return true;
}

function drawBridgePortal(x, y, amount, glowAmount) {
  const phase = performance.now() / 120;
  const height = 142 + Math.round(Math.sin(phase * 0.47) * 4);
  const widths = [44, 28, 14];
  const colors = ["rgba(101, 151, 184, 0.48)", "rgba(184, 218, 225, 0.82)", "rgba(255, 248, 211, 0.94)"];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(12, 20, 30, ${0.22 * amount})`;
  ctx.fillRect(x - 72, y - height + 18, 144, height + 18);
  for (let index = 0; index < widths.length; index += 1) {
    const width = Math.max(2, Math.round(widths[index] * amount));
    const sway = Math.round(Math.sin(phase + index * 1.7) * (4 - index));
    ctx.fillStyle = colors[index];
    ctx.fillRect(x - Math.round(width / 2) + sway, y - height, width, height);
    ctx.fillRect(x - Math.round(width / 2) - 5 + sway, y - height + 30 + index * 22, width + 10, 7);
  }
  ctx.fillStyle = `rgba(230, 242, 220, ${0.34 * glowAmount})`;
  for (let offset = -70; offset <= 70; offset += 20) {
    const reflectionHeight = 9 + Math.abs(offset % 28);
    ctx.fillRect(x + offset, y + 10, 10, reflectionHeight);
  }
  ctx.restore();
}

function drawCinematicStorm(sceneState) {
  const storm = Math.max(0, Math.min(1, Number(sceneState.storm) || 0));
  if (!storm) return;
  const phase = performance.now() / 36;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(23, 36, 55, ${0.18 + storm * 0.22})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgba(179, 201, 211, ${0.08 + storm * 0.09})`;
  const spacing = storm > 0.8 ? 56 : 78;
  for (let row = -40; row < canvas.height + 60; row += spacing) {
    for (let column = -80; column < canvas.width + 100; column += spacing + 14) {
      const drift = Math.round((phase + row * 0.17) % spacing);
      ctx.fillRect(column + drift, row, 18, 2);
      ctx.fillRect(column + drift + 16, row + 2, 12, 2);
    }
  }
  if (sceneState.lightning > 0) {
    ctx.fillStyle = `rgba(232, 243, 241, ${0.55 * sceneState.lightning})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

function drawPhotoReveal() {
  const scale = Math.max(1, Math.min(2, Math.floor(canvas.width / 760)));
  const width = 244 * scale;
  const height = 164 * scale;
  const x = Math.round((canvas.width - width) / 2);
  const y = Math.round((canvas.height - height) / 2);
  ctx.save();
  ctx.fillStyle = "rgba(7, 8, 13, 0.56)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawOldPhoto(x, y, scale);
  ctx.restore();
}

function drawPendantComparison(glow) {
  const centerX = Math.round(canvas.width / 2);
  const centerY = Math.round(canvas.height / 2);
  const panelWidth = Math.min(250, Math.round(canvas.width * 0.25));
  const panelHeight = Math.min(250, Math.round(canvas.height * 0.42));
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(6, 8, 14, 0.76)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawPendantPanel(centerX - panelWidth - 34, centerY - Math.round(panelHeight / 2), panelWidth, panelHeight, "TRONG ẢNH", 2);
  drawPendantPanel(centerX + 34, centerY - Math.round(panelHeight / 2), panelWidth, panelHeight, "PLAYER", 3);
  const pulse = 0.42 + Math.sin(performance.now() / 190) * 0.08;
  ctx.fillStyle = `rgba(239, 216, 128, ${Math.max(pulse, Number(glow) || 0)})`;
  ctx.fillRect(centerX - 30, centerY - 3, 60, 6);
  ctx.fillRect(centerX - 5, centerY - 14, 10, 28);
  ctx.restore();
}

function drawPendantPanel(x, y, width, height, label, scale) {
  ctx.fillStyle = "#242630";
  ctx.fillRect(x - 6, y - 6, width + 12, height + 12);
  ctx.fillStyle = "#8f846b";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#c5b895";
  ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
  drawTurtlePendant(x + Math.round(width / 2), y + Math.round(height * 0.48), scale);
  ctx.fillStyle = "#4d4638";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x + width / 2, y + height - 18);
}

function drawMemoryFrame(flash) {
  const width = Math.min(600, Math.round(canvas.width * 0.72));
  const height = Math.min(360, Math.round(canvas.height * 0.62));
  const x = Math.round((canvas.width - width) / 2);
  const y = Math.round((canvas.height - height) / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(7, 9, 15, 0.86)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#242730";
  ctx.fillRect(x - 8, y - 8, width + 16, height + 16);
  ctx.fillStyle = "#998c70";
  ctx.fillRect(x, y, width, height);
  drawMemoryImage(flash, x, y, width, height);
  ctx.restore();
}

function drawMemoryImage(flash, x, y, width, height) {
  const centerX = x + Math.round(width / 2);
  const centerY = y + Math.round(height / 2);
  drawFilmTexture(x, y, width, height);
  if (flash === "childhood-hanoi") drawChildhoodHanoi(x, y, width, height);
  if (flash === "bridge-storm") drawBridgeStorm(x, y, width, height);
  if (flash === "child-rift") drawChildRift(centerX, centerY, height);
  if (flash === "broken-pendant") drawBrokenPendant(centerX, centerY);
  if (flash === "worlds-time") drawWorldsTime(x, y, width, height);
  if (flash === "elder-immortal") drawElderImmortal(centerX, centerY, height);
  if (flash === "tree-seed") drawTreeSeed(centerX, centerY, height);
  if (flash === "tree-return") drawTreeReturn(centerX, centerY, height);
  if (flash === "disciples-safe") drawDisciplesSafe(centerX, centerY, height);
  if (flash === "young-restored") drawYoungRestored(centerX, centerY, height);
}

function drawChildhoodHanoi(x, y, width, height) {
  ctx.fillStyle = "#6f8d91";
  ctx.fillRect(x, y + Math.round(height * 0.58), width, Math.round(height * 0.42));
  ctx.fillStyle = "#d2c08e";
  ctx.fillRect(x, y + Math.round(height * 0.52), width, 20);
  for (let index = 0; index < 7; index += 1) {
    const houseX = x + 20 + index * Math.round((width - 40) / 7);
    const houseHeight = 80 + (index % 3) * 22;
    ctx.fillStyle = ["#b97a57", "#d0b36f", "#8c9b91"][index % 3];
    ctx.fillRect(houseX, y + Math.round(height * 0.52) - houseHeight, 58, houseHeight);
    ctx.fillStyle = "#ead67f";
    ctx.fillRect(houseX + 10, y + Math.round(height * 0.52) - houseHeight + 20, 12, 14);
  }
  drawMemoryChild(x + width * 0.55, y + height * 0.82, 1.15);
}

function drawBridgeStorm(x, y, width, height) {
  ctx.fillStyle = "#3e4b5d";
  ctx.fillRect(x, y, width, height);
  drawBridgeRails(x, y, width, height);
  ctx.fillStyle = "#b8c9cf";
  for (let row = -20; row < height; row += 30) {
    for (let column = 10; column < width; column += 48) ctx.fillRect(x + column, y + row, 3, 23);
  }
  drawMemoryChild(x + width * 0.6, y + height * 0.8, 1);
}

function drawChildRift(centerX, centerY, height) {
  drawRift(centerX + 72, centerY, height * 0.78);
  drawMemoryChild(centerX - 70, centerY + 82, 1.2);
  ctx.fillStyle = "#c8aa86";
  ctx.fillRect(centerX - 176, centerY + 18, 88, 22);
  ctx.fillRect(centerX - 96, centerY + 24, 40, 16);
}

function drawBrokenPendant(centerX, centerY) {
  ctx.fillStyle = "#574a34";
  ctx.fillRect(centerX - 94, centerY - 88, 82, 5);
  ctx.fillRect(centerX + 18, centerY - 88, 76, 5);
  ctx.fillRect(centerX - 12, centerY - 100, 30, 6);
  drawTurtlePendant(centerX, centerY + 12, 4);
}

function drawWorldsTime(x, y, width, height) {
  const half = Math.round(width / 2);
  ctx.fillStyle = "#8f7655";
  ctx.fillRect(x, y, half, height);
  ctx.fillStyle = "#48596d";
  ctx.fillRect(x + half, y, width - half, height);
  drawClock(x + half * 0.5, y + height * 0.45, 62, 2);
  drawClock(x + half + half * 0.5, y + height * 0.45, 62, 9);
}

function drawElderImmortal(centerX, centerY, height) {
  ctx.fillStyle = "#48535a";
  ctx.fillRect(centerX - 62, centerY - height * 0.31, 124, height * 0.64);
  ctx.fillStyle = "#e0d8c7";
  ctx.fillRect(centerX - 28, centerY - 112, 56, 40);
  ctx.fillStyle = "#e8e4dd";
  ctx.fillRect(centerX - 36, centerY - 125, 72, 15);
  ctx.fillRect(centerX - 24, centerY - 72, 48, 70);
  ctx.fillStyle = "#80745f";
  ctx.fillRect(centerX + 54, centerY - 56, 8, 132);
}

function drawTreeSeed(centerX, centerY, height) {
  ctx.fillStyle = "#4b3e2e";
  ctx.fillRect(centerX - 13, centerY - 18, 26, height * 0.42);
  ctx.fillStyle = "#526e55";
  for (let index = 0; index < 6; index += 1) {
    const offsetX = (index % 3 - 1) * 68;
    const offsetY = Math.floor(index / 3) * 48;
    ctx.fillRect(centerX - 52 + offsetX, centerY - 130 + offsetY, 104, 62);
  }
  ctx.fillStyle = "#e4d07b";
  ctx.fillRect(centerX - 8, centerY + 96, 16, 12);
}

function drawTreeReturn(centerX, centerY, height) {
  ctx.save();
  ctx.translate(centerX, centerY + 66);
  ctx.rotate(-0.42);
  ctx.fillStyle = "#554330";
  ctx.fillRect(-18, -height * 0.48, 36, height * 0.66);
  ctx.fillStyle = "#4f6a52";
  ctx.fillRect(-112, -height * 0.55, 224, 92);
  ctx.restore();
  drawRift(centerX + 110, centerY, height * 0.68);
}

function drawDisciplesSafe(centerX, centerY, height) {
  const colors = ["#7490b5", "#a16d66", "#748e70"];
  for (let index = 0; index < 3; index += 1) {
    const x = centerX - 90 + index * 90;
    drawSimpleFigure(x, centerY + 78, colors[index], 1.15);
  }
  ctx.fillStyle = "#506350";
  ctx.fillRect(centerX - 210, centerY - height * 0.42, 150, 24);
}

function drawYoungRestored(centerX, centerY, height) {
  ctx.fillStyle = "rgba(230, 239, 222, 0.56)";
  for (let inset = 0; inset < 5; inset += 1) {
    ctx.fillRect(centerX - 64 + inset * 7, centerY - height * 0.34 + inset * 9, 128 - inset * 14, height * 0.62 - inset * 18);
  }
  drawSimpleFigure(centerX, centerY + 90, state.profile.gender === "female" ? "#bf6478" : "#49779b", 1.4);
}

function drawBridgeRails(x, y, width, height) {
  ctx.fillStyle = "#2d343c";
  ctx.fillRect(x, y + height * 0.58, width, 12);
  ctx.fillRect(x, y + height * 0.72, width, 12);
  for (let offset = 12; offset < width; offset += 84) {
    ctx.fillRect(x + offset, y + 30, 7, height - 56);
    ctx.fillRect(x + offset, y + 30, 68, 7);
  }
}

function drawRift(centerX, centerY, height) {
  const colors = ["#82b6c8", "#d9edf0", "#fff5c9"];
  colors.forEach((color, index) => {
    const width = 48 - index * 14;
    ctx.fillStyle = color;
    ctx.fillRect(centerX - width / 2, centerY - height / 2 + index * 10, width, height - index * 20);
  });
}

function drawTurtlePendant(centerX, centerY, scale) {
  ctx.fillStyle = "#4d402e";
  ctx.fillRect(centerX - 2 * scale, centerY - 35 * scale, 4 * scale, 26 * scale);
  ctx.fillStyle = "#a98d43";
  ctx.fillRect(centerX - 12 * scale, centerY - 9 * scale, 24 * scale, 22 * scale);
  ctx.fillStyle = "#dfc66e";
  ctx.fillRect(centerX - 8 * scale, centerY - 6 * scale, 16 * scale, 14 * scale);
  ctx.fillStyle = "#66552f";
  ctx.fillRect(centerX - 4 * scale, centerY + 1 * scale, 8 * scale, 4 * scale);
  ctx.fillRect(centerX - 2 * scale, centerY - 5 * scale, 4 * scale, 6 * scale);
}

function drawMemoryChild(x, baselineY, scale) {
  ctx.fillStyle = "#2f3035";
  ctx.fillRect(x - 9 * scale, baselineY - 67 * scale, 18 * scale, 9 * scale);
  ctx.fillStyle = "#c7a17d";
  ctx.fillRect(x - 8 * scale, baselineY - 58 * scale, 16 * scale, 17 * scale);
  ctx.fillStyle = "#e4e8e6";
  ctx.fillRect(x - 12 * scale, baselineY - 41 * scale, 24 * scale, 29 * scale);
  ctx.fillStyle = "#42434b";
  ctx.fillRect(x - 9 * scale, baselineY - 12 * scale, 7 * scale, 16 * scale);
  ctx.fillRect(x + 2 * scale, baselineY - 12 * scale, 7 * scale, 16 * scale);
}

function drawSimpleFigure(x, baselineY, color, scale) {
  ctx.fillStyle = "#2d2b2d";
  ctx.fillRect(x - 9 * scale, baselineY - 60 * scale, 18 * scale, 8 * scale);
  ctx.fillStyle = "#c6a17e";
  ctx.fillRect(x - 8 * scale, baselineY - 52 * scale, 16 * scale, 16 * scale);
  ctx.fillStyle = color;
  ctx.fillRect(x - 12 * scale, baselineY - 36 * scale, 24 * scale, 26 * scale);
  ctx.fillStyle = "#35373e";
  ctx.fillRect(x - 9 * scale, baselineY - 10 * scale, 7 * scale, 14 * scale);
  ctx.fillRect(x + 2 * scale, baselineY - 10 * scale, 7 * scale, 14 * scale);
}

function drawClock(x, y, radius, turns) {
  ctx.fillStyle = "#2d3036";
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.fillStyle = "#ded4b7";
  ctx.fillRect(x - radius + 7, y - radius + 7, radius * 2 - 14, radius * 2 - 14);
  ctx.fillStyle = "#4c4a43";
  ctx.fillRect(x - 3, y - radius + 13, 6, radius - 10);
  ctx.fillRect(x, y - 3, Math.max(8, radius - 15 - turns * 2), 6);
}

function drawFilmTexture(x, y, width, height) {
  ctx.fillStyle = "rgba(52, 48, 43, 0.17)";
  for (let row = 16; row < height; row += 24) ctx.fillRect(x, y + row, width, 2);
  ctx.fillStyle = "rgba(238, 222, 177, 0.12)";
  for (let column = 18; column < width; column += 54) ctx.fillRect(x + column, y, 2, height);
}

function drawStoryMarker(x, y, phase) {
  const markerY = Math.round(y + Math.sin(phase * 1.35) * 2);
  ctx.fillStyle = "#171a20";
  ctx.fillRect(Math.round(x) - 8, markerY - 8, 17, 17);
  ctx.fillStyle = "#d4d8bb";
  ctx.fillRect(Math.round(x) - 6, markerY - 6, 13, 13);
  ctx.fillStyle = "#fff0a1";
  ctx.fillRect(Math.round(x) - 1, markerY - 4, 3, 8);
  ctx.fillRect(Math.round(x) - 1, markerY + 6, 3, 3);
}

function getRevealScene() {
  const scene = runtime.cutscene?.scene;
  return scene?.renderer === "chapter4Reveal" ? scene : null;
}
