import { isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getCurrentChapter1Point, isChapter1Active } from "../systems/chapter1.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

export function drawChapter1Story(map) {
  if (!isChapter1Active() || map.id !== "hoanKiem") return;
  const point = getCurrentChapter1Point();
  if (!point || !isRectVisible({ x: point.x - 48, y: point.y - 54, width: 96, height: 108 }, 90)) return;
  const phase = performance.now() / 420;
  drawStoryProp(point, phase);
  const playerCenter = getPlayerCenter();
  if (Math.hypot(playerCenter.x - point.x, playerCenter.y - point.y) <= point.visibleRange) {
    drawStoryMarker(point.x, point.y - getMarkerOffset(point.kind), phase);
  }
}

function drawStoryProp(point, phase) {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  switch (point.kind) {
    case "lamp":
      ctx.fillStyle = "#ffe78b";
      ctx.fillRect(x - 5, y - 15, 10, 9);
      ctx.fillStyle = "#fff7c2";
      ctx.fillRect(x - 2, y - 13, 4, 4);
      break;
    case "motorbike":
      drawGroundShadow(x, y + 12, 38, 6);
      ctx.fillStyle = "#252a31";
      ctx.fillRect(x - 18, y + 5, 10, 10);
      ctx.fillRect(x + 12, y + 5, 10, 10);
      ctx.fillStyle = "#c34a45";
      ctx.fillRect(x - 11, y, 28, 8);
      ctx.fillRect(x + 3, y - 8, 10, 10);
      break;
    case "phone":
      drawPerson(x, y, "#4f8bb8");
      ctx.fillStyle = "#dcecf2";
      ctx.fillRect(x + 10, y - 5, 6, 10);
      break;
    case "money":
      ctx.fillStyle = "#3d3027";
      ctx.fillRect(x - 12, y - 8, 28, 18);
      ctx.fillStyle = "#8fc59b";
      ctx.fillRect(x - 9, y - 5, 22, 12);
      ctx.fillStyle = "#e7f0c5";
      ctx.fillRect(x - 2, y - 2, 8, 5);
      break;
    case "information":
    case "oldBoard":
      drawGroundShadow(x, y + 13, 34, 5);
      ctx.fillStyle = "#66503a";
      ctx.fillRect(x - 16, y - 22, 32, 24);
      ctx.fillStyle = point.kind === "oldBoard" ? "#d0b98b" : "#ece0bd";
      ctx.fillRect(x - 13, y - 19, 26, 17);
      ctx.fillStyle = "#624f39";
      ctx.fillRect(x - 10, y - 15, 20, 2);
      ctx.fillRect(x - 10, y - 10, 16, 2);
      ctx.fillRect(x - 2, y + 2, 4, 16);
      break;
    case "alley":
      ctx.fillStyle = "#613d2f";
      ctx.fillRect(x - 20, y - 24, 40, 9);
      ctx.fillStyle = "#f1d596";
      ctx.fillRect(x - 16, y - 21, 32, 3);
      break;
    case "child":
      drawPerson(x, y + 8, "#e6b84e", true);
      ctx.fillStyle = "#fff0a6";
      ctx.fillRect(x + 15, y - 10 + Math.round(Math.sin(phase) * 2), 3, 3);
      break;
    case "food":
      drawGroundShadow(x, y + 13, 36, 6);
      ctx.fillStyle = "#8f4f35";
      ctx.fillRect(x - 18, y - 3, 36, 17);
      ctx.fillStyle = "#e8dfbf";
      ctx.fillRect(x - 12, y - 8, 24, 7);
      ctx.fillStyle = "#d4bd85";
      ctx.fillRect(x - 7, y - 6, 14, 3);
      break;
    case "teaVendor":
    case "teaTask":
      ctx.fillStyle = "#d84b4b";
      ctx.fillRect(x - 21, y + 4, 12, 7);
      ctx.fillRect(x + 12, y + 4, 12, 7);
      ctx.fillStyle = "#2f78a6";
      ctx.fillRect(x - 10, y - 4, 22, 15);
      ctx.fillStyle = "#d9d1a7";
      ctx.fillRect(x - 3, y - 9, 8, 7);
      break;
    case "turtleSignal": {
      const ripple = 14 + Math.round((Math.sin(phase) + 1) * 3);
      ctx.strokeStyle = "#ccefe8";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - ripple, y - 5, ripple * 2, 10);
      ctx.fillStyle = "#ecfff8";
      ctx.fillRect(x - 2, y - 2, 5, 5);
      break;
    }
    case "newspaperVendor":
      drawPerson(x, y, "#7d8ba6");
      ctx.fillStyle = "#e6dfcf";
      ctx.fillRect(x - 18, y + 2, 16, 12);
      ctx.fillStyle = "#4c4c4c";
      ctx.fillRect(x - 16, y + 4, 12, 2);
      ctx.fillRect(x - 16, y + 8, 9, 2);
      break;
    default:
      break;
  }
}

function drawPerson(x, y, color, child = false) {
  const height = child ? 34 : 44;
  drawGroundShadow(x, y + height / 2, child ? 20 : 26, 5);
  ctx.fillStyle = "#2c2930";
  ctx.fillRect(x - 8, y - height / 2, 16, 5);
  ctx.fillStyle = "#e6b28d";
  ctx.fillRect(x - 7, y - height / 2 + 4, 14, child ? 9 : 12);
  ctx.fillStyle = color;
  ctx.fillRect(x - 9, y - height / 2 + (child ? 13 : 16), 18, child ? 12 : 17);
  ctx.fillStyle = "#33343b";
  ctx.fillRect(x - 7, y + (child ? 4 : 11), 5, child ? 8 : 11);
  ctx.fillRect(x + 2, y + (child ? 4 : 11), 5, child ? 8 : 11);
}

function drawStoryMarker(x, y, phase) {
  const lift = Math.round(Math.sin(phase * 1.4) * 2);
  const markerY = Math.round(y + lift);
  ctx.fillStyle = "#211d19";
  ctx.fillRect(Math.round(x) - 7, markerY - 7, 15, 15);
  ctx.fillStyle = "#ffd85d";
  ctx.fillRect(Math.round(x) - 5, markerY - 5, 11, 11);
  ctx.fillStyle = "#fff7ba";
  ctx.fillRect(Math.round(x) - 1, markerY - 3, 3, 6);
  ctx.fillRect(Math.round(x) - 1, markerY + 5, 3, 3);
}

function getMarkerOffset(kind) {
  return ["phone", "child", "newspaperVendor"].includes(kind) ? 42 : 30;
}
