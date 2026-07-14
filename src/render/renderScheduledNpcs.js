import { isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { MO_NEIGHBORHOOD } from "../data/npcSchedules.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { getChurchService, getMoChildren, getScheduledNpcsForMap } from "../systems/npcSchedule.js";
import { drawPixelRect, drawTextBadge } from "./renderUI.js";
import { drawMoSprite } from "./renderCompanion.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawNpcRainGear } from "./renderWeather.js";
import { getNpcReactionVisual } from "../systems/npcReactions.js";
import { drawNpcReactionOverlay } from "./renderNpcReactions.js";
import { getVisibleBranchingQuestActors } from "../systems/branchingQuest.js";

export function drawScheduledNpcs(map) {
  if (map.id === "hoanKiem") {
    drawMoNeighborhood();
    drawNeighborhoodChildren();
  }

  if (map.id === "churchInterior") {
    drawCongregation();
  }

  getScheduledNpcsForMap(map).forEach((npc) => {
    const reaction = getNpcReactionVisual(npc);
    const visualX = npc.x + reaction.offsetX;
    const visualY = npc.y + reaction.offsetY;
    if (!npc.visible || !isRectVisible({ x: visualX - 16, y: visualY - 20, width: 56, height: 76 }, 80)) {
      return;
    }

    if (npc.id === "chaXu") {
      drawPriest(npc);
    } else {
      drawMoSprite(npc, {
        x: visualX,
        y: visualY,
        facing: reaction.facing || npc.facing,
        pauseRoutine: reaction.pauseRoutine
      });
    }

    if (map.kind !== "churchInterior") {
      drawNpcRainGear(npc, visualX, visualY, performance.now() / 420);
    }

    drawNpcReactionOverlay(npc, visualX, visualY);
    drawNpcNameWhenNearby(npc);
  });
}

function drawMoNeighborhood() {
  const area = MO_NEIGHBORHOOD;
  if (!isRectVisible(area, 110)) {
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(area.x + 4, area.y + 8, area.width, area.height);
  drawPixelRect(area.x, area.y, area.width, area.height, "#c8a16d", "#644534", 3);
  ctx.fillStyle = "#dfc58e";
  for (let y = area.y + 18; y < area.y + area.height - 12; y += 28) {
    for (let x = area.x + 18; x < area.x + area.width - 12; x += 34) {
      ctx.fillRect(x, y, 14, 3);
    }
  }

  ctx.fillStyle = "#78503a";
  const lineTop = area.y + 14;
  const poleHeight = Math.max(36, area.height - 28);
  ctx.fillRect(area.x + 30, lineTop, 5, poleHeight);
  ctx.fillRect(area.x + 178, lineTop, 5, poleHeight);
  ctx.fillRect(area.x + 32, lineTop + 6, 148, 4);
  ["#d8484f", "#f2bd45", "#2f8ec5", "#8de097"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(area.x + 48 + index * 30, lineTop + 10, 18, 14 + (index % 2) * 3);
  });

  const propY = area.y + area.height - 24;
  drawHouseholdBucket(area.x + 42, propY);
  drawHouseholdBucket(area.x + 80, propY + 2);
  drawLowStool(area.x + 196, propY, "#d8484f");
  drawLowStool(area.x + 222, propY + 4, "#2f8ec5");
}

function drawNeighborhoodChildren() {
  const replacedIds = new Set(getVisibleBranchingQuestActors("hoanKiem").map((actor) => actor.replacesScheduledNpcId).filter(Boolean));
  const children = getMoChildren().filter((child) => !replacedIds.has(child.id));
  const phase = performance.now() / 430;
  children.forEach((child, index) => {
    const reaction = getNpcReactionVisual(child);
    const shiftX = !reaction.pauseRoutine && child.activity === "run" ? Math.round(Math.sin(phase + index) * 11) : 0;
    const shiftY = !reaction.pauseRoutine && child.activity === "jump" ? Math.round(Math.sin(phase * 2 + index) * 3) : 0;
    const x = child.x + shiftX + reaction.offsetX;
    const y = child.y + shiftY + reaction.offsetY;
    if (!isRectVisible({ x: x - 8, y: y - 8, width: 32, height: 44 }, 70)) {
      return;
    }
    drawChild(x, y, child.color, reaction.pauseRoutine ? "idle" : child.activity, phase + index);
    drawNpcReactionOverlay(child, x, y);
  });
}

function drawChild(x, y, color, activity, phase) {
  const armLift = activity === "jump" || activity === "rope";
  const swing = activity === "run" ? Math.round(Math.sin(phase * 2) * 2) : 0;
  drawGroundShadow(x + 9, y + 27, 24, 5);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(x + 3, y + 2, 13, 12);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 2, y, 15, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 14, 17, 13);
  ctx.fillStyle = "#30313a";
  ctx.fillRect(x + 4, y + 27 + swing, 5, 8);
  ctx.fillRect(x + 12, y + 27 - swing, 5, 8);
  ctx.fillStyle = "#ffd0a6";
  if (armLift) {
    ctx.fillRect(x - 3, y + 8, 5, 14);
    ctx.fillRect(x + 18, y + 8, 5, 14);
  }
  if (activity === "rope") {
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(x - 8, y + 22, 5, 2);
    ctx.fillRect(x - 5, y + 27, 5, 2);
    ctx.fillRect(x + 21, y + 27, 5, 2);
    ctx.fillRect(x + 24, y + 22, 5, 2);
  }
}

function drawCongregation() {
  const service = getChurchService();
  if (!service) {
    return;
  }
  const people = service.phase === "quiet" ? service.quietVisitors : service.attendees;
  for (let index = 0; index < service.activeCount; index += 1) {
    const person = people[index];
    if (!person || !isRectVisible({ x: person.x - 8, y: person.y - 10, width: 34, height: 48 }, 70)) {
      continue;
    }
    drawCongregant(person, service.posture, index);
  }
}

function drawCongregant(person, posture, index) {
  const phase = performance.now() / 480 + index;
  const standing = posture === "standing" || posture === "walking";
  const bob = standing ? Math.round(Math.sin(phase) * 1) : 0;
  const x = person.x;
  const y = person.y + bob;
  drawGroundShadow(x + 9, y + (standing ? 31 : 25), 24, 5);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 3, y + 1, 14, 12);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 2, y - 2, 16, 5);
  ctx.fillStyle = person.color;
  ctx.fillRect(x + 1, y + 13, 18, standing ? 18 : 13);
  ctx.fillStyle = "#31313a";
  ctx.fillRect(x + 4, y + (standing ? 31 : 25), 5, standing ? 9 : 5);
  ctx.fillRect(x + 12, y + (standing ? 31 : 25), 5, standing ? 9 : 5);
}

function drawPriest(npc) {
  const phase = performance.now() / 700;
  const arm = Math.round(Math.sin(phase) * 2);
  const x = npc.x;
  const y = npc.y;
  drawGroundShadow(x + 11, y + 38, 34, 6);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x + 4, y + 1, 16, 14);
  ctx.fillStyle = "#4a4039";
  ctx.fillRect(x + 2, y - 2, 20, 6);
  ctx.fillStyle = "#f1f0e5";
  ctx.fillRect(x + 1, y + 15, 22, 23);
  ctx.fillStyle = "#b4493f";
  ctx.fillRect(x + 9, y + 16, 6, 22);
  ctx.fillStyle = "#f0c39b";
  ctx.fillRect(x - 5, y + 20 - arm, 7, 14);
  ctx.fillRect(x + 22, y + 20 + arm, 7, 14);
}

function drawHouseholdBucket(x, y) {
  drawPixelRect(x, y, 18, 14, "#79b5d0", "#1d3a4c", 2);
  ctx.fillStyle = "#d8edf5";
  ctx.fillRect(x + 4, y - 4, 10, 4);
}

function drawLowStool(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 16, 8);
  ctx.fillRect(x + 2, y + 8, 3, 8);
  ctx.fillRect(x + 11, y + 8, 3, 8);
}

function drawNpcNameWhenNearby(npc) {
  const playerCenter = getPlayerCenter();
  if (Math.hypot(playerCenter.x - npc.x, playerCenter.y - npc.y) > 138) {
    return;
  }
  drawTextBadge(npc.name, npc.x + 11, npc.y - 13, npc.id === "chaXu" ? 80 : 52, "#252532");
}
