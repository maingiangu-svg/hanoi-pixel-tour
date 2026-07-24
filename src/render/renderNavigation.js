import { canvas, ctx, player, runtime, state, ui } from "../state.js";
import { worldToScreen } from "../camera.js";
import { getCurrentRoute, getResolvedObjective } from "../systems/navigation.js";
import { isOverlayOpen } from "../systems/modal.js";
import { getRouteGraph } from "../systems/routeGraph.js";

const SAFE_MARGIN = 34;
const TOP_SAFE_MARGIN = 54;
const DISTANT_TARGET_WORLD_UNITS = 450;
const ARRIVAL_DISTANCE_WORLD_UNITS = 38;

export function drawNavigationGuidance() {
  if (runtime.navigation?.debugGraph) drawDebugRouteGraph();
  if (!state.navigation?.showWorldGuidance || isOverlayOpen() || runtime.photoMode?.active) return;
  const target = getResolvedObjective();
  if (!target || target.unavailable || target.mapId !== state.currentMapId) return;
  const guidance = getDirectionalGuidanceState(target);
  if (guidance.reached) {
    if (guidance.inside) drawWorldTargetMarker(guidance.targetScreen.x, guidance.targetScreen.y, target);
    return;
  }

  drawWorldRoute(target);
  drawPlayerDirectionArrow(guidance.angle);
  if (guidance.inside) drawWorldTargetMarker(guidance.targetScreen.x, guidance.targetScreen.y, target);
  if (guidance.showScreenArrow) drawScreenAnchorArrow(guidance.angle, guidance.distanceMeters, target);
}

export function getDirectionalGuidanceState(target = getResolvedObjective()) {
  if (!target || target.unavailable || target.mapId !== state.currentMapId) {
    return {
      visible: false,
      reached: false,
      inside: false,
      showPlayerArrow: false,
      showScreenArrow: false,
      angle: 0,
      distance: 0,
      distanceMeters: 0,
      targetScreen: null
    };
  }

  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const dx = target.x - playerCenterX;
  const dy = target.y - playerCenterY;
  const distance = Math.hypot(dx, dy);
  const targetScreen = worldToScreen(target.x, target.y);
  const inside = targetScreen.x >= SAFE_MARGIN &&
    targetScreen.x <= canvas.width - SAFE_MARGIN &&
    targetScreen.y >= TOP_SAFE_MARGIN &&
    targetScreen.y <= canvas.height - SAFE_MARGIN;
  const reached = distance <= ARRIVAL_DISTANCE_WORLD_UNITS || isTargetInteractionPromptActive(target);

  return {
    visible: true,
    reached,
    inside,
    showPlayerArrow: !reached,
    showScreenArrow: !reached && (!inside || distance > DISTANT_TARGET_WORLD_UNITS),
    angle: Math.atan2(dy, dx),
    distance,
    distanceMeters: Math.round(distance / 10),
    targetScreen
  };
}

function drawWorldRoute(target) {
  const route = getCurrentRoute();
  if (route.length < 2) return;
  const playerCenter = {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2
  };
  const spacing = 56;
  const phase = (performance.now() / 18) % spacing;
  let travelled = 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (let index = 0; index < route.length - 1; index += 1) {
    const start = index === 0 ? playerCenter : route[index];
    const end = route[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) continue;
    const angle = Math.atan2(dy, dx);
    const segmentOffset = (spacing - ((travelled + phase) % spacing)) % spacing;
    for (let distance = segmentOffset; distance < length; distance += spacing) {
      const ratio = distance / length;
      const worldX = start.x + dx * ratio;
      const worldY = start.y + dy * ratio;
      if (Math.hypot(worldX - playerCenter.x, worldY - playerCenter.y) < 38) continue;
      if (Math.hypot(worldX - target.x, worldY - target.y) < 30) continue;
      const screen = worldToScreen(worldX, worldY);
      if (screen.x < 16 || screen.x > canvas.width - 16 || screen.y < TOP_SAFE_MARGIN + 8 || screen.y > canvas.height - 18) continue;
      const targetDistance = Math.hypot(worldX - target.x, worldY - target.y);
      const alpha = Math.max(0.38, Math.min(0.72, 0.8 - targetDistance / 3200));
      drawRouteChevron(Math.round(screen.x), Math.round(screen.y), angle, alpha);
    }
    travelled += length;
  }
  ctx.restore();
}

function drawPlayerDirectionArrow(angle) {
  const riding = state.vehicle?.status === "riding";
  const foot = worldToScreen(
    player.x + player.width / 2,
    player.y + player.height + (riding ? 18 : 11)
  );
  const bob = Math.floor(performance.now() / 180) % 2;

  ctx.save();
  ctx.translate(Math.round(foot.x), Math.round(foot.y - bob));
  ctx.rotate(angle);
  drawPixelArrow(0, 0, 13, "#10151b", "#ffd95a", "#fff8d6");
  ctx.restore();
}

function drawScreenAnchorArrow(angle, distanceMeters, target) {
  const anchorX = canvas.width - 49;
  const anchorY = Math.round(canvas.height * 0.56);
  const bob = Math.floor(performance.now() / 200) % 2;

  ctx.save();
  ctx.translate(anchorX, anchorY - bob);
  ctx.fillStyle = "rgba(18, 23, 31, 0.94)";
  ctx.fillRect(-27, -27, 54, 54);
  ctx.strokeStyle = "#10151b";
  ctx.lineWidth = 5;
  ctx.strokeRect(-27, -27, 54, 54);
  ctx.strokeStyle = target.stage === "reachParking" ? "#8ee3ff" : "#ffd95a";
  ctx.lineWidth = 2;
  ctx.strokeRect(-22, -22, 44, 44);
  ctx.rotate(angle);
  drawPixelArrow(0, 0, 22, "#080b10", target.stage === "reachParking" ? "#8ee3ff" : "#ffd95a", "#fff8d6");
  ctx.restore();

  drawScreenDistanceBadge(distanceMeters, anchorX, anchorY + 39);
}

function drawPixelArrow(x, y, size, outline, fill, highlight) {
  ctx.fillStyle = outline;
  drawArrow(x, y, size);
  ctx.fillStyle = fill;
  drawArrow(x - 2, y, size - 5);
  ctx.fillStyle = highlight;
  ctx.fillRect(x + 1, y - 2, Math.max(3, Math.floor(size * 0.34)), 4);
}

function drawScreenDistanceBadge(distanceMeters, x, y) {
  const text = `${distanceMeters}m`;
  ctx.save();
  ctx.font = "900 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.max(42, Math.ceil(ctx.measureText(text).width) + 12);
  ctx.fillStyle = "rgba(18, 23, 31, 0.94)";
  ctx.fillRect(Math.round(x - width / 2), y - 9, width, 18);
  ctx.strokeStyle = "#10151b";
  ctx.lineWidth = 3;
  ctx.strokeRect(Math.round(x - width / 2), y - 9, width, 18);
  ctx.fillStyle = "#fff8d6";
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function isTargetInteractionPromptActive(target) {
  const nearby = runtime.nearbyInteractable;
  if (!nearby || uiPromptIsHidden()) return false;
  const nearbyTargetId = nearby.source?.id || nearby.object?.id;
  return Boolean(nearbyTargetId && [target.id, target.targetId].includes(nearbyTargetId));
}

function uiPromptIsHidden() {
  return !ui.nearbyHint || ui.nearbyHint.classList.contains("hidden");
}

function drawRouteChevron(x, y, angle, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(16, 18, 24, 0.92)";
  ctx.fillRect(-8, -5, 10, 3);
  ctx.fillRect(-8, 3, 10, 3);
  ctx.fillRect(0, -3, 4, 7);
  ctx.fillStyle = "#fff068";
  ctx.fillRect(-6, -3, 8, 2);
  ctx.fillRect(-6, 2, 8, 2);
  ctx.fillRect(1, -2, 3, 5);
  ctx.fillStyle = "#fff9d0";
  ctx.fillRect(0, -1, 2, 2);
  ctx.restore();
}

function drawDebugRouteGraph() {
  const graph = getRouteGraph(state.currentMapId, runtime.navigation?.routeMode || "walking");
  ctx.save();
  ctx.fillStyle = "rgba(255, 225, 91, 0.62)";
  graph.nodes.forEach((node) => {
    const screen = worldToScreen(node.x, node.y);
    if (screen.x < 0 || screen.x > canvas.width || screen.y < 0 || screen.y > canvas.height) return;
    ctx.fillRect(Math.round(screen.x) - 1, Math.round(screen.y) - 1, 3, 3);
  });
  ctx.restore();
}

function drawWorldTargetMarker(x, y, target) {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const distance = Math.hypot(target.x - playerCenterX, target.y - playerCenterY);
  const near = distance < 250;
  const pulse = Math.floor(performance.now() / 220) % 3;
  const markerY = Math.round(y - 32 - pulse);
  ctx.save();
  ctx.translate(Math.round(x), markerY);
  ctx.fillStyle = "#151515";
  drawDiamond(0, 0, near ? 12 : 10);
  ctx.fillStyle = target.stage === "reachParking" ? "#8ee3ff" : "#ffe15b";
  drawDiamond(0, 0, near ? 8 : 7);
  ctx.fillStyle = "#fff8d6";
  ctx.fillRect(-2, -3, 4, 5);
  ctx.fillStyle = "#151515";
  ctx.fillRect(-1, 5, 2, near ? 7 : 5);
  if (near) drawLabel(target.stageLabel || target.label, 0, -21);
  ctx.restore();
}

function drawArrow(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x - size + 2, y - size + 3);
  ctx.lineTo(x - size + 2, y + size - 3);
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}

function drawLabel(text, x, y) {
  ctx.font = "700 10px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = Math.min(230, Math.ceil(ctx.measureText(text).width) + 12);
  ctx.fillStyle = "rgba(21, 21, 21, 0.92)";
  ctx.fillRect(Math.round(x - width / 2), Math.round(y - 8), width, 16);
  ctx.strokeStyle = "#ffe15b";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(x - width / 2), Math.round(y - 8), width, 16);
  ctx.fillStyle = "#fff8d6";
  ctx.fillText(text, x, y + 1, width - 6);
}
