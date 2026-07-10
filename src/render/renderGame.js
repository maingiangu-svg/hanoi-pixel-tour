import { ctx, runtime, WORLD_HEIGHT, WORLD_WIDTH } from "../state.js";
import { getCurrentMap } from "../utils/helpers.js";
import { drawBackground, drawBuildings, drawExits, drawLandmarks, drawNpcs, drawShops, drawWalkZones, drawWater } from "./renderMap.js";
import { drawDecorations } from "./renderDecorations.js";
import { drawPlayer } from "./renderPlayer.js";

export function drawGame() {
  const map = getCurrentMap();

  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  drawBackground(map);
  drawWater(map);
  drawWalkZones(map);
  drawDecorations(map, "behind");
  drawBuildings(map);
  drawLandmarks(map);
  drawShops(map);
  drawExits(map);
  drawDecorations(map, "front");
  drawNpcs(map);
  drawInteractionHighlight();
  drawPlayer();
}

export function drawInteractionHighlight() {
  if (!runtime.nearbyInteractable) {
    return;
  }

  const target = runtime.nearbyInteractable.object;
  ctx.strokeStyle = "#fff36d";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(target.x - 5, target.y - 5, target.width + 10, target.height + 10);
  ctx.setLineDash([]);
}
