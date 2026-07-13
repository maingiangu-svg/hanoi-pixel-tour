export const WEATHER_TYPES = Object.freeze(["clear", "cloudy", "drizzle", "rain", "heavyRain"]);

export const WEATHER_PROFILES = Object.freeze({
  clear: { label: "Trời quang", hud: "QUANG", rainIntensity: 0, cloudiness: 0, minDuration: 180, maxDuration: 480 },
  cloudy: { label: "Nhiều mây", hud: "MÂY", rainIntensity: 0, cloudiness: 0.58, minDuration: 120, maxDuration: 360 },
  drizzle: { label: "Mưa phùn", hud: "PHÙN", rainIntensity: 0.28, cloudiness: 0.72, minDuration: 60, maxDuration: 240 },
  rain: { label: "Mưa vừa", hud: "MƯA", rainIntensity: 0.62, cloudiness: 0.86, minDuration: 60, maxDuration: 180 },
  heavyRain: { label: "Mưa lớn", hud: "MƯA LỚN", rainIntensity: 1, cloudiness: 1, minDuration: 30, maxDuration: 120 }
});

export const WEATHER_TRANSITIONS = Object.freeze({
  clear: [["clear", 0.28], ["cloudy", 0.72]],
  cloudy: [["clear", 0.45], ["cloudy", 0.08], ["drizzle", 0.27], ["rain", 0.17], ["heavyRain", 0.03]],
  drizzle: [["clear", 0.12], ["cloudy", 0.34], ["drizzle", 0.16], ["rain", 0.32], ["heavyRain", 0.06]],
  rain: [["clear", 0.07], ["cloudy", 0.34], ["drizzle", 0.29], ["rain", 0.2], ["heavyRain", 0.1]],
  heavyRain: [["cloudy", 0.3], ["drizzle", 0.25], ["rain", 0.45]]
});

export const WEATHER_PUDDLES = Object.freeze({
  hoanKiem: [
    { x: 396, y: 1354, width: 58, height: 16 },
    { x: 866, y: 758, width: 46, height: 14 },
    { x: 2194, y: 520, width: 62, height: 17 },
    { x: 2508, y: 1362, width: 70, height: 18 }
  ],
  baDinh: [
    { x: 398, y: 1018, width: 52, height: 14 },
    { x: 1578, y: 1034, width: 58, height: 15 },
    { x: 2564, y: 1834, width: 48, height: 13 }
  ],
  longBien: [
    { x: 280, y: 894, width: 70, height: 19 },
    { x: 524, y: 334, width: 58, height: 16 },
    { x: 764, y: 1208, width: 76, height: 20 },
    { x: 1048, y: 1122, width: 52, height: 15 },
    { x: 1280, y: 1212, width: 68, height: 18 },
    { x: 1530, y: 1380, width: 62, height: 17 }
  ]
});

const DEFAULT_START_MINUTE = 420;

export function createDefaultWeatherState(startedAtGameMinute = DEFAULT_START_MINUTE) {
  const start = Math.max(0, Number(startedAtGameMinute) || DEFAULT_START_MINUTE);
  return {
    type: "clear",
    intensity: 0,
    startedAtGameMinute: start,
    durationGameMinutes: 300,
    nextWeatherType: "cloudy",
    transitionProgress: 0,
    surfaceWetness: 0,
    lastUpdatedAtGameMinute: start
  };
}

export function normalizeWeatherState(rawWeather, fallback, currentGameMinute) {
  const base = fallback || createDefaultWeatherState(currentGameMinute);
  const raw = rawWeather && typeof rawWeather === "object" ? rawWeather : {};
  const type = isWeatherType(raw.type) ? raw.type : base.type;
  const startedAtGameMinute = finiteNonNegative(raw.startedAtGameMinute, currentGameMinute);
  const durationGameMinutes = finitePositive(
    raw.durationGameMinutes,
    base.durationGameMinutes || getWeatherDuration(type, startedAtGameMinute)
  );
  const nextWeatherType = isWeatherType(raw.nextWeatherType)
    ? raw.nextWeatherType
    : chooseNextWeatherType(type, startedAtGameMinute + durationGameMinutes);
  const profile = WEATHER_PROFILES[type];

  return {
    type,
    intensity: clamp01(Number.isFinite(Number(raw.intensity)) ? Number(raw.intensity) : profile.rainIntensity),
    startedAtGameMinute,
    durationGameMinutes,
    nextWeatherType,
    transitionProgress: clamp01(Number(raw.transitionProgress) || 0),
    surfaceWetness: clamp01(Number(raw.surfaceWetness) || 0),
    lastUpdatedAtGameMinute: Math.min(
      Math.max(startedAtGameMinute, finiteNonNegative(raw.lastUpdatedAtGameMinute, currentGameMinute)),
      Math.max(startedAtGameMinute, Number(currentGameMinute) || startedAtGameMinute)
    )
  };
}

export function chooseNextWeatherType(currentType, seed) {
  const transitions = WEATHER_TRANSITIONS[currentType] || WEATHER_TRANSITIONS.clear;
  const roll = seededUnit(seed + hashWeatherType(currentType) * 97);
  let cursor = 0;
  for (const [type, weight] of transitions) {
    cursor += weight;
    if (roll <= cursor) {
      return type;
    }
  }
  return transitions[transitions.length - 1][0];
}

export function getWeatherDuration(type, seed) {
  const profile = WEATHER_PROFILES[type] || WEATHER_PROFILES.clear;
  const span = profile.maxDuration - profile.minDuration;
  return Math.round(profile.minDuration + seededUnit(seed + hashWeatherType(type) * 211) * span);
}

export function isWeatherType(type) {
  return WEATHER_TYPES.includes(type);
}

export function seededUnit(seed) {
  let value = Math.floor(Number(seed) || 0) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function hashWeatherType(type) {
  return WEATHER_TYPES.indexOf(type) + 1;
}

function finiteNonNegative(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : Math.max(0, Number(fallback) || 0);
}

function finitePositive(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Math.max(1, Number(fallback) || 1);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
