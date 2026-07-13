import { canvas, ctx, player, runtime } from "../state.js";
import { camera } from "../camera.js";
import { getCurrentMap } from "../utils/helpers.js";
import { drawBackground, drawBuildings, drawExits, drawGroundPatches, drawLandmarks, drawNpcs, drawShops, drawVehicleShops, drawWalkZones, drawWater } from "./renderMap.js";
import { drawDecorations } from "./renderDecorations.js";
import { drawInteractionPoints } from "./renderInteractionPoints.js";
import { drawPlayer } from "./renderPlayer.js";
import { drawParkingAreas } from "./renderParking.js";
import { drawAmbientVehicles } from "./renderAmbientVehicles.js";
import { drawChurchInterior } from "./renderChurchInterior.js";
import { drawScheduledNpcs } from "./renderScheduledNpcs.js";
import { drawMapTransition } from "../systems/mapTransition.js";
import { drawTimeOfDayTint, drawWorldLightAccents } from "./renderLighting.js";
import {
  drawPlayerWeatherEffects,
  drawRainOverlay,
  drawWeatherAtmosphere,
  drawWetReflections,
  drawWetSurfaceEffects
} from "./renderWeather.js";
import { isRidingVehicle } from "../systems/vehicle.js";
import { drawAreaVisualAmbience } from "./renderAreaAmbience.js";
import { drawVehicleHornIndicator } from "./renderNpcReactions.js";
import { drawPhotoModeOverlay, drawPhotoSpots } from "./renderPhotoMode.js";

export function drawGame() {
  const map = getCurrentMap();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  drawWorldBase(map);
  ctx.restore();

  drawTimeOfDayTint(map);
  drawWeatherAtmosphere(map);

  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
  drawWorldLightAccents(map);
  drawWetReflections(map);
  drawAreaVisualAmbience(map);
  drawPhotoSpots(map);
  if (map.kind !== "churchInterior") {
    drawAmbientVehicles(map);
    drawNpcs(map);
  }
  if (!runtime.photoMode?.active) {
    drawInteractionPoints(map);
  }
  drawScheduledNpcs(map);
  drawInteractionHighlight();
  drawPlayerWeatherEffects(isRidingVehicle());
  drawPlayer();
  drawVehicleHornIndicator();
  ctx.restore();
  drawRainOverlay(map);
  drawPhotoModeOverlay();
  drawMapTransition();
}

function drawWorldBase(map) {
  if (map.kind === "churchInterior") {
    drawChurchInterior(map);
    drawExits(map);
  } else {
    drawBackground(map);
    drawGroundPatches(map);
    drawWater(map);
    drawWalkZones(map);
    drawWetSurfaceEffects(map);
    drawDecorations(map, "behind");
    drawBuildings(map);
    drawLandmarks(map);
    drawShops(map);
    drawVehicleShops(map);
    drawParkingAreas(map);
    drawExits(map);
    drawDecorations(map, "front");
  }
}

export function drawInteractionHighlight() {
  if (!runtime.nearbyInteractable) {
    return;
  }

  const target = runtime.nearbyInteractable.object;
  if (runtime.nearbyInteractable.point) {
    const point = runtime.nearbyInteractable.point;
    ctx.strokeStyle = "#fff36d";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(point.x - 18, point.y - 18, 36, 36);
    ctx.setLineDash([]);
    return;
  }

  if (target.width > 360 || target.height > 260) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const markerX = Math.max(target.x + 28, Math.min(playerCenterX, target.x + target.width - 28));
    const markerY = Math.max(target.y + 28, Math.min(playerCenterY, target.y + target.height - 28));
    ctx.strokeStyle = "#fff36d";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(markerX - 26, markerY - 26, 52, 52);
    ctx.setLineDash([]);
    return;
  }

  ctx.strokeStyle = "#fff36d";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(target.x - 5, target.y - 5, target.width + 10, target.height + 10);
  ctx.setLineDash([]);
}
