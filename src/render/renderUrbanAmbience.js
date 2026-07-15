import { camera, isRectVisible } from "../camera.js";
import { ctx } from "../state.js";

export function drawUrbanSurfaceDetails(map) {
  if (map.kind === "churchInterior") return;
  const zones = map.walkZones || [];
  for (let index = 0; index < zones.length; index += 1) {
    const zone = zones[index];
    if (!isRectVisible(zone, 40)) continue;
    if (zone.kind === "road" || zone.kind === "bridge") {
      drawRoadDetails(zone, index);
    } else if (zone.kind === "sidewalk" || zone.kind === "path") {
      drawPavementDetails(zone, index);
    } else if (zone.kind === "plaza" || zone.kind === "courtyard") {
      drawPublicSpaceDetails(zone, index);
    }
  }
}

function drawRoadDetails(zone, seed) {
  const horizontal = zone.width >= zone.height;
  const left = Math.max(zone.x + 10, Math.floor(camera.x - 20));
  const top = Math.max(zone.y + 10, Math.floor(camera.y - 20));
  const right = Math.min(zone.x + zone.width - 10, Math.ceil(camera.x + camera.width + 20));
  const bottom = Math.min(zone.y + zone.height - 10, Math.ceil(camera.y + camera.height + 20));
  if (right <= left || bottom <= top) return;

  ctx.fillStyle = "rgba(13, 17, 23, 0.2)";
  if (horizontal) {
    const startX = zone.x + 96 + Math.max(0, Math.floor((left - zone.x - 96) / 310)) * 310;
    for (let x = startX; x < right; x += 310) drawManhole(x, zone.y + zone.height * (seed % 2 ? 0.68 : 0.32));
    const drainStart = zone.x + 44 + Math.max(0, Math.floor((left - zone.x - 44) / 228)) * 228;
    for (let x = drainStart; x < right; x += 228) drawDrain(x, zone.y + zone.height - 15, true);
  } else {
    const startY = zone.y + 96 + Math.max(0, Math.floor((top - zone.y - 96) / 310)) * 310;
    for (let y = startY; y < bottom; y += 310) drawManhole(zone.x + zone.width * (seed % 2 ? 0.67 : 0.34), y);
    const drainStart = zone.y + 44 + Math.max(0, Math.floor((top - zone.y - 44) / 228)) * 228;
    for (let y = drainStart; y < bottom; y += 228) drawDrain(zone.x + zone.width - 15, y, false);
  }

  ctx.fillStyle = "rgba(174, 181, 183, 0.08)";
  const patchX = zone.x + 34 + (seed * 53) % Math.max(36, zone.width - 70);
  const patchY = zone.y + 24 + (seed * 37) % Math.max(30, zone.height - 48);
  if (patchX < right && patchX + 28 > left && patchY < bottom && patchY + 8 > top) {
    ctx.fillRect(patchX, patchY, 28, 3);
    ctx.fillRect(patchX + 7, patchY + 4, 15, 2);
  }
}

function drawPavementDetails(zone, seed) {
  const left = Math.max(zone.x, camera.x - 20);
  const right = Math.min(zone.x + zone.width, camera.x + camera.width + 20);
  const top = Math.max(zone.y, camera.y - 20);
  const bottom = Math.min(zone.y + zone.height, camera.y + camera.height + 20);
  ctx.fillStyle = "rgba(80, 79, 70, 0.12)";
  const startX = zone.x + 36 + Math.max(0, Math.floor((left - zone.x - 36) / 132)) * 132;
  const startY = zone.y + 30 + Math.max(0, Math.floor((top - zone.y - 30) / 118)) * 118;
  for (let y = startY; y < bottom; y += 118) {
    for (let x = startX; x < right; x += 132) {
      if ((Math.floor(x / 132) + Math.floor(y / 118) + seed) % 3 !== 0) continue;
      ctx.fillRect(x, y, 10, 3);
      ctx.fillRect(x + 16, y + 8, 4, 4);
    }
  }
  ctx.fillStyle = "rgba(239, 228, 193, 0.16)";
  if (zone.width >= zone.height) ctx.fillRect(left, zone.y + 5, Math.max(0, right - left), 2);
  else ctx.fillRect(zone.x + 5, top, 2, Math.max(0, bottom - top));
}

function drawPublicSpaceDetails(zone, seed) {
  const left = Math.max(zone.x + 24, camera.x - 20);
  const right = Math.min(zone.x + zone.width - 24, camera.x + camera.width + 20);
  const top = Math.max(zone.y + 24, camera.y - 20);
  const bottom = Math.min(zone.y + zone.height - 24, camera.y + camera.height + 20);
  const startX = zone.x + 72 + Math.max(0, Math.floor((left - zone.x - 72) / 180)) * 180;
  const startY = zone.y + 72 + Math.max(0, Math.floor((top - zone.y - 72) / 180)) * 180;
  ctx.fillStyle = "rgba(91, 67, 43, 0.09)";
  for (let y = startY; y < bottom; y += 180) {
    for (let x = startX; x < right; x += 180) {
      if ((x + y + seed) % 4 === 0) continue;
      ctx.fillRect(x - 10, y, 20, 2);
      ctx.fillRect(x, y - 10, 2, 20);
      ctx.fillRect(x - 3, y - 3, 8, 8);
    }
  }
}

function drawManhole(centerX, centerY) {
  const x = Math.round(centerX - 10);
  const y = Math.round(centerY - 7);
  ctx.fillStyle = "rgba(19, 23, 28, 0.58)";
  ctx.fillRect(x, y, 20, 14);
  ctx.fillStyle = "rgba(105, 112, 117, 0.34)";
  ctx.fillRect(x + 3, y + 3, 14, 8);
  ctx.fillStyle = "rgba(24, 29, 34, 0.52)";
  ctx.fillRect(x + 6, y + 3, 2, 8);
  ctx.fillRect(x + 12, y + 3, 2, 8);
}

function drawDrain(x, y, horizontal) {
  ctx.fillStyle = "rgba(20, 24, 28, 0.58)";
  ctx.fillRect(Math.round(x), Math.round(y), horizontal ? 24 : 7, horizontal ? 7 : 24);
  ctx.fillStyle = "rgba(114, 120, 121, 0.36)";
  for (let offset = 3; offset < 20; offset += 5) {
    if (horizontal) ctx.fillRect(Math.round(x + offset), Math.round(y + 2), 2, 3);
    else ctx.fillRect(Math.round(x + 2), Math.round(y + offset), 3, 2);
  }
}
