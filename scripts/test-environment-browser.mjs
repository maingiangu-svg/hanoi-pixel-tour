#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9341;
const outputDir = "/tmp/hanoi-environment-browser";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-background-networking",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-extensions",
  "--hide-scrollbars",
  "--window-size=1440,900",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-environment-test-${process.pid}`,
  baseUrl
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
      const details = message.params.exceptionDetails;
      errors.push(details?.exception?.description || details?.text || "Runtime exception");
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
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Runtime evaluation failed");
  return response.result.value;
}

async function press(key, code = key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await delay(120);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function loadSave(overrides = {}) {
  const save = {
    currentMapId: "hoanKiem",
    player: { x: 1305, y: 1210 },
    profile: { gender: "female" },
    vehicle: { owned: true, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null },
    gameTime: { day: 1, hour: 18, minute: 0, totalGameMinutes: 1080, paused: false, pauseReasons: [] },
    weather: { type: "clear", intensity: 0, startedAtGameMinute: 1080, durationGameMinutes: 300, nextWeatherType: "cloudy", transitionProgress: 0, surfaceWetness: 0, lastUpdatedAtGameMinute: 1080 },
    money: 50000,
    inventory: { foods: [], souvenirs: [], stamps: [], specialItems: ["Xe máy điện VinFast"] },
    completedQuizzes: {}, completedTasks: {}, taskStages: {}, visitedMaps: ["hoanKiem"],
    eatenFoods: [], discoveredFoods: [], discoveredLandmarks: [], branchingQuestProgress: {},
    randomEvents: { active: {}, cooldowns: {}, completedFlags: {} },
    ...overrides
  };
  await evaluate(`(async () => {
    const stateModule = await import("./src/state.js");
    const storage = await import("./src/storage.js");
    const environment = await import("./src/systems/environmentInteraction.js");
    const schedules = await import("./src/systems/npcSchedule.js");
    const modal = await import("./src/systems/modal.js");
    const camera = await import("./src/camera.js");
    const raw = ${JSON.stringify(JSON.stringify(save))};
    localStorage.setItem("hanoiPixelTourSaveV2", raw);
    const next = storage.normalizeState(JSON.parse(raw));
    stateModule.setState(next);
    stateModule.player.x = next.player.x;
    stateModule.player.y = next.player.y;
    stateModule.player.facing = "down";
    stateModule.runtime.nearbyInteractable = null;
    environment.hydrateEnvironmentInteraction();
    modal.closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    schedules.updateNpcSchedules();
    camera.snapCameraToPlayer();
    return true;
  })()`);
  await delay(260);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");

  await loadSave();
  await press("e", "KeyE");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/environmentInteraction.js")).isEnvironmentInteractionActive())()`), true);
  const seated = await screenshot("01-seated-ho-guom");
  await press("Escape", "Escape");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/environmentInteraction.js")).isEnvironmentInteractionActive())()`), false);

  await evaluate(`(() => { const s = globalThis; return true; })()`);
  await evaluate(`(async () => { const { player } = await import("./src/state.js"); player.x = 1214; player.y = 1004; })()`);
  await delay(180);
  await press("e", "KeyE");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/viewMode.js")).getActiveViewMode()?.viewpointId)()`), "view-ho-guom");
  await press("p", "KeyP");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/photoMode.js")).isPhotoModeActive())()`), true);
  const viewpointPhoto = await screenshot("02-viewpoint-photo-mode");
  await press("Escape", "Escape");
  await press("Escape", "Escape");

  await loadSave({
    currentMapId: "churchInterior",
    player: { x: 540, y: 258 },
    visitedMaps: ["hoanKiem", "churchInterior"]
  });
  await press("e", "KeyE");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/environmentInteraction.js")).getActiveEnvironmentInteraction()?.type)()`), "churchSeat");
  const churchSeat = await screenshot("03-church-seat");
  await press("Escape", "Escape");

  await loadSave({ player: { x: 1188, y: 920 } });
  const teaTarget = await evaluate(`(async () => {
    const { updateNearbyInteractable } = await import("./src/systems/interaction.js");
    const { runtime, player } = await import("./src/state.js");
    updateNearbyInteractable();
    return { type: runtime.nearbyInteractable?.type, id: runtime.nearbyInteractable?.source?.id, x: player.x, y: player.y };
  })()`);
  assert.deepEqual(teaTarget, { type: "environment", id: "tea-seat-ho-guom", x: 1188, y: 920 });
  await press("e", "KeyE");
  assert.equal(await evaluate(`!document.getElementById("choiceModal").classList.contains("hidden")`), true);
  await press("Enter", "Enter");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/environmentInteraction.js")).getActiveEnvironmentInteraction()?.pose)()`), "drink");
  assert.equal(await evaluate(`(async () => (await import("./src/state.js")).state.money)()`), 45000);
  const tea = await screenshot("04-tea-drink");
  await press("Escape", "Escape");

  await loadSave({ player: { x: 1098, y: 1168 } });
  await evaluate(`(async () => { const { state } = await import("./src/state.js"); state.vehicle.equipped = true; state.vehicle.status = "riding"; })()`);
  await delay(160);
  await press("e", "KeyE");
  assert.equal(await evaluate(`!document.getElementById("choiceModal").classList.contains("hidden")`), true);
  await press("Enter", "Enter");
  assert.equal(await evaluate(`(async () => (await import("./src/state.js")).state.vehicle.status)()`), "walking-bike");
  const walkingBike = await screenshot("05-walking-bike");
  await evaluate(`(async () => { const { player } = await import("./src/state.js"); player.x = 1160; player.y = 1180; })()`);
  await press("v", "KeyV");
  assert.equal(await evaluate(`(async () => (await import("./src/state.js")).state.vehicle.status)()`), "walking-bike");

  await loadSave({
    currentMapId: "longBien",
    player: { x: 1113, y: 594 },
    visitedMaps: ["hoanKiem", "longBien"],
    randomEvents: {
      active: { longBienTrainPass: { eventId: "longBienTrainPass", mapId: "longBien", startedAt: 1070, endsAt: 1100, state: "active", phase: "passing" } },
      cooldowns: {}, completedFlags: {}
    }
  });
  const bridgeAccess = await evaluate(`(async () => {
    const { getEnvironmentInteractionsForMap } = await import("./src/data/environmentInteractions.js");
    const { canUseEnvironmentInteraction } = await import("./src/systems/environmentInteraction.js");
    const points = getEnvironmentInteractionsForMap("longBien");
    return {
      bridge: canUseEnvironmentInteraction(points.find((item) => item.id === "view-cau-long-bien")),
      rail: canUseEnvironmentInteraction(points.find((item) => item.id === "view-duong-ray-long-bien"))
    };
  })()`);
  assert.equal(bridgeAccess.bridge.allowed, true);
  assert.equal(bridgeAccess.rail.allowed, false);
  await press("e", "KeyE");
  assert.equal(await evaluate(`(async () => (await import("./src/systems/viewMode.js")).isViewModeActive())()`), true);
  const trainView = await screenshot("06-train-panorama");

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ seated, viewpointPhoto, churchSeat, tea, walkingBike, trainView }, null, 2)}\n`);
  process.stdout.write("Environment browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
