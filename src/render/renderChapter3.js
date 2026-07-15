import { isRectVisible } from "../camera.js";
import { canvas, ctx, runtime } from "../state.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getChapter3Progress, getCurrentChapter3Point, isChapter3Active } from "../systems/chapter3.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawPixelNpc } from "./renderMap.js";

export function drawChapter3Story(map) {
  if (!isChapter3Active() || map.id !== "baDinh") return;
  const progress = getChapter3Progress();
  drawChapterSceneActors(progress.stage);

  const point = getCurrentChapter3Point();
  if (!point || !isRectVisible({ x: point.x - 60, y: point.y - 82, width: 120, height: 148 }, 100)) return;
  const phase = performance.now() / 440;
  drawStoryProp(point, phase);
  const playerCenter = getPlayerCenter();
  if (Math.hypot(playerCenter.x - point.x, playerCenter.y - point.y) <= point.visibleRange) {
    drawStoryMarker(point.x, point.y - markerOffset(point.kind), phase);
  }
}

export function drawChapter3CutsceneBackdrop() {
  const scene = getMemoryScene();
  const flash = scene?.state?.flash;
  if (!flash) return false;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(221, 214, 193, 0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const frameWidth = Math.min(520, Math.round(canvas.width * 0.66));
  const frameHeight = Math.min(320, Math.round(canvas.height * 0.58));
  const x = Math.round((canvas.width - frameWidth) / 2);
  const y = Math.round((canvas.height - frameHeight) / 2);
  ctx.fillStyle = "#28282e";
  ctx.fillRect(x - 8, y - 8, frameWidth + 16, frameHeight + 16);
  ctx.fillStyle = "#b8ad8e";
  ctx.fillRect(x, y, frameWidth, frameHeight);
  drawMemoryImage(flash, x, y, frameWidth, frameHeight);
  ctx.restore();
  return true;
}

function drawChapterSceneActors(stage) {
  const phase = performance.now() / 520;
  if (["focusChoice", "tourGroupChoice"].includes(stage)) {
    drawVisitorGroup(760, 824, phase);
  }
  if (["schoolGroupChoice", "fearChoice", "moRecognition"].includes(stage)) {
    drawStudentGroup(1216, 1768, phase);
  }
}

function drawVisitorGroup(x, y, phase) {
  const people = [
    { x: x - 48, y: y + 8, color: "#7188b8", facing: "right" },
    { x: x - 10, y: y + 26, color: "#a96d65", facing: "up" },
    { x: x + 28, y: y + 14, color: "#6d9577", facing: "left" },
    { x: x + 56, y: y + 34, color: "#a78a5f", facing: "left" }
  ];
  people.forEach((person, index) => {
    if (!isRectVisible({ x: person.x - 18, y: person.y - 56, width: 54, height: 78 }, 80)) return;
    drawPixelNpc(person.x, person.y - 44 + Math.round(Math.sin(phase + index) * 1), person.color, {
      activity: "talking",
      facing: person.facing,
      phase: phase + index,
      scale: 0.96
    });
  });
}

function drawStudentGroup(x, y, phase) {
  const colors = ["#edf0f2", "#e8ecef", "#f0ebe5", "#e7eef0"];
  for (let index = 0; index < 4; index += 1) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const npcX = x + column * 42;
    const npcY = y + row * 34;
    if (!isRectVisible({ x: npcX - 16, y: npcY - 50, width: 52, height: 74 }, 70)) continue;
    drawPixelNpc(npcX, npcY - 42 + Math.round(Math.sin(phase + index * 0.7)), colors[index], {
      activity: "listening",
      facing: column ? "left" : "right",
      phase: phase + index,
      scale: 0.9
    });
    ctx.fillStyle = "#c74848";
    ctx.fillRect(npcX + 5, npcY - 21, 8, 4);
  }
}

function drawStoryProp(point, phase) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  if (point.kind === "oldWitness") {
    drawPixelNpc(x - 12, y - 48 + Math.round(Math.sin(phase) * 1), "#7b806f", {
      activity: "resting",
      facing: "left",
      phase,
      scale: 1.02
    });
    ctx.fillStyle = "#a8a6a0";
    ctx.fillRect(x - 6, y - 46, 16, 5);
    return;
  }
  if (point.kind === "history") {
    drawGroundShadow(x, y + 12, 34, 5);
    ctx.fillStyle = "#5e4933";
    ctx.fillRect(x - 16, y - 25, 32, 24);
    ctx.fillStyle = "#ead9ad";
    ctx.fillRect(x - 13, y - 22, 26, 17);
    ctx.fillStyle = "#6d5940";
    ctx.fillRect(x - 10, y - 18, 20, 2);
    ctx.fillRect(x - 10, y - 13, 15, 2);
    ctx.fillRect(x - 2, y - 1, 4, 16);
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
  return ["guide", "oldWitness"].includes(kind) ? 56 : 36;
}

function getMemoryScene() {
  const scene = runtime.cutscene?.scene;
  return scene?.renderer === "chapter3Memory" ? scene : null;
}

function drawMemoryImage(flash, x, y, width, height) {
  const centerX = x + Math.round(width / 2);
  const centerY = y + Math.round(height / 2);
  drawFilmTexture(x, y, width, height);

  if (flash === "child-hand" || flash === "separating-hands" || flash === "slipping-hand") {
    drawHands(centerX, centerY, flash);
    return;
  }
  if (flash === "ba-dinh-flags") {
    drawFlags(centerX, centerY);
    return;
  }
  if (flash === "school-trip") {
    drawSchoolTrip(centerX, centerY);
    return;
  }
  if (flash === "red-scarf") {
    drawRedScarf(centerX, centerY);
    return;
  }
  if (flash === "khue-van-cac") {
    drawMemoryKhueVan(centerX, centerY);
    return;
  }
  if (flash === "long-bien-tracks") {
    drawBridgeTracks(x, y, width, height);
    return;
  }
  if (flash === "storm-rain") {
    drawStorm(x, y, width, height);
    return;
  }
  if (flash === "rift-light") {
    drawRift(centerX, centerY, height);
  }
}

function drawFilmTexture(x, y, width, height) {
  ctx.fillStyle = "rgba(67, 62, 54, 0.18)";
  for (let row = 16; row < height; row += 22) ctx.fillRect(x, y + row, width, 2);
  ctx.fillStyle = "rgba(238, 224, 178, 0.18)";
  for (let column = 20; column < width; column += 46) ctx.fillRect(x + column, y, 2, height);
}

function drawHands(centerX, centerY, mode) {
  const gap = mode === "child-hand" ? 0 : mode === "separating-hands" ? 36 : 58;
  ctx.fillStyle = "#514a45";
  ctx.fillRect(centerX - 190, centerY - 28, 116 - gap / 2, 32);
  ctx.fillRect(centerX + 74 + gap / 2, centerY - 12, 116 - gap / 2, 25);
  ctx.fillStyle = "#c59f7c";
  ctx.fillRect(centerX - 76 - gap / 2, centerY - 24, 70, 30);
  ctx.fillStyle = "#d7b28c";
  ctx.fillRect(centerX + 4 + gap / 2, centerY - 12, 70, 25);
  if (mode === "slipping-hand") {
    ctx.fillStyle = "#d7e4e3";
    for (let offset = -150; offset <= 150; offset += 42) ctx.fillRect(centerX + offset, centerY - 92 + (offset % 3), 3, 84);
  }
}

function drawFlags(centerX, centerY) {
  for (let index = 0; index < 6; index += 1) {
    const poleX = centerX - 180 + index * 72;
    ctx.fillStyle = "#4f4a43";
    ctx.fillRect(poleX, centerY - 105, 4, 190);
    ctx.fillStyle = "#b63d36";
    ctx.fillRect(poleX + 4, centerY - 100, 48, 29);
    ctx.fillStyle = "#e4c55e";
    ctx.fillRect(poleX + 23, centerY - 91, 8, 8);
  }
  ctx.fillStyle = "#82775f";
  ctx.fillRect(centerX - 220, centerY + 72, 440, 8);
}

function drawSchoolTrip(centerX, centerY) {
  for (let index = 0; index < 7; index += 1) {
    const x = centerX - 168 + index * 54;
    const y = centerY + 58 + (index % 2) * 8;
    drawMemoryChild(x, y);
  }
}

function drawMemoryChild(x, baselineY) {
  ctx.fillStyle = "#2f3035";
  ctx.fillRect(x - 9, baselineY - 67, 18, 9);
  ctx.fillStyle = "#c7a17d";
  ctx.fillRect(x - 8, baselineY - 58, 16, 17);
  ctx.fillStyle = "#e4e8e6";
  ctx.fillRect(x - 12, baselineY - 41, 24, 29);
  ctx.fillStyle = "#b83f43";
  ctx.fillRect(x - 5, baselineY - 38, 10, 5);
  ctx.fillStyle = "#42434b";
  ctx.fillRect(x - 9, baselineY - 12, 7, 16);
  ctx.fillRect(x + 2, baselineY - 12, 7, 16);
}

function drawRedScarf(centerX, centerY) {
  ctx.fillStyle = "#edeae0";
  ctx.fillRect(centerX - 76, centerY - 76, 152, 152);
  ctx.fillStyle = "#b53f42";
  ctx.fillRect(centerX - 46, centerY - 26, 92, 18);
  ctx.fillRect(centerX - 8, centerY - 8, 18, 72);
  ctx.fillRect(centerX + 10, centerY - 8, 34, 14);
}

function drawMemoryKhueVan(centerX, centerY) {
  ctx.fillStyle = "#7f3d32";
  ctx.fillRect(centerX - 118, centerY + 42, 236, 24);
  ctx.fillRect(centerX - 90, centerY - 36, 24, 78);
  ctx.fillRect(centerX + 66, centerY - 36, 24, 78);
  ctx.fillStyle = "#bd6b42";
  ctx.fillRect(centerX - 104, centerY - 62, 208, 28);
  ctx.fillRect(centerX - 82, centerY - 104, 164, 42);
  ctx.fillStyle = "#d8bd74";
  ctx.fillRect(centerX - 36, centerY - 94, 72, 24);
  ctx.fillStyle = "#453d36";
  ctx.fillRect(centerX - 14, centerY - 91, 28, 18);
}

function drawBridgeTracks(x, y, width, height) {
  ctx.fillStyle = "#4d4c4c";
  ctx.fillRect(x, y + height * 0.58, width, 20);
  ctx.fillRect(x, y + height * 0.72, width, 20);
  ctx.fillStyle = "#77716a";
  for (let offset = -80; offset < width + 80; offset += 48) {
    ctx.fillRect(x + offset, y + height * 0.54, 7, height * 0.27);
  }
  ctx.fillStyle = "#34373b";
  for (let offset = 12; offset < width; offset += 92) {
    ctx.fillRect(x + offset, y + 34, 8, height - 62);
    ctx.fillRect(x + offset, y + 34, 74, 7);
    ctx.fillRect(x + offset + 68, y + 34, 7, height - 62);
  }
}

function drawStorm(x, y, width, height) {
  ctx.fillStyle = "#4c5260";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#b8c7cf";
  for (let row = -40; row < height + 60; row += 28) {
    for (let column = 10; column < width; column += 44) {
      ctx.fillRect(x + column, y + row + (column % 17), 3, 20);
    }
  }
  ctx.fillStyle = "#e7edf0";
  ctx.fillRect(x + Math.round(width * 0.56), y + 12, 8, 80);
  ctx.fillRect(x + Math.round(width * 0.56) - 24, y + 84, 31, 8);
  ctx.fillRect(x + Math.round(width * 0.56) - 24, y + 84, 8, 48);
}

function drawRift(centerX, centerY, height) {
  ctx.fillStyle = "#30333a";
  ctx.fillRect(centerX - 180, centerY + 70, 360, 10);
  const colors = ["#f8f4dc", "#d9e9f0", "#9cc9dc"];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    const width = 42 - index * 12;
    ctx.fillRect(centerX - Math.round(width / 2), centerY - height * 0.38 + index * 9, width, height * 0.72 - index * 18);
  });
  ctx.fillStyle = "#443f3b";
  ctx.fillRect(centerX - 140, centerY + 76, 280, 6);
}
