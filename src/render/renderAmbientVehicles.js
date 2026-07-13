import { ctx } from "../state.js";
import { isRectVisible } from "../camera.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawVehicleRainEffects } from "./renderWeather.js";
import { getAmbientVehicleSpeedMultiplier, getWeatherIntensity, isRaining } from "../systems/weather.js";
import { getAreaTrafficFactor, getAreaTrafficSpeedMultiplier } from "../systems/areaAmbience.js";

const routeRuntime = new Map();

export function drawAmbientVehicles(map) {
  const time = performance.now() / 1000;
  (map.ambientVehicles || []).forEach((vehicle, index) => {
    const position = getRoutePosition(vehicle, time, map.id);
    const trafficFactor = getAreaTrafficFactor(map.id, position.x, position.y);
    const priority = vehicle.areaPriority ?? (0.16 + index * 0.26);
    if (priority > trafficFactor) {
      return;
    }
    const rect = { x: position.x - 28, y: position.y - 28, width: 56, height: 56 };
    if (!isRectVisible(rect, 80)) {
      return;
    }

    drawAmbientScooter(position.x, position.y, position.direction, vehicle, time);
  });
}

function getRoutePosition(vehicle, time, mapId) {
  let route = routeRuntime.get(vehicle.id);
  if (!route) {
    route = { progress: (time * vehicle.speed + (vehicle.offset || 0)) % 1, lastTime: time };
    routeRuntime.set(vehicle.id, route);
  }
  const elapsed = Math.min(0.2, Math.max(0, time - route.lastTime));
  route.lastTime = time;
  const probeX = vehicle.start.x + (vehicle.end.x - vehicle.start.x) * route.progress;
  const probeY = vehicle.start.y + (vehicle.end.y - vehicle.start.y) * route.progress;
  route.progress = (route.progress + elapsed * vehicle.speed * getAmbientVehicleSpeedMultiplier() * getAreaTrafficSpeedMultiplier(mapId, probeX, probeY)) % 1;
  const progress = route.progress;
  const x = vehicle.start.x + (vehicle.end.x - vehicle.start.x) * progress;
  const y = vehicle.start.y + (vehicle.end.y - vehicle.start.y) * progress;
  const direction = Math.abs(vehicle.end.x - vehicle.start.x) >= Math.abs(vehicle.end.y - vehicle.start.y)
    ? (vehicle.end.x >= vehicle.start.x ? "right" : "left")
    : (vehicle.end.y >= vehicle.start.y ? "down" : "up");
  return { x: Math.round(x), y: Math.round(y), direction };
}

function drawAmbientScooter(x, y, direction, vehicle, time) {
  drawVehicleRainEffects(x, y, direction, true);
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

  drawGroundShadow(baseX + 23, baseY + 30, 46, 6);
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
  drawAmbientRaincoat(baseX + 18, baseY + 5, 14, 13);
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

  drawGroundShadow(baseX + 13, baseY + 38, 34, 6);
  ctx.fillStyle = "#17191f";
  ctx.fillRect(baseX - 1 + wheelBob, baseY + 8, 9, 12);
  ctx.fillRect(baseX + 20 - wheelBob, baseY + 8, 9, 12);
  ctx.fillStyle = vehicle.color || "#d8484f";
  ctx.fillRect(baseX + 3, baseY + 16, 22, 22);
  ctx.fillStyle = "#2f3d4a";
  ctx.fillRect(baseX + 6, baseY + 12, 16, 8);
  ctx.fillStyle = vehicle.riderColor || "#315f8f";
  ctx.fillRect(baseX + 5, baseY + 7, 18, 14);
  drawAmbientRaincoat(baseX + 5, baseY + 7, 18, 14);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(baseX + 8, baseY - 4, 12, 11);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(baseX + 7, baseY - 7, 14, 5);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(baseX + 10, down ? baseY + 38 : baseY + 2, 8, 4);
}

function drawAmbientRaincoat(x, y, width, height) {
  if (!isRaining()) {
    return;
  }
  const intensity = getWeatherIntensity();
  ctx.fillStyle = intensity > 0.72 ? "#d6b23c" : "#4f8292";
  ctx.fillRect(x - 2, y + 3, width + 4, height - 1);
  ctx.fillStyle = "rgba(237, 246, 239, 0.3)";
  ctx.fillRect(x + 2, y + 5, 3, Math.max(4, height - 6));
}
