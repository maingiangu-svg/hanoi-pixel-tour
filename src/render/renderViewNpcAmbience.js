import { ctx } from "../state.js";

const COATS = Object.freeze(["#c85e48", "#e0b65f", "#4f7890", "#78905d", "#a06079", "#d88b53", "#5a697d"]);
const BUBBLES = Object.freeze(["Đẹp thật.", "Chụp giúp mình nhé?", "Tối nay đông ghê.", "Ra hồ ngồi tí đi."]);

export function drawHoGuomNpcAmbience(width, height, promenadeTop, pan, phase, time, hour, crowdFactor, weatherIntensity, variant) {
  const offset = -pan * 1.12;
  const night = phase === "night";
  const sunset = phase === "sunset";
  const sparse = weatherIntensity >= 0.72 || crowdFactor < 0.42;
  const baseY = promenadeTop + Math.max(52, Math.round((height - promenadeTop) * 0.44));

  drawBench(width * 0.13 + offset, baseY + 21, phase);
  if (!sparse) drawSeatedPair(width * 0.13 + offset, baseY + 8, phase, time);
  drawPhotographerScene(width * 0.35 + offset, baseY + 8, phase, time, weatherIntensity);
  if (!sparse) drawChatGroup(width * 0.62 + offset, baseY + 12, phase, time);
  drawPhoneWatcher(width * 0.81 + offset, baseY + 11, phase, time, weatherIntensity);

  if ((night || sunset) && crowdFactor > 0.72 && weatherIntensity < 0.52) {
    drawFamily(width * 0.49 + offset, baseY + 24, phase, time);
  }
  if (!sparse && variant !== "tower") {
    drawWalker(width, baseY + 28, offset, phase, time, hour);
  }
  if (weatherIntensity > 0.2) {
    drawUmbrella(width * 0.35 + offset, baseY - 48, weatherIntensity);
    if (!sparse) drawUmbrella(width * 0.81 + offset, baseY - 45, weatherIntensity);
  }

  if (weatherIntensity < 0.58) drawAmbientBubble(width, baseY, offset, time);
}

function drawBench(x, y, phase) {
  const px = Math.round(x);
  ctx.fillStyle = "rgba(12, 18, 21, 0.3)";
  ctx.fillRect(px - 66, y + 21, 134, 8);
  ctx.fillStyle = phase === "night" ? "#5c5143" : "#765f45";
  ctx.fillRect(px - 64, y, 128, 10);
  ctx.fillRect(px - 60, y + 13, 120, 8);
  ctx.fillStyle = "#333a3c";
  ctx.fillRect(px - 53, y + 21, 8, 23);
  ctx.fillRect(px + 45, y + 21, 8, 23);
}

function drawSeatedPair(x, y, phase, time) {
  drawPerson(x - 22, y - 12, 0.92, COATS[4], phase, time, 2, "sit", 1);
  drawPerson(x + 21, y - 12, 0.9, COATS[2], phase, time, 5, "sit", -1);
}

function drawPhotographerScene(x, y, phase, time, weatherIntensity) {
  drawPerson(x - 24, y, 0.98, COATS[1], phase, time, 8, "photo", 1);
  if (weatherIntensity < 0.72) drawPerson(x + 34, y + 4, 0.95, COATS[0], phase, time, 11, "pose", -1);
}

function drawChatGroup(x, y, phase, time) {
  drawPerson(x - 34, y + 3, 0.92, COATS[3], phase, time, 4, "chat", 1);
  drawPerson(x + 1, y, 1, COATS[5], phase, time, 9, "chat", -1);
  drawPerson(x + 37, y + 7, 0.88, COATS[6], phase, time, 15, "chat", -1);
}

function drawPhoneWatcher(x, y, phase, time, weatherIntensity) {
  drawPerson(x, y, 0.96, COATS[2], phase, time, 12, weatherIntensity > 0.5 ? "wait" : "phone", -1);
}

function drawFamily(x, y, phase, time) {
  drawPerson(x - 19, y, 0.9, COATS[3], phase, time, 19, "wait", 1);
  drawPerson(x + 19, y + 18, 0.62, COATS[0], phase, time, 22, "child", -1);
}

function drawWalker(width, y, offset, phase, time, hour) {
  const direction = Math.floor(time / 9000 + hour) % 2 ? 1 : -1;
  const travel = mod(time * 0.024, width + 240) - 120;
  const x = direction > 0 ? travel + offset * 0.3 : width - travel + offset * 0.3;
  drawPerson(x, y, 0.84, COATS[6], phase, time, 31, "walk", direction);
}

function drawPerson(x, y, scale, coat, phase, time, seed, pose, facing) {
  const unit = Math.max(2, Math.round(scale * 4));
  const idle = Math.sin(time / (620 + seed * 13) + seed) > 0.72 ? 1 : 0;
  const walking = pose === "walk" ? Math.round(Math.sin(time / 170 + seed) * unit) : 0;
  const px = Math.round(x);
  const py = Math.round(y + idle);
  const lit = phase === "night" && isNearLightPool(x) ? 1 : 0;
  ctx.fillStyle = "rgba(11, 15, 17, 0.33)";
  ctx.fillRect(px - unit * 3, py + unit * 13, unit * 7, unit * 2);

  ctx.fillStyle = "#3b2d2c";
  ctx.fillRect(px - unit * 2, py, unit * 4, unit * 4);
  ctx.fillStyle = lit ? brighten(coat) : phase === "night" ? dim(coat) : coat;
  const bodyY = pose === "sit" ? py + unit * 4 : py + unit * 4;
  ctx.fillRect(px - unit * 3, bodyY, unit * 6, pose === "sit" ? unit * 6 : unit * 8);
  ctx.fillStyle = lit ? "#edbd91" : phase === "night" ? "#b8896d" : "#d9a67e";
  ctx.fillRect(px - unit * 1.5, py + unit, unit * 3, unit * 3);

  ctx.fillStyle = "#32343a";
  if (pose === "sit") {
    ctx.fillRect(px - unit * 3, py + unit * 9, unit * 3, unit * 2);
    ctx.fillRect(px, py + unit * 9, unit * 3, unit * 2);
  } else {
    ctx.fillRect(px - unit * 2 + walking, py + unit * 12, unit * 2, unit * 5);
    ctx.fillRect(px + unit * 0.5 - walking, py + unit * 12, unit * 2, unit * 5);
  }

  ctx.fillStyle = phase === "night" ? "#b8896d" : "#d9a67e";
  if (pose === "photo") {
    const handX = facing > 0 ? px + unit * 4 : px - unit * 5;
    ctx.fillRect(handX, py + unit * 5, unit * 2, unit * 2);
    ctx.fillStyle = "#18242c";
    ctx.fillRect(handX + (facing > 0 ? unit : -unit), py + unit * 3, unit * 2, unit * 3);
  } else if (pose === "phone") {
    ctx.fillRect(px + facing * unit * 3, py + unit * 6, unit * 2, unit * 2);
    ctx.fillStyle = "#263944";
    ctx.fillRect(px + facing * unit * 4, py + unit * 4, unit, unit * 3);
  } else if (pose === "chat") {
    ctx.fillRect(px + facing * unit * 3, py + unit * (6 - idle), unit * 3, unit * 2);
  }
}

function drawUmbrella(x, y, intensity) {
  const px = Math.round(x);
  ctx.fillStyle = intensity > 0.7 ? "#37506a" : "#8f4c5c";
  ctx.fillRect(px - 30, y, 60, 7);
  ctx.fillRect(px - 22, y - 8, 44, 8);
  ctx.fillRect(px - 10, y - 13, 20, 5);
  ctx.fillStyle = "#34383b";
  ctx.fillRect(px, y + 7, 3, 47);
}

function drawAmbientBubble(width, y, offset, time) {
  const slot = Math.floor(time / 4300) % 8;
  if (slot > 3) return;
  const text = BUBBLES[slot];
  const anchor = slot % 2 === 0 ? width * 0.62 + offset : width * 0.13 + offset;
  const bubbleWidth = Math.max(112, text.length * 8 + 22);
  const x = Math.round(Math.max(12, Math.min(width - bubbleWidth - 12, anchor - bubbleWidth / 2)));
  const top = Math.round(y - 93);
  ctx.fillStyle = "rgba(20, 23, 27, 0.88)";
  ctx.fillRect(x - 2, top - 2, bubbleWidth + 4, 28);
  ctx.fillStyle = "rgba(255, 247, 218, 0.94)";
  ctx.fillRect(x, top, bubbleWidth, 24);
  ctx.fillRect(Math.round(anchor - 3), top + 24, 7, 6);
  ctx.fillStyle = "#242426";
  ctx.font = "700 11px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x + bubbleWidth / 2, top + 16);
}

function isNearLightPool(x) {
  const normalized = mod(x, 1000) / 1000;
  return normalized < 0.12 || (normalized > 0.42 && normalized < 0.57) || normalized > 0.9;
}

function dim(color) {
  return shift(color, 0.72);
}

function brighten(color) {
  return shift(color, 1.16);
}

function shift(color, multiplier) {
  const value = color.replace("#", "");
  const r = Math.min(255, Math.round(parseInt(value.slice(0, 2), 16) * multiplier));
  const g = Math.min(255, Math.round(parseInt(value.slice(2, 4), 16) * multiplier));
  const b = Math.min(255, Math.round(parseInt(value.slice(4, 6), 16) * multiplier));
  return `rgb(${r}, ${g}, ${b})`;
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}
