import { camera } from "../camera.js";
import { canvas, ctx, state } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { isGenericStorefrontOpen, isShopOpen } from "../systems/worldSchedule.js";
import { getWeatherLightBoost } from "../systems/weather.js";
import { drawSkylineNightLights } from "./renderSkyline.js";

const MINUTES_PER_HOUR = 60;
const EMPTY_LIST = Object.freeze([]);
const LIGHT_DECORATION_TYPES = new Set(["streetSign", "sign", "banner", "stall", "teaCorner", "streetVendor"]);

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
    ctx.fillStyle = `rgba(11, 20, 42, ${0.13 + nightStrength * 0.23})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(34, 47, 74, ${nightStrength * 0.045})`;
    ctx.fillRect(0, 0, canvas.width, Math.round(canvas.height * 0.42));
    ctx.fillStyle = `rgba(67, 35, 37, ${nightStrength * 0.025})`;
    ctx.fillRect(0, Math.round(canvas.height * 0.64), canvas.width, Math.round(canvas.height * 0.36));
    return;
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
  drawSkylineLights(map, strength);
  drawStreetLights(map, strength);
  drawShopLights(map, strength);
  drawBuildingLights(map, strength);
  drawDecorationLights(map, strength);
  drawLandmarkLights(map, strength);
  drawLakeLightReflections(map, strength);
}

function drawSkylineLights(map, strength) {
  const decorations = map.decorations || EMPTY_LIST;
  for (let index = 0; index < decorations.length; index += 1) {
    const decoration = decorations[index];
    if (decoration.type !== "skyline" || !isWorldRectVisible(decoration.x, decoration.y, decoration.width || 520, decoration.height || 160)) continue;
    drawSkylineNightLights(decoration, strength);
  }
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
  ctx.fillStyle = `rgba(88, 132, 167, ${0.025 + strength * 0.035})`;
  ctx.fillRect(x - 46, y + 52, 108, 9);
  ctx.fillRect(x - 34, y + 61, 84, 5);
  ctx.fillStyle = `rgba(255, 220, 126, ${0.075 + strength * 0.1})`;
  ctx.fillRect(x - 18, y + 29, 52, 6);
  ctx.fillRect(x - 30, y + 35, 76, 11);
  ctx.fillRect(x - 20, y + 46, 56, 8);
  ctx.fillStyle = `rgba(255, 211, 112, ${0.04 + strength * 0.05})`;
  ctx.fillRect(x - 39, y + 54, 94, 8);
  ctx.fillStyle = `rgba(255, 239, 166, ${0.44 + strength * 0.36})`;
  ctx.fillRect(x + 3, y + 1, 11, 8);
  ctx.fillStyle = `rgba(255, 247, 196, ${0.24 + strength * 0.24})`;
  ctx.fillRect(x + 5, y - 2, 7, 3);
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
  ctx.fillStyle = `rgba(255, 223, 142, ${0.17 + strength * 0.2})`;
  ctx.fillRect(x + 12, y + 12, Math.max(18, width - 24), 15);
  ctx.fillStyle = `rgba(229, 86, 54, ${0.08 + strength * 0.1})`;
  ctx.fillRect(x + 9, y + 3, Math.max(16, width - 18), 5);
  ctx.fillStyle = `rgba(255, 205, 111, ${0.05 + strength * 0.07})`;
  ctx.fillRect(x + 18, y + height - 5, Math.max(16, width - 36), 10);
  ctx.fillRect(x + 28, y + height + 5, Math.max(12, width - 56), 9);
  ctx.fillStyle = `rgba(255, 229, 154, ${0.045 + strength * 0.06})`;
  ctx.fillRect(x + 38, y + height + 14, Math.max(8, width - 76), 6);
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
      if (isGenericStorefrontOpen() && getStableSeed(building.x, building.y) % 3 !== 1) drawTubeHouseStorefront(building, strength);
    } else if (building.kind === "apartment" || building.kind === "collective") {
      drawApartmentWindows(building, strength);
    } else if (building.kind === "cafeFront" && isGenericStorefrontOpen()) {
      drawShopGlow(building.x, building.y, building.width, building.height, strength);
    }
  }
}

function drawTubeHouseWindows(building, strength) {
  const seed = getStableSeed(building.x, building.y);
  let row = 0;
  for (let y = building.y + 17; y < building.y + building.height - 38; y += 28) {
    if ((row + seed) % 3 !== 1) {
      ctx.fillStyle = (row + seed) % 2 === 0
        ? `rgba(255, 222, 139, ${0.17 + strength * 0.22})`
        : `rgba(139, 194, 214, ${0.12 + strength * 0.16})`;
      ctx.fillRect(building.x + 13, y, 11, 8);
    }
    if ((row + seed) % 2 === 0 && building.width > 48) {
      ctx.fillStyle = `rgba(255, 216, 128, ${0.15 + strength * 0.2})`;
      ctx.fillRect(building.x + building.width - 24, y, 11, 8);
    }
    row += 1;
  }
  ctx.fillStyle = `rgba(255, 211, 120, ${0.08 + strength * 0.11})`;
  ctx.fillRect(building.x + 10, building.y + building.height - 40, Math.max(16, building.width - 20), 12);
}

function drawTubeHouseStorefront(building, strength) {
  const y = building.y + building.height - 28;
  const signSeed = getStableSeed(building.x + 31, building.y);
  const flicker = (Math.floor(performance.now() / 900) + signSeed) % 11 !== 0;
  if (!flicker) return;
  ctx.fillStyle = signSeed % 2 === 0
    ? `rgba(221, 70, 46, ${0.2 + strength * 0.28})`
    : `rgba(244, 143, 62, ${0.18 + strength * 0.25})`;
  ctx.fillRect(building.x + 9, y - 11, Math.max(16, building.width - 18), 7);
  ctx.fillStyle = `rgba(255, 218, 130, ${0.12 + strength * 0.17})`;
  ctx.fillRect(building.x + 13, y, Math.max(14, building.width - 26), 18);
  ctx.fillStyle = `rgba(255, 201, 101, ${0.035 + strength * 0.05})`;
  ctx.fillRect(building.x + 19, building.y + building.height + 2, Math.max(10, building.width - 38), 7);
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

function drawDecorationLights(map, strength) {
  const decorations = map.decorations || EMPTY_LIST;
  const tick = Math.floor(performance.now() / 1000);
  for (let index = 0; index < decorations.length; index += 1) {
    const item = decorations[index];
    if (!LIGHT_DECORATION_TYPES.has(item.type)) continue;
    if (!isWorldRectVisible(item.x - 24, item.y - 20, item.width || 110, item.height || 90)) continue;
    const seed = getStableSeed(item.x, item.y);
    if ((tick + seed) % 17 === 0) continue;
    if (item.type === "teaCorner") {
      ctx.fillStyle = `rgba(255, 197, 91, ${0.055 + strength * 0.075})`;
      ctx.fillRect(item.x - 12, item.y + 34, 86, 8);
      ctx.fillRect(item.x + 2, item.y + 42, 60, 5);
      ctx.fillStyle = `rgba(255, 229, 150, ${0.32 + strength * 0.32})`;
      ctx.fillRect(item.x + 28, item.y - 2, 7, 5);
      continue;
    }
    const width = item.type === "streetSign" ? 64 : item.type === "banner" ? 42 : item.type === "streetVendor" ? 70 : 30;
    const color = item.type === "streetSign" ? "93, 171, 210" : item.type === "sign" ? "255, 220, 102" : "235, 80, 52";
    ctx.fillStyle = `rgba(${color}, ${0.13 + strength * 0.16})`;
    ctx.fillRect(item.x - 3, item.y - 3, width + 6, 6);
    ctx.fillRect(item.x, item.y + 3, width, 13);
    ctx.fillStyle = `rgba(${color}, ${0.035 + strength * 0.045})`;
    ctx.fillRect(item.x - 9, item.y + 18, width + 18, 5);
  }
}

function drawLakeLightReflections(map, strength) {
  const waters = map.water || EMPTY_LIST;
  const decorations = map.decorations || EMPTY_LIST;
  const tick = Math.floor(performance.now() / 360);
  for (let index = 0; index < waters.length; index += 1) {
    const water = waters[index];
    if (water.kind !== "lake" || !isWorldRectVisible(water.x, water.y, water.width, water.height, 60)) continue;
    const left = Math.max(water.x + 24, camera.x - 20);
    const right = Math.min(water.x + water.width - 24, camera.x + camera.width + 20);
    const top = Math.max(water.y + 30, camera.y - 20);
    const bottom = Math.min(water.y + water.height - 30, camera.y + camera.height + 20);
    const firstColumn = water.x + 42 + Math.max(0, Math.floor((left - water.x - 42) / 96)) * 96;
    for (let x = firstColumn; x < right; x += 96) {
      const variant = Math.abs(Math.floor((x - water.x) / 96) + index * 3);
      const y = top + ((variant * 67 + tick * 3) % Math.max(48, bottom - top - 40));
      const rgb = variant % 4 === 0 ? "255, 203, 109" : variant % 4 === 1 ? "224, 91, 62" : "111, 196, 226";
      ctx.fillStyle = `rgba(${rgb}, ${0.05 + strength * 0.075})`;
      ctx.fillRect(x - 13, y, 28, 3);
      ctx.fillRect(x - 8 + (tick % 3) - 1, y + 8, 18, 3);
      ctx.fillRect(x - 4, y + 17, 9, 4);
    }

    for (let decorationIndex = 0; decorationIndex < decorations.length; decorationIndex += 1) {
      const lamp = decorations[decorationIndex];
      if (lamp.type !== "lamp" || lamp.y < water.y - 30 || lamp.y > water.y + water.height + 30) continue;
      if (lamp.x >= water.x - 150 && lamp.x <= water.x + 24) {
        drawLakeEdgeLampReflection(water.x + 10, lamp.y + 24, 1, strength, tick + decorationIndex);
      } else if (lamp.x >= water.x + water.width - 24 && lamp.x <= water.x + water.width + 150) {
        drawLakeEdgeLampReflection(water.x + water.width - 10, lamp.y + 24, -1, strength, tick + decorationIndex);
      }
    }
  }

  for (let index = 0; index < decorations.length; index += 1) {
    const item = decorations[index];
    if (item.type !== "turtleTower" || !isWorldRectVisible(item.x - 30, item.y, 150, 150)) continue;
    ctx.fillStyle = `rgba(255, 218, 130, ${0.11 + strength * 0.14})`;
    ctx.fillRect(item.x + 24, item.y + 60, 48, 4);
    ctx.fillRect(item.x + 31, item.y + 70, 34, 5);
    ctx.fillRect(item.x + 39, item.y + 81, 18, 6);
    ctx.fillStyle = `rgba(112, 199, 226, ${0.06 + strength * 0.07})`;
    ctx.fillRect(item.x + 15, item.y + 92, 66, 3);
  }
}

function drawLakeEdgeLampReflection(edgeX, centerY, direction, strength, tick) {
  const drift = (tick % 3) - 1;
  ctx.fillStyle = `rgba(255, 213, 119, ${0.1 + strength * 0.13})`;
  const firstX = direction > 0 ? edgeX : edgeX - 62;
  const secondX = direction > 0 ? edgeX + 12 + drift : edgeX - 52 + drift;
  const thirdX = direction > 0 ? edgeX + 25 - drift : edgeX - 42 - drift;
  ctx.fillRect(firstX, centerY, 62, 4);
  ctx.fillRect(secondX, centerY + 9, 40, 4);
  ctx.fillRect(thirdX, centerY + 19, 22, 5);
  ctx.fillStyle = `rgba(104, 190, 220, ${0.055 + strength * 0.07})`;
  ctx.fillRect(direction > 0 ? edgeX + 6 : edgeX - 70, centerY + 30, 70, 3);
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
