import { foodCatalog } from "./foods.js";
import { vehicleCatalog } from "./vehicles.js";

const IMPORTANT_ZONE_KINDS = new Set(["road", "bridge", "plaza", "courtyard", "sidewalk", "path"]);

export function getMapOverlayData(map) {
  return {
    bounds: {
      width: map.width,
      height: map.height
    },
    walkZones: (map.walkZones || [])
      .filter((zone) => IMPORTANT_ZONE_KINDS.has(zone.kind))
      .map((zone) => ({ ...zone })),
    water: (map.water || []).map((water) => ({ ...water })),
    landmarks: (map.landmarks || []).map((landmark) => ({
      id: landmark.id,
      name: landmark.name,
      kind: landmark.kind,
      x: getMarkerX(landmark),
      y: getMarkerY(landmark),
      width: landmark.width,
      height: landmark.height,
      stamp: landmark.stamp
    })),
    shops: (map.shops || []).map((shop) => ({
      id: shop.id,
      name: foodCatalog[shop.foodId]?.name || "Quán ăn",
      x: shop.x + shop.width / 2,
      y: shop.y + shop.height / 2,
      kind: "food"
    })),
    vehicleShops: (map.vehicleShops || []).map((shop) => ({
      id: shop.id,
      name: shop.name || vehicleCatalog[shop.vehicleId]?.name || "VinFast",
      x: shop.interactionPoint?.x || shop.x + shop.width / 2,
      y: shop.interactionPoint?.y || shop.y + shop.height / 2,
      kind: "vehicle"
    })),
    parkingSpots: (map.parkingSpots || []).map((spot) => ({
      id: spot.id,
      name: spot.name,
      x: spot.interactionPoint?.x || spot.x + spot.width / 2,
      y: spot.interactionPoint?.y || spot.y + spot.height / 2,
      kind: "parking"
    })),
    companionReturnPoint: map.companionReturnPoint ? {
      id: map.companionReturnPoint.id,
      name: "Đưa Mơ về Nhà thờ Lớn",
      x: map.companionReturnPoint.x,
      y: map.companionReturnPoint.y,
      kind: "companionReturn"
    } : null,
    exits: (map.exits || []).map((exit) => ({
      id: exit.id,
      name: exit.name,
      x: exit.x + exit.width / 2,
      y: exit.y + exit.height / 2,
      kind: exit.kind,
      targetMap: exit.targetMap
    }))
  };
}

function getMarkerX(object) {
  return object.interactionPoint?.x || object.x + object.width / 2;
}

function getMarkerY(object) {
  return object.interactionPoint?.y || object.y + object.height / 2;
}
