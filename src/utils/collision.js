import { player, runtime } from "../state.js";
import { getCurrentMap } from "./helpers.js";

export function isPlayerAreaWalkable(x, y) {
  return isFeetAreaWalkable(getPlayerFeet(x, y));
}

export function isVehicleAreaWalkable(x, y) {
  return isFeetAreaWalkable(getVehicleFeet(x, y), { vehicle: true });
}

export function getVehicleRestrictedZoneAt(x, y) {
  return getVehicleRestrictedZoneForFeet(getVehicleFeet(x, y));
}

export function hasVehicleClearance(x, y) {
  return [
    [0, 0],
    [6, 0],
    [-6, 0],
    [0, 6],
    [0, -6]
  ].every(([dx, dy]) => isVehicleAreaWalkable(x + dx, y + dy));
}

function isFeetAreaWalkable(feet, options = {}) {
  const map = getCurrentMap();
  const worldWidth = map.width || 1024;
  const worldHeight = map.height || 640;

  if (
    feet.x < 0 ||
    feet.y < 0 ||
    feet.x + feet.width > worldWidth ||
    feet.y + feet.height > worldHeight
  ) {
    return false;
  }

  const points = [
    { x: feet.x, y: feet.y },
    { x: feet.x + feet.width, y: feet.y },
    { x: feet.x, y: feet.y + feet.height },
    { x: feet.x + feet.width, y: feet.y + feet.height }
  ];

  const allowed = points.every((point) =>
    map.walkZones.some((zone) => pointInRect(point.x, point.y, zone) &&
      (!options.vehicle || isVehicleZoneAllowed(zone)))
  );

  if (!allowed) {
    return false;
  }

  if (options.vehicle && getVehicleRestrictedZoneForFeet(feet, map)) {
    return false;
  }

  const blockers = options.vehicle
    ? [...getSolidObjects(), ...(map.vehicleBlocked || [])]
    : getSolidObjects();

  return !blockers.some((solid) => rectsOverlap(feet, shrinkRect(solid, 2)));
}

function getVehicleRestrictedZoneForFeet(feet, map = getCurrentMap()) {
  return (map.vehicleRestrictedZones || []).find((zone) => rectsOverlap(feet, zone)) || null;
}

function isVehicleZoneAllowed(zone) {
  if (zone.vehicleAllowed === false) {
    return false;
  }

  if (zone.vehicleAllowed === true) {
    return true;
  }

  if (["road", "bridge", "plaza", "courtyard"].includes(zone.kind)) {
    return true;
  }

  return zone.kind === "sidewalk" && Math.min(zone.width, zone.height) >= 90;
}

export function getPlayerFeet(x = player.x, y = player.y) {
  return {
    x: x + 5,
    y: y + player.height - 11,
    width: player.width - 10,
    height: 10
  };
}

export function getVehicleFeet(x = player.x, y = player.y) {
  return {
    x: x + 2,
    y: y + player.height - 15,
    width: player.width - 4,
    height: 14
  };
}

export function getSolidObjects() {
  const map = getCurrentMap();
  return [
    ...map.buildings,
    ...map.shops,
    ...(map.vehicleShops || []),
    ...(map.collisionBlocks || []),
    ...map.landmarks.filter((landmark) => landmark.solid !== false),
    ...(runtime.scheduledCollisionBlocks || []).filter((block) => !block.mapId || block.mapId === map.id)
  ];
}

export function pointInRect(x, y, rect) {
  return x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y;
}

export function shrinkRect(rect, amount) {
  return {
    x: rect.x + amount,
    y: rect.y + amount,
    width: Math.max(0, rect.width - amount * 2),
    height: Math.max(0, rect.height - amount * 2)
  };
}

export function distanceToRect(point, rect) {
  const nearestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const dx = point.x - nearestX;
  const dy = point.y - nearestY;
  return Math.sqrt(dx * dx + dy * dy);
}
