import { AREA_MAP_CONFIG, AREA_PROFILES, AMBIENT_ROLE_LABELS } from "../data/areaProfiles.js";
import { player, state } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { getWeatherIntensity, getWeatherType } from "./weather.js";
import { playBellChime, setAudioTargets, updateAudioTargets } from "./audioManager.js";

const AUDIO_UPDATE_INTERVAL = 120;
let currentAreaKey = "";
let lastAudioUpdate = 0;
let lastBellKey = "";

export function getAreaProfile(mapId, x = null, y = null) {
  const config = AREA_MAP_CONFIG[mapId] || AREA_MAP_CONFIG.hoanKiem;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    const zone = config.zones.find((candidate) => pointInZone(x, y, candidate));
    if (zone && AREA_PROFILES[zone.profileId]) return AREA_PROFILES[zone.profileId];
  }
  return AREA_PROFILES[config.defaultProfile] || AREA_PROFILES.hoanKiemOldQuarter;
}

export function getCurrentAreaAmbience() {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const profile = getAreaProfile(state.currentMapId, centerX, centerY);
  return {
    mapId: state.currentMapId,
    profile,
    density: getProfileDensity(profile, getMinuteOfDay(state.gameTime)),
    weatherIntensity: getWeatherIntensity()
  };
}

export function updateAreaAmbience(timestamp = performance.now()) {
  if (timestamp - lastAudioUpdate < AUDIO_UPDATE_INTERVAL) return;
  lastAudioUpdate = timestamp;

  updateAreaSoundscape();
}

export function updateAreaSoundscape() {

  const ambience = getCurrentAreaAmbience();
  const nextKey = `${ambience.mapId}:${ambience.profile.id}`;
  const targets = buildSoundTargets(ambience);
  if (nextKey !== currentAreaKey) {
    onAreaChanged(currentAreaKey, nextKey, targets);
    currentAreaKey = nextKey;
  } else {
    updateAudioTargets(targets);
  }
  updateCathedralBell(ambience);
}

export function onAreaChanged(_previousAreaId, _nextAreaId, targets = null) {
  setAudioTargets(targets || buildSoundTargets(getCurrentAreaAmbience()), 1.2);
}

export function applyAreaNpcDensity(record, desired, minuteOfDay = getMinuteOfDay(state.gameTime)) {
  if (!desired.active || record.kind !== "pedestrian") return desired;
  const profile = getAreaProfile(record.mapId, desired.x, desired.y);
  const weatherFactor = getAreaWeatherFactor(profile);
  const density = Math.min(1, profile.crowdDensity * getProfileDensity(profile, minuteOfDay) * weatherFactor);
  return { ...desired, active: stableFraction(record.source.id) < density };
}

export function getAreaNpcPresentation(mapId, x, y, id) {
  const profile = getAreaProfile(mapId, x, y);
  const roles = profile.ambientTypes;
  const role = roles[Math.floor(stableFraction(`${id}:role`) * roles.length) % roles.length];
  return {
    ambientRole: role,
    ambientRoleLabel: AMBIENT_ROLE_LABELS[role] || "Người đi bộ",
    movementSpeed: profile.pedestrianSpeed * (0.88 + stableFraction(`${id}:speed`) * 0.24),
    areaProfileId: profile.id
  };
}

export function getAreaTrafficFactor(mapId, x, y) {
  const profile = getAreaProfile(mapId, x, y);
  const minute = getMinuteOfDay(state.gameTime);
  const hourFactor = getTrafficHourFactor(minute);
  const rainFactor = 1 - getWeatherIntensity() * 0.22;
  return Math.min(1, profile.trafficDensity * hourFactor * rainFactor);
}

export function getAreaTrafficSpeedMultiplier(mapId, x, y) {
  const profile = getAreaProfile(mapId, x, y);
  return 0.88 + profile.trafficDensity * 0.18;
}

export function getAreaProfileForPosition(mapId, x, y) {
  return getAreaProfile(mapId, x, y);
}

function buildSoundTargets({ profile, density, weatherIntensity }) {
  const targets = { ...profile.soundscape, weather: 0 };
  const crowdWeather = 1 - weatherIntensity * 0.68;
  const natureWeather = 1 - weatherIntensity * 0.78;
  targets.crowd *= density * crowdWeather;
  targets.traffic *= (0.72 + profile.trafficDensity * 0.28) * (1 - weatherIntensity * 0.2);
  targets.nature *= natureWeather;
  targets.weather = weatherIntensity * (profile.interior ? 0.18 : 0.92);

  (profile.soundSources || []).forEach((source) => {
    const distance = Math.hypot(player.x + player.width / 2 - source.x, player.y + player.height / 2 - source.y);
    const attenuation = Math.max(0, 1 - distance / source.radius);
    targets[source.kind] = Math.min(1, (targets[source.kind] || 0) + attenuation * source.strength);
  });
  return targets;
}

function updateCathedralBell({ profile }) {
  if (profile.id !== "cathedralExterior" && profile.id !== "churchInterior") return;
  const minuteOfDay = getMinuteOfDay(state.gameTime);
  const bellMinute = [17 * 60 + 55, 18 * 60, 19 * 60].find((minute) => minuteOfDay === minute);
  if (bellMinute === undefined) return;
  const key = `${state.gameTime.day}:${bellMinute}`;
  if (key === lastBellKey) return;
  lastBellKey = key;
  playBellChime();
}

function getProfileDensity(profile, minuteOfDay) {
  const entry = profile.densityByTime.find((candidate) => isMinuteInRange(minuteOfDay, candidate.start, candidate.end));
  return entry ? entry.value : profile.nightActivity;
}

function getAreaWeatherFactor(profile) {
  const intensity = getWeatherIntensity();
  if (getWeatherType() === "cloudy") return 0.96;
  return 1 - intensity * (1 - profile.rainActivityMultiplier);
}

function getTrafficHourFactor(minuteOfDay) {
  if ((minuteOfDay >= 7 * 60 && minuteOfDay < 9 * 60) || (minuteOfDay >= 16 * 60 && minuteOfDay < 20 * 60)) return 1;
  if (minuteOfDay >= 9 * 60 && minuteOfDay < 22 * 60) return 0.78;
  if (minuteOfDay >= 5 * 60 && minuteOfDay < 7 * 60) return 0.58;
  return 0.22;
}

function isMinuteInRange(value, start, end) {
  return start < end ? value >= start && value < end : value >= start || value < end;
}

function pointInZone(x, y, zone) {
  return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
}

function stableFraction(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}
