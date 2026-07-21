import { canvas, ctx } from "../state.js";
import { getNpcExpression } from "../data/npcPortraits.js";

export function drawNpcCloseup(view, timestamp = performance.now()) {
  const profile = view.profile;
  if (!profile) return false;
  const elapsed = Math.max(0, timestamp - (view.openedAt || timestamp));
  const expression = getNpcExpression(profile, view.expression || "neutral");
  const camera = resolveCamera(view.cameraShot);
  const choiceCount = Number(view.lines?.[view.lineIndex]?.choices?.length) || 0;
  if (choiceCount > 3) {
    camera.scale *= 0.86;
    camera.baseY -= 0.27;
  }
  const unit = Math.max(3, Math.floor(Math.min(canvas.width / 250, canvas.height / 170) * camera.scale));
  const blinkPhase = (elapsed + profile.seed * 311) % 4300;
  const blinking = blinkPhase > 4140;
  const breath = Math.round(Math.sin(elapsed / 900 + profile.seed) * 1);
  const headShift = expression.head * unit + Math.round(Math.sin(elapsed / 1700 + profile.seed) * unit * 0.35);
  const baseX = Math.round(canvas.width * 0.5 + camera.offsetX + headShift);
  const baseY = Math.round(canvas.height * camera.baseY + breath * unit);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  drawPortraitShadow(baseX, baseY, unit, camera.scale);
  drawTorso(profile, baseX, baseY, unit, view.pose, elapsed);
  drawNeck(profile, baseX, baseY, unit);
  drawHead(profile, expression, baseX, baseY, unit, blinking, elapsed);
  drawHair(profile, baseX, baseY, unit, elapsed);
  drawAccessory(profile, baseX, baseY, unit, view.pose, elapsed);
  ctx.restore();
  return true;
}

function drawPortraitShadow(x, y, unit) {
  ctx.fillStyle = "rgba(2, 4, 8, 0.44)";
  ctx.fillRect(x - 33 * unit, y - 67 * unit, 70 * unit, 65 * unit);
  ctx.fillRect(x - 39 * unit, y - 48 * unit, 82 * unit, 46 * unit);
}

function drawTorso(profile, x, y, unit, pose, elapsed) {
  const shoulderY = y - 31 * unit;
  ctx.fillStyle = profile.topShadow;
  ctx.fillRect(x - 35 * unit, shoulderY + 5 * unit, 70 * unit, 33 * unit);
  ctx.fillRect(x - 29 * unit, shoulderY, 58 * unit, 40 * unit);
  ctx.fillStyle = profile.top;
  ctx.fillRect(x - 27 * unit, shoulderY, 54 * unit, 34 * unit);
  ctx.fillRect(x - 32 * unit, shoulderY + 8 * unit, 64 * unit, 26 * unit);
  ctx.fillStyle = profile.accent;
  if (profile.hairStyle === "helmet") {
    ctx.fillRect(x - 4 * unit, shoulderY, 8 * unit, 34 * unit);
  } else if (profile.hairStyle === "elder") {
    ctx.fillRect(x - 22 * unit, shoulderY + 5 * unit, 44 * unit, 4 * unit);
  } else if (profile.hairStyle === "short" && profile.top === "#24262b") {
    ctx.fillRect(x - 5 * unit, shoulderY, 10 * unit, 13 * unit);
    ctx.fillStyle = "#f2ede2";
    ctx.fillRect(x - 3 * unit, shoulderY, 6 * unit, 9 * unit);
  } else {
    ctx.fillRect(x - 20 * unit, shoulderY + 4 * unit, 40 * unit, 3 * unit);
  }

  if (["gesture", "explain", "wave"].includes(pose)) {
    const lift = pose === "wave" ? Math.round(Math.sin(elapsed / 280) * unit) : 0;
    ctx.fillStyle = profile.top;
    ctx.fillRect(x + 27 * unit, shoulderY + 8 * unit + lift, 8 * unit, 19 * unit);
    ctx.fillRect(x + 34 * unit, shoulderY - 2 * unit + lift, 7 * unit, 13 * unit);
    ctx.fillStyle = profile.skin;
    ctx.fillRect(x + 34 * unit, shoulderY - 8 * unit + lift, 8 * unit, 9 * unit);
    ctx.fillRect(x + 41 * unit, shoulderY - 12 * unit + lift, 3 * unit, 9 * unit);
  }
}

function drawNeck(profile, x, y, unit) {
  ctx.fillStyle = profile.skinShadow;
  ctx.fillRect(x - 8 * unit, y - 42 * unit, 16 * unit, 17 * unit);
  ctx.fillStyle = profile.skin;
  ctx.fillRect(x - 6 * unit, y - 43 * unit, 12 * unit, 16 * unit);
}

function drawHead(profile, expression, x, y, unit, blinking, elapsed) {
  const top = y - 78 * unit;
  ctx.fillStyle = profile.skinShadow;
  ctx.fillRect(x - 20 * unit, top + 7 * unit, 42 * unit, 39 * unit);
  ctx.fillRect(x - 16 * unit, top + 2 * unit, 34 * unit, 50 * unit);
  ctx.fillStyle = profile.skin;
  ctx.fillRect(x - 18 * unit, top + 5 * unit, 35 * unit, 42 * unit);
  ctx.fillRect(x - 14 * unit, top + 1 * unit, 27 * unit, 50 * unit);
  ctx.fillRect(x - 23 * unit, top + 22 * unit, 6 * unit, 12 * unit);
  ctx.fillRect(x + 17 * unit, top + 22 * unit, 6 * unit, 12 * unit);
  ctx.fillStyle = profile.skinShadow;
  ctx.fillRect(x - 22 * unit, top + 25 * unit, 3 * unit, 5 * unit);
  ctx.fillRect(x + 19 * unit, top + 25 * unit, 3 * unit, 5 * unit);

  drawBrows(profile, expression, x, top, unit);
  drawEyes(profile, expression, x, top, unit, blinking);
  drawNose(profile, x, top, unit);
  drawMouth(profile, expression, x, top, unit);
  if (profile.age === "elder") drawAgeLines(profile, x, top, unit, elapsed);
}

function drawBrows(profile, expression, x, top, unit) {
  ctx.fillStyle = profile.hair;
  const y = top + 18 * unit;
  if (["raised", "curious"].includes(expression.brows)) {
    ctx.fillRect(x - 13 * unit, y - 2 * unit, 9 * unit, 2 * unit);
    ctx.fillRect(x + 4 * unit, y - (expression.brows === "curious" ? 4 : 2) * unit, 9 * unit, 2 * unit);
  } else if (["concerned", "sad"].includes(expression.brows)) {
    ctx.fillRect(x - 13 * unit, y, 7 * unit, 2 * unit);
    ctx.fillRect(x - 6 * unit, y - unit, 3 * unit, 2 * unit);
    ctx.fillRect(x + 4 * unit, y - unit, 3 * unit, 2 * unit);
    ctx.fillRect(x + 7 * unit, y, 7 * unit, 2 * unit);
  } else if (["suspicious", "annoyed", "determined"].includes(expression.brows)) {
    ctx.fillRect(x - 13 * unit, y - unit, 9 * unit, 2 * unit);
    ctx.fillRect(x + 4 * unit, y + unit, 9 * unit, 2 * unit);
  } else {
    ctx.fillRect(x - 13 * unit, y, 9 * unit, 2 * unit);
    ctx.fillRect(x + 4 * unit, y, 9 * unit, 2 * unit);
  }
}

function drawEyes(profile, expression, x, top, unit, blinking) {
  const y = top + 24 * unit;
  const eyeHeight = blinking || expression.eyes === "soft" ? unit : (expression.eyes === "wide" ? 4 * unit : 3 * unit);
  ctx.fillStyle = "#f2eadb";
  ctx.fillRect(x - 13 * unit, y, 9 * unit, eyeHeight);
  ctx.fillRect(x + 4 * unit, y, 9 * unit, eyeHeight);
  if (blinking) {
    ctx.fillStyle = profile.hair;
    ctx.fillRect(x - 13 * unit, y + unit, 9 * unit, unit);
    ctx.fillRect(x + 4 * unit, y + unit, 9 * unit, unit);
    return;
  }
  const pupilOffset = expression.eyes === "side" ? 2 * unit : expression.eyes === "down" ? unit : 0;
  const pupilY = y + (expression.eyes === "down" ? 2 * unit : unit);
  ctx.fillStyle = "#262329";
  ctx.fillRect(x - 10 * unit + pupilOffset, pupilY, 3 * unit, 3 * unit);
  ctx.fillRect(x + 7 * unit + pupilOffset, pupilY, 3 * unit, 3 * unit);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 9 * unit + pupilOffset, pupilY, unit, unit);
  ctx.fillRect(x + 8 * unit + pupilOffset, pupilY, unit, unit);
}

function drawNose(profile, x, top, unit) {
  ctx.fillStyle = profile.skinShadow;
  ctx.fillRect(x, top + 28 * unit, 2 * unit, 8 * unit);
  ctx.fillRect(x - unit, top + 35 * unit, 4 * unit, 2 * unit);
}

function drawMouth(profile, expression, x, top, unit) {
  const y = top + 42 * unit;
  ctx.fillStyle = "#773d40";
  if (expression.mouth === "smile") {
    ctx.fillRect(x - 7 * unit, y, 14 * unit, 2 * unit);
    ctx.fillRect(x - 5 * unit, y + 2 * unit, 10 * unit, 2 * unit);
  } else if (expression.mouth === "sad") {
    ctx.fillRect(x - 5 * unit, y + unit, 10 * unit, 2 * unit);
    ctx.fillRect(x - 7 * unit, y + 3 * unit, 2 * unit, 2 * unit);
    ctx.fillRect(x + 5 * unit, y + 3 * unit, 2 * unit, 2 * unit);
  } else if (expression.mouth === "open") {
    ctx.fillRect(x - 4 * unit, y - unit, 8 * unit, 7 * unit);
    ctx.fillStyle = "#d88982";
    ctx.fillRect(x - 2 * unit, y + 3 * unit, 4 * unit, 2 * unit);
  } else if (expression.mouth === "small") {
    ctx.fillRect(x - 3 * unit, y + unit, 6 * unit, 2 * unit);
  } else if (expression.mouth === "firm") {
    ctx.fillRect(x - 6 * unit, y + unit, 12 * unit, 3 * unit);
  } else {
    ctx.fillRect(x - 6 * unit, y + unit, 12 * unit, 2 * unit);
  }
}

function drawAgeLines(profile, x, top, unit) {
  ctx.fillStyle = profile.skinShadow;
  ctx.fillRect(x - 17 * unit, top + 31 * unit, 5 * unit, unit);
  ctx.fillRect(x + 12 * unit, top + 31 * unit, 5 * unit, unit);
  ctx.fillRect(x - 9 * unit, top + 47 * unit, 4 * unit, unit);
  ctx.fillRect(x + 5 * unit, top + 47 * unit, 4 * unit, unit);
}

function drawHair(profile, x, y, unit, elapsed) {
  const top = y - 83 * unit;
  ctx.fillStyle = profile.hair;
  if (profile.hairStyle === "long") {
    ctx.fillRect(x - 20 * unit, top + 4 * unit, 40 * unit, 15 * unit);
    ctx.fillRect(x - 23 * unit, top + 13 * unit, 7 * unit, 48 * unit);
    ctx.fillRect(x + 16 * unit, top + 13 * unit, 7 * unit, 48 * unit);
    const sway = Math.round(Math.sin(elapsed / 1100) * unit);
    ctx.fillStyle = profile.hairLight;
    ctx.fillRect(x + 18 * unit + sway, top + 37 * unit, 4 * unit, 24 * unit);
  } else if (profile.hairStyle === "bun") {
    ctx.fillRect(x - 19 * unit, top + 7 * unit, 38 * unit, 14 * unit);
    ctx.fillRect(x - 8 * unit, top - 5 * unit, 17 * unit, 12 * unit);
    ctx.fillRect(x - 21 * unit, top + 17 * unit, 5 * unit, 22 * unit);
  } else if (profile.hairStyle === "helmet") {
    ctx.fillRect(x - 23 * unit, top + 1 * unit, 46 * unit, 23 * unit);
    ctx.fillStyle = profile.accent;
    ctx.fillRect(x - 21 * unit, top + 3 * unit, 42 * unit, 6 * unit);
    ctx.fillStyle = "#191d20";
    ctx.fillRect(x + 18 * unit, top + 20 * unit, 3 * unit, 22 * unit);
  } else if (profile.hairStyle === "elder") {
    ctx.fillRect(x - 19 * unit, top + 8 * unit, 38 * unit, 11 * unit);
    ctx.fillStyle = profile.hairLight;
    ctx.fillRect(x - 15 * unit, top + 4 * unit, 10 * unit, 7 * unit);
    ctx.fillRect(x + 4 * unit, top + 4 * unit, 12 * unit, 7 * unit);
  } else {
    ctx.fillRect(x - 19 * unit, top + 6 * unit, 38 * unit, 15 * unit);
    ctx.fillRect(x - 20 * unit, top + 17 * unit, 5 * unit, 15 * unit);
    ctx.fillRect(x + 15 * unit, top + 17 * unit, 5 * unit, 12 * unit);
  }
  ctx.fillStyle = profile.hairLight;
  ctx.fillRect(x - 11 * unit, top + 7 * unit, 15 * unit, 3 * unit);
}

function drawAccessory(profile, x, y, unit, pose) {
  if (profile.hairStyle === "short" && profile.top === "#b84e3d") {
    ctx.fillStyle = "#f5d865";
    ctx.fillRect(x - 13 * unit, y - 25 * unit, 26 * unit, 3 * unit);
  }
  if (pose === "phone") {
    ctx.fillStyle = "#20252c";
    ctx.fillRect(x + 29 * unit, y - 49 * unit, 7 * unit, 13 * unit);
    ctx.fillStyle = "#6ec3d4";
    ctx.fillRect(x + 31 * unit, y - 47 * unit, 3 * unit, 7 * unit);
  }
}

function resolveCamera(shot) {
  if (shot === "close") return { scale: 1.18, baseY: 0.88, offsetX: 0 };
  if (shot === "wide") return { scale: 0.84, baseY: 0.9, offsetX: 0 };
  if (shot === "left") return { scale: 0.96, baseY: 0.9, offsetX: -90 };
  if (shot === "right") return { scale: 0.96, baseY: 0.9, offsetX: 90 };
  return { scale: 1, baseY: 0.9, offsetX: 0 };
}
