import { camera } from "../camera.js";
import { ctx } from "../state.js";

const SHADOW_COLOR = "rgba(20, 22, 25, 0.24)";
const LIGHT_SHADOW_COLOR = "rgba(20, 22, 25, 0.18)";
const SHADOW_EDGE_COLOR = "rgba(20, 22, 25, 0.09)";
const NO_OPTIONS = Object.freeze({});
export const FLAT_SHADOW_OPTIONS = Object.freeze({ stepped: false });

export function drawPixelShadow(x, y, width, height, options = NO_OPTIONS) {
  const offsetX = options.offsetX ?? 7;
  const offsetY = options.offsetY ?? 7;
  const color = options.color || SHADOW_COLOR;
  const shadowX = Math.round(x + offsetX);
  const shadowY = Math.round(y + offsetY);
  const shadowWidth = Math.max(2, Math.round(width));
  const shadowHeight = Math.max(2, Math.round(height));

  ctx.fillStyle = options.edgeColor || SHADOW_EDGE_COLOR;
  ctx.fillRect(shadowX - 2, shadowY - 1, shadowWidth + 4, shadowHeight + 3);
  ctx.fillStyle = color;
  ctx.fillRect(shadowX, shadowY, shadowWidth, shadowHeight);

  if (options.stepped !== false && shadowWidth > 12 && shadowHeight > 8) {
    ctx.fillRect(shadowX + 4, shadowY + shadowHeight, shadowWidth - 4, 3);
  }
}

export function drawGroundShadow(centerX, groundY, width, height = 6, options = NO_OPTIONS) {
  const shadowWidth = Math.max(6, Math.round(width));
  const shadowHeight = Math.max(3, Math.round(height));
  const x = Math.round(centerX - shadowWidth / 2 + (options.offsetX ?? 4));
  const y = Math.round(groundY + (options.offsetY ?? 2));

  ctx.fillStyle = options.edgeColor || SHADOW_EDGE_COLOR;
  ctx.fillRect(x - 2, y - 1, shadowWidth + 4, shadowHeight + 3);
  ctx.fillStyle = options.color || SHADOW_COLOR;
  ctx.fillRect(x, y, shadowWidth, shadowHeight);
  if (shadowWidth > 18) {
    ctx.fillRect(x + 4, y + shadowHeight, shadowWidth - 8, 2);
  }
}

export function drawTallPixelShadow(x, groundY, length = 30, thickness = 4) {
  const segmentLength = Math.max(5, Math.floor(length / 4));
  ctx.fillStyle = LIGHT_SHADOW_COLOR;
  for (let step = 0; step < 4; step += 1) {
    ctx.fillRect(
      Math.round(x + 4 + step * segmentLength),
      Math.round(groundY + 2 + step * 2),
      segmentLength + 2,
      thickness
    );
  }
}

export function drawSurfaceTexture(surface, kind) {
  const left = Math.max(surface.x, Math.floor(camera.x - 8));
  const top = Math.max(surface.y, Math.floor(camera.y - 8));
  const right = Math.min(surface.x + surface.width, Math.ceil(camera.x + camera.width + 8));
  const bottom = Math.min(surface.y + surface.height, Math.ceil(camera.y + camera.height + 8));

  if (right <= left || bottom <= top) {
    return;
  }

  if (kind === "road" || kind === "asphalt" || kind === "bridge") {
    drawAsphaltTexture(surface, left, top, right, bottom);
    return;
  }

  if (kind === "brick") {
    drawBrickTexture(surface, left, top, right, bottom);
    return;
  }

  if (kind === "plaza" || kind === "courtyard") {
    drawPlazaTexture(surface, left, top, right, bottom, kind);
    return;
  }

  if (kind === "sidewalk" || kind === "path" || kind === "paving" || kind === "embankment") {
    drawPavingTexture(surface, left, top, right, bottom, kind);
  }
}

export function drawWaterTexture(water) {
  const inset = 14;
  const left = Math.max(water.x + inset, Math.floor(camera.x - 16));
  const top = Math.max(water.y + inset, Math.floor(camera.y - 16));
  const right = Math.min(water.x + water.width - inset, Math.ceil(camera.x + camera.width + 16));
  const bottom = Math.min(water.y + water.height - inset, Math.ceil(camera.y + camera.height + 16));

  if (right <= left || bottom <= top) {
    return;
  }

  const tick = Math.floor(performance.now() / 180);
  const rowSpacing = 36;
  const columnSpacing = 84;
  const rowStart = Math.floor((top - water.y) / rowSpacing);
  const rowEnd = Math.ceil((bottom - water.y) / rowSpacing);

  for (let row = rowStart; row <= rowEnd; row += 1) {
    const y = water.y + 18 + row * rowSpacing;
    if (y < top || y > bottom) {
      continue;
    }

    const wavePhase = (tick + row * 5) % 44;
    const drift = wavePhase <= 22 ? wavePhase : 44 - wavePhase;
    const firstColumn = Math.floor((left - water.x - drift) / columnSpacing);
    const lastColumn = Math.ceil((right - water.x - drift) / columnSpacing);
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const x = water.x + drift + column * columnSpacing;
      if (x + 30 < left || x > right) {
        continue;
      }

      const variant = pixelHash(column, row, water.x + water.y);
      ctx.fillStyle = variant % 3 === 0 ? "rgba(196, 239, 246, 0.34)" : "rgba(127, 211, 232, 0.28)";
      ctx.fillRect(Math.round(x), y, 16 + (variant % 3) * 3, 3);
      if (variant % 7 === 0) {
        ctx.fillRect(Math.round(x + 7), y + 7, 12, 2);
      }
    }
  }
}

function drawAsphaltTexture(surface, left, top, right, bottom) {
  const spacing = 30;
  const startX = surface.x + Math.max(0, Math.floor((left - surface.x) / spacing)) * spacing;
  const startY = surface.y + Math.max(0, Math.floor((top - surface.y) / spacing)) * spacing;

  for (let y = startY; y < bottom; y += spacing) {
    for (let x = startX; x < right; x += spacing) {
      const variant = pixelHash(Math.floor(x / spacing), Math.floor(y / spacing), 17);
      if (variant % 3 !== 0) {
        continue;
      }
      ctx.fillStyle = variant % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.075)";
      ctx.fillRect(x + variant % 11, y + (variant >>> 3) % 11, 2 + variant % 2, 2);
      if (variant % 13 === 0) {
        ctx.fillRect(x + 13, y + 19, 7, 2);
      }
    }
  }
}

function drawPavingTexture(surface, left, top, right, bottom, kind) {
  const spacing = kind === "path" ? 26 : 34;
  const startX = surface.x + Math.max(0, Math.floor((left - surface.x) / spacing)) * spacing;
  const startY = surface.y + Math.max(0, Math.floor((top - surface.y) / spacing)) * spacing;

  for (let y = startY; y < bottom; y += spacing) {
    for (let x = startX; x < right; x += spacing) {
      const variant = pixelHash(Math.floor(x / spacing), Math.floor(y / spacing), 31);
      if (variant % 2 !== 0) {
        continue;
      }
      ctx.fillStyle = variant % 4 === 0 ? "rgba(255,255,255,0.075)" : "rgba(77,72,63,0.07)";
      ctx.fillRect(x + 7 + variant % 5, y + 8 + (variant >>> 2) % 5, 5, 2);
    }
  }
}

function drawBrickTexture(surface, left, top, right, bottom) {
  const brickWidth = 30;
  const brickHeight = 18;
  const startRow = Math.max(0, Math.floor((top - surface.y) / brickHeight));
  const endRow = Math.ceil((bottom - surface.y) / brickHeight);

  ctx.fillStyle = "rgba(255, 238, 202, 0.10)";
  for (let row = startRow; row <= endRow; row += 1) {
    const y = surface.y + row * brickHeight;
    const offset = row % 2 === 0 ? 0 : brickWidth / 2;
    const startColumn = Math.floor((left - surface.x - offset) / brickWidth);
    const endColumn = Math.ceil((right - surface.x - offset) / brickWidth);
    for (let column = startColumn; column <= endColumn; column += 1) {
      const x = surface.x + offset + column * brickWidth;
      const variant = pixelHash(column, row, 47);
      if (variant % 3 === 0) {
        ctx.fillRect(x + 5, y + 5, 8, 2);
      }
    }
  }
}

function drawPlazaTexture(surface, left, top, right, bottom, kind) {
  const spacing = kind === "courtyard" ? 32 : 42;
  const startX = surface.x + Math.max(0, Math.floor((left - surface.x) / spacing)) * spacing;
  const startY = surface.y + Math.max(0, Math.floor((top - surface.y) / spacing)) * spacing;

  for (let y = startY; y < bottom; y += spacing) {
    for (let x = startX; x < right; x += spacing) {
      const variant = pixelHash(Math.floor(x / spacing), Math.floor(y / spacing), kind === "courtyard" ? 61 : 71);
      if (variant % 2 !== 0) {
        continue;
      }
      ctx.fillStyle = variant % 3 === 0 ? "rgba(255,244,205,0.10)" : "rgba(91,68,43,0.06)";
      ctx.fillRect(x + 9 + variant % 6, y + 9, 9, 3);
      if (variant % 7 === 0) {
        ctx.fillRect(x + 23, y + 24, 3, 3);
      }
    }
  }
}

function pixelHash(x, y, seed) {
  let value = Math.imul(x + seed, 374761393) ^ Math.imul(y - seed, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
