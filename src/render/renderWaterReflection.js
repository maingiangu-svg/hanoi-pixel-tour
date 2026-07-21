import { ctx } from "../state.js";

const GOLD_REFLECTION = Object.freeze(["#f7c35d", "#e99a35", "#c8672f"]);
const STONE_REFLECTION = Object.freeze(["#c6b783", "#8f876c", "#5f6b68"]);

export function drawLakeWaterSurface(width, height, horizon, pan, phase, weatherType, weatherIntensity, time, colors) {
  const palette = weatherType === "rain" || weatherType === "heavyRain"
    ? colors.rainWater
    : phase === "night"
      ? colors.nightWater
      : phase === "sunset"
        ? colors.sunsetWater
        : colors.dayWater;
  const depth = Math.max(1, height - horizon);
  const bandHeight = Math.ceil(depth / palette.length);
  for (let index = 0; index < palette.length; index += 1) {
    ctx.fillStyle = palette[index];
    ctx.fillRect(0, horizon + index * bandHeight, width, bandHeight + 1);
  }

  const tick = Math.floor(time / 180);
  for (let row = 0; row < 18; row += 1) {
    const progress = row / 17;
    const y = Math.round(horizon + 11 + progress * depth * 0.82);
    const segment = Math.round(24 + progress * 64);
    const offset = mod(tick * (row % 2 ? 2 : -1) - pan * 0.22 + row * 41, segment * 2);
    ctx.fillStyle = row % 4 === 0
      ? (phase === "sunset" ? "rgba(248, 180, 73, 0.18)" : "rgba(167, 207, 205, 0.2)")
      : "rgba(7, 30, 39, 0.17)";
    for (let x = -segment * 2; x < width + segment; x += segment * 2) {
      ctx.fillRect(Math.round(x + offset), y, Math.round(segment * (0.58 + (row % 3) * 0.09)), row < 8 ? 2 : 3);
    }
  }

  if (weatherIntensity > 0.08) drawRainRipples(width, height, horizon, weatherType, weatherIntensity, time);
}

export function drawTreeReflections(width, horizon, foregroundTop, pan, phase, weatherIntensity, time) {
  const available = Math.max(20, foregroundTop - horizon);
  const count = 16;
  for (let index = 0; index < count; index += 1) {
    const x = mod(index * 113 - pan * 0.2 + 31, width + 120) - 60;
    const height = 34 + mod(index * 29, Math.max(35, Math.round(available * 0.38)));
    const widthBase = 34 + mod(index * 17, 47);
    const alpha = phase === "night" ? 0.18 : 0.22;
    ctx.fillStyle = phase === "sunset"
      ? `rgba(27, 65, 49, ${alpha})`
      : `rgba(18, 55, 48, ${alpha})`;
    for (let row = 0; row < height; row += 7) {
      const wobble = Math.round(Math.sin(time / 820 + index * 1.9 + row * 0.24) * (2 + weatherIntensity * 5));
      const shrink = Math.round(row * 0.12);
      ctx.fillRect(Math.round(x - widthBase / 2 + shrink / 2 + wobble), horizon + 4 + row, Math.max(8, widthBase - shrink), 3);
    }
  }
}

export function drawTurtleTowerReflection(centerX, topY, towerWidth, towerHeight, phase, weatherIntensity, time) {
  const palette = phase === "night" || phase === "sunset" ? GOLD_REFLECTION : STONE_REFLECTION;
  const reflectionHeight = Math.round(towerHeight * (phase === "night" ? 1.34 : 1.12));
  const sliceHeight = weatherIntensity > 0.55 ? 5 : 4;
  for (let row = 0; row < reflectionHeight; row += 7) {
    const progress = row / reflectionHeight;
    const architecturalStep = progress < 0.28 ? 1 : progress < 0.58 ? 0.78 : 0.54;
    const spread = towerWidth * architecturalStep * (1 + progress * 0.2);
    const wave = Math.sin(time / 640 + row * 0.3) * (2 + progress * 5 + weatherIntensity * 7);
    const breakGap = 3 + mod(row * 7, 8);
    const alpha = (phase === "night" ? 0.62 : phase === "sunset" ? 0.42 : 0.25) * (1 - progress * 0.68);
    const color = palette[Math.floor(row / 14) % palette.length];
    ctx.fillStyle = colorWithAlpha(color, alpha);
    const left = Math.round(centerX - spread / 2 + wave);
    const firstWidth = Math.max(5, Math.round(spread * (0.42 + mod(row, 3) * 0.05)));
    ctx.fillRect(left, topY + row, firstWidth, sliceHeight);
    ctx.fillRect(left + firstWidth + breakGap, topY + row + (row % 14 === 0 ? 2 : 0), Math.max(4, Math.round(spread - firstWidth - breakGap)), sliceHeight - 1);
  }
}

export function drawShoreLightReflections(width, horizon, foregroundTop, pan, phase, weatherIntensity, time, lightPositions) {
  if (phase !== "night" && phase !== "sunset") return;
  const depth = Math.max(30, foregroundTop - horizon);
  for (let index = 0; index < lightPositions.length; index += 1) {
    const x = lightPositions[index] * width - pan * 0.21;
    const height = Math.round(depth * (phase === "night" ? 0.58 : 0.3) * (0.78 + (index % 3) * 0.11));
    const alpha = (phase === "night" ? 0.42 : 0.2) * (1 - weatherIntensity * 0.22);
    for (let row = 0; row < height; row += 8) {
      const progress = row / height;
      const wobble = Math.round(Math.sin(time / 520 + index * 2.3 + row) * (2 + weatherIntensity * 6));
      ctx.fillStyle = `rgba(255, ${190 + (index % 2) * 18}, 82, ${alpha * (1 - progress * 0.72)})`;
      const stripWidth = Math.max(3, Math.round((10 - progress * 5) + mod(index + row, 4)));
      ctx.fillRect(Math.round(x + wobble - stripWidth / 2), horizon + 9 + row, stripWidth, row % 16 === 0 ? 4 : 2);
    }
  }
}

function drawRainRipples(width, height, horizon, weatherType, intensity, time) {
  const count = weatherType === "heavyRain" ? 42 : weatherType === "rain" ? 28 : 14;
  const span = Math.max(1, height - horizon);
  const tick = Math.floor(time / 90);
  ctx.fillStyle = `rgba(185, 216, 223, ${0.12 + intensity * 0.18})`;
  for (let index = 0; index < count; index += 1) {
    const x = mod(index * 149 + tick * 13, width);
    const y = horizon + 12 + mod(index * 83 + tick * 5, Math.max(20, span - 28));
    const size = 5 + mod(index, 4) * 3;
    ctx.fillRect(Math.round(x - size), Math.round(y), size * 2, 1);
    if (index % 3 === 0) ctx.fillRect(Math.round(x - size / 2), Math.round(y + 3), size, 1);
  }
}

function colorWithAlpha(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
