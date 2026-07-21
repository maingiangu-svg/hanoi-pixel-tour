import { canvas, ctx, runtime, state } from "../state.js";
import { getNightStrength } from "./renderLighting.js";
import { getEventProgress, isEventActive } from "../systems/randomEvents.js";
import { isMoCompanionActive } from "../systems/moCompanion.js";
import { getActiveViewMode } from "../systems/viewMode.js";
import { getSurfaceWetness, getWeatherCloudiness, getWeatherIntensity, getWeatherType } from "../systems/weather.js";

const DAY_SKY = Object.freeze(["#b9d7dc", "#9fc5d1", "#83afbd"]);
const AFTERNOON_SKY = Object.freeze(["#e7c694", "#d7a878", "#b9856d"]);
const NIGHT_SKY = Object.freeze(["#18233d", "#202d49", "#2c3b56"]);
const CLOUD_SKY = Object.freeze(["#8c9ba4", "#7e8d97", "#6d7c86"]);
const PEOPLE_COLORS = Object.freeze(["#c75d46", "#e0b564", "#4f7890", "#758457", "#9a6179", "#d5844f"]);
const PIXEL_FONT = "'Courier New', monospace";

export function drawViewModeScene() {
  const view = getActiveViewMode();
  if (!view || runtime.cutscene?.active) return false;

  const width = canvas.width;
  const height = canvas.height;
  const hour = getHourOfDay();
  const night = getNightStrength(state.gameTime);
  const cloudiness = getWeatherCloudiness();
  const weatherIntensity = getWeatherIntensity();
  const wetness = getSurfaceWetness();
  const crowdFactor = getViewCrowdFactor(hour, weatherIntensity);
  const fovScale = 68 / Math.max(48, view.profile.fov);
  const pan = Math.round((view.yaw / view.profile.yawLimit) * width * 0.15 * fovScale);
  const horizon = Math.round(height * 0.43 + (view.pitch / view.profile.pitchLimit) * height * 0.075);
  const time = performance.now();

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawSky(width, height, horizon, hour, night, cloudiness, pan, time);

  if (view.profile.sceneType === "lake") {
    drawLakeScene(view.profile.variant, width, height, horizon, pan, night, wetness, time, hour, crowdFactor);
  } else if (view.profile.sceneType === "cathedral") {
    drawCathedralScene(width, height, horizon, pan, night, wetness, hour, time, crowdFactor);
  } else if (view.profile.sceneType === "baDinh") {
    drawBaDinhScene(view.profile.variant, width, height, horizon, pan, night, wetness, time, crowdFactor);
  } else if (view.profile.sceneType === "temple") {
    drawTempleScene(view.profile.variant, width, height, horizon, pan, night, wetness, time, crowdFactor);
  } else if (view.profile.sceneType === "longBien") {
    drawLongBienScene(view.profile.variant, width, height, horizon, pan, night, wetness, time);
  }

  drawWeatherOverlay(width, height, cloudiness, weatherIntensity, getWeatherType(), time);
  drawCompanion(view, width, height, night, time);
  if (!runtime.photoMode?.active) drawViewInterface(view, width, height, time);
  ctx.restore();
  return true;
}

function drawSky(width, height, horizon, hour, night, cloudiness, pan, time) {
  const colors = cloudiness > 0.72
    ? CLOUD_SKY
    : night > 0.48
      ? NIGHT_SKY
      : hour >= 15.5 && hour < 19
        ? AFTERNOON_SKY
        : DAY_SKY;
  const bandHeight = Math.max(1, Math.ceil(horizon / colors.length));
  for (let index = 0; index < colors.length; index += 1) {
    ctx.fillStyle = colors[index];
    ctx.fillRect(0, index * bandHeight, width, bandHeight + 1);
  }

  drawCloudLayer(width, horizon, pan * 0.18, time * 0.004, cloudiness, night, 0);
  drawCloudLayer(width, horizon, pan * 0.31, time * 0.007, cloudiness, night, 1);
  if (night > 0.56 && cloudiness < 0.78) drawNightDots(width, horizon, pan, night);
}

function drawCloudLayer(width, horizon, pan, drift, cloudiness, night, row) {
  const alpha = 0.1 + cloudiness * 0.32;
  const yBase = 70 + row * 86;
  const speedOffset = Math.round((drift + row * 137) % (width + 360));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = night > 0.45 ? "#8993a3" : "#eef0e6";
  for (let index = -1; index < 5; index += 1) {
    const x = Math.round(index * 340 - speedOffset + pan);
    const y = yBase + ((index * 19 + row * 31) % 42);
    if (y > horizon - 30) continue;
    ctx.fillRect(x, y, 190, 18);
    ctx.fillRect(x + 34, y - 16, 88, 16);
    ctx.fillRect(x + 70, y + 18, 156, 10);
  }
  ctx.globalAlpha = 1;
}

function drawNightDots(width, horizon, pan, night) {
  ctx.fillStyle = `rgba(255, 242, 190, ${0.28 + night * 0.35})`;
  for (let index = 0; index < 23; index += 1) {
    const x = mod(index * 173 + pan * 0.12, width);
    const y = 24 + mod(index * 47, Math.max(30, horizon - 90));
    ctx.fillRect(Math.round(x), Math.round(y), index % 4 === 0 ? 2 : 1, 1);
  }
}

function drawLakeScene(variant, width, height, horizon, pan, night, wetness, time, hour, crowdFactor) {
  drawLakeSkyline(width, horizon, pan * 0.36, night);
  drawLakeWater(width, height, horizon, pan, night, time);

  if (variant === "tower") {
    drawTurtleTower(width * 0.52 - pan * 0.76, horizon + 45, 2.05, night);
  } else if (variant === "redBridge") {
    drawTempleIsland(width * 0.79 - pan * 0.54, horizon + 10, night);
    drawTheHucBridge(width * 0.1 - pan * 0.92, horizon + 94, width * 0.82, night);
  } else {
    drawTurtleTower(width * 0.64 - pan * 0.67, horizon + 20, 1.38, night);
    drawTheHucBridge(width * 0.72 - pan * 0.46, horizon + 78, width * 0.34, night);
  }

  drawLakePromenade(width, height, horizon, pan, night, wetness, time, variant, hour, crowdFactor);
}

function drawLakeSkyline(width, horizon, pan, night) {
  ctx.fillStyle = night > 0.45 ? "#28313d" : "#677b78";
  ctx.fillRect(0, horizon - 78, width, 80);
  for (let index = -1; index < 14; index += 1) {
    const x = Math.round(index * 104 + pan);
    const buildingHeight = 36 + mod(index * 29, 58);
    const buildingWidth = 72 + mod(index * 17, 35);
    ctx.fillStyle = index % 3 === 0 ? "#6e6a61" : index % 3 === 1 ? "#766e61" : "#5d6968";
    ctx.fillRect(x, horizon - buildingHeight, buildingWidth, buildingHeight);
    if (night > 0.25) {
      ctx.fillStyle = `rgba(255, 212, 122, ${0.22 + night * 0.48})`;
      for (let wx = x + 12; wx < x + buildingWidth - 9; wx += 22) {
        if (mod(wx + index, 3) !== 0) ctx.fillRect(wx, horizon - buildingHeight + 13, 8, 6);
      }
    }
  }
  drawTreeLine(width, horizon - 22, pan * 0.65, night, 0.75);
}

function drawLakeWater(width, height, horizon, pan, night, time) {
  ctx.fillStyle = night > 0.42 ? "#244454" : "#477f88";
  ctx.fillRect(0, horizon, width, height - horizon);
  const tick = Math.floor(time / 160);
  for (let row = 0; row < 15; row += 1) {
    const y = horizon + 14 + row * 21;
    const segment = 34 + row * 5;
    for (let x = -segment; x < width + segment; x += segment * 2) {
      const offset = mod(tick * (row % 2 ? 2 : -1) + row * 37 + pan * 0.18, segment * 2);
      ctx.fillStyle = row % 3 === 0
        ? (night > 0.45 ? "rgba(111, 171, 180, 0.26)" : "rgba(199, 226, 211, 0.34)")
        : "rgba(19, 63, 75, 0.18)";
      ctx.fillRect(Math.round(x + offset), y, Math.round(segment * 0.72), row < 6 ? 2 : 3);
    }
  }
  if (night > 0.22) {
    for (let index = 0; index < 8; index += 1) {
      const x = mod(90 + index * 179 - pan * 0.28, width);
      const glow = 8 + index % 3 * 5;
      ctx.fillStyle = `rgba(255, 202, 96, ${0.12 + night * 0.2})`;
      ctx.fillRect(Math.round(x), horizon + 20, glow, 4);
      ctx.fillRect(Math.round(x + 3), horizon + 29, Math.max(3, glow - 6), 22 + index % 4 * 8);
    }
  }
}

function drawTurtleTower(x, baseY, scale, night) {
  const px = Math.round(x);
  const unit = Math.max(2, Math.round(scale * 4));
  ctx.fillStyle = "rgba(25, 42, 43, 0.25)";
  ctx.fillRect(px - unit * 10, baseY + unit * 5, unit * 20, unit * 2);
  ctx.fillStyle = night > 0.5 ? "#b7a273" : "#c7b890";
  ctx.fillRect(px - unit * 6, baseY - unit * 8, unit * 12, unit * 12);
  ctx.fillStyle = "#6c705e";
  ctx.fillRect(px - unit * 7, baseY - unit * 9, unit * 14, unit * 2);
  ctx.fillRect(px - unit * 5, baseY - unit * 15, unit * 10, unit * 7);
  ctx.fillStyle = "#4c5149";
  ctx.fillRect(px - unit * 6, baseY - unit * 16, unit * 12, unit * 2);
  ctx.fillRect(px - unit * 3, baseY - unit * 20, unit * 6, unit * 5);
  ctx.fillStyle = night > 0.25 ? "#f4c96f" : "#30474a";
  ctx.fillRect(px - unit * 3, baseY - unit * 12, unit * 2, unit * 3);
  ctx.fillRect(px + unit, baseY - unit * 12, unit * 2, unit * 3);
  ctx.fillRect(px - unit * 2, baseY - unit * 5, unit * 4, unit * 5);
}

function drawTheHucBridge(x, y, length, night) {
  const startX = Math.round(x);
  const endX = Math.round(x + length);
  ctx.strokeStyle = "#6e2027";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(startX, y + 22);
  ctx.quadraticCurveTo((startX + endX) / 2, y - 10, endX, y + 8);
  ctx.stroke();
  ctx.strokeStyle = "#d94b42";
  ctx.lineWidth = 6;
  ctx.stroke();
  for (let index = 0; index <= 12; index += 1) {
    const ratio = index / 12;
    const px = startX + length * ratio;
    const py = y + 22 - Math.sin(ratio * Math.PI) * 27 - ratio * 14;
    ctx.fillStyle = "#a62f31";
    ctx.fillRect(Math.round(px), Math.round(py - 17), 4, 20);
    if (night > 0.28 && index % 3 === 0) {
      ctx.fillStyle = `rgba(255, 214, 115, ${0.45 + night * 0.35})`;
      ctx.fillRect(Math.round(px - 2), Math.round(py - 20), 7, 4);
    }
  }
}

function drawTempleIsland(x, y, night) {
  drawTreeCanopy(x, y - 18, 1.5, night);
  ctx.fillStyle = "#774638";
  ctx.fillRect(Math.round(x - 48), y, 96, 28);
  ctx.fillStyle = night > 0.4 ? "#e6b966" : "#c89b58";
  ctx.fillRect(Math.round(x - 34), y + 8, 68, 16);
  ctx.fillStyle = "#552e2d";
  ctx.fillRect(Math.round(x - 56), y - 4, 112, 8);
}

function drawLakePromenade(width, height, horizon, pan, night, wetness, time, variant, hour, crowdFactor) {
  if (variant === "tower") return;
  const top = Math.round(height * 0.79);
  ctx.fillStyle = "#73756e";
  ctx.fillRect(0, top, width, height - top);
  ctx.fillStyle = "#a89f8c";
  ctx.fillRect(0, top, width, 13);
  for (let y = top + 24; y < height; y += 26) {
    ctx.fillStyle = y % 52 === 0 ? "#686a64" : "#7d7c73";
    ctx.fillRect(0, y, width, 2);
  }
  drawRailing(0, top - 24, width, night);
  const baseCount = hour >= 16 && hour < 22 ? 9 : hour >= 22 || hour < 5 ? 3 : 6;
  drawPeopleRow(width, top + 20, pan * 0.26, night, time, scaledCount(baseCount, crowdFactor));
  if (wetness > 0.22) drawWetGroundReflections(width, top + 12, height, wetness, night, time);
}

function drawCathedralScene(width, height, horizon, pan, night, wetness, hour, time, crowdFactor) {
  drawOldQuarterSides(width, horizon, pan * 0.36, night);
  drawPerspectivePaving(width, height, horizon + 48, pan, wetness, "#80766d", "#978b7c");
  drawCathedral(width / 2 - pan * 0.92, horizon + 186, 1.22, night);
  const massTime = hour >= 17.5 && hour < 19.5;
  drawPeopleRow(width, horizon + 225, pan * 0.36, night, time, scaledCount(massTime ? 13 : 7, crowdFactor));
  drawStreetLamp(124 - pan * 0.58, horizon + 182, 1.05, night);
  drawStreetLamp(width - 124 - pan * 0.58, horizon + 182, 1.05, night);
  if (wetness > 0.22) drawWetGroundReflections(width, horizon + 205, height, wetness, night, time);
}

function drawOldQuarterSides(width, horizon, pan, night) {
  for (let side = 0; side < 2; side += 1) {
    const direction = side === 0 ? -1 : 1;
    for (let index = 0; index < 4; index += 1) {
      const buildingWidth = 116 + index * 18;
      const buildingHeight = 100 + index * 32;
      const x = side === 0
        ? -28 + index * 62 + pan
        : width - buildingWidth + 28 - index * 62 + pan;
      const y = horizon - buildingHeight + 88;
      ctx.fillStyle = index % 2 ? "#88725f" : "#746b5f";
      ctx.fillRect(Math.round(x), y, buildingWidth, buildingHeight);
      ctx.fillStyle = "#3e4b4d";
      for (let row = 0; row < 3; row += 1) {
        ctx.fillRect(Math.round(x + 18), y + 18 + row * 25, 22, 13);
        if (night > 0.2 && mod(index + row + side, 3) !== 0) {
          ctx.fillStyle = `rgba(255, 207, 112, ${0.35 + night * 0.45})`;
          ctx.fillRect(Math.round(x + 20), y + 20 + row * 25, 18, 9);
          ctx.fillStyle = "#3e4b4d";
        }
      }
      ctx.fillStyle = direction < 0 ? "#a23d33" : "#c18a48";
      ctx.fillRect(Math.round(x + 8), y + buildingHeight - 28, buildingWidth - 16, 14);
    }
  }
}

function drawCathedral(centerX, baseY, scale, night) {
  const unit = Math.max(3, Math.round(4 * scale));
  const x = Math.round(centerX);
  const facade = night > 0.45 ? "#80796c" : "#9d978a";
  const edge = night > 0.45 ? "#555750" : "#696b63";
  ctx.fillStyle = edge;
  ctx.fillRect(x - unit * 34, baseY - unit * 47, unit * 68, unit * 47);
  ctx.fillStyle = facade;
  ctx.fillRect(x - unit * 31, baseY - unit * 44, unit * 62, unit * 42);
  ctx.fillRect(x - unit * 30, baseY - unit * 68, unit * 16, unit * 28);
  ctx.fillRect(x + unit * 14, baseY - unit * 68, unit * 16, unit * 28);
  ctx.fillStyle = edge;
  ctx.fillRect(x - unit * 32, baseY - unit * 70, unit * 20, unit * 5);
  ctx.fillRect(x + unit * 12, baseY - unit * 70, unit * 20, unit * 5);
  ctx.fillRect(x - unit * 28, baseY - unit * 78, unit * 12, unit * 9);
  ctx.fillRect(x + unit * 16, baseY - unit * 78, unit * 12, unit * 9);
  ctx.fillStyle = "#303331";
  ctx.fillRect(x - unit * 24, baseY - unit * 59, unit * 5, unit * 9);
  ctx.fillRect(x + unit * 19, baseY - unit * 59, unit * 5, unit * 9);
  ctx.fillStyle = night > 0.2 ? "#f0c46f" : "#4b5553";
  drawPixelArch(x - unit * 21.5, baseY - unit * 54, unit * 6, unit * 11);
  drawPixelArch(x + unit * 21.5, baseY - unit * 54, unit * 6, unit * 11);
  ctx.fillStyle = "#4b3730";
  drawPixelArch(x, baseY - unit * 27, unit * 13, unit * 24);
  ctx.fillStyle = "#76634d";
  for (let step = 0; step < 5; step += 1) {
    ctx.fillRect(x - unit * (35 + step * 3), baseY + step * unit * 2, unit * (70 + step * 6), unit * 2);
  }
  if (night > 0.15) {
    ctx.fillStyle = `rgba(255, 205, 102, ${0.08 + night * 0.16})`;
    ctx.fillRect(x - unit * 29, baseY - unit * 39, unit * 58, unit * 8);
    ctx.fillRect(x - unit * 38, baseY + unit * 8, unit * 76, unit * 5);
  }
}

function drawBaDinhScene(variant, width, height, horizon, pan, night, wetness, time, crowdFactor) {
  drawTreeLine(width, horizon - 12, pan * 0.28, night, 1.05);
  const close = variant === "mausoleum";
  drawMausoleum(width / 2 - pan * 0.76, horizon + (close ? 150 : 104), close ? 1.45 : 1.05, night);
  drawBaDinhGround(width, height, horizon + 100, pan, close, wetness);
  drawFlagRows(width, horizon + 122, pan, night, time);
  drawOrderedVisitors(width, horizon + (close ? 230 : 250), pan, night, time, scaledCount(close ? 6 : 9, crowdFactor * 0.72));
}

function drawMausoleum(centerX, baseY, scale, night) {
  const unit = Math.max(3, Math.round(scale * 4));
  const x = Math.round(centerX);
  ctx.fillStyle = night > 0.45 ? "#6d7374" : "#9b9b8d";
  ctx.fillRect(x - unit * 43, baseY - unit * 27, unit * 86, unit * 27);
  ctx.fillStyle = night > 0.45 ? "#858a86" : "#b4b0a0";
  ctx.fillRect(x - unit * 36, baseY - unit * 39, unit * 72, unit * 13);
  ctx.fillStyle = "#555b58";
  ctx.fillRect(x - unit * 39, baseY - unit * 42, unit * 78, unit * 4);
  ctx.fillStyle = "#6b6c61";
  for (let index = -4; index <= 4; index += 1) {
    ctx.fillRect(x + index * unit * 8 - unit * 2, baseY - unit * 26, unit * 4, unit * 24);
  }
  ctx.fillStyle = night > 0.2 ? "#d9b46b" : "#55584f";
  ctx.fillRect(x - unit * 18, baseY - unit * 35, unit * 36, unit * 3);
}

function drawBaDinhGround(width, height, top, pan, close, wetness) {
  ctx.fillStyle = "#77796e";
  ctx.fillRect(0, top, width, height - top);
  const center = width / 2 - pan * 0.25;
  ctx.fillStyle = "#586d4f";
  for (let index = -5; index <= 5; index += 2) {
    const nearWidth = close ? 78 : 105;
    ctx.fillRect(Math.round(center + index * nearWidth - nearWidth * 0.42), top + 14, Math.round(nearWidth * 0.78), height - top);
  }
  ctx.fillStyle = "rgba(221, 215, 190, 0.28)";
  for (let y = top + 28; y < height; y += 42) ctx.fillRect(0, y, width, 2);
  if (wetness > 0.3) {
    ctx.fillStyle = `rgba(102, 136, 151, ${wetness * 0.16})`;
    ctx.fillRect(0, top + 8, width, height - top - 8);
  }
}

function drawFlagRows(width, y, pan, night, time) {
  const wave = Math.floor(time / 220) % 2;
  for (let index = 0; index < 10; index += 1) {
    const x = Math.round(70 + index * (width - 140) / 9 - pan * 0.35);
    ctx.fillStyle = "#4e504a";
    ctx.fillRect(x, y - 55, 3, 62);
    ctx.fillStyle = night > 0.55 ? "#9e332e" : "#d74736";
    ctx.fillRect(x + 3, y - 53, 20 + wave * 3, 12);
    ctx.fillStyle = "#f1d25d";
    ctx.fillRect(x + 10, y - 49, 4, 4);
  }
}

function drawOrderedVisitors(width, y, pan, night, time, count) {
  for (let index = 0; index < count; index += 1) {
    const x = 170 + index * ((width - 340) / Math.max(1, count - 1)) - pan * 0.18;
    drawBillboardPerson(x, y + mod(index, 2) * 12, 0.78, PEOPLE_COLORS[index % PEOPLE_COLORS.length], night, time, index);
  }
}

function drawTempleScene(variant, width, height, horizon, pan, night, wetness, time, crowdFactor) {
  drawTempleWalls(width, horizon + 72, pan * 0.42, night);
  drawPerspectivePaving(width, height, horizon + 92, pan, wetness, "#90735f", "#a1846b");
  drawTreeCanopy(126 - pan * 0.38, horizon + 30, 2.25, night);
  drawTreeCanopy(width - 126 - pan * 0.38, horizon + 18, 2.05, night);
  if (variant === "khueVan") {
    drawKhueVan(width / 2 - pan * 0.92, horizon + 196, 1.42, night);
  } else {
    drawTempleGate(width / 2 - pan * 0.88, horizon + 188, 1.36, night);
  }
  drawPeopleRow(width, horizon + 246, pan * 0.24, night, time, scaledCount(6, crowdFactor * (night > 0.55 ? 0.4 : 1)));
}

function drawTempleWalls(width, y, pan, night) {
  ctx.fillStyle = night > 0.48 ? "#684238" : "#944b3d";
  ctx.fillRect(0, y - 72, width, 78);
  ctx.fillStyle = "#4f3731";
  ctx.fillRect(0, y - 78, width, 10);
  for (let x = -60 + pan; x < width; x += 92) {
    ctx.fillStyle = night > 0.48 ? "#936b4d" : "#b68a61";
    ctx.fillRect(Math.round(x), y - 66, 3, 61);
  }
}

function drawTempleGate(centerX, baseY, scale, night) {
  const unit = Math.max(3, Math.round(scale * 4));
  const x = Math.round(centerX);
  ctx.fillStyle = night > 0.45 ? "#9a7552" : "#c29b69";
  ctx.fillRect(x - unit * 31, baseY - unit * 31, unit * 62, unit * 31);
  ctx.fillStyle = "#50332f";
  ctx.fillRect(x - unit * 36, baseY - unit * 35, unit * 72, unit * 6);
  ctx.fillRect(x - unit * 29, baseY - unit * 43, unit * 58, unit * 9);
  ctx.fillStyle = "#452d2b";
  drawPixelArch(x, baseY - unit * 19, unit * 12, unit * 19);
  drawPixelArch(x - unit * 21, baseY - unit * 16, unit * 7, unit * 16);
  drawPixelArch(x + unit * 21, baseY - unit * 16, unit * 7, unit * 16);
  ctx.fillStyle = "#d3b36e";
  ctx.fillRect(x - unit * 11, baseY - unit * 40, unit * 22, unit * 5);
}

function drawKhueVan(centerX, baseY, scale, night) {
  const unit = Math.max(3, Math.round(scale * 4));
  const x = Math.round(centerX);
  ctx.fillStyle = "#765242";
  ctx.fillRect(x - unit * 23, baseY - unit * 24, unit * 7, unit * 24);
  ctx.fillRect(x + unit * 16, baseY - unit * 24, unit * 7, unit * 24);
  ctx.fillStyle = night > 0.45 ? "#9e5f45" : "#c06b4c";
  ctx.fillRect(x - unit * 27, baseY - unit * 43, unit * 54, unit * 20);
  ctx.fillStyle = "#4e3331";
  ctx.fillRect(x - unit * 32, baseY - unit * 48, unit * 64, unit * 6);
  ctx.fillRect(x - unit * 25, baseY - unit * 54, unit * 50, unit * 7);
  ctx.fillStyle = night > 0.3 ? "#e4ba68" : "#d5bd84";
  ctx.fillRect(x - unit * 15, baseY - unit * 39, unit * 30, unit * 11);
  ctx.fillStyle = "#6f3433";
  ctx.fillRect(x - unit * 6, baseY - unit * 39, unit * 12, unit * 11);
  ctx.fillStyle = "#8c664c";
  ctx.fillRect(x - unit * 28, baseY, unit * 56, unit * 4);
}

function drawLongBienScene(variant, width, height, horizon, pan, night, wetness, time) {
  if (variant === "river") {
    drawRiverScene(width, height, horizon, pan, night, time);
    return;
  }
  drawFarRiverBank(width, horizon, pan * 0.2, night);
  drawRiverSurface(width, height, horizon, pan, night, time);
  drawBridgeDeck(width, height, horizon + 68, pan, wetness);
  drawSteelTrusses(width, height, horizon + 40, pan, night);
  drawBridgeLamps(width, horizon + 95, pan, night);
  drawBridgeTraffic(width, horizon + 196, pan, night, time);
  if (isEventActive("longBienTrainPass")) drawPassingTrain(width, horizon + 125, pan, night);
}

function drawRiverScene(width, height, horizon, pan, night, time) {
  drawFarRiverBank(width, horizon, pan * 0.24, night);
  drawRiverSurface(width, height, horizon, pan, night, time);
  ctx.strokeStyle = night > 0.45 ? "#363c43" : "#555d5c";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(-100 - pan * 0.35, horizon - 20);
  ctx.lineTo(width * 0.76 - pan * 0.35, horizon + 48);
  ctx.stroke();
  for (let index = 0; index < 9; index += 1) {
    const x = index * width / 8 - pan * 0.35;
    const y = horizon - 20 + index * 8;
    ctx.strokeStyle = "#45484a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 34);
    ctx.lineTo(x + 70, y + 18);
    ctx.lineTo(x + 2, y + 14);
    ctx.stroke();
  }
  drawRailing(0, height - 120, width, night);
}

function drawFarRiverBank(width, horizon, pan, night) {
  ctx.fillStyle = night > 0.45 ? "#3e4b4c" : "#6a8173";
  ctx.fillRect(0, horizon - 42, width, 45);
  for (let index = -1; index < 17; index += 1) {
    const x = Math.round(index * 86 + pan);
    const height = 18 + mod(index * 23, 45);
    ctx.fillStyle = index % 2 ? "#686d68" : "#79766d";
    ctx.fillRect(x, horizon - height, 66, height);
    if (night > 0.35 && index % 3 !== 0) {
      ctx.fillStyle = `rgba(255, 210, 119, ${0.27 + night * 0.38})`;
      ctx.fillRect(x + 12, horizon - height + 11, 8, 5);
    }
  }
}

function drawRiverSurface(width, height, horizon, pan, night, time) {
  ctx.fillStyle = night > 0.45 ? "#314b59" : "#667f83";
  ctx.fillRect(0, horizon, width, height - horizon);
  const tick = Math.floor(time / 150);
  for (let row = 0; row < 16; row += 1) {
    const y = horizon + 14 + row * 22;
    const shift = mod(tick * (row % 2 ? 3 : -2) + pan * 0.14, 92);
    ctx.fillStyle = row % 2 ? "rgba(198, 211, 196, 0.19)" : "rgba(34, 63, 70, 0.22)";
    for (let x = -100; x < width + 100; x += 132) ctx.fillRect(Math.round(x + shift), y, 62 + row * 2, row < 7 ? 2 : 3);
  }
}

function drawBridgeDeck(width, height, top, pan, wetness) {
  ctx.fillStyle = "#4b4d4b";
  ctx.beginPath();
  ctx.moveTo(width * 0.28 - pan * 0.32, top);
  ctx.lineTo(width * 0.72 - pan * 0.32, top);
  ctx.lineTo(width + 100, height);
  ctx.lineTo(-100, height);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#272a2b";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(width * 0.43 - pan * 0.4, top);
  ctx.lineTo(width * 0.3, height);
  ctx.moveTo(width * 0.57 - pan * 0.4, top);
  ctx.lineTo(width * 0.7, height);
  ctx.stroke();
  ctx.strokeStyle = "#8b7861";
  ctx.lineWidth = 4;
  for (let index = 0; index < 14; index += 1) {
    const ratio = index / 13;
    const y = top + Math.pow(ratio, 1.6) * (height - top);
    const half = width * (0.07 + ratio * 0.27);
    ctx.beginPath();
    ctx.moveTo(width / 2 - half - pan * (1 - ratio) * 0.4, y);
    ctx.lineTo(width / 2 + half - pan * (1 - ratio) * 0.4, y);
    ctx.stroke();
  }
  if (wetness > 0.22) {
    ctx.fillStyle = `rgba(122, 156, 164, ${wetness * 0.18})`;
    ctx.fillRect(width * 0.31, height * 0.72, width * 0.38, height * 0.22);
  }
}

function drawSteelTrusses(width, height, top, pan, night) {
  const color = night > 0.48 ? "#34383d" : "#59615f";
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  for (let side = 0; side < 2; side += 1) {
    const sign = side === 0 ? -1 : 1;
    const nearX = width / 2 + sign * width * 0.42;
    const farX = width / 2 + sign * width * 0.16 - pan * 0.48;
    ctx.beginPath();
    ctx.moveTo(nearX, height);
    ctx.lineTo(farX, top - 110);
    ctx.lineTo(width / 2 + sign * width * 0.08 - pan * 0.5, top);
    ctx.stroke();
    for (let index = 0; index < 6; index += 1) {
      const ratio = index / 5;
      const x1 = farX + (nearX - farX) * ratio;
      const y1 = top - 90 + (height - top + 90) * ratio;
      const x2 = width / 2 + sign * width * (0.09 + ratio * 0.33);
      const y2 = top + 25 + (height - top - 25) * ratio;
      ctx.lineWidth = Math.max(3, Math.round(7 * ratio));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
}

function drawBridgeLamps(width, y, pan, night) {
  for (let index = 0; index < 7; index += 1) {
    const ratio = index / 6;
    const x = width * 0.22 + ratio * width * 0.56 - pan * (0.62 - ratio * 0.22);
    const scale = 0.45 + ratio * 0.42;
    drawStreetLamp(x, y + ratio * 82, scale, night);
  }
}

function drawBridgeTraffic(width, y, pan, night, time) {
  const offset = mod(time * 0.035, width + 300) - 150;
  drawMotorbike(offset - pan * 0.2, y + 46, 0.65, "#c84d3d", night);
  drawMotorbike(width - offset * 0.7 - pan * 0.12, y + 76, 0.82, "#4c7b91", night);
}

function drawPassingTrain(width, y, pan, night) {
  const progress = getEventProgress("longBienTrainPass");
  const x = -width * 0.55 + progress * width * 2.05 - pan * 0.4;
  ctx.fillStyle = night > 0.5 ? "#6f443d" : "#9b5847";
  for (let car = 0; car < 5; car += 1) {
    const carX = Math.round(x - car * 152);
    ctx.fillRect(carX, y, 142, 46);
    ctx.fillStyle = night > 0.35 ? "#efc66f" : "#81989a";
    for (let windowIndex = 0; windowIndex < 5; windowIndex += 1) ctx.fillRect(carX + 12 + windowIndex * 25, y + 10, 15, 12);
    ctx.fillStyle = night > 0.5 ? "#6f443d" : "#9b5847";
    ctx.fillStyle = "#2d3032";
    ctx.fillRect(carX + 15, y + 42, 22, 7);
    ctx.fillRect(carX + 106, y + 42, 22, 7);
    ctx.fillStyle = night > 0.5 ? "#6f443d" : "#9b5847";
  }
}

function drawPerspectivePaving(width, height, top, pan, wetness, dark, light) {
  ctx.fillStyle = dark;
  ctx.fillRect(0, top, width, height - top);
  for (let row = 0; row < 10; row += 1) {
    const ratio = row / 9;
    const y = top + Math.pow(ratio, 1.55) * (height - top);
    ctx.fillStyle = row % 2 ? light : "rgba(50, 43, 39, 0.35)";
    ctx.fillRect(0, Math.round(y), width, row < 5 ? 2 : 3);
  }
  ctx.strokeStyle = "rgba(62, 53, 48, 0.34)";
  ctx.lineWidth = 2;
  for (let index = -7; index <= 7; index += 1) {
    ctx.beginPath();
    ctx.moveTo(width / 2 - pan * 0.15 + index * 26, top);
    ctx.lineTo(width / 2 + index * 112, height);
    ctx.stroke();
  }
  if (wetness > 0.22) drawWetGroundReflections(width, top, height, wetness, 0.6, performance.now());
}

function drawTreeLine(width, y, pan, night, scale) {
  for (let index = -1; index < 12; index += 1) {
    const x = index * 122 + pan;
    drawTreeCanopy(x, y, scale + mod(index, 3) * 0.08, night);
  }
}

function drawTreeCanopy(x, y, scale, night) {
  const unit = Math.max(2, Math.round(scale * 5));
  ctx.fillStyle = "#493f34";
  ctx.fillRect(Math.round(x - unit), Math.round(y), unit * 2, unit * 8);
  ctx.fillStyle = night > 0.5 ? "#28483f" : "#47705a";
  ctx.fillRect(Math.round(x - unit * 6), Math.round(y - unit * 5), unit * 12, unit * 7);
  ctx.fillRect(Math.round(x - unit * 4), Math.round(y - unit * 8), unit * 8, unit * 5);
  ctx.fillStyle = night > 0.5 ? "#315447" : "#5a8063";
  ctx.fillRect(Math.round(x - unit * 5), Math.round(y - unit * 6), unit * 4, unit * 3);
  ctx.fillRect(Math.round(x + unit), Math.round(y - unit * 7), unit * 4, unit * 3);
}

function drawPeopleRow(width, y, pan, night, time, count) {
  for (let index = 0; index < count; index += 1) {
    const spacing = width / (count + 1);
    const x = spacing * (index + 1) - pan + Math.sin(index * 2.4) * 20;
    const depth = 0.7 + mod(index * 17, 5) * 0.06;
    drawBillboardPerson(x, y + mod(index * 13, 3) * 14, depth, PEOPLE_COLORS[index % PEOPLE_COLORS.length], night, time, index);
    if (index % 4 === 2) drawBillboardPerson(x + 18, y + 4, depth * 0.96, PEOPLE_COLORS[(index + 2) % PEOPLE_COLORS.length], night, time, index + 17);
  }
}

function drawBillboardPerson(x, y, scale, coat, night, time, seed) {
  const bob = Math.round(Math.sin(time / 480 + seed * 1.7) * 1.2);
  const unit = Math.max(2, Math.round(scale * 4));
  const px = Math.round(x);
  const py = Math.round(y + bob);
  ctx.fillStyle = "rgba(22, 25, 27, 0.26)";
  ctx.fillRect(px - unit * 3, py + unit * 9, unit * 6, unit * 2);
  ctx.fillStyle = "#3d302c";
  ctx.fillRect(px - unit * 2, py, unit * 4, unit * 4);
  ctx.fillStyle = night > 0.56 ? dimColor(coat) : coat;
  ctx.fillRect(px - unit * 3, py + unit * 4, unit * 6, unit * 7);
  ctx.fillStyle = "#3b3b40";
  ctx.fillRect(px - unit * 2, py + unit * 11, unit * 2, unit * 5);
  ctx.fillRect(px + unit * 0.5, py + unit * 11, unit * 2, unit * 5);
}

function drawMotorbike(x, y, scale, color, night) {
  const unit = Math.max(2, Math.round(scale * 4));
  const px = Math.round(x);
  ctx.fillStyle = "#25282a";
  ctx.fillRect(px - unit * 6, y + unit * 4, unit * 4, unit * 4);
  ctx.fillRect(px + unit * 4, y + unit * 4, unit * 4, unit * 4);
  ctx.fillStyle = night > 0.5 ? dimColor(color) : color;
  ctx.fillRect(px - unit * 4, y, unit * 10, unit * 5);
  ctx.fillStyle = "#42342f";
  ctx.fillRect(px - unit, y - unit * 5, unit * 4, unit * 5);
  ctx.fillStyle = "#d9aa82";
  ctx.fillRect(px, y - unit * 8, unit * 3, unit * 3);
  if (night > 0.25) {
    ctx.fillStyle = `rgba(255, 226, 148, ${0.45 + night * 0.35})`;
    ctx.fillRect(px + unit * 6, y + unit, unit * 3, unit * 2);
  }
}

function drawRailing(x, y, width, night) {
  ctx.fillStyle = night > 0.5 ? "#343d40" : "#5a6663";
  ctx.fillRect(x, y, width, 6);
  ctx.fillRect(x, y + 21, width, 4);
  for (let post = x; post < x + width; post += 48) ctx.fillRect(post, y - 5, 5, 37);
}

function drawStreetLamp(x, y, scale, night) {
  const unit = Math.max(2, Math.round(scale * 4));
  ctx.fillStyle = "#353c3c";
  ctx.fillRect(Math.round(x - unit), y - unit * 18, unit * 2, unit * 20);
  ctx.fillRect(Math.round(x - unit * 3), y - unit * 19, unit * 6, unit * 2);
  ctx.fillStyle = night > 0.12 ? "#ffe09a" : "#b8c6bd";
  ctx.fillRect(Math.round(x - unit * 2), y - unit * 23, unit * 4, unit * 4);
  if (night > 0.08) {
    ctx.fillStyle = `rgba(255, 210, 112, ${0.05 + night * 0.12})`;
    ctx.fillRect(Math.round(x - unit * 8), y - unit * 18, unit * 16, unit * 10);
    ctx.fillRect(Math.round(x - unit * 11), y - unit * 8, unit * 22, unit * 3);
  }
}

function drawWetGroundReflections(width, top, height, wetness, night, time) {
  const flicker = Math.floor(time / 420) % 3;
  for (let index = 0; index < 9; index += 1) {
    const x = mod(66 + index * 157, width);
    const y = top + 25 + mod(index * 41, Math.max(30, height - top - 30));
    ctx.fillStyle = index % 2
      ? `rgba(255, 190, 83, ${wetness * (0.12 + night * 0.12)})`
      : `rgba(104, 166, 189, ${wetness * 0.14})`;
    ctx.fillRect(Math.round(x), Math.round(y), 8 + mod(index + flicker, 4) * 5, 3);
    ctx.fillRect(Math.round(x + 4), Math.round(y + 6), 4 + mod(index, 3) * 3, 8 + mod(index, 4) * 4);
  }
}

function drawWeatherOverlay(width, height, cloudiness, intensity, type, time) {
  if (cloudiness > 0.18) {
    ctx.fillStyle = `rgba(37, 48, 59, ${cloudiness * 0.08})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (intensity <= 0.035) return;

  const count = type === "heavyRain" ? 150 : type === "rain" ? 92 : 42;
  const tick = time * (type === "heavyRain" ? 0.48 : type === "rain" ? 0.34 : 0.21);
  ctx.fillStyle = type === "heavyRain" ? "rgba(207, 227, 237, 0.62)" : "rgba(214, 231, 236, 0.48)";
  for (let index = 0; index < count; index += 1) {
    const x = mod(index * 83 + tick * 0.55, width + 60) - 30;
    const y = mod(index * 127 + tick, height + 50) - 25;
    const length = type === "heavyRain" ? 15 + mod(index, 4) * 3 : type === "rain" ? 10 : 5;
    ctx.fillRect(Math.round(x), Math.round(y), intensity > 0.65 ? 2 : 1, length);
    if (index % 12 === 0 && y > height * 0.68) ctx.fillRect(Math.round(x - 5), Math.round(y + length), 11, 2);
  }
  if (type === "heavyRain") {
    ctx.fillStyle = "rgba(21, 31, 45, 0.08)";
    ctx.fillRect(0, 0, width, height);
  }
}

function drawCompanion(view, width, height, night, time) {
  if (!isMoCompanionActive()) return;
  const x = Math.round(width * 0.84 + view.yaw * 0.55);
  const y = Math.round(height * 0.72);
  const bob = Math.round(Math.sin(time / 620) * 1.2);
  ctx.fillStyle = "rgba(17, 20, 23, 0.32)";
  ctx.fillRect(x - 44, y + 116, 94, 10);
  ctx.fillStyle = night > 0.55 ? "#5d3e48" : "#96566a";
  ctx.fillRect(x - 27, y + 45 + bob, 60, 78);
  ctx.fillStyle = "#3b2b2d";
  ctx.fillRect(x - 31, y - 1 + bob, 68, 54);
  ctx.fillRect(x - 38, y + 22 + bob, 12, 58);
  ctx.fillRect(x + 32, y + 22 + bob, 12, 58);
  ctx.fillStyle = "#ddb18f";
  ctx.fillRect(x - 21, y + 12 + bob, 44, 38);
  ctx.fillStyle = "#2f2b2e";
  ctx.fillRect(x - 12, y + 25 + bob, 5, 4);
  ctx.fillRect(x + 9, y + 25 + bob, 5, 4);

  if (view.elapsedMs > 900 && view.elapsedMs < 6500 && !runtime.photoMode?.active) {
    const alpha = Math.min(1, (view.elapsedMs - 900) / 350, (6500 - view.elapsedMs) / 450);
    drawCompanionCaption(view.profile.companionLine, width, height, alpha);
  }
}

function drawCompanionCaption(text, width, height, alpha) {
  const panelWidth = Math.min(520, width - 120);
  const x = Math.round((width - panelWidth) / 2);
  const y = height - 130;
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = "rgba(17, 18, 22, 0.9)";
  ctx.fillRect(x - 3, y - 3, panelWidth + 6, 43);
  ctx.fillStyle = "#fff4cf";
  ctx.fillRect(x, y, panelWidth, 37);
  ctx.fillStyle = "#1b1b1d";
  ctx.font = `700 13px ${PIXEL_FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(`Mơ: “${text}”`, width / 2, y + 23);
  ctx.globalAlpha = 1;
}

function drawViewInterface(view, width, height, time) {
  const pulse = 0.68 + Math.sin(time / 360) * 0.12;
  ctx.fillStyle = "rgba(10, 13, 18, 0.26)";
  ctx.fillRect(0, 0, width, 28);
  ctx.fillRect(0, height - 34, width, 34);

  drawFrameCorners(width, height);
  const centerX = Math.round(width / 2);
  const centerY = Math.round(height / 2);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = "#fff2bf";
  ctx.fillRect(centerX - 10, centerY, 21, 2);
  ctx.fillRect(centerX, centerY - 10, 2, 21);
  ctx.globalAlpha = 1;

  const labelWidth = Math.min(520, Math.max(250, view.profile.label.length * 9 + 42));
  const labelX = Math.round((width - labelWidth) / 2);
  ctx.fillStyle = "rgba(15, 18, 22, 0.88)";
  ctx.fillRect(labelX - 3, 18, labelWidth + 6, 35);
  ctx.fillStyle = "#f2d78b";
  ctx.fillRect(labelX, 21, labelWidth, 29);
  ctx.fillStyle = "#17191c";
  ctx.textAlign = "center";
  ctx.font = `900 14px ${PIXEL_FONT}`;
  ctx.fillText(view.profile.label, width / 2, 40);

  ctx.fillStyle = "#f7efd6";
  ctx.font = `700 11px ${PIXEL_FONT}`;
  ctx.fillText("A/D hoặc ←/→: nhìn ngang · W/S: nhìn dọc · P: chụp · E/Esc: thoát", width / 2, height - 12);
}

function drawFrameCorners(width, height) {
  const inset = 18;
  const length = 34;
  ctx.fillStyle = "rgba(255, 240, 186, 0.72)";
  ctx.fillRect(inset, inset, length, 3);
  ctx.fillRect(inset, inset, 3, length);
  ctx.fillRect(width - inset - length, inset, length, 3);
  ctx.fillRect(width - inset - 3, inset, 3, length);
  ctx.fillRect(inset, height - inset - 3, length, 3);
  ctx.fillRect(inset, height - inset - length, 3, length);
  ctx.fillRect(width - inset - length, height - inset - 3, length, 3);
  ctx.fillRect(width - inset - 3, height - inset - length, 3, length);
}

function drawPixelArch(centerX, baseY, halfWidth, height) {
  const x = Math.round(centerX - halfWidth);
  const y = Math.round(baseY - height);
  ctx.fillRect(x, y + Math.round(height * 0.36), Math.round(halfWidth * 2), Math.round(height * 0.64));
  ctx.fillRect(Math.round(centerX - halfWidth * 0.72), y, Math.round(halfWidth * 1.44), Math.round(height * 0.5));
}

function getHourOfDay() {
  const total = Number(state.gameTime?.totalGameMinutes) || 0;
  return mod(total, 1440) / 60;
}

function getViewCrowdFactor(hour, weatherIntensity) {
  const timeFactor = hour >= 22 || hour < 5 ? 0.34 : hour >= 16 && hour < 21.5 ? 1.18 : 0.88;
  const weatherFactor = weatherIntensity >= 0.78 ? 0.24 : weatherIntensity >= 0.42 ? 0.48 : weatherIntensity >= 0.1 ? 0.76 : 1;
  return timeFactor * weatherFactor;
}

function scaledCount(baseCount, factor) {
  return Math.max(1, Math.round(baseCount * factor));
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function dimColor(color) {
  const value = color.replace("#", "");
  const r = Math.round(parseInt(value.slice(0, 2), 16) * 0.72);
  const g = Math.round(parseInt(value.slice(2, 4), 16) * 0.72);
  const b = Math.round(parseInt(value.slice(4, 6), 16) * 0.78);
  return `rgb(${r}, ${g}, ${b})`;
}
