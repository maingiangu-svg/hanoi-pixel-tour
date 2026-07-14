import { isRectVisible } from "../camera.js";
import { branchingQuests } from "../data/branchingQuests.js";
import { player, state } from "../state.js";
import { isNpcAreaWalkable } from "../utils/collision.js";

const ACTIVE_STATUSES = new Set(["active", "unresolved"]);

export function startQuestFollower(progress, effect) {
  progress.follower = {
    active: true,
    actorId: effect.actorId,
    mapId: state.currentMapId,
    x: player.x - 36,
    y: player.y + 6,
    facing: player.facing,
    groupCount: effect.groupCount || 1,
    speed: effect.speed || 2.15
  };
  placeFollowerNearPlayer(progress.follower);
}

export function updateQuestFollower(progress) {
  const follower = progress.follower;
  if (!follower?.active) return;
  if (follower.mapId !== state.currentMapId) {
    follower.mapId = state.currentMapId;
    placeFollowerNearPlayer(follower);
  }
  const target = getFollowerTarget();
  const dx = target.x - follower.x;
  const dy = target.y - follower.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 360 && !isRectVisible({ x: follower.x, y: follower.y, width: 24, height: 46 }, 0)) {
    placeFollowerNearPlayer(follower);
    return;
  }
  if (distance < 38 || distance === 0) return;
  const step = Math.min(follower.speed || 2.15, distance);
  const moveX = dx / distance * step;
  const moveY = dy / distance * step;
  if (isNpcAreaWalkable(follower.x + moveX, follower.y)) follower.x += moveX;
  if (isNpcAreaWalkable(follower.x, follower.y + moveY)) follower.y += moveY;
  follower.facing = Math.abs(moveX) > Math.abs(moveY) ? (moveX < 0 ? "left" : "right") : (moveY < 0 ? "up" : "down");
}

export function hydrateQuestFollower(progress) {
  if (!progress.follower?.active) return;
  progress.follower.mapId = state.currentMapId;
  if (!Number.isFinite(progress.follower.x) || !Number.isFinite(progress.follower.y)) {
    placeFollowerNearPlayer(progress.follower);
  }
}

export function getQuestFollowersForMap(mapId = state.currentMapId) {
  return Object.entries(state.branchingQuestProgress).flatMap(([questId, progress]) => {
    if (!ACTIVE_STATUSES.has(progress.status) || !progress.follower?.active || progress.follower.mapId !== mapId) return [];
    return [{ ...progress.follower, questId, name: getFollowerName(progress.follower.actorId) }];
  });
}

export function canChangeMapWithQuestFollowers(targetMapId) {
  const blocking = Object.entries(state.branchingQuestProgress).find(([, progress]) =>
    ACTIVE_STATUSES.has(progress.status) && progress.follower?.active && progress.follower.mapId !== targetMapId
  );
  if (!blocking) return { allowed: true };
  const quest = branchingQuests[blocking[0]];
  return { allowed: false, message: `Hãy hoàn thành chặng dẫn đường của nhiệm vụ “${quest.title}” trước khi rời khu.` };
}

export function canUseVehicleWithQuestFollower() {
  const active = Object.values(state.branchingQuestProgress).some((progress) => ACTIVE_STATUSES.has(progress.status) && progress.follower?.active);
  return active ? { allowed: false, message: "Người đang đi cùng không thể lên VinFast. Hãy hoàn thành chặng dẫn đường trước." } : { allowed: true };
}

export function getQuestTrafficSpeedMultiplier(mapId, x, y) {
  const progress = state.branchingQuestProgress.elderCrossing;
  if (!ACTIVE_STATUSES.has(progress?.status) || !progress.follower?.active || mapId !== "baDinh") return 1;
  return Math.hypot(x - 470, y - 1020) <= 260 ? 0.28 : 1;
}

function placeFollowerNearPlayer(follower) {
  const candidates = [
    { x: player.x - 42, y: player.y + 4 },
    { x: player.x + 42, y: player.y + 4 },
    { x: player.x, y: player.y + 48 },
    { x: player.x, y: player.y - 48 }
  ];
  const point = candidates.find((candidate) => isNpcAreaWalkable(candidate.x, candidate.y)) || { x: player.x, y: player.y };
  follower.x = point.x;
  follower.y = point.y;
  follower.mapId = state.currentMapId;
}

function getFollowerTarget() {
  const offsets = { up: { x: 0, y: 44 }, down: { x: 0, y: -44 }, left: { x: 42, y: 0 }, right: { x: -42, y: 0 } };
  const offset = offsets[player.facing] || offsets.down;
  return { x: player.x + offset.x, y: player.y + offset.y };
}

function getFollowerName(actorId) {
  if (actorId === "elderFollower") return "Cụ ông";
  if (actorId === "tourGroupFollower") return "Đoàn khách";
  return "Du khách";
}
