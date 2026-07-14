import { randomEventDefinitions, randomEventsById } from "../data/randomEvents.js";
import { isRectVisible } from "../camera.js";
import { player, runtime, state } from "../state.js";
import { saveGame, saveGameThrottled } from "../storage.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getAreaEventActivityFactor } from "./areaAmbience.js";
import { playTrainPassCue } from "./audioManager.js";
import { isGameClockPaused } from "./gameClock.js";
import { showMessage } from "./modal.js";
import { getWeatherType } from "./weather.js";

const ACTIVE_QUEST_STATUSES = new Set(["active", "unresolved"]);
const OUTDOOR_MAPS = new Set(["hoanKiem", "baDinh", "longBien"]);
const activeCacheByMap = Object.create(null);
let cacheDirty = true;
let initialized = false;
let lastMinute = -1;
let lastWeatherType = "clear";
let lastMapId = null;
let lastActiveStateRef = null;

export function initRandomEvents() {
  ensureEventState();
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    window.startEventForDebug = startEventForDebug;
    window.endEventForDebug = endEventForDebug;
    window.listAvailableEventsForDebug = listAvailableEventsForDebug;
    window.clearEventCooldownForDebug = clearEventCooldownForDebug;
  }
  lastMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  lastWeatherType = getWeatherType();
  lastMapId = state.currentMapId;
  updateActiveEvents();
}

export function hydrateRandomEvents() {
  ensureEventState();
  cacheDirty = true;
  initRandomEvents();
}

export function updateRandomEvents() {
  ensureEventState();
  const minute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const weatherType = getWeatherType();
  const minuteChanged = minute !== lastMinute;
  const weatherChanged = weatherType !== lastWeatherType;
  const mapChanged = state.currentMapId !== lastMapId;

  if (!minuteChanged && !weatherChanged && !mapChanged) {
    return false;
  }

  if (minuteChanged || weatherChanged) {
    updateActiveEvents();
  }

  if (!isGameClockPaused()) {
    if (weatherChanged) {
      evaluateWeatherEvents(lastWeatherType, weatherType);
      evaluateRandomEvents({ reason: "weather" });
    }
    if (minuteChanged) {
      evaluateRandomEvents({ reason: "minute" });
    }
    if (mapChanged) {
      evaluateRandomEvents({ reason: "map", mapId: state.currentMapId });
    }
  }

  lastMinute = minute;
  lastWeatherType = weatherType;
  lastMapId = state.currentMapId;
  syncEventCollisionBlocks();
  return true;
}

export function evaluateRandomEvents({ reason = "minute", mapId = null } = {}) {
  if (isGameClockPaused()) return [];
  const started = [];
  const absoluteMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const minuteOfDay = getMinuteOfDay(state.gameTime);

  randomEventDefinitions.forEach((definition) => {
    if (definition.weatherTrigger) return;
    if (mapId && !eventAppliesToMap(definition, mapId)) return;
    if (!shouldEvaluateDefinition(definition, absoluteMinute, minuteOfDay, reason)) return;
    if (!canStartEvent(definition.id)) return;
    const roll = deterministicRoll(definition.id, getEvaluationBucket(definition, absoluteMinute));
    if (roll <= (definition.chance ?? 1) && startRandomEvent(definition.id)) {
      started.push(definition.id);
    }
  });

  return started;
}

export function canStartEvent(eventOrId, { force = false } = {}) {
  const definition = typeof eventOrId === "string" ? randomEventsById[eventOrId] : eventOrId;
  if (!definition || state.randomEvents.active[definition.id]) return false;
  if (force) return true;
  if (isGameClockPaused()) return false;

  const now = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  if ((Number(state.randomEvents.cooldowns[definition.id]) || 0) > now) return false;
  if (!matchesCurrentTime(definition)) return false;
  if (!matchesWeather(definition, getWeatherType())) return false;
  if (!matchesAreaActivity(definition)) return false;
  if (hasQuestConflict(definition)) return false;
  if (!hasMapCapacity(definition)) return false;
  if (wouldSpawnOnPlayer(definition)) return false;
  return true;
}

export function startRandomEvent(eventId, options = {}) {
  const definition = randomEventsById[eventId];
  if (!definition || !canStartEvent(definition, options)) return false;
  const now = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const duration = Math.max(1, Number(options.durationGameMinutes) || definition.durationGameMinutes || 30);
  state.randomEvents.active[eventId] = {
    eventId,
    mapId: options.mapId || definition.mapId || "*",
    startedAt: now,
    endsAt: now + duration,
    state: "active",
    phase: getPhaseForDefinition(definition, 0),
    interactionResolved: false,
    outcome: null
  };
  state.randomEvents.cooldowns[eventId] = now + Math.max(duration, definition.cooldownGameMinutes || duration);
  cacheDirty = true;
  syncEventCollisionBlocks();

  if (definition.visualType === "trainPass" && state.currentMapId === "longBien") playTrainPassCue();
  if (definition.notice && eventAppliesToMap(definition, state.currentMapId)) {
    showMessage(definition.notice, 3200);
  }
  saveGameThrottled();
  return true;
}

export function updateActiveEvents() {
  ensureEventState();
  const now = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const weatherType = getWeatherType();
  let changed = false;

  Object.entries(state.randomEvents.active).forEach(([eventId, active]) => {
    const definition = randomEventsById[eventId];
    if (!definition || now >= active.endsAt || definition.endOnWeather?.includes(weatherType)) {
      if (definition && now >= active.endsAt && shouldDeferVisibleEnd(definition)) {
        active.endsAt = now + 5;
        active.phase = "clearing";
        changed = true;
        return;
      }
      endRandomEvent(eventId, definition?.endOnWeather?.includes(weatherType) ? "weather" : "finished");
      changed = true;
      return;
    }
    const nextPhase = getPhaseForDefinition(definition, getEventProgress(active));
    if (active.phase !== nextPhase) {
      active.phase = nextPhase;
      changed = true;
    }
  });

  if (changed) saveGameThrottled();
  syncEventCollisionBlocks();
  return changed;
}

export function endRandomEvent(eventId, outcome = "finished") {
  const active = state.randomEvents?.active?.[eventId];
  if (!active) return false;
  delete state.randomEvents.active[eventId];
  const previous = state.randomEvents.completedFlags[eventId];
  state.randomEvents.completedFlags[eventId] = {
    ...(previous && typeof previous === "object" ? previous : {}),
    lastOutcome: active.outcome || outcome,
    lastCompletedAt: Math.floor(Number(state.gameTime.totalGameMinutes) || 0),
    count: Math.max(0, Number(previous?.count) || 0) + 1
  };
  cacheDirty = true;
  syncEventCollisionBlocks();
  saveGameThrottled();
  return true;
}

export function isEventActive(eventId) {
  return Boolean(state.randomEvents?.active?.[eventId]);
}

export function getActiveEventsForMap(mapId) {
  ensureEventState();
  if (cacheDirty) rebuildActiveCache();
  return activeCacheByMap[mapId] || [];
}

export function getEventProgress(activeOrId) {
  const active = typeof activeOrId === "string" ? state.randomEvents?.active?.[activeOrId] : activeOrId;
  if (!active) return 0;
  const now = Number(state.gameTime.totalGameMinutes) || 0;
  return clamp01((now - active.startedAt) / Math.max(1, active.endsAt - active.startedAt));
}

export function getRandomEventInteractables(mapId = state.currentMapId) {
  return getActiveEventsForMap(mapId)
    .filter(({ definition, active }) => definition.interaction && !active.interactionResolved)
    .map(({ definition, active }) => {
      const anchor = getEventAnchor(definition, mapId);
      return {
        type: "randomEvent",
        source: { definition, active },
        object: {
          id: definition.id,
          name: definition.interaction.name || definition.name,
          x: anchor.x - 10,
          y: anchor.y - 20,
          width: 24,
          height: 44
        },
        point: {
          id: `event-${definition.id}`,
          x: anchor.x,
          y: anchor.y,
          radius: definition.interaction.radius || 60,
          visibleRange: 190,
          labelOffsetX: 0,
          labelOffsetY: -44
        },
        priority: 1,
        range: definition.interaction.radius || 60
      };
    });
}

export function getPhotoEventForSpot(spotId, mapId = state.currentMapId) {
  const matches = getActiveEventsForMap(mapId).filter(({ definition }) => definition.photoSpotIds?.includes(spotId));
  if (!matches.length) return null;
  const { definition } = matches[0];
  return { eventId: definition.id, eventTags: [...(definition.photoTags || ["sự kiện"])] };
}

export function markPhotoEventCaptured(eventId) {
  const active = state.randomEvents?.active?.[eventId];
  if (!active) return false;
  active.interactionResolved = true;
  active.outcome = "photographed";
  state.randomEvents.completedFlags[eventId] = {
    ...(state.randomEvents.completedFlags[eventId] || {}),
    photographed: true,
    lastPhotoAt: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
  saveGameThrottled();
  return true;
}

export function completeRandomEventInteraction(eventId, outcome, { reward = 0, endAfter = false } = {}) {
  const active = state.randomEvents?.active?.[eventId];
  if (!active || active.interactionResolved) return false;
  active.interactionResolved = true;
  active.outcome = outcome;
  if (reward > 0) state.money += reward;
  state.randomEvents.completedFlags[eventId] = {
    ...(state.randomEvents.completedFlags[eventId] || {}),
    lastOutcome: outcome,
    lastInteractionAt: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
  if (endAfter) endRandomEvent(eventId, outcome);
  else saveGame();
  return true;
}

export function startEventForDebug(eventId) {
  return startRandomEvent(eventId, { force: true });
}

export function endEventForDebug(eventId) {
  return endRandomEvent(eventId, "debug-ended");
}

export function listAvailableEventsForDebug() {
  return randomEventDefinitions.map((event) => ({
    id: event.id,
    name: event.name,
    active: isEventActive(event.id),
    canStart: canStartEvent(event.id)
  }));
}

export function clearEventCooldownForDebug(eventId) {
  if (!randomEventsById[eventId]) return false;
  delete state.randomEvents.cooldowns[eventId];
  saveGameThrottled();
  return true;
}

function evaluateWeatherEvents(previousType, nextType) {
  const wasRaining = isWetWeather(previousType);
  const nowHeavyRain = nextType === "rain" || nextType === "heavyRain";
  const nowDry = nextType === "clear" || nextType === "cloudy";
  if (!wasRaining && nowHeavyRain) {
    endRandomEvent("weatherAfterRain", "rain-returned");
    startRandomEvent("weatherRainRush", { force: true });
  }
  if (wasRaining && nowDry) {
    endRandomEvent("weatherRainRush", "rain-stopped");
    startRandomEvent("weatherAfterRain", { force: true });
  }
}

function ensureEventState() {
  if (!state.randomEvents || typeof state.randomEvents !== "object") {
    state.randomEvents = { active: {}, cooldowns: {}, completedFlags: {} };
  }
  state.randomEvents.active ||= {};
  state.randomEvents.cooldowns ||= {};
  state.randomEvents.completedFlags ||= {};
  runtime.eventCollisionBlocks ||= [];
  if (lastActiveStateRef !== state.randomEvents.active) {
    lastActiveStateRef = state.randomEvents.active;
    cacheDirty = true;
  }
}

function shouldEvaluateDefinition(definition, absoluteMinute, minuteOfDay, reason) {
  if (definition.triggerMinutes) return definition.triggerMinutes.includes(minuteOfDay);
  if (reason === "weather") return false;
  if (reason === "map") return eventAppliesToMap(definition, state.currentMapId);
  const interval = Math.max(15, definition.evaluationInterval || 60);
  return absoluteMinute % interval === 0;
}

function matchesCurrentTime(definition) {
  const minute = getMinuteOfDay(state.gameTime);
  if (definition.triggerMinutes && !definition.triggerMinutes.includes(minute)) return false;
  if (!definition.timeWindows?.length) return true;
  return definition.timeWindows.some((range) => range.start <= range.end
    ? minute >= range.start && minute < range.end
    : minute >= range.start || minute < range.end);
}

function matchesWeather(definition, type) {
  if (definition.allowedWeather && !definition.allowedWeather.includes(type)) return false;
  if (definition.blockedWeather?.includes(type)) return false;
  return true;
}

function matchesAreaActivity(definition) {
  if (!Number.isFinite(definition.minAreaActivity) || !definition.mapId || !definition.anchor) return true;
  return getAreaEventActivityFactor(definition.mapId, definition.anchor.x, definition.anchor.y) >= definition.minAreaActivity;
}

function hasQuestConflict(definition) {
  return (definition.blockedByQuestIds || []).some((questId) =>
    ACTIVE_QUEST_STATUSES.has(state.branchingQuestProgress?.[questId]?.status)
  );
}

function hasMapCapacity(definition) {
  if (definition.capacityExempt) return true;
  const mapIds = definition.mapIds || [definition.mapId];
  return mapIds.every((mapId) => {
    const events = getActiveEventsForMap(mapId).filter(({ definition: item }) => !item.capacityExempt);
    if (!events.length) return true;
    if (definition.size === "large") return false;
    return !events.some(({ definition: item }) => item.size === "large") && events.length < 2;
  });
}

function wouldSpawnOnPlayer(definition) {
  if (definition.spawnSafeExempt) return false;
  if (!eventAppliesToMap(definition, state.currentMapId)) return false;
  const anchor = getEventAnchor(definition, state.currentMapId);
  if (!anchor) return false;
  const center = getPlayerCenter();
  return Math.hypot(center.x - anchor.x, center.y - anchor.y) < 105 ||
    isRectVisible({ x: anchor.x - 80, y: anchor.y - 70, width: 160, height: 140 }, 20);
}

function shouldDeferVisibleEnd(definition) {
  if (definition.allowVisibleEnd || !eventAppliesToMap(definition, state.currentMapId)) return false;
  const anchor = getEventAnchor(definition, state.currentMapId);
  return Boolean(anchor && isRectVisible({ x: anchor.x - 90, y: anchor.y - 80, width: 180, height: 160 }, 20));
}

function rebuildActiveCache() {
  Object.keys(activeCacheByMap).forEach((mapId) => { activeCacheByMap[mapId].length = 0; });
  Object.entries(state.randomEvents.active).forEach(([eventId, active]) => {
    const definition = randomEventsById[eventId];
    if (!definition) return;
    const mapIds = definition.mapIds || [definition.mapId];
    mapIds.forEach((mapId) => {
      if (!OUTDOOR_MAPS.has(mapId) && mapId !== "churchInterior") return;
      activeCacheByMap[mapId] ||= [];
      activeCacheByMap[mapId].push({ definition, active });
    });
  });
  cacheDirty = false;
}

function syncEventCollisionBlocks() {
  const blocks = runtime.eventCollisionBlocks || (runtime.eventCollisionBlocks = []);
  blocks.length = 0;
  const active = state.randomEvents?.active?.longBienTrainPass;
  if (!active || state.currentMapId !== "longBien") return;
  const progress = getEventProgress(active);
  if (progress >= 0.9) return;
  const gate = { mapId: "longBien", x: 1070, y: 526, width: 24, height: 202, eventId: "longBienTrainPass" };
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  if (centerX >= gate.x - 18 && centerX <= gate.x + gate.width + 18 && centerY >= gate.y - 18 && centerY <= gate.y + gate.height + 18) return;
  blocks.push(gate);
}

function eventAppliesToMap(definition, mapId) {
  return definition.mapId === mapId || definition.mapIds?.includes(mapId);
}

function getEventAnchor(definition, mapId) {
  return definition.anchorsByMap?.[mapId] || definition.anchor || null;
}

function getEvaluationBucket(definition, absoluteMinute) {
  const interval = Math.max(1, definition.evaluationInterval || 60);
  return Math.floor(absoluteMinute / interval);
}

function deterministicRoll(id, bucket) {
  let hash = 2166136261;
  const input = `${id}:${bucket}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function getPhaseForDefinition(definition, progress) {
  if (definition.visualType === "trainPass") {
    if (progress < 0.24) return "warning";
    if (progress < 0.86) return "passing";
    return "clearing";
  }
  if (definition.visualType === "busArrival") {
    if (progress < 0.32) return "arriving";
    if (progress < 0.7) return "stopped";
    return "leaving";
  }
  return "active";
}

function isWetWeather(type) {
  return ["drizzle", "rain", "heavyRain"].includes(type);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
