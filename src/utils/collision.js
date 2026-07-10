import { player, WORLD_HEIGHT, WORLD_WIDTH } from "../state.js";
import { getCurrentMap } from "./helpers.js";

export function isPlayerAreaWalkable(x, y) {
  const feet = getPlayerFeet(x, y);

  if (
    feet.x < 0 ||
    feet.y < 0 ||
    feet.x + feet.width > WORLD_WIDTH ||
    feet.y + feet.height > WORLD_HEIGHT
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
    getCurrentMap().walkZones.some((zone) => pointInRect(point.x, point.y, zone))
  );

  if (!allowed) {
    return false;
  }

  return !getSolidObjects().some((solid) => rectsOverlap(feet, shrinkRect(solid, 2)));
}

export function getPlayerFeet(x = player.x, y = player.y) {
  return {
    x: x + 5,
    y: y + player.height - 11,
    width: player.width - 10,
    height: 10
  };
}

export function getSolidObjects() {
  const map = getCurrentMap();
  return [
    ...map.buildings,
    ...map.shops,
    ...map.landmarks.filter((landmark) => landmark.solid !== false)
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
