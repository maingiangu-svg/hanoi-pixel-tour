import { canvas, ctx, state } from "../state.js";
import { getCurrentWeather } from "../systems/weather.js";

const BACKGROUND_SCALE = 4;
let backgroundCanvas = null;
let backgroundContext = null;
let cachedKey = "";

export function drawDialogueBackground(view, timestamp = performance.now()) {
  ensureBackground(view);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(backgroundCanvas, 0, 0, canvas.width, canvas.height);
  drawLivingAccents(view, timestamp);
  drawWeather(view, timestamp);
  drawFocusWash(view);
  ctx.restore();
}

export function clearDialogueBackgroundCache() {
  backgroundCanvas = null;
  backgroundContext = null;
  cachedKey = "";
}

export function getDialogueBackgroundDebugState() {
  return { cached: Boolean(backgroundCanvas), key: cachedKey };
}

function ensureBackground(view) {
  const hourBand = getHourBand();
  const mapId = view.mapId || state.currentMapId;
  const profileId = view.profileId || "unknown";
  const scene = resolveScene(view);
  const key = `${mapId}:${profileId}:${scene}:${hourBand}:${canvas.width}x${canvas.height}`;
  if (backgroundCanvas && cachedKey === key) return;

  backgroundCanvas ||= document.createElement("canvas");
  backgroundCanvas.width = Math.max(1, Math.floor(canvas.width / BACKGROUND_SCALE));
  backgroundCanvas.height = Math.max(1, Math.floor(canvas.height / BACKGROUND_SCALE));
  backgroundContext = backgroundCanvas.getContext("2d");
  backgroundContext.imageSmoothingEnabled = false;
  drawStaticScene(backgroundContext, backgroundCanvas.width, backgroundCanvas.height, scene, hourBand, mapId);
  cachedKey = key;
}

function drawStaticScene(target, width, height, scene, hourBand, mapId) {
  const palette = getPalette(hourBand);
  target.clearRect(0, 0, width, height);
  target.fillStyle = palette.sky;
  target.fillRect(0, 0, width, height);
  drawSky(target, width, height, palette, hourBand);

  if (scene === "lake") drawLake(target, width, height, palette);
  else if (scene === "teaStall") drawTeaStall(target, width, height, palette);
  else if (scene === "street") drawStreet(target, width, height, palette);
  else if (scene === "churchInterior") drawChurchInterior(target, width, height, palette);
  else if (scene === "churchExterior") drawChurchExterior(target, width, height, palette);
  else if (scene === "longBien") drawLongBien(target, width, height, palette);
  else if (scene === "temple") drawTemple(target, width, height, palette);
  else drawCourtyard(target, width, height, palette, mapId);
}

function drawSky(target, width, height, palette, hourBand) {
  target.fillStyle = palette.skyBand;
  target.fillRect(0, Math.floor(height * 0.27), width, Math.ceil(height * 0.24));
  target.fillStyle = palette.cloud;
  for (let index = 0; index < 6; index += 1) {
    const x = (index * 61 + 17) % width;
    const y = 13 + (index % 3) * 11;
    target.fillRect(x, y, 24 + (index % 2) * 9, 3);
    target.fillRect(x + 6, y - 2, 13, 2);
  }
  if (hourBand === "night") {
    target.fillStyle = "#d9e5de";
    for (let index = 0; index < 12; index += 1) {
      target.fillRect((index * 47 + 9) % width, 7 + (index * 13) % 40, 1, 1);
    }
  }
}

function drawLake(target, width, height, palette) {
  const horizon = Math.floor(height * 0.43);
  drawSkyline(target, width, horizon, palette);
  drawTreeLine(target, width, horizon + 2, palette);
  target.fillStyle = palette.water;
  target.fillRect(0, horizon + 17, width, height - horizon - 17);
  target.fillStyle = palette.waterLine;
  for (let y = horizon + 22; y < height; y += 7) {
    for (let x = (y * 3) % 17; x < width; x += 31) target.fillRect(x, y, 13 + (x % 7), 1);
  }
  target.fillStyle = palette.rail;
  target.fillRect(0, height - 31, width, 3);
  for (let x = 5; x < width; x += 22) target.fillRect(x, height - 31, 2, 18);
  target.fillStyle = palette.walk;
  target.fillRect(0, height - 13, width, 13);
  drawLamp(target, 25, height - 54, palette);
  drawLamp(target, width - 31, height - 54, palette);
  drawBench(target, 48, height - 22, palette);
  drawBench(target, width - 83, height - 22, palette);
}

function drawTeaStall(target, width, height, palette) {
  drawShopRow(target, width, height, palette, true);
  target.fillStyle = palette.walk;
  target.fillRect(0, Math.floor(height * 0.65), width, Math.ceil(height * 0.35));
  target.fillStyle = palette.paver;
  for (let y = Math.floor(height * 0.68); y < height; y += 8) {
    for (let x = (y / 8) % 2 ? 0 : 8; x < width; x += 16) target.fillRect(x, y, 10, 1);
  }
  target.fillStyle = "#704630";
  target.fillRect(17, height - 39, 42, 4);
  target.fillRect(21, height - 35, 3, 19);
  target.fillRect(51, height - 35, 3, 19);
  target.fillStyle = "#c7c7b7";
  target.fillRect(27, height - 45, 8, 8);
  target.fillStyle = "#e9c55b";
  target.fillRect(41, height - 44, 7, 7);
  drawPlasticChair(target, 8, height - 25, "#347c91");
  drawPlasticChair(target, 66, height - 25, "#d74d46");
}

function drawStreet(target, width, height, palette) {
  drawShopRow(target, width, height, palette, false);
  target.fillStyle = palette.walk;
  target.fillRect(0, Math.floor(height * 0.62), width, 25);
  target.fillStyle = palette.road;
  target.fillRect(0, Math.floor(height * 0.76), width, height);
  target.fillStyle = palette.lane;
  for (let x = 8; x < width; x += 36) target.fillRect(x, Math.floor(height * 0.86), 17, 2);
  target.fillStyle = "#32404b";
  target.fillRect(17, 76, 3, 49);
  target.fillRect(9, 77, 20, 3);
  target.fillStyle = "#d2e2d8";
  target.fillRect(11, 81, 16, 15);
  drawParkedBike(target, width - 58, height - 39, palette);
}

function drawChurchInterior(target, width, height, palette) {
  target.fillStyle = "#5e3f36";
  target.fillRect(0, 0, width, height);
  target.fillStyle = "#866458";
  for (let x = 14; x < width; x += 55) target.fillRect(x, 0, 5, height - 22);
  target.fillStyle = "#3a2730";
  for (let x = 33; x < width; x += 70) {
    target.fillRect(x, 18, 24, 42);
    target.fillRect(x + 4, 12, 16, 8);
    target.fillStyle = x % 2 ? "#d66e4c" : "#4a83a3";
    target.fillRect(x + 5, 21, 14, 33);
    target.fillStyle = "#3a2730";
  }
  target.fillStyle = "#b3864f";
  target.fillRect(0, height - 28, width, 28);
  target.fillStyle = "#33241f";
  for (let x = 5; x < width; x += 42) {
    target.fillRect(x, height - 41, 35, 5);
    target.fillRect(x + 3, height - 36, 3, 13);
    target.fillRect(x + 30, height - 36, 3, 13);
  }
  target.fillStyle = "#efc96e";
  target.fillRect(width / 2 - 13, 12, 26, 4);
  target.fillRect(width / 2 - 3, 8, 6, 14);
}

function drawChurchExterior(target, width, height, palette) {
  drawSkyline(target, width, Math.floor(height * 0.42), palette);
  target.fillStyle = "#6f706d";
  target.fillRect(width / 2 - 37, 38, 74, 79);
  target.fillRect(width / 2 - 49, 25, 23, 92);
  target.fillRect(width / 2 + 26, 25, 23, 92);
  target.fillStyle = "#393c3b";
  for (const x of [width / 2 - 40, width / 2 - 7, width / 2 + 31]) {
    target.fillRect(x, 67, 14, 36);
    target.fillRect(x + 3, 61, 8, 8);
  }
  target.fillStyle = palette.lamp;
  target.fillRect(width / 2 - 45, 45, 13, 15);
  target.fillRect(width / 2 + 32, 45, 13, 15);
  target.fillStyle = palette.walk;
  target.fillRect(0, 117, width, height - 117);
  drawLamp(target, 28, height - 55, palette);
  drawLamp(target, width - 34, height - 55, palette);
}

function drawLongBien(target, width, height, palette) {
  const horizon = Math.floor(height * 0.5);
  target.fillStyle = palette.water;
  target.fillRect(0, horizon, width, height - horizon);
  target.fillStyle = palette.skyline;
  for (let x = 0; x < width; x += 24) target.fillRect(x, horizon - 9 - (x % 19), 20, 13 + (x % 19));
  target.strokeStyle = "#353e44";
  target.lineWidth = 4;
  for (let x = -20; x < width + 40; x += 54) {
    target.strokeRect(x, 29, 54, 98);
    target.beginPath();
    target.moveTo(x, 29);
    target.lineTo(x + 54, 127);
    target.moveTo(x + 54, 29);
    target.lineTo(x, 127);
    target.stroke();
  }
  target.fillStyle = "#2b3034";
  target.fillRect(0, height - 35, width, 7);
  target.fillRect(0, height - 20, width, 4);
  target.fillStyle = "#8c7458";
  for (let x = 0; x < width; x += 16) target.fillRect(x, height - 27, 11, 2);
}

function drawTemple(target, width, height, palette) {
  target.fillStyle = "#854337";
  target.fillRect(0, 54, width, 65);
  target.fillStyle = "#ad6650";
  for (let y = 59; y < 116; y += 8) {
    for (let x = y % 16; x < width; x += 18) target.fillRect(x, y, 12, 2);
  }
  target.fillStyle = "#3d3128";
  target.fillRect(width / 2 - 43, 35, 86, 84);
  target.fillStyle = "#b74634";
  target.fillRect(width / 2 - 34, 48, 68, 71);
  target.fillStyle = "#303c32";
  target.fillRect(0, 112, width, 12);
  target.fillStyle = palette.walk;
  target.fillRect(0, 124, width, height - 124);
  drawTree(target, 24, 88, palette);
  drawTree(target, width - 29, 91, palette);
}

function drawCourtyard(target, width, height, palette) {
  drawTreeLine(target, width, 76, palette);
  target.fillStyle = palette.walk;
  target.fillRect(0, 91, width, height - 91);
  for (let y = 97; y < height; y += 10) {
    target.fillStyle = y % 20 ? palette.paver : palette.walkLine;
    target.fillRect(0, y, width, 1);
  }
  drawBench(target, 17, height - 27, palette);
  drawLamp(target, width - 29, height - 62, palette);
}

function drawSkyline(target, width, baseY, palette) {
  target.fillStyle = palette.skyline;
  for (let x = 0; x < width; x += 23) {
    const height = 14 + ((x * 7) % 24);
    target.fillRect(x, baseY - height, 19, height);
    if (palette.window) {
      target.fillStyle = (x / 23) % 3 === 0 ? palette.window : palette.skylineDark;
      target.fillRect(x + 4, baseY - height + 5, 3, 2);
      target.fillRect(x + 11, baseY - height + 5, 3, 2);
      target.fillStyle = palette.skyline;
    }
  }
}

function drawTreeLine(target, width, baseY, palette) {
  target.fillStyle = palette.treeDark;
  target.fillRect(0, baseY - 10, width, 21);
  for (let x = -8; x < width; x += 17) {
    const top = baseY - 17 - ((x * 5 + 29) % 12);
    target.fillRect(x, top, 21, baseY - top);
    target.fillRect(x + 5, top - 5, 11, 8);
  }
  target.fillStyle = palette.treeLight;
  for (let x = 2; x < width; x += 29) target.fillRect(x, baseY - 20 - (x % 7), 9, 5);
}

function drawShopRow(target, width, height, palette, warm) {
  const ground = Math.floor(height * 0.65);
  for (let x = 0; x < width; x += 54) {
    target.fillStyle = x % 108 ? "#755947" : "#8b6951";
    target.fillRect(x, 31 + (x % 11), 50, ground - 31);
    target.fillStyle = "#2e2624";
    target.fillRect(x + 8, ground - 28, 34, 28);
    target.fillStyle = warm || getHourBand() === "night" ? "#e6a642" : "#859d96";
    target.fillRect(x + 11, ground - 25, 28, 17);
    target.fillStyle = x % 108 ? "#b72e2c" : "#255d58";
    target.fillRect(x + 5, ground - 39, 41, 8);
    target.fillStyle = "#f4ddb0";
    target.fillRect(x + 11, ground - 36, 28, 2);
  }
}

function drawLamp(target, x, y, palette) {
  target.fillStyle = "#20272a";
  target.fillRect(x, y, 2, 34);
  target.fillRect(x - 3, y, 8, 3);
  target.fillStyle = palette.lamp;
  target.fillRect(x - 2, y + 3, 6, 6);
}

function drawBench(target, x, y) {
  target.fillStyle = "#4a362b";
  target.fillRect(x, y, 28, 4);
  target.fillRect(x + 3, y + 4, 3, 8);
  target.fillRect(x + 22, y + 4, 3, 8);
}

function drawPlasticChair(target, x, y, color) {
  target.fillStyle = color;
  target.fillRect(x, y, 14, 4);
  target.fillRect(x + 2, y + 4, 2, 10);
  target.fillRect(x + 10, y + 4, 2, 10);
}

function drawParkedBike(target, x, y, palette) {
  target.fillStyle = "#171c20";
  target.fillRect(x, y + 14, 9, 9);
  target.fillRect(x + 28, y + 14, 9, 9);
  target.fillStyle = palette.accent;
  target.fillRect(x + 8, y + 6, 22, 10);
  target.fillRect(x + 18, y, 6, 10);
}

function drawTree(target, x, y, palette) {
  target.fillStyle = "#4e3326";
  target.fillRect(x - 2, y, 5, 48);
  target.fillStyle = palette.treeDark;
  target.fillRect(x - 16, y - 20, 33, 27);
  target.fillStyle = palette.treeLight;
  target.fillRect(x - 8, y - 25, 18, 12);
}

function drawLivingAccents(view, timestamp) {
  const hourBand = getHourBand();
  const scene = resolveScene(view);
  if (hourBand !== "night") return;
  const pulse = Math.floor(timestamp / 650) % 5 === 0 ? 0.12 : 0;
  ctx.fillStyle = `rgba(255, 195, 92, ${0.13 + pulse})`;
  if (["teaStall", "street", "lake", "churchExterior"].includes(scene)) {
    ctx.fillRect(0, Math.floor(canvas.height * 0.42), canvas.width, Math.floor(canvas.height * 0.18));
  }
  if (scene === "churchInterior") {
    ctx.fillStyle = "rgba(255, 197, 105, 0.17)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawWeather(view, timestamp) {
  const weather = getCurrentWeather();
  const scene = resolveScene(view);
  if (scene === "churchInterior" || !["drizzle", "rain", "heavyRain"].includes(weather?.type)) return;
  const count = weather.type === "heavyRain" ? 86 : weather.type === "rain" ? 52 : 25;
  const length = weather.type === "heavyRain" ? 13 : 8;
  ctx.strokeStyle = weather.type === "heavyRain" ? "rgba(199, 222, 231, 0.62)" : "rgba(203, 222, 226, 0.45)";
  ctx.lineWidth = weather.type === "drizzle" ? 1 : 2;
  ctx.beginPath();
  const phase = Math.floor(timestamp / 24);
  for (let index = 0; index < count; index += 1) {
    const x = (index * 83 + phase * 7) % (canvas.width + 80) - 40;
    const y = (index * 47 + phase * 13) % canvas.height;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 4, y + length);
  }
  ctx.stroke();
}

function drawFocusWash(view) {
  const strength = view.kind === "internal" ? 0.36 : 0.24;
  ctx.fillStyle = `rgba(10, 13, 19, ${strength})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const steps = view.kind === "internal" ? 5 : 3;
  for (let index = 0; index < steps; index += 1) {
    const inset = index * 18;
    ctx.strokeStyle = `rgba(3, 4, 8, ${0.12 + index * 0.04})`;
    ctx.lineWidth = 18;
    ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
  }
}

function resolveScene(view) {
  const mapId = view.mapId || state.currentMapId;
  if (mapId === "churchInterior" || view.mapKind === "churchInterior") return "churchInterior";
  if (mapId === "hoanKiem" && view.npc && Number(view.npc.x) > 2200 && Number(view.npc.y) < 1220) return "churchExterior";
  if (mapId === "baDinh" && view.profileId === "oldWitness") return "temple";
  if (mapId === "baDinh" && view.profileId === "mo") return "temple";
  if (mapId === "longBien" && ["mo", "oldWitness", "guide", "tourist"].includes(view.profileId)) return "longBien";
  if (view.profile?.background === "church") return "churchExterior";
  return view.profile?.background || "courtyard";
}

function getHourBand() {
  const hour = Number(state.gameTime?.hour) || 0;
  if (hour >= 18 || hour < 5) return "night";
  if (hour >= 16) return "sunset";
  return "day";
}

function getPalette(hourBand) {
  if (hourBand === "night") {
    return {
      sky: "#15283c", skyBand: "#213b50", cloud: "#334d5d", skyline: "#263039", skylineDark: "#161e25",
      window: "#dca74d", treeDark: "#172c2b", treeLight: "#26433a", water: "#14353b", waterLine: "#276067",
      rail: "#64716e", walk: "#45484a", walkLine: "#5c5e5e", paver: "#56595b", road: "#292e33", lane: "#b99c5a",
      lamp: "#f0bd58", accent: "#d15a42"
    };
  }
  if (hourBand === "sunset") {
    return {
      sky: "#d96f3e", skyBand: "#ef9d55", cloud: "#f1bd78", skyline: "#66504a", skylineDark: "#453d3a",
      window: "#f5cf79", treeDark: "#294038", treeLight: "#425d47", water: "#496b64", waterLine: "#b47855",
      rail: "#74746a", walk: "#7b7064", walkLine: "#918477", paver: "#8d7b6e", road: "#4c4a4a", lane: "#d0b976",
      lamp: "#ffd17a", accent: "#c64d39"
    };
  }
  return {
    sky: "#80aeb8", skyBand: "#a9c6c2", cloud: "#d7ded4", skyline: "#78817b", skylineDark: "#626b66",
    window: "#dbc684", treeDark: "#315b42", treeLight: "#56805a", water: "#39747a", waterLine: "#6aa0a0",
    rail: "#737d78", walk: "#8b8479", walkLine: "#a19a8e", paver: "#9a9185", road: "#4b5052", lane: "#d5c58c",
    lamp: "#f0cb73", accent: "#c54d3f"
  };
}
