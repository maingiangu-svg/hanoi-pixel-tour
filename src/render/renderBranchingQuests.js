import { isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { getVisibleBranchingQuestActors } from "../systems/branchingQuest.js";
import { getQuestFollowersForMap } from "../systems/questFollower.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { getPlayerCenter } from "../utils/helpers.js";

export function drawBranchingQuestActors(map) {
  const phase = performance.now() / 520;
  const playerCenter = getPlayerCenter();
  getVisibleBranchingQuestActors(map.id).forEach((actor, index) => {
    if (!isRectVisible({ x: actor.x - 16, y: actor.y - 24, width: actor.width + 32, height: actor.height + 54 }, 100)) return;
    drawQuestActor(actor, phase + index * 0.7);
    if (Math.hypot(playerCenter.x - (actor.x + actor.width / 2), playerCenter.y - (actor.y + actor.height / 2)) <= (actor.visibleRange || 180)) {
      drawQuestMarker(actor.x + actor.width / 2, actor.y - 13, phase + index);
    }
  });

  getQuestFollowersForMap(map.id).forEach((follower, index) => {
    if (!isRectVisible({ x: follower.x - 26, y: follower.y - 18, width: 92, height: 78 }, 90)) return;
    const count = Math.max(1, Math.min(3, follower.groupCount || 1));
    for (let member = count - 1; member >= 0; member -= 1) {
      drawPerson({
        x: follower.x + member * 16,
        y: follower.y - member * 5,
        width: 24,
        height: 46,
        color: ["#70c8e8", "#d87872", "#e1b44f"][member],
        child: false
      }, phase + index + member);
    }
  });
}

function drawQuestActor(actor, phase) {
  if (actor.kind === "item") {
    drawGroundShadow(actor.x + 10, actor.y + 14, 24, 5);
    ctx.fillStyle = "#5c3326";
    ctx.fillRect(actor.x + 2, actor.y + 5, 20, 12);
    ctx.fillStyle = "#d7a04f";
    ctx.fillRect(actor.x + 5, actor.y + 7, 14, 3);
    return;
  }
  if (actor.kind === "chair") {
    ctx.fillStyle = actor.id.endsWith("B") ? "#2f8ec5" : actor.id.endsWith("C") ? "#e7b53e" : "#d8484f";
    ctx.fillRect(actor.x + 2, actor.y + 4, 18, 5);
    ctx.fillRect(actor.x + 5, actor.y + 9, 4, 12);
    ctx.fillRect(actor.x + 15, actor.y + 9, 4, 12);
    return;
  }
  if (actor.kind === "clue") {
    ctx.fillStyle = "#7a5339";
    ctx.fillRect(actor.x + 2, actor.y + 8, 6, 3);
    ctx.fillRect(actor.x + 12, actor.y + 3, 6, 3);
    ctx.fillRect(actor.x + 18, actor.y + 12, 5, 3);
    return;
  }
  if (actor.kind === "shop") {
    drawGroundShadow(actor.x + 11, actor.y + 34, 30, 6);
    ctx.fillStyle = "#487ea0";
    ctx.fillRect(actor.x + 2, actor.y + 5, 22, 30);
    ctx.fillStyle = "#e9d7a5";
    ctx.fillRect(actor.x + 5, actor.y + 9, 16, 9);
    ctx.fillStyle = "#3d302a";
    ctx.fillRect(actor.x + 9, actor.y + 22, 9, 13);
    return;
  }
  drawPerson(actor, phase);
  if (actor.activity === "xeOm") drawParkedBike(actor.x + 23, actor.y + 24);
}

function drawPerson(actor, phase) {
  const bob = Math.round(Math.sin(phase) * 1);
  const x = Math.round(actor.x);
  const y = Math.round(actor.y + bob);
  const width = actor.width || 24;
  const childScale = actor.child ? 0 : 1;
  drawGroundShadow(x + width / 2, y + (actor.height || 46) - 3, actor.child ? 20 : 28, 5);
  ctx.fillStyle = "#edbd96";
  ctx.fillRect(x + 5, y + 3, actor.child ? 12 : 14, actor.child ? 10 : 13);
  ctx.fillStyle = "#2b2930";
  ctx.fillRect(x + 4, y, actor.child ? 14 : 16, 5);
  ctx.fillStyle = actor.color || "#7dc5d7";
  ctx.fillRect(x + 3, y + (actor.child ? 13 : 16), actor.child ? 16 : 18, actor.child ? 12 : 18);
  ctx.fillStyle = "#30313a";
  ctx.fillRect(x + 5, y + (actor.child ? 25 : 34), 5, 8 + childScale * 3);
  ctx.fillRect(x + 14, y + (actor.child ? 25 : 34), 5, 8 + childScale * 3);
}

function drawParkedBike(x, y) {
  ctx.fillStyle = "#24262d";
  ctx.fillRect(x, y + 14, 9, 9);
  ctx.fillRect(x + 23, y + 14, 9, 9);
  ctx.fillStyle = "#b7443e";
  ctx.fillRect(x + 7, y + 8, 20, 8);
  ctx.fillRect(x + 18, y + 3, 8, 8);
  ctx.fillStyle = "#d9d9cf";
  ctx.fillRect(x + 25, y + 1, 3, 9);
}

function drawQuestMarker(x, y, phase) {
  const lift = Math.round(Math.sin(phase * 1.8) * 2);
  const markerY = Math.round(y + lift);
  ctx.fillStyle = "#28231c";
  ctx.fillRect(Math.round(x) - 5, markerY - 5, 11, 11);
  ctx.fillStyle = "#ffe66b";
  ctx.fillRect(Math.round(x) - 3, markerY - 3, 7, 7);
  ctx.fillStyle = "#fff8bd";
  ctx.fillRect(Math.round(x) - 1, markerY - 2, 3, 3);
}
