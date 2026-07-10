export const GAME_MINUTES_PER_HOUR = 60;
export const GAME_MINUTES_PER_DAY = GAME_MINUTES_PER_HOUR * 24;
export const DEFAULT_GAME_TIME = {
  day: 1,
  hour: 7,
  minute: 0,
  totalGameMinutes: 420,
  paused: false,
  pauseReasons: []
};

export function normalizeGameTime(rawTime = {}, fallback = DEFAULT_GAME_TIME) {
  const source = rawTime && typeof rawTime === "object" ? rawTime : {};
  const fallbackTotal = getTotalMinutesFromParts(fallback);
  const rawTotal = Number(source.totalGameMinutes);
  const totalGameMinutes = Number.isFinite(rawTotal) && rawTotal >= 0
    ? rawTotal
    : getTotalMinutesFromParts(source, fallbackTotal);

  const normalized = getGameTimeFromTotal(totalGameMinutes);
  const pauseReasons = normalizePauseReasons(
    Array.isArray(source.pauseReasons) ? source.pauseReasons : fallback.pauseReasons
  );
  normalized.pauseReasons = pauseReasons;
  normalized.paused = pauseReasons.length > 0;
  return normalized;
}

export function advanceGameTime(gameTime, elapsedSeconds) {
  const elapsed = Number.isFinite(elapsedSeconds) ? Math.max(0, elapsedSeconds) : 0;
  const total = Math.max(0, Number(gameTime.totalGameMinutes) || 0) + elapsed;
  const normalized = getGameTimeFromTotal(total);
  gameTime.day = normalized.day;
  gameTime.hour = normalized.hour;
  gameTime.minute = normalized.minute;
  gameTime.totalGameMinutes = normalized.totalGameMinutes;
  return gameTime;
}

export function getMinuteOfDay(gameTime) {
  const total = Math.max(0, Math.floor(Number(gameTime?.totalGameMinutes) || 0));
  return total % GAME_MINUTES_PER_DAY;
}

export function formatGameTime(gameTime) {
  const normalized = normalizeGameTime(gameTime);
  return `Ngày ${normalized.day} · ${String(normalized.hour).padStart(2, "0")}:${String(normalized.minute).padStart(2, "0")}`;
}

export function formatGameTimeHud(gameTime) {
  const paused = Boolean(gameTime?.paused || gameTime?.pauseReasons?.length);
  return `${formatGameTime(gameTime)}${paused ? " · Dừng" : ""}`;
}

function getGameTimeFromTotal(totalGameMinutes) {
  const safeTotal = Math.max(0, Number(totalGameMinutes) || 0);
  const wholeMinutes = Math.floor(safeTotal);
  const day = Math.floor(wholeMinutes / GAME_MINUTES_PER_DAY) + 1;
  const minuteOfDay = wholeMinutes % GAME_MINUTES_PER_DAY;
  return {
    day,
    hour: Math.floor(minuteOfDay / GAME_MINUTES_PER_HOUR),
    minute: minuteOfDay % GAME_MINUTES_PER_HOUR,
    totalGameMinutes: safeTotal
  };
}

function getTotalMinutesFromParts(value = {}, fallbackTotal = 0) {
  const source = value && typeof value === "object" ? value : {};
  const day = Number.isFinite(Number(source.day)) ? Math.max(1, Math.floor(Number(source.day))) : null;
  const hour = Number.isFinite(Number(source.hour)) ? Math.max(0, Math.min(23, Math.floor(Number(source.hour)))) : null;
  const minute = Number.isFinite(Number(source.minute)) ? Math.max(0, Math.min(59, Math.floor(Number(source.minute)))) : null;

  if (day === null && hour === null && minute === null) {
    return fallbackTotal;
  }

  return ((day || 1) - 1) * GAME_MINUTES_PER_DAY + (hour || 0) * GAME_MINUTES_PER_HOUR + (minute || 0);
}

function normalizePauseReasons(reasons) {
  if (!Array.isArray(reasons)) {
    return [];
  }

  return Array.from(new Set(reasons.filter((reason) => typeof reason === "string" && reason.trim())));
}
