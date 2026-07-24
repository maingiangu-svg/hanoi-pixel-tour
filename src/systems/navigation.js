import { branchingQuestActorsById, branchingQuests } from "../data/branchingQuests.js";
import { getEnvironmentInteractionsForMap } from "../data/environmentInteractions.js";
import { maps } from "../data/maps.js";
import { photoSpotsById } from "../data/photoSpots.js";
import { randomEventsById } from "../data/randomEvents.js";
import { player, runtime, state } from "../state.js";
import { saveGame, saveGameThrottled } from "../storage.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getCurrentQuestNode } from "./branchingQuest.js";
import { isMoCompanionActive } from "./moCompanion.js";
import { getScheduledNpcsForMap } from "./npcSchedule.js";
import { getActiveEventsForMap } from "./randomEvents.js";
import { findRoute, showRouteGraphForDebug, validateRouteGraphForDebug } from "./routeGraph.js";
import { isRidingVehicle, isWalkingBike } from "./vehicle.js";
import { getActiveMapNpcs, getNpcNextAvailableText } from "./worldSchedule.js";
import { isStoryTargetUnlocked } from "./storyState.js";

const ROUTE_MODES = ["auto", "walking", "vehicle"];
const MO_RETURN_OBJECTIVE = Object.freeze({
  id: "return-mo-to-church",
  type: "returnPoint",
  mapId: "hoanKiem",
  targetId: "returnMoToChurch",
  label: "Đưa Mơ về Nhà thờ Lớn",
  description: "Đưa Mơ về Nhà thờ Lớn để thời gian tiếp tục.",
  routeMode: "auto",
  isTemporary: false
});

let lastFingerprint = "";

export function initNavigation() {
  ensureNavigationState();
  runtime.navigation ||= createRuntimeNavigation();
  if (typeof window !== "undefined") {
    window.trackObjectiveForDebug = trackObjectiveForDebug;
    window.clearTrackedObjectiveForDebug = clearTrackedObjectiveForDebug;
    window.showRouteGraphForDebug = showRouteGraphForDebug;
    window.validateRouteGraphForDebug = validateRouteGraphForDebug;
  }
  updateTrackedObjective({ force: true });
}

export function setTrackedObjective(objective, { silent = false } = {}) {
  if (!isObjectiveTrackable(objective)) return false;
  if (!isStoryTargetUnlocked(objective)) {
    if (!silent) showNavigationNotice("Khu vực này chưa được khám phá.");
    return false;
  }
  ensureNavigationState();
  state.navigation.trackedObjective = normalizeObjective(objective);
  runtime.navigation.routeKey = "";
  updateTrackedObjective({ force: true });
  saveGame();
  if (!silent) showNavigationNotice(`Đang dẫn đường: ${state.navigation.trackedObjective.label}`);
  return true;
}

export function clearTrackedObjective({ force = false, silent = false } = {}) {
  ensureNavigationState();
  if (isMoCompanionActive() && !force) {
    return setTrackedObjective(MO_RETURN_OBJECTIVE, { silent });
  }
  state.navigation.trackedObjective = null;
  runtime.navigation.resolvedObjective = null;
  runtime.navigation.route = [];
  runtime.navigation.routeKey = "";
  lastFingerprint = "";
  saveGame();
  if (!silent) showNavigationNotice("Đã dừng dẫn đường.");
  return true;
}

export function getTrackedObjective() {
  ensureNavigationState();
  return state.navigation.trackedObjective;
}

export function getResolvedObjective() {
  return runtime.navigation?.resolvedObjective || null;
}

export function getCurrentRoute() {
  return runtime.navigation?.route || [];
}

export function isObjectiveTrackable(objective) {
  return Boolean(objective && typeof objective === "object" && typeof objective.type === "string" && (objective.targetId || objective.targetPosition || objective.questId || objective.mapId));
}

export function updateTrackedObjective({ force = false } = {}) {
  ensureNavigationState();
  runtime.navigation ||= createRuntimeNavigation();
  let tracked = state.navigation.trackedObjective;
  if (!tracked && isMoCompanionActive()) {
    state.navigation.trackedObjective = normalizeObjective(MO_RETURN_OBJECTIVE);
    tracked = state.navigation.trackedObjective;
  }
  if (!tracked) {
    runtime.navigation.resolvedObjective = null;
    runtime.navigation.route = [];
    return false;
  }

  if (!isStoryTargetUnlocked(tracked)) {
    runtime.navigation.resolvedObjective = {
      ...tracked,
      unavailable: true,
      stage: "unavailable",
      statusText: "Khu vực này chưa được khám phá."
    };
    runtime.navigation.route = [];
    return false;
  }

  if (shouldAutoComplete(tracked)) {
    clearTrackedObjective({ force: !isMoCompanionActive(), silent: true });
    return true;
  }

  const resolved = resolveObjectivePosition(tracked);
  const fingerprint = createFingerprint(tracked, resolved);
  if (!force && fingerprint === lastFingerprint) return false;
  lastFingerprint = fingerprint;
  runtime.navigation.resolvedObjective = resolved;
  recalculateRoute(tracked, resolved);
  return true;
}

export function resolveObjectivePosition(objective = getTrackedObjective()) {
  if (!objective) return null;
  const finalTarget = resolveFinalTarget(objective);
  if (!finalTarget) {
    return { ...objective, unavailable: true, stage: "unavailable", statusText: "Điểm đến hiện chưa xuất hiện." };
  }
  if (finalTarget.unavailable) return finalTarget;

  if (state.currentMapId !== finalTarget.mapId) {
    const transit = resolveTransitStep(state.currentMapId, finalTarget.mapId);
    if (!transit) return { ...finalTarget, unavailable: true, stage: "unavailable", statusText: "Chưa có tuyến chuyển khu phù hợp." };
    return {
      ...finalTarget,
      finalMapId: finalTarget.mapId,
      finalPosition: { x: finalTarget.x, y: finalTarget.y },
      mapId: state.currentMapId,
      x: transit.x,
      y: transit.y,
      targetId: transit.id,
      stage: "reachTransit",
      stageLabel: `Tới ${transit.name}`,
      transitTargetMap: transit.targetMap,
      transitKind: transit.kind
    };
  }

  const parkingStep = resolveParkingStep(finalTarget);
  if (parkingStep) {
    return {
      ...finalTarget,
      finalPosition: { x: finalTarget.x, y: finalTarget.y },
      x: parkingStep.x,
      y: parkingStep.y,
      targetId: parkingStep.id,
      stage: "reachParking",
      stageLabel: `Gửi xe tại ${parkingStep.name}`
    };
  }

  return { ...finalTarget, stage: "reachFinalTarget", stageLabel: finalTarget.label };
}

export function completeTrackedObjective(type = null, targetId = null) {
  const tracked = getTrackedObjective();
  const resolved = getResolvedObjective();
  if (!tracked || tracked.questId || resolved?.stage === "reachTransit" || resolved?.stage === "reachParking") return false;
  if (type && tracked.type !== type) return false;
  if (targetId && ![tracked.targetId, resolved?.targetId].includes(targetId)) return false;
  return clearTrackedObjective({ force: !isMoCompanionActive(), silent: true });
}

export function trackBranchingQuest(questId) {
  const progress = state.branchingQuestProgress?.[questId];
  if (!branchingQuests[questId] || !progress || ["completed", "failed"].includes(progress.status)) return false;
  return setTrackedObjective({
    id: `quest-${questId}`,
    type: "branchingQuest",
    questId,
    targetId: questId,
    label: branchingQuests[questId].title,
    description: getCurrentQuestNode(questId)?.hint || "Theo dõi nhiệm vụ",
    routeMode: "auto"
  });
}

export function setNavigationRouteMode(mode) {
  const tracked = getTrackedObjective();
  if (!tracked || !ROUTE_MODES.includes(mode)) return false;
  tracked.routeMode = mode;
  updateTrackedObjective({ force: true });
  saveGame();
  return true;
}

export function toggleWorldGuidance() {
  ensureNavigationState();
  state.navigation.showWorldGuidance = !state.navigation.showWorldGuidance;
  saveGame();
  return state.navigation.showWorldGuidance;
}

export function getNavigationHudText() {
  const details = getNavigationHudDetails();
  if (!details) return "";
  return `${details.objective}${details.distanceText ? ` · ${details.distanceText}` : ""}`;
}

export function getNavigationHudDetails() {
  const tracked = getTrackedObjective();
  const resolved = getResolvedObjective();
  if (!tracked || !resolved) return null;
  if (resolved.unavailable) {
    return {
      title: tracked.label,
      objective: resolved.statusText,
      distance: null,
      distanceText: ""
    };
  }
  const center = getPlayerCenter();
  const distance = resolved.mapId === state.currentMapId ? Math.round(Math.hypot(center.x - resolved.x, center.y - resolved.y) / 10) : null;
  return {
    title: tracked.label,
    objective: resolved.stageLabel || tracked.label,
    distance,
    distanceText: distance !== null ? `${distance}m` : ""
  };
}

export function trackObjectiveForDebug(type, targetId) {
  return setTrackedObjective({ id: `debug-${type}-${targetId}`, type, targetId, label: targetId, routeMode: "auto", isTemporary: true });
}

export function clearTrackedObjectiveForDebug() {
  return clearTrackedObjective({ force: true });
}

function recalculateRoute(tracked, resolved) {
  if (!resolved || resolved.unavailable || resolved.mapId !== state.currentMapId) {
    runtime.navigation.route = [];
    return;
  }
  const mode = resolveRouteMode(tracked.routeMode, resolved);
  const start = getPlayerCenter();
  runtime.navigation.currentRouteMapId = state.currentMapId;
  const routeKey = [
    state.currentMapId,
    mode,
    Math.round(start.x / 96),
    Math.round(start.y / 96),
    Math.round(resolved.x / 48),
    Math.round(resolved.y / 48),
    resolved.stage,
    getEventBlockSignature()
  ].join(":");
  if (routeKey === runtime.navigation.routeKey) return;
  runtime.navigation.routeKey = routeKey;
  runtime.navigation.routeMode = mode;
  runtime.navigation.route = findRoute(state.currentMapId, start, resolved, mode);
}

function resolveFinalTarget(objective) {
  if (objective.type === "branchingQuest") return resolveBranchingQuestTarget(objective);
  if (objective.type === "photoSpot") {
    const spot = photoSpotsById[objective.targetId];
    if (!spot) return null;
    const known = state.photoAlbum?.discoveredSpots?.includes(spot.id) || Boolean(state.photoAlbum?.photos?.[spot.id]);
    const x = known ? spot.x : Math.round(spot.x / 320) * 320;
    const y = known ? spot.y : Math.round(spot.y / 320) * 320;
    return createResolved(objective, spot.mapId, x, y, known ? spot.title : `Khu vực chụp: ${spot.title}`);
  }
  if (objective.type === "event") {
    const active = state.randomEvents?.active?.[objective.targetId];
    const definition = randomEventsById[objective.targetId];
    if (!active || !definition) return null;
    const anchor = definition.anchor || definition.entities?.[0] || definition.interaction;
    return anchor ? createResolved(objective, active.mapId === "*" ? state.currentMapId : active.mapId, anchor.x, anchor.y, definition.name) : null;
  }
  if (objective.type === "npc") return resolveNpcTarget(objective);
  if (objective.type === "environmentInteraction") {
    for (const mapId of Object.keys(maps)) {
      const interaction = getEnvironmentInteractionsForMap(mapId).find((entry) => entry.id === objective.targetId);
      if (interaction) return createResolved(objective, mapId, interaction.x, interaction.y, interaction.name || interaction.prompt);
    }
    return null;
  }
  if (objective.type === "returnPoint") {
    const map = maps[objective.mapId || "hoanKiem"];
    const point = map?.companionReturnPoint;
    return point ? createResolved(objective, map.id, point.x, point.y, objective.label) : null;
  }
  if (objective.targetPosition && maps[objective.mapId]) {
    return createResolved(objective, objective.mapId, objective.targetPosition.x, objective.targetPosition.y, objective.label);
  }

  for (const map of Object.values(maps)) {
    const groups = {
      landmark: map.landmarks || [],
      shop: map.shops || [],
      vehicleShop: map.vehicleShops || [],
      parking: map.parkingSpots || [],
      busStop: (map.exits || []).filter((exit) => exit.kind === "bus"),
      exit: map.exits || [],
      church: (map.landmarks || []).filter((landmark) => landmark.id === "nhaThoLon")
    };
    const group = groups[objective.type];
    const target = group?.find((entry) => entry.id === objective.targetId || (objective.type === "church" && entry.id === "nhaThoLon"));
    if (!target) continue;
    const point = target.interactionPoint || target.standingPosition || target;
    const x = Number(point.x) + (point === target ? Number(target.width || 0) / 2 : 0);
    const y = Number(point.y) + (point === target ? Number(target.height || 0) / 2 : 0);
    return createResolved(objective, map.id, x, y, target.name || objective.label);
  }
  if (objective.type === "map" && maps[objective.mapId]) {
    const map = maps[objective.mapId];
    return createResolved(objective, map.id, map.spawn.x, map.spawn.y, map.name);
  }
  return null;
}

function resolveBranchingQuestTarget(objective) {
  const progress = state.branchingQuestProgress?.[objective.questId];
  const node = getCurrentQuestNode(objective.questId);
  const target = node?.objective;
  if (!progress || !target) return null;
  if (target.type === "reachPoint") return createResolved(objective, target.mapId, target.x, target.y, node.title);
  if (target.type === "photo") {
    const spot = photoSpotsById[target.spotId];
    return spot ? createResolved(objective, spot.mapId, spot.x, spot.y, node.title) : null;
  }
  if (target.type === "routePoints") {
    const point = target.points[progress.objectiveProgress?.index || 0];
    return point ? createResolved(objective, point.mapId, point.x, point.y, node.title) : null;
  }
  if (target.type === "interactActor" || target.type === "actorSequence") {
    const actorId = target.type === "interactActor" ? target.actorId : target.actorIds[progress.objectiveProgress?.index || 0];
    const actor = branchingQuestActorsById[actorId];
    return actor ? createResolved(objective, actor.mapId, actor.x + (actor.width || 24) / 2, actor.y + (actor.height || 40) / 2, actor.name) : null;
  }
  if (target.type === "talkToMo") return resolveNpcTarget({ ...objective, targetId: "mo" });
  if (target.type === "transport") return createResolved(objective, target.mapId, maps[target.mapId].spawn.x, maps[target.mapId].spawn.y, `Tới ${maps[target.mapId].name}`);
  return null;
}

function resolveNpcTarget(objective) {
  if (objective.targetId === "mo") {
    const companion = isMoCompanionActive() ? state.moCompanion : state.npcSchedules?.mo;
    if (companion?.currentMap) return createResolved(objective, companion.currentMap, companion.x, companion.y, "Mơ");
  }
  let scheduledFallback = null;
  for (const map of Object.values(maps)) {
    const activeNpc = getActiveMapNpcs(map).find((npc) => npc.id === objective.targetId && npc.visible !== false);
    if (activeNpc) return createResolved(objective, map.id, activeNpc.x + 12, activeNpc.y + 34, activeNpc.name);
    const scheduled = getScheduledNpcsForMap(map).find((npc) => npc.id === objective.targetId && npc.visible !== false);
    if (scheduled) return createResolved(objective, map.id, scheduled.x + 12, scheduled.y + 34, scheduled.name);
    const configured = (map.npcs || []).find((npc) => npc.id === objective.targetId);
    if (configured) scheduledFallback = { map, npc: configured };
  }
  if (scheduledFallback) {
    return {
      ...createResolved(objective, scheduledFallback.map.id, scheduledFallback.npc.x, scheduledFallback.npc.y, scheduledFallback.npc.name),
      unavailable: true,
      stage: "unavailable",
      statusText: getNpcNextAvailableText(scheduledFallback.npc)
    };
  }
  return null;
}

function resolveTransitStep(currentMapId, finalMapId) {
  const currentMap = maps[currentMapId];
  if (!currentMap) return null;
  const nextMapId = findNextMapHop(currentMapId, finalMapId);
  const exit = (currentMap.exits || []).find((entry) => entry.targetMap === nextMapId);
  if (!exit) return null;
  const point = exit.interactionPoint || exit;
  return {
    ...exit,
    x: point.x + (point === exit ? exit.width / 2 : 0),
    y: point.y + (point === exit ? exit.height / 2 : 0)
  };
}

function findNextMapHop(startMapId, targetMapId) {
  if (startMapId === targetMapId) return targetMapId;
  const queue = [{ mapId: startMapId, firstHop: null }];
  const visited = new Set([startMapId]);
  while (queue.length) {
    const current = queue.shift();
    for (const exit of maps[current.mapId]?.exits || []) {
      if (!isStoryTargetUnlocked({ ...exit, targetId: exit.id })) continue;
      if (visited.has(exit.targetMap)) continue;
      const firstHop = current.firstHop || exit.targetMap;
      if (exit.targetMap === targetMapId) return firstHop;
      visited.add(exit.targetMap);
      queue.push({ mapId: exit.targetMap, firstHop });
    }
  }
  return null;
}

function resolveParkingStep(target) {
  if (!isRidingVehicle() || target.mapId !== state.currentMapId) return null;
  const map = maps[target.mapId];
  const restricted = (map.vehicleRestrictedZones || []).find((zone) => pointInRect(target.x, target.y, zone));
  if (!restricted) return null;
  return (map.parkingSpots || [])
    .map((spot) => {
      const point = spot.interactionPoint || spot;
      return { ...spot, x: point.x, y: point.y, distance: Math.hypot(point.x - target.x, point.y - target.y) };
    })
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

function resolveRouteMode(requestedMode, resolved) {
  if (isWalkingBike()) return "pushingBike";
  if (requestedMode === "walking") return "walking";
  if (requestedMode === "vehicle") return state.vehicle?.owned && isRidingVehicle() ? "vehicle" : "walking";
  const center = getPlayerCenter();
  return isRidingVehicle() && Math.hypot(center.x - resolved.x, center.y - resolved.y) > 320 ? "vehicle" : "walking";
}

function shouldAutoComplete(tracked) {
  if (tracked.type === "photoSpot" && state.photoAlbum?.photos?.[tracked.targetId]) return true;
  if (tracked.type === "event" && !state.randomEvents?.active?.[tracked.targetId]) return true;
  if (tracked.type === "branchingQuest") {
    const progress = state.branchingQuestProgress?.[tracked.questId];
    return !progress || ["completed", "failed"].includes(progress.status);
  }
  if (tracked.type === "returnPoint" && !isMoCompanionActive()) return true;
  if (tracked.type === "map" && tracked.mapId === state.currentMapId) return true;
  return false;
}

function createResolved(objective, mapId, x, y, fallbackLabel) {
  return { ...objective, mapId, x: Number(x), y: Number(y), label: objective.label || fallbackLabel || "Mục tiêu" };
}

function createFingerprint(tracked, resolved) {
  return [
    tracked.id, tracked.routeMode, state.currentMapId, state.vehicle?.status,
    resolved?.mapId, resolved?.stage, Math.round((resolved?.x || 0) / 24), Math.round((resolved?.y || 0) / 24),
    tracked.questId ? state.branchingQuestProgress?.[tracked.questId]?.currentNodeId : "",
    getEventBlockSignature()
  ].join("|");
}

function getEventBlockSignature() {
  return (runtime.eventCollisionBlocks || [])
    .filter((block) => !block.mapId || block.mapId === state.currentMapId)
    .map((block) => [block.id || "block", Math.round(block.x / 48), Math.round(block.y / 48), Math.round((block.width || 0) / 48), Math.round((block.height || 0) / 48)].join(","))
    .join(";");
}

function normalizeObjective(objective) {
  return {
    id: String(objective.id || `${objective.type}-${objective.targetId || objective.questId || "target"}`),
    type: String(objective.type),
    mapId: maps[objective.mapId] ? objective.mapId : null,
    targetId: typeof objective.targetId === "string" ? objective.targetId : null,
    targetPosition: objective.targetPosition && Number.isFinite(objective.targetPosition.x) && Number.isFinite(objective.targetPosition.y)
      ? { x: objective.targetPosition.x, y: objective.targetPosition.y }
      : null,
    label: String(objective.label || "Mục tiêu"),
    description: String(objective.description || ""),
    questId: typeof objective.questId === "string" ? objective.questId : null,
    routeMode: ROUTE_MODES.includes(objective.routeMode) ? objective.routeMode : "auto",
    isTemporary: Boolean(objective.isTemporary)
  };
}

function ensureNavigationState() {
  state.navigation ||= { trackedObjective: null, showWorldGuidance: true };
  if (typeof state.navigation.showWorldGuidance !== "boolean") state.navigation.showWorldGuidance = true;
}

function createRuntimeNavigation() {
  return { resolvedObjective: null, route: [], routeKey: "", routeMode: "walking", currentRouteMapId: null, debugGraph: false };
}

function showNavigationNotice(message) {
  const dialogue = document.getElementById("dialogueText");
  const box = document.getElementById("dialogueBox");
  if (!dialogue || !box) return;
  dialogue.textContent = message;
  box.classList.remove("hidden");
  window.clearTimeout(runtime.messageTimer);
  runtime.messageTimer = window.setTimeout(() => box.classList.add("hidden"), 2200);
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
