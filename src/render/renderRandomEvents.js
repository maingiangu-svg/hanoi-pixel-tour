import { isRectVisible } from "../camera.js";
import { ctx } from "../state.js";
import { getActiveEventsForMap, getEventProgress } from "../systems/randomEvents.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { drawGroundShadow } from "./renderPixelEffects.js";

const PERSON_COLORS = ["#e2b34f", "#d87578", "#62a9c3", "#6eaa72", "#aa78b8", "#d9824b", "#7691c4", "#a68a5d"];

export function drawRandomEvents(map) {
  const now = performance.now();
  getActiveEventsForMap(map.id).forEach(({ definition, active }) => {
    const anchor = definition.anchorsByMap?.[map.id] || definition.anchor;
    if (!anchor && definition.visualType !== "trainPass") return;
    const progress = getEventProgress(active);
    switch (definition.visualType) {
      case "danceGroup": drawDanceGroup(anchor, now, active); break;
      case "droppedItem": drawDroppedItem(anchor, now, active); break;
      case "churchBell": drawChurchBell(anchor, now); break;
      case "studentGroup": drawMovingGroup(definition, active, now, "students"); break;
      case "visitorGroup": drawMovingGroup(definition, active, now, "visitors"); break;
      case "trainPass": drawTrainEvent(active, progress, now); break;
      case "streetVendor": drawStreetVendor(definition, active, now); break;
      case "rainRush": drawRainRush(anchor, now); break;
      case "afterRain": drawAfterRain(anchor, now); break;
      case "busArrival": drawBusArrival(definition, active, progress, now); break;
      case "xeOmGathering": drawXeOmGathering(anchor, now, active); break;
      case "childrenGame": drawChildrenGame(anchor, now, active); break;
      case "couplePhoto": drawCouplePhoto(anchor, now); break;
      default: break;
    }
    if (definition.interaction && !active.interactionResolved) drawNearbyEventMarker(anchor, now);
  });
}

function drawDanceGroup(anchor, now) {
  if (!isRectVisible({ x: anchor.x - 120, y: anchor.y - 80, width: 240, height: 155 }, 90)) return;
  const phase = now / 320;
  ctx.fillStyle = "#574c45";
  ctx.fillRect(anchor.x - 58, anchor.y + 38, 116, 4);
  for (let index = 0; index < 6; index += 1) {
    const column = index % 3;
    const row = Math.floor(index / 3);
    drawEventPerson(anchor.x - 66 + column * 55, anchor.y - 38 + row * 48, PERSON_COLORS[index], phase + index * 0.73, "dance");
  }
  drawEventPerson(anchor.x - 112, anchor.y + 28, "#7e96bd", phase + 1.2, "watch");
  drawEventPerson(anchor.x + 92, anchor.y + 24, "#d8955a", phase + 2.1, "watch");
}

function drawDroppedItem(anchor, now, active) {
  if (!isRectVisible({ x: anchor.x - 55, y: anchor.y - 55, width: 110, height: 105 }, 80)) return;
  drawEventPerson(anchor.x + 22, anchor.y - 34, "#68a7bd", now / 620, "walk");
  if (!active.interactionResolved) {
    drawGroundShadow(anchor.x - 5, anchor.y + 12, 22, 5);
    ctx.fillStyle = "#463128";
    ctx.fillRect(anchor.x - 15, anchor.y + 2, 21, 13);
    ctx.fillStyle = "#e0b64f";
    ctx.fillRect(anchor.x - 12, anchor.y + 4, 15, 3);
  }
}

function drawChurchBell(anchor, now) {
  if (!isRectVisible({ x: anchor.x - 150, y: anchor.y - 100, width: 300, height: 210 }, 60)) return;
  const pulse = Math.floor(now / 180) % 3;
  ctx.strokeStyle = "#f4d77c";
  ctx.lineWidth = 3;
  for (let index = 0; index <= pulse; index += 1) {
    const spread = 18 + index * 11;
    ctx.beginPath();
    ctx.moveTo(anchor.x - 42 - spread, anchor.y - 12 - spread / 2);
    ctx.lineTo(anchor.x - 42 - spread, anchor.y + 26 + spread / 2);
    ctx.moveTo(anchor.x + 42 + spread, anchor.y - 12 - spread / 2);
    ctx.lineTo(anchor.x + 42 + spread, anchor.y + 26 + spread / 2);
    ctx.stroke();
  }
}

function drawMovingGroup(definition, active, now, kind) {
  const point = pointOnRoute(definition.waypoints, getEventProgress(active));
  if (!isRectVisible({ x: point.x - 100, y: point.y - 70, width: 220, height: 150 }, 90)) return;
  const phase = now / 540;
  const count = kind === "students" ? 7 : 6;
  drawEventPerson(point.x - 58, point.y - 42, kind === "students" ? "#d9a54f" : "#c26d5f", phase, "guide");
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / 3);
    const column = index % 3;
    drawEventPerson(
      point.x - 15 + column * 34,
      point.y - 36 + row * 42,
      kind === "students" ? ["#5d87b5", "#e0e2d4", "#668d67"][column] : PERSON_COLORS[index],
      phase + index * 0.46,
      "listen"
    );
  }
  if (kind === "visitors") {
    ctx.fillStyle = "#d5b94f";
    ctx.fillRect(point.x - 68, point.y - 58, 4, 30);
    ctx.fillStyle = "#b53e3a";
    ctx.fillRect(point.x - 64, point.y - 58, 19, 12);
  }
}

function drawTrainEvent(active, progress, now) {
  const gateX = 1070;
  drawRailGate(gateX, 548, active.phase, now);
  drawRailGate(gateX, 680, active.phase, now);
  if (active.phase !== "passing") return;
  const travel = clamp01((progress - 0.24) / 0.62);
  const x = 880 + travel * 2240;
  const y = 585;
  if (!isRectVisible({ x: x - 340, y: y - 50, width: 460, height: 108 }, 120)) return;
  drawTrainCar(x, y, 112, "#b9463f", true, now);
  for (let index = 1; index <= 4; index += 1) {
    drawTrainCar(x - index * 102, y + 3, 94, index % 2 ? "#d1b45d" : "#8298a2", false, now + index * 90);
  }
}

function drawRailGate(x, y, phase, now) {
  if (!isRectVisible({ x: x - 28, y: y - 30, width: 72, height: 70 }, 80)) return;
  const lit = Math.floor(now / 220) % 2 === 0;
  ctx.fillStyle = "#2b2b2d";
  ctx.fillRect(x, y - 16, 8, 45);
  ctx.fillStyle = lit && phase !== "clearing" ? "#ed4b3f" : "#6b342f";
  ctx.fillRect(x - 5, y - 23, 18, 14);
  if (phase !== "clearing") {
    ctx.fillStyle = "#f4eee0";
    ctx.fillRect(x + 7, y - 4, 50, 7);
    ctx.fillStyle = "#c7433a";
    for (let stripe = 0; stripe < 5; stripe += 1) ctx.fillRect(x + 9 + stripe * 10, y - 4, 5, 7);
  }
}

function drawTrainCar(x, y, width, color, engine, now) {
  drawGroundShadow(x + width / 2, y + 35, width + 8, 8);
  ctx.fillStyle = "#25282c";
  ctx.fillRect(x + 8, y + 28, 18, 11);
  ctx.fillRect(x + width - 27, y + 28, 18, 11);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, 30);
  ctx.fillStyle = "#1f3d4a";
  const windowCount = Math.max(2, Math.floor(width / 24));
  for (let index = 0; index < windowCount; index += 1) ctx.fillRect(x + 8 + index * 22, y + 6, 14, 10);
  ctx.fillStyle = "#efe0a1";
  if (engine && Math.floor(now / 160) % 2 === 0) ctx.fillRect(x + width - 6, y + 19, 8, 7);
}

function drawStreetVendor(definition, active, now) {
  const point = pointOnRoute(definition.waypoints, getEventProgress(active));
  if (!isRectVisible({ x: point.x - 50, y: point.y - 55, width: 120, height: 105 }, 90)) return;
  drawEventPerson(point.x - 18, point.y - 34, "#c86d4d", now / 620, "walk");
  drawGroundShadow(point.x + 38, point.y + 24, 54, 7);
  ctx.fillStyle = "#744a2e";
  ctx.fillRect(point.x + 12, point.y - 2, 54, 24);
  ctx.fillStyle = "#d8aa4e";
  ctx.fillRect(point.x + 18, point.y - 8, 12, 10);
  ctx.fillStyle = "#70a568";
  ctx.fillRect(point.x + 36, point.y - 8, 12, 10);
  ctx.fillStyle = "#29292d";
  ctx.fillRect(point.x + 17, point.y + 19, 12, 12);
  ctx.fillRect(point.x + 51, point.y + 19, 12, 12);
}

function drawRainRush(anchor, now) {
  if (!isRectVisible({ x: anchor.x - 90, y: anchor.y - 70, width: 180, height: 130 }, 80)) return;
  const phase = now / 390;
  for (let index = 0; index < 3; index += 1) {
    const offset = Math.sin(phase + index) * 10;
    const x = anchor.x - 58 + index * 58 + offset;
    const y = anchor.y - 34 + index * 12;
    drawEventPerson(x, y, PERSON_COLORS[index + 2], phase + index, "run");
    drawUmbrella(x + 10, y - 8, ["#344f72", "#9a4c4b", "#4f7a5b"][index]);
  }
}

function drawAfterRain(anchor, now) {
  if (!isRectVisible({ x: anchor.x - 70, y: anchor.y - 60, width: 140, height: 120 }, 80)) return;
  const phase = now / 520;
  drawEventPerson(anchor.x - 28, anchor.y - 34, "#c97b51", phase, "sweep");
  ctx.strokeStyle = "#6b4b31";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(anchor.x - 4, anchor.y - 5);
  ctx.lineTo(anchor.x + 16, anchor.y + 28);
  ctx.stroke();
  ctx.fillStyle = "#b39150";
  ctx.fillRect(anchor.x + 8, anchor.y + 24, 24, 5);
  ctx.fillStyle = "rgba(125, 183, 205, 0.62)";
  ctx.fillRect(anchor.x + 28, anchor.y + 30, 46, 6);
}

function drawBusArrival(definition, active, progress, now) {
  const route = definition.route;
  let point;
  if (active.phase === "stopped") point = route[1];
  else if (active.phase === "arriving") point = interpolatePoint(route[0], route[1], clamp01(progress / 0.32));
  else point = interpolatePoint(route[1], route[2], clamp01((progress - 0.7) / 0.3));
  if (!isRectVisible({ x: point.x - 80, y: point.y - 45, width: 170, height: 90 }, 100)) return;
  drawGroundShadow(point.x, point.y + 34, 142, 10);
  ctx.fillStyle = "#2c6e9e";
  ctx.fillRect(point.x - 70, point.y - 22, 142, 48);
  ctx.fillStyle = "#e8d36a";
  ctx.fillRect(point.x - 64, point.y - 17, 42, 14);
  ctx.fillRect(point.x - 15, point.y - 17, 32, 14);
  ctx.fillRect(point.x + 23, point.y - 17, 32, 14);
  ctx.fillStyle = "#202126";
  ctx.fillRect(point.x - 52, point.y + 20, 24, 17);
  ctx.fillRect(point.x + 37, point.y + 20, 24, 17);
  ctx.fillStyle = Math.floor(now / 260) % 2 ? "#f7c84c" : "#f5f0cf";
  ctx.fillRect(point.x + 67, point.y + 3, 7, 8);
  if (active.phase === "stopped") {
    drawEventPerson(point.x + 80, point.y - 5, "#d9824b", now / 600, "walk");
    drawEventPerson(point.x + 108, point.y + 2, "#6f91bd", now / 600 + 1.3, "walk");
  }
}

function drawXeOmGathering(anchor, now, active) {
  if (!isRectVisible({ x: anchor.x - 90, y: anchor.y - 70, width: 190, height: 135 }, 90)) return;
  for (let index = 0; index < 3; index += 1) {
    const x = anchor.x - 70 + index * 66;
    const y = anchor.y - 28 + (index % 2) * 12;
    drawEventPerson(x, y, ["#d4a844", "#5c8cad", "#8d7560"][index], now / 680 + index, "talk");
    drawParkedBike(x + 22, y + 18, index % 2 ? "#3e6d88" : "#a84842");
  }
  const center = getPlayerCenter();
  if (Math.hypot(center.x - anchor.x, center.y - anchor.y) <= 155) {
    const lines = ["Đi xe ôm không cháu?", "Cháu đi đâu, chú chở nhé?", "Cần xe ôm không? Giá mềm thôi!"];
    const line = lines[Math.abs(Math.floor(active.startedAt)) % lines.length];
    const width = Math.min(214, 18 + line.length * 7);
    const x = anchor.x - width / 2;
    const y = anchor.y - 82;
    ctx.fillStyle = "#171719";
    ctx.fillRect(x - 2, y - 2, width + 4, 25);
    ctx.fillStyle = "#fffdf2";
    ctx.fillRect(x, y, width, 21);
    ctx.fillStyle = "#171719";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(line, anchor.x, y + 14);
    ctx.textAlign = "left";
  }
}

function drawChildrenGame(anchor, now, active) {
  if (!isRectVisible({ x: anchor.x - 95, y: anchor.y - 65, width: 190, height: 125 }, 90)) return;
  const phase = now / 310;
  const variant = Math.floor(active.startedAt) % 4;
  for (let index = 0; index < 4; index += 1) {
    const angle = phase * 0.14 + index * Math.PI / 2;
    drawChild(anchor.x + Math.cos(angle) * 52, anchor.y + Math.sin(angle) * 23 - 18, PERSON_COLORS[index + 2], phase + index);
  }
  ctx.strokeStyle = variant % 2 ? "#f1e0aa" : "#d4c45c";
  ctx.lineWidth = 3;
  ctx.strokeRect(anchor.x - 18, anchor.y - 20, 36, 34);
}

function drawCouplePhoto(anchor, now) {
  if (!isRectVisible({ x: anchor.x - 70, y: anchor.y - 70, width: 150, height: 130 }, 80)) return;
  const phase = now / 700;
  drawEventPerson(anchor.x - 30, anchor.y - 34, "#d57ca0", phase, "pose");
  drawEventPerson(anchor.x + 6, anchor.y - 34, "#628db8", phase + 0.8, "pose");
  drawEventPerson(anchor.x + 58, anchor.y - 26, "#c79b4a", phase + 1.4, "photo");
  ctx.fillStyle = "#25262a";
  ctx.fillRect(anchor.x + 53, anchor.y - 31, 13, 9);
  if (Math.floor(now / 1300) % 2 === 0) {
    ctx.fillStyle = "#fff8c4";
    ctx.fillRect(anchor.x + 48, anchor.y - 36, 4, 4);
  }
}

function drawEventPerson(x, y, color, phase, activity) {
  const running = activity === "run";
  const dancing = activity === "dance";
  const bob = Math.round(Math.sin(phase * (running ? 2.3 : 1.2)) * (running ? 3 : dancing ? 2 : 1));
  const leg = running || activity === "walk" ? Math.round(Math.sin(phase * 2) * 3) : 0;
  drawGroundShadow(x + 11, y + 45, 31, 6);
  ctx.fillStyle = "#ecc09c";
  ctx.fillRect(Math.round(x + 3), Math.round(y + bob), 16, 14);
  ctx.fillStyle = "#3b2b28";
  ctx.fillRect(Math.round(x + 2), Math.round(y + bob - 2), 18, 5);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y + 14 + bob), 22, 19);
  ctx.fillRect(Math.round(x - 5), Math.round(y + 18 + bob - (dancing ? 8 : 0)), 5, 15);
  ctx.fillRect(Math.round(x + 22), Math.round(y + 18 + bob - (dancing ? 8 : 0)), 5, 15);
  ctx.fillStyle = "#292a30";
  ctx.fillRect(Math.round(x + 2), Math.round(y + 33 + bob + leg), 7, 13);
  ctx.fillRect(Math.round(x + 13), Math.round(y + 33 + bob - leg), 7, 13);
}

function drawChild(x, y, color, phase) {
  const bob = Math.round(Math.sin(phase * 2) * 2);
  drawGroundShadow(x + 9, y + 35, 23, 5);
  ctx.fillStyle = "#efc29b";
  ctx.fillRect(Math.round(x + 3), Math.round(y + bob), 13, 11);
  ctx.fillStyle = "#3a2b2b";
  ctx.fillRect(Math.round(x + 2), Math.round(y - 2 + bob), 15, 5);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y + 11 + bob), 19, 15);
  ctx.fillStyle = "#303038";
  ctx.fillRect(Math.round(x + 2), Math.round(y + 26 + bob), 6, 10);
  ctx.fillRect(Math.round(x + 12), Math.round(y + 26 + bob), 6, 10);
}

function drawUmbrella(x, y, color) {
  ctx.fillStyle = "#202329";
  ctx.fillRect(Math.round(x + 9), Math.round(y + 4), 3, 30);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - 6), Math.round(y), 34, 6);
  ctx.fillRect(Math.round(x - 1), Math.round(y - 5), 24, 5);
}

function drawParkedBike(x, y, color) {
  ctx.fillStyle = "#22252a";
  ctx.fillRect(x, y + 13, 10, 10);
  ctx.fillRect(x + 26, y + 13, 10, 10);
  ctx.fillStyle = color;
  ctx.fillRect(x + 7, y + 7, 23, 9);
  ctx.fillRect(x + 20, y + 2, 8, 7);
}

function drawNearbyEventMarker(anchor, now) {
  const center = getPlayerCenter();
  if (Math.hypot(center.x - anchor.x, center.y - anchor.y) > 180) return;
  const y = anchor.y - 55 + Math.round(Math.sin(now / 240) * 2);
  ctx.fillStyle = "#26221b";
  ctx.fillRect(anchor.x - 6, y - 6, 13, 13);
  ctx.fillStyle = "#ffe36e";
  ctx.fillRect(anchor.x - 4, y - 4, 9, 9);
  ctx.fillStyle = "#fff7bd";
  ctx.fillRect(anchor.x - 1, y - 3, 3, 3);
}

function pointOnRoute(points, progress) {
  if (!points?.length) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const scaled = clamp01(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  return interpolatePoint(points[index], points[index + 1], scaled - index);
}

function interpolatePoint(start, end, progress) {
  return {
    x: start.x + (end.x - start.x) * clamp01(progress),
    y: start.y + (end.y - start.y) * clamp01(progress)
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
