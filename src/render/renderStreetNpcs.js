import { ctx } from "../state.js";
import { drawPixelRect } from "./renderUI.js";
import { drawGroundShadow } from "./renderPixelEffects.js";
import { drawStreetNpcRainGear, drawTeaStallWeatherCover } from "./renderWeather.js";

export function isStreetLifeNpc(npc) {
  return npc.activity === "teaSeller" || npc.activity === "xeOm";
}

export function drawStreetLifeNpc(npc, x, y, phase, showSpeech, speechText = npc.speech, reaction = null) {
  if (npc.activity === "teaSeller") {
    drawTeaSeller(npc, x, y, phase, reaction);
    return;
  }

  drawXeOm(npc, x, y, phase, showSpeech, speechText, reaction);
}

function drawTeaSeller(npc, x, y, phase, reaction) {
  const sway = Math.round(Math.sin(phase * 1.4));
  const settingUp = npc.scheduleState === "settingUp";
  const packingUp = npc.scheduleState === "packingUp";
  const resting = npc.scheduleState === "resting";
  const busy = npc.scheduleState === "sellingTeaBusy";
  drawGroundShadow(x + 21, y + 34, 74, 8);
  drawTeaStallWeatherCover(x, y);

  if (!packingUp) {
    drawPlasticStool(x - 12, y + 23, "#d8484f");
  }
  if (!settingUp && !packingUp) {
    drawPlasticStool(x + 35, y + 25, "#2f8ec5");
  }
  drawPixelRect(x + 8, y + 20, 30, 15, "#85583a", "#151515", 2);
  ctx.fillStyle = "#dbe4e6";
  ctx.fillRect(x + 20, y + 8, 8, 14);
  ctx.fillStyle = "#2f8ec5";
  ctx.fillRect(x + 13, y + 16, 5, 5);
  ctx.fillRect(x + 30, y + 16, 5, 5);
  ctx.fillStyle = "#8de097";
  ctx.fillRect(x + 35, y + 14, 4, 6);

  const sellerY = resting ? y + 7 : y;
  ctx.fillStyle = "#f7a072";
  ctx.fillRect(x - 2, sellerY + 14 + sway, 16, resting ? 13 : 18);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(x, sellerY + sway, 14, 14);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x - 1, sellerY - 3 + sway, 16, 6);
  drawNpcEyes(x, sellerY + sway, reaction?.facing);
  ctx.fillStyle = "#4a2c25";
  ctx.fillRect(x - 4, sellerY + 17 + sway, 6, 12);
  ctx.fillRect(x + 12, sellerY + 17 + sway, 6, 12);

  if (busy) {
    const customersLook = ["startled", "annoyed", "avoidingVehicle"].includes(reaction?.state);
    drawSeatedTeaCustomer(x + 49, y + 11, "#7bdff2", customersLook ? "left" : null);
    drawSeatedTeaCustomer(x - 28, y + 10, "#f2bd45", customersLook ? "right" : null);
  }
}

function drawSeatedTeaCustomer(x, y, color, facing) {
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(x + 3, y, 11, 10);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 2, y - 3, 13, 5);
  drawNpcEyes(x + 1, y, facing, 11);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 10, 17, 12);
  ctx.fillStyle = "#30313a";
  ctx.fillRect(x + 2, y + 22, 13, 5);
}

function drawXeOm(npc, x, y, phase, showSpeech, speechText, reaction) {
  const bob = Math.round(Math.sin(phase * 1.2));
  drawGroundShadow(x + 23, y + 35, 54, 7);
  ctx.fillStyle = "#151515";
  ctx.fillRect(x + 2, y + 29, 10, 10);
  ctx.fillRect(x + 37, y + 29, 10, 10);
  ctx.fillStyle = "#c9413a";
  ctx.fillRect(x + 11, y + 20, 28, 10);
  ctx.fillStyle = "#2f3d4a";
  ctx.fillRect(x + 20, y + 14, 18, 8);
  ctx.fillStyle = "#f2bd45";
  ctx.fillRect(x + 41, y + 22, 5, 5);

  ctx.fillStyle = npc.color || "#f2bd45";
  ctx.fillRect(x + 7, y + 12 + bob, 17, 18);
  ctx.fillStyle = "#ffd0a6";
  ctx.fillRect(x + 9, y + bob, 14, 14);
  ctx.fillStyle = "#2b2b32";
  ctx.fillRect(x + 8, y - 3 + bob, 16, 6);
  ctx.fillStyle = "#53616c";
  ctx.fillRect(x + 7, y - 7 + bob, 18, 4);
  drawNpcEyes(x + 8, y + bob, reaction?.facing, 14);
  drawStreetNpcRainGear(npc, x, y + bob);

  if (showSpeech && speechText) {
    drawSpeechBubble(x + 12, y - 18, speechText);
  }
}

function drawNpcEyes(x, y, facing, faceWidth = 14) {
  ctx.fillStyle = "#171719";
  if (facing === "left") {
    ctx.fillRect(x + 2, y + 7, 3, 3);
  } else if (facing === "right") {
    ctx.fillRect(x + faceWidth - 5, y + 7, 3, 3);
  } else if (facing !== "up") {
    ctx.fillRect(x + 3, y + 7, 3, 3);
    ctx.fillRect(x + faceWidth - 6, y + 7, 3, 3);
  }
}

function drawPlasticStool(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 14, 8);
  ctx.fillRect(x + 2, y + 8, 3, 8);
  ctx.fillRect(x + 9, y + 8, 3, 8);
}

export function drawSpeechBubble(centerX, bottomY, text) {
  ctx.font = "900 9px 'Courier New', monospace";
  const lines = wrapSpeech(text, 18);
  const width = Math.min(152, Math.max(80, ...lines.map((line) => Math.ceil(ctx.measureText(line).width) + 14)));
  const height = lines.length * 12 + 12;
  const x = Math.round(centerX - width / 2);
  const y = Math.round(bottomY - height);

  drawPixelRect(x, y, width, height, "#fffdf2", "#151515", 2);
  ctx.fillStyle = "#fffdf2";
  ctx.fillRect(centerX - 3, bottomY, 7, 7);
  ctx.fillStyle = "#151515";
  ctx.fillRect(centerX - 4, bottomY + 5, 9, 2);
  ctx.fillStyle = "#171719";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, centerX, y + 6 + index * 12));
  ctx.textBaseline = "alphabetic";
}

function wrapSpeech(text, maxLength) {
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
  if (line) {
    lines.push(line);
  }
  return lines.slice(0, 2);
}
