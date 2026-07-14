import { isRectVisible } from "../camera.js";
import { getEnvironmentInteractionsForMap } from "../data/environmentInteractions.js";
import { ctx, player, runtime, state } from "../state.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getActiveEnvironmentInteraction } from "../systems/environmentInteraction.js";
import { drawCharacterSprite } from "./renderCharacterSprite.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

export function drawEnvironmentInteractionMarkers(map) {
  if (runtime.photoMode?.active || runtime.environmentInteraction?.active) return;
  const center = getPlayerCenter();
  const pulse = Math.floor(performance.now() / 320) % 2;
  getEnvironmentInteractionsForMap(map.id).forEach((interaction) => {
    if (interaction.type === "vehicleWalkZone" && state.vehicle?.status !== "riding" && state.vehicle?.status !== "walking-bike") return;
    if (Math.hypot(center.x - interaction.x, center.y - interaction.y) > interaction.visibleRange) return;
    if (!isRectVisible({ x: interaction.x - 12, y: interaction.y - 18, width: 24, height: 30 }, 20)) return;
    drawMarker(interaction.x, interaction.y - pulse, interaction.type);
  });
}

export function drawEnvironmentPlayerPose() {
  const active = getActiveEnvironmentInteraction();
  if (!active) return false;
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const sitting = active.pose === "sit" || active.pose === "drink";
  const height = sitting ? 39 : 48;
  const topY = sitting ? y + 1 : y - 10;
  drawGroundShadow(x + player.width / 2, y + (sitting ? 28 : 32), sitting ? 30 : player.width + 8, 6);

  const drawn = drawCharacterSprite({
    gender: state.profile.gender === "female" ? "female" : "male",
    centerX: x + player.width / 2,
    topY,
    height,
    facing: player.facing,
    pose: sitting ? "sit" : "walking"
  });
  if (!drawn) drawFallbackPose(x, y, sitting);

  if (active.pose === "drink") drawTeaCup(x, y);
  if (active.pose === "lean") drawLeanArms(x, y, player.facing);
  if (active.pose === "inspect") drawInspectHand(x, y, player.facing);
  return true;
}

function drawMarker(x, y, type) {
  const color = type === "vehicleWalkZone" ? "#7bdff2" : type === "inspectObject" ? "#fff3c4" : "#fff36d";
  ctx.fillStyle = "#151515";
  ctx.fillRect(x - 2, y - 10, 5, 21);
  ctx.fillRect(x - 10, y - 2, 21, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x - 1, y - 7, 3, 15);
  ctx.fillRect(x - 7, y - 1, 15, 3);
  ctx.fillStyle = "#fffdf0";
  ctx.fillRect(x, y, 2, 2);
}

function drawFallbackPose(x, y, sitting) {
  ctx.fillStyle = state.profile.gender === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(x + 3, y + 12, 18, sitting ? 15 : 18);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 5, y, 14, 14);
  ctx.fillStyle = "#2b2b32";
  if (sitting) {
    ctx.fillRect(x + 1, y + 26, 10, 5);
    ctx.fillRect(x + 13, y + 26, 10, 5);
  } else {
    ctx.fillRect(x + 4, y + 30, 6, 7);
    ctx.fillRect(x + 14, y + 30, 6, 7);
  }
}

function drawTeaCup(x, y) {
  const lift = Math.floor(performance.now() / 260) % 2;
  ctx.fillStyle = "#f6f0d4";
  ctx.fillRect(x + 19, y + 14 - lift, 7, 7);
  ctx.fillStyle = "#8d6a32";
  ctx.fillRect(x + 20, y + 15 - lift, 5, 2);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 14, y + 17 - lift, 7, 4);
}

function drawLeanArms(x, y, facing) {
  ctx.fillStyle = "#f0c39b";
  if (facing === "left" || facing === "right") {
    ctx.fillRect(facing === "right" ? x + 17 : x - 1, y + 17, 9, 4);
  } else {
    ctx.fillRect(x + 2, y + 18, 6, 5);
    ctx.fillRect(x + 16, y + 18, 6, 5);
  }
}

function drawInspectHand(x, y, facing) {
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(facing === "left" ? x - 2 : x + 18, y + 16, 8, 4);
}
