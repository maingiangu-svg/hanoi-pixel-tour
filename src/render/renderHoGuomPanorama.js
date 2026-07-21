import { HO_GUOM_VIEW_SCENE } from "../data/viewScenes/hoGuomView.js";
import { ctx } from "../state.js";
import {
  drawLakeWaterSurface,
  drawShoreLightReflections,
  drawTreeReflections,
  drawTurtleTowerReflection
} from "./renderWaterReflection.js";
import { drawHoGuomNpcAmbience } from "./renderViewNpcAmbience.js";

const backgroundCache = new Map();

export function drawHoGuomPanorama(variant, width, height, horizon, pan, wetness, time, hour, crowdFactor, cloudiness, weatherIntensity, weatherType) {
  const phase = getPhase(hour, cloudiness, weatherType);
  const promenadeTop = Math.round(height * (variant === "tower" ? 0.83 : 0.79));
  const towerX = Math.round(width * (variant === "tower" ? 0.51 : 0.55) - pan * 0.58);
  const towerBaseY = Math.round(horizon + (variant === "tower" ? 112 : 92));
  const towerScale = variant === "tower" ? 1.25 : 1.03;
  const towerWidth = Math.round(112 * towerScale);
  const towerHeight = Math.round(158 * towerScale);

  drawHoGuomSky(width, horizon, pan, phase, cloudiness, time);
  drawCachedFarShore(width, horizon, pan, phase);
  drawFarShoreActivity(width, horizon, pan, phase, time, weatherIntensity);
  drawLakeWaterSurface(width, height, horizon, pan, phase, weatherType, weatherIntensity, time, HO_GUOM_VIEW_SCENE.colors);
  drawTreeReflections(width, horizon, promenadeTop, pan, phase, weatherIntensity, time);
  drawShoreLightReflections(width, horizon, promenadeTop, pan, phase, weatherIntensity, time, HO_GUOM_VIEW_SCENE.farShoreLights);

  if (variant !== "redBridge") {
    drawTurtleIsland(towerX, towerBaseY, towerScale, phase);
    drawTurtleTowerReflection(towerX, towerBaseY + 15, towerWidth, towerHeight, phase, weatherIntensity, time);
    drawTurtleTower(towerX, towerBaseY, towerScale, phase, time);
  }

  if (variant === "redBridge") {
    drawTempleIsland(width * 0.77 - pan * 0.46, horizon + 54, phase);
    drawTheHucBridge(width * 0.05 - pan * 0.88, horizon + 118, width * 0.77, phase);
  } else if (variant === "shore" && pan > Math.max(18, width * 0.014)) {
    const reveal = Math.min(1, (pan - width * 0.014) / Math.max(1, width * 0.055));
    ctx.save();
    ctx.globalAlpha = reveal;
    drawTempleIsland(width * 1.13 - pan * 2.08, horizon + 48, phase);
    drawTheHucBridge(width * 0.91 - pan * 2.38, horizon + 112, width * 0.42, phase);
    ctx.restore();
  }

  drawPromenade(width, height, promenadeTop, pan, phase, wetness, time);
  drawHoGuomNpcAmbience(width, height, promenadeTop, pan, phase, time, hour, crowdFactor, weatherIntensity, variant);
}

function drawHoGuomSky(width, horizon, pan, phase, cloudiness, time) {
  const palette = phase === "night"
    ? HO_GUOM_VIEW_SCENE.colors.nightSky
    : phase === "sunset"
      ? HO_GUOM_VIEW_SCENE.colors.sunsetSky
      : phase === "cloudy"
        ? HO_GUOM_VIEW_SCENE.colors.cloudySky
        : HO_GUOM_VIEW_SCENE.colors.daySky;
  const bandHeight = Math.ceil((horizon + 25) / palette.length);
  for (let index = 0; index < palette.length; index += 1) {
    ctx.fillStyle = palette[index];
    ctx.fillRect(0, index * bandHeight, width, bandHeight + 1);
  }

  if (phase === "sunset") drawSunsetGlow(width, horizon, pan);
  drawLongClouds(width, horizon, pan, phase, cloudiness, time, 0);
  drawLongClouds(width, horizon, pan, phase, cloudiness, time, 1);
  if (phase === "night" && cloudiness < 0.72) drawNightSkyDetails(width, horizon, pan);
}

function drawSunsetGlow(width, horizon, pan) {
  const sunX = Math.round(width * 0.38 - pan * 0.07);
  ctx.fillStyle = "rgba(255, 219, 104, 0.52)";
  ctx.fillRect(sunX - 55, horizon - 94, 110, 8);
  ctx.fillRect(sunX - 38, horizon - 108, 76, 14);
  ctx.fillStyle = "#ffd36b";
  ctx.fillRect(sunX - 17, horizon - 126, 34, 22);
  ctx.fillRect(sunX - 23, horizon - 120, 46, 10);
}

function drawLongClouds(width, horizon, pan, phase, cloudiness, time, layer) {
  const drift = mod(time * (layer ? 0.0035 : 0.0021), width + 520);
  const offset = pan * (layer ? -0.14 : -0.07);
  const alpha = phase === "sunset" ? 0.2 + cloudiness * 0.26 : 0.12 + cloudiness * 0.34;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = phase === "night" ? "#60748b" : phase === "sunset" ? (layer ? "#9b4f43" : "#f6d06c") : "#e7ece6";
  for (let index = -1; index < 5; index += 1) {
    const x = Math.round(index * 390 - drift + offset);
    const y = 72 + layer * 104 + mod(index * 23 + layer * 17, 44);
    if (y > horizon - 48) continue;
    ctx.fillRect(x, y, 254, 10 + layer * 3);
    ctx.fillRect(x + 46, y - 10, 138, 11);
    ctx.fillRect(x + 118, y + 12, 208, 7);
  }
  ctx.globalAlpha = 1;
}

function drawNightSkyDetails(width, horizon, pan) {
  ctx.fillStyle = "rgba(242, 226, 174, 0.45)";
  for (let index = 0; index < 17; index += 1) {
    const x = mod(index * 181 - pan * 0.05, width);
    const y = 24 + mod(index * 43, Math.max(32, horizon - 118));
    ctx.fillRect(Math.round(x), Math.round(y), index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1);
  }
}

function drawCachedFarShore(width, horizon, pan, phase) {
  const layer = getFarShoreLayer(width, phase);
  const x = Math.round(-HO_GUOM_VIEW_SCENE.overscan / 2 - pan * 0.18);
  const y = Math.round(horizon - layer.height + 9);
  ctx.drawImage(layer, x, y);
}

function getFarShoreLayer(width, phase) {
  const key = `${width}:${phase}`;
  if (backgroundCache.has(key)) return backgroundCache.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = width + HO_GUOM_VIEW_SCENE.overscan;
  canvas.height = 214;
  const layerCtx = canvas.getContext("2d");
  layerCtx.imageSmoothingEnabled = false;
  drawSkylineLayer(layerCtx, canvas.width, canvas.height, phase);
  drawTreeLayer(layerCtx, canvas.width, canvas.height, phase);
  backgroundCache.set(key, canvas);
  if (backgroundCache.size > 12) backgroundCache.delete(backgroundCache.keys().next().value);
  return canvas;
}

function drawSkylineLayer(layerCtx, width, height, phase) {
  const baseline = height - 17;
  const buildings = HO_GUOM_VIEW_SCENE.skyline;
  for (let index = 0; index < buildings.length; index += 1) {
    const item = buildings[index];
    const x = Math.round((item[0] + 0.1) * width);
    const buildingWidth = Math.round(item[1] * width);
    const buildingHeight = Math.round(52 + item[2] * 125);
    const y = baseline - buildingHeight;
    const tones = phase === "night" ? ["#303745", "#3b414c", "#2b3941"] : ["#6f6f68", "#827768", "#66716f"];
    layerCtx.fillStyle = tones[item[4]];
    layerCtx.fillRect(x, y, buildingWidth, buildingHeight);
    layerCtx.fillStyle = phase === "night" ? "#222a34" : "#525855";
    layerCtx.fillRect(x - 2, y, buildingWidth + 4, 5);
    drawRoofDetail(layerCtx, x, y, buildingWidth, item[3], phase);
    drawWindows(layerCtx, x, y, buildingWidth, buildingHeight, phase, index);
  }
}

function drawRoofDetail(layerCtx, x, y, width, type, phase) {
  const dark = phase === "night" ? "#1e2832" : "#4b5350";
  layerCtx.fillStyle = dark;
  if (type === "antenna") {
    layerCtx.fillRect(x + width * 0.64, y - 30, 3, 30);
    layerCtx.fillRect(x + width * 0.64 - 12, y - 25, 26, 3);
  } else if (type === "waterTank") {
    layerCtx.fillRect(x + width * 0.58, y - 18, 24, 15);
    layerCtx.fillRect(x + width * 0.58 + 4, y - 23, 16, 5);
  } else if (type === "tile") {
    layerCtx.fillRect(x - 5, y - 7, width + 10, 8);
    layerCtx.fillRect(x + 9, y - 12, Math.max(20, width - 18), 5);
  } else if (type === "awning") {
    layerCtx.fillRect(x + 8, y + 24, Math.max(12, width - 16), 6);
  }
}

function drawWindows(layerCtx, x, y, width, height, phase, seed) {
  const rows = Math.max(1, Math.floor((height - 20) / 24));
  for (let row = 0; row < rows; row += 1) {
    for (let windowX = x + 11; windowX < x + width - 8; windowX += 22) {
      const lit = mod(Math.round(windowX) + row * 3 + seed, 4) !== 0;
      layerCtx.fillStyle = phase === "night" && lit ? "#e9b55d" : phase === "sunset" && lit ? "#927451" : "#35464b";
      layerCtx.fillRect(Math.round(windowX), y + 14 + row * 23, 8, 7);
    }
  }
}

function drawTreeLayer(layerCtx, width, height, phase) {
  const baseline = height - 4;
  const clusters = HO_GUOM_VIEW_SCENE.treeClusters;
  const darks = phase === "night" ? ["#173e38", "#1d4840", "#245148"] : phase === "sunset" ? ["#204936", "#28543d", "#315d43"] : ["#315f49", "#3c6c50", "#47775a"];
  for (let index = 0; index < clusters.length; index += 1) {
    const item = clusters[index];
    const center = Math.round((item[0] + 0.08) * width);
    const clusterWidth = Math.round(item[1] * width);
    const clusterHeight = Math.round(70 * item[2]);
    layerCtx.fillStyle = "#3a342d";
    layerCtx.fillRect(center - 5, baseline - clusterHeight * 0.58, 10, clusterHeight * 0.6);
    layerCtx.fillStyle = darks[item[3]];
    layerCtx.fillRect(center - clusterWidth * 0.52, baseline - clusterHeight * 0.68, clusterWidth, clusterHeight * 0.57);
    layerCtx.fillRect(center - clusterWidth * 0.38, baseline - clusterHeight, clusterWidth * 0.74, clusterHeight * 0.47);
    layerCtx.fillRect(center - clusterWidth * 0.62, baseline - clusterHeight * 0.55, clusterWidth * 0.45, clusterHeight * 0.34);
    layerCtx.fillRect(center + clusterWidth * 0.16, baseline - clusterHeight * 0.61, clusterWidth * 0.47, clusterHeight * 0.35);
    layerCtx.fillRect(center - clusterWidth * 0.13, baseline - clusterHeight * 1.08, clusterWidth * 0.31, clusterHeight * 0.18);
    layerCtx.fillStyle = phase === "night" ? "#2b5b4c" : "#557c57";
    layerCtx.fillRect(center - clusterWidth * 0.34, baseline - clusterHeight * 0.82, clusterWidth * 0.24, clusterHeight * 0.16);
  }
}

function drawFarShoreActivity(width, horizon, pan, phase, time, weatherIntensity) {
  ctx.fillStyle = phase === "night" ? "#253b3b" : "#697769";
  ctx.fillRect(0, horizon - 2, width, 7);
  if (phase === "night" || phase === "sunset") {
    for (let index = 0; index < HO_GUOM_VIEW_SCENE.farShoreLights.length; index += 1) {
      const x = Math.round(HO_GUOM_VIEW_SCENE.farShoreLights[index] * width - pan * 0.2);
      ctx.fillStyle = phase === "night" ? "#ffd26e" : "#dfa553";
      ctx.fillRect(x - 3, horizon - 11, 7, 6);
      ctx.fillStyle = "rgba(255, 213, 109, 0.28)";
      ctx.fillRect(x - 8, horizon - 5, 17, 3);
    }
  }

  if (phase === "night" && weatherIntensity < 0.78) {
    for (let index = 0; index < 5; index += 1) {
      const travel = mod(time * (0.014 + index * 0.0015) + index * 271, width + 160) - 80;
      const x = Math.round(travel - pan * 0.22);
      ctx.fillStyle = index % 2 ? "#f6cf77" : "#d4543d";
      ctx.fillRect(x, horizon - 4 - (index % 2) * 3, 5, 2);
      ctx.fillStyle = "rgba(255, 196, 88, 0.2)";
      ctx.fillRect(x - 9, horizon - 3, 20, 2);
    }
  }
}

function drawTurtleIsland(x, baseY, scale, phase) {
  const width = Math.round(136 * scale);
  ctx.fillStyle = "rgba(8, 24, 27, 0.35)";
  ctx.fillRect(Math.round(x - width * 0.62), baseY + 10, Math.round(width * 1.24), 12);
  ctx.fillStyle = phase === "night" ? "#304737" : "#516946";
  ctx.fillRect(Math.round(x - width * 0.6), baseY + 4, Math.round(width * 1.2), 12);
  ctx.fillStyle = phase === "sunset" ? "#736e47" : "#667256";
  ctx.fillRect(Math.round(x - width * 0.42), baseY - 1, Math.round(width * 0.84), 8);
}

function drawTurtleTower(x, baseY, scale, phase, time) {
  const unit = Math.max(4, Math.round(4 * scale));
  const px = Math.round(x);
  const night = phase === "night";
  const sunset = phase === "sunset";
  const wall = night ? "#b18b52" : sunset ? "#b8a076" : "#aca58d";
  const lightWall = night ? "#e2b760" : sunset ? "#d3b27b" : "#c7bea0";
  const shade = night ? "#6e593c" : "#777568";
  const roof = night ? "#453b32" : "#59564d";
  const arch = "#293234";

  drawTowerLevel(px, baseY, unit, 14, 12, wall, lightWall, shade, arch, 3);
  drawTowerRoof(px, baseY - unit * 12, unit, 16, roof, night, sunset);
  drawTowerLevel(px, baseY - unit * 15, unit, 11, 9, wall, lightWall, shade, arch, 2);
  drawTowerRoof(px, baseY - unit * 24, unit, 13, roof, night, sunset);
  drawTowerLevel(px, baseY - unit * 27, unit, 8, 7, wall, lightWall, shade, arch, 1);
  drawTowerRoof(px, baseY - unit * 34, unit, 10, roof, night, sunset);
  ctx.fillStyle = roof;
  ctx.fillRect(px - unit * 2, baseY - unit * 39, unit * 4, unit * 5);
  ctx.fillRect(px - unit * 3, baseY - unit * 40, unit * 6, unit);
  ctx.fillStyle = night ? "#f5cf73" : sunset ? "#e7b967" : "#747365";
  ctx.fillRect(px - unit, baseY - unit * 42, unit * 2, unit * 2);

  if (night) drawTowerUplights(px, baseY, unit, time);
  if (sunset) {
    ctx.fillStyle = "rgba(255, 178, 71, 0.65)";
    ctx.fillRect(px - unit * 14, baseY - unit * 12, unit, unit * 11);
    ctx.fillRect(px - unit * 11, baseY - unit * 24, unit, unit * 8);
    ctx.fillRect(px - unit * 8, baseY - unit * 34, unit, unit * 6);
  }
}

function drawTowerLevel(x, baseY, unit, halfWidth, height, wall, lightWall, shade, arch, openings) {
  const left = x - unit * halfWidth;
  const top = baseY - unit * height;
  ctx.fillStyle = shade;
  ctx.fillRect(left - unit, top - unit, unit * (halfWidth * 2 + 2), unit * (height + 1));
  ctx.fillStyle = wall;
  ctx.fillRect(left, top, unit * halfWidth * 2, unit * height);
  ctx.fillStyle = lightWall;
  ctx.fillRect(left + unit, top + unit, unit * 2, unit * (height - 2));
  ctx.fillStyle = arch;
  const spacing = unit * halfWidth * 2 / openings;
  for (let index = 0; index < openings; index += 1) {
    const center = left + spacing * (index + 0.5);
    drawPixelArch(center, baseY - unit * 2, Math.max(unit * 1.6, spacing * 0.26), unit * Math.min(7, height - 3));
  }
  ctx.fillStyle = shade;
  ctx.fillRect(left, baseY - unit * 2, unit * halfWidth * 2, unit * 2);
}

function drawTowerRoof(x, y, unit, halfWidth, roof, night, sunset) {
  ctx.fillStyle = "#34383a";
  ctx.fillRect(x - unit * (halfWidth + 1), y - unit, unit * (halfWidth * 2 + 2), unit * 3);
  ctx.fillStyle = roof;
  ctx.fillRect(x - unit * halfWidth, y - unit * 3, unit * halfWidth * 2, unit * 3);
  ctx.fillRect(x - unit * (halfWidth - 2), y - unit * 5, unit * (halfWidth * 2 - 4), unit * 2);
  if (night || sunset) {
    ctx.fillStyle = night ? "#c4934e" : "#d69a53";
    ctx.fillRect(x - unit * halfWidth, y - unit * 2, unit * halfWidth * 2, unit);
  }
}

function drawTowerUplights(x, baseY, unit, time) {
  const pulse = 0.72 + Math.sin(time / 1300) * 0.05;
  ctx.fillStyle = `rgba(255, 196, 86, ${pulse})`;
  ctx.fillRect(x - unit * 11, baseY - unit * 10, unit * 2, unit * 8);
  ctx.fillRect(x + unit * 9, baseY - unit * 10, unit * 2, unit * 8);
  ctx.fillRect(x - unit * 7, baseY - unit * 23, unit, unit * 7);
  ctx.fillRect(x + unit * 6, baseY - unit * 23, unit, unit * 7);
  ctx.fillStyle = "rgba(255, 211, 118, 0.14)";
  ctx.fillRect(x - unit * 15, baseY - unit * 12, unit * 30, unit * 12);
}

function drawTheHucBridge(x, y, length, phase) {
  const startX = Math.round(x);
  const endX = Math.round(x + length);
  ctx.strokeStyle = "#69252a";
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(startX, y + 24);
  ctx.quadraticCurveTo((startX + endX) / 2, y - 18, endX, y + 7);
  ctx.stroke();
  ctx.strokeStyle = phase === "night" ? "#b83d38" : "#d34a3f";
  ctx.lineWidth = 7;
  ctx.stroke();
  for (let index = 0; index <= 14; index += 1) {
    const ratio = index / 14;
    const px = startX + length * ratio;
    const py = y + 24 - Math.sin(ratio * Math.PI) * 37 - ratio * 17;
    ctx.fillStyle = "#922e30";
    ctx.fillRect(Math.round(px - 2), Math.round(py - 20), 5, 24);
    if (phase === "night" && index % 3 === 0) {
      ctx.fillStyle = "#f3c563";
      ctx.fillRect(Math.round(px - 3), Math.round(py - 23), 7, 5);
    }
  }
}

function drawTempleIsland(x, y, phase) {
  const px = Math.round(x);
  ctx.fillStyle = phase === "night" ? "#194238" : "#3f6748";
  ctx.fillRect(px - 90, y - 50, 180, 65);
  ctx.fillRect(px - 58, y - 79, 116, 42);
  ctx.fillStyle = "#6f3d34";
  ctx.fillRect(px - 48, y - 16, 96, 34);
  ctx.fillStyle = phase === "night" ? "#e0b05e" : "#c69a5d";
  ctx.fillRect(px - 34, y - 7, 68, 19);
  ctx.fillStyle = "#542d2e";
  ctx.fillRect(px - 58, y - 22, 116, 8);
}

function drawPromenade(width, height, top, pan, phase, wetness, time) {
  ctx.fillStyle = phase === "night" ? "#51575a" : "#777871";
  ctx.fillRect(0, top, width, height - top);
  ctx.fillStyle = phase === "sunset" ? "#b28d68" : phase === "night" ? "#72706a" : "#a49c8b";
  ctx.fillRect(0, top, width, 13);
  for (let y = top + 22; y < height; y += 27) {
    ctx.fillStyle = y % 54 === 0 ? "rgba(40, 44, 45, 0.34)" : "rgba(202, 195, 174, 0.14)";
    ctx.fillRect(0, y, width, 2);
  }
  for (let x = -80 - mod(pan * 0.82, 94); x < width + 94; x += 94) {
    ctx.fillStyle = "rgba(40, 42, 42, 0.2)";
    ctx.fillRect(Math.round(x), top + 13, 3, height - top);
  }

  drawLakeRailing(0, top - 31, width, phase);
  for (let index = 0; index < HO_GUOM_VIEW_SCENE.foregroundLamps.length; index += 1) {
    const x = HO_GUOM_VIEW_SCENE.foregroundLamps[index] * width - pan * 1.18;
    drawLakeLamp(x, top + 17, phase, time, index);
  }
  drawForegroundPlanters(width, top, pan, phase);
  if (wetness > 0.16) drawPromenadeReflections(width, height, top, pan, phase, wetness, time);
}

function drawLakeRailing(x, y, width, phase) {
  ctx.fillStyle = "rgba(12, 18, 20, 0.28)";
  ctx.fillRect(x, y + 34, width, 7);
  ctx.fillStyle = phase === "night" ? "#303b3f" : "#52615f";
  ctx.fillRect(x, y, width, 7);
  ctx.fillRect(x, y + 23, width, 5);
  for (let post = x; post < x + width; post += 45) {
    ctx.fillRect(post, y - 6, 6, 43);
    ctx.fillStyle = phase === "sunset" ? "#bd8959" : phase === "night" ? "#586367" : "#78817d";
    ctx.fillRect(post + 1, y - 4, 2, 31);
    ctx.fillStyle = phase === "night" ? "#303b3f" : "#52615f";
  }
}

function drawLakeLamp(x, y, phase, time, seed) {
  const px = Math.round(x);
  const lit = phase === "night" || phase === "sunset";
  ctx.fillStyle = "#313a3d";
  ctx.fillRect(px - 4, y - 142, 8, 148);
  ctx.fillRect(px - 18, y - 148, 36, 7);
  ctx.fillStyle = lit ? "#ffd171" : "#b9c3b6";
  ctx.fillRect(px - 12, y - 171, 24, 23);
  ctx.fillRect(px - 16, y - 164, 32, 11);
  if (lit) {
    const pulse = 0.11 + Math.sin(time / (1250 + seed * 170)) * 0.015;
    ctx.fillStyle = `rgba(255, 205, 100, ${pulse})`;
    ctx.fillRect(px - 44, y - 155, 88, 34);
    ctx.fillRect(px - 73, y - 8, 146, 7);
    ctx.fillStyle = "rgba(255, 190, 72, 0.1)";
    ctx.fillRect(px - 54, y - 1, 108, 22);
  }
}

function drawForegroundPlanters(width, top, pan, phase) {
  for (let index = 0; index < 4; index += 1) {
    const x = Math.round(width * (0.24 + index * 0.22) - pan * 1.1);
    ctx.fillStyle = "rgba(13, 18, 19, 0.25)";
    ctx.fillRect(x - 25, top + 70, 54, 8);
    ctx.fillStyle = phase === "night" ? "#665145" : "#896754";
    ctx.fillRect(x - 21, top + 47, 43, 26);
    ctx.fillStyle = phase === "night" ? "#2b5140" : "#467153";
    ctx.fillRect(x - 29, top + 31, 58, 18);
    ctx.fillRect(x - 18, top + 20, 36, 16);
  }
}

function drawPromenadeReflections(width, height, top, pan, phase, wetness, time) {
  if (phase !== "night" && phase !== "sunset") return;
  for (let index = 0; index < HO_GUOM_VIEW_SCENE.foregroundLamps.length; index += 1) {
    const x = HO_GUOM_VIEW_SCENE.foregroundLamps[index] * width - pan * 1.18;
    const flicker = Math.round(Math.sin(time / 470 + index) * 4);
    ctx.fillStyle = `rgba(255, 185, 65, ${wetness * 0.22})`;
    ctx.fillRect(Math.round(x - 20 + flicker), top + 12, 40, 4);
    ctx.fillRect(Math.round(x - 11 - flicker), top + 22, 22, Math.min(54, height - top - 22));
  }
}

function drawPixelArch(centerX, baseY, halfWidth, height) {
  const x = Math.round(centerX - halfWidth);
  const y = Math.round(baseY - height);
  ctx.fillRect(x, y + Math.round(height * 0.34), Math.round(halfWidth * 2), Math.round(height * 0.66));
  ctx.fillRect(Math.round(centerX - halfWidth * 0.72), y, Math.round(halfWidth * 1.44), Math.round(height * 0.48));
}

function getPhase(hour, cloudiness, weatherType) {
  if (hour >= 18.5 || hour < 5.25) return "night";
  if (weatherType === "cloudy" || weatherType === "drizzle" || weatherType === "rain" || weatherType === "heavyRain" || cloudiness > 0.76) return "cloudy";
  if (hour >= 17 && hour < 18.5) return "sunset";
  return "day";
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function getHoGuomPanoramaCacheSize() {
  return backgroundCache.size;
}
