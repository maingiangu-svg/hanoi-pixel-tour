import { getNpcPortrait, resolvePortraitIdForSpeaker } from "../data/npcPortraits.js";
import { canvas, ctx, runtime, state } from "../state.js";
import { drawDialogueBackground } from "./renderDialogueBackground.js";
import { drawNpcCloseup } from "./renderNpcCloseup.js";

const TRANSITION_MS = 220;

export function drawDialogueViewScene(timestamp = performance.now()) {
  const view = runtime.dialogueView;
  if (!view?.active) return false;
  drawDialogueBackground(view, timestamp);
  if (view.inspect) drawInspectObject(view, timestamp);
  else drawNpcCloseup(view, timestamp);
  drawRimLight(view);
  drawDialogueUiToggleHint(view, timestamp);
  drawTransition(view, timestamp);
  return true;
}

export function drawCutsceneDialoguePortrait(cutscene, timestamp = performance.now()) {
  const dialogue = cutscene?.dialogue;
  if (!dialogue?.portraitId || cutscene.suspicion?.active) return false;
  const profileId = dialogue.portraitId || resolvePortraitIdForSpeaker(dialogue.speaker);
  const profile = getNpcPortrait(profileId);
  if (!profile) return false;
  const view = {
    active: true,
    openedAt: cutscene.startedAt,
    profileId,
    profile,
    mapId: state.currentMapId,
    expression: dialogue.expression || "neutral",
    pose: dialogue.pose || "idle",
    cameraShot: dialogue.cameraShot || "medium",
    kind: dialogue.kind || "speech"
  };
  drawDialogueBackground(view, timestamp);
  drawNpcCloseup(view, timestamp);
  drawRimLight(view);
  return true;
}

function drawRimLight(view) {
  const hour = Number(state.gameTime?.hour) || 0;
  const isNight = hour >= 18 || hour < 5;
  const isInterior = state.currentMapId === "churchInterior";
  if (!isNight && !isInterior) return;
  const width = Math.round(canvas.width * 0.18);
  ctx.save();
  ctx.globalAlpha = isInterior ? 0.12 : 0.08;
  ctx.fillStyle = isInterior ? "#ffd37a" : "#f2b94f";
  ctx.fillRect(Math.round(canvas.width * 0.5) - width / 2, Math.round(canvas.height * 0.2), width, Math.round(canvas.height * 0.52));
  ctx.restore();
}

function drawTransition(view, timestamp) {
  if (!view.transitionStartedAt) return;
  const progress = clamp01((timestamp - view.transitionStartedAt) / TRANSITION_MS);
  const alpha = view.phase === "opening" ? 1 - progress : view.phase === "closing" ? progress : 0;
  if (!(alpha > 0)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawDialogueUiToggleHint(view, timestamp) {
  if (!(timestamp < view.uiHintUntil)) return;
  const remaining = view.uiHintUntil - timestamp;
  const alpha = Math.min(1, remaining / 280);
  const fontSize = Math.max(11, Math.min(14, Math.round(canvas.width / 90)));
  const label = "Tab · Ẩn/hiện hội thoại";
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  const width = Math.ceil(ctx.measureText(label).width) + 14;
  const x = canvas.width - 14;
  const y = 14;
  ctx.globalAlpha = 0.62 * alpha;
  ctx.fillStyle = "#080a0f";
  ctx.fillRect(x - width, y - 5, width + 6, fontSize + 10);
  ctx.globalAlpha = 0.92 * alpha;
  ctx.fillStyle = "#fff1bd";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawInspectObject(view, timestamp) {
  const item = view.inspect;
  const unit = Math.max(3, Math.floor(Math.min(canvas.width, canvas.height) / 180));
  const x = Math.round(canvas.width / 2);
  const y = Math.round(canvas.height * 0.43 + Math.sin(timestamp / 900) * unit);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.fillRect(x - 35 * unit, y - 25 * unit, 70 * unit, 55 * unit);
  if (item.kind === "pendant") {
    ctx.strokeStyle = "#bc8e43";
    ctx.lineWidth = 2 * unit;
    ctx.strokeRect(x - 14 * unit, y - 18 * unit, 28 * unit, 34 * unit);
    ctx.fillStyle = "#dab95d";
    ctx.fillRect(x - 10 * unit, y - 14 * unit, 20 * unit, 26 * unit);
    ctx.fillStyle = "#496d72";
    ctx.fillRect(x - 5 * unit, y - 8 * unit, 10 * unit, 13 * unit);
  } else {
    ctx.fillStyle = "#d7c8a0";
    ctx.fillRect(x - 27 * unit, y - 19 * unit, 54 * unit, 38 * unit);
    ctx.fillStyle = "#8d7157";
    ctx.fillRect(x - 21 * unit, y - 13 * unit, 42 * unit, 24 * unit);
    ctx.fillStyle = "#343a40";
    ctx.fillRect(x - 7 * unit, y - 9 * unit, 14 * unit, 18 * unit);
  }
  ctx.fillStyle = "#fff0bd";
  ctx.font = `${Math.max(12, 3 * unit)}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText(item.label, x, y + 38 * unit);
  ctx.restore();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
