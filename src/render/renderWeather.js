import { camera, isRectVisible } from "../camera.js";
import { WEATHER_PUDDLES } from "../data/weatherProfiles.js";
import { canvas, ctx, player, state } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { isShopOpen } from "../systems/worldSchedule.js";
import {
  getSurfaceWetness,
  getWeatherCloudiness,
  getWeatherIntensity,
  getWeatherLightBoost,
  isRaining
} from "../systems/weather.js";

const MAX_RAIN_PARTICLES = 220;
const EMPTY_LIST = Object.freeze([]);
const WETTABLE_KINDS = new Set(["road", "sidewalk", "plaza", "courtyard", "path", "paving", "brick", "bridge", "embankment"]);
const UMBRELLA_COLORS = Object.freeze(["#364b61", "#8e4f59", "#d29b45", "#3f7164"]);
const rainX = new Float32Array(MAX_RAIN_PARTICLES);
const rainY = new Float32Array(MAX_RAIN_PARTICLES);
const rainSpeed = new Float32Array(MAX_RAIN_PARTICLES);
const rainLength = new Float32Array(MAX_RAIN_PARTICLES);
const rainDrift = new Float32Array(MAX_RAIN_PARTICLES);
let particlesReady = false;
let lastRainTimestamp = 0;

export function drawWeatherAtmosphere(map) {
  if (isInterior(map)) {
    return;
  }

  const cloudiness = getWeatherCloudiness();
  const rainIntensity = getWeatherIntensity();
  if (cloudiness <= 0.01 && rainIntensity <= 0.01) {
    return;
  }

  const alpha = Math.min(0.19, cloudiness * 0.07 + rainIntensity * 0.1);
  ctx.fillStyle = `rgba(36, 47, 61, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (cloudiness > 0.45) {
    ctx.fillStyle = `rgba(194, 205, 211, ${0.018 + cloudiness * 0.018})`;
    const bandOffset = Math.floor(performance.now() / 1800) % 96;
    for (let x = -96 + bandOffset; x < canvas.width + 96; x += 192) {
      ctx.fillRect(x, 38, 104, 5);
      ctx.fillRect(x + 24, 43, 128, 4);
    }
  }
}

export function drawWetSurfaceEffects(map) {
  if (isInterior(map)) {
    return;
  }

  const wetness = getSurfaceWetness();
  if (wetness <= 0.025) {
    return;
  }

  const zones = map.walkZones || EMPTY_LIST;
  for (let index = 0; index < zones.length; index += 1) {
    const zone = zones[index];
    if (!isWettableKind(zone.kind) || !isRectVisible(zone, 70)) {
      continue;
    }
    const roadFactor = zone.kind === "road" || zone.kind === "bridge" ? 1 : 0.62;
    ctx.fillStyle = `rgba(19, 35, 49, ${wetness * 0.16 * roadFactor})`;
    ctx.fillRect(zone.x + 3, zone.y + 3, Math.max(0, zone.width - 6), Math.max(0, zone.height - 6));
    if (wetness > 0.4 && (zone.kind === "road" || zone.kind === "bridge")) {
      drawWetRoadSpecks(zone, wetness);
    }
  }

  drawPuddles(map, wetness);
}

export function drawWetReflections(map) {
  if (isInterior(map)) {
    return;
  }

  const wetness = getSurfaceWetness();
  if (wetness <= 0.12) {
    return;
  }

  const lightStrength = Math.max(getNightStrength(), getWeatherLightBoost());
  if (lightStrength <= 0.05) {
    return;
  }

  const lamps = map.decorations || EMPTY_LIST;
  for (let index = 0; index < lamps.length; index += 1) {
    const lamp = lamps[index];
    if (lamp.type !== "lamp" || !isWorldRectVisible(lamp.x - 30, lamp.y, 70, 110, 60)) {
      continue;
    }
    drawLightReflection(lamp.x + 8, lamp.y + 45, 18, 48, wetness * lightStrength, "255, 216, 122");
  }

  drawShopReflections(map.shops || EMPTY_LIST, wetness, lightStrength);
  drawShopReflections(map.vehicleShops || EMPTY_LIST, wetness, lightStrength);
}

function drawShopReflections(shops, wetness, lightStrength) {
  for (let index = 0; index < shops.length; index += 1) {
    const shop = shops[index];
    if (!isShopOpen(shop) || !isRectVisible(shop, 80)) {
      continue;
    }
    drawLightReflection(
      shop.x + shop.width / 2,
      shop.y + shop.height,
      Math.min(42, shop.width * 0.34),
      34,
      wetness * lightStrength * 0.82,
      "255, 197, 101"
    );
  }
}

export function drawRainOverlay(map) {
  if (isInterior(map)) {
    lastRainTimestamp = performance.now();
    return;
  }

  const intensity = getWeatherIntensity();
  if (intensity <= 0.04) {
    lastRainTimestamp = performance.now();
    return;
  }

  ensureRainParticles();
  const now = performance.now();
  const delta = lastRainTimestamp ? Math.min(0.05, Math.max(0, (now - lastRainTimestamp) / 1000)) : 0;
  lastRainTimestamp = now;
  const activeCount = Math.min(MAX_RAIN_PARTICLES, Math.round(22 + intensity * 188));
  const wind = 22 + intensity * 64;

  ctx.fillStyle = intensity > 0.72 ? "rgba(210, 230, 239, 0.7)" : "rgba(205, 225, 236, 0.58)";
  for (let index = 0; index < activeCount; index += 1) {
    rainY[index] += rainSpeed[index] * (0.72 + intensity * 0.54) * delta;
    rainX[index] -= (wind + rainDrift[index]) * delta;
    if (rainY[index] > canvas.height + 24 || rainX[index] < -30) {
      rainY[index] = -rainLength[index] - ((index * 29) % 90);
      rainX[index] = (index * 83 + Math.floor(now / 37)) % (canvas.width + 120);
    }

    const x = Math.round(rainX[index]);
    const y = Math.round(rainY[index]);
    const length = Math.max(3, Math.round(rainLength[index] * (0.55 + intensity * 0.75)));
    ctx.fillRect(x, y, intensity > 0.75 ? 2 : 1, length);
    if (intensity > 0.56) {
      ctx.fillRect(x - 2, y + length - 2, 2, 3);
    }
  }

  drawScreenSplashes(activeCount, intensity, now);
}

export function drawNpcRainGear(npc, x, y, phase) {
  if (!isRaining() || npc.activity === "teaSeller" || npc.activity === "xeOm") {
    return;
  }

  const intensity = getWeatherIntensity();
  const threshold = intensity >= 0.85 ? 0.94 : intensity >= 0.48 ? 0.76 : 0.4;
  if (stableFraction(npc.id) > threshold) {
    drawRaincoat(x, y, npc.color || "#547da1");
    return;
  }

  drawPixelUmbrella(
    x + 10,
    y - 2 + Math.round(Math.sin(phase) * 1),
    UMBRELLA_COLORS[Math.floor(stableFraction(`${npc.id}-umbrella`) * UMBRELLA_COLORS.length)]
  );
}

export function drawTeaStallWeatherCover(x, y) {
  if (!isRaining()) {
    return;
  }
  ctx.fillStyle = "#313943";
  ctx.fillRect(x - 32, y - 20, 86, 5);
  ctx.fillRect(x - 25, y - 25, 72, 5);
  ctx.fillStyle = "#7f8f96";
  ctx.fillRect(x - 30, y - 18, 4, 48);
  ctx.fillRect(x + 48, y - 18, 4, 48);
  ctx.fillStyle = "rgba(166, 201, 215, 0.45)";
  ctx.fillRect(x - 23, y - 14, 68, 3);
}

export function drawStreetNpcRainGear(npc, x, y) {
  if (!isRaining() || npc.activity !== "xeOm") {
    return;
  }
  drawRaincoat(x + 7, y + 3, getWeatherIntensity() > 0.7 ? "#d9b53f" : "#4a8195");
}

export function drawVehicleRainEffects(x, y, direction, moving = true) {
  const wetness = getSurfaceWetness();
  const intensity = getWeatherIntensity();
  if (wetness > 0.16) {
    const horizontal = direction === "left" || direction === "right";
    ctx.fillStyle = `rgba(156, 190, 204, ${0.08 + wetness * 0.1})`;
    if (horizontal) {
      ctx.fillRect(x - 22, y + 20, 44, 4);
      ctx.fillRect(x - 12, y + 26, 24, 3);
    } else {
      ctx.fillRect(x - 10, y + 23, 20, 5);
      ctx.fillRect(x - 5, y + 30, 10, 4);
    }
  }

  if (!moving || intensity <= 0.12) {
    return;
  }
  const pulse = Math.floor(performance.now() / 90) % 3;
  ctx.fillStyle = `rgba(194, 222, 233, ${0.34 + intensity * 0.28})`;
  ctx.fillRect(x - 20 - pulse * 2, y + 25, 6, 2);
  ctx.fillRect(x + 14 + pulse * 2, y + 25, 6, 2);
  if (intensity > 0.55) {
    ctx.fillRect(x - 24, y + 20 - pulse, 2, 5);
    ctx.fillRect(x + 22, y + 20 - pulse, 2, 5);
  }
}

export function drawPlayerWeatherEffects(riding) {
  if (!riding) {
    return;
  }
  drawVehicleRainEffects(player.x + player.width / 2, player.y + player.height / 2, player.facing, player.moving);
}

function drawPuddles(map, wetness) {
  const puddles = WEATHER_PUDDLES[map.id] || EMPTY_LIST;
  const visibility = Math.max(0, (wetness - 0.16) / 0.84);
  if (visibility <= 0) {
    return;
  }

  const raining = isRaining();
  const tick = Math.floor(performance.now() / 180);
  for (let index = 0; index < puddles.length; index += 1) {
    const puddle = puddles[index];
    if (!isRectVisible(puddle, 60)) {
      continue;
    }
    const inset = 3 + (index % 2) * 2;
    ctx.fillStyle = `rgba(42, 91, 113, ${0.16 + visibility * 0.28})`;
    ctx.fillRect(puddle.x + inset, puddle.y, puddle.width - inset * 2, puddle.height);
    ctx.fillRect(puddle.x, puddle.y + 4, puddle.width, Math.max(3, puddle.height - 8));
    ctx.fillStyle = `rgba(181, 213, 221, ${0.12 + visibility * 0.2})`;
    ctx.fillRect(puddle.x + 8, puddle.y + 4, Math.max(8, puddle.width * 0.42), 2);
    if (raining && (tick + index) % 4 === 0) {
      const rippleX = puddle.x + 10 + ((tick * 7 + index * 13) % Math.max(12, puddle.width - 22));
      ctx.fillRect(rippleX, puddle.y + puddle.height / 2, 8, 2);
      ctx.fillRect(rippleX + 2, puddle.y + puddle.height / 2 - 2, 4, 1);
    }
  }
}

function drawWetRoadSpecks(zone, wetness) {
  const left = Math.max(zone.x, camera.x - 20);
  const right = Math.min(zone.x + zone.width, camera.x + camera.width + 20);
  const top = Math.max(zone.y, camera.y - 20);
  const bottom = Math.min(zone.y + zone.height, camera.y + camera.height + 20);
  const startX = zone.x + Math.max(0, Math.ceil((left - zone.x) / 94)) * 94;
  const startY = zone.y + Math.max(0, Math.ceil((top - zone.y) / 68)) * 68;
  ctx.fillStyle = `rgba(151, 181, 192, ${wetness * 0.12})`;
  for (let y = startY; y < bottom; y += 68) {
    for (let x = startX; x < right; x += 94) {
      ctx.fillRect(Math.round(x + 30), Math.round(y + 22), 12, 2);
    }
  }
}

function drawLightReflection(centerX, topY, width, height, strength, rgb) {
  if (strength <= 0.02) {
    return;
  }
  const flicker = (Math.floor(performance.now() / 260) % 3) - 1;
  ctx.fillStyle = `rgba(${rgb}, ${Math.min(0.34, 0.08 + strength * 0.22)})`;
  ctx.fillRect(Math.round(centerX - width / 2), Math.round(topY), Math.round(width), 4);
  ctx.fillRect(Math.round(centerX - width * 0.34 + flicker), Math.round(topY + 7), Math.round(width * 0.68), 5);
  ctx.fillRect(Math.round(centerX - width * 0.22 - flicker), Math.round(topY + 16), Math.round(width * 0.44), 7);
  if (height > 30) {
    ctx.fillRect(Math.round(centerX - width * 0.12), Math.round(topY + 27), Math.round(width * 0.24), 8);
  }
}

function drawScreenSplashes(activeCount, intensity, now) {
  const count = Math.floor(activeCount / 18);
  ctx.fillStyle = `rgba(214, 234, 241, ${0.24 + intensity * 0.24})`;
  const tick = Math.floor(now / 95);
  for (let index = 0; index < count; index += 1) {
    const x = (index * 157 + tick * 23) % canvas.width;
    const y = 96 + ((index * 89 + tick * 17) % Math.max(120, canvas.height - 116));
    ctx.fillRect(x - 4, y, 4, 2);
    ctx.fillRect(x + 2, y, 4, 2);
    if (intensity > 0.7) {
      ctx.fillRect(x, y - 3, 2, 3);
    }
  }
}

function ensureRainParticles() {
  if (particlesReady) {
    return;
  }
  let seed = 0x1a2b3c4d;
  for (let index = 0; index < MAX_RAIN_PARTICLES; index += 1) {
    seed = nextSeed(seed);
    rainX[index] = (seed / 4294967296) * canvas.width;
    seed = nextSeed(seed);
    rainY[index] = (seed / 4294967296) * canvas.height;
    seed = nextSeed(seed);
    rainSpeed[index] = 290 + (seed / 4294967296) * 260;
    seed = nextSeed(seed);
    rainLength[index] = 5 + (seed / 4294967296) * 10;
    seed = nextSeed(seed);
    rainDrift[index] = (seed / 4294967296) * 38;
  }
  particlesReady = true;
}

function drawPixelUmbrella(centerX, topY, color) {
  ctx.fillStyle = "#171b22";
  ctx.fillRect(centerX - 18, topY - 5, 36, 5);
  ctx.fillRect(centerX - 13, topY - 10, 26, 5);
  ctx.fillRect(centerX - 6, topY - 14, 12, 4);
  ctx.fillStyle = color;
  ctx.fillRect(centerX - 15, topY - 4, 30, 4);
  ctx.fillRect(centerX - 10, topY - 8, 20, 4);
  ctx.fillRect(centerX - 4, topY - 11, 8, 3);
  ctx.fillStyle = "#272d34";
  ctx.fillRect(centerX, topY, 2, 28);
  ctx.fillRect(centerX, topY + 26, 7, 2);
}

function drawRaincoat(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y + 13, 28, 4);
  ctx.fillRect(x - 2, y + 17, 24, 16);
  ctx.fillStyle = "rgba(235, 245, 238, 0.28)";
  ctx.fillRect(x + 2, y + 18, 4, 12);
}

function isWettableKind(kind) {
  return WETTABLE_KINDS.has(kind);
}

function isInterior(map) {
  return map.kind === "churchInterior" || map.kind === "interior";
}

function isWorldRectVisible(x, y, width, height, margin = 80) {
  return x + width >= camera.x - margin &&
    x <= camera.x + camera.width + margin &&
    y + height >= camera.y - margin &&
    y <= camera.y + camera.height + margin;
}

function getNightStrength() {
  const hour = getMinuteOfDay(state.gameTime) / 60;
  if (hour >= 20 || hour < 4.75) return 1;
  if (hour >= 18) return 0.25 + ((hour - 18) / 2) * 0.75;
  if (hour >= 17.5) return ((hour - 17.5) / 0.5) * 0.25;
  if (hour < 6.5) return Math.max(0, 1 - (hour - 4.75) / 1.75);
  return 0;
}

function stableFraction(id) {
  let hash = 2166136261;
  const text = String(id || "weather");
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function nextSeed(seed) {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}
