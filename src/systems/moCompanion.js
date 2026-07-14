import { isRectVisible } from "../camera.js";
import { MO_COMPANION_CONFIG, MO_SCHEDULE } from "../data/npcSchedules.js";
import { player, runtime, state } from "../state.js";
import { isPlayerAreaWalkable } from "../utils/collision.js";
import { getCurrentMap, getPlayerCenter } from "../utils/helpers.js";
import { pauseGameClock, resumeGameClock } from "./gameClock.js";
import { isMapTransitionActive } from "./mapTransition.js";

const INVITABLE_STATES = new Set(["washing", "playingWithChildren", "resting"]);
const FOLLOW_STOP_DISTANCE = 12;

export function isMoCompanionActive() {
  return Boolean(state.moCompanion?.active);
}

export function isMoRidingWithPlayer() {
  return Boolean(isMoCompanionActive() && state.moCompanion.ridingWithPlayer);
}

export function canInviteMo(npc) {
  return Boolean(
    npc &&
    !isMoCompanionActive() &&
    npc.visible &&
    !isMapTransitionActive() &&
    INVITABLE_STATES.has(npc.state)
  );
}

export function getMoInvitationBlockedMessage(npc) {
  if (npc?.state === "attendingMass") {
    return "Mình đang dự lễ, để khi khác nhé.";
  }

  if (["walkingToChurch", "enteringChurch"].includes(npc?.state)) {
    return "Sắp đến giờ lễ rồi, mình phải vào nhà thờ ngay.";
  }

  if (["leavingChurch", "returningToChildren"].includes(npc?.state)) {
    return "Mình đang trên đường về với mấy đứa nhỏ, để khi khác nhé.";
  }

  return "Bây giờ mình chưa thể đi cùng bạn được.";
}

export function startMoHangout() {
  if (isMoCompanionActive()) {
    return false;
  }

  const position = findSafeCompanionPosition();
  state.moCompanion = {
    ...state.moCompanion,
    active: true,
    currentMap: state.currentMapId,
    x: position.x,
    y: position.y,
    facing: player.facing,
    followingPlayer: true,
    ridingWithPlayer: false,
    returnDestination: MO_COMPANION_CONFIG.returnDestination,
    pausedAt: Number(state.gameTime.totalGameMinutes) || 0
  };
  runtime.moCompanionNpc = null;
  runtime.moCompanionHydrated = true;
  pauseGameClock(MO_COMPANION_CONFIG.clockPauseReason);
  updateMoCompanion();
  return true;
}

export function endMoHangout() {
  if (!isMoCompanionActive()) {
    return false;
  }

  state.moCompanion = {
    ...state.moCompanion,
    active: false,
    currentMap: null,
    followingPlayer: false,
    ridingWithPlayer: false,
    pausedAt: null
  };
  runtime.moCompanionNpc = null;
  runtime.moCompanionHydrated = false;
  resumeGameClock(MO_COMPANION_CONFIG.clockPauseReason);
  return true;
}

export function updateMoCompanion() {
  if (!isMoCompanionActive()) {
    return null;
  }

  pauseGameClock(MO_COMPANION_CONFIG.clockPauseReason);
  const npc = getMoCompanionNpc();
  const shouldForceSync = !runtime.moCompanionHydrated || state.moCompanion.currentMap !== state.currentMapId;

  syncMoCompanionToPlayer({ force: shouldForceSync });
  return npc;
}

export function syncMoCompanionToPlayer({ force = false } = {}) {
  if (!isMoCompanionActive()) {
    return null;
  }

  const npc = getMoCompanionNpc();
  const riding = isPlayerRidingVehicle();
  const mapChanged = state.moCompanion.currentMap !== state.currentMapId;

  if (riding) {
    applyRidingState(npc);
    runtime.moCompanionHydrated = true;
    return npc;
  }

  const environmentPose = runtime.environmentInteraction?.active
    ? runtime.environmentInteraction.companionPose
    : null;
  if (environmentPose) {
    applyEnvironmentPose(npc, environmentPose);
    runtime.moCompanionHydrated = true;
    return npc;
  }

  if (runtime.photoMode?.active) {
    const position = findSafePhotoPosePosition();
    applyFollowerPosition(npc, position.x, position.y, player.facing, false);
    runtime.moCompanionHydrated = true;
    return npc;
  }

  if (force || mapChanged) {
    const position = findSafeCompanionPosition();
    applyFollowerPosition(npc, position.x, position.y, player.facing, false);
    runtime.moCompanionHydrated = true;
    return npc;
  }

  const target = getFollowTarget();
  const dx = target.x - npc.x;
  const dy = target.y - npc.y;
  const distance = Math.hypot(dx, dy);

  if (distance > MO_COMPANION_CONFIG.catchUpDistance && !isRectVisible({ x: npc.x, y: npc.y, width: npc.width, height: npc.height }, 0)) {
    const position = findSafeCompanionPosition();
    applyFollowerPosition(npc, position.x, position.y, player.facing, false);
    return npc;
  }

  if (distance <= FOLLOW_STOP_DISTANCE) {
    applyFollowerPosition(npc, npc.x, npc.y, npc.facing, false);
    return npc;
  }

  const step = Math.min(MO_COMPANION_CONFIG.followSpeed, distance);
  const moveX = (dx / distance) * step;
  const moveY = (dy / distance) * step;
  const nextX = npc.x + moveX;
  const nextY = npc.y + moveY;
  let x = npc.x;
  let y = npc.y;

  if (isPlayerAreaWalkable(nextX, y)) {
    x = nextX;
  }
  if (isPlayerAreaWalkable(x, nextY)) {
    y = nextY;
  }

  const moved = x !== npc.x || y !== npc.y;
  const facing = moved ? getFacing(moveX, moveY, npc.facing) : npc.facing;
  applyFollowerPosition(npc, x, y, facing, moved);
  return npc;
}

export function getMoCompanionNpc() {
  if (!isMoCompanionActive()) {
    return null;
  }

  if (!runtime.moCompanionNpc) {
    runtime.moCompanionNpc = {
      id: MO_SCHEDULE.id,
      name: MO_SCHEDULE.name,
      color: MO_SCHEDULE.color,
      width: 24,
      height: 46,
      x: state.moCompanion.x,
      y: state.moCompanion.y,
      mapId: state.moCompanion.currentMap || state.currentMapId,
      state: "hangingOut",
      activity: "hangingOut",
      facing: state.moCompanion.facing || "down",
      visible: true,
      interactable: true,
      companion: true,
      ridingWithPlayer: false
    };
  }

  return runtime.moCompanionNpc;
}

export function getMoReturnPoint(map = getCurrentMap()) {
  if (!isMoCompanionActive() || map.id !== MO_COMPANION_CONFIG.returnMapId || !map.companionReturnPoint) {
    return null;
  }

  const point = map.companionReturnPoint;
  return {
    id: point.id || MO_COMPANION_CONFIG.returnPointId,
    type: "moReturn",
    targetId: point.id || MO_COMPANION_CONFIG.returnPointId,
    x: point.x,
    y: point.y,
    radius: point.radius || 56,
    visibleRange: point.visibleRange || 220,
    labelOffsetX: point.labelOffsetX || 0,
    labelOffsetY: point.labelOffsetY ?? -34,
    label: point.label || "Nhà thờ Lớn"
  };
}

export function isNearMoReturnPoint() {
  const point = getMoReturnPoint();
  if (!point) {
    return false;
  }

  const center = getPlayerCenter();
  return Math.hypot(center.x - point.x, center.y - point.y) <= point.radius;
}

export function getMoCompanionDialogue() {
  const map = getCurrentMap();
  if (map.id === "baDinh") {
    return "Nơi này yên tĩnh và trang nghiêm quá.";
  }
  if (map.id === "longBien") {
    return "Gió trên cầu mát thật.";
  }
  if (map.id === "hoanKiem") {
    const point = getMoReturnPoint(map);
    if (point) {
      const center = getPlayerCenter();
      if (Math.hypot(center.x - point.x, center.y - point.y) < 260) {
        return "Chúng mình về tới nơi rồi.";
      }
    }
    return "Buổi tối quanh hồ đẹp thật đấy.";
  }
  return "Đi cùng bạn khám phá Hà Nội vui thật.";
}

function applyRidingState(npc) {
  npc.x = player.x;
  npc.y = player.y;
  npc.mapId = state.currentMapId;
  npc.facing = player.facing;
  npc.state = "hangingOut";
  npc.activity = "riding";
  npc.visible = false;
  npc.interactable = false;
  npc.companion = true;
  npc.ridingWithPlayer = true;
  writeCompanionState(npc, true);
}

function applyFollowerPosition(npc, x, y, facing, walking) {
  npc.x = x;
  npc.y = y;
  npc.mapId = state.currentMapId;
  npc.facing = facing;
  npc.state = "hangingOut";
  npc.activity = walking ? "walking" : "hangingOut";
  npc.visible = true;
  npc.interactable = true;
  npc.companion = true;
  npc.ridingWithPlayer = false;
  writeCompanionState(npc, false);
}

function applyEnvironmentPose(npc, pose) {
  npc.x = pose.x;
  npc.y = pose.y;
  npc.mapId = state.currentMapId;
  npc.facing = pose.facing || player.facing;
  npc.state = "hangingOut";
  npc.activity = pose.activity || "hangingOut";
  npc.visible = true;
  npc.interactable = false;
  npc.companion = true;
  npc.ridingWithPlayer = false;
  writeCompanionState(npc, false);
}

function writeCompanionState(npc, ridingWithPlayer) {
  state.moCompanion.currentMap = state.currentMapId;
  state.moCompanion.x = Math.round(npc.x);
  state.moCompanion.y = Math.round(npc.y);
  state.moCompanion.facing = npc.facing;
  state.moCompanion.followingPlayer = !ridingWithPlayer;
  state.moCompanion.ridingWithPlayer = ridingWithPlayer;

  const savedMo = state.npcSchedules.mo || (state.npcSchedules.mo = {});
  savedMo.currentState = "hangingOut";
  savedMo.currentMap = state.currentMapId;
  savedMo.x = state.moCompanion.x;
  savedMo.y = state.moCompanion.y;
}

function getFollowTarget() {
  const offsets = {
    up: { x: 0, y: 42 },
    down: { x: 0, y: -42 },
    left: { x: 40, y: 4 },
    right: { x: -40, y: 4 }
  };
  const offset = offsets[player.facing] || offsets.down;
  return { x: player.x + offset.x, y: player.y + offset.y };
}

function findSafeCompanionPosition() {
  const target = getFollowTarget();
  const candidates = [
    target,
    { x: player.x - 42, y: player.y + 4 },
    { x: player.x + 42, y: player.y + 4 },
    { x: player.x, y: player.y - 46 },
    { x: player.x, y: player.y + 46 },
    { x: player.x - 52, y: player.y - 34 },
    { x: player.x + 52, y: player.y - 34 },
    { x: player.x - 52, y: player.y + 34 },
    { x: player.x + 52, y: player.y + 34 }
  ];

  return candidates.find((candidate) => isPlayerAreaWalkable(candidate.x, candidate.y)) || {
    x: player.x,
    y: player.y
  };
}

function findSafePhotoPosePosition() {
  const candidates = [
    { x: player.x + 38, y: player.y + 2 },
    { x: player.x - 38, y: player.y + 2 },
    { x: player.x + 34, y: player.y - 32 },
    { x: player.x - 34, y: player.y - 32 }
  ];
  return candidates.find((candidate) => isPlayerAreaWalkable(candidate.x, candidate.y)) || findSafeCompanionPosition();
}

function getFacing(dx, dy, fallback) {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return fallback;
  }
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "down" : "up";
}

function isPlayerRidingVehicle() {
  return Boolean(state.vehicle?.owned && state.vehicle.equipped && state.vehicle.status === "riding");
}
