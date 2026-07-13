import { ctx, player, state } from "../state.js";
import { isMoRidingWithPlayer } from "../systems/moCompanion.js";
import { drawCharacterSprite, drawPreparedSprite } from "./renderCharacterSprite.js";
import { drawMoVehiclePassenger } from "./renderCompanion.js";
import { getVinfastBikeSprite, isSpriteReady } from "./spriteAssets.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

const BIKE_WIDTH = 55;

export function drawVehicleWithRider() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const facing = player.facing;
  const bob = player.moving ? Math.round(Math.sin(player.step) * 1) : 0;
  const usingBikeSprite = drawAssetVehicle(x, y + bob, facing);

  if (!usingBikeSprite) {
    drawFallbackVehicle(x, y + bob, facing);
  }

  if (isMoRidingWithPlayer()) {
    drawMoVehiclePassenger(x, y + bob, facing);
  }

  if (!usingBikeSprite || !drawAssetRider(x, y + bob, facing)) {
    drawFallbackRider(x, y + bob, facing);
  }
}

function drawAssetVehicle(x, y, facing) {
  const asset = getVinfastBikeSprite();
  if (!isSpriteReady(asset)) {
    return false;
  }

  const height = Math.max(1, Math.round(BIKE_WIDTH * (asset.height / asset.width)));
  const bikeX = Math.round(x + player.width / 2 - BIKE_WIDTH / 2);
  const bikeY = Math.round(y + 4);
  drawGroundShadow(bikeX + BIKE_WIDTH / 2, bikeY + height - 4, BIKE_WIDTH - 5, 6);

  return drawPreparedSprite(asset, {
    x: bikeX,
    y: bikeY,
    width: BIKE_WIDTH,
    height,
    flipHorizontal: facing === "right"
  });
}

function drawAssetRider(x, y, facing) {
  const gender = getGender();
  const centerX = facing === "right"
    ? x + 20
    : facing === "left"
      ? x + 4
      : x + 6;
  const riderFacing = facing === "left" || facing === "right" ? facing : "down";

  return drawCharacterSprite({
    gender,
    centerX,
    topY: y - 1,
    height: 33,
    facing: riderFacing,
    pose: "rider"
  });
}

function drawFallbackVehicle(x, y, facing) {
  if (facing === "left" || facing === "right") {
    drawSideVehicle(x, y, facing);
  } else {
    drawVerticalVehicle(x, y, facing);
  }
}

function drawFallbackRider(x, y, facing) {
  if (facing === "left" || facing === "right") {
    drawSideRider(x, y, facing);
  } else {
    drawVerticalRider(x, y, facing);
  }
}

function drawSideVehicle(x, y, facing) {
  const flip = facing === "right" ? 1 : -1;
  const baseX = x - 9;
  const baseY = y + 14;

  drawGroundShadow(baseX + 21, baseY + 21, 46, 7);
  ctx.fillStyle = "#151515";
  ctx.fillRect(baseX + 2, baseY + 19, 10, 10);
  ctx.fillRect(baseX + 31, baseY + 19, 10, 10);
  ctx.fillStyle = "#d9e3e8";
  ctx.fillRect(baseX + 5, baseY + 22, 4, 4);
  ctx.fillRect(baseX + 34, baseY + 22, 4, 4);

  ctx.fillStyle = "#f7f7ef";
  ctx.fillRect(baseX + 10, baseY + 8, 24, 11);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(baseX + 15, baseY + 3, 20, 10);
  ctx.fillStyle = "#151515";
  ctx.fillRect(baseX + 14, baseY + 2, 22, 3);

  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(baseX + (flip > 0 ? 36 : 3), baseY + 9, 5, 5);
  ctx.fillStyle = "#151515";
  ctx.fillRect(baseX + (flip > 0 ? 37 : 0), baseY + 4, 11, 4);

  ctx.fillStyle = "#151515";
  ctx.font = "700 7px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("VF", baseX + 23, baseY + 17);
}

function drawVerticalVehicle(x, y, facing) {
  const baseX = x - 3;
  const baseY = y + 5;
  const frontY = facing === "up" ? baseY : baseY + 25;

  drawGroundShadow(baseX + 12, baseY + 29, 34, 7);
  ctx.fillStyle = "#151515";
  ctx.fillRect(baseX - 2, baseY + 7, 8, 12);
  ctx.fillRect(baseX + 18, baseY + 7, 8, 12);
  ctx.fillStyle = "#f7f7ef";
  ctx.fillRect(baseX + 2, baseY + 10, 20, 24);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(baseX + 5, baseY + 2, 14, 30);
  ctx.fillStyle = "#151515";
  ctx.fillRect(baseX + 1, baseY + 2, 22, 4);
  ctx.fillRect(baseX, baseY + 30, 24, 4);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(baseX + 8, frontY, 8, 5);
}

function drawSideRider(x, y, facing) {
  const gender = getGender();
  const headX = facing === "right" ? x + 8 : x + 2;
  const bodyX = facing === "right" ? x + 7 : x + 1;

  ctx.fillStyle = gender === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(bodyX, y + 13, 16, 15);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(headX, y + 2, 14, 13);
  drawRiderHair(headX, y + 2, gender, facing);
  ctx.fillStyle = "#151515";
  ctx.fillRect(facing === "right" ? headX + 10 : headX + 2, y + 8, 3, 3);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(facing === "right" ? x + 19 : x - 2, y + 18, 8, 4);
}

function drawVerticalRider(x, y, facing) {
  const gender = getGender();
  const headY = facing === "up" ? y + 1 : y + 4;

  ctx.fillStyle = gender === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(x + 3, y + 15, 18, 15);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 5, headY, 14, 13);
  drawRiderHair(x + 5, headY, gender, facing);

  if (facing !== "up") {
    ctx.fillStyle = "#151515";
    ctx.fillRect(x + 8, headY + 7, 3, 3);
    ctx.fillRect(x + 14, headY + 7, 3, 3);
  }

  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x, y + 18, 6, 4);
  ctx.fillRect(x + 18, y + 18, 6, 4);
}

function drawRiderHair(x, y, gender, facing) {
  ctx.fillStyle = "#2b2b32";
  if (gender === "female") {
    ctx.fillRect(x - 2, y - 2, 18, 7);
    ctx.fillRect(x - 2, y + 5, 4, 12);
    ctx.fillRect(x + 12, y + 5, 4, 12);
    return;
  }

  ctx.fillRect(x - 1, y - 2, 16, 6);
  if (facing !== "up") {
    ctx.fillStyle = "#f4c542";
    ctx.fillRect(x - 4, y - 5, 15, 4);
  }
}

function getGender() {
  return state.profile.gender === "female" ? "female" : "male";
}
