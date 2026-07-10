import { state } from "../state.js";
import { getPlayerCenter } from "../utils/helpers.js";

export const DEFAULT_DISCOVERY_VISIBLE_RANGE = 230;
export const DEFAULT_INTERACTION_RANGE = 48;

export function getLandmarkInteractionPoints(map) {
  return map.landmarks.flatMap((landmark) => {
    const rawPoints = landmark.interactionPoints ||
      (landmark.interactionPoint ? [landmark.interactionPoint] : []);

    return rawPoints.map((point, index) => normalizeLandmarkPoint(landmark, point, index));
  });
}

export function getVisibleLandmarkInteractionPoints(map, center = getPlayerCenter()) {
  return getLandmarkInteractionPoints(map)
    .map((point) => ({ ...point, distance: distanceToInteractionPoint(point, center) }))
    .filter((point) => point.distance <= point.visibleRange);
}

export function getVehicleShopInteractionPoints(map) {
  return (map.vehicleShops || []).flatMap((shop) => {
    const rawPoints = shop.interactionPoints ||
      (shop.interactionPoint ? [shop.interactionPoint] : []);

    return rawPoints.map((point, index) => normalizeShopPoint(shop, point, index));
  });
}

export function getParkingInteractionPoints(map) {
  return (map.parkingSpots || []).flatMap((spot) => {
    const rawPoints = spot.interactionPoints ||
      (spot.interactionPoint ? [spot.interactionPoint] : []);

    return rawPoints.map((point, index) => normalizeParkingPoint(spot, point, index));
  });
}

export function getExitInteractionPoints(map) {
  return (map.exits || []).flatMap((exit) => {
    const rawPoints = exit.interactionPoints ||
      (exit.interactionPoint ? [exit.interactionPoint] : []);
    return rawPoints.map((point, index) => normalizeExitPoint(exit, point, index));
  });
}

export function getVisibleInteractionPoints(map, center = getPlayerCenter()) {
  return [
    ...getLandmarkInteractionPoints(map),
    ...getVehicleShopInteractionPoints(map),
    ...getParkingInteractionPoints(map),
    ...getExitInteractionPoints(map)
  ]
    .map((point) => ({ ...point, distance: distanceToInteractionPoint(point, center) }))
    .filter((point) => point.distance <= point.visibleRange);
}

export function getNearestInteractionPoint(center = getPlayerCenter(), map, options = {}) {
  const maxDistance = options.maxDistance ?? Infinity;
  const points = getLandmarkInteractionPoints(map)
    .map((point) => ({ ...point, distance: distanceToInteractionPoint(point, center) }))
    .filter((point) => point.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);

  return points[0] || null;
}

export function distanceToInteractionPoint(point, center = getPlayerCenter()) {
  return Math.hypot(center.x - point.x, center.y - point.y);
}

export function isLandmarkPointDiscovered(point) {
  const landmark = point.landmark;
  return state.discoveredLandmarks.includes(landmark.id) ||
    (landmark.stamp && state.inventory.stamps.includes(landmark.stamp));
}

export function isInteractionPointCompleted(point) {
  if (point.type === "landmark") {
    return isLandmarkPointDiscovered(point);
  }

  if (point.type === "vehicleShop") {
    return Boolean(state.vehicle && state.vehicle.owned);
  }

  if (point.type === "parking") {
    const parkedAt = state.vehicle?.parkedAt;
    return Boolean(parkedAt && parkedAt.mapId === state.currentMapId && parkedAt.spotId === point.spot.id);
  }

  return false;
}

export function normalizeLandmarkPoint(landmark, point, index = 0) {
  return {
    id: point.id || `${landmark.id}-point-${index}`,
    type: "landmark",
    targetId: landmark.id,
    landmark,
    x: point.x,
    y: point.y,
    radius: point.radius || point.interactionRange || DEFAULT_INTERACTION_RANGE,
    visibleRange: point.visibleRange || point.discoveryVisibleRange || DEFAULT_DISCOVERY_VISIBLE_RANGE,
    labelOffsetX: point.labelOffsetX || 0,
    labelOffsetY: point.labelOffsetY ?? -28,
    label: point.label || landmark.name
  };
}

export function normalizeShopPoint(shop, point, index = 0) {
  return {
    id: point.id || `${shop.id}-point-${index}`,
    type: "vehicleShop",
    targetId: shop.id,
    shop,
    x: point.x,
    y: point.y,
    radius: point.radius || point.interactionRange || DEFAULT_INTERACTION_RANGE,
    visibleRange: point.visibleRange || point.discoveryVisibleRange || DEFAULT_DISCOVERY_VISIBLE_RANGE,
    labelOffsetX: point.labelOffsetX || 0,
    labelOffsetY: point.labelOffsetY ?? -28,
    label: point.label || shop.name
  };
}

export function normalizeParkingPoint(spot, point, index = 0) {
  return {
    id: point.id || `${spot.id}-point-${index}`,
    type: "parking",
    targetId: spot.id,
    spot,
    x: point.x,
    y: point.y,
    radius: point.radius || point.interactionRange || DEFAULT_INTERACTION_RANGE,
    visibleRange: point.visibleRange || point.discoveryVisibleRange || DEFAULT_DISCOVERY_VISIBLE_RANGE,
    labelOffsetX: point.labelOffsetX || 0,
    labelOffsetY: point.labelOffsetY ?? -28,
    label: point.label || spot.name
  };
}

export function normalizeExitPoint(exit, point, index = 0) {
  return {
    id: point.id || `${exit.id}-point-${index}`,
    type: "exit",
    targetId: exit.id,
    exit,
    x: point.x,
    y: point.y,
    radius: point.radius || point.interactionRange || DEFAULT_INTERACTION_RANGE,
    visibleRange: point.visibleRange || point.discoveryVisibleRange || DEFAULT_DISCOVERY_VISIBLE_RANGE,
    labelOffsetX: point.labelOffsetX || 0,
    labelOffsetY: point.labelOffsetY ?? -28,
    label: point.label || exit.name
  };
}
