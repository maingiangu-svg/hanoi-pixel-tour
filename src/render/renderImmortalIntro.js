import { canvas, ctx, runtime, state } from "../state.js";

const SCENE_WIDTH = 1280;
const SCENE_HEIGHT = 720;
const TREE_X = 746;
const TREE_Y = 480;
const PORTAL_X = 846;
const PORTAL_Y = 390;

const DISCIPLES = Object.freeze([
  Object.freeze({ x: 850, y: 458, robe: "#c66d52", hair: "#2a2428" }),
  Object.freeze({ x: 898, y: 470, robe: "#557ca5", hair: "#2c2523" }),
  Object.freeze({ x: 944, y: 452, robe: "#7c679b", hair: "#30272c" })
]);

const TREE_CROWN = Object.freeze([
  Object.freeze([-106, -272, 92, 66]), Object.freeze([-48, -298, 104, 78]),
  Object.freeze([24, -278, 104, 68]), Object.freeze([82, -244, 82, 64]),
  Object.freeze([-126, -220, 98, 72]), Object.freeze([-64, -234, 110, 80]),
  Object.freeze([18, -226, 114, 82]), Object.freeze([-34, -176, 118, 70])
]);

const SHOTS = Object.freeze({
  wide: Object.freeze({ x: 640, y: 360, zoom: 1 }),
  disciples: Object.freeze({ x: 874, y: 398, zoom: 1.18 }),
  elder: Object.freeze({ x: 500, y: 408, zoom: 1.25 }),
  tree: Object.freeze({ x: 746, y: 314, zoom: 1.13 }),
  rescue: Object.freeze({ x: 770, y: 414, zoom: 1.2 }),
  strike: Object.freeze({ x: 804, y: 392, zoom: 1.34 }),
  portal: Object.freeze({ x: 842, y: 390, zoom: 1.16 })
});

const CAMERA_ANIMATIONS = new Set([
  "cameraDisciples",
  "cameraElder",
  "stormBuild",
  "cameraRescue",
  "directStrike",
  "portalOpen"
]);

const ELDER_POSITION = { x: 468, y: 466 };

export function drawImmortalIntroScene() {
  const cutscene = runtime.cutscene;
  const scene = cutscene?.scene;
  if (!cutscene?.active || scene?.renderer !== "immortalIntro") return false;

  const now = performance.now();
  const sceneState = scene.state || {};
  const animation = sceneState.animation || null;
  const progress = getAnimationProgress(animation, now);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Number(cutscene.visual?.shakeX) || 0, Number(cutscene.visual?.shakeY) || 0);
  applySceneCoordinates();
  applyCinematicShot(sceneState, animation, progress);
  drawSky(sceneState);
  drawCloudBanks(sceneState, now);
  drawMountainLayers(sceneState, now);
  drawDistantMonastery(sceneState, now);
  drawCourtyard(sceneState, now);
  drawPortal(sceneState, animation, progress, now);
  drawSectHouse(sceneState, now);
  drawAncientTree(sceneState, animation, progress, now);
  drawCourtyardProps(sceneState, now);
  drawWorldLightning(sceneState, animation, progress, now);
  drawDisciples(sceneState, animation, progress, now);
  drawElderPlayer(sceneState, animation, progress, now);
  drawWindLeaves(sceneState, now);
  drawForeground(sceneState, now);
  ctx.restore();

  drawRainOverlay(sceneState, now);
  drawLightningFlash(sceneState, animation, progress);
  drawVignette(sceneState);
  drawForeshadow(sceneState.foreshadow, now);
  ctx.restore();
  return true;
}

function applySceneCoordinates() {
  const scale = Math.min(canvas.width / SCENE_WIDTH, canvas.height / SCENE_HEIGHT);
  const offsetX = Math.round((canvas.width - SCENE_WIDTH * scale) / 2);
  const offsetY = Math.round((canvas.height - SCENE_HEIGHT * scale) / 2);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
}

function applyCinematicShot(sceneState, animation, progress) {
  const target = SHOTS[sceneState.shot] || SHOTS.wide;
  const source = SHOTS[sceneState.fromShot] || target;
  const mix = CAMERA_ANIMATIONS.has(animation?.type) ? easeInOutCubic(progress) : 1;
  const focusX = lerp(source.x, target.x, mix);
  const focusY = lerp(source.y, target.y, mix);
  const zoom = lerp(source.zoom, target.zoom, mix);
  ctx.translate(SCENE_WIDTH / 2, SCENE_HEIGHT / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-Math.round(focusX), -Math.round(focusY));
}

function drawSky(sceneState) {
  const storm = clamp01(sceneState.storm);
  ctx.fillStyle = storm > 0.78 ? "#26313e" : storm > 0.46 ? "#3d5060" : "#62798a";
  ctx.fillRect(-340, -220, 1960, 980);
  ctx.fillStyle = storm > 0.78 ? "#323e4d" : storm > 0.46 ? "#4e6573" : "#768d99";
  ctx.fillRect(-340, 82, 1960, 138);
  ctx.fillStyle = storm > 0.68 ? "#586571" : "#8b9da3";
  ctx.fillRect(-340, 194, 1960, 72);
  ctx.fillStyle = "rgba(206, 218, 218, 0.14)";
  ctx.fillRect(-340, 260, 1960, 12);
}

function drawCloudBanks(sceneState, now) {
  const storm = clamp01(sceneState.storm);
  const wind = 0.35 + clamp01(sceneState.wind) * 1.45;
  const offset = Math.round((now * 0.018 * wind) % 1540);
  ctx.fillStyle = storm > 0.72 ? "#202b38" : "#425866";
  drawPixelCloud(-260 + offset, 76, 430, 1.08);
  drawPixelCloud(316 + offset * 0.58, 44, 520, 1.2);
  drawPixelCloud(930 + offset * 0.34, 92, 430, 1.04);
  ctx.fillStyle = storm > 0.72 ? "#394654" : "#647783";
  drawPixelCloud(1370 - offset * 0.82, 146, 390, 0.78);
  drawPixelCloud(730 - offset * 0.4, 168, 330, 0.72);
  ctx.fillStyle = "rgba(216, 224, 224, 0.16)";
  ctx.fillRect(-280, 220, 1860, 16);
  ctx.fillRect(-140 + Math.round(offset * 0.18), 246, 860, 8);
}

function drawPixelCloud(x, y, width, scale) {
  const unit = Math.max(6, Math.round(18 * scale));
  const roundedX = Math.round(x);
  ctx.fillRect(roundedX, y, width, unit * 2);
  ctx.fillRect(roundedX + unit * 2, y - unit, width - unit * 4, unit);
  ctx.fillRect(roundedX + unit * 5, y - unit * 2, width - unit * 10, unit);
  ctx.fillRect(roundedX + unit, y + unit * 2, width - unit * 2, Math.max(6, Math.round(unit * 0.55)));
}

function drawMountainLayers(sceneState, now) {
  const storm = clamp01(sceneState.storm);
  ctx.fillStyle = storm > 0.7 ? "#172b35" : "#29434b";
  drawSteppedMountain(-220, 170, 570, 236, 11);
  drawSteppedMountain(176, 118, 650, 290, 12);
  drawSteppedMountain(720, 154, 720, 248, 11);
  ctx.fillStyle = storm > 0.7 ? "#243c43" : "#3a565b";
  drawSteppedMountain(-130, 236, 610, 182, 9);
  drawSteppedMountain(360, 222, 590, 192, 9);
  drawSteppedMountain(890, 252, 500, 164, 8);
  ctx.fillStyle = "rgba(198, 211, 207, 0.12)";
  const mistShift = Math.round(Math.sin(now / 1500) * 24);
  ctx.fillRect(-280 + mistShift, 320, 830, 20);
  ctx.fillRect(520 - mistShift, 344, 920, 15);
}

function drawSteppedMountain(x, y, width, height, steps) {
  for (let index = 0; index < steps; index += 1) {
    const centerDistance = Math.abs(index - Math.floor(steps / 2));
    const inset = centerDistance * Math.round(width / (steps * 3.7));
    const stepHeight = Math.ceil(height / steps);
    ctx.fillRect(x + inset, y + index * stepHeight, width - inset * 2, stepHeight + 2);
  }
}

function drawDistantMonastery(sceneState, now) {
  const dark = clamp01(sceneState.storm) > 0.65;
  ctx.fillStyle = dark ? "#293034" : "#3c4546";
  ctx.fillRect(-80, 316, 1440, 86);
  ctx.fillStyle = dark ? "#463735" : "#5c4640";
  for (let x = -40; x < 1370; x += 174) {
    ctx.fillRect(x, 294, 142, 76);
    ctx.fillStyle = "#29272b";
    ctx.fillRect(x - 14, 282, 170, 14);
    ctx.fillRect(x + 2, 270, 138, 12);
    ctx.fillStyle = dark ? "#463735" : "#5c4640";
  }
  ctx.fillStyle = "#b38b4d";
  for (let x = 20; x < 1260; x += 214) {
    const pulse = 0.72 + Math.sin(now / 430 + x) * 0.12;
    ctx.globalAlpha = pulse;
    ctx.fillRect(x, 328, 8, 18);
    ctx.fillRect(x - 3, 346, 14, 8);
  }
  ctx.globalAlpha = 1;
}

function drawCourtyard(sceneState, now) {
  const storm = clamp01(sceneState.storm);
  ctx.fillStyle = storm > 0.72 ? "#666968" : "#7d7c72";
  ctx.fillRect(-300, 386, 1880, 620);
  ctx.fillStyle = storm > 0.72 ? "#757772" : "#929085";
  ctx.fillRect(-300, 405, 1880, 24);
  for (let y = 432; y < 790; y += 34) {
    const offset = ((y / 34) & 1) * 30;
    ctx.fillStyle = (y / 34) & 1 ? "#6c6e6b" : "#72736e";
    for (let x = -330 - offset; x < 1580; x += 62) {
      ctx.fillRect(x, y, 54, 3);
      ctx.fillRect(x, y, 3, 29);
      if (((x + y) / 3) % 5 === 0) ctx.fillRect(x + 17, y + 13, 8, 3);
    }
  }
  ctx.fillStyle = "#9c927b";
  ctx.fillRect(334, 432, 474, 174);
  ctx.fillStyle = "#655f57";
  ctx.fillRect(350, 448, 442, 4);
  ctx.fillRect(350, 586, 442, 4);
  ctx.fillRect(350, 448, 4, 142);
  ctx.fillRect(788, 448, 4, 142);
  ctx.fillStyle = "rgba(166, 204, 192, 0.09)";
  ctx.fillRect(376, 474, 390, 6);
  ctx.fillRect(410, 548, 330, 5);
  const wetPulse = Math.max(0, clamp01(sceneState.rain) - 0.35);
  if (wetPulse > 0) {
    ctx.fillStyle = `rgba(160, 190, 198, ${0.08 + wetPulse * 0.1})`;
    ctx.fillRect(96, 574, 226, 8);
    ctx.fillRect(836, 540, 246, 7);
    ctx.fillRect(460, 624, 360, 6);
    ctx.fillStyle = `rgba(203, 220, 218, ${0.05 + Math.sin(now / 210) * 0.02})`;
    ctx.fillRect(144, 577, 76, 2);
    ctx.fillRect(894, 543, 82, 2);
  }
}

function drawSectHouse(sceneState, now) {
  const dark = clamp01(sceneState.storm) > 0.68;
  ctx.fillStyle = "rgba(16, 20, 22, 0.3)";
  ctx.fillRect(70, 328, 344, 128);
  ctx.fillStyle = dark ? "#604a3f" : "#795a47";
  ctx.fillRect(58, 278, 350, 166);
  ctx.fillStyle = "#3c2d2d";
  ctx.fillRect(28, 260, 410, 20);
  ctx.fillRect(46, 242, 374, 18);
  ctx.fillRect(70, 228, 326, 14);
  ctx.fillStyle = "#211f24";
  for (let x = 38; x < 426; x += 28) ctx.fillRect(x, 254, 20, 7);
  ctx.fillStyle = "#c6a15b";
  ctx.fillRect(178, 306, 102, 138);
  ctx.fillStyle = "#28262a";
  ctx.fillRect(194, 330, 70, 114);
  ctx.fillStyle = "#7f5a3e";
  for (let x = 80; x <= 356; x += 92) ctx.fillRect(x, 292, 15, 152);
  ctx.fillStyle = "#203a37";
  ctx.fillRect(108, 316, 48, 58);
  ctx.fillRect(314, 316, 48, 58);
  ctx.fillStyle = "#a47a48";
  ctx.fillRect(116, 324, 32, 42);
  ctx.fillRect(322, 324, 32, 42);
  drawLantern(92, 294, now, dark);
  drawLantern(370, 294, now + 310, dark);
  ctx.fillStyle = "#777269";
  ctx.fillRect(152, 444, 158, 10);
  ctx.fillRect(166, 454, 130, 9);
  ctx.fillRect(180, 463, 102, 8);
}

function drawLantern(x, y, now, stormDark) {
  const pulse = 0.72 + Math.sin(now / 360) * 0.1;
  ctx.fillStyle = `rgba(239, 180, 82, ${stormDark ? 0.2 * pulse : 0.12 * pulse})`;
  ctx.fillRect(x - 12, y - 12, 32, 42);
  ctx.fillStyle = "#4b3028";
  ctx.fillRect(x, y - 10, 7, 8);
  ctx.fillStyle = "#d69a4b";
  ctx.fillRect(x - 3, y - 2, 13, 22);
  ctx.fillStyle = "#f1c66f";
  ctx.fillRect(x, y + 2, 7, 13);
  ctx.fillStyle = "#4b3028";
  ctx.fillRect(x - 5, y + 20, 17, 5);
}

function drawAncientTree(sceneState, animation, progress, now) {
  const charge = clamp01(sceneState.treeCharge);
  const wind = clamp01(sceneState.wind);
  const action = sceneState.action;
  const surge = action === "treeSurge" ? Math.sin(progress * Math.PI) : 0;
  const damaged = ["directStrike", "afterStrike", "portalOpen", "portalPull"].includes(action);
  const sway = Math.round(Math.sin(now / 240) * (1 + wind * 4) + surge * 5);
  const auraPulse = 0.1 + charge * (0.14 + Math.sin(now / 105) * 0.035);

  ctx.fillStyle = `rgba(149, 225, 166, ${auraPulse * 0.42})`;
  ctx.fillRect(TREE_X - 142 + sway, TREE_Y - 318, 286, 232);
  ctx.fillStyle = `rgba(185, 239, 176, ${auraPulse * 0.56})`;
  ctx.fillRect(TREE_X - 112 + sway, TREE_Y - 296, 228, 194);

  TREE_CROWN.forEach((cluster, index) => {
    const leafSway = sway + Math.round(Math.sin(now / 180 + index) * wind * 3);
    ctx.fillStyle = index % 3 === 0 ? "#263f32" : index % 2 ? "#31533c" : "#2a4936";
    ctx.fillRect(TREE_X + cluster[0] + leafSway, TREE_Y + cluster[1], cluster[2], cluster[3]);
    ctx.fillStyle = charge > 0.52 ? "rgba(151, 214, 139, 0.22)" : "rgba(112, 155, 103, 0.13)";
    ctx.fillRect(TREE_X + cluster[0] + 12 + leafSway, TREE_Y + cluster[1] + 10, cluster[2] - 24, 8);
  });

  ctx.fillStyle = "#4a352d";
  for (let index = 0; index < 11; index += 1) {
    const segmentSway = Math.round(sway * (index / 14));
    const width = 42 - index * 2;
    ctx.fillRect(TREE_X - Math.round(width / 2) + segmentSway, TREE_Y - index * 21, width, 24);
  }
  ctx.fillStyle = "#6a4935";
  for (let index = 0; index < 9; index += 1) {
    const segmentSway = Math.round(sway * (index / 12));
    ctx.fillRect(TREE_X - 8 + segmentSway, TREE_Y - 8 - index * 21, 10, 18);
  }
  drawSteppedBranch(TREE_X - 6, TREE_Y - 174, -1, 7, sway, "#4a352d");
  drawSteppedBranch(TREE_X + 7, TREE_Y - 146, 1, 8, sway, "#4a352d");
  drawSteppedBranch(TREE_X + 3, TREE_Y - 208, 1, 5, sway, "#5a3e30");

  ctx.fillStyle = "#3b2b29";
  ctx.fillRect(TREE_X - 54, TREE_Y - 12, 42, 12);
  ctx.fillRect(TREE_X + 12, TREE_Y - 10, 46, 10);

  if (damaged) {
    ctx.fillStyle = "#d7f5cf";
    ctx.fillRect(TREE_X - 4, TREE_Y - 210, 7, 34);
    ctx.fillRect(TREE_X + 2, TREE_Y - 180, 7, 28);
    ctx.fillRect(TREE_X - 7, TREE_Y - 154, 8, 42);
    ctx.fillStyle = "#25302b";
    ctx.fillRect(TREE_X + 70 + sway, TREE_Y - 257, 48, 13);
    ctx.fillRect(TREE_X + 102 + sway, TREE_Y - 244, 13, 28);
  }
}

function drawSteppedBranch(x, y, direction, steps, sway, color) {
  ctx.fillStyle = color;
  for (let index = 0; index < steps; index += 1) {
    ctx.fillRect(x + direction * index * 15 + Math.round(sway * index / steps), y - index * 10, 22, 13);
  }
}

function drawCourtyardProps(sceneState, now) {
  drawStoneLantern(442, 410, sceneState, now);
  drawStoneLantern(1090, 416, sceneState, now + 180);
  ctx.fillStyle = "#575b59";
  ctx.fillRect(1160, 358, 15, 128);
  ctx.fillRect(1138, 356, 60, 10);
  ctx.fillRect(1148, 344, 40, 12);
  ctx.fillStyle = "#4c514e";
  ctx.fillRect(1126, 482, 82, 10);
  ctx.fillStyle = "#6b655c";
  ctx.fillRect(32, 488, 148, 11);
  for (let x = 44; x < 176; x += 33) ctx.fillRect(x, 454, 9, 40);
  ctx.fillStyle = "#526052";
  ctx.fillRect(34, 440, 144, 16);
}

function drawStoneLantern(x, y, sceneState, now) {
  const charge = clamp01(sceneState.treeCharge);
  ctx.fillStyle = `rgba(158, 224, 170, ${0.04 + charge * 0.07 + Math.sin(now / 270) * 0.012})`;
  ctx.fillRect(x - 18, y - 30, 48, 50);
  ctx.fillStyle = "#666b66";
  ctx.fillRect(x, y, 12, 60);
  ctx.fillRect(x - 8, y - 4, 28, 20);
  ctx.fillRect(x - 13, y - 10, 38, 8);
  ctx.fillStyle = "#a8d3a0";
  ctx.fillRect(x - 1, y + 1, 14, 10);
  ctx.fillStyle = "#555a56";
  ctx.fillRect(x - 9, y + 58, 30, 8);
}

function drawDisciples(sceneState, animation, progress, now) {
  const action = sceneState.action;
  const rescueProgress = animation?.type === "rescueRun" ? easeOutCubic(progress) : 0;
  const safe = Boolean(sceneState.disciplesSafe) || ["directStrike", "afterStrike", "portalOpen", "portalPull"].includes(action);
  DISCIPLES.forEach((disciple, index) => {
    let x = disciple.x;
    let y = disciple.y;
    let pose = "idle";
    let facing = action === "stormBuild" || action === "treeSurge" ? "left" : index === 1 ? "left" : "right";

    if (action === "rescueRun") {
      x += rescueProgress * (82 + index * 13);
      y += rescueProgress * (index === 1 ? -14 : 16);
      pose = "stumble";
      facing = "right";
    } else if (safe) {
      x += 82 + index * 13;
      y += index === 1 ? -14 : 16;
      pose = action === "portalPull" ? "kneel" : "cower";
      facing = "left";
    } else if (action === "treeSurge" || action === "distantLightning") {
      pose = "cower";
    }

    const idle = pose === "idle" ? Math.round(Math.sin(now / (250 + index * 35) + index) * 2) : 0;
    drawSmallPerson(Math.round(x), Math.round(y + idle), disciple.robe, disciple.hair, facing, pose, now + index * 120);
  });
}

function drawElderPlayer(sceneState, animation, progress, now) {
  resolveElderPosition(sceneState, animation, progress);
  let pose = "idle";
  if (sceneState.action === "rescueRun") pose = "run";
  if (sceneState.action === "shield") pose = "shield";
  if (sceneState.action === "directStrike") pose = "struck";
  if (sceneState.action === "afterStrike") pose = "lifted";
  if (sceneState.action === "portalOpen") pose = "lifted";
  if (sceneState.action === "portalPull") pose = "pulled";
  const idleBob = pose === "idle" ? Math.round(Math.sin(now / 420)) : 0;
  drawElderSprite(
    Math.round(ELDER_POSITION.x),
    Math.round(ELDER_POSITION.y + idleBob),
    state.profile?.gender || "male",
    pose,
    clamp01(sceneState.wind),
    now
  );
}

function resolveElderPosition(sceneState, animation, progress) {
  let x = 468;
  let y = 466;
  const action = sceneState.action;
  if (action === "rescueRun") x = lerp(468, 798, easeOutCubic(progress));
  else if (["shield", "directStrike", "afterStrike", "portalOpen", "portalPull"].includes(action)) x = 798;
  if (action === "directStrike") y -= Math.sin(progress * Math.PI) * 8;
  if (action === "afterStrike") y -= 12 + Math.sin(progress * Math.PI) * 8;
  if (action === "portalOpen") y -= 18 + progress * 7;
  if (action === "portalPull") {
    x = lerp(798, 858, easeInOutCubic(progress));
    y = lerp(441, 386, easeInOutCubic(progress));
  }
  ELDER_POSITION.x = x;
  ELDER_POSITION.y = y;
}

function drawElderSprite(x, y, gender, pose, wind, now) {
  const struck = pose === "struck";
  const lifted = pose === "lifted" || pose === "pulled";
  if (struck || lifted) {
    ctx.fillStyle = struck ? "rgba(219, 250, 255, 0.34)" : "rgba(160, 226, 205, 0.2)";
    ctx.fillRect(x - 18, y - 18, 68, 74);
    ctx.fillStyle = struck ? "rgba(245, 255, 255, 0.32)" : "rgba(198, 240, 221, 0.14)";
    ctx.fillRect(x - 9, y - 10, 50, 58);
  }
  if (!lifted) {
    ctx.fillStyle = "rgba(11, 17, 20, 0.3)";
    ctx.fillRect(x - 18, y + 41, 62, 9);
  }
  const robe = struck ? "#e9fbff" : gender === "female" ? "#735986" : "#586a82";
  const robeLight = struck ? "#ffffff" : gender === "female" ? "#9375a5" : "#71849b";
  const clothLift = pose === "run" ? 12 : Math.round(Math.sin(now / 125) * wind * 4);

  if (struck) {
    ctx.fillStyle = "#537b8d";
    ctx.fillRect(x - 9, y + 12, 46, 37);
    ctx.fillRect(x - 34, y + 15, 28, 18);
    ctx.fillRect(x + 34, y + 15, 31, 18);
    ctx.fillRect(x + 2, y - 3, 26, 24);
  }

  ctx.fillStyle = robe;
  ctx.fillRect(x - 5, y + 15, 38, 30);
  ctx.fillStyle = robeLight;
  ctx.fillRect(x + 3, y + 18, 10, 26);
  if (pose === "run") {
    ctx.fillStyle = robe;
    ctx.fillRect(x - 19 - clothLift, y + 22, 20 + clothLift, 22);
    ctx.fillRect(x + 28, y + 31, 20, 10);
    ctx.fillStyle = "#2f3138";
    ctx.fillRect(x - 3, y + 44, 12, 8);
    ctx.fillRect(x + 25, y + 39, 14, 8);
  } else if (pose === "shield" || struck) {
    ctx.fillStyle = robe;
    ctx.fillRect(x - 31, y + 18, 30, 12);
    ctx.fillRect(x + 31, y + 18, 30, 12);
    ctx.fillStyle = struck ? "#ffffff" : "#dfc39f";
    ctx.fillRect(x - 38, y + 19, 9, 9);
    ctx.fillRect(x + 60, y + 19, 9, 9);
  } else {
    ctx.fillStyle = robe;
    ctx.fillRect(x - 14 - Math.max(0, clothLift), y + 22, 13 + Math.max(0, clothLift), 25);
    ctx.fillRect(x + 32, y + 22, 13 + Math.max(0, -clothLift), 25);
  }

  ctx.fillStyle = struck ? "#ffffff" : "#e0c6a2";
  ctx.fillRect(x + 5, y + 1, 19, 18);
  ctx.fillStyle = struck ? "#effcff" : "#e3e1d9";
  ctx.fillRect(x, y - 8, 29, 10);
  ctx.fillRect(x - 2 - Math.max(0, clothLift), y - 2, 8 + Math.max(0, clothLift), 22);
  ctx.fillRect(x + 23, y - 2, 8 + Math.max(0, -clothLift), 22);
  if (gender === "female") {
    ctx.fillRect(x - 6 - Math.max(0, clothLift), y + 3, 7 + Math.max(0, clothLift), 29);
    ctx.fillRect(x + 28, y + 3, 7 + Math.max(0, -clothLift), 29);
  } else {
    ctx.fillRect(x + 9, y + 18, 11, 15);
  }
  if (!struck) {
    ctx.fillStyle = "#252228";
    ctx.fillRect(x + 8, y + 8, 3, 3);
    ctx.fillRect(x + 18, y + 8, 3, 3);
  }
}

function drawSmallPerson(x, y, robe, hair, facing, pose = "idle", now = 0) {
  const crouch = pose === "cower" || pose === "kneel" ? 7 : 0;
  const stumble = pose === "stumble" ? Math.round(Math.sin(now / 70) * 3) : 0;
  ctx.fillStyle = "rgba(10, 16, 18, 0.24)";
  ctx.fillRect(x - 6, y + 30, 34, 7);
  ctx.fillStyle = robe;
  ctx.fillRect(x + stumble, y + 11 + crouch, 23, 22 - Math.round(crouch / 2));
  if (pose === "cower") ctx.fillRect(x - 8, y + 16 + crouch, 10, 16);
  else ctx.fillRect(facing === "left" ? x - 6 : x + 21, y + 16 + crouch, 9, 15);
  ctx.fillStyle = "#d8b489";
  ctx.fillRect(x + 4 + stumble, y + crouch, 15, 13);
  ctx.fillStyle = hair;
  ctx.fillRect(x + 2 + stumble, y - 4 + crouch, 19, 7);
  ctx.fillRect(facing === "left" ? x + stumble : x + 17 + stumble, y + 2 + crouch, 5, 10);
}

function drawWorldLightning(sceneState, animation, progress, now) {
  if (sceneState.action === "distantLightning" && animation?.type === "distantLightning") {
    drawPixelBolt(690, -80, TREE_X + 6, TREE_Y - 232, 8, "#e9f7ff", 11);
    drawPixelBolt(736, 92, 666, 212, 4, "#a9d8ed", 7);
    return;
  }
  if (sceneState.action !== "directStrike" || animation?.type !== "directStrike") return;
  resolveElderPosition(sceneState, animation, progress);
  const targetX = Math.round(ELDER_POSITION.x + 13);
  const targetY = Math.round(ELDER_POSITION.y + 10);
  const phase = Math.min(2, Math.floor(progress * 7));
  const width = phase === 0 ? 15 : phase === 1 ? 10 : 6;
  ctx.fillStyle = "rgba(163, 226, 255, 0.24)";
  ctx.fillRect(targetX - 46, targetY - 76, 104, 146);
  drawPixelBolt(716, -120, targetX, targetY, width + 8, "#8ccfe9", 13);
  drawPixelBolt(716, -120, targetX, targetY, width, "#ffffff", 13);
  drawPixelBolt(744, 60, 872, 210, 5, "#bcecff", 8);
  drawPixelBolt(753, 140, 682, 266, 4, "#a8dff1", 7);
  drawPixelBolt(TREE_X + 18, TREE_Y - 195, targetX, targetY - 14, 5, "#b8f2d0", 7);
  ctx.fillStyle = progress < 0.64 ? "#ffffff" : "#d9f7ff";
  ctx.fillRect(targetX - 4, targetY - 20, 15, 62);
  ctx.fillStyle = `rgba(220, 251, 255, ${0.35 + Math.sin(now / 32) * 0.08})`;
  ctx.fillRect(targetX - 34, targetY - 4, 24, 8);
  ctx.fillRect(targetX + 18, targetY + 11, 26, 8);
  ctx.fillRect(targetX - 12, targetY - 36, 7, 18);
  ctx.fillRect(targetX + 12, targetY + 42, 7, 20);
}

function drawPixelBolt(startX, startY, endX, endY, width, color, steps) {
  ctx.fillStyle = color;
  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps;
    const jitter = index === 0 || index === steps ? 0 : ((index % 3) - 1) * 10;
    const x = Math.round(lerp(startX, endX, ratio) + jitter);
    const y = Math.round(lerp(startY, endY, ratio));
    ctx.fillRect(x - Math.round(width / 2), y, width, Math.ceil((endY - startY) / steps) + 8);
  }
}

function drawPortal(sceneState, animation, progress, now) {
  const action = sceneState.action;
  if (!["afterStrike", "portalOpen", "portalPull"].includes(action)) return;
  let open = clamp01(sceneState.portal);
  if (animation?.type === "portalOpen") open = Math.max(0.16, easeOutCubic(progress));
  if (action === "portalPull") open = 1;
  const height = Math.round(46 + open * 244);
  const halfHeight = Math.round(height / 2);
  const pulse = Math.sin(now / 72);

  ctx.fillStyle = `rgba(113, 215, 209, ${0.1 + open * 0.13})`;
  ctx.fillRect(PORTAL_X - 72, PORTAL_Y - halfHeight - 18, 144, height + 36);
  for (let y = -halfHeight; y <= halfHeight; y += 9) {
    const wave = Math.round(Math.sin(y * 0.09 + now / 115) * (5 + open * 7));
    const taper = 1 - Math.abs(y) / Math.max(1, halfHeight);
    const outer = Math.max(4, Math.round(11 + taper * open * 25));
    ctx.fillStyle = "#69b7c6";
    ctx.fillRect(PORTAL_X + wave - outer, PORTAL_Y + y, outer * 2, 11);
    const coreHalf = Math.max(3, Math.round(outer * 0.42));
    ctx.fillStyle = "#182b34";
    ctx.fillRect(PORTAL_X + wave - coreHalf, PORTAL_Y + y, coreHalf * 2 + 1, 11);
    ctx.fillStyle = "#d5fbf3";
    ctx.fillRect(PORTAL_X + wave - coreHalf - 4, PORTAL_Y + y, 4, 11);
    ctx.fillRect(PORTAL_X + wave + coreHalf + 1, PORTAL_Y + y, 4, 11);
  }
  ctx.fillStyle = `rgba(239, 255, 249, ${0.46 + pulse * 0.1})`;
  ctx.fillRect(PORTAL_X - 3, PORTAL_Y - halfHeight + 10, 7, height - 20);

  ctx.fillStyle = "#c7f5df";
  const particles = Math.round(6 + open * 16);
  for (let index = 0; index < particles; index += 1) {
    const angle = index * 1.91 + now / 580;
    const radius = 30 + (index % 5) * 13 + open * 16;
    const x = Math.round(PORTAL_X + Math.cos(angle) * radius);
    const y = Math.round(PORTAL_Y + Math.sin(angle * 0.72) * (54 + (index % 4) * 18));
    ctx.fillRect(x, y, 3 + (index % 2) * 3, 3 + ((index + 1) % 2) * 3);
  }

  if (open > 0.76) {
    ctx.globalAlpha = Math.min(0.22, (open - 0.76) * 0.65);
    ctx.fillStyle = "#182830";
    ctx.fillRect(PORTAL_X - 25, PORTAL_Y + 26, 50, 4);
    ctx.fillRect(PORTAL_X - 18, PORTAL_Y - 12, 5, 38);
    ctx.fillRect(PORTAL_X + 13, PORTAL_Y - 12, 5, 38);
    ctx.fillStyle = "#76b6be";
    ctx.fillRect(PORTAL_X - 32, PORTAL_Y + 48, 64, 7);
    ctx.globalAlpha = 1;
  }
}

function drawWindLeaves(sceneState, now) {
  const wind = clamp01(sceneState.wind);
  if (wind < 0.22) return;
  const count = Math.round(8 + wind * 24);
  for (let index = 0; index < count; index += 1) {
    const x = Math.round((index * 97 + now * (0.08 + wind * 0.22)) % 1510) - 100;
    const y = 122 + ((index * 47 + Math.round(now * wind / 30)) % 470);
    ctx.fillStyle = index % 3 === 0 ? "#9a9b63" : index % 2 ? "#687c4e" : "#7f8f56";
    ctx.fillRect(x, y, 7 + (index % 3) * 3, 3 + (index % 2) * 2);
    if (wind > 0.7) ctx.fillRect(x - 5, y + 4, 5, 2);
  }
}

function drawForeground(sceneState, now) {
  ctx.fillStyle = "#1c2c2e";
  ctx.fillRect(-260, 668, 1800, 140);
  ctx.fillStyle = "#30413d";
  for (let x = -180; x < 1460; x += 74) {
    const height = 18 + ((x / 74) & 3) * 7;
    ctx.fillRect(x, 650 - height, 12, height + 20);
    ctx.fillRect(x + 8, 658 - Math.round(height * 0.7), 9, Math.round(height * 0.7) + 12);
  }
  ctx.fillStyle = "#59605b";
  ctx.fillRect(-120, 646, 1550, 12);
  for (let x = -90; x < 1400; x += 96) ctx.fillRect(x, 612, 10, 44);
  ctx.fillStyle = "rgba(178, 207, 196, 0.08)";
  ctx.fillRect(-120 + Math.round(Math.sin(now / 900) * 8), 658, 1550, 5);
}

function drawRainOverlay(sceneState, now) {
  const rain = clamp01(sceneState.rain);
  if (rain <= 0.02) return;
  const count = Math.round(12 + rain * 78);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = `rgba(188, 218, 229, ${0.18 + rain * 0.25})`;
  for (let index = 0; index < count; index += 1) {
    const x = Math.round((index * 149 + now * (0.38 + rain * 0.38)) % (canvas.width + 90)) - 45;
    const y = Math.round((index * 83 + now * (0.52 + rain * 0.7)) % (canvas.height + 100)) - 50;
    const length = 5 + Math.round(rain * 9) + (index % 3);
    ctx.fillRect(x, y, 2, length);
    if (rain > 0.58 && index % 5 === 0) ctx.fillRect(x - 5, y + length + 3, 10, 2);
  }
  ctx.restore();
}

function drawLightningFlash(sceneState, animation, progress) {
  let alpha = 0;
  if (sceneState.action === "distantLightning") alpha = 0.16 + (1 - progress) * 0.2;
  if (sceneState.action === "directStrike") {
    if (progress < 0.18) alpha = 0.44;
    else if (progress < 0.52) alpha = 0.22;
    else alpha = 0.14 * (1 - progress);
  }
  if (sceneState.action === "afterStrike") alpha = 0.09 * (1 - progress);
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(232, 248, 255, ${alpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVignette(sceneState) {
  const storm = clamp01(sceneState.storm);
  const alpha = 0.06 + storm * 0.09;
  const band = Math.max(14, Math.round(Math.min(canvas.width, canvas.height) * 0.035));
  ctx.fillStyle = `rgba(8, 15, 20, ${alpha})`;
  for (let index = 0; index < 3; index += 1) {
    const inset = index * band;
    const thickness = band;
    const layerAlpha = 1 - index * 0.25;
    ctx.globalAlpha = layerAlpha;
    ctx.fillRect(inset, inset, canvas.width - inset * 2, thickness);
    ctx.fillRect(inset, canvas.height - inset - thickness, canvas.width - inset * 2, thickness);
    ctx.fillRect(inset, inset + thickness, thickness, canvas.height - (inset + thickness) * 2);
    ctx.fillRect(canvas.width - inset - thickness, inset + thickness, thickness, canvas.height - (inset + thickness) * 2);
  }
  ctx.globalAlpha = 1;
}

function drawForeshadow(kind, now) {
  if (!kind) return;
  ctx.save();
  const scale = Math.min(canvas.width / SCENE_WIDTH, canvas.height / SCENE_HEIGHT);
  const offsetX = Math.round((canvas.width - SCENE_WIDTH * scale) / 2);
  const offsetY = Math.round((canvas.height - SCENE_HEIGHT * scale) / 2);
  ctx.fillStyle = "rgba(229, 243, 247, 0.92)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  if (kind === "bridge") {
    ctx.fillStyle = "#152027";
    ctx.fillRect(102, 470, 1076, 22);
    for (let x = 132; x < 1150; x += 92) {
      ctx.fillRect(x, 260, 12, 210);
      ctx.fillRect(x + 12, 274, 80, 9);
      ctx.fillRect(x + 12, 444, 80, 9);
      ctx.fillRect(x + 20, 294, 7, 146);
      ctx.fillRect(x + 64, 294, 7, 146);
    }
    ctx.fillStyle = "#446571";
    ctx.fillRect(0, 504, SCENE_WIDTH, 216);
    ctx.fillStyle = "rgba(203, 228, 229, 0.34)";
    ctx.fillRect(0, 528, SCENE_WIDTH, 8);
    ctx.fillRect(120, 566, 980, 5);
  } else if (kind === "pendant") {
    const bob = Math.round(Math.sin(now / 80) * 2);
    drawSmallPerson(590, 342 + bob, "#d9a84c", "#2e2526", "right", "idle", now);
    ctx.fillStyle = "#d6b54f";
    ctx.fillRect(658, 344, 6, 54);
    ctx.fillRect(646, 392, 30, 24);
    ctx.fillStyle = "#314e59";
    ctx.fillRect(652, 397, 18, 12);
    ctx.fillStyle = "#f0d878";
    ctx.fillRect(657, 400, 8, 6);
  }
  ctx.restore();
}

function getAnimationProgress(animation, now) {
  if (!animation) return 1;
  return clamp01((now - animation.startedAt) / Math.max(1, animation.duration));
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
