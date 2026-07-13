import {
  NPC_REACTION_PROFILES,
  REACTION_PROFILE_BY_ACTIVITY,
  REACTION_PROFILE_BY_ROLE,
  VEHICLE_RESTRICTION_LINES
} from "../data/npcReactionProfiles.js";
import { MO_NEIGHBORHOOD } from "../data/npcSchedules.js";
import { player, runtime } from "../state.js";
import { isNpcAreaWalkable } from "../utils/collision.js";
import { getCurrentMap, getPlayerCenter } from "../utils/helpers.js";
import { playVehicleHorn } from "./audioManager.js";
import { isOverlayOpen } from "./modal.js";
import { getMoChildren, getScheduledNpcsForMap } from "./npcSchedule.js";
import { isRidingVehicle, isVehicleOwned } from "./vehicle.js";
import { getWeatherIntensity } from "./weather.js";
import { getActiveMapNpcs } from "./worldSchedule.js";

const IDLE_VISUAL = Object.freeze({
  state: "idle",
  offsetX: 0,
  offsetY: 0,
  facing: null,
  pauseRoutine: false,
  bubbleText: ""
});
const REACTION_TRANSITION_MS = 320;
const HORN_DURATION_MS = 360;
const HORN_COOLDOWN_MS = 1050;
const MAX_REACTION_RANGE = 190;
const nearbyNpcs = [];
const reactionByNpc = new Map();

let lastTimestamp = 0;
let lastMapId = null;
let nextAmbientReactionAt = 0;
let lastHornAt = -Infinity;
let hornStartedAt = -Infinity;
let hornRevision = 0;
let activeBubbleNpcId = null;
let lastRestrictionWarningAt = -Infinity;

export function updateNpcReactions(timestamp = performance.now()) {
  const deltaMs = lastTimestamp ? Math.min(80, Math.max(0, timestamp - lastTimestamp)) : 16;
  lastTimestamp = timestamp;

  const map = getCurrentMap();
  if (!map) return;
  if (map.id !== lastMapId) {
    reactionByNpc.clear();
    activeBubbleNpcId = null;
    lastMapId = map.id;
  }

  collectNearbyNpcs(map);
  reactionByNpc.forEach((reaction) => advanceReaction(reaction, timestamp, deltaMs));

  if (isOverlayOpen()) return;

  const center = getPlayerCenter();
  for (let index = 0; index < nearbyNpcs.length; index += 1) {
    const npc = nearbyNpcs[index];
    if (!canNpcReact(npc)) continue;
    updateNpcReaction(npc, center, deltaMs, timestamp);
  }
}

export function updateNpcReaction(npc, playerCenter, _deltaMs, timestamp = performance.now()) {
  const centerX = npc.x + (npc.width || 24) / 2;
  const centerY = npc.y + (npc.height || 46) / 2;
  const distance = Math.hypot(playerCenter.x - centerX, playerCenter.y - centerY);
  const profile = getNpcReactionProfile(npc);
  const reaction = getOrCreateReaction(npc);

  if (reaction.lastHornRevision !== hornRevision && timestamp - hornStartedAt <= HORN_DURATION_MS && distance <= 158) {
    reaction.lastHornRevision = hornRevision;
    const hornChance = stableChance(`${npc.id}:horn:${hornRevision}`);
    const reactionChance = Math.max(0.28, profile.glanceChance * 0.88);
    if (hornChance > reactionChance) return;
    const hornReaction = profile.id === "child"
      ? "startled"
      : profile.id === "busy"
        ? "stepAside"
        : profile.id === "strict"
          ? "annoyed"
          : "glanceAtPlayer";
    requestNpcReaction(npc, hornReaction, {
      force: true,
      durationMs: 720,
      bubbleText: ["child", "strict"].includes(profile.id) && distance <= 92
        ? pickLine(profile.warnings, npc.id, hornRevision)
        : ""
    });
    return;
  }

  const movementSpeed = runtime.playerMotionSpeed || 0;
  if (isRidingVehicle() && movementSpeed > 0.12 && distance <= profile.vehicleRange) {
    const speedRatio = movementSpeed / Math.max(0.1, player.speed);
    const isFastApproach = (speedRatio >= 1.7 && distance <= 72) || distance <= 48;
    const isCloseApproach = distance <= Math.min(94, profile.vehicleRange * 0.76);
    const vehicleReaction = isFastApproach
      ? "startled"
      : isCloseApproach
        ? "avoidingVehicle"
        : "glanceAtPlayer";
    requestNpcReaction(npc, vehicleReaction, {
      durationMs: isFastApproach ? 820 : isCloseApproach ? 1050 : 720,
      bubbleText: isFastApproach && distance <= 82
        ? pickLine(profile.warnings, npc.id, Math.floor(timestamp / 1000))
        : ""
    });
    return;
  }

  const blocksRoutine = !isRidingVehicle() &&
    movementSpeed <= 0.08 &&
    ["walk", "jog"].includes(npc.activity) &&
    distance <= 44;
  if (blocksRoutine) {
    requestNpcReaction(npc, "waitingForPath", { durationMs: 360 });
    return;
  }

  const approachesRoutine = !isRidingVehicle() &&
    movementSpeed > 0.08 &&
    ["walk", "jog"].includes(npc.activity) &&
    distance <= 46;
  if (approachesRoutine) {
    requestNpcReaction(npc, "stepAside", { durationMs: npc.activity === "jog" ? 620 : 820 });
    return;
  }

  const crossesSocialGroup = !isRidingVehicle() &&
    movementSpeed > 0.08 &&
    ["couple", "talk", "danceGroup"].includes(npc.activity) &&
    distance <= 48;
  if (crossesSocialGroup) {
    requestNpcReaction(npc, "waitingForPath", { durationMs: 420 });
    return;
  }

  if (movementSpeed <= 0.08 || distance > profile.glanceRange || timestamp < nextAmbientReactionAt) return;
  if (timestamp < reaction.cooldownUntil || reaction.state !== "idle") return;

  const weatherFactor = 1 - getWeatherIntensity() * 0.55;
  const timeBucket = Math.floor(timestamp / 900);
  if (stableChance(`${npc.id}:${timeBucket}`) > profile.glanceChance * weatherFactor) return;

  const greeting = profile.greetingChance > 0 &&
    stableChance(`${npc.id}:greeting:${timeBucket}`) < profile.greetingChance * weatherFactor;
  requestNpcReaction(npc, greeting ? "greeting" : "glanceAtPlayer", {
    durationMs: greeting ? 1250 : 900,
    bubbleText: greeting ? pickLine(profile.greetings, npc.id, timeBucket) : ""
  });
  nextAmbientReactionAt = timestamp + 420;
}

export function getNpcReactionProfile(npc) {
  const profileId = npc.reactionProfile ||
    REACTION_PROFILE_BY_ROLE[npc.ambienceRole || npc.role] ||
    REACTION_PROFILE_BY_ACTIVITY[npc.activity] ||
    "friendly";
  return NPC_REACTION_PROFILES[profileId] || NPC_REACTION_PROFILES.friendly;
}

export function requestNpcReaction(npc, reactionType, options = {}) {
  if (!canNpcReact(npc)) return false;
  const now = performance.now();
  const reaction = getOrCreateReaction(npc);
  const profile = getNpcReactionProfile(npc);
  if (!options.force && (now < reaction.cooldownUntil || reaction.state !== "idle")) return false;

  const stepReaction = ["stepAside", "avoidingVehicle", "startled"].includes(reactionType);
  const target = stepReaction && profile.canStepAside
    ? findStepOffset(npc, profile.stepDistance, reactionType)
    : { x: 0, y: 0 };

  reaction.npc = npc;
  reaction.state = reactionType;
  reaction.startedAt = now;
  reaction.until = now + (options.durationMs || 900);
  reaction.cooldownUntil = reaction.until + profile.cooldownMs;
  reaction.targetX = target.x;
  reaction.targetY = target.y;
  reaction.facing = getFacingTowardPlayer(npc);
  reaction.pauseRoutine = !["glanceAtPlayer", "greeting", "annoyed"].includes(reactionType);
  reaction.visual.state = reactionType;
  reaction.visual.facing = reaction.facing;
  reaction.visual.pauseRoutine = reaction.pauseRoutine;

  if (options.bubbleText) setActiveBubble(npc, options.bubbleText, now + (options.bubbleDurationMs || 2200));
  return true;
}

export function canNpcReact(npc) {
  if (!npc || npc.visible === false || npc.companion || npc.id === "chaXu") return false;
  if (npc.id === "mo") {
    return ![
      "walkingToChurch",
      "enteringChurch",
      "attendingMass",
      "leavingChurch",
      "returningToChildren",
      "hangingOut"
    ].includes(npc.state);
  }
  return !npc.nonReactive && npc.activity !== "attendingMass";
}

export function returnNpcToRoutine(npc) {
  const reaction = reactionByNpc.get(npc?.id);
  if (!reaction) return;
  reaction.state = "returningToRoutine";
  reaction.startedAt = performance.now();
  reaction.until = reaction.startedAt + REACTION_TRANSITION_MS;
  reaction.targetX = 0;
  reaction.targetY = 0;
  reaction.pauseRoutine = true;
  reaction.visual.state = reaction.state;
  reaction.visual.pauseRoutine = true;
}

export function getNpcReactionVisual(npc) {
  return reactionByNpc.get(npc?.id)?.visual || IDLE_VISUAL;
}

export function hasActiveReactionBubble(npcId) {
  const reaction = reactionByNpc.get(npcId);
  return activeBubbleNpcId === npcId && Boolean(reaction?.visual.bubbleText);
}

export function clearNpcReactionBubble() {
  if (!activeBubbleNpcId) return;
  const reaction = reactionByNpc.get(activeBubbleNpcId);
  if (reaction) reaction.visual.bubbleText = "";
  activeBubbleNpcId = null;
}

export function getContextualNpcSpeech(npc) {
  if (npc.activity === "xeOm" && isVehicleOwned()) {
    return "Có xe rồi à cháu, đi cẩn thận nhé!";
  }
  return npc.speech || "";
}

export function notifyVehicleRestrictionReaction(zone) {
  const now = performance.now();
  if (!zone || now - lastRestrictionWarningAt < 5200) return;
  const center = getPlayerCenter();
  let nearest = null;
  let nearestDistance = Infinity;
  nearbyNpcs.forEach((npc) => {
    if (!canNpcReact(npc)) return;
    const profile = getNpcReactionProfile(npc);
    if (!["strict", "vendor", "friendly"].includes(profile.id)) return;
    const distance = Math.hypot(center.x - npc.x, center.y - npc.y);
    if (distance < nearestDistance && distance <= 230) {
      nearest = npc;
      nearestDistance = distance;
    }
  });
  if (!nearest) return;
  lastRestrictionWarningAt = now;
  requestNpcReaction(nearest, "annoyed", {
    force: true,
    durationMs: 1300,
    bubbleDurationMs: 2600,
    bubbleText: pickLine(VEHICLE_RESTRICTION_LINES, nearest.id, zone.id?.length || 0)
  });
}

export function triggerVehicleHorn() {
  const now = performance.now();
  if (!isRidingVehicle() || isOverlayOpen() || now - lastHornAt < HORN_COOLDOWN_MS) return false;
  lastHornAt = now;
  hornStartedAt = now;
  hornRevision += 1;
  playVehicleHorn();
  return true;
}

export function isVehicleHornActive(timestamp = performance.now()) {
  return timestamp - hornStartedAt <= HORN_DURATION_MS;
}

function collectNearbyNpcs(map) {
  nearbyNpcs.length = 0;
  const center = getPlayerCenter();
  appendNearby(getActiveMapNpcs(map), center, map.id);
  appendNearby(getScheduledNpcsForMap(map), center, map.id);
  if (map.id === "hoanKiem") appendNearby(getMoChildren(), center, map.id);
}

function appendNearby(source, center, mapId) {
  for (let index = 0; index < source.length; index += 1) {
    const npc = source[index];
    if (npc.mapId && npc.mapId !== mapId) continue;
    if (Math.hypot(center.x - npc.x, center.y - npc.y) <= MAX_REACTION_RANGE) nearbyNpcs.push(npc);
  }
}

function getOrCreateReaction(npc) {
  let reaction = reactionByNpc.get(npc.id);
  if (!reaction) {
    reaction = {
      npc,
      state: "idle",
      startedAt: 0,
      until: 0,
      cooldownUntil: 0,
      targetX: 0,
      targetY: 0,
      facing: null,
      pauseRoutine: false,
      lastHornRevision: hornRevision,
      bubbleUntil: 0,
      visual: {
        state: "idle",
        offsetX: 0,
        offsetY: 0,
        facing: null,
        pauseRoutine: false,
        bubbleText: ""
      }
    };
    reactionByNpc.set(npc.id, reaction);
  }
  reaction.npc = npc;
  return reaction;
}

function advanceReaction(reaction, timestamp, deltaMs) {
  const lerp = Math.min(1, deltaMs / 110);
  reaction.visual.offsetX += (reaction.targetX - reaction.visual.offsetX) * lerp;
  reaction.visual.offsetY += (reaction.targetY - reaction.visual.offsetY) * lerp;

  if (reaction.visual.bubbleText && timestamp >= reaction.bubbleUntil) {
    reaction.visual.bubbleText = "";
    if (activeBubbleNpcId === reaction.npc.id) activeBubbleNpcId = null;
  }

  if (reaction.state === "idle" || timestamp < reaction.until) return;
  if (reaction.state === "waitingForPath") {
    requestNpcReaction(reaction.npc, "stepAside", { force: true, durationMs: 760 });
    return;
  }
  if (reaction.state !== "returningToRoutine") {
    returnNpcToRoutine(reaction.npc);
    return;
  }

  reaction.state = "idle";
  reaction.targetX = 0;
  reaction.targetY = 0;
  reaction.facing = null;
  reaction.pauseRoutine = false;
  reaction.visual.state = "idle";
  reaction.visual.offsetX = 0;
  reaction.visual.offsetY = 0;
  reaction.visual.facing = null;
  reaction.visual.pauseRoutine = false;
}

function findStepOffset(npc, distance, reactionType) {
  if (!distance) return { x: 0, y: 0 };
  const center = getPlayerCenter();
  const awayX = npc.x - center.x;
  const awayY = npc.y - center.y;
  const length = Math.max(1, Math.hypot(awayX, awayY));
  const side = stableChance(`${npc.id}:side`) > 0.5 ? 1 : -1;
  const candidates = reactionType === "avoidingVehicle"
    ? [
      { x: (-awayY / length) * distance * side, y: (awayX / length) * distance * side },
      { x: (awayX / length) * distance, y: (awayY / length) * distance },
      { x: (awayY / length) * distance * side, y: (-awayX / length) * distance * side }
    ]
    : [
      { x: (awayX / length) * distance, y: (awayY / length) * distance },
      { x: (-awayY / length) * distance * side, y: (awayX / length) * distance * side }
    ];

  for (const candidate of candidates) {
    const offset = clampChildOffset(npc, candidate);
    const x = npc.x + offset.x;
    const y = npc.y + offset.y;
    if (isNpcAreaWalkable(x, y, npc.width || 24, npc.height || 46) && !wouldOverlapNearby(npc, x, y)) {
      return { x: Math.round(offset.x), y: Math.round(offset.y) };
    }
  }
  return { x: 0, y: 0 };
}

function clampChildOffset(npc, offset) {
  if (getNpcReactionProfile(npc).id !== "child") return offset;
  const margin = 12;
  const targetX = Math.max(MO_NEIGHBORHOOD.x + margin, Math.min(npc.x + offset.x, MO_NEIGHBORHOOD.x + MO_NEIGHBORHOOD.width - margin));
  const targetY = Math.max(MO_NEIGHBORHOOD.y + margin, Math.min(npc.y + offset.y, MO_NEIGHBORHOOD.y + MO_NEIGHBORHOOD.height - margin));
  return { x: targetX - npc.x, y: targetY - npc.y };
}

function wouldOverlapNearby(npc, x, y) {
  return nearbyNpcs.some((other) => other !== npc && Math.hypot(x - other.x, y - other.y) < 25);
}

function setActiveBubble(npc, text, until) {
  if (!text) return;
  const playerCenter = getPlayerCenter();
  const distance = Math.hypot(playerCenter.x - npc.x, playerCenter.y - npc.y);
  if (activeBubbleNpcId && activeBubbleNpcId !== npc.id) {
    const current = reactionByNpc.get(activeBubbleNpcId);
    if (current?.visual.bubbleText && current.bubbleDistance <= distance) return;
    if (current) current.visual.bubbleText = "";
  }
  const reaction = getOrCreateReaction(npc);
  activeBubbleNpcId = npc.id;
  reaction.bubbleUntil = until;
  reaction.bubbleDistance = distance;
  reaction.visual.bubbleText = text;
}

function getFacingTowardPlayer(npc) {
  const center = getPlayerCenter();
  const dx = center.x - npc.x;
  const dy = center.y - npc.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

function pickLine(lines, id, salt) {
  if (!lines?.length) return "";
  return lines[Math.floor(stableChance(`${id}:${salt}`) * lines.length) % lines.length];
}

function stableChance(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}
