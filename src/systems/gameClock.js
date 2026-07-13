import { runtime, state, ui } from "../state.js";
import { saveGameThrottled } from "../storage.js";
import { advanceGameTime, formatGameTimeHud } from "../utils/gameTime.js";

const MAX_CLOCK_DELTA_SECONDS = 2;

/**
 * Tốc độ thời gian trong game:
 *
 * 1  = 1 giây thật tương đương 1 phút game
 * 10 = 6 giây thật tương đương 1 giờ game
 * 30 = 2 giây thật tương đương 1 giờ game
 * 60 = 1 giây thật tương đương 1 giờ game
 *
 * Đang đặt 60 để test nhanh lịch trình NPC Mơ.
 * Test xong hãy đổi lại thành 1.
 */
const GAME_TIME_SPEED = 1;
let initialized = false;

export function initGameClock() {
  if (initialized) {
    return;
  }

  initialized = true;

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
  const scaledElapsedSeconds = elapsedSeconds * GAME_TIME_SPEED;

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

export function resetGameClockFrame(timestamp = null) {
  runtime.lastGameClockTimestamp = Number.isFinite(timestamp)
    ? timestamp
    : null;

  runtime.lastClockDisplay = Math.floor(
    state.gameTime.totalGameMinutes || 0
  );
}
