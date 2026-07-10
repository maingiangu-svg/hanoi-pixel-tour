import { keys, player, state } from "../state.js";
import { isPlayerAreaWalkable, isVehicleAreaWalkable } from "../utils/collision.js";
import { isOverlayOpen } from "./modal.js";
import { saveGameThrottled } from "../storage.js";
import { getPlayerMoveSpeed, isRidingVehicle } from "./vehicle.js";

export function movePlayer() {
  if (isOverlayOpen()) {
    player.moving = false;
    return;
  }

  let dx = 0;
  let dy = 0;

  if (keys.arrowup || keys.w) dy -= 1;
  if (keys.arrowdown || keys.s) dy += 1;
  if (keys.arrowleft || keys.a) dx -= 1;
  if (keys.arrowright || keys.d) dx += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  player.moving = dx !== 0 || dy !== 0;

  if (player.moving) {
    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? "right" : "left";
    } else {
      player.facing = dy > 0 ? "down" : "up";
    }

    const speed = getPlayerMoveSpeed();
    tryMove(dx * speed, 0);
    tryMove(0, dy * speed);
    player.step += isRidingVehicle() ? 0.55 : 0.35;
    saveGameThrottled();
  }
}

export function tryMove(dx, dy) {
  const nextX = player.x + dx;
  const nextY = player.y + dy;

  const canMove = isRidingVehicle()
    ? isVehicleAreaWalkable(nextX, nextY)
    : isPlayerAreaWalkable(nextX, nextY);

  if (canMove) {
    player.x = nextX;
    player.y = nextY;
    state.player.x = Math.round(player.x);
    state.player.y = Math.round(player.y);
  }
}
