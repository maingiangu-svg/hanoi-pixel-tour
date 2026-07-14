import { createDefaultState, player, runtime, SAVE_KEY, setState, state } from "./state.js";
import { foodCatalog } from "./data/foods.js";
import { maps } from "./data/maps.js";
import { VINFAST_VEHICLE_ID, vehicleCatalog } from "./data/vehicles.js";
import { MO_COMPANION_CONFIG } from "./data/npcSchedules.js";
import { findLandmark, getLandmarkIdsFromStamps } from "./utils/helpers.js";
import { normalizeGameTime } from "./utils/gameTime.js";
import { normalizeWeatherState } from "./data/weatherProfiles.js";
import { photoSpotsById } from "./data/photoSpots.js";
import { BRANCHING_OUTCOMES, branchingQuests } from "./data/branchingQuests.js";
import { RANDOM_EVENT_IDS, randomEventsById } from "./data/randomEvents.js";
import { isOverlayOpen, showMessage } from "./systems/modal.js";

let afterSaveHandler = () => {};
export function setAfterSaveHandler(handler) { afterSaveHandler = handler; }

export function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) {
      return createDefaultState();
    }
    return normalizeState(saved);
  } catch (error) {
    console.warn("Không thể đọc lưu trữ, tạo hành trình mới.", error);
    return createDefaultState();
  }
}

export function normalizeState(saved) {
  const base = createDefaultState();
  const completedQuizzes = { ...base.completedQuizzes, ...(saved.completedQuizzes || {}) };
  const currentMapId = maps[saved.currentMapId] ? saved.currentMapId : base.currentMapId;
  const moCompanion = normalizeMoCompanion(saved, base, currentMapId);
  const gameTime = normalizeGameTime(saved.gameTime, base.gameTime);
  const weather = normalizeWeatherState(saved.weather, base.weather, gameTime.totalGameMinutes);

  if (moCompanion.active && !gameTime.pauseReasons.includes(MO_COMPANION_CONFIG.clockPauseReason)) {
    gameTime.pauseReasons.push(MO_COMPANION_CONFIG.clockPauseReason);
    gameTime.paused = true;
  }

  Object.keys(completedQuizzes).forEach((key) => {
    if (completedQuizzes[key] === true) {
      completedQuizzes[key] = { correct: true };
    }
  });

  return {
    ...base,
    ...saved,
    currentMapId,
    player: { ...base.player, ...(saved.player || {}) },
    profile: normalizeProfile(saved),
    vehicle: normalizeVehicle(saved),
    gameTime,
    weather,
    npcSchedules: normalizeNpcSchedules(saved, base),
    moCompanion,
    photoAlbum: normalizePhotoAlbum(saved.photoAlbum, base.photoAlbum),
    branchingQuestProgress: normalizeBranchingQuestProgress(saved.branchingQuestProgress),
    randomEvents: normalizeRandomEvents(saved.randomEvents),
    navigation: normalizeNavigation(saved.navigation, base.navigation),
    inventory: { ...base.inventory, ...(saved.inventory || {}) },
    completedQuizzes,
    completedTasks: { ...base.completedTasks, ...(saved.completedTasks || {}) },
    taskStages: { ...base.taskStages, ...(saved.taskStages || {}) },
    visitedMaps: Array.isArray(saved.visitedMaps) && saved.visitedMaps.length
      ? Array.from(new Set(saved.visitedMaps)).filter((mapId) => maps[mapId])
      : base.visitedMaps,
    eatenFoods: Array.isArray(saved.eatenFoods) ? saved.eatenFoods : base.eatenFoods,
    discoveredFoods: Array.isArray(saved.discoveredFoods)
      ? saved.discoveredFoods.filter((foodId) => foodCatalog[foodId])
      : (Array.isArray(saved.eatenFoods) ? saved.eatenFoods.filter((foodId) => foodCatalog[foodId]) : base.discoveredFoods),
    discoveredLandmarks: Array.isArray(saved.discoveredLandmarks)
      ? saved.discoveredLandmarks.filter((landmarkId) => findLandmark(landmarkId))
      : getLandmarkIdsFromStamps(saved.inventory && saved.inventory.stamps),
    money: Number.isFinite(saved.money) ? saved.money : base.money,
    freeReturnUsed: Boolean(saved.freeReturnUsed),
    victoryShown: Boolean(saved.victoryShown)
  };
}

function normalizeNavigation(rawNavigation, fallback) {
  const raw = rawNavigation && typeof rawNavigation === "object" ? rawNavigation : {};
  const objective = raw.trackedObjective && typeof raw.trackedObjective === "object"
    ? raw.trackedObjective
    : null;
  const validTypes = new Set([
    "landmark", "npc", "questPoint", "shop", "vehicleShop", "busStop", "parking",
    "church", "photoSpot", "event", "returnPoint", "environmentInteraction", "exit",
    "map", "branchingQuest"
  ]);
  const trackedObjective = objective && validTypes.has(objective.type)
    ? {
      id: typeof objective.id === "string" ? objective.id : `${objective.type}-${objective.targetId || "target"}`,
      type: objective.type,
      mapId: maps[objective.mapId] ? objective.mapId : null,
      targetId: typeof objective.targetId === "string" ? objective.targetId : null,
      targetPosition: objective.targetPosition && Number.isFinite(objective.targetPosition.x) && Number.isFinite(objective.targetPosition.y)
        ? { x: objective.targetPosition.x, y: objective.targetPosition.y }
        : null,
      label: typeof objective.label === "string" ? objective.label : "Mục tiêu",
      description: typeof objective.description === "string" ? objective.description : "",
      questId: typeof objective.questId === "string" ? objective.questId : null,
      routeMode: ["auto", "walking", "vehicle"].includes(objective.routeMode) ? objective.routeMode : "auto",
      isTemporary: Boolean(objective.isTemporary)
    }
    : null;
  return {
    trackedObjective,
    showWorldGuidance: typeof raw.showWorldGuidance === "boolean" ? raw.showWorldGuidance : fallback.showWorldGuidance
  };
}

function normalizeRandomEvents(rawEvents) {
  const source = rawEvents && typeof rawEvents === "object" ? rawEvents : {};
  const active = {};
  Object.entries(source.active || {}).forEach(([eventId, raw]) => {
    const definition = randomEventsById[eventId];
    if (!definition || !raw || typeof raw !== "object") return;
    const startedAt = Math.max(0, Number(raw.startedAt) || 0);
    const defaultEnd = startedAt + definition.durationGameMinutes;
    active[eventId] = {
      eventId,
      mapId: typeof raw.mapId === "string" ? raw.mapId : (definition.mapId || "*"),
      startedAt,
      endsAt: Math.max(startedAt + 1, Number(raw.endsAt) || defaultEnd),
      state: typeof raw.state === "string" ? raw.state : "active",
      phase: typeof raw.phase === "string" ? raw.phase : "active",
      interactionResolved: Boolean(raw.interactionResolved),
      outcome: typeof raw.outcome === "string" ? raw.outcome : null
    };
  });

  const cooldowns = {};
  Object.entries(source.cooldowns || {}).forEach(([eventId, value]) => {
    if (RANDOM_EVENT_IDS.has(eventId) && Number.isFinite(Number(value))) {
      cooldowns[eventId] = Math.max(0, Number(value));
    }
  });

  const completedFlags = {};
  Object.entries(source.completedFlags || {}).forEach(([eventId, value]) => {
    if (!RANDOM_EVENT_IDS.has(eventId)) return;
    completedFlags[eventId] = value && typeof value === "object" && !Array.isArray(value)
      ? { ...value }
      : Boolean(value);
  });

  return { active, cooldowns, completedFlags };
}

function normalizeBranchingQuestProgress(rawProgress) {
  const source = rawProgress && typeof rawProgress === "object" ? rawProgress : {};
  const normalized = {};
  Object.entries(source).forEach(([questId, raw]) => {
    const quest = branchingQuests[questId];
    if (!quest || !raw || typeof raw !== "object") return;
    const status = ["active", "unresolved", "completed", "failed"].includes(raw.status) ? raw.status : "active";
    const currentNodeId = quest.nodes[raw.currentNodeId] ? raw.currentNodeId : quest.startNodeId;
    const currentNode = quest.nodes[currentNodeId];
    const follower = normalizeQuestFollower(raw.follower);
    normalized[questId] = {
      status,
      currentNodeId,
      choices: Array.isArray(raw.choices) ? raw.choices.filter((value) => typeof value === "string") : [],
      choiceLabels: Array.isArray(raw.choiceLabels) ? raw.choiceLabels.filter((value) => typeof value === "string") : [],
      outcome: BRANCHING_OUTCOMES.includes(raw.outcome) ? raw.outcome : null,
      rewardClaimed: Boolean(raw.rewardClaimed),
      flags: raw.flags && typeof raw.flags === "object" && !Array.isArray(raw.flags) ? { ...raw.flags } : {},
      activeObjective: ["completed", "failed"].includes(status) ? null : {
        nodeId: currentNodeId,
        type: currentNode.type,
        objectiveType: currentNode.objective?.type || null
      },
      relatedNpcIds: Array.isArray(raw.relatedNpcIds)
        ? Array.from(new Set(raw.relatedNpcIds.filter((value) => typeof value === "string")))
        : [],
      objectiveProgress: {
        index: Math.max(0, Math.floor(Number(raw.objectiveProgress?.index) || 0)),
        completedIds: Array.isArray(raw.objectiveProgress?.completedIds)
          ? Array.from(new Set(raw.objectiveProgress.completedIds.filter((value) => typeof value === "string")))
          : []
      },
      follower: status === "active" || status === "unresolved" ? follower : null,
      startedAt: Number.isFinite(raw.startedAt) ? raw.startedAt : null,
      completedAt: Number.isFinite(raw.completedAt) ? raw.completedAt : null
    };
  });
  return normalized;
}

function normalizeQuestFollower(raw) {
  if (!raw || typeof raw !== "object" || !raw.active || typeof raw.actorId !== "string") return null;
  return {
    active: true,
    actorId: raw.actorId,
    mapId: maps[raw.mapId] ? raw.mapId : null,
    x: Number.isFinite(raw.x) ? raw.x : null,
    y: Number.isFinite(raw.y) ? raw.y : null,
    facing: ["up", "down", "left", "right"].includes(raw.facing) ? raw.facing : "down",
    groupCount: Math.max(1, Math.min(3, Math.floor(Number(raw.groupCount) || 1))),
    speed: Math.max(0.8, Math.min(3, Number(raw.speed) || 2.15))
  };
}

function normalizePhotoAlbum(rawAlbum, fallback) {
  const raw = rawAlbum && typeof rawAlbum === "object" ? rawAlbum : {};
  const photos = {};
  Object.entries(raw.photos || {}).forEach(([spotId, photo]) => {
    const spot = photoSpotsById[spotId];
    if (!spot || !photo || typeof photo !== "object") {
      return;
    }

    const rating = Math.max(1, Math.min(3, Math.round(Number(photo.rating) || 1)));
    photos[spotId] = {
      photoSpotId: spotId,
      landmarkId: spot.landmarkId,
      title: spot.title,
      rating,
      gameDay: Math.max(1, Math.round(Number(photo.gameDay ?? photo.day) || 1)),
      gameTime: typeof (photo.gameTime ?? photo.time) === "string" ? (photo.gameTime ?? photo.time) : "07:00",
      weather: typeof photo.weather === "string" ? photo.weather : "clear",
      mapId: spot.mapId,
      playerGender: ["male", "female"].includes(photo.playerGender) ? photo.playerGender : null,
      withMo: Boolean(photo.withMo),
      eventId: RANDOM_EVENT_IDS.has(photo.eventId) ? photo.eventId : null,
      eventTags: Array.isArray(photo.eventTags)
        ? Array.from(new Set(photo.eventTags.filter((tag) => typeof tag === "string"))).slice(0, 8)
        : [],
      capturedAt: typeof photo.capturedAt === "string" ? photo.capturedAt : null
    };
  });

  const discoveredSpots = Array.from(new Set([
    ...(Array.isArray(raw.discoveredSpots) ? raw.discoveredSpots : fallback.discoveredSpots),
    ...Object.keys(photos)
  ])).filter((spotId) => photoSpotsById[spotId]);

  return { photos, discoveredSpots };
}

function normalizeMoCompanion(saved, base, currentMapId) {
  const raw = saved?.moCompanion || {};
  const active = Boolean(raw.active);
  const facing = ["up", "down", "left", "right"].includes(raw.facing) ? raw.facing : base.moCompanion.facing;

  return {
    ...base.moCompanion,
    active,
    currentMap: active ? currentMapId : null,
    x: Number.isFinite(raw.x) ? raw.x : base.moCompanion.x,
    y: Number.isFinite(raw.y) ? raw.y : base.moCompanion.y,
    facing,
    followingPlayer: active,
    ridingWithPlayer: false,
    returnDestination: MO_COMPANION_CONFIG.returnDestination,
    pausedAt: Number.isFinite(raw.pausedAt) ? raw.pausedAt : null
  };
}

function normalizeNpcSchedules(saved, base) {
  const savedMo = saved?.npcSchedules?.mo || {};
  return {
    ...base.npcSchedules,
    mo: {
      ...base.npcSchedules.mo,
      currentState: typeof savedMo.currentState === "string" ? savedMo.currentState : base.npcSchedules.mo.currentState,
      currentMap: savedMo.currentMap === null || typeof savedMo.currentMap === "string"
        ? savedMo.currentMap
        : base.npcSchedules.mo.currentMap,
      x: Number.isFinite(savedMo.x) ? savedMo.x : base.npcSchedules.mo.x,
      y: Number.isFinite(savedMo.y) ? savedMo.y : base.npcSchedules.mo.y
    }
  };
}

function normalizeProfile(saved) {
  const gender = saved?.profile?.gender || saved?.playerProfile?.gender || saved?.gender;
  return {
    gender: ["male", "female"].includes(gender) ? gender : null
  };
}

function normalizeVehicle(saved) {
  const rawVehicle = saved?.vehicle || {};
  const type = vehicleCatalog[rawVehicle.type] ? rawVehicle.type : VINFAST_VEHICLE_ID;
  const owned = Boolean(rawVehicle.owned);
  const parkedAt = normalizeParkedAt(rawVehicle.parkedAt);
  const walkingBike = owned && rawVehicle.status === "walking-bike" && !parkedAt;
  return {
    owned,
    type,
    equipped: walkingBike,
    status: owned && parkedAt ? "parked" : walkingBike ? "walking-bike" : "stored",
    parkedAt
  };
}

function normalizeParkedAt(rawParkedAt) {
  if (!rawParkedAt || !maps[rawParkedAt.mapId]) {
    return null;
  }

  const spot = (maps[rawParkedAt.mapId].parkingSpots || [])
    .find((candidate) => candidate.id === rawParkedAt.spotId);
  if (!spot) {
    return null;
  }

  return {
    mapId: rawParkedAt.mapId,
    spotId: spot.id,
    name: spot.name
  };
}

export function saveGame() {
  const interactionOrigin = runtime.environmentInteraction?.active
    ? runtime.environmentInteraction.origin
    : null;
  state.player.x = Math.round(interactionOrigin?.x ?? player.x);
  state.player.y = Math.round(interactionOrigin?.y ?? player.y);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Không thể lưu tiến trình trong trình duyệt này.", error);
  }
  afterSaveHandler();
}

export function saveGameThrottled() {
  const now = performance.now();
  if (now - runtime.lastSavedAt > 900) {
    runtime.lastSavedAt = now;
    saveGame();
  }
}

export function confirmReset() {
  if (isOverlayOpen()) {
    return false;
  }

  const ok = window.confirm("Bạn có chắc muốn xoá tiến trình và bắt đầu lại chuyến đi không?");
  if (!ok) {
    return false;
  }

  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn("Không thể xoá lưu trữ trong trình duyệt này.", error);
  }
  setState(createDefaultState());
  player.x = state.player.x;
  player.y = state.player.y;
  player.facing = "down";
  showMessage("Tiến trình đã được đặt lại. Chúc bạn có một chuyến khám phá Hà Nội mới!");
  saveGame();
  return true;
}
