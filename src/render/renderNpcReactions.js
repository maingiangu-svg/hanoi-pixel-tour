import { camera } from "../camera.js";
import { ctx, player, runtime } from "../state.js";
import { getNpcReactionVisual, isVehicleHornActive } from "../systems/npcReactions.js";
import { drawPixelRect } from "./renderUI.js";

export function drawNpcReactionOverlay(npc, x, y) {
  const reaction = getNpcReactionVisual(npc);
  const interactionTarget = runtime.nearbyInteractable?.source || runtime.nearbyInteractable?.object;
  const promptOwnsNpc = interactionTarget?.id === npc.id;
  if (!reaction.bubbleText) {
    if (reaction.state === "startled") drawPixelAlert(x + 10, y - 13);
    return;
  }

  if (promptOwnsNpc) return;

  drawReactionBubble(x + 10, y, reaction.bubbleText);
}

export function drawVehicleHornIndicator() {
  if (!isVehicleHornActive()) return;
  const x = player.x + player.width / 2;
  const y = player.y - 18;
  drawPixelRect(x - 22, y - 12, 44, 18, "#fff8cf", "#171719", 2);
  ctx.fillStyle = "#171719";
  ctx.font = "900 10px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BÍP!", x, y - 3);
  ctx.textBaseline = "alphabetic";
}

function drawReactionBubble(centerX, npcY, text) {
  const lines = wrapText(text, 24);
  ctx.font = "900 10px 'Courier New', monospace";
  const width = Math.min(190, Math.max(92, ...lines.map((line) => Math.ceil(ctx.measureText(line).width) + 18)));
  const height = lines.length * 13 + 12;
  const screenY = npcY - camera.y;
  const placeBelow = screenY < 92;
  const x = Math.round(centerX - width / 2);
  const y = placeBelow ? npcY + 51 : npcY - height - 18;
  const pointerY = placeBelow ? y - 6 : y + height;

  drawPixelRect(x, y, width, height, "#fffdf2", "#171719", 2);
  ctx.fillStyle = "#fffdf2";
  ctx.fillRect(centerX - 4, pointerY, 8, 7);
  ctx.fillStyle = "#171719";
  ctx.fillRect(centerX - 5, placeBelow ? pointerY : pointerY + 5, 10, 2);
  ctx.fillStyle = "#171719";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, centerX, y + 6 + index * 13));
  ctx.textBaseline = "alphabetic";
}

function drawPixelAlert(x, y) {
  ctx.fillStyle = "#171719";
  ctx.fillRect(x - 4, y - 10, 9, 16);
  ctx.fillStyle = "#ffe36e";
  ctx.fillRect(x - 2, y - 8, 5, 8);
  ctx.fillRect(x - 2, y + 3, 5, 3);
}

function wrapText(text, maxLength) {
  const lines = [];
  let line = "";
  text.split(" ").forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, 2);
}
