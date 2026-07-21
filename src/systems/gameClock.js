import { runtime, state, ui } from "../state.js";
import { saveGameThrottled } from "../storage.js";
import { advanceGameTime, formatGameTimeHud } from "../utils/gameTime.js";

const MAX_CLOCK_DELTA_SECONDS = 2;
export const ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG = true;
export const GAME_CLOCK_TIME_SCALES = Object.freeze([1, 5, 15, 60]);
let initialized = false;

export function initGameClock() {
  if (initialized) {
    return;
  }

  initialized = true;
  runtime.gameClockTimeScale = normalizeTimeScale(runtime.gameClockTimeScale);
  refreshTimeScaleHud();

  document.addEventListener("visibilitychange", () => {
    // Bỏ mốc thời gian frame trước khi chuyển trạng thái tab.
    // Việc này ngăn thời gian game nhảy vọt khi quay lại tab.
    runtime.lastGameClockTimestamp = null;
  });
}

export function updateGameClock(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  // Không cập nhật thời gian khi chưa có timestamp trước
  // hoặc khi tab trình duyệt đang bị ẩn.
  if (runtime.lastGameClockTimestamp === null || document.hidden || isGameClockPaused()) {
    runtime.lastGameClockTimestamp = timestamp;
    return false;
  }

  const elapsedSeconds = Math.min(
    MAX_CLOCK_DELTA_SECONDS,
    Math.max(0, (timestamp - runtime.lastGameClockTimestamp) / 1000)
  );

  runtime.lastGameClockTimestamp = timestamp;

  if (!elapsedSeconds) {
    return false;
  }

  // Chỉ nhân lượng thời gian truyền vào hệ thống đồng hồ.
  // Không thay đổi trực tiếp state, HUD hoặc cấu trúc save.
  const scaledElapsedSeconds = elapsedSeconds * getGameClockTimeScale();

  advanceGameTime(state.gameTime, scaledElapsedSeconds);

  const displayedMinute = Math.floor(state.gameTime.totalGameMinutes);

  if (displayedMinute !== runtime.lastClockDisplay) {
    runtime.lastClockDisplay = displayedMinute;
    refreshClockHud();
    saveGameThrottled();
  }

  return true;
}

export function pauseGameClock(reason) {
  if (!reason) {
    return false;
  }

  const reasons = getPauseReasons();
  if (reasons.includes(reason)) {
    return false;
  }

  reasons.push(reason);
  state.gameTime.paused = true;
  runtime.lastGameClockTimestamp = null;
  refreshClockHud();
  return true;
}

export function resumeGameClock(reason) {
  const reasons = getPauseReasons();
  const index = reasons.indexOf(reason);
  if (index < 0) {
    return false;
  }

  reasons.splice(index, 1);
  state.gameTime.paused = reasons.length > 0;
  runtime.lastGameClockTimestamp = null;
  refreshClockHud();
  return true;
}

export function isGameClockPaused() {
  return getPauseReasons().length > 0;
}

export function isGameClockTimeScaleDebugEnabled() {
  return ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG;
}

export function getGameClockTimeScale() {
  if (!ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG) return 1;
  runtime.gameClockTimeScale = normalizeTimeScale(runtime.gameClockTimeScale);
  return runtime.gameClockTimeScale;
}

export function setGameClockTimeScale(scale) {
  if (!ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG) return false;
  const nextScale = normalizeTimeScale(scale);
  if (nextScale === runtime.gameClockTimeScale) {
    refreshTimeScaleHud();
    return false;
  }
  runtime.gameClockTimeScale = nextScale;
  refreshTimeScaleHud();
  return true;
}

export function changeGameClockTimeScale(direction) {
  if (!ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG) return false;
  const currentIndex = GAME_CLOCK_TIME_SCALES.indexOf(getGameClockTimeScale());
  const nextIndex = Math.max(0, Math.min(
    GAME_CLOCK_TIME_SCALES.length - 1,
    currentIndex + Math.sign(Number(direction) || 0)
  ));
  return setGameClockTimeScale(GAME_CLOCK_TIME_SCALES[nextIndex]);
}

export function resetGameClockTimeScale() {
  return setGameClockTimeScale(1);
}

export function handleGameClockTimeScaleDebugKey(key) {
  if (!ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG) return false;
  if (key === "[") {
    changeGameClockTimeScale(-1);
    return true;
  }
  if (key === "]") {
    changeGameClockTimeScale(1);
    return true;
  }
  if (key === "\\") {
    resetGameClockTimeScale();
    return true;
  }
  return false;
}

function getPauseReasons() {
  if (!Array.isArray(state.gameTime.pauseReasons)) {
    state.gameTime.pauseReasons = [];
  }

  state.gameTime.paused = state.gameTime.pauseReasons.length > 0;
  return state.gameTime.pauseReasons;
}

function refreshClockHud() {
  if (ui.hudClock) {
    ui.hudClock.textContent = formatGameTimeHud(state.gameTime);
  }
}

function refreshTimeScaleHud() {
  if (!ui.hudTimeScale) return;
  ui.hudTimeScale.textContent = `Time x${getGameClockTimeScale()}`;
  ui.hudTimeScale.classList.toggle("hidden", !ENABLE_GAME_CLOCK_TIME_SCALE_DEBUG);
}

function normalizeTimeScale(scale) {
  const numericScale = Number(scale);
  return GAME_CLOCK_TIME_SCALES.includes(numericScale) ? numericScale : 1;
}

export function resetGameClockFrame(timestamp = null) {
  runtime.lastGameClockTimestamp = Number.isFinite(timestamp)
    ? timestamp
    : null;

  runtime.lastClockDisplay = Math.floor(
    state.gameTime.totalGameMinutes || 0
  );
}
