import { isRectVisible } from "../camera.js";
import { canvas, ctx, runtime } from "../state.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getCurrentChapter2Point, isChapter2Active } from "../systems/chapter2.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawPixelNpc } from "./renderMap.js";

export function drawChapter2Story(map) {
  if (!isChapter2Active()) return;
  const point = getCurrentChapter2Point();
  if (!point || point.mapId !== map.id) return;
  if (!isRectVisible({ x: point.x - 56, y: point.y - 80, width: 112, height: 140 }, 100)) return;

  const phase = performance.now() / 440;
  drawStoryProp(point, phase);
  const playerCenter = getPlayerCenter();
  if (Math.hypot(playerCenter.x - point.x, playerCenter.y - point.y) <= point.visibleRange) {
    drawStoryMarker(point.x, point.y - markerOffset(point.kind), phase);
  }
}

export function drawChapter2CutsceneBackdrop() {
  const scene = getMemoryScene();
  const flash = scene?.state?.flash;
  if (!flash) return false;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(235, 224, 192, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const frameWidth = Math.min(480, Math.round(canvas.width * 0.62));
  const frameHeight = Math.min(300, Math.round(canvas.height * 0.56));
  const x = Math.round((canvas.width - frameWidth) / 2);
  const y = Math.round((canvas.height - frameHeight) / 2);
  ctx.fillStyle = "#302c32";
  ctx.fillRect(x - 8, y - 8, frameWidth + 16, frameHeight + 16);
  ctx.fillStyle = "#c7b58e";
  ctx.fillRect(x, y, frameWidth, frameHeight);
  drawMemoryImage(flash, x, y, frameWidth, frameHeight);
  ctx.restore();
  return true;
}

export function drawChapter2CutsceneForeground() {
  const scene = getMemoryScene();
  if (!scene?.state?.oldPhotoVisible) return false;

  const scale = Math.max(1, Math.min(2, Math.floor(canvas.width / 720)));
  const width = 244 * scale;
  const height = 164 * scale;
  const x = Math.round(canvas.width * 0.68 - width / 2);
  const y = Math.max(44, Math.round(canvas.height * 0.48 - height / 2));
  drawOldPhoto(x, y, scale);
  return true;
}

function drawStoryProp(point, phase) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  if (point.kind === "priest" && !runtime.churchService?.priest?.visible) {
    drawPixelNpc(x - 12, y - 62, "#eee9dc", { activity: "reading", facing: "down", phase, scale: 1.05 });
    return;
  }
  if (point.kind === "children") {
    drawGroundShadow(x, y + 13, 28, 5);
    ctx.fillStyle = "#b57436";
    ctx.fillRect(x - 2, y - 22, 4, 34);
    ctx.fillStyle = "#e95151";
    ctx.fillRect(x + 2, y - 21, 10, 6);
    ctx.fillStyle = "#f6cf57";
    ctx.fillRect(x - 8, y - 17, 10, 6);
    ctx.fillStyle = "#5da9c8";
    ctx.fillRect(x + 2, y - 11, 9, 6);
    return;
  }
  if (point.kind === "oldBox") {
    drawGroundShadow(x, y + 12, 36, 6);
    ctx.fillStyle = "#533a2c";
    ctx.fillRect(x - 18, y - 4, 36, 18);
    ctx.fillStyle = "#9b7148";
    ctx.fillRect(x - 16, y - 2, 32, 7);
    ctx.fillStyle = "#d4b575";
    ctx.fillRect(x - 3, y + 4, 6, 6);
    return;
  }
  if (point.kind === "history") {
    ctx.fillStyle = "#5a4633";
    ctx.fillRect(x - 17, y - 27, 34, 25);
    ctx.fillStyle = "#eadcb7";
    ctx.fillRect(x - 14, y - 24, 28, 18);
    ctx.fillStyle = "#725d42";
    ctx.fillRect(x - 10, y - 20, 20, 2);
    ctx.fillRect(x - 10, y - 15, 15, 2);
    ctx.fillRect(x - 2, y - 2, 4, 18);
    return;
  }
  if (point.kind === "photo") {
    ctx.fillStyle = "#282b32";
    ctx.fillRect(x - 15, y - 13, 30, 23);
    ctx.fillStyle = "#d8e2db";
    ctx.fillRect(x - 9, y - 9, 18, 13);
    ctx.fillStyle = "#646a72";
    ctx.fillRect(x - 4, y - 17, 8, 5);
    return;
  }
  if (point.kind === "massSeat") {
    ctx.fillStyle = "#79513a";
    ctx.fillRect(x - 22, y - 4, 44, 9);
    ctx.fillRect(x - 19, y + 5, 5, 12);
    ctx.fillRect(x + 14, y + 5, 5, 12);
  }
}

function drawStoryMarker(x, y, phase) {
  const markerY = Math.round(y + Math.sin(phase * 1.35) * 2);
  ctx.fillStyle = "#1d1b1d";
  ctx.fillRect(Math.round(x) - 7, markerY - 7, 15, 15);
  ctx.fillStyle = "#f1c95e";
  ctx.fillRect(Math.round(x) - 5, markerY - 5, 11, 11);
  ctx.fillStyle = "#fff4b7";
  ctx.fillRect(Math.round(x) - 1, markerY - 3, 3, 6);
  ctx.fillRect(Math.round(x) - 1, markerY + 5, 3, 3);
}

function markerOffset(kind) {
  if (["priest", "children", "mo"].includes(kind)) return 52;
  return 34;
}

function getMemoryScene() {
  const scene = runtime.cutscene?.scene;
  return scene?.renderer === "chapter2Memory" ? scene : null;
}

function drawMemoryImage(flash, x, y, width, height) {
  const centerX = x + Math.round(width / 2);
  const centerY = y + Math.round(height / 2);
  ctx.fillStyle = "#807760";
  for (let row = 14; row < height; row += 22) {
    ctx.fillRect(x, y + row, width, 2);
  }

  if (flash === "adult-hand") {
    ctx.fillStyle = "#514a45";
    ctx.fillRect(centerX - 108, centerY - 22, 96, 26);
    ctx.fillRect(centerX - 22, centerY - 16, 34, 19);
    ctx.fillRect(centerX + 4, centerY - 11, 86, 15);
    ctx.fillStyle = "#d0b28f";
    ctx.fillRect(centerX - 22, centerY - 14, 44, 22);
    return;
  }
  if (flash === "child") {
    drawMemoryChild(centerX, centerY + 52);
    ctx.fillStyle = "#5f584d";
    ctx.fillRect(centerX - 90, centerY + 52, 180, 5);
    return;
  }
  if (flash === "church-yard" || flash === "van-mieu-gate") {
    ctx.fillStyle = "#615a50";
    ctx.fillRect(centerX - 132, centerY - 72, 264, 132);
    ctx.fillStyle = "#b6a984";
    ctx.fillRect(centerX - 120, centerY - 60, 240, 120);
    if (flash === "church-yard") {
      ctx.fillStyle = "#625c54";
      ctx.fillRect(centerX - 104, centerY - 108, 62, 52);
      ctx.fillRect(centerX + 42, centerY - 108, 62, 52);
      drawArch(centerX - 38, centerY - 45, 76, 102);
    } else {
      ctx.fillStyle = "#8c3d32";
      ctx.fillRect(centerX - 142, centerY - 88, 284, 18);
      ctx.fillRect(centerX - 112, centerY - 116, 224, 20);
      drawArch(centerX - 44, centerY - 55, 88, 115);
    }
    return;
  }
  if (flash === "turtle-pendant") {
    drawTurtlePendant(centerX, centerY, 3);
    return;
  }
  if (flash === "distorted-name") {
    ctx.fillStyle = "#4e4943";
    ctx.fillRect(centerX - 112, centerY - 25, 224, 8);
    ctx.fillRect(centerX - 72, centerY + 9, 144, 7);
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("…ơ…", centerX, centerY + 4);
    return;
  }
  if (flash === "school-group") {
    for (let index = 0; index < 6; index += 1) {
      drawMemoryChild(centerX - 130 + index * 52, centerY + 54 + (index % 2) * 8);
    }
    return;
  }
  if (flash === "flags") {
    for (let index = 0; index < 5; index += 1) {
      const poleX = centerX - 128 + index * 64;
      ctx.fillStyle = "#554c40";
      ctx.fillRect(poleX, centerY - 82, 4, 150);
      ctx.fillStyle = "#a84436";
      ctx.fillRect(poleX + 4, centerY - 78, 38, 23);
      ctx.fillStyle = "#d6bd5b";
      ctx.fillRect(poleX + 20, centerY - 70, 6, 6);
    }
    return;
  }
  if (flash === "large-courtyard") {
    ctx.fillStyle = "#85775f";
    ctx.fillRect(x + 20, centerY - 12, width - 40, 96);
    ctx.fillStyle = "#b4a27c";
    for (let offset = 28; offset < width - 30; offset += 42) ctx.fillRect(x + offset, centerY - 8, 2, 88);
    for (let offset = -4; offset < 84; offset += 22) ctx.fillRect(x + 22, centerY + offset, width - 44, 2);
  }
}

export function drawOldPhoto(x, y, scale) {
  const unit = scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(18, 16, 16, 0.34)";
  ctx.fillRect(x + 7 * unit, y + 8 * unit, 244 * unit, 164 * unit);
  ctx.fillStyle = "#efe3c5";
  ctx.fillRect(x, y, 244 * unit, 164 * unit);
  ctx.fillStyle = "#6a5e4c";
  ctx.fillRect(x + 9 * unit, y + 9 * unit, 226 * unit, 112 * unit);
  ctx.fillStyle = "#a89a78";
  ctx.fillRect(x + 13 * unit, y + 13 * unit, 218 * unit, 104 * unit);

  drawTinyLakeScene(x + 18 * unit, y + 18 * unit, unit);
  drawPhotoChild(x + 126 * unit, y + 98 * unit, unit);
  drawTurtlePendant(x + 127 * unit, y + 76 * unit, unit);

  ctx.fillStyle = "#51493d";
  ctx.font = `${7 * unit}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("1986", x + 14 * unit, y + 136 * unit);
  ctx.font = `${6 * unit}px monospace`;
  ctx.fillText("Mong con tìm được đường về.", x + 14 * unit, y + 151 * unit);
  ctx.restore();
}

function drawTinyLakeScene(x, y, unit) {
  ctx.fillStyle = "#839788";
  ctx.fillRect(x, y + 50 * unit, 208 * unit, 49 * unit);
  ctx.fillStyle = "#d0c69f";
  ctx.fillRect(x, y + 43 * unit, 208 * unit, 7 * unit);
  ctx.fillStyle = "#655f52";
  ctx.fillRect(x + 30 * unit, y + 34 * unit, 44 * unit, 9 * unit);
  ctx.fillRect(x + 39 * unit, y + 22 * unit, 27 * unit, 12 * unit);
  ctx.fillRect(x + 46 * unit, y + 10 * unit, 13 * unit, 12 * unit);
}

function drawPhotoChild(x, baselineY, unit) {
  ctx.fillStyle = "#2e2b2b";
  ctx.fillRect(x - 8 * unit, baselineY - 43 * unit, 16 * unit, 7 * unit);
  ctx.fillStyle = "#b99878";
  ctx.fillRect(x - 7 * unit, baselineY - 37 * unit, 14 * unit, 13 * unit);
  ctx.fillStyle = "#705b4e";
  ctx.fillRect(x - 6 * unit, baselineY - 33 * unit, 5 * unit, 4 * unit);
  ctx.fillRect(x + 2 * unit, baselineY - 31 * unit, 5 * unit, 5 * unit);
  ctx.fillStyle = "#57534b";
  ctx.fillRect(x - 10 * unit, baselineY - 24 * unit, 20 * unit, 23 * unit);
  ctx.fillStyle = "#403d39";
  ctx.fillRect(x - 8 * unit, baselineY - 1 * unit, 6 * unit, 14 * unit);
  ctx.fillRect(x + 2 * unit, baselineY - 1 * unit, 6 * unit, 14 * unit);
}

function drawMemoryChild(centerX, baselineY) {
  ctx.fillStyle = "#3e3a38";
  ctx.fillRect(centerX - 10, baselineY - 74, 20, 12);
  ctx.fillStyle = "#baa181";
  ctx.fillRect(centerX - 9, baselineY - 62, 18, 18);
  ctx.fillStyle = "#62594c";
  ctx.fillRect(centerX - 14, baselineY - 44, 28, 30);
  ctx.fillRect(centerX - 11, baselineY - 14, 8, 18);
  ctx.fillRect(centerX + 3, baselineY - 14, 8, 18);
}

function drawTurtlePendant(centerX, centerY, scale) {
  ctx.fillStyle = "#514735";
  ctx.fillRect(centerX - 2 * scale, centerY - 30 * scale, 4 * scale, 20 * scale);
  ctx.fillStyle = "#b59b55";
  ctx.fillRect(centerX - 10 * scale, centerY - 10 * scale, 20 * scale, 20 * scale);
  ctx.fillStyle = "#e1cb78";
  ctx.fillRect(centerX - 7 * scale, centerY - 7 * scale, 14 * scale, 14 * scale);
  ctx.fillStyle = "#675937";
  ctx.fillRect(centerX - 4 * scale, centerY + 1 * scale, 8 * scale, 4 * scale);
  ctx.fillRect(centerX - 2 * scale, centerY - 5 * scale, 4 * scale, 6 * scale);
}

function drawArch(x, y, width, height) {
  ctx.fillStyle = "#4d4943";
  ctx.fillRect(x, y + Math.round(height * 0.3), width, Math.round(height * 0.7));
  ctx.fillRect(x + Math.round(width * 0.2), y + Math.round(height * 0.12), Math.round(width * 0.6), Math.round(height * 0.2));
  ctx.fillRect(x + Math.round(width * 0.35), y, Math.round(width * 0.3), Math.round(height * 0.14));
}
