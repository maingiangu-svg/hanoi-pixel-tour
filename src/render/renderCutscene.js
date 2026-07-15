import { applyWorldCameraTransform } from "../camera.js";
import { canvas, ctx, runtime, state } from "../state.js";
import { drawMoSprite } from "./renderCompanion.js";

let snapshotCanvas = null;
let pixelCanvas = null;
let capturedCutsceneId = null;

export function drawCutsceneOverlay() {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) {
    clearCutsceneRenderBuffers();
    return;
  }

  if (cutscene.suspicion?.active) drawSuspicionFocus(cutscene);
  drawLightingOverride(cutscene.visual);
  drawLetterbox(cutscene.visual.letterbox);
  drawFade(cutscene.visual);
}

export function clearCutsceneRenderBuffers() {
  snapshotCanvas = null;
  pixelCanvas = null;
  capturedCutsceneId = null;
}

export function getCutsceneRenderBufferStateForDebug() {
  return {
    hasSnapshot: Boolean(snapshotCanvas),
    hasPixelBuffer: Boolean(pixelCanvas),
    capturedCutsceneId
  };
}

function drawSuspicionFocus(cutscene) {
  const targetZoom = Number(cutscene.suspicion.zoom) || 1.8;
  const cameraReady = cutscene.camera.zoom >= targetZoom * 0.9;
  if (cameraReady && capturedCutsceneId !== cutscene.id) capturePixelatedFrame(cutscene.id);

  if (capturedCutsceneId === cutscene.id && pixelCanvas) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixelCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.fillStyle = "rgba(24, 28, 40, 0.34)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(104, 104, 112, 0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawSteppedVignette();
  drawSharpMo(cutscene.suspicion.moEntity);
}

function capturePixelatedFrame(cutsceneId) {
  const downscale = 5;
  snapshotCanvas = snapshotCanvas || document.createElement("canvas");
  pixelCanvas = pixelCanvas || document.createElement("canvas");
  snapshotCanvas.width = canvas.width;
  snapshotCanvas.height = canvas.height;
  pixelCanvas.width = Math.max(1, Math.floor(canvas.width / downscale));
  pixelCanvas.height = Math.max(1, Math.floor(canvas.height / downscale));

  const snapshotContext = snapshotCanvas.getContext("2d");
  const pixelContext = pixelCanvas.getContext("2d");
  snapshotContext.imageSmoothingEnabled = false;
  pixelContext.imageSmoothingEnabled = false;
  snapshotContext.clearRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
  snapshotContext.drawImage(canvas, 0, 0);
  pixelContext.clearRect(0, 0, pixelCanvas.width, pixelCanvas.height);
  pixelContext.drawImage(snapshotCanvas, 0, 0, pixelCanvas.width, pixelCanvas.height);
  capturedCutsceneId = cutsceneId;
}

function drawSharpMo(moEntity) {
  const mo = state.moCompanion?.active ? runtime.moCompanionNpc : (moEntity || runtime.scheduledMo);
  if (!mo || mo.mapId !== state.currentMapId || state.moCompanion?.ridingWithPlayer) return;
  ctx.save();
  applyWorldCameraTransform(ctx);
  drawMoSprite(mo, { pauseRoutine: true, facing: mo.facing });
  ctx.restore();
}

function drawSteppedVignette() {
  const steps = 5;
  for (let index = 0; index < steps; index += 1) {
    const insetX = index * 18;
    const insetY = index * 12;
    const alpha = 0.055 + index * 0.018;
    ctx.fillStyle = `rgba(4, 5, 10, ${alpha})`;
    ctx.fillRect(insetX, insetY, canvas.width - insetX * 2, 12);
    ctx.fillRect(insetX, canvas.height - insetY - 12, canvas.width - insetX * 2, 12);
    ctx.fillRect(insetX, insetY + 12, 18, canvas.height - insetY * 2 - 24);
    ctx.fillRect(canvas.width - insetX - 18, insetY + 12, 18, canvas.height - insetY * 2 - 24);
  }
}

function drawLightingOverride(visual) {
  if (!(visual.lightingAlpha > 0)) return;
  ctx.save();
  ctx.globalAlpha = visual.lightingAlpha;
  ctx.fillStyle = visual.lightingColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawLetterbox(amount) {
  if (!(amount > 0)) return;
  const height = Math.round(canvas.height * 0.095 * amount);
  ctx.fillStyle = "#050509";
  ctx.fillRect(0, 0, canvas.width, height);
  ctx.fillRect(0, canvas.height - height, canvas.width, height);
}

function drawFade(visual) {
  if (!(visual.fadeAlpha > 0)) return;
  ctx.save();
  ctx.globalAlpha = visual.fadeAlpha;
  ctx.fillStyle = visual.fadeColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}
