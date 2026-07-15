import { canvas, ctx, runtime, state } from "../state.js";
import { FINAL_ENDING_IDS } from "../data/finalEndings.js";
import { drawOldPhoto } from "./renderChapter2.js";

const SKYLINE_COLORS = Object.freeze(["#2f3545", "#3f4657", "#28303e"]);

export function drawFinalEndingBackdrop() {
  const scene = runtime.cutscene?.scene;
  if (scene?.renderer !== "finalEnding") return false;
  const sceneState = scene.state || {};
  drawBaseScene(sceneState);
  if (sceneState.frame === "choice") drawPortalChoice(sceneState);
  if (sceneState.frame === "return") drawReturnScene(sceneState);
  if (sceneState.frame === "mo-photo") drawMoPhotoScene();
  if (sceneState.frame === "hanoi-walk") drawHanoiWalkScene();
  if (sceneState.frame === "bridge") drawBridgeEndingScene(sceneState);
  if (sceneState.frame === "epilogue") drawEpilogueScene(sceneState.actorId);
  if (sceneState.frame === "credits") drawCreditsScene(sceneState.endingId);
  return true;
}

function drawBaseScene(sceneState) {
  const phase = performance.now() / 900;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = sceneState.frame === "credits" ? "#11131c" : "#253247";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#59677a";
  ctx.fillRect(0, Math.round(canvas.height * 0.46), canvas.width, Math.round(canvas.height * 0.54));
  drawLayeredSkyline(phase);
  drawBridgeDeck();
  ctx.restore();
}

function drawLayeredSkyline(phase) {
  const horizon = Math.round(canvas.height * 0.46);
  for (let layer = 0; layer < 3; layer += 1) {
    const baseY = horizon - 28 + layer * 22;
    const blockWidth = 86 + layer * 22;
    ctx.fillStyle = SKYLINE_COLORS[layer];
    for (let x = -30 + layer * 18; x < canvas.width + blockWidth; x += blockWidth) {
      const variant = Math.abs(Math.floor((x + layer * 37) / blockWidth)) % 3;
      const height = 62 + variant * 22 - layer * 8;
      ctx.fillRect(x, baseY - height, blockWidth - 9, height);
      if (layer === 0) continue;
      ctx.fillStyle = variant === 1 ? "#d6aa60" : "#8992a0";
      for (let windowX = x + 14; windowX < x + blockWidth - 16; windowX += 24) {
        if ((Math.floor(windowX / 12) + layer) % 3 !== 0) ctx.fillRect(windowX, baseY - height + 18, 8, 7);
      }
      ctx.fillStyle = SKYLINE_COLORS[layer];
    }
  }
  ctx.fillStyle = "rgba(226, 194, 110, 0.42)";
  for (let x = 24; x < canvas.width; x += 96) {
    const flicker = Math.floor(phase + x / 96) % 2;
    ctx.fillRect(x, horizon + 8, 24 + flicker * 8, 3);
  }
}

function drawBridgeDeck() {
  const deckY = Math.round(canvas.height * 0.64);
  ctx.fillStyle = "#252a32";
  ctx.fillRect(0, deckY, canvas.width, canvas.height - deckY);
  ctx.fillStyle = "#161b22";
  ctx.fillRect(0, deckY + 36, canvas.width, 11);
  ctx.fillRect(0, deckY + 102, canvas.width, 8);
  ctx.fillStyle = "#89909a";
  for (let x = 0; x < canvas.width; x += 104) {
    ctx.fillRect(x, deckY - 120, 8, 170);
    ctx.fillRect(x, deckY - 120, 78, 7);
  }
}

function drawPortalChoice(sceneState) {
  drawPortal(canvas.width * 0.52, canvas.height * 0.58, 1, sceneState.endingId === FINAL_ENDING_IDS.BRIDGE);
  drawFigure(canvas.width * 0.42, canvas.height * 0.75, state.profile.gender === "female" ? "#bd667e" : "#477ba0", "right");
  drawMo(canvas.width * 0.34, canvas.height * 0.75, "right");
}

function drawReturnScene(sceneState) {
  drawPortal(canvas.width * 0.57, canvas.height * 0.58, sceneState.portalAmount ?? 1, false);
  drawFigure(canvas.width * 0.51, canvas.height * 0.76, state.profile.gender === "female" ? "#bd667e" : "#477ba0", "right");
  drawMo(canvas.width * 0.32, canvas.height * 0.76, "right");
  ctx.fillStyle = "rgba(242, 227, 166, 0.24)";
  ctx.fillRect(Math.round(canvas.width * 0.48), Math.round(canvas.height * 0.7), Math.round(canvas.width * 0.18), 6);
}

function drawMoPhotoScene() {
  ctx.fillStyle = "rgba(10, 12, 19, 0.58)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width > 1000 ? 2 : 1;
  const photoWidth = 244 * scale;
  const photoX = Math.round(canvas.width * 0.55 - photoWidth / 2);
  const photoY = Math.round(canvas.height * 0.2);
  drawOldPhoto(photoX, photoY, scale);
  drawMo(canvas.width * 0.32, canvas.height * 0.78, "right");
  ctx.fillStyle = "#d8bf75";
  ctx.fillRect(Math.round(canvas.width * 0.36), Math.round(canvas.height * 0.6), 34, 26);
}

function drawHanoiWalkScene() {
  const waterY = Math.round(canvas.height * 0.5);
  ctx.fillStyle = "#31556a";
  ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);
  ctx.fillStyle = "rgba(239, 201, 105, 0.42)";
  for (let x = 22; x < canvas.width; x += 90) ctx.fillRect(x, waterY + 28 + (x % 3) * 13, 40, 4);
  ctx.fillStyle = "#a99a7b";
  ctx.fillRect(0, Math.round(canvas.height * 0.72), canvas.width, Math.round(canvas.height * 0.28));
  drawFigure(canvas.width * 0.46, canvas.height * 0.82, state.profile.gender === "female" ? "#bd667e" : "#477ba0", "right");
  drawMo(canvas.width * 0.54, canvas.height * 0.82, "left");
}

function drawBridgeEndingScene(sceneState) {
  drawPortal(canvas.width * 0.52, canvas.height * 0.58, sceneState.portalAmount ?? 1, true);
  drawFigure(canvas.width * 0.43, canvas.height * 0.76, state.profile.gender === "female" ? "#bd667e" : "#477ba0", "right");
  drawMo(canvas.width * 0.35, canvas.height * 0.76, "right");
  ctx.fillStyle = "#d8bd69";
  ctx.fillRect(Math.round(canvas.width * 0.46), Math.round(canvas.height * 0.61), 8, 32);
  ctx.fillRect(Math.round(canvas.width * 0.445), Math.round(canvas.height * 0.61), 48, 6);
}

function drawEpilogueScene(actorId) {
  ctx.fillStyle = "rgba(8, 10, 16, 0.48)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const centerX = Math.round(canvas.width / 2);
  const baseline = Math.round(canvas.height * 0.73);
  const palette = getActorPalette(actorId);
  drawFigure(centerX, baseline, palette, "down", 1.7);
  if (actorId === "tea-vendor") drawTeaStall(centerX + 70, baseline + 4);
  if (actorId === "children") {
    drawFigure(centerX - 76, baseline + 8, "#e3b84e", "right", 0.8);
    drawFigure(centerX + 76, baseline + 8, "#6da9c5", "left", 0.8);
  }
  if (actorId === "guide") drawGuideFlag(centerX + 48, baseline - 76);
}

function drawCreditsScene(endingId) {
  ctx.fillStyle = "rgba(8, 9, 14, 0.66)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const color = endingId === FINAL_ENDING_IDS.BRIDGE ? "#d8d0a0" : "#d7b66e";
  ctx.fillStyle = color;
  const width = Math.min(420, Math.round(canvas.width * 0.48));
  ctx.fillRect(Math.round((canvas.width - width) / 2), Math.round(canvas.height * 0.46), width, 5);
  ctx.fillStyle = "#f6efd5";
  ctx.fillRect(Math.round(canvas.width / 2) - 4, Math.round(canvas.height * 0.4), 8, 8);
}

function drawPortal(centerX, baselineY, amount, stable) {
  const phase = performance.now() / 130;
  const height = Math.round(canvas.height * 0.39);
  const widths = [68, 42, 18];
  const colors = stable
    ? ["rgba(100, 162, 173, 0.48)", "rgba(218, 201, 121, 0.8)", "rgba(255, 249, 212, 0.96)"]
    : ["rgba(101, 151, 184, 0.5)", "rgba(184, 218, 225, 0.82)", "rgba(255, 248, 211, 0.94)"];
  widths.forEach((width, index) => {
    const currentWidth = Math.max(3, Math.round(width * Math.max(0.06, amount)));
    const sway = Math.round(Math.sin(phase + index * 1.6) * (4 - index));
    ctx.fillStyle = colors[index];
    ctx.fillRect(Math.round(centerX - currentWidth / 2 + sway), Math.round(baselineY - height), currentWidth, height);
    ctx.fillRect(Math.round(centerX - currentWidth / 2 - 8 + sway), Math.round(baselineY - height + 42 + index * 44), currentWidth + 16, 7);
  });
}

function drawFigure(x, baselineY, color, facing = "down", scale = 1.25) {
  const px = Math.round(x);
  const py = Math.round(baselineY);
  ctx.fillStyle = "rgba(4, 6, 9, 0.34)";
  ctx.fillRect(px - 18 * scale, py + 3, 36 * scale, 7);
  ctx.fillStyle = "#2e2d32";
  ctx.fillRect(px - 10 * scale, py - 19 * scale, 8 * scale, 23 * scale);
  ctx.fillRect(px + 2 * scale, py - 19 * scale, 8 * scale, 23 * scale);
  ctx.fillStyle = color;
  ctx.fillRect(px - 15 * scale, py - 54 * scale, 30 * scale, 36 * scale);
  ctx.fillStyle = "#cda681";
  ctx.fillRect(px - 10 * scale, py - 76 * scale, 20 * scale, 21 * scale);
  ctx.fillStyle = "#302d32";
  ctx.fillRect(px - 12 * scale, py - 82 * scale, 24 * scale, 9 * scale);
  ctx.fillStyle = "#171719";
  if (facing === "left") ctx.fillRect(px - 7 * scale, py - 68 * scale, 3 * scale, 3 * scale);
  if (facing === "right") ctx.fillRect(px + 4 * scale, py - 68 * scale, 3 * scale, 3 * scale);
}

function drawMo(x, baselineY, facing) {
  drawFigure(x, baselineY, "#d66b9a", facing, 1.25);
  ctx.fillStyle = "#382c32";
  ctx.fillRect(Math.round(x - 18), Math.round(baselineY - 80), 7, 25);
  ctx.fillRect(Math.round(x + 11), Math.round(baselineY - 80), 7, 25);
}

function drawTeaStall(x, baselineY) {
  ctx.fillStyle = "#a64236";
  ctx.fillRect(x - 26, baselineY - 18, 52, 8);
  ctx.fillRect(x - 20, baselineY - 10, 6, 22);
  ctx.fillRect(x + 14, baselineY - 10, 6, 22);
  ctx.fillStyle = "#bfc8b8";
  ctx.fillRect(x - 8, baselineY - 31, 17, 13);
  ctx.fillStyle = "#d8e6e2";
  ctx.fillRect(x + 15, baselineY - 25, 8, 7);
}

function drawGuideFlag(x, y) {
  ctx.fillStyle = "#d6c8a3";
  ctx.fillRect(x, y, 4, 78);
  ctx.fillStyle = "#c84e4e";
  ctx.fillRect(x + 4, y, 38, 21);
}

function getActorPalette(actorId) {
  const palettes = {
    "tea-vendor": "#a85f45",
    "motorbike-driver": "#5f7682",
    children: "#d78b52",
    priest: "#4a4a50",
    guide: "#4f7393",
    "long-bien-elder": "#8b735f",
    "helped-people": "#6f8b72",
    mo: "#d66b9a"
  };
  return palettes[actorId] || "#71829b";
}

