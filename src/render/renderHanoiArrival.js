import { ctx, runtime, state } from "../state.js";
import { drawCharacterSprite } from "./renderCharacterSprite.js";
import { drawMoSprite } from "./renderCompanion.js";
import { drawPixelNpc } from "./renderMap.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

export function isHanoiArrivalSceneActive() {
  return runtime.cutscene?.active && runtime.cutscene.scene?.renderer === "hanoiArrival";
}

export function drawHanoiArrivalScene() {
  const scene = runtime.cutscene?.scene;
  if (!isHanoiArrivalSceneActive() || !scene) return false;

  const entities = scene.entities || [];
  const sceneState = scene.state || {};
  const now = performance.now();
  const phase = now / 430;

  drawArrivalTeaSetting(findEntity(entities, "arrival-tea-vendor"));
  drawPassingMotorbike(sceneState, now);

  entities
    .filter((entity) => entity.kind !== "focus")
    .sort((left, right) => left.y - right.y)
    .forEach((entity) => drawArrivalActor(entity, sceneState, phase));
  return true;
}

function drawArrivalActor(entity, sceneState, phase) {
  if (entity.kind === "player") {
    drawArrivalPlayer(entity, sceneState);
    return;
  }
  if (entity.kind === "mo") {
    drawMoSprite(entity, {
      x: entity.x,
      y: entity.y,
      facing: sceneState.attention === "lake" ? "right" : entity.facing,
      pauseRoutine: true
    });
    return;
  }

  const activity = entity.kind === "teaVendor" ? "seated" : entity.kind === "student" ? "phone" : "idle";
  drawPixelNpc(entity.x, entity.y, entity.color, {
    activity,
    phase: phase + entity.id.length * 0.37,
    facing: entity.facing,
    scale: entity.kind === "teaVendor" ? 1.02 : 1.08
  });
  if (entity.kind === "xeOm") drawParkedXeOmBike(entity.x - 24, entity.y + 30);
  if (entity.kind === "student") drawStudentBackpack(entity.x + 18, entity.y + 18);
}

function drawArrivalPlayer(entity, sceneState) {
  const gender = state.profile?.gender === "female" ? "female" : "male";
  if (sceneState.playerPose === "lying") {
    drawLyingPlayer(entity.x, entity.y, gender, sceneState.eyesOpen);
    return;
  }

  drawGroundShadow(entity.x + 12, entity.y + 34, 34, 7);
  const height = sceneState.playerPose === "seated" ? 43 : 48;
  const topY = sceneState.playerPose === "seated" ? entity.y - 1 : entity.y - 10;
  if (!drawCharacterSprite({
    gender,
    centerX: entity.x + 12,
    topY,
    height,
    facing: sceneState.attention === "lake" ? "right" : entity.facing
  })) {
    drawPixelNpc(entity.x, entity.y, gender === "female" ? "#2fa38b" : "#d8484f", {
      activity: sceneState.playerPose === "seated" ? "seated" : "idle",
      phase: 0,
      facing: entity.facing
    });
  }
}

function drawLyingPlayer(x, y, gender, eyesOpen) {
  drawGroundShadow(x + 16, y + 31, 46, 7);
  ctx.fillStyle = gender === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(x - 4, y + 17, 34, 14);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 27, y + 15, 15, 14);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 28, y + 12, 15, 6);
  if (gender === "female") ctx.fillRect(x + 37, y + 16, 6, 14);
  ctx.fillStyle = eyesOpen ? "#201e22" : "#8f604a";
  ctx.fillRect(x + 37, y + 21, 3, eyesOpen ? 3 : 1);
  ctx.fillStyle = "#2f3542";
  ctx.fillRect(x - 10, y + 20, 10, 5);
  ctx.fillRect(x - 7, y + 27, 9, 5);
}

function drawArrivalTeaSetting(vendor) {
  if (!vendor) return;
  const tableX = vendor.x - 15;
  const tableY = vendor.y + 42;
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(tableX - 19, tableY + 17, 70, 7);
  ctx.fillStyle = "#305f8b";
  ctx.fillRect(tableX - 20, tableY + 11, 15, 10);
  ctx.fillRect(tableX + 38, tableY + 10, 15, 11);
  ctx.fillStyle = "#7b4b36";
  ctx.fillRect(tableX, tableY, 37, 8);
  ctx.fillRect(tableX + 6, tableY + 8, 5, 15);
  ctx.fillRect(tableX + 27, tableY + 8, 5, 15);
  ctx.fillStyle = "#c6d6c2";
  ctx.fillRect(tableX + 7, tableY - 12, 13, 12);
  ctx.fillStyle = "#e9f3dc";
  ctx.fillRect(tableX + 10, tableY - 16, 7, 4);
  ctx.fillStyle = "#b8e3e8";
  ctx.fillRect(tableX + 25, tableY - 7, 7, 8);
  ctx.fillStyle = "#f5f2da";
  ctx.fillRect(tableX + 27, tableY - 5, 3, 3);
}

function drawParkedXeOmBike(x, y) {
  ctx.fillStyle = "#191a20";
  ctx.fillRect(x, y + 12, 12, 12);
  ctx.fillRect(x + 34, y + 12, 12, 12);
  ctx.fillStyle = "#bd3f3b";
  ctx.fillRect(x + 8, y + 5, 29, 11);
  ctx.fillRect(x + 19, y, 17, 8);
  ctx.fillStyle = "#d8d1b5";
  ctx.fillRect(x + 36, y + 3, 6, 5);
}

function drawStudentBackpack(x, y) {
  ctx.fillStyle = "#314b65";
  ctx.fillRect(x, y, 8, 17);
  ctx.fillStyle = "#7995ac";
  ctx.fillRect(x + 2, y + 4, 4, 5);
}

function drawPassingMotorbike(sceneState, now) {
  const animation = sceneState.animation;
  if (!sceneState.motorbikePassed || animation?.type !== "motorbikePass") return;
  const progress = clamp01((now - animation.startedAt) / animation.duration);
  const x = Math.round(900 + progress * 610);
  const y = 1350;
  const bounce = Math.round(Math.sin(progress * Math.PI * 12));
  drawGroundShadow(x + 30, y + 30, 58, 7);
  ctx.fillStyle = "#15161b";
  ctx.fillRect(x, y + 21, 13, 13);
  ctx.fillRect(x + 46, y + 21, 13, 13);
  ctx.fillStyle = "#3a8aa0";
  ctx.fillRect(x + 8, y + 13 + bounce, 42, 12);
  ctx.fillRect(x + 26, y + 6 + bounce, 20, 10);
  ctx.fillStyle = "#d8edf0";
  ctx.fillRect(x + 49, y + 14 + bounce, 7, 6);
  ctx.fillStyle = "#e1b18c";
  ctx.fillRect(x + 23, y - 4 + bounce, 13, 12);
  ctx.fillStyle = "#26303b";
  ctx.fillRect(x + 21, y - 7 + bounce, 17, 6);
  ctx.fillStyle = "#75519b";
  ctx.fillRect(x + 18, y + 7 + bounce, 21, 14);
}

function findEntity(entities, id) {
  return entities.find((entity) => entity.id === id) || null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
