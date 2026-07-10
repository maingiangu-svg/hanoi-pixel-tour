import { ctx, state } from "../state.js";
import { isRectVisible } from "../camera.js";
import { drawPixelRect } from "./renderUI.js";

export function drawParkingAreas(map) {
  (map.parkingSpots || []).forEach((spot) => {
    const rect = { x: spot.x - 8, y: spot.y - 22, width: spot.width + 16, height: spot.height + 42 };
    if (!isRectVisible(rect, 80)) {
      return;
    }

    drawParkingSpot(spot);
    if (isVehicleParkedAt(spot, map.id)) {
      drawParkedScooter(spot.x + 18, spot.y + 10);
    }
  });
}

function drawParkingSpot(spot) {
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(spot.x + 4, spot.y + 4, spot.width, spot.height);
  drawPixelRect(spot.x, spot.y, spot.width, spot.height, "#4c535c", "#17191f", 3);

  ctx.strokeStyle = "#f2d86b";
  ctx.lineWidth = 2;
  for (let x = spot.x + 10; x < spot.x + spot.width - 8; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, spot.y + 5);
    ctx.lineTo(x - 8, spot.y + spot.height - 5);
    ctx.stroke();
  }

  ctx.fillStyle = "#1f2024";
  ctx.fillRect(spot.x + spot.width - 18, spot.y - 22, 4, 26);
  drawPixelRect(spot.x + spot.width - 32, spot.y - 36, 30, 20, "#f2bd45", "#151515", 2);
  ctx.fillStyle = "#151515";
  ctx.font = "900 12px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("P", spot.x + spot.width - 17, spot.y - 22);
}

function drawParkedScooter(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(x, y + 22, 42, 6);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 3, y + 20, 9, 9);
  ctx.fillRect(x + 32, y + 20, 9, 9);
  ctx.fillStyle = "#f7f7ef";
  ctx.fillRect(x + 11, y + 10, 24, 10);
  ctx.fillStyle = "#2f6d8c";
  ctx.fillRect(x + 16, y + 5, 18, 8);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 35, y + 12, 5, 4);
  ctx.fillStyle = "#151515";
  ctx.font = "900 6px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("VF", x + 23, y + 18);
}

function isVehicleParkedAt(spot, mapId) {
  const parkedAt = state.vehicle?.parkedAt;
  return Boolean(parkedAt && parkedAt.mapId === mapId && parkedAt.spotId === spot.id);
}
