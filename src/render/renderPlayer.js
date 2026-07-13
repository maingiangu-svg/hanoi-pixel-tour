import { ctx, player, state } from "../state.js";
import { isRidingVehicle } from "../systems/vehicle.js";
import { drawCharacterSprite } from "./renderCharacterSprite.js";
import { drawVehicleWithRider } from "./renderVehicle.js";
import { getCharacterSprite, isSpriteReady } from "./spriteAssets.js";

export function drawPlayer() {
  if (isRidingVehicle()) {
    drawVehicleWithRider();
    return;
  }

  const gender = state.profile.gender === "female" ? "female" : "male";
  const x = Math.round(player.x);
  const y = Math.round(player.y);
  const bob = player.moving ? Math.round(Math.sin(player.step) * 1) : 0;

  if (drawAssetPlayer(gender, x, y, bob)) {
    return;
  }

  drawFallbackPlayer(gender, x, y);
}

function drawAssetPlayer(gender, x, y, bob) {
  if (!isSpriteReady(getCharacterSprite(gender))) {
    return false;
  }

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(x - 3, y + 33, player.width + 7, 5);
  return drawCharacterSprite({
    gender,
    centerX: x + player.width / 2,
    topY: y - 4 + bob,
    height: 42,
    facing: player.facing
  });
}

function drawFallbackPlayer(gender, x, y) {
  const legOffset = player.moving ? Math.floor(Math.sin(player.step) * 3) : 0;

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(x - 4, y + 29, player.width + 9, 7);

  ctx.fillStyle = "#2f3542";
  ctx.fillRect(x + 4, y + 23, 6, 10 + legOffset);
  ctx.fillRect(x + 14, y + 23, 6, 10 - legOffset);
  ctx.fillStyle = "#fff3c4";
  ctx.fillRect(x + 4, y + 32 + legOffset, 6, 3);
  ctx.fillRect(x + 14, y + 32 - legOffset, 6, 3);

  ctx.fillStyle = gender === "female" ? "#2fa38b" : "#d8484f";
  ctx.fillRect(x + 2, y + 12, 20, 18);
  ctx.fillStyle = gender === "female" ? "#f7e08a" : "#f2bd45";
  ctx.fillRect(x + 8, y + 14, 8, 4);

  ctx.fillStyle = gender === "female" ? "#7650b8" : "#3056a3";
  if (player.facing === "left") {
    ctx.fillRect(x + 18, y + 15, 8, 16);
  } else {
    ctx.fillRect(x - 2, y + 15, 8, 16);
  }

  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 4, y + 1, 16, 14);

  ctx.fillStyle = "#2b2b32";
  if (player.facing === "up") {
    ctx.fillRect(x + 2, y, 20, 8);
    if (gender === "female") {
      ctx.fillRect(x + 1, y + 5, 4, 12);
      ctx.fillRect(x + 19, y + 5, 4, 12);
    }
    ctx.fillStyle = gender === "female" ? "#7650b8" : "#3056a3";
    ctx.fillRect(x + 6, y + 10, 12, 8);
  } else {
    ctx.fillRect(x + 2, y - 2, 20, gender === "female" ? 9 : 8);
    if (gender === "female") {
      ctx.fillRect(x + 1, y + 5, 4, 11);
      ctx.fillRect(x + 19, y + 5, 4, 11);
    }
    ctx.fillStyle = "#fff4c7";
    ctx.fillRect(x + 7, y + 7, 3, 3);
    ctx.fillRect(x + 14, y + 7, 3, 3);
    ctx.fillStyle = gender === "female" ? "#7d4131" : "#9b4d35";
    ctx.fillRect(x + 8, y + 12, 8, 2);
  }

  if (gender === "male") {
    ctx.fillStyle = "#f4c542";
    ctx.fillRect(x + 1, y - 4, 18, 5);
    if (player.facing === "right") {
      ctx.fillRect(x + 16, y - 1, 8, 4);
    }
  }
}
