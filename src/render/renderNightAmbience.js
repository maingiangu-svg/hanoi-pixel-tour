import { isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { isGenericStorefrontOpen, isShopOpen } from "../systems/worldSchedule.js";
import { getNightStrength } from "./renderLighting.js";

const EMPTY_LIST = Object.freeze([]);
const NIGHT_DECOR_TYPES = new Set(["teaCorner", "streetVendor", "stall", "sign", "streetSign"]);
const STOREFRONT_TYPES = new Set(["tubeHouse", "cafeFront"]);

export function drawNightAmbientAccents(map) {
  const strength = getNightStrength();
  if (strength <= 0.08 || map.kind === "churchInterior") return;

  const tick = Math.floor(performance.now() / 720);
  drawShopActivity(map.shops || EMPTY_LIST, strength, tick);
  drawShopActivity(map.vehicleShops || EMPTY_LIST, strength * 0.72, tick);
  drawStorefrontActivity(map.buildings || EMPTY_LIST, strength, tick);
  drawDecorActivity(map.decorations || EMPTY_LIST, strength, tick);
}

function drawShopActivity(shops, strength, tick) {
  for (let index = 0; index < shops.length; index += 1) {
    const shop = shops[index];
    if (!isShopOpen(shop) || !isRectVisible({ x: shop.x - 24, y: shop.y, width: shop.width + 48, height: shop.height + 90 }, 70)) continue;
    drawWarmPavementPool(shop.x + shop.width / 2, shop.y + shop.height + 15, Math.min(128, shop.width - 16), strength);
    drawPavementGlints(shop.x + shop.width / 2, shop.y + shop.height + 26, index + tick, strength);
  }
}

function drawStorefrontActivity(buildings, strength, tick) {
  if (!isGenericStorefrontOpen()) return;
  for (let index = 0; index < buildings.length; index += 1) {
    const building = buildings[index];
    if (!STOREFRONT_TYPES.has(building.kind)) continue;
    if (stableHash(building.x, building.y) % 4 === 1) continue;
    if (!isRectVisible({ x: building.x - 12, y: building.y, width: building.width + 24, height: building.height + 66 }, 50)) continue;

    const seed = stableHash(building.x + 31, building.y + tick);
    const pulse = seed % 13 === 0 ? 0.42 : 1;
    const width = Math.max(26, Math.min(74, building.width - 24));
    drawWarmPavementPool(building.x + building.width / 2, building.y + building.height + 8, width, strength * 0.56 * pulse);
    if (seed % 5 === 0) {
      ctx.fillStyle = `rgba(224, 76, 52, ${0.08 + strength * 0.1})`;
      ctx.fillRect(building.x + 13, building.y + building.height - 32, width - 8, 3);
    }
  }
}

function drawDecorActivity(decorations, strength, tick) {
  for (let index = 0; index < decorations.length; index += 1) {
    const item = decorations[index];
    if (!NIGHT_DECOR_TYPES.has(item.type)) continue;
    if (!isRectVisible({ x: item.x - 40, y: item.y - 20, width: 120, height: 100 }, 60)) continue;
    const seed = stableHash(item.x, item.y + tick);
    if (seed % 17 === 0) continue;
    const width = item.type === "teaCorner" || item.type === "streetVendor" ? 76 : 46;
    drawWarmPavementPool(item.x + width / 3, item.y + 43, width, strength * 0.66);
    if (seed % 4 === 0) drawPavementGlints(item.x + width / 3, item.y + 50, seed, strength * 0.7);
  }
}

function drawWarmPavementPool(centerX, y, width, strength) {
  const outerWidth = Math.round(width);
  ctx.fillStyle = `rgba(255, 190, 91, ${0.025 + strength * 0.035})`;
  ctx.fillRect(Math.round(centerX - outerWidth / 2), Math.round(y), outerWidth, 9);
  ctx.fillStyle = `rgba(255, 217, 128, ${0.04 + strength * 0.055})`;
  ctx.fillRect(Math.round(centerX - outerWidth * 0.34), Math.round(y - 5), Math.round(outerWidth * 0.68), 9);
  ctx.fillStyle = `rgba(255, 236, 171, ${0.045 + strength * 0.06})`;
  ctx.fillRect(Math.round(centerX - outerWidth * 0.2), Math.round(y - 9), Math.round(outerWidth * 0.4), 6);
}

function drawPavementGlints(centerX, y, seed, strength) {
  const drift = seed % 7;
  ctx.fillStyle = `rgba(255, 224, 146, ${0.12 + strength * 0.14})`;
  ctx.fillRect(Math.round(centerX - 24 + drift), Math.round(y), 9, 2);
  ctx.fillRect(Math.round(centerX + 12 - drift), Math.round(y + 5), 6, 2);
  ctx.fillStyle = `rgba(218, 79, 54, ${0.08 + strength * 0.09})`;
  ctx.fillRect(Math.round(centerX - 3), Math.round(y + 10), 4, 3);
}

function stableHash(x, y) {
  let value = Math.imul(Math.round(x) + 17, 374761393) ^ Math.imul(Math.round(y) - 23, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
