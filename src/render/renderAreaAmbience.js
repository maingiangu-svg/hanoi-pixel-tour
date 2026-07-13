import { camera, isRectVisible } from "../camera.js";
import { ctx, player, state } from "../state.js";
import { getAreaProfile } from "../systems/areaAmbience.js";

export function drawAreaVisualAmbience(map) {
  const profile = getAreaProfile(state.currentMapId, player.x + player.width / 2, player.y + player.height / 2);
  if (profile.interior) return;

  const time = performance.now() / 1000;
  drawSparseBirds(map, profile, time);
  drawWindDetails(map, profile, time);
}

export function drawNpcAreaAccessory(npc, x, y, phase) {
  const role = npc.ambientRole;
  if (!role) return;

  if (role === "photographer") {
    ctx.fillStyle = "#252a30";
    ctx.fillRect(x + 21, y + 19, 8, 7);
    ctx.fillStyle = "#8fc7d2";
    ctx.fillRect(x + 24, y + 21, 3, 3);
  } else if (role === "student" || role === "reader" || role === "guide") {
    ctx.fillStyle = role === "guide" ? "#f2bd45" : "#f4e6b3";
    ctx.fillRect(x + 21, y + 18, 8, 11);
    ctx.fillStyle = "#4f4a43";
    ctx.fillRect(x + 23, y + 20, 5, 2);
  } else if (role === "porter" || role === "shopper" || role === "vendor") {
    const sway = Math.round(Math.sin(phase) * 2);
    ctx.fillStyle = role === "porter" ? "#9c6b42" : "#d3ad56";
    ctx.fillRect(x - 11, y + 24 + sway, 10, 12);
    ctx.fillStyle = "#4c3626";
    ctx.fillRect(x - 9, y + 21 + sway, 6, 3);
  } else if (role === "guard") {
    ctx.fillStyle = "#315f45";
    ctx.fillRect(x, y - 2, 20, 4);
    ctx.fillRect(x + 4, y - 5, 12, 4);
  } else if (role === "tourist" || role === "visitor" || role === "bridgeWalker") {
    ctx.fillStyle = "#654d7a";
    ctx.fillRect(x + 18, y + 18, 7, 15);
    ctx.fillStyle = "#2e2535";
    ctx.fillRect(x + 20, y + 20, 3, 9);
  } else if (role === "parishioner") {
    ctx.fillStyle = "#e8dfc8";
    ctx.fillRect(x + 4, y + 17, 12, 3);
  }
}

function drawSparseBirds(map, profile, time) {
  const count = profile.visual?.birds || 0;
  for (let index = 0; index < count; index += 1) {
    const spanX = Math.max(320, map.width - 320);
    const spanY = Math.max(260, map.height - 280);
    const baseX = 140 + ((index * 613 + profile.id.length * 97) % spanX);
    const baseY = 110 + ((index * 337 + profile.id.length * 43) % spanY);
    const x = baseX + Math.round(Math.sin(time * 0.34 + index * 2.1) * 42);
    const y = baseY + Math.round(Math.cos(time * 0.48 + index) * 8);
    if (!isRectVisible({ x: x - 8, y: y - 5, width: 18, height: 12 }, 30)) continue;
    const wing = Math.sin(time * 6 + index) > 0 ? 0 : 2;
    ctx.fillStyle = "rgba(38, 42, 43, 0.55)";
    ctx.fillRect(x - 7, y + wing, 6, 2);
    ctx.fillRect(x + 1, y + wing, 6, 2);
    ctx.fillRect(x - 1, y + 1, 3, 2);
  }
}

function drawWindDetails(map, profile, time) {
  const wind = profile.visual?.wind || 0;
  if (wind < 0.25) return;
  const count = Math.max(1, Math.round(wind * 4));
  for (let index = 0; index < count; index += 1) {
    const travel = (time * (18 + wind * 20) + index * 211) % (camera.width + 180);
    const x = Math.round(camera.x - 90 + travel);
    const y = Math.round(camera.y + 120 + ((index * 173 + profile.id.length * 31) % Math.max(200, camera.height - 210)));
    if (x < 0 || x > map.width || y < 0 || y > map.height) continue;
    ctx.save();
    ctx.globalAlpha = wind > 0.7 ? 0.34 : 0.24;
    ctx.fillStyle = profile.visual?.accent || "#8c744e";
    ctx.fillRect(x, y, 5, 3);
    ctx.fillRect(x + 6, y + 2, 3, 2);
    ctx.restore();
  }
}
