import { ctx } from "../state.js";

export function drawMoSprite(npc) {
  const phase = performance.now() / 320;
  const walking = npc.activity === "walking";
  const sitting = npc.activity === "resting" || npc.activity === "attendingMass";
  const washing = npc.activity === "washing";
  const playing = npc.activity === "playing";
  const bob = playing ? Math.round(Math.sin(phase) * 2) : walking ? Math.round(Math.sin(phase * 1.9)) : 0;
  const legSwing = walking ? Math.round(Math.sin(phase * 2) * 3) : 0;
  const x = Math.round(npc.x);
  const y = Math.round(npc.y + bob);

  ctx.fillStyle = "rgba(0,0,0,0.27)";
  ctx.fillRect(x - 6, y + 37, 34, 7);
  ctx.fillStyle = "#31313a";
  ctx.fillRect(x + 3, y + 31 + legSwing, 7, sitting ? 5 : 12);
  ctx.fillRect(x + 15, y + 31 - legSwing, 7, sitting ? 5 : 12);
  drawMoBody(x, y + 14, 23, 20);
  drawMoHead(x + 4, y + 1, npc.facing);

  if (washing) {
    const arm = Math.round(Math.sin(phase * 1.4) * 4);
    ctx.fillStyle = "#f3d6a4";
    ctx.fillRect(x - 4, y + 20 + arm, 7, 13);
    ctx.fillRect(x + 22, y + 22 - arm, 7, 13);
    drawHouseholdBucket(x + 26, y + 28);
  } else if (playing) {
    ctx.fillStyle = "#f3d6a4";
    ctx.fillRect(x - 6, y + 15, 7, 12);
    ctx.fillRect(x + 24, y + 15, 7, 12);
  } else if (sitting) {
    ctx.fillStyle = "#f3d6a4";
    ctx.fillRect(x - 3, y + 21, 7, 9);
    ctx.fillRect(x + 22, y + 21, 7, 9);
  }
}

export function drawMoVehiclePassenger(x, y, facing) {
  if (facing === "left" || facing === "right") {
    const passengerX = facing === "right" ? x - 10 : x + 12;
    drawMoBody(passengerX, y + 16, 15, 13);
    drawMoHead(passengerX + 1, y + 4, facing, { compact: true });
    ctx.fillStyle = "#f3d6a4";
    ctx.fillRect(facing === "right" ? passengerX + 14 : passengerX - 4, y + 21, 7, 4);
    return;
  }

  const passengerX = x + 17;
  const passengerY = y + 4;
  drawMoBody(passengerX, passengerY + 13, 15, 13);
  drawMoHead(passengerX + 1, passengerY + 1, facing, { compact: true });
  ctx.fillStyle = "#f3d6a4";
  ctx.fillRect(passengerX - 3, passengerY + 19, 5, 4);
  ctx.fillRect(passengerX + 16, passengerY + 19, 5, 4);
}

function drawMoBody(x, y, width, height) {
  ctx.fillStyle = "#d66b9a";
  ctx.fillRect(x, y, width, height);
}

function drawMoHead(x, y, facing, options = {}) {
  const compact = Boolean(options.compact);
  const width = compact ? 14 : 17;
  const hairWidth = compact ? 18 : 21;
  const sideHeight = compact ? 11 : 14;
  ctx.fillStyle = "#f3d6a4";
  ctx.fillRect(x, y, width, compact ? 13 : 15);
  ctx.fillStyle = "#382c32";
  ctx.fillRect(x - 2, y - 3, hairWidth, compact ? 7 : 8);
  ctx.fillRect(x - 3, y + 4, 5, sideHeight);
  ctx.fillRect(x + width - 2, y + 4, 5, sideHeight);
  ctx.fillStyle = "#151515";
  if (facing === "down") {
    ctx.fillRect(x + 4, y + 7, 3, 3);
    ctx.fillRect(x + width - 7, y + 7, 3, 3);
  } else if (facing === "left") {
    ctx.fillRect(x + 3, y + 7, 3, 3);
  } else if (facing === "right") {
    ctx.fillRect(x + width - 6, y + 7, 3, 3);
  }
}

function drawHouseholdBucket(x, y) {
  ctx.fillStyle = "#1d3a4c";
  ctx.fillRect(x - 1, y - 1, 20, 16);
  ctx.fillStyle = "#79b5d0";
  ctx.fillRect(x, y, 18, 14);
  ctx.fillStyle = "#d8edf5";
  ctx.fillRect(x + 4, y - 4, 10, 4);
}
