import { environmentInteractions } from "../data/environmentInteractions.js";
import { getViewpointById } from "../data/viewpoints.js";
import { keys, player, runtime, state, ui } from "../state.js";
import { syncMoCompanionToPlayer } from "./moCompanion.js";

const VIEW_MODE_CLASS = "view-mode-active";
const YAW_STEP = 6;
const PITCH_STEP = 3;
const SMOOTHING_MS = 82;
const interactionsById = Object.freeze(Object.fromEntries(
  environmentInteractions.map((entry) => [entry.id, entry])
));

export function isViewModeActive() {
  return Boolean(runtime.viewMode?.active);
}

export function getActiveViewMode() {
  return isViewModeActive() ? runtime.viewMode : null;
}

export function enterViewMode(viewpointId) {
  if (isViewModeActive()) return false;
  const profile = getViewpointById(viewpointId);
  const interaction = interactionsById[viewpointId];
  if (!profile || !interaction || profile.mapId !== state.currentMapId) return false;

  const target = interaction.playerPosition || {
    x: profile.position.x - player.width / 2,
    y: profile.position.y - player.height / 2
  };
  const now = performance.now();
  runtime.viewMode = {
    active: true,
    viewpointId: profile.id,
    profile,
    interaction,
    origin: { x: player.x, y: player.y, facing: player.facing },
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    openedAt: now,
    lastTimestamp: now,
    elapsedMs: 0
  };

  player.x = target.x;
  player.y = target.y;
  player.facing = profile.direction;
  player.moving = false;
  clearGameplayMotion();
  runtime.nearbyInteractable = null;
  ui.nearbyHint.classList.add("hidden");
  ui.dialogueBox.classList.add("hidden");
  document.body.classList.add(VIEW_MODE_CLASS);
  syncMoCompanionToPlayer({ force: true });
  return true;
}

export function exitViewMode({ restore = true } = {}) {
  const active = getActiveViewMode();
  if (!active) return false;
  if (restore && active.origin) {
    player.x = active.origin.x;
    player.y = active.origin.y;
    player.facing = active.origin.facing;
    state.player.x = Math.round(player.x);
    state.player.y = Math.round(player.y);
  }
  player.moving = false;
  clearGameplayMotion();
  runtime.viewMode = createEmptyViewModeState();
  document.body.classList.remove(VIEW_MODE_CLASS);
  ui.nearbyHint.classList.add("hidden");
  syncMoCompanionToPlayer({ force: true });
  return true;
}

export function updateViewMode(timestamp = performance.now()) {
  const active = getActiveViewMode();
  if (!active) return false;
  if (active.profile.mapId !== state.currentMapId) {
    exitViewMode({ restore: false });
    return false;
  }

  const deltaMs = Math.max(0, Math.min(50, timestamp - active.lastTimestamp));
  active.lastTimestamp = timestamp;
  active.elapsedMs = timestamp - active.openedAt;
  const smoothing = 1 - Math.exp(-deltaMs / SMOOTHING_MS);
  active.yaw += (active.targetYaw - active.yaw) * smoothing;
  active.pitch += (active.targetPitch - active.pitch) * smoothing;
  return true;
}

export function handleViewModeKey(key) {
  const active = getActiveViewMode();
  if (!active) return false;
  if (key === "e" || key === "escape") {
    exitViewMode();
    return true;
  }
  if (key === "a" || key === "arrowleft") {
    active.targetYaw = clamp(active.targetYaw - YAW_STEP, -active.profile.yawLimit, active.profile.yawLimit);
    return true;
  }
  if (key === "d" || key === "arrowright") {
    active.targetYaw = clamp(active.targetYaw + YAW_STEP, -active.profile.yawLimit, active.profile.yawLimit);
    return true;
  }
  if (key === "w" || key === "arrowup") {
    active.targetPitch = clamp(active.targetPitch + PITCH_STEP, -active.profile.pitchLimit, active.profile.pitchLimit);
    return true;
  }
  if (key === "s" || key === "arrowdown") {
    active.targetPitch = clamp(active.targetPitch - PITCH_STEP, -active.profile.pitchLimit, active.profile.pitchLimit);
    return true;
  }
  return true;
}

export function getViewModePhotoMetadata() {
  const active = getActiveViewMode();
  if (!active) return null;
  return {
    viewpointId: active.viewpointId,
    landmarkId: active.profile.landmarkId,
    photoSpotId: active.profile.photoSpotId,
    yaw: Math.round(active.yaw),
    pitch: Math.round(active.pitch)
  };
}

export function hydrateViewMode() {
  runtime.viewMode = createEmptyViewModeState();
  document.body.classList.remove(VIEW_MODE_CLASS);
}

function clearGameplayMotion() {
  runtime.playerMotionX = 0;
  runtime.playerMotionY = 0;
  runtime.playerMotionSpeed = 0;
  Object.keys(keys).forEach((key) => { keys[key] = false; });
}

function createEmptyViewModeState() {
  return {
    active: false,
    viewpointId: null,
    profile: null,
    interaction: null,
    origin: null,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    openedAt: 0,
    lastTimestamp: 0,
    elapsedMs: 0
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
