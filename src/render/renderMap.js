import { ctx, runtime } from "../state.js";
import { foodCatalog } from "../data/foods.js";
import { vehicleCatalog } from "../data/vehicles.js";
import { camera, isRectVisible } from "../camera.js";
import { distanceToRect } from "../utils/collision.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { drawPixelRect, drawTextBadge } from "./renderUI.js";
import { drawStreetLifeNpc, isStreetLifeNpc } from "./renderStreetNpcs.js";
import { drawGroundShadow, drawPixelShadow, drawSurfaceTexture, drawWaterTexture, FLAT_SHADOW_OPTIONS } from "./renderPixelEffects.js";
import {
  drawAdminBuilding as drawAdminFacade,
  drawApartmentBlock as drawApartmentFacade,
  drawCafeFront as drawCafeFacade,
  drawTubeHouse
} from "./renderArchitecture.js";
import { getActiveMapNpcs, isShopOpen } from "../systems/worldSchedule.js";
import { drawNpcRainGear } from "./renderWeather.js";
import { drawNpcAreaAccessory } from "./renderAreaAmbience.js";
import {
  getContextualNpcSpeech,
  getNpcReactionVisual,
  hasActiveReactionBubble
} from "../systems/npcReactions.js";
import { drawNpcReactionOverlay } from "./renderNpcReactions.js";
import { drawFemaleBikeDealershipPreview } from "./renderVehicle.js";
import { drawNpcLocalLight } from "./renderNpcLighting.js";

export function drawBackground(map) {
  const width = map.width || 1024;
  const height = map.height || 640;
  const bounds = getRenderBounds(map, 8);
  ctx.fillStyle = map.background;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.fillStyle = "rgba(42, 39, 34, 0.11)";
  const textureBottom = Math.min(height, bounds.y + bounds.height);
  const textureRight = Math.min(width, bounds.x + bounds.width);
  const firstTextureRow = Math.max(0, Math.floor((bounds.y - 12) / 34));
  for (let row = firstTextureRow; ; row += 1) {
    const y = 12 + row * 34;
    if (y >= textureBottom) {
      break;
    }
    const firstX = row % 2 === 0 ? 12 : 30;
    const startX = firstX + Math.max(0, Math.floor((bounds.x - firstX) / 52)) * 52;
    for (let x = startX; x < textureRight; x += 52) {
      ctx.fillRect(x, y, 10, 3);
      ctx.fillRect(x + 16, y + 8, 5, 3);
    }
  }

  ctx.fillStyle = "rgba(255, 246, 220, 0.07)";
  const firstLightRow = Math.max(0, Math.floor(bounds.y / 32));
  for (let row = firstLightRow; ; row += 1) {
    const y = row * 32;
    if (y >= textureBottom) {
      break;
    }
    const firstX = row % 2 === 0 ? 0 : 16;
    const startX = firstX + Math.max(0, Math.floor((bounds.x - firstX) / 32)) * 32;
    for (let x = startX; x < textureRight; x += 32) {
      ctx.fillRect(x, y, 4, 4);
    }
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  if (bounds.y === 0) ctx.fillRect(0, 0, width, 8);
  if (bounds.y + bounds.height >= height) ctx.fillRect(0, height - 8, width, 8);
  if (bounds.x === 0) ctx.fillRect(0, 0, 8, height);
  if (bounds.x + bounds.width >= width) ctx.fillRect(width - 8, 0, 8, height);
}

export function drawGroundPatches(map) {
  (map.groundPatches || []).forEach((patch) => {
    if (!isRectVisible(patch, 100)) {
      return;
    }

    const palette = getGroundPatchPalette(patch.kind);
    drawPixelRect(patch.x, patch.y, patch.width, patch.height, palette.fill, palette.stroke, 2);
    drawPatchTilePattern(patch, palette.line);
    drawSurfaceTexture(patch, patch.kind);

    ctx.fillStyle = palette.light;
    ctx.fillRect(patch.x + 8, patch.y + 8, patch.width - 16, 3);
    ctx.fillRect(patch.x + 8, patch.y + 8, 3, patch.height - 16);
  });
}

function getGroundPatchPalette(kind) {
  if (kind === "asphalt") {
    return { fill: "#383c43", stroke: "#202329", line: "rgba(255,255,255,0.10)", light: "rgba(255,255,255,0.10)" };
  }
  if (kind === "brick") {
    return { fill: "#b97b55", stroke: "#6a3f2c", line: "rgba(255, 230, 172, 0.22)", light: "rgba(255, 232, 176, 0.24)" };
  }
  if (kind === "grass") {
    return { fill: "#5e8f54", stroke: "#3d6439", line: "rgba(220, 238, 166, 0.18)", light: "rgba(238, 246, 190, 0.18)" };
  }
  if (kind === "plaza") {
    return { fill: "#c8ab68", stroke: "#7e6539", line: "rgba(255, 240, 180, 0.28)", light: "rgba(255, 240, 192, 0.24)" };
  }
  if (kind === "embankment") {
    return { fill: "#a89d85", stroke: "#5f5b50", line: "rgba(245, 239, 219, 0.24)", light: "rgba(255,255,255,0.18)" };
  }
  return { fill: "#b9c0b6", stroke: "#747d75", line: "rgba(238, 241, 229, 0.28)", light: "rgba(255,255,255,0.20)" };
}

function drawPatchTilePattern(patch, color) {
  const bounds = getRenderBounds(patch, 0);
  const left = Math.max(patch.x, bounds.x);
  const top = Math.max(patch.y, bounds.y);
  const right = Math.min(patch.x + patch.width, bounds.x + bounds.width);
  const bottom = Math.min(patch.y + patch.height, bounds.y + bounds.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const firstX = patch.x + 24 + Math.max(0, Math.ceil((left - (patch.x + 24)) / 24)) * 24;
  for (let x = firstX; x < right; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  const firstY = patch.y + 24 + Math.max(0, Math.ceil((top - (patch.y + 24)) / 24)) * 24;
  for (let y = firstY; y < bottom; y += 24) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

function shouldShowLabel(object, maxDistance = 160) {
  const activeObject = runtime.nearbyInteractable &&
    (runtime.nearbyInteractable.source || runtime.nearbyInteractable.object);

  if (activeObject && isSameMapObject(activeObject, object)) {
    return true;
  }

  if (runtime.nearbyInteractable) {
    return false;
  }

  const pointDistance = getNearestObjectPointDistance(object);
  if (pointDistance !== null) {
    return pointDistance <= Math.min(maxDistance, getObjectLabelRange(object));
  }

  return distanceToRect(getPlayerCenter(), object) <= maxDistance;
}

function getNearestObjectPointDistance(object) {
  const points = object.interactionPoints || (object.interactionPoint ? [object.interactionPoint] : []);
  if (!points.length) {
    return null;
  }

  const center = getPlayerCenter();
  return Math.min(...points.map((point) => Math.hypot(center.x - point.x, center.y - point.y)));
}

function getObjectLabelRange(object) {
  const points = object.interactionPoints || (object.interactionPoint ? [object.interactionPoint] : []);
  if (!points.length) {
    return 64;
  }

  return Math.max(...points.map((point) => (point.radius || 48) + 16));
}

function isSameMapObject(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a.id && b.id) {
    return a.id === b.id;
  }
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function drawNearbyLabel(object, text, centerX, centerY, maxWidth, fill, distance = 170) {
  if (shouldShowLabel(object, distance)) {
    drawTextBadge(text, centerX, centerY, maxWidth, fill);
  }
}

export function drawWater(map) {
  map.water.forEach((water) => {
    if (!isRectVisible(water, 80)) {
      return;
    }

    drawPixelShadow(water.x, water.y, water.width, water.height, FLAT_SHADOW_OPTIONS);
    drawPixelRect(water.x, water.y, water.width, water.height, "#237ab6", "#0d4d7a", 5);

    ctx.fillStyle = "#2f96ce";
    ctx.fillRect(water.x + 7, water.y + 7, water.width - 14, water.height - 14);
    ctx.fillStyle = "#3fb0de";
    ctx.fillRect(water.x + 14, water.y + 14, water.width - 28, water.height - 28);
    if (water.kind === "lake") {
      ctx.fillStyle = map.background;
      ctx.fillRect(water.x, water.y, 72, 82);
      ctx.fillRect(water.x + water.width - 88, water.y + 12, 88, 74);
      ctx.fillRect(water.x + 18, water.y + water.height - 92, 104, 92);
      ctx.fillRect(water.x + water.width - 118, water.y + water.height - 86, 118, 86);
    }

    drawWaterTexture(water);

    ctx.fillStyle = "#d6c57a";
    for (let x = water.x + 6; x < water.x + water.width - 8; x += 22) {
      ctx.fillRect(x, water.y - 4, 13, 5);
      ctx.fillRect(x, water.y + water.height - 1, 13, 5);
    }
    for (let y = water.y + 8; y < water.y + water.height - 8; y += 22) {
      ctx.fillRect(water.x - 4, y, 5, 13);
      ctx.fillRect(water.x + water.width - 1, y, 5, 13);
    }

    if (water.label && distanceToRect(getPlayerCenter(), water) <= 190) {
      drawTextBadge(water.label, water.x + water.width / 2, water.y + 38, 128, "#18547f");
    }
  });
}

export function drawWalkZones(map) {
  map.walkZones.forEach((zone) => {
    if (!isRectVisible(zone, 80)) {
      return;
    }

    ctx.fillStyle = "rgba(0,0,0,0.14)";
    ctx.fillRect(zone.x + 5, zone.y + 5, zone.width, zone.height);

    if (zone.kind === "road") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#343943", "#1f222a", 4);
      drawSurfaceTexture(zone, zone.kind);
      ctx.fillStyle = "#59606b";
      if (zone.width >= zone.height) {
        ctx.fillRect(zone.x, zone.y + 7, zone.width, 4);
        ctx.fillRect(zone.x, zone.y + zone.height - 11, zone.width, 4);
      } else {
        ctx.fillRect(zone.x + 7, zone.y, 4, zone.height);
        ctx.fillRect(zone.x + zone.width - 11, zone.y, 4, zone.height);
      }
      drawRoadLine(zone);
    }

    if (zone.kind === "sidewalk") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#c9cec4", "#879087", 3);
      drawTilePattern(zone, "#e3e6da");
      drawSurfaceTexture(zone, zone.kind);
    }

    if (zone.kind === "plaza") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#d5bd73", "#907642", 3);
      drawTilePattern(zone, "#ead792");
      drawSurfaceTexture(zone, zone.kind);
    }

    if (zone.kind === "courtyard") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#cfae68", "#8d7040", 3);
      drawTilePattern(zone, "#e8cf8a");
      drawSurfaceTexture(zone, zone.kind);
      ctx.fillStyle = "rgba(92, 92, 54, 0.15)";
      for (let y = zone.y + 16; y < zone.y + zone.height - 12; y += 62) {
        ctx.fillRect(zone.x + 16, y, zone.width - 32, 4);
      }
    }

    if (zone.kind === "path") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#d9c07a", "#957843", 3);
      drawTilePattern(zone, "#eadc9e");
      drawSurfaceTexture(zone, zone.kind);
    }

    if (zone.kind === "bridge") {
      drawPixelRect(zone.x, zone.y, zone.width, zone.height, "#454a52", "#22242a", 4);
      drawSurfaceTexture(zone, zone.kind);
      ctx.fillStyle = "#b73b34";
      ctx.fillRect(zone.x, zone.y + 6, zone.width, 7);
      ctx.fillRect(zone.x, zone.y + zone.height - 13, zone.width, 7);
      ctx.fillStyle = "#e35a4f";
      for (let x = zone.x + 12; x < zone.x + zone.width - 10; x += 28) {
        ctx.fillRect(x, zone.y + 2, 6, zone.height - 4);
      }
      drawRoadLine(zone);
    }
  });
}

export function drawRoadLine(zone) {
  ctx.fillStyle = "#f2d86b";

  if (zone.width >= zone.height) {
    const y = zone.y + Math.floor(zone.height / 2) - 2;
    for (let x = zone.x + 16; x < zone.x + zone.width - 12; x += 48) {
      ctx.fillRect(x, y, 24, 4);
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(zone.x + 8, zone.y + 16, zone.width - 16, 2);
    ctx.fillRect(zone.x + 8, zone.y + zone.height - 18, zone.width - 16, 2);
  } else {
    const x = zone.x + Math.floor(zone.width / 2) - 2;
    for (let y = zone.y + 16; y < zone.y + zone.height - 12; y += 48) {
      ctx.fillRect(x, y, 4, 24);
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(zone.x + 16, zone.y + 8, 2, zone.height - 16);
    ctx.fillRect(zone.x + zone.width - 18, zone.y + 8, 2, zone.height - 16);
  }
}

export function drawTilePattern(zone, color) {
  const bounds = getRenderBounds(zone, 0);
  const left = Math.max(zone.x, bounds.x);
  const top = Math.max(zone.y, bounds.y);
  const right = Math.min(zone.x + zone.width, bounds.x + bounds.width);
  const bottom = Math.min(zone.y + zone.height, bounds.y + bounds.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const firstX = zone.x + 22 + Math.max(0, Math.ceil((left - (zone.x + 22)) / 22)) * 22;
  for (let x = firstX; x < right; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }
  const firstY = zone.y + 22 + Math.max(0, Math.ceil((top - (zone.y + 22)) / 22)) * 22;
  for (let y = firstY; y < bottom; y += 22) {
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
}

function getRenderBounds(rect, margin = 0) {
  const originX = rect.x ?? 0;
  const originY = rect.y ?? 0;
  const width = rect.width || 0;
  const height = rect.height || 0;
  const maxX = originX + width;
  const maxY = originY + height;
  const left = Math.max(originX, Math.floor(camera.x - margin));
  const top = Math.max(originY, Math.floor(camera.y - margin));
  const right = Math.min(maxX, Math.ceil(camera.x + camera.width + margin));
  const bottom = Math.min(maxY, Math.ceil(camera.y + camera.height + margin));

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
}

export function drawBuildings(map) {
  map.buildings.forEach((building) => {
    if (!isRectVisible(building, 100)) {
      return;
    }

    if (building.kind === "wall") {
      drawWall(building);
      return;
    }

    if (building.kind === "admin") {
      drawAdminFacade(building);
      return;
    }

    if (building.kind === "apartment" || building.kind === "collective") {
      drawApartmentFacade(building);
      return;
    }

    if (building.kind === "cafeFront") {
      drawCafeFacade(building);
      return;
    }

    if (building.kind === "marketHall") {
      drawMarket(building);
      return;
    }

    if (building.kind === "tubeHouse") {
      drawTubeHouse(building);
      return;
    }

    drawPixelShadow(building.x, building.y, building.width, building.height);
    drawPixelRect(building.x, building.y, building.width, building.height, building.color, "#1f2024", 3);
    ctx.fillStyle = building.roof;
    ctx.fillRect(building.x - 4, building.y - 7, building.width + 8, 13);
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(building.x + 5, building.y + 5, building.width - 10, 4);

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    for (let x = building.x + 10; x < building.x + building.width - 10; x += 26) {
      ctx.fillRect(x, building.y + 18, 12, 12);
      ctx.fillStyle = "rgba(42,58,70,0.35)";
      ctx.fillRect(x + 6, building.y + 18, 2, 12);
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    }

    ctx.fillStyle = "#49362e";
    ctx.fillRect(building.x + building.width / 2 - 7, building.y + building.height - 18, 14, 18);
  });
}

function drawWall(building) {
  drawPixelRect(building.x, building.y, building.width, building.height, building.color || "#c28d54", "#573921", 3);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  if (building.width >= building.height) {
    for (let x = building.x + 12; x < building.x + building.width - 10; x += 34) {
      ctx.fillRect(x, building.y + 6, 18, Math.max(4, building.height - 12));
    }
  } else {
    for (let y = building.y + 12; y < building.y + building.height - 10; y += 34) {
      ctx.fillRect(building.x + 6, y, Math.max(4, building.width - 12), 18);
    }
  }
}


export function drawLandmarks(map) {
  map.landmarks.forEach((landmark) => {
    if (!isRectVisible(landmark, 140)) {
      return;
    }

    if (!["lake", "riverLabel", "plazaLabel", "longBridge"].includes(landmark.kind)) {
      drawPixelShadow(landmark.x, landmark.y, landmark.width, landmark.height);
    }

    if (landmark.kind === "lake") {
      drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y + landmark.height - 40, 120, "#18547f", 210);
    } else if (landmark.kind === "temple") {
      drawTemple(landmark);
    } else if (landmark.kind === "redBridge") {
      drawRedBridge(landmark);
    } else if (landmark.kind === "oldQuarter") {
      drawOldQuarter(landmark);
    } else if (landmark.kind === "plazaLabel") {
      drawPlazaLabel(landmark);
    } else if (landmark.kind === "mausoleum") {
      drawMausoleum(landmark);
    } else if (landmark.kind === "onePillar") {
      drawOnePillarPagoda(landmark);
    } else if (landmark.kind === "citadel") {
      drawCitadel(landmark);
    } else if (landmark.kind === "gate") {
      drawTempleGate(landmark);
    } else if (landmark.kind === "longBridge") {
      drawLongBridge(landmark);
    } else if (landmark.kind === "market") {
      drawMarket(landmark);
    } else if (landmark.kind === "cathedral") {
      drawCathedral(landmark);
    } else if (landmark.kind === "riverLabel") {
      drawNearbyLabel(landmark, landmark.name, landmark.x + 130, Math.max(80, getPlayerCenter().y - 80), 120, "#18547f", 150);
    } else {
      drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#5fa8d3", "#151515", 4);
      drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 10, 160, "#202025");
    }
  });
}

export function drawShops(map) {
  map.shops.forEach((shop) => {
    if (!isRectVisible(shop, 100)) {
      return;
    }

    const food = foodCatalog[shop.foodId];
    const open = isShopOpen(shop);
    drawPixelShadow(shop.x, shop.y, shop.width, shop.height);
    drawPixelRect(shop.x, shop.y, shop.width, shop.height, open ? "#dc7234" : "#756b62", "#151515", 4);
    ctx.fillStyle = open ? "#fbf1c0" : "#b8afa2";
    ctx.fillRect(shop.x + 8, shop.y + 8, shop.width - 16, 16);

    for (let x = shop.x + 8; x < shop.x + shop.width - 8; x += 18) {
      ctx.fillStyle = (x / 18) % 2 === 0 ? "#e63b38" : "#fff3c4";
      ctx.fillRect(x, shop.y - 8, 18, 14);
    }

    if (open) {
      ctx.fillStyle = "#332018";
      ctx.fillRect(shop.x + 18, shop.y + 34, 18, 22);
      ctx.fillStyle = "#f6d27a";
      ctx.fillRect(shop.x + 44, shop.y + 35, 22, 12);
      ctx.fillStyle = "#ffe36e";
      ctx.fillRect(shop.x + shop.width - 36, shop.y + 34, 20, 12);
    } else {
      drawClosedShopShutter(shop);
    }
    ctx.fillStyle = "#151515";
    ctx.font = "700 10px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("ĂN", shop.x + shop.width / 2, shop.y + 20);
    drawNearbyLabel(shop, food.name, shop.x + shop.width / 2, shop.y - 16, 142, "#7d2a1d");
  });
}

export function drawVehicleShops(map) {
  (map.vehicleShops || []).forEach((shop) => {
    if (!isRectVisible(shop, 100)) {
      return;
    }

    const vehicle = vehicleCatalog[shop.vehicleId];
    const open = isShopOpen(shop);
    drawPixelShadow(shop.x, shop.y, shop.width, shop.height);
    drawPixelRect(shop.x, shop.y, shop.width, shop.height, "#e8edf0", "#151515", 4);

    ctx.fillStyle = "#1f2f3d";
    ctx.fillRect(shop.x + 8, shop.y + 8, shop.width - 16, 20);
    ctx.fillStyle = "#fff8d6";
    ctx.font = "700 13px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("VINFAST", shop.x + shop.width / 2, shop.y + 23);

    ctx.fillStyle = open ? "#8fc5d6" : "#69747a";
    ctx.fillRect(shop.x + 16, shop.y + 38, shop.width - 32, 32);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillRect(shop.x + 24, shop.y + 42, 36, 6);
    ctx.fillRect(shop.x + 74, shop.y + 42, 28, 6);

    ctx.fillStyle = "#3c464d";
    ctx.fillRect(shop.x + 16, shop.y + shop.height - 16, shop.width - 32, 10);
    if (open) {
      const previewed = drawFemaleBikeDealershipPreview(
        shop.x + shop.width - 38,
        shop.y + shop.height - 10
      );
      if (!previewed) {
        drawTinyVinFastScooter(shop.x + shop.width - 58, shop.y + shop.height - 44);
      }
    } else {
      drawClosedShopShutter(shop);
    }
    drawNearbyLabel(shop, vehicle ? vehicle.name : "Xe VinFast", shop.x + shop.width / 2, shop.y - 16, 150, "#1f2f3d");
  });
}

function drawTinyVinFastScooter(x, y) {
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 2, y + 24, 8, 8);
  ctx.fillRect(x + 30, y + 24, 8, 8);
  ctx.fillStyle = "#f7f7ef";
  ctx.fillRect(x + 8, y + 14, 25, 10);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(x + 14, y + 8, 18, 9);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 34, y + 16, 5, 4);
  ctx.fillStyle = "#151515";
  ctx.font = "700 7px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("VF", x + 21, y + 22);
}

export function drawExits(map) {
  map.exits.forEach((exit) => {
    if (!isRectVisible(exit, 100)) {
      return;
    }

    if (exit.kind === "churchEntrance" || exit.kind === "churchExit") {
      drawChurchDoorExit(exit);
      return;
    }

    drawPixelShadow(exit.x, exit.y, exit.width, exit.height);
    drawPixelRect(exit.x, exit.y, exit.width, exit.height, "#7650b8", "#151515", 4);
    ctx.fillStyle = "#fff8d6";

    if (exit.kind === "bus") {
      ctx.fillRect(exit.x + 15, exit.y + 14, exit.width - 30, 20);
      ctx.fillStyle = "#2a2550";
      ctx.fillRect(exit.x + 24, exit.y + 18, 14, 8);
      ctx.fillRect(exit.x + exit.width - 38, exit.y + 18, 14, 8);
      ctx.fillStyle = "#151515";
      ctx.fillRect(exit.x + 22, exit.y + 37, 10, 10);
      ctx.fillRect(exit.x + exit.width - 32, exit.y + 37, 10, 10);
      ctx.fillStyle = "#f2bd45";
      ctx.fillRect(exit.x + exit.width - 12, exit.y - 20, 6, 24);
      drawPixelRect(exit.x + exit.width - 27, exit.y - 35, 34, 18, "#f2bd45", "#151515", 2);
      ctx.fillStyle = "#151515";
      ctx.font = "700 10px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("XE", exit.x + exit.width - 10, exit.y - 22);
      drawNearbyLabel(exit, "BUÝT", exit.x + exit.width / 2, exit.y + exit.height + 16, 70, "#3b245f");
    } else {
      ctx.fillRect(exit.x + 18, exit.y + 12, exit.width - 36, 34);
      ctx.fillStyle = "#7650b8";
      ctx.fillRect(exit.x + 27, exit.y + 22, exit.width - 54, 14);
      drawNearbyLabel(exit, "LỐI", exit.x + exit.width / 2, exit.y + exit.height + 16, 70, "#3b245f");
    }
  });
}

function drawChurchDoorExit(exit) {
  ctx.strokeStyle = "#f2bd45";
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x + 3, exit.y + 3, exit.width - 6, exit.height - 6);
  ctx.fillStyle = "#fff8d6";
  ctx.fillRect(exit.x + exit.width / 2 - 3, exit.y + 8, 6, 6);
}

export function drawNpcs(map) {
  getActiveMapNpcs(map).forEach((npc) => {
    const phase = performance.now() / 420 + npc.id.length;
    const reaction = getNpcReactionVisual(npc);
    const renderPhase = reaction.pauseRoutine ? npc.id.length * 0.71 : phase;
    const visual = getNpcVisualPosition(npc, phase, reaction);
    const visualActivity = getNpcVisualActivity(npc, reaction);
    const visualFacing = reaction.facing || getNpcIdleFacing(npc, phase);
    const npcRect = { ...npc, x: visual.x - 46, y: visual.y - 8, width: 116, height: 58 };
    if (!isRectVisible(npcRect, 100)) {
      return;
    }

    if (isStreetLifeNpc(npc)) {
      const center = getPlayerCenter();
      const showSpeech = npc.activity === "xeOm" &&
        !hasActiveReactionBubble(npc.id) &&
        Math.hypot(center.x - visual.x, center.y - visual.y) <= (npc.bubbleRange || 155);
      drawStreetLifeNpc(
        npc,
        visual.x,
        visual.y,
        renderPhase,
        showSpeech,
        getContextualNpcSpeech(npc),
        reaction
      );
    } else if (npc.activity === "couple") {
      drawCoupleNpc(visual.x, visual.y, renderPhase);
    } else if (npc.activity === "danceGroup") {
      drawDanceGroupNpc(visual.x, visual.y, renderPhase);
    } else {
      drawPixelNpc(visual.x, visual.y, npc.color, {
        activity: visualActivity,
        phase: renderPhase,
        facing: visualFacing
      });
      drawNpcAreaAccessory(npc, visual.x, visual.y, renderPhase);
    }

    const lightX = npc.activity === "danceGroup" ? visual.x - 36 : npc.activity === "couple" ? visual.x - 20 : visual.x;
    const lightWidth = npc.activity === "danceGroup" ? 92 : npc.activity === "couple" ? 60 : 24;
    drawNpcLocalLight(map, lightX, visual.y, lightWidth);
    drawNpcRainGear(npc, visual.x, visual.y, phase);
    drawNpcReactionOverlay(npc, visual.x, visual.y);

    if (npc.showLabel !== false) {
      drawNearbyLabel(npcRect, npc.name, visual.x + 10, visual.y - 13, 132, "#233021");
    }
  });
}

function drawClosedShopShutter(shop) {
  const x = shop.x + 10;
  const y = shop.y + 31;
  const width = Math.max(26, shop.width - 20);
  const height = Math.max(22, shop.height - 39);
  ctx.fillStyle = "#5f6465";
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = "#858a88";
  for (let lineY = y + 5; lineY < y + height; lineY += 8) {
    ctx.fillRect(x + 3, lineY, width - 6, 2);
  }
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + width - 14, y + height - 11, 7, 7);
}

function getNpcVisualPosition(npc, phase, reaction) {
  const movementPhase = phase * (npc.movementSpeed || 1);
  const isStagedPedestrian = npc.densityRank !== undefined;
  const shouldWalk = !isStagedPedestrian || npc.visualBehavior === "slowWalk";
  if (!reaction.pauseRoutine && shouldWalk && (npc.activity === "jog" || npc.activity === "walk")) {
    const amplitude = npc.pathAmplitude || 24;
    return {
      x: npc.x + Math.round(Math.sin(movementPhase / 1.8) * amplitude) + reaction.offsetX,
      y: npc.y + Math.round(Math.cos(movementPhase / 2.4) * 4) + reaction.offsetY
    };
  }

  if (!reaction.pauseRoutine && (npc.activity === "danceGroup" || npc.activity === "exercise")) {
    return {
      x: npc.x + reaction.offsetX,
      y: npc.y + Math.round(Math.sin(phase) * 2) + reaction.offsetY
    };
  }

  return { x: npc.x + reaction.offsetX, y: npc.y + reaction.offsetY };
}

function getNpcVisualActivity(npc, reaction) {
  if (reaction.pauseRoutine) return "idle";
  if (npc.densityRank === undefined || npc.activity !== "walk") return npc.activity;
  if (npc.visualBehavior === "phone") return "phone";
  if (npc.visualBehavior === "lookAround") return "lookAround";
  if (npc.visualBehavior === "rest") return "rest";
  if (npc.visualBehavior === "wait") return "wait";
  return "walk";
}

function getNpcIdleFacing(npc, phase) {
  if (npc.densityRank === undefined || npc.visualBehavior === "slowWalk") return null;
  const cycle = Math.floor((phase + (npc.idlePhase || 0)) / 8) % 5;
  if (npc.visualBehavior === "phone") return cycle === 4 ? "left" : "down";
  if (cycle === 1) return "left";
  if (cycle === 3) return "right";
  return "down";
}

function drawCoupleNpc(x, y, phase) {
  drawPixelNpc(x - 18, y, "#f59ac0", { activity: "talk", phase });
  drawPixelNpc(x + 14, y, "#7bdff2", { activity: "talk", phase: phase + 1.2 });

  ctx.fillStyle = "#d8484f";
  ctx.fillRect(x + 8, y - 10, 4, 4);
  ctx.fillRect(x + 4, y - 14, 4, 4);
  ctx.fillRect(x + 12, y - 14, 4, 4);
}

function drawDanceGroupNpc(x, y, phase) {
  drawPixelNpc(x - 34, y + 2, "#f2bd45", { activity: "dance", phase });
  drawPixelNpc(x, y - 2, "#ff8fab", { activity: "dance", phase: phase + 0.9 });
  drawPixelNpc(x + 34, y + 2, "#8de097", { activity: "dance", phase: phase + 1.8 });
}

export function drawPixelNpc(x, y, color, options = {}) {
  const bounce = options.activity === "jog" ? Math.round(Math.sin(options.phase * 2) * 3) : 0;
  const armLift = options.activity === "dance" || options.activity === "exercise";
  const walk = options.activity === "jog" || options.activity === "walk";
  const legSwing = walk ? Math.round(Math.sin(options.phase * 2) * 3) : 0;
  const seated = options.activity === "seated";
  const idleCycle = Math.floor((options.phase || 0) / 8) % 6;
  const idleShift = !walk && !armLift && idleCycle === 3 ? 1 : 0;
  const scale = options.scale || 1.08;

  drawGroundShadow(x + 10, y + (seated ? 28 : 24), seated ? 29 : 34, seated ? 6 : 7);
  const anchorX = x + 10;
  const anchorY = y + 46;
  ctx.save();
  ctx.translate(anchorX, anchorY);
  ctx.scale(scale, scale);
  ctx.translate(-anchorX, -anchorY);

  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(x + 1 + idleShift, y + bounce, 18, 16);
  ctx.fillStyle = "#4a2c25";
  ctx.fillRect(x + 1 + idleShift, y + bounce, 18, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x - 2, y + 16 + bounce, 24, 18);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(x + 2, y + 18 + bounce, 20, 4);

  ctx.fillStyle = color;
  if (armLift) {
    const lift = options.activity === "exercise" ? 12 : 8 + Math.round(Math.sin(options.phase * 2) * 4);
    ctx.fillRect(x - 8, y + 10 + bounce - lift, 6, 22);
    ctx.fillRect(x + 22, y + 10 + bounce - lift, 6, 22);
  } else if (seated) {
    ctx.fillRect(x - 5, y + 19 + bounce, 6, 13);
    ctx.fillRect(x + 19, y + 19 + bounce, 6, 13);
  } else {
    ctx.fillRect(x - 7, y + 19 + bounce, 6, 16);
    ctx.fillRect(x + 21, y + 19 + bounce, 6, 16);
  }

  ctx.fillStyle = "#2b2b32";
  if (seated) {
    ctx.fillRect(x + 1, y + 32 + bounce, 10, 7);
    ctx.fillRect(x + 12, y + 32 + bounce, 10, 7);
    ctx.fillRect(x + 5, y + 38 + bounce, 7, 5);
    ctx.fillRect(x + 15, y + 38 + bounce, 7, 5);
  } else {
    ctx.fillRect(x + 2, y + 34 + bounce + legSwing, 7, 12);
    ctx.fillRect(x + 13, y + 34 + bounce - legSwing, 7, 12);
  }
  ctx.fillStyle = "#151515";
  if (options.facing === "left") {
    ctx.fillRect(x + 3, y + 6 + bounce, 3, 3);
  } else if (options.facing === "right") {
    ctx.fillRect(x + 14, y + 6 + bounce, 3, 3);
  } else if (options.facing !== "up") {
    ctx.fillRect(x + 4, y + 6 + bounce, 3, 3);
    ctx.fillRect(x + 13, y + 6 + bounce, 3, 3);
  }
  if (options.activity === "phone") {
    ctx.fillStyle = "#202b35";
    ctx.fillRect(x + 21, y + 20 + bounce, 5, 8);
    ctx.fillStyle = "#8fc7d2";
    ctx.fillRect(x + 22, y + 21 + bounce, 3, 3);
  } else if (options.activity === "talk" && idleCycle % 2 === 0) {
    ctx.fillStyle = color;
    ctx.fillRect(options.facing === "left" ? x - 8 : x + 22, y + 16 + bounce, 7, 5);
  }
  ctx.restore();
}

export function drawTemple(landmark) {
  drawPixelRect(landmark.x, landmark.y + 22, landmark.width, landmark.height - 22, "#d7a847", "#151515", 3);
  ctx.fillStyle = "#b73631";
  ctx.fillRect(landmark.x - 7, landmark.y + 12, landmark.width + 14, 14);
  ctx.fillStyle = "#f4c542";
  ctx.fillRect(landmark.x + 18, landmark.y + 36, landmark.width - 36, 20);
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 15, 125, "#6f2b26");
}

export function drawRedBridge(landmark) {
  drawPixelRect(landmark.x, landmark.y + 13, landmark.width, 14, "#d73c36", "#151515", 3);
  ctx.fillStyle = "#ff7b70";
  for (let x = landmark.x + 10; x < landmark.x + landmark.width - 10; x += 20) {
    ctx.fillRect(x, landmark.y + 4, 6, 34);
  }
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 13, 126, "#6f2b26");
}

export function drawOldQuarter(landmark) {
  ctx.strokeStyle = "#5a3d1e";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 10]);
  ctx.strokeRect(landmark.x, landmark.y, landmark.width, landmark.height);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(229, 199, 111, 0.16)";
  ctx.fillRect(landmark.x, landmark.y, landmark.width, landmark.height);
  const colors = ["#d94b3d", "#3d7fa5", "#7650b8", "#e9823a"];
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(landmark.x + 24 + i * 78, landmark.y + 20, 44, 22);
    ctx.fillStyle = "#fff2bd";
    ctx.fillRect(landmark.x + 30 + i * 78, landmark.y + 50, 28, 18);
  }
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 15, 112, "#5a3d1e", 180);
}

export function drawPlazaLabel(landmark) {
  ctx.fillStyle = "rgba(242, 232, 194, 0.22)";
  for (let y = landmark.y + 28; y < landmark.y + landmark.height - 20; y += 46) {
    ctx.fillRect(landmark.x + 28, y, landmark.width - 56, 3);
  }
  ctx.fillStyle = "#6f9357";
  ctx.fillRect(landmark.x + 40, landmark.y + 198, landmark.width - 80, 34);
  ctx.fillRect(landmark.x + 40, landmark.y + 310, landmark.width - 80, 30);
  ctx.fillStyle = "#a8bc76";
  for (let x = landmark.x + 56; x < landmark.x + landmark.width - 48; x += 48) {
    ctx.fillRect(x, landmark.y + 206, 28, 4);
    ctx.fillRect(x, landmark.y + 318, 28, 4);
  }
  ctx.strokeStyle = "#fff8d6";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(landmark.x, landmark.y, landmark.width, landmark.height);
  ctx.setLineDash([]);
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y + 18, 190, "#705d2c", 190);
}

export function drawMausoleum(landmark) {
  const x = landmark.x;
  const y = landmark.y;
  const w = landmark.width;
  const h = landmark.height;
  ctx.fillStyle = "#8f9695";
  ctx.fillRect(x - 34, y + h - 10, w + 68, 10);
  ctx.fillStyle = "#b9bfbb";
  ctx.fillRect(x - 24, y + h - 20, w + 48, 10);
  drawPixelRect(x, y + 22, w, h - 42, "#cfd4d0", "#151515", 4);
  ctx.fillStyle = "#747b83";
  ctx.fillRect(x - 16, y + 10, w + 32, 18);
  ctx.fillStyle = "#9da4a1";
  ctx.fillRect(x + 34, y + 31, w - 68, 14);
  for (let columnX = x + 34; columnX < x + w - 26; columnX += 42) {
    ctx.fillStyle = "#f1f0e5";
    ctx.fillRect(columnX, y + 46, 13, h - 78);
    ctx.fillStyle = "#adb5b1";
    ctx.fillRect(columnX + 9, y + 46, 4, h - 78);
  }
  ctx.fillStyle = "#3e4447";
  ctx.fillRect(x + w / 2 - 46, y + h - 62, 92, 42);
  ctx.fillStyle = "#d7d9d2";
  ctx.font = "700 10px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("HỒ CHÍ MINH", x + w / 2, y + 41);
  ctx.fillStyle = "#b02f2f";
  ctx.fillRect(x + w / 2 - 12, y, 24, 18);
  drawNearbyLabel(landmark, landmark.name, x + w / 2, y - 16, 110, "#43484e");
}

export function drawOnePillarPagoda(landmark) {
  ctx.fillStyle = "#2f89c8";
  ctx.fillRect(landmark.x + 8, landmark.y + 50, landmark.width - 16, 28);
  ctx.fillStyle = "#6b4d32";
  ctx.fillRect(landmark.x + landmark.width / 2 - 6, landmark.y + 38, 12, 42);
  ctx.fillStyle = "#d33b35";
  ctx.fillRect(landmark.x + 24, landmark.y + 24, landmark.width - 48, 28);
  ctx.fillStyle = "#f4c542";
  ctx.fillRect(landmark.x + 14, landmark.y + 18, landmark.width - 28, 10);
  ctx.fillStyle = "#f6adc6";
  ctx.fillRect(landmark.x + 34, landmark.y + 4, 26, 14);
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 14, 136, "#663338");
}

export function drawCitadel(landmark) {
  drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#c78c45", "#151515", 4);
  ctx.fillStyle = "#8b3f2f";
  ctx.fillRect(landmark.x - 5, landmark.y - 9, landmark.width + 10, 13);
  ctx.fillStyle = "#422c24";
  ctx.fillRect(landmark.x + landmark.width / 2 - 22, landmark.y + 34, 44, 48);
  ctx.fillStyle = "#f1cf68";
  for (let x = landmark.x + 16; x < landmark.x + landmark.width - 20; x += 34) {
    ctx.fillRect(x, landmark.y + 18, 16, 12);
  }
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 16, 190, "#6a351f");
}

export function drawTempleGate(landmark) {
  if (landmark.width > 360) {
    drawVanMieuComplex(landmark);
    return;
  }

  drawPixelRect(landmark.x, landmark.y, landmark.width, landmark.height, "#d7b465", "#151515", 4);
  ctx.fillStyle = "#9f3e35";
  ctx.fillRect(landmark.x - 8, landmark.y - 10, landmark.width + 16, 16);
  ctx.fillStyle = "#61402a";
  ctx.fillRect(landmark.x + 18, landmark.y + 25, 28, 49);
  ctx.fillRect(landmark.x + landmark.width - 46, landmark.y + 25, 28, 49);
  ctx.fillRect(landmark.x + landmark.width / 2 - 20, landmark.y + 18, 40, 56);
  ctx.fillStyle = "#2f7d4c";
  ctx.fillRect(landmark.x + 62, landmark.y + 28, 20, 20);
  ctx.fillRect(landmark.x + landmark.width - 82, landmark.y + 28, 20, 20);
  drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 17, 205, "#6a351f", 180);
}

function drawVanMieuComplex(landmark) {
  const x = landmark.x;
  const y = landmark.y;
  const w = landmark.width;
  const h = landmark.height;
  ctx.strokeStyle = "#6a351f";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "rgba(185, 123, 76, 0.20)";
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);

  ctx.fillStyle = "rgba(230, 193, 130, 0.34)";
  ctx.fillRect(x + w / 2 - 72, y + 22, 144, h - 44);
  ctx.fillStyle = "rgba(113, 66, 38, 0.25)";
  for (let pathY = y + 36; pathY < y + h - 24; pathY += 34) {
    ctx.fillRect(x + w / 2 - 66, pathY, 132, 3);
  }

  ctx.strokeStyle = "#9a5a39";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 34, y + 24, w - 68, 130);
  ctx.strokeRect(x + 34, y + 176, w - 68, 142);
  ctx.strokeRect(x + 34, y + 340, w - 68, h - 374);

  const gateY = y + 42;
  drawPixelRect(x + w / 2 - 120, gateY, 240, 96, "#d7b465", "#151515", 4);
  ctx.fillStyle = "#9f3e35";
  ctx.fillRect(x + w / 2 - 134, gateY - 16, 268, 22);
  ctx.fillStyle = "#61402a";
  ctx.fillRect(x + w / 2 - 72, gateY + 34, 44, 62);
  ctx.fillRect(x + w / 2 + 28, gateY + 34, 44, 62);

  ctx.fillStyle = "#9f3e35";
  ctx.fillRect(x + w / 2 - 112, y + 282, 224, 24);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + w / 2 - 124, y + 270, 248, 14);
  ctx.fillStyle = "#61402a";
  ctx.fillRect(x + w / 2 - 56, y + 286, 34, 34);
  ctx.fillRect(x + w / 2 + 22, y + 286, 34, 34);

  ctx.fillStyle = "#8b6440";
  for (let steleX = x + 150; steleX < x + w - 120; steleX += 110) {
    ctx.fillRect(steleX, y + 376, 40, 50);
    ctx.fillStyle = "#d8d0a8";
    ctx.fillRect(steleX + 8, y + 384, 24, 28);
    ctx.fillStyle = "#8b6440";
  }

  drawNearbyLabel(landmark, landmark.name, x + w / 2, y - 17, 205, "#6a351f", 190);
}

export function drawLongBridge(landmark) {
  const x = landmark.x;
  const y = landmark.y;
  const w = landmark.width;
  ctx.fillStyle = "#343940";
  ctx.fillRect(x, y + 88, w, 54);
  ctx.fillStyle = "#262a2f";
  ctx.fillRect(x, y + 106, w, 18);
  ctx.fillStyle = "#b7a27a";
  const sleeperStart = Math.max(x + 8, x + Math.floor((camera.x - x) / 28) * 28);
  const sleeperEnd = Math.min(x + w, camera.x + camera.width + 80);
  for (let sleeperX = sleeperStart; sleeperX < sleeperEnd; sleeperX += 28) {
    ctx.fillRect(sleeperX, y + 102, 16, 26);
  }
  ctx.fillStyle = "#5b6066";
  ctx.fillRect(x, y + 105, w, 4);
  ctx.fillRect(x, y + 122, w, 4);
  const visibleStart = Math.max(x + 8, x + Math.floor((camera.x - x) / 48) * 48);
  const visibleEnd = Math.min(x + w - 24, camera.x + camera.width + 100);
  ctx.fillStyle = "#2b2b32";
  for (let lampX = visibleStart; lampX < visibleEnd; lampX += 144) {
    ctx.fillRect(lampX + 18, y + 76, 4, 26);
    ctx.fillStyle = "#f2d86b";
    ctx.fillRect(lampX + 14, y + 74, 12, 6);
    ctx.fillStyle = "#2b2b32";
  }
  drawNearbyLabel(landmark, landmark.name, x + w / 2, y - 12, 155, "#6f2b26", 180);
}

export function drawMarket(landmark) {
  drawPixelRect(landmark.x, landmark.y + 14, landmark.width, landmark.height - 14, "#f0c46b", "#151515", 4);
  ctx.fillStyle = "#c73c35";
  ctx.fillRect(landmark.x - 8, landmark.y, landmark.width + 16, 22);
  ctx.fillStyle = "#fff1b0";
  for (let x = landmark.x + 20; x < landmark.x + landmark.width - 18; x += 42) {
    ctx.fillRect(x, landmark.y + 42, 24, 18);
  }
  ctx.fillStyle = "#402c25";
  ctx.fillRect(landmark.x + landmark.width / 2 - 20, landmark.y + 62, 40, 44);
  if (landmark.name) {
    drawNearbyLabel(landmark, landmark.name, landmark.x + landmark.width / 2, landmark.y - 16, 150, "#6f2b26");
  }
}

export function drawCathedral(landmark) {
  const x = landmark.x;
  const y = landmark.y;
  const w = landmark.width;
  const h = landmark.height;

  ctx.fillStyle = "#b6aa94";
  ctx.fillRect(x - 30, y + h + 2, w + 60, 48);
  ctx.fillStyle = "#d1c4a9";
  for (let step = 0; step < 3; step += 1) {
    ctx.fillRect(x + 36 - step * 12, y + h - 4 + step * 7, w - 72 + step * 24, 7);
  }
  ctx.fillStyle = "rgba(83,72,61,0.24)";
  for (let tileX = x - 18; tileX < x + w + 18; tileX += 26) {
    ctx.fillRect(tileX, y + h + 28, 18, 3);
  }

  drawPixelRect(x + 42, y + 34, w - 84, h - 36, "#b9b1a2", "#151515", 4);
  drawPixelRect(x + 8, y + 22, 66, h - 22, "#aaa394", "#151515", 4);
  drawPixelRect(x + w - 74, y + 22, 66, h - 22, "#aaa394", "#151515", 4);

  ctx.fillStyle = "#5d5b56";
  ctx.fillRect(x + 2, y + 10, 78, 20);
  ctx.fillRect(x + w - 80, y + 10, 78, 20);
  ctx.fillStyle = "#3e3d3a";
  ctx.fillRect(x + 18, y, 30, 14);
  ctx.fillRect(x + w - 48, y, 30, 14);
  ctx.fillRect(x + 28, y - 12, 10, 14);
  ctx.fillRect(x + w - 38, y - 12, 10, 14);

  ctx.fillStyle = "#242321";
  ctx.fillRect(x + 25, y + 35, 28, 18);
  ctx.fillRect(x + w - 53, y + 35, 28, 18);
  ctx.fillStyle = "#d6b96b";
  ctx.fillRect(x + 33, y + 39, 12, 10);
  ctx.fillRect(x + w - 45, y + 39, 12, 10);

  drawArchDoor(x + w / 2 - 25, y + h - 68, 50, 68);
  drawArchDoor(x + 20, y + h - 56, 32, 56);
  drawArchDoor(x + w - 52, y + h - 56, 32, 56);

  drawArchWindow(x + 28, y + 70);
  drawArchWindow(x + w - 48, y + 70);
  drawArchWindow(x + w / 2 - 9, y + 58);

  ctx.fillStyle = "#ddd3bd";
  ctx.fillRect(x + 78, y + 42, w - 156, 8);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + w / 2 - 3, y + 30, 6, 18);
  ctx.fillRect(x + w / 2 - 10, y + 36, 20, 5);

  drawNearbyLabel(landmark, landmark.name, x + w / 2, y - 16, 176, "#4e4b47", 190);
}

function drawArchDoor(x, y, width, height) {
  ctx.fillStyle = "#151515";
  ctx.fillRect(x, y + 10, width, height - 10);
  ctx.fillRect(x + 5, y + 5, width - 10, 8);
  ctx.fillRect(x + 11, y, width - 22, 7);
  ctx.fillStyle = "#4b3d35";
  ctx.fillRect(x + 4, y + 13, width - 8, height - 13);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(x + width / 2 - 2, y + 15, 4, height - 15);
}

function drawArchWindow(x, y) {
  ctx.fillStyle = "#151515";
  ctx.fillRect(x - 2, y + 8, 22, 30);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(x, y + 10, 18, 28);
  ctx.fillStyle = "#d6edf5";
  ctx.fillRect(x + 4, y + 14, 4, 8);
  ctx.fillRect(x + 10, y + 14, 4, 8);
}
