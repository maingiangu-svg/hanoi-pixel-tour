import { ctx, player, state } from "../state.js";
import { isMoRidingWithPlayer } from "../systems/moCompanion.js";
import { getVehicleTransition } from "../systems/vehicle.js";
import { FEMALE_BIKE_ANIMATIONS } from "../../assets/sprites/vehicle/female/female-bike-animations.js";
import { drawCharacterSprite, drawPreparedSprite } from "./renderCharacterSprite.js";
import { drawMoVehiclePassenger } from "./renderCompanion.js";
import { getFemaleBikeAnimationSprite, getVinfastBikeSprite, isSpriteReady } from "./spriteAssets.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

const BIKE_WIDTH = 55;
const FEMALE_BIKE_DRAW_HEIGHT = 70;

export function drawVehicleWithRider() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const facing = player.facing;
  const bob = player.moving ? Math.round(Math.sin(player.step) * 1) : 0;

  if (isFemaleHorizontalFacing(facing) && drawFemaleBikeRide(x, y + bob, facing)) {
    if (isMoRidingWithPlayer()) {
      drawMoVehiclePassenger(x, y + bob - 10, facing);
    }
    return;
  }

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

export function drawWalkingBikeWithPlayer() {
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const facing = player.facing;
  const horizontal = facing === "left" || facing === "right";
  const side = facing === "left" ? -1 : 1;
  const bikeX = horizontal ? x + side * 18 : x + 18;
  const bikeY = horizontal ? y + 5 : y + 8;

  if (horizontal) {
    if (!drawPushedBikeAsset(bikeX, bikeY, facing)) drawSideVehicle(bikeX, bikeY, facing);
  } else {
    drawVerticalVehicle(bikeX, bikeY, facing);
  }

  const bob = player.moving ? Math.round(Math.sin(player.step) * 1) : 0;
  const riderDrawn = drawCharacterSprite({
    gender: getGender(),
    centerX: x + player.width / 2,
    topY: y - 10 + bob,
    height: 48,
    facing
  });
  if (!riderDrawn) drawFallbackPushingPlayer(x, y + bob, facing);

  ctx.fillStyle = "#f0c39b";
  if (horizontal) {
    ctx.fillRect(facing === "right" ? x + 18 : x - 1, y + 15 + bob, 12, 4);
  } else {
    ctx.fillRect(x + 17, y + 17 + bob, 9, 4);
  }
}

export function drawFemaleVehicleTransition() {
  const transition = getVehicleTransition();
  if (!transition || state.profile.gender !== "female") {
    return false;
  }

  const primaryAnimation = FEMALE_BIKE_ANIMATIONS.dismountHelmet;
  const primaryAsset = getFemaleBikeAnimationSprite("dismountHelmet");
  const fallbackAnimation = FEMALE_BIKE_ANIMATIONS.dismountNoHelmet;
  const fallbackAsset = getFemaleBikeAnimationSprite("dismountNoHelmet");
  const usingPrimaryAsset = isSpriteReady(primaryAsset);
  const animation = usingPrimaryAsset ? primaryAnimation : fallbackAnimation;
  const asset = usingPrimaryAsset ? primaryAsset : fallbackAsset;
  if (!isSpriteReady(asset)) {
    return false;
  }

  const progress = Math.min(0.999, Math.max(0, (performance.now() - transition.startedAt) / transition.durationMs));
  const forwardFrame = Math.min(animation.frameCount - 1, Math.floor(progress * animation.frameCount));
  const frameIndex = transition.type === "mounting"
    ? animation.frameCount - 1 - forwardFrame
    : forwardFrame;
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const facing = transition.visualFacing === "left" ? "left" : "right";

  drawFemaleBikeShadow(x, y);
  if (transition.type === "dismounting" && isMoRidingWithPlayer()) {
    drawMoVehiclePassenger(x, y - 10, facing);
  }
  return drawFemaleBikeFrame(asset, animation, frameIndex, x, y, facing, FEMALE_BIKE_DRAW_HEIGHT);
}

export function drawFemaleBikeDealershipPreview(centerX, bottomY) {
  const animation = FEMALE_BIKE_ANIMATIONS.rideNoHelmet;
  const asset = getFemaleBikeAnimationSprite("rideNoHelmet");
  if (!isSpriteReady(asset)) {
    return false;
  }

  return drawSheetFrame(asset, animation, animation.idleFrame, {
    centerX,
    bottomY,
    height: 43,
    flipHorizontal: false
  });
}

function drawFemaleBikeRide(x, y, facing) {
  if (state.profile.gender !== "female") {
    return false;
  }

  const animation = FEMALE_BIKE_ANIMATIONS.rideHelmet;
  const asset = getFemaleBikeAnimationSprite("rideHelmet");
  if (!isSpriteReady(asset)) {
    return false;
  }

  const frameIndex = player.moving
    ? Math.floor(performance.now() / (1000 / animation.fps)) % animation.frameCount
    : animation.idleFrame;
  drawFemaleBikeShadow(x, y);
  return drawFemaleBikeFrame(asset, animation, frameIndex, x, y, facing, FEMALE_BIKE_DRAW_HEIGHT);
}

function drawFemaleBikeFrame(asset, animation, frameIndex, x, y, facing, height) {
  return drawSheetFrame(asset, animation, frameIndex, {
    centerX: x + player.width / 2,
    bottomY: y + 51,
    height,
    flipHorizontal: facing !== animation.sourceFacing
  });
}

function drawSheetFrame(asset, animation, frameIndex, options) {
  if (!isSpriteReady(asset)) {
    return false;
  }

  const height = Math.max(1, Math.round(options.height));
  const width = Math.max(1, Math.round(height * animation.frameWidth / animation.frameHeight));
  const x = Math.round(options.centerX - width / 2);
  const y = Math.round(options.bottomY - height);
  const sourceX = Math.max(0, Math.min(animation.frameCount - 1, frameIndex)) * animation.frameWidth;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (options.flipHorizontal) {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    ctx.drawImage(asset.drawable, sourceX, 0, animation.frameWidth, animation.frameHeight, 0, 0, width, height);
  } else {
    ctx.drawImage(asset.drawable, sourceX, 0, animation.frameWidth, animation.frameHeight, x, y, width, height);
  }
  ctx.restore();
  return true;
}

function drawFemaleBikeShadow(x, y) {
  drawGroundShadow(x + player.width / 2, y + 47, 51, 7);
}

function isFemaleHorizontalFacing(facing) {
  return state.profile.gender === "female" && (facing === "left" || facing === "right");
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

function drawPushedBikeAsset(x, y, facing) {
  const asset = getVinfastBikeSprite();
  if (!isSpriteReady(asset)) return false;
  const width = 48;
  const height = Math.max(1, Math.round(width * (asset.height / asset.width)));
  drawGroundShadow(x + 12, y + height - 3, 43, 6);
  return drawPreparedSprite(asset, {
    x: Math.round(x - width / 2),
    y,
    width,
    height,
    flipHorizontal: facing === "right"
  });
}

function drawFallbackPushingPlayer(x, y, facing) {
  drawGroundShadow(x + player.width / 2, y + 31, player.width + 8, 6);
  ctx.fillStyle = getGender() === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(x + 3, y + 12, 18, 18);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 5, y, 14, 14);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 4, y + 30, 6, 7);
  ctx.fillRect(x + 14, y + 30, 6, 7);
  ctx.fillRect(facing === "left" ? x + 3 : x + 13, y, 8, 5);
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
