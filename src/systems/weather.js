import {
  WEATHER_PROFILES,
  chooseNextWeatherType,
  getWeatherDuration,
  isWeatherType
} from "../data/weatherProfiles.js";
import { state, ui } from "../state.js";
import { saveGame } from "../storage.js";

const TRANSITION_GAME_MINUTES = 30;
const WEATHER_SENSITIVE_ACTIVITIES = new Set(["walk", "jog", "exercise", "danceGroup", "couple"]);
let initialized = false;
let revision = 0;
let lastHudKey = "";

export function initWeather() {
  if (!initialized) {
    initialized = true;
    if (typeof window !== "undefined") {
      window.setWeatherForDebug = setWeatherForDebug;
      const debugType = new URLSearchParams(window.location.search).get("weather");
      if (isLocalDebugHost(window.location.hostname) && isWeatherType(debugType)) {
        setWeather(debugType, 120);
      }
    }
  }
  updateWeatherHud(true);
}

export function updateWeather() {
  const weather = state.weather;
  if (!weather) {
    return false;
  }

  const gameMinute = Math.max(0, Number(state.gameTime.totalGameMinutes) || 0);
  let cursor = Math.max(0, Number(weather.lastUpdatedAtGameMinute) || gameMinute);
  if (cursor > gameMinute) {
    cursor = gameMinute;
  }

  let changed = false;
  let guard = 0;
  while (cursor < gameMinute && guard < 64) {
    const weatherEnd = weather.startedAtGameMinute + weather.durationGameMinutes;
    const segmentEnd = Math.min(gameMinute, weatherEnd);
    updateSurfaceWetness(weather, cursor, segmentEnd);
    cursor = segmentEnd;

    if (cursor >= weatherEnd && gameMinute >= weatherEnd) {
      advanceWeather(weather, weatherEnd);
      changed = true;
      guard += 1;
      continue;
    }
    break;
  }

  const transitionProgress = getTransitionProgress(weather, gameMinute);
  const intensity = interpolateProfileValue(weather, "rainIntensity", transitionProgress);
  if (Math.abs(weather.transitionProgress - transitionProgress) > 0.0001 || Math.abs(weather.intensity - intensity) > 0.0001) {
    weather.transitionProgress = transitionProgress;
    weather.intensity = intensity;
    changed = true;
  }
  weather.lastUpdatedAtGameMinute = gameMinute;

  if (changed) {
    revision += 1;
  }
  updateWeatherHud();
  return changed;
}

export function getCurrentWeather() {
  return state.weather;
}

export function setWeather(type, durationGameMinutes) {
  if (!isWeatherType(type)) {
    return false;
  }

  const now = Math.max(0, Number(state.gameTime.totalGameMinutes) || 0);
  const duration = Number.isFinite(Number(durationGameMinutes)) && Number(durationGameMinutes) > 0
    ? Number(durationGameMinutes)
    : getWeatherDuration(type, now);
  const weather = state.weather;
  weather.type = type;
  weather.startedAtGameMinute = now;
  weather.durationGameMinutes = duration;
  weather.nextWeatherType = chooseNextWeatherType(type, now + duration);
  weather.transitionProgress = 0;
  weather.intensity = WEATHER_PROFILES[type].rainIntensity;
  weather.lastUpdatedAtGameMinute = now;
  revision += 1;
  updateWeatherHud(true);
  return true;
}

export function transitionToWeather(type) {
  if (!isWeatherType(type) || type === state.weather.type) {
    return false;
  }

  const now = Math.max(0, Number(state.gameTime.totalGameMinutes) || 0);
  const elapsed = Math.max(0, now - state.weather.startedAtGameMinute);
  state.weather.nextWeatherType = type;
  state.weather.durationGameMinutes = elapsed + TRANSITION_GAME_MINUTES;
  state.weather.transitionProgress = 0;
  revision += 1;
  return true;
}

export function setWeatherForDebug(type) {
  if (!setWeather(type)) {
    return false;
  }
  if (isRaining()) {
    state.weather.surfaceWetness = Math.max(state.weather.surfaceWetness, type === "heavyRain" ? 0.72 : 0.38);
  }
  saveGame();
  return true;
}

export function isRaining() {
  return getWeatherIntensity() > 0.04;
}

export function getWeatherIntensity() {
  return Math.max(0, Math.min(1, Number(state.weather?.intensity) || 0));
}

export function getWeatherCloudiness() {
  if (!state.weather) {
    return 0;
  }
  return interpolateProfileValue(state.weather, "cloudiness", state.weather.transitionProgress || 0);
}

export function getSurfaceWetness() {
  return Math.max(0, Math.min(1, Number(state.weather?.surfaceWetness) || 0));
}

export function getWeatherLabel() {
  return WEATHER_PROFILES[state.weather?.type]?.label || WEATHER_PROFILES.clear.label;
}

export function getWeatherHudText() {
  return WEATHER_PROFILES[state.weather?.type]?.hud || WEATHER_PROFILES.clear.hud;
}

export function getWeatherScheduleKey() {
  return `${revision}:${state.weather?.type || "clear"}:${Math.round(getWeatherIntensity() * 4)}`;
}

export function getOutdoorNpcFactor(activity) {
  if (!WEATHER_SENSITIVE_ACTIVITIES.has(activity)) {
    return 1;
  }

  const intensity = getWeatherIntensity();
  if (intensity >= 0.85) {
    return activity === "walk" ? 0.14 : 0;
  }
  if (intensity >= 0.48) {
    if (activity === "walk") return 0.42;
    if (activity === "jog") return 0.15;
    if (activity === "couple") return 0.24;
    return 0;
  }
  if (intensity >= 0.12) {
    if (activity === "walk") return 0.8;
    if (activity === "jog") return 0.7;
    if (activity === "exercise") return 0.62;
    if (activity === "danceGroup") return 0.58;
    return 0.72;
  }
  return 1;
}

export function getAmbientVehicleSpeedMultiplier() {
  const intensity = getWeatherIntensity();
  if (intensity >= 0.85) return 0.84;
  if (intensity >= 0.48) return 0.91;
  if (intensity >= 0.12) return 0.97;
  return 1;
}

export function getPlayerVehicleSpeedMultiplier() {
  const intensity = getWeatherIntensity();
  if (intensity >= 0.85) return 0.9;
  if (intensity >= 0.48) return 0.95;
  return 1;
}

export function getWeatherLightBoost() {
  return Math.max(getWeatherCloudiness() * 0.22, getWeatherIntensity() * 0.5);
}

export function getWeatherType() {
  return state.weather?.type || "clear";
}

function advanceWeather(weather, startedAtGameMinute) {
  const type = isWeatherType(weather.nextWeatherType) ? weather.nextWeatherType : "cloudy";
  const duration = getWeatherDuration(type, startedAtGameMinute);
  weather.type = type;
  weather.startedAtGameMinute = startedAtGameMinute;
  weather.durationGameMinutes = duration;
  weather.nextWeatherType = chooseNextWeatherType(type, startedAtGameMinute + duration);
  weather.transitionProgress = 0;
  weather.intensity = WEATHER_PROFILES[type].rainIntensity;
}

function updateSurfaceWetness(weather, startMinute, endMinute) {
  const elapsed = Math.max(0, endMinute - startMinute);
  if (!elapsed) {
    return;
  }

  const midpoint = startMinute + elapsed / 2;
  const intensity = interpolateProfileValue(weather, "rainIntensity", getTransitionProgress(weather, midpoint));
  if (intensity > 0.025) {
    weather.surfaceWetness = clamp01(weather.surfaceWetness + elapsed * (0.003 + intensity * 0.018));
    return;
  }

  const cloudiness = interpolateProfileValue(weather, "cloudiness", getTransitionProgress(weather, midpoint));
  const dryingRate = 0.0024 * (1 - cloudiness * 0.55);
  weather.surfaceWetness = clamp01(weather.surfaceWetness - elapsed * dryingRate);
}

function getTransitionProgress(weather, gameMinute) {
  const end = weather.startedAtGameMinute + weather.durationGameMinutes;
  const duration = Math.min(TRANSITION_GAME_MINUTES, Math.max(8, weather.durationGameMinutes * 0.18));
  return clamp01((gameMinute - (end - duration)) / duration);
}

function interpolateProfileValue(weather, key, progress) {
  const current = WEATHER_PROFILES[weather.type] || WEATHER_PROFILES.clear;
  const next = WEATHER_PROFILES[weather.nextWeatherType] || current;
  return current[key] + (next[key] - current[key]) * clamp01(progress);
}

function updateWeatherHud(force = false) {
  if (!ui.hudWeather) {
    return;
  }
  const key = `${getWeatherType()}:${getWeatherHudText()}`;
  if (!force && key === lastHudKey) {
    return;
  }
  lastHudKey = key;
  ui.hudWeather.textContent = getWeatherHudText();
  ui.hudWeather.setAttribute("data-weather", getWeatherType());
  ui.hudWeather.setAttribute("title", getWeatherLabel());
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function isLocalDebugHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
