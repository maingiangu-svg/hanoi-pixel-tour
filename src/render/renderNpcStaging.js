import { isRectVisible } from "../camera.js";
import { NPC_STAGING_SCENES } from "../data/npcStaging.js";
import { player, state, ctx } from "../state.js";
import { getMinuteOfDay } from "../utils/gameTime.js";
import { getWeatherIntensity } from "../systems/weather.js";
import { drawPixelNpc } from "./renderMap.js";
import { drawNpcLocalLight } from "./renderNpcLighting.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawSpeechBubble } from "./renderStreetNpcs.js";
import { getNightStrength } from "./renderLighting.js";

const SCENE_BOUNDS = Object.freeze({ width: 150, height: 92 });
const LIT_SCENE_TYPES = new Set(["teaGroup", "foodQueue", "vendorGroup"]);
let cachedSceneKey = "";
let cachedScenes = [];

export function drawNpcStaging(map) {
  const scenes = getActiveNpcStagingScenes(map);
  const now = performance.now();
  const phase = now / 900;
  let bubbleScene = null;
  let bubbleDistance = Infinity;

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const bounds = {
      x: scene.x - SCENE_BOUNDS.width / 2,
      y: scene.y - SCENE_BOUNDS.height / 2,
      width: SCENE_BOUNDS.width,
      height: SCENE_BOUNDS.height
    };
    if (!isRectVisible(bounds, 80)) continue;

    drawStagedScene(map, scene, phase + index * 1.37);
    if (!scene.speech?.length || !isBubbleMoment(scene, now)) continue;
    const distance = Math.hypot(player.x + player.width / 2 - scene.x, player.y + player.height / 2 - scene.y);
    if (distance <= 250 && distance < bubbleDistance) {
      bubbleScene = scene;
      bubbleDistance = distance;
    }
  }

  if (bubbleScene) {
    const lineIndex = Math.floor(now / 15000 + stableHash(bubbleScene.id)) % bubbleScene.speech.length;
    drawSpeechBubble(bubbleScene.x, bubbleScene.y - 28, bubbleScene.speech[lineIndex]);
  }
}

export function getActiveNpcStagingScenes(map, minute = getMinuteOfDay(state.gameTime), weatherIntensity = getWeatherIntensity()) {
  const weatherBand = Math.round(weatherIntensity * 100);
  const key = `${map.id}:${Math.floor(minute)}:${weatherBand}`;
  if (key === cachedSceneKey) return cachedScenes;

  const scenes = NPC_STAGING_SCENES[map.id] || [];
  cachedScenes = scenes.filter((scene) =>
    isMinuteInRange(minute, scene.start, scene.end) && weatherIntensity <= (scene.weatherMax ?? 1)
  );
  cachedSceneKey = key;
  return cachedScenes;
}

function drawStagedScene(map, scene, phase) {
  drawSceneLightPool(scene);
  if (scene.type === "conversation") {
    drawConversation(map, scene, phase);
  } else if (scene.type === "benchGroup") {
    drawBenchGroup(map, scene, phase);
  } else if (scene.type === "teaGroup") {
    drawTeaGroup(map, scene, phase);
  } else if (scene.type === "photoPair") {
    drawPhotoPair(map, scene, phase);
  } else if (scene.type === "children") {
    drawChildren(map, scene, phase);
  } else if (scene.type === "vendorGroup") {
    drawVendorGroup(map, scene, phase);
  } else if (scene.type === "viewPair") {
    drawViewPair(map, scene, phase);
  } else if (scene.type === "foodQueue") {
    drawFoodQueue(map, scene, phase);
  } else {
    drawWaitingGroup(map, scene, phase);
  }
}

function drawSceneLightPool(scene) {
  if (!LIT_SCENE_TYPES.has(scene.type)) return;
  const strength = getNightStrength();
  if (strength <= 0.08) return;
  const width = scene.type === "foodQueue" ? 112 : 92;
  ctx.fillStyle = `rgba(255, 190, 86, ${0.035 + strength * 0.05})`;
  ctx.fillRect(Math.round(scene.x - width / 2), Math.round(scene.y + 30), width, 9);
  ctx.fillStyle = `rgba(255, 224, 142, ${0.045 + strength * 0.065})`;
  ctx.fillRect(Math.round(scene.x - width * 0.34), Math.round(scene.y + 22), Math.round(width * 0.68), 9);
}

function drawConversation(map, scene, phase) {
  const colors = scene.colors;
  const count = colors.length;
  const spacing = count === 2 ? 30 : 28;
  const startX = scene.x - ((count - 1) * spacing) / 2;
  for (let index = 0; index < count; index += 1) {
    const x = startX + index * spacing;
    const facing = x < scene.x ? "right" : x > scene.x ? "left" : (Math.floor(phase / 5) % 2 ? "left" : "right");
    drawActor(map, x, scene.y + (index % 2) * 3, colors[index], {
      activity: "talk",
      phase: phase + index * 2.3,
      facing
    });
  }
}

function drawBenchGroup(map, scene, phase) {
  const firstX = scene.x + 7;
  drawActor(map, firstX, scene.y - 17, scene.colors[0], {
    activity: "seated",
    phase,
    facing: "up"
  });
  drawActor(map, firstX + 25, scene.y - 17, scene.colors[1], {
    activity: "seated",
    phase: phase + 2.1,
    facing: "up"
  });
}

function drawTeaGroup(map, scene, phase) {
  drawGroundShadow(scene.x, scene.y + 26, 72, 7);
  ctx.fillStyle = "#71452b";
  ctx.fillRect(scene.x - 14, scene.y + 12, 28, 12);
  ctx.fillStyle = "#dbe4e6";
  ctx.fillRect(scene.x - 7, scene.y + 7, 6, 6);
  ctx.fillRect(scene.x + 5, scene.y + 7, 6, 6);
  drawActor(map, scene.x - 40, scene.y - 4, scene.colors[0], { activity: "seated", phase, facing: "right" });
  drawActor(map, scene.x + 22, scene.y - 4, scene.colors[1], { activity: "seated", phase: phase + 2.4, facing: "left" });
  if (scene.colors[2]) {
    drawActor(map, scene.x - 8, scene.y + 19, scene.colors[2], { activity: "seated", phase: phase + 4.2, facing: "up", scale: 0.96 });
  }
}

function drawPhotoPair(map, scene, phase) {
  drawActor(map, scene.x - 38, scene.y + 4, scene.colors[0], { activity: "phone", phase, facing: "right" });
  drawActor(map, scene.x + 8, scene.y, scene.colors[1], { activity: "pose", phase: phase + 1.8, facing: "left" });
  drawActor(map, scene.x + 34, scene.y + 3, scene.colors[2], { activity: "pose", phase: phase + 3.6, facing: "left" });
}

function drawChildren(map, scene, phase) {
  for (let index = 0; index < scene.colors.length; index += 1) {
    const x = scene.x - 24 + index * 24;
    const y = scene.y + Math.round(Math.sin(phase * 1.6 + index * 2.2) * 5);
    drawActor(map, x, y, scene.colors[index], {
      activity: "play",
      phase: phase + index * 1.9,
      facing: index === 0 ? "right" : index === scene.colors.length - 1 ? "left" : "down",
      scale: 0.8
    });
  }
}

function drawVendorGroup(map, scene, phase) {
  drawGroundShadow(scene.x, scene.y + 32, 78, 8);
  ctx.fillStyle = "#9a6137";
  ctx.fillRect(scene.x - 10, scene.y + 17, 28, 16);
  ctx.fillStyle = "#d9b458";
  ctx.fillRect(scene.x - 6, scene.y + 13, 7, 5);
  ctx.fillRect(scene.x + 7, scene.y + 12, 7, 6);
  drawActor(map, scene.x - 38, scene.y - 5, scene.colors[0], { activity: "vendor", phase, facing: "right" });
  drawActor(map, scene.x + 25, scene.y - 2, scene.colors[1], { activity: "wait", phase: phase + 2.2, facing: "left" });
  drawActor(map, scene.x + 50, scene.y + 4, scene.colors[2], { activity: "phone", phase: phase + 4.4, facing: "left", scale: 0.96 });
}

function drawFoodQueue(map, scene, phase) {
  drawGroundShadow(scene.x + 18, scene.y + 31, 82, 7);
  ctx.fillStyle = "#74452f";
  ctx.fillRect(scene.x + 10, scene.y + 14, 30, 13);
  ctx.fillStyle = "#f1dfb3";
  ctx.fillRect(scene.x + 15, scene.y + 10, 7, 5);
  ctx.fillRect(scene.x + 28, scene.y + 9, 7, 6);
  drawActor(map, scene.x - 34, scene.y - 4, scene.colors[0], { activity: "wait", phase, facing: "up" });
  drawActor(map, scene.x - 6, scene.y, scene.colors[1], { activity: "phone", phase: phase + 2.2, facing: "up" });
  if (scene.colors[2]) {
    drawActor(map, scene.x + 39, scene.y - 1, scene.colors[2], { activity: "seated", phase: phase + 4.1, facing: "left", scale: 0.96 });
  }
}

function drawViewPair(map, scene, phase) {
  drawActor(map, scene.x - 15, scene.y, scene.colors[0], { activity: "lookOut", phase, facing: "up" });
  drawActor(map, scene.x + 15, scene.y + 2, scene.colors[1], { activity: "lookOut", phase: phase + 2.8, facing: "up" });
}

function drawWaitingGroup(map, scene, phase) {
  for (let index = 0; index < scene.colors.length; index += 1) {
    drawActor(map, scene.x - 28 + index * 30, scene.y + (index % 2) * 4, scene.colors[index], {
      activity: index === 1 ? "phone" : "wait",
      phase: phase + index * 2.7,
      facing: index === 0 ? "right" : index === scene.colors.length - 1 ? "left" : "down"
    });
  }
}

function drawActor(map, x, y, color, options) {
  drawPixelNpc(x, y, color, options);
  drawNpcLocalLight(map, x, y, Math.round(24 * (options.scale || 1)));
}

function isBubbleMoment(scene, now) {
  const offset = stableHash(scene.id) % 11000;
  return (now + offset) % 15000 < 2300;
}

function isMinuteInRange(value, start, end) {
  return start < end ? value >= start && value < end : value >= start || value < end;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
