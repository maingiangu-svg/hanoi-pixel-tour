import { camera } from "../camera.js";
import { photoSpotsById, getPhotoSpotsForMap } from "../data/photoSpots.js";
import { canvas, player, runtime, state, ui } from "../state.js";
import { saveGame } from "../storage.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { playCameraShutter } from "./audioManager.js";
import { pauseGameClock, resumeGameClock } from "./gameClock.js";
import { isMapTransitionActive } from "./mapTransition.js";
import { closeChoiceModal, isOverlayOpen, openChoiceModal, showMessage } from "./modal.js";
import { isMoCompanionActive, syncMoCompanionToPlayer } from "./moCompanion.js";
import { checkSideQuests } from "./questSystem.js";
import { isRidingVehicle } from "./vehicle.js";
import { getWeatherType } from "./weather.js";
import { getPhotoEventForSpot, markPhotoEventCaptured } from "./randomEvents.js";
import { getActiveViewMode, getViewModePhotoMetadata } from "./viewMode.js";

const PHOTO_CLOCK_PAUSE_REASON = "photo-mode";
const DISCOVERY_CHECK_INTERVAL = 180;
const FRAME_INSET = 48;
let nextDiscoveryCheckAt = 0;

export function isPhotoModeActive() {
  return Boolean(runtime.photoMode?.active);
}

export function togglePhotoMode() {
  return isPhotoModeActive() ? closePhotoMode() : openPhotoMode();
}

export function openPhotoMode() {
  if (isPhotoModeActive()) {
    return true;
  }
  if (isOverlayOpen() || isMapTransitionActive()) {
    return false;
  }
  if (isRidingVehicle()) {
    showMessage("Hãy xuống xe để chụp ảnh.");
    return false;
  }

  runtime.photoMode.active = true;
  runtime.photoMode.openedAt = performance.now();
  runtime.nearbyInteractable = null;
  player.moving = false;
  ui.nearbyHint.classList.add("hidden");
  pauseGameClock(PHOTO_CLOCK_PAUSE_REASON);
  syncMoCompanionToPlayer();
  return true;
}

export function closePhotoMode() {
  if (!isPhotoModeActive()) {
    return false;
  }

  runtime.photoMode.active = false;
  runtime.photoMode.openedAt = 0;
  resumeGameClock(PHOTO_CLOCK_PAUSE_REASON);
  syncMoCompanionToPlayer();
  return true;
}

export function handlePhotoModeKey(key) {
  if (!isPhotoModeActive()) {
    return false;
  }

  if (key === "escape" || key === "p") {
    closePhotoMode();
    return true;
  }
  if (key === "enter" || key === " ") {
    captureCurrentPhoto();
    return true;
  }
  return true;
}

export function updatePhotoSpotDiscovery(timestamp = performance.now()) {
  if (timestamp < nextDiscoveryCheckAt) {
    return false;
  }
  nextDiscoveryCheckAt = timestamp + DISCOVERY_CHECK_INTERVAL;

  ensurePhotoAlbum();
  const center = getPlayerCenter();
  let changed = false;
  getPhotoSpotsForMap(state.currentMapId).forEach((spot) => {
    if (distanceToSpot(center, spot) <= spot.visibleRange && !state.photoAlbum.discoveredSpots.includes(spot.id)) {
      state.photoAlbum.discoveredSpots.push(spot.id);
      changed = true;
    }
  });

  if (changed) {
    saveGame();
  }
  return changed;
}

export function getNearestPhotoSpot({ withinInteractionRange = false } = {}) {
  const center = getPlayerCenter();
  const spots = getPhotoSpotsForMap(state.currentMapId)
    .map((spot) => ({ spot, distance: distanceToSpot(center, spot) }))
    .filter((item) => item.distance <= (withinInteractionRange ? item.spot.radius : item.spot.visibleRange))
    .sort((a, b) => a.distance - b.distance);
  return spots[0] || null;
}

export function evaluatePhotoComposition(spot = getNearestPhotoSpot({ withinInteractionRange: true })?.spot) {
  if (!spot || spot.mapId !== state.currentMapId) {
    return { valid: false, rating: 0, reason: "Hãy đứng đúng vị trí." };
  }

  const center = getPlayerCenter();
  const distance = distanceToSpot(center, spot);
  if (distance > spot.radius) {
    return { valid: false, rating: 0, reason: "Hãy đứng đúng vị trí." };
  }
  const activeView = getActiveViewMode();
  if (activeView) {
    if (activeView.profile.photoSpotId !== spot.id) {
      return { valid: false, rating: 0, reason: "Hãy ngắm đúng địa điểm trước khi chụp." };
    }
    const yawRatio = Math.abs(activeView.yaw) / Math.max(1, activeView.profile.yawLimit);
    const pitchRatio = Math.abs(activeView.pitch) / Math.max(1, activeView.profile.pitchLimit);
    const rating = yawRatio <= 0.28 && pitchRatio <= 0.45 ? 3 : yawRatio <= 0.72 ? 2 : 1;
    return {
      valid: true,
      rating,
      ratingLabel: getPhotoRatingLabel(rating),
      distance,
      viewpointId: activeView.viewpointId
    };
  }
  if (player.facing !== spot.requiredFacing) {
    return { valid: false, rating: 0, reason: "Hãy quay về phía landmark." };
  }
  if (!isTargetInsidePhotoFrame(spot.targetBounds)) {
    return { valid: false, rating: 0, reason: "Địa điểm chưa nằm trọn trong khung." };
  }

  const rating = distance <= 14 ? 3 : distance <= 34 ? 2 : 1;
  return {
    valid: true,
    rating,
    ratingLabel: getPhotoRatingLabel(rating),
    distance
  };
}

export function captureCurrentPhoto() {
  if (!isPhotoModeActive()) {
    return false;
  }

  const nearest = getNearestPhotoSpot({ withinInteractionRange: true });
  const evaluation = evaluatePhotoComposition(nearest?.spot);
  if (!evaluation.valid) {
    showMessage(evaluation.reason, 2600);
    return false;
  }

  const spot = nearest.spot;
  const photo = createPhotoMetadata(spot, evaluation.rating);
  const previous = getCapturedPhoto(spot.id);
  runtime.photoFlashUntil = performance.now() + 170;
  playCameraShutter();
  closePhotoMode();

  if (previous && photo.rating < previous.rating) {
    openRetakeConfirmation(spot, previous, photo);
    return true;
  }

  const upgradesCompanionMemory = Boolean(previous && photo.withMo && !previous.withMo);
  if (previous && photo.rating === previous.rating && !upgradesCompanionMemory && (!photo.eventId || previous.eventId === photo.eventId)) {
    showMessage(`Ảnh cũ đã đạt mức ${getPhotoRatingLabel(previous.rating)} nên được giữ lại.`);
    return true;
  }

  commitPhoto(spot, photo, Boolean(previous));
  return true;
}

export function hasCapturedPhotoSpot(spotId) {
  return Boolean(state.photoAlbum?.photos?.[spotId]);
}

export function getCapturedPhoto(spotId) {
  return state.photoAlbum?.photos?.[spotId] || null;
}

export function getPhotoRating(spotId) {
  return Number(getCapturedPhoto(spotId)?.rating) || 0;
}

export function completePhotoObjective(spotId) {
  if (!hasCapturedPhotoSpot(spotId)) {
    return false;
  }
  checkSideQuests();
  return true;
}

export function isPhotoSpotKnown(spotId) {
  const spot = photoSpotsById[spotId];
  if (!spot) {
    return false;
  }
  return hasCapturedPhotoSpot(spotId) ||
    Boolean(state.photoAlbum?.discoveredSpots?.includes(spotId)) ||
    Boolean(spot.landmarkId && state.discoveredLandmarks.includes(spot.landmarkId));
}

export function getPhotoRatingLabel(rating) {
  if (rating >= 3) return "Hoàn hảo";
  if (rating >= 2) return "Rất đẹp";
  return "Đẹp";
}

export function getFacingHint(facing) {
  const labels = { up: "lên trên", down: "xuống dưới", left: "sang trái", right: "sang phải" };
  return labels[facing] || "về phía địa điểm";
}

function commitPhoto(spot, photo, replaced) {
  ensurePhotoAlbum();
  const firstCapture = !hasCapturedPhotoSpot(spot.id);
  state.photoAlbum.photos[spot.id] = photo;
  if (photo.eventId) markPhotoEventCaptured(photo.eventId);
  if (!state.photoAlbum.discoveredSpots.includes(spot.id)) {
    state.photoAlbum.discoveredSpots.push(spot.id);
  }
  saveGame();
  checkSideQuests();
  const result = replaced
    ? (photo.eventId ? "Ảnh sự kiện đã thay ảnh cũ." : "Ảnh đẹp hơn đã thay ảnh cũ.")
    : "Đã lưu ảnh vào Album Hà Nội.";
  showMessage(`${result} Mức đánh giá: ${photo.ratingLabel}.`);
  return firstCapture;
}

function openRetakeConfirmation(spot, previous, photo) {
  openChoiceModal({
    tag: "Album Hà Nội",
    title: "Ảnh mới có mức đánh giá thấp hơn",
    body: `Ảnh cũ: ${getPhotoRatingLabel(previous.rating)}\nẢnh mới: ${photo.ratingLabel}`,
    actions: [
      {
        label: "Giữ ảnh cũ",
        className: "primary-choice",
        onClick: () => {
          closeChoiceModal();
          showMessage("Đã giữ ảnh cũ trong Album Hà Nội.");
        }
      },
      {
        label: "Thay ảnh mới",
        onClick: () => {
          closeChoiceModal();
          commitPhoto(spot, photo, true);
        }
      }
    ]
  });
}

function createPhotoMetadata(spot, rating) {
  const totalMinutes = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const minuteOfDay = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  const eventMetadata = getPhotoEventForSpot(spot.id, spot.mapId);
  const viewpointMetadata = getViewModePhotoMetadata();
  return {
    photoSpotId: spot.id,
    landmarkId: spot.landmarkId,
    title: spot.title,
    rating,
    ratingLabel: getPhotoRatingLabel(rating),
    gameDay: Math.max(1, Number(state.gameTime.day) || Math.floor(totalMinutes / 1440) + 1),
    gameTime: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    weather: getWeatherType(),
    mapId: spot.mapId,
    playerGender: state.profile?.gender || null,
    withMo: isMoCompanionActive(),
    viewpointId: viewpointMetadata?.viewpointId || null,
    yaw: viewpointMetadata?.yaw || 0,
    pitch: viewpointMetadata?.pitch || 0,
    eventId: eventMetadata?.eventId || null,
    eventTags: eventMetadata?.eventTags || [],
    capturedAt: new Date().toISOString()
  };
}

function isTargetInsidePhotoFrame(bounds) {
  const left = bounds.x - camera.x;
  const top = bounds.y - camera.y;
  const right = left + bounds.width;
  const bottom = top + bounds.height;
  const frameLeft = FRAME_INSET;
  const frameTop = FRAME_INSET;
  const frameRight = canvas.width - FRAME_INSET;
  const frameBottom = canvas.height - FRAME_INSET;
  const overlapWidth = Math.max(0, Math.min(right, frameRight) - Math.max(left, frameLeft));
  const overlapHeight = Math.max(0, Math.min(bottom, frameBottom) - Math.max(top, frameTop));
  const targetArea = Math.max(1, bounds.width * bounds.height);
  return (overlapWidth * overlapHeight) / targetArea >= 0.72;
}

function distanceToSpot(center, spot) {
  return Math.hypot(center.x - spot.x, center.y - spot.y);
}

function ensurePhotoAlbum() {
  if (!state.photoAlbum || typeof state.photoAlbum !== "object") {
    state.photoAlbum = { photos: {}, discoveredSpots: [] };
  }
  if (!state.photoAlbum.photos || typeof state.photoAlbum.photos !== "object") {
    state.photoAlbum.photos = {};
  }
  if (!Array.isArray(state.photoAlbum.discoveredSpots)) {
    state.photoAlbum.discoveredSpots = [];
  }
}
