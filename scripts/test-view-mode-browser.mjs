#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9750 + (process.pid % 180);
const outputDir = "/tmp/hanoi-view-mode-browser";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-view-mode-${process.pid}`, baseUrl
], { stdio: ["ignore", "ignore", "pipe"], start_new_session: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const errors = [];
chrome.stderr.on("data", (chunk) => {
  const message = chunk.toString("utf8");
  if (/uncaught|syntaxerror|referenceerror|typeerror/i.test(message)) errors.push(message.trim());
});

let socket;
let requestId = 0;
const pending = new Map();

async function connect() {
  let target;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      target = targets.find((entry) => entry.type === "page");
      if (target) break;
    } catch {}
    await delay(100);
  }
  assert(target, "Chrome DevTools target was not available");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(message.error.message));
      else callback.resolve(message.result || {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "Runtime exception");
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text);
  });
}

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text || "Runtime evaluation failed");
  return response.result.value;
}

async function press(key, code = key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await delay(140);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function prepareView(viewpointId, { hour = 16, minute = 0, weather = "clear", intensity = 0, wetness = 0, withMo = false, train = false } = {}) {
  return evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const { viewpointsById } = await import("./src/data/viewpoints.js");
    const { closeAllOverlays } = await import("./src/systems/modal.js");
    const { endCutscene, isCutsceneActive } = await import("./src/systems/cutscene.js");
    const { enterViewMode, hydrateViewMode } = await import("./src/systems/viewMode.js");
    const profile = viewpointsById[${JSON.stringify(viewpointId)}];
    if (!profile) return null;
    if (isCutsceneActive()) endCutscene({ skipped: true });
    hydrateViewMode();
    closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    state.profile.gender = "female";
    state.story.introCompleted = true;
    state.story.currentScene = "hanoi-tour";
    state.currentMapId = profile.mapId;
    state.gameTime.day = 2;
    state.gameTime.hour = ${hour};
    state.gameTime.minute = ${minute};
    state.gameTime.totalGameMinutes = 1440 + ${hour} * 60 + ${minute};
    state.weather.type = ${JSON.stringify(weather)};
    state.weather.intensity = ${intensity};
    state.weather.surfaceWetness = ${wetness};
    state.weather.startedAtGameMinute = state.gameTime.totalGameMinutes;
    state.weather.durationGameMinutes = 480;
    state.weather.nextWeatherType = ${JSON.stringify(weather)};
    state.weather.transitionProgress = 0;
    state.weather.lastUpdatedAtGameMinute = state.gameTime.totalGameMinutes;
    state.moCompanion.active = ${withMo};
    state.moCompanion.currentMap = ${withMo} ? profile.mapId : null;
    state.moCompanion.followingPlayer = ${withMo};
    state.moCompanion.ridingWithPlayer = false;
    if (${train}) {
      state.randomEvents.active.longBienTrainPass = {
        eventId: "longBienTrainPass", mapId: "longBien",
        startedAt: state.gameTime.totalGameMinutes - 8,
        endsAt: state.gameTime.totalGameMinutes + 22,
        state: "active", phase: "passing"
      };
    } else {
      delete state.randomEvents.active.longBienTrainPass;
    }
    player.x = profile.position.x - player.width / 2;
    player.y = profile.position.y - player.height / 2;
    state.player.x = Math.round(player.x);
    state.player.y = Math.round(player.y);
    return enterViewMode(profile.id) ? profile.id : null;
  })()`);
}

async function getLakePixelAudit() {
  return evaluate(`(async () => {
    const { canvas, ctx } = await import("./src/state.js");
    const { drawViewModeScene } = await import("./src/render/renderViewMode.js");
    drawViewModeScene();
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let orangeSky = 0;
    let warmWater = 0;
    let redMidground = 0;
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const index = (y * canvas.width + x) * 4;
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        if (y < canvas.height * 0.43 && r > 180 && g > 70 && g < 215 && b < 135) orangeSky += 1;
        if (y > canvas.height * 0.43 && y < canvas.height * 0.82 && r > 150 && g > 82 && g < 220 && b < 125) warmWater += 1;
        if (y > canvas.height * 0.43 && y < canvas.height * 0.76 && r > 110 && r > g * 1.42 && r > b * 1.28) redMidground += 1;
      }
    }
    return { orangeSky, warmWater, redMidground };
  })()`);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(450);

  const profileAudit = await evaluate(`(async () => {
    const { viewpoints } = await import("./src/data/viewpoints.js");
    return viewpoints.map((entry) => ({
      id: entry.id, mapId: entry.mapId, layers: entry.panoramaLayers.length,
      fov: entry.fov, radius: entry.interactionRadius
    }));
  })()`);
  assert.equal(profileAudit.length, 10, "Phải có đủ 10 viewpoint bắt buộc");
  assert(profileAudit.every((entry) => entry.layers >= 4 && entry.fov >= 60 && entry.radius > 0));

  assert.equal(await prepareView("view-ho-guom", { hour: 17, minute: 30 }), "view-ho-guom");
  const lakeOrigin = await evaluate(`(async () => { const { runtime } = await import("./src/state.js"); return runtime.viewMode.origin; })()`);
  const lake = await screenshot("01-ho-guom-sunset");
  const sunsetAudit = await getLakePixelAudit();
  assert(sunsetAudit.orangeSky > 2500, "Hoàng hôn Hồ Gươm phải có bầu trời cam rõ");
  assert(sunsetAudit.warmWater > 80, "Hoàng hôn phải có phản chiếu ấm trên mặt hồ");
  await press("d", "KeyD");
  await press("d", "KeyD");
  await press("ArrowUp", "ArrowUp");
  const pan = await evaluate(`(async () => { const { runtime } = await import("./src/state.js"); return { yaw: runtime.viewMode.targetYaw, pitch: runtime.viewMode.targetPitch }; })()`);
  assert(pan.yaw > 0 && pan.pitch > 0, "Pan ngang/dọc phải cập nhật target camera");
  await press("e", "KeyE");
  const exited = await evaluate(`(async () => { const { player, runtime } = await import("./src/state.js"); return { active: runtime.viewMode.active, x: player.x, y: player.y }; })()`);
  assert.equal(exited.active, false);
  assert.equal(exited.x, lakeOrigin.x);
  assert.equal(exited.y, lakeOrigin.y);

  await prepareView("view-ho-guom", { hour: 17, minute: 30 });
  const bridgeBeforePan = (await getLakePixelAudit()).redMidground;
  for (let index = 0; index < 7; index += 1) await press("d", "KeyD");
  await delay(260);
  const bridgeAfterPan = (await getLakePixelAudit()).redMidground;
  assert(bridgeAfterPan > bridgeBeforePan + 20, "Cầu Thê Húc chỉ được lộ rõ khi pan về đúng phía");
  const lakePanRight = await screenshot("02-ho-guom-pan-right");

  await prepareView("view-thap-rua", { hour: 20 });
  const nightAudit = await getLakePixelAudit();
  assert(nightAudit.warmWater > 160, "Ban đêm phải có Tháp Rùa và reflection vàng rõ");
  const turtleTowerNight = await screenshot("03-thap-rua-night");

  await prepareView("view-nha-tho-lon", { hour: 10 });
  const cathedralDay = await screenshot("04-cathedral-day");
  await prepareView("view-nha-tho-lon", { hour: 20, wetness: 0.35 });
  const cathedralNight = await screenshot("05-cathedral-night");

  await prepareView("view-cau-long-bien", { hour: 19, train: true });
  assert.equal(await evaluate(`(async () => (await import("./src/systems/randomEvents.js")).isEventActive("longBienTrainPass"))()`), true);
  const bridgeTrain = await screenshot("06-long-bien-train");

  await prepareView("view-ho-guom", { hour: 20, weather: "heavyRain", intensity: 1, wetness: 0.9 });
  const rainyLake = await screenshot("07-ho-guom-heavy-rain");
  const rainyNightAudit = await getLakePixelAudit();
  assert(rainyNightAudit.warmWater > 90, "Mưa đêm vẫn phải giữ reflection đèn và Tháp Rùa dễ đọc");

  await prepareView("view-song-hong", { hour: 18, withMo: true });
  assert.equal(await evaluate(`(async () => (await import("./src/systems/moCompanion.js")).isMoCompanionActive())()`), true);
  const riverWithMo = await screenshot("08-song-hong-with-mo");

  await prepareView("view-thap-rua", { hour: 18, weather: "drizzle", intensity: 0.2, wetness: 0.4, withMo: true });
  await press("p", "KeyP");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/photoMode.js")).isPhotoModeActive())()`), true);
  await press("Enter", "Enter");
  const photo = await evaluate(`(async () => (await import("./src/state.js")).state.photoAlbum.photos["photo-thap-rua"])()`);
  assert.equal(photo.viewpointId, "view-thap-rua");
  assert.equal(photo.landmarkId, "hoGuom");
  assert.equal(photo.weather, "drizzle");
  assert.equal(photo.withMo, true);
  assert.equal(await evaluate(`(async () => (await import("./src/systems/viewMode.js")).isViewModeActive())()`), true, "Chụp ảnh không được tự thoát view mode");

  const renderedProfiles = [];
  for (const profile of profileAudit) {
    assert.equal(await prepareView(profile.id, { hour: 17 }), profile.id);
    const sample = await evaluate(`(async () => {
      const { canvas, ctx } = await import("./src/state.js");
      const { drawViewModeScene } = await import("./src/render/renderViewMode.js");
      drawViewModeScene();
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let signal = 0;
      for (let index = 0; index < pixels.length; index += 4096) signal += pixels[index] + pixels[index + 1] + pixels[index + 2];
      return signal;
    })()`);
    assert(sample > 0, `${profile.id} phải render ra pixel`);
    renderedProfiles.push(profile.id);
  }

  const renderBudget = await evaluate(`(async () => {
    const { drawViewModeScene } = await import("./src/render/renderViewMode.js");
    const startedAt = performance.now();
    for (let frame = 0; frame < 120; frame += 1) drawViewModeScene();
    return performance.now() - startedAt;
  })()`);
  assert(renderBudget < 1800, `120 frame panorama không được quá nặng (${renderBudget.toFixed(1)}ms)`);
  const lakeCacheSize = await evaluate(`(async () => (await import("./src/render/renderHoGuomPanorama.js")).getHoGuomPanoramaCacheSize())()`);
  assert(lakeCacheSize > 0 && lakeCacheSize <= 12, "Static lake layer cache phải hữu hạn");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("location.reload()");
  await delay(820);
  await prepareView("view-ho-guom", { hour: 20 });
  const mobileLakeAudit = await getLakePixelAudit();
  assert(mobileLakeAudit.warmWater > 30, "Panorama mobile vẫn phải giữ landmark/reflection dễ đọc");
  const mobileLake = await screenshot("09-ho-guom-mobile-night");
  const mobileLayout = await evaluate(`(() => {
    const canvas = document.querySelector("canvas");
    const rect = canvas.getBoundingClientRect();
    return { viewport: innerWidth, left: rect.left, right: rect.right, width: rect.width };
  })()`);
  assert(mobileLayout.left >= 0 && mobileLayout.right <= mobileLayout.viewport + 1, "View mode mobile không được tràn ngang");
  await send("Emulation.clearDeviceMetricsOverride");
  await delay(320);

  await evaluate(`(async () => { const { saveGame } = await import("./src/storage.js"); saveGame(); location.reload(); })()`);
  await delay(800);
  const reloadState = await evaluate(`(async () => ({
    active: (await import("./src/systems/viewMode.js")).isViewModeActive(),
    classActive: document.body.classList.contains("view-mode-active"),
    photoViewpointId: (await import("./src/state.js")).state.photoAlbum.photos["photo-thap-rua"]?.viewpointId || null
  }))()`);
  assert.deepEqual(reloadState, {
    active: false,
    classActive: false,
    photoViewpointId: "view-thap-rua"
  }, "Reload phải về top-down nhưng vẫn giữ metadata ảnh viewpoint");

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ lake, lakePanRight, turtleTowerNight, cathedralDay, cathedralNight, bridgeTrain, rainyLake, riverWithMo, mobileLake, mobileLayout, sunsetAudit, nightAudit, rainyNightAudit, mobileLakeAudit, bridgeBeforePan, bridgeAfterPan, lakeCacheSize, renderedProfiles, renderBudget }, null, 2)}\n`);
  process.stdout.write("View mode browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
