import { maps } from "../data/maps.js";
import {
  ACTIVITY_SCHEDULES,
  AMBIENT_PEDESTRIANS,
  CHILD_COUNT_SCHEDULE,
  CHURCH_EXTERIOR_CROWD,
  NPC_SCHEDULES,
  PEDESTRIAN_DENSITY_SCHEDULE,
  SHOP_SCHEDULES
} from "../data/worldSchedules.js";
import { player, state } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import {
  getOutdoorNpcFactor,
  getWeatherIntensity,
  getWeatherScheduleKey
} from "./weather.js";
import { applyAreaNpcDensity, getAreaNpcPresentation } from "./areaAmbience.js";

const EMPTY_LIST = Object.freeze([]);
const SAFE_TRANSITION_DISTANCE = 760;
const POSITION_SNAP_DISTANCE = 90;

const recordsByMap = Object.create(null);
const staticNpcsByMap = Object.create(null);
const activeNpcsByMap = Object.create(null);
let initialized = false;
let lastResolvedMinute = -1;
let lastResolvedMapId = null;
let lastResolvedWeatherKey = "";
let activeListsDirty = false;

export function updateWorldSchedules() {
  ensureInitialized();
  const absoluteMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  const mapChanged = lastResolvedMapId !== state.currentMapId;
  const weatherKey = getWeatherScheduleKey();

  if (absoluteMinute !== lastResolvedMinute || mapChanged || weatherKey !== lastResolvedWeatherKey) {
    const minuteOfDay = getMinuteOfDay(state.gameTime);
    resolveAllRecords(minuteOfDay, mapChanged);
    lastResolvedMinute = absoluteMinute;
    lastResolvedMapId = state.currentMapId;
    lastResolvedWeatherKey = weatherKey;
  }

  updatePendingTransitions();
  if (activeListsDirty) {
    rebuildActiveLists();
  }
}

export function syncScheduledNpcsForCurrentMap() {
  lastResolvedMapId = null;
  updateWorldSchedules();
}

export function getActiveMapNpcs(map) {
  ensureInitialized();
  if (lastResolvedMinute < 0) {
    updateWorldSchedules();
  }
  return activeNpcsByMap[map.id] || staticNpcsByMap[map.id] || EMPTY_LIST;
}

export function resolveNpcStateFromGameTime(npc, minuteOfDay = getMinuteOfDay(state.gameTime)) {
  const schedule = NPC_SCHEDULES[npc.id] || ACTIVITY_SCHEDULES[npc.activity];
  if (!schedule) {
    return { active: true, state: "available", x: npc.x, y: npc.y };
  }

  const entry = getScheduleEntryForTime(schedule, minuteOfDay);
  if (!entry) {
    return { active: false, state: "away", x: npc.x, y: npc.y };
  }

  return {
    active: true,
    state: entry.state || "available",
    x: entry.position?.x ?? npc.x,
    y: entry.position?.y ?? npc.y,
    customerCount: entry.customerCount ?? 0
  };
}

export function updateScheduledNpc(record, desired, force = false) {
  const npc = record.npc;
  const nearPlayer = isNearPlayer(npc.x, npc.y);

  if (!record.initialized || force || state.currentMapId !== record.mapId || !nearPlayer) {
    applyDesiredState(record, desired);
    record.initialized = true;
    return;
  }

  if (npc.visible !== desired.active) {
    record.pending = desired;
    return;
  }

  npc.scheduleState = desired.state;
  npc.customerCount = desired.customerCount || 0;
  if (desired.active && Math.hypot(desired.x - npc.x, desired.y - npc.y) > POSITION_SNAP_DISTANCE) {
    record.pending = desired;
  } else if (desired.active) {
    npc.x = desired.x;
    npc.y = desired.y;
  }
}

export function getScheduleEntryForTime(schedule, minuteOfDay) {
  if (!Array.isArray(schedule)) {
    return null;
  }
  return schedule.find((entry) => isMinuteInRange(minuteOfDay, entry.start, entry.end)) || null;
}

export function getShopStatus(shop, minuteOfDay = getMinuteOfDay(state.gameTime)) {
  const scheduleId = shop.foodId || shop.vehicleId;
  const schedule = SHOP_SCHEDULES[scheduleId];
  if (!schedule) {
    return { open: true, schedule: EMPTY_LIST, scheduleId };
  }
  return {
    open: Boolean(getScheduleEntryForTime(schedule, minuteOfDay)),
    schedule,
    scheduleId
  };
}

export function isShopOpen(shop, minuteOfDay = getMinuteOfDay(state.gameTime)) {
  return getShopStatus(shop, minuteOfDay).open;
}

export function getShopHoursText(shop) {
  const schedule = getShopStatus(shop).schedule;
  return schedule.map((entry) => `${formatMinute(entry.start)}–${formatMinute(entry.end)}`).join(" · ");
}

export function isGenericStorefrontOpen(minuteOfDay = getMinuteOfDay(state.gameTime)) {
  return minuteOfDay >= 6 * 60 && minuteOfDay < 22 * 60;
}

export function getScheduledChildCount(minuteOfDay = getMinuteOfDay(state.gameTime)) {
  const scheduledCount = getScheduleEntryForTime(CHILD_COUNT_SCHEDULE, minuteOfDay)?.count || 0;
  const intensity = getWeatherIntensity();
  if (intensity >= 0.48) {
    return 0;
  }
  if (intensity >= 0.12) {
    return Math.min(scheduledCount, Math.max(0, Math.ceil(scheduledCount * 0.5)));
  }
  return scheduledCount;
}

function ensureInitialized() {
  if (initialized) {
    return;
  }

  Object.values(maps).forEach((map) => {
    const staticNpcs = [];
    const records = [];

    (map.npcs || EMPTY_LIST).forEach((npc) => {
      if (NPC_SCHEDULES[npc.id] || ACTIVITY_SCHEDULES[npc.activity]) {
        records.push(createRecord(map.id, npc, "mapNpc"));
      } else {
        const presentation = npc.task?.type === "ambient" || npc.activity
          ? getAreaNpcPresentation(map.id, npc.x, npc.y, npc.id)
          : null;
        staticNpcs.push(presentation ? { ...npc, ...presentation } : npc);
      }
    });

    const pedestrianRows = AMBIENT_PEDESTRIANS[map.id] || EMPTY_LIST;
    pedestrianRows.forEach((row, index) => {
      records.push(createRecord(map.id, {
        id: row[0],
        name: "Người đi bộ",
        x: row[1],
        y: row[2],
        color: row[3],
        activity: "walk",
        pathAmplitude: 18 + (index % 3) * 5,
        interactable: false,
        showLabel: false,
        densityRank: index
      }, "pedestrian"));
    });

    if (map.id === "hoanKiem") {
      CHURCH_EXTERIOR_CROWD.forEach((row, index) => {
        records.push(createRecord(map.id, {
          id: row[0],
          name: "Giáo dân",
          x: row[1],
          y: row[2],
          color: row[3],
          activity: "walk",
          pathAmplitude: 8,
          interactable: false,
          showLabel: false,
          crowdRank: index
        }, "churchCrowd"));
      });
    }

    recordsByMap[map.id] = records;
    staticNpcsByMap[map.id] = staticNpcs;
    activeNpcsByMap[map.id] = staticNpcs.slice();
  });

  initialized = true;
}

function createRecord(mapId, source, kind) {
  const areaPresentation = kind === "pedestrian" || source.task?.type === "ambient"
    ? getAreaNpcPresentation(mapId, source.x, source.y, source.id)
    : null;
  return {
    mapId,
    kind,
    source,
    initialized: false,
    pending: null,
    npc: {
      ...source,
      ...(areaPresentation || {}),
      mapId,
      baseX: source.x,
      baseY: source.y,
      scheduleState: "away",
      visible: false
    }
  };
}

function resolveAllRecords(minuteOfDay, mapChanged) {
  const density = getScheduleEntryForTime(PEDESTRIAN_DENSITY_SCHEDULE, minuteOfDay) || { factor: 0 };

  Object.keys(recordsByMap).forEach((mapId) => {
    const records = recordsByMap[mapId];
    const churchCount = Math.ceil(getExteriorChurchCrowdCount(minuteOfDay) * getChurchCrowdWeatherFactor());

    records.forEach((record) => {
      let desired;
      if (record.kind === "pedestrian") {
        desired = applyAreaNpcDensity(record, {
          active: true,
          state: density.state,
          x: record.source.x,
          y: record.source.y,
          customerCount: 0
        }, minuteOfDay);
      } else if (record.kind === "churchCrowd") {
        desired = {
          active: record.source.crowdRank < churchCount,
          state: minuteOfDay < 18 * 60 ? "walkingToMass" : "leavingMass",
          x: record.source.x,
          y: record.source.y,
          customerCount: 0
        };
      } else {
        desired = resolveNpcStateFromGameTime(record.source, minuteOfDay);
        desired = resolveWeatherReaction(record.source, desired);
      }

      updateScheduledNpc(record, desired, mapChanged);
    });
  });
  activeListsDirty = true;
}

function resolveWeatherReaction(npc, desired) {
  if (!desired.active) {
    return desired;
  }

  const intensity = getWeatherIntensity();
  if (npc.activity === "teaSeller" && intensity >= 0.12) {
    return {
      ...desired,
      state: intensity >= 0.85 ? "rainShelter" : "coveredTea",
      customerCount: intensity >= 0.48 ? 0 : Math.min(1, desired.customerCount || 0)
    };
  }

  if (npc.activity === "xeOm" && intensity >= 0.12) {
    return { ...desired, state: intensity >= 0.48 ? "shelteringFromRain" : "wearingRaincoat" };
  }

  const weatherFactor = getOutdoorNpcFactor(npc.activity);
  if (weatherFactor >= 1) {
    return desired;
  }
  if (weatherFactor <= 0 || stableNpcFraction(npc.id) > weatherFactor) {
    return { ...desired, active: false, state: "shelteringFromRain" };
  }
  return { ...desired, state: `${desired.state || "outside"}WithRainGear` };
}

function getChurchCrowdWeatherFactor() {
  const intensity = getWeatherIntensity();
  if (intensity >= 0.85) return 0.24;
  if (intensity >= 0.48) return 0.52;
  if (intensity >= 0.12) return 0.78;
  return 1;
}

function stableNpcFraction(id) {
  let hash = 2166136261;
  const text = String(id || "npc");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function updatePendingTransitions() {
  Object.values(recordsByMap).forEach((records) => {
    records.forEach((record) => {
      if (record.pending && (state.currentMapId !== record.mapId || !isNearPlayer(record.npc.x, record.npc.y))) {
        applyDesiredState(record, record.pending);
        record.pending = null;
      }

    });
  });
}

function applyDesiredState(record, desired) {
  const npc = record.npc;
  npc.visible = desired.active;
  npc.scheduleState = desired.state;
  npc.customerCount = desired.customerCount || 0;
  npc.x = desired.x;
  npc.y = desired.y;
  activeListsDirty = true;
}

function rebuildActiveLists() {
  Object.keys(recordsByMap).forEach((mapId) => {
    const target = activeNpcsByMap[mapId];
    target.length = 0;
    target.push(...staticNpcsByMap[mapId]);
    recordsByMap[mapId].forEach((record) => {
      if (record.npc.visible) {
        target.push(record.npc);
      }
    });
  });
  activeListsDirty = false;
}

function getExteriorChurchCrowdCount(minuteOfDay) {
  if (minuteOfDay >= 17 * 60 + 30 && minuteOfDay < 18 * 60) {
    return Math.min(CHURCH_EXTERIOR_CROWD.length, 1 + Math.floor((minuteOfDay - (17 * 60 + 30)) / 4));
  }
  if (minuteOfDay >= 18 * 60 && minuteOfDay < 18 * 60 + 5) {
    return 1;
  }
  if (minuteOfDay >= 19 * 60 && minuteOfDay < 19 * 60 + 30) {
    return Math.max(0, CHURCH_EXTERIOR_CROWD.length - Math.floor((minuteOfDay - 19 * 60) / 4));
  }
  return 0;
}

function isNearPlayer(x, y) {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  return Math.hypot(centerX - x, centerY - y) <= SAFE_TRANSITION_DISTANCE;
}

function isMinuteInRange(minute, start, end) {
  return start <= end
    ? minute >= start && minute < end
    : minute >= start || minute < end;
}

function formatMinute(value) {
  const minute = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
