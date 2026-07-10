import { ctx } from "../state.js";
import { isRectVisible } from "../camera.js";

export function drawAmbientVehicles(map) {
  const time = performance.now() / 1000;
  (map.ambientVehicles || []).forEach((vehicle) => {
    const position = getRoutePosition(vehicle, time);
    const rect = { x: position.x - 28, y: position.y - 28, width: 56, height: 56 };
    if (!isRectVisible(rect, 80)) {
      return;
    }

    drawAmbientScooter(position.x, position.y, position.direction, vehicle, time);
  });
}

function getRoutePosition(vehicle, time) {
  const progress = (time * vehicle.speed + (vehicle.offset || 0)) % 1;
  const x = vehicle.start.x + (vehicle.end.x - vehicle.start.x) * progress;
  const y = vehicle.start.y + (vehicle.end.y - vehicle.start.y) * progress;
  const direction = Math.abs(vehicle.end.x - vehicle.start.x) >= Math.abs(vehicle.end.y - vehicle.start.y)
    ? (vehicle.end.x >= vehicle.start.x ? "right" : "left")
    : (vehicle.end.y >= vehicle.start.y ? "down" : "up");
  return { x: Math.round(x), y: Math.round(y), direction };
}

function drawAmbientScooter(x, y, direction, vehicle, time) {
  if (direction === "left" || direction === "right") {
    drawSideScooter(x, y, direction, vehicle, time);
    return;
  }

  drawVerticalScooter(x, y, direction, vehicle, time);
}

function drawSideScooter(x, y, direction, vehicle, time) {
  const forward = direction === "right" ? 1 : -1;
  const baseX = x - 20;
  const baseY = y - 16;
  const wheelBob = Math.round(Math.sin(time * 18 + (vehicle.offset || 0) * 9));

  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.fillRect(baseX, baseY + 30, 46, 6);
  ctx.fillStyle = "#17191f";
  ctx.fillRect(baseX + 3, baseY + 25 + wheelBob, 10, 10);
  ctx.fillRect(baseX + 33, baseY + 25 - wheelBob, 10, 10);
  ctx.fillStyle = "#dbe4e6";
  ctx.fillRect(baseX + 6, baseY + 28 + wheelBob, 4, 4);
  ctx.fillRect(baseX + 36, baseY + 28 - wheelBob, 4, 4);
  ctx.fillStyle = vehicle.color || "#d8484f";
  ctx.fillRect(baseX + 10, baseY + 17, 26, 10);
  ctx.fillStyle = "#2f3d4a";
  ctx.fillRect(baseX + 18, baseY + 11, 16, 8);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(baseX + (forward > 0 ? 38 : 4), baseY + 19, 5, 5);
  ctx.fillStyle = vehicle.riderColor || "#315f8f";
  ctx.fillRect(baseX + 18, baseY + 5, 14, 13);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(baseX + 20, baseY - 6, 10, 11);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(baseX + 19, baseY - 9, 12, 5);
  ctx.fillRect(baseX + (forward > 0 ? 31 : 13), baseY + 9, 8, 3);
}

function drawVerticalScooter(x, y, direction, vehicle, time) {
  const down = direction === "down";
  const baseX = x - 14;
  const baseY = y - 20;
  const wheelBob = Math.round(Math.sin(time * 18 + (vehicle.offset || 0) * 9));

  ctx.fillStyle = "rgba(0,0,0,0.26)";
  ctx.fillRect(baseX - 4, baseY + 38, 34, 6);
  ctx.fillStyle = "#17191f";
  ctx.fillRect(baseX - 1 + wheelBob, baseY + 8, 9, 12);
  ctx.fillRect(baseX + 20 - wheelBob, baseY + 8, 9, 12);
  ctx.fillStyle = vehicle.color || "#d8484f";
  ctx.fillRect(baseX + 3, baseY + 16, 22, 22);
  ctx.fillStyle = "#2f3d4a";
  ctx.fillRect(baseX + 6, baseY + 12, 16, 8);
  ctx.fillStyle = vehicle.riderColor || "#315f8f";
  ctx.fillRect(baseX + 5, baseY + 7, 18, 14);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(baseX + 8, baseY - 4, 12, 11);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(baseX + 7, baseY - 7, 14, 5);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(baseX + 10, down ? baseY + 38 : baseY + 2, 8, 4);
}
