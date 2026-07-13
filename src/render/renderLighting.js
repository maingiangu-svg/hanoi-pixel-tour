import { camera } from "../camera.js";
import { canvas, ctx, state } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { isGenericStorefrontOpen, isShopOpen } from "../systems/worldSchedule.js";
import { getWeatherLightBoost } from "../systems/weather.js";

const MINUTES_PER_HOUR = 60;
const EMPTY_LIST = Object.freeze([]);

export function drawTimeOfDayTint(map) {
  const hour = getHourOfDay();
  const nightStrength = getNightStrength(state.gameTime);

  if (map.kind === "churchInterior") {
    ctx.fillStyle = nightStrength > 0
      ? `rgba(45, 27, 34, ${0.08 + nightStrength * 0.12})`
      : "rgba(255, 196, 126, 0.055)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  if (nightStrength > 0) {
    ctx.fillStyle = `rgba(13, 22, 43, ${0.12 + nightStrength * 0.22})`;
  } else if (hour < 10) {
    ctx.fillStyle = "rgba(174, 214, 235, 0.04)";
  } else if (hour >= 15.5) {
    ctx.fillStyle = "rgba(246, 188, 104, 0.045)";
  } else {
    ctx.fillStyle = "rgba(255, 226, 171, 0.02)";
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawWorldLightAccents(map) {
  const nightStrength = getNightStrength(state.gameTime);
  if (map.kind === "churchInterior") {
    drawChurchWarmLight(map, 0.48 + nightStrength * 0.52);
    return;
  }

  const weatherLightBoost = getWeatherLightBoost();
  if (nightStrength <= 0.04 && weatherLightBoost <= 0.04) {
    return;
  }

  const strength = Math.min(1, Math.max(0.24 + weatherLightBoost, 0.35 + nightStrength * 0.65));
  drawStreetLights(map, strength);
  drawShopLights(map, strength);
  drawBuildingLights(map, strength);
  drawLandmarkLights(map, strength);
}

export function getNightStrength(gameTime = state.gameTime) {
  const hour = getMinuteOfDay(gameTime) / MINUTES_PER_HOUR;
  if (hour >= 20 || hour < 4.75) {
    return 1;
  }
  if (hour >= 18) {
    return 0.25 + ((hour - 18) / 2) * 0.75;
  }
  if (hour >= 17.5) {
    return ((hour - 17.5) / 0.5) * 0.25;
  }
  if (hour < 6.5) {
    return Math.max(0, 1 - (hour - 4.75) / 1.75);
  }
  return 0;
}

function drawStreetLights(map, strength) {
  const decorations = map.decorations || EMPTY_LIST;
  for (let index = 0; index < decorations.length; index += 1) {
    const decoration = decorations[index];
    if (decoration.type !== "lamp" || !isWorldRectVisible(decoration.x - 42, decoration.y - 10, 100, 80)) {
      continue;
    }
    drawLampLight(decoration.x, decoration.y, strength);
  }
}

function drawLampLight(x, y, strength) {
  ctx.fillStyle = `rgba(255, 220, 126, ${0.07 + strength * 0.09})`;
  ctx.fillRect(x - 18, y + 29, 52, 6);
  ctx.fillRect(x - 28, y + 35, 72, 11);
  ctx.fillRect(x - 18, y + 46, 52, 8);
  ctx.fillStyle = `rgba(255, 211, 112, ${0.035 + strength * 0.045})`;
  ctx.fillRect(x - 38, y + 54, 92, 8);
  ctx.fillStyle = `rgba(255, 239, 166, ${0.44 + strength * 0.36})`;
  ctx.fillRect(x + 3, y + 1, 11, 8);
  ctx.fillStyle = `rgba(255, 230, 139, ${0.08 + strength * 0.1})`;
  ctx.fillRect(x - 4, y + 10, 26, 13);
}

function drawShopLights(map, strength) {
  const shops = map.shops || EMPTY_LIST;
  for (let index = 0; index < shops.length; index += 1) {
    const shop = shops[index];
    if (isShopOpen(shop) && isWorldRectVisible(shop.x - 16, shop.y - 16, shop.width + 32, shop.height + 70)) {
      drawShopGlow(shop.x, shop.y, shop.width, shop.height, strength);
    }
  }

  const vehicleShops = map.vehicleShops || EMPTY_LIST;
  for (let index = 0; index < vehicleShops.length; index += 1) {
    const shop = vehicleShops[index];
    if (isShopOpen(shop) && isWorldRectVisible(shop.x - 16, shop.y - 16, shop.width + 32, shop.height + 70)) {
      drawShopGlow(shop.x, shop.y, shop.width, shop.height, strength * 0.85);
    }
  }
}

function drawShopGlow(x, y, width, height, strength) {
  ctx.fillStyle = `rgba(255, 223, 142, ${0.15 + strength * 0.18})`;
  ctx.fillRect(x + 12, y + 12, Math.max(18, width - 24), 15);
  ctx.fillStyle = `rgba(255, 205, 111, ${0.05 + strength * 0.07})`;
  ctx.fillRect(x + 18, y + height - 5, Math.max(16, width - 36), 10);
  ctx.fillRect(x + 28, y + height + 5, Math.max(12, width - 56), 9);
}

function drawBuildingLights(map, strength) {
  const buildings = map.buildings || EMPTY_LIST;
  for (let index = 0; index < buildings.length; index += 1) {
    const building = buildings[index];
    if (!isWorldRectVisible(building.x, building.y, building.width, building.height)) {
      continue;
    }
    if (building.kind === "tubeHouse") {
      drawTubeHouseWindows(building, strength);
    } else if (building.kind === "apartment" || building.kind === "collective") {
      drawApartmentWindows(building, strength);
    } else if (building.kind === "cafeFront" && isGenericStorefrontOpen()) {
      drawShopGlow(building.x, building.y, building.width, building.height, strength);
    }
  }
}

function drawTubeHouseWindows(building, strength) {
  const seed = getStableSeed(building.x, building.y);
  ctx.fillStyle = `rgba(255, 222, 139, ${0.16 + strength * 0.2})`;
  let row = 0;
  for (let y = building.y + 17; y < building.y + building.height - 38; y += 28) {
    if ((row + seed) % 3 !== 1) {
      ctx.fillRect(building.x + 13, y, 11, 8);
    }
    if ((row + seed) % 2 === 0 && building.width > 48) {
      ctx.fillRect(building.x + building.width - 24, y, 11, 8);
    }
    row += 1;
  }
  ctx.fillStyle = `rgba(255, 211, 120, ${0.08 + strength * 0.11})`;
  ctx.fillRect(building.x + 10, building.y + building.height - 40, Math.max(16, building.width - 20), 12);
}

function drawApartmentWindows(building, strength) {
  const seed = getStableSeed(building.x, building.y);
  ctx.fillStyle = `rgba(255, 224, 145, ${0.13 + strength * 0.17})`;
  let row = 0;
  for (let y = building.y + 21; y < building.y + building.height - 36; y += 30) {
    let column = 0;
    for (let x = building.x + 17; x < building.x + building.width - 15; x += 30) {
      if ((row + column + seed) % 3 === 0) {
        ctx.fillRect(x, y, 10, 8);
      }
      column += 1;
    }
    row += 1;
  }
}

function drawLandmarkLights(map, strength) {
  const landmarks = map.landmarks || EMPTY_LIST;
  for (let index = 0; index < landmarks.length; index += 1) {
    const landmark = landmarks[index];
    if (landmark.kind !== "cathedral" || !isWorldRectVisible(landmark.x - 60, landmark.y - 40, landmark.width + 120, landmark.height + 120)) {
      continue;
    }
    ctx.fillStyle = `rgba(255, 221, 143, ${0.18 + strength * 0.2})`;
    ctx.fillRect(landmark.x + 29, landmark.y + 39, 20, 13);
    ctx.fillRect(landmark.x + landmark.width - 49, landmark.y + 39, 20, 13);
    ctx.fillRect(landmark.x + landmark.width / 2 - 19, landmark.y + landmark.height - 53, 38, 46);
    ctx.fillStyle = `rgba(255, 207, 112, ${0.055 + strength * 0.075})`;
    ctx.fillRect(landmark.x + 52, landmark.y + landmark.height + 10, landmark.width - 104, 11);
    ctx.fillRect(landmark.x + 76, landmark.y + landmark.height + 21, landmark.width - 152, 9);
  }
}

function drawChurchWarmLight(map, strength) {
  const church = map.church;
  const altar = church.altar;
  if (isWorldRectVisible(altar.x - 90, altar.y - 30, altar.width + 180, altar.height + 190)) {
    ctx.fillStyle = `rgba(255, 207, 126, ${0.08 + strength * 0.08})`;
    ctx.fillRect(altar.x - 48, altar.y + 20, altar.width + 96, altar.height + 36);
    ctx.fillRect(altar.x + 18, altar.y + altar.height + 56, altar.width - 36, 18);
    ctx.fillStyle = `rgba(255, 239, 171, ${0.3 + strength * 0.3})`;
    ctx.fillRect(altar.x + 40, altar.y + 33, 9, 22);
    ctx.fillRect(altar.x + altar.width - 51, altar.y + 33, 9, 22);
  }

  for (let index = 0; index < church.windows.length; index += 1) {
    const window = church.windows[index];
    if (!isWorldRectVisible(window.x - 90, window.y - 12, 180, 80)) {
      continue;
    }
    const leftSide = window.x < map.width / 2;
    ctx.fillStyle = `rgba(244, 190, 106, ${0.045 + strength * 0.055})`;
    ctx.fillRect(leftSide ? window.x + 22 : window.x - 78, window.y + 12, 78, 32);
    ctx.fillStyle = `rgba(255, 226, 148, ${0.14 + strength * 0.16})`;
    ctx.fillRect(window.x + 2, window.y + 9, 18, 36);
  }
}

function getHourOfDay() {
  return getMinuteOfDay(state.gameTime) / MINUTES_PER_HOUR;
}

function getStableSeed(x, y) {
  return Math.abs(Math.floor(x / 10) + Math.floor(y / 10)) % 5;
}

function isWorldRectVisible(x, y, width, height, margin = 80) {
  return x + width >= camera.x - margin &&
    x <= camera.x + camera.width + margin &&
    y + height >= camera.y - margin &&
    y <= camera.y + camera.height + margin;
}
