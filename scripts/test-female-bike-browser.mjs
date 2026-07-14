#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  FEMALE_BIKE_ANIMATIONS,
  FEMALE_BIKE_TRANSITION_DURATION_MS
} from "../assets/sprites/vehicle/female/female-bike-animations.js";

const baseUrl = process.argv[2] || "http://127.0.0.1:8013/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9337;
const outputDir = "/tmp/hanoi-female-bike-browser";
const transitionPreviewDelay = Math.min(800, Math.floor(FEMALE_BIKE_TRANSITION_DURATION_MS * 0.55));
const transitionFinishDelay = FEMALE_BIKE_TRANSITION_DURATION_MS - transitionPreviewDelay + 180;
const fullTransitionDelay = FEMALE_BIKE_TRANSITION_DURATION_MS + 180;
assert.deepEqual(Object.keys(FEMALE_BIKE_ANIMATIONS).sort(), [
  "dismountHelmet",
  "dismountNoHelmet",
  "rideHelmet",
  "rideNoHelmet"
]);
assert.equal(FEMALE_BIKE_ANIMATIONS.dismountHelmet.frameCount, 20);
assert.equal(FEMALE_BIKE_ANIMATIONS.dismountHelmet.fps, 12);
assert.equal(FEMALE_BIKE_ANIMATIONS.dismountHelmet.sourceFacing, "left");
assert.equal(FEMALE_BIKE_ANIMATIONS.rideHelmet.idleFrame, 0);
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
  `--user-data-dir=/tmp/hanoi-female-bike-test-${process.pid}`,
  baseUrl,
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
const eventWaiters = new Map();

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
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result || {});
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails?.text || "Runtime exception");
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      errors.push(message.params.entry.text);
    }
    const waiters = eventWaiters.get(message.method);
    if (waiters?.length) waiters.shift()(message.params);
  });
}

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

function waitForEvent(method) {
  return new Promise((resolve) => {
    const waiters = eventWaiters.get(method) || [];
    waiters.push(resolve);
    eventWaiters.set(method, waiters);
  });
}

async function press(key, code = key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
}

async function hold(key, code, milliseconds) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await delay(milliseconds);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function getPlayerFacing() {
  const response = await send("Runtime.evaluate", {
    expression: `(async () => (await import("./src/state.js")).player.facing)()`,
    awaitPromise: true,
    returnByValue: true
  });
  return response.result.value;
}

const save = {
  currentMapId: "hoanKiem",
  player: { x: 610, y: 1370 },
  profile: { gender: "female" },
  vehicle: { owned: true, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null },
  gameTime: { day: 1, hour: 17, minute: 20, totalGameMinutes: 1040, paused: false, pauseReasons: [] },
  money: 150000,
  inventory: { foods: [], souvenirs: [], stamps: [], specialItems: ["Xe máy điện VinFast"] },
  completedQuizzes: {},
  completedTasks: {},
  taskStages: {},
  visitedMaps: ["hoanKiem"],
  eatenFoods: [],
  discoveredFoods: [],
  discoveredLandmarks: [],
};

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("hanoiPixelTourSaveV2", ${JSON.stringify(JSON.stringify(save))})`,
  });
  const loaded = waitForEvent("Page.loadEventFired");
  await send("Page.reload", { ignoreCache: true });
  await loaded;
  await delay(700);

  await press("v", "KeyV");
  await press("v", "KeyV");
  await hold("ArrowRight", "ArrowRight", 180);
  await delay(Math.max(0, transitionPreviewDelay - 180));
  const mounting = await screenshot("01-mounting");
  await delay(transitionFinishDelay);
  const mountedSave = await send("Runtime.evaluate", {
    expression: `JSON.parse(localStorage.getItem("hanoiPixelTourSaveV2"))`,
    returnByValue: true
  });
  assert.equal(mountedSave.result.value.vehicle.status, "riding", "Nhấn V hai lần không được hủy hoặc lặp transition");
  assert.deepEqual(mountedSave.result.value.player, save.player, "Movement phải bị khóa trong transition lên xe");
  const idle = await screenshot("02-riding-idle");
  await hold("ArrowRight", "ArrowRight", 420);
  assert.equal(await getPlayerFacing(), "right");
  const right = await screenshot("03-riding-right");
  await hold("ArrowLeft", "ArrowLeft", 420);
  assert.equal(await getPlayerFacing(), "left");
  const left = await screenshot("04-riding-left");
  await hold("ArrowUp", "ArrowUp", 260);
  assert.equal(await getPlayerFacing(), "up");
  const upFallback = await screenshot("05-riding-up-fallback");
  await hold("ArrowDown", "ArrowDown", 260);
  assert.equal(await getPlayerFacing(), "down");
  const downFallback = await screenshot("05b-riding-down-fallback");
  await press("v", "KeyV");
  await delay(transitionPreviewDelay);
  const dismounting = await screenshot("06-dismounting");
  await delay(transitionFinishDelay);
  const walking = await screenshot("07-walking");

  const companionSave = {
    ...save,
    gameTime: {
      ...save.gameTime,
      paused: true,
      pauseReasons: ["hanging-out-with-mo"]
    },
    weather: {
      type: "heavyRain",
      intensity: 1,
      startedAtGameMinute: 1040,
      durationGameMinutes: 90,
      nextWeatherType: "rain",
      transitionProgress: 0,
      surfaceWetness: 1,
      lastUpdatedAtGameMinute: 1040
    },
    npcSchedules: { mo: { currentState: "hangingOut", currentMap: "hoanKiem", x: 568, y: 1370 } },
    moCompanion: {
      active: true,
      currentMap: "hoanKiem",
      x: 568,
      y: 1370,
      facing: "right",
      followingPlayer: true,
      ridingWithPlayer: false,
      returnDestination: "nhaThoLon",
      pausedAt: 1040
    }
  };
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("hanoiPixelTourSaveV2", ${JSON.stringify(JSON.stringify(companionSave))})`,
  });
  const companionLoaded = waitForEvent("Page.loadEventFired");
  await send("Page.reload", { ignoreCache: true });
  await companionLoaded;
  await delay(700);
  await press("v", "KeyV");
  await delay(fullTransitionDelay);
  await hold("ArrowRight", "ArrowRight", 360);
  const moPassengerRain = await screenshot("08-mo-passenger-rain");
  await press("v", "KeyV");
  await delay(fullTransitionDelay);
  const moAfterDismount = await screenshot("08b-mo-after-dismount");

  const maleSave = { ...save, profile: { gender: "male" } };
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("hanoiPixelTourSaveV2", ${JSON.stringify(JSON.stringify(maleSave))})`,
  });
  const maleLoaded = waitForEvent("Page.loadEventFired");
  await send("Page.reload", { ignoreCache: true });
  await maleLoaded;
  await delay(700);
  await press("v", "KeyV");
  await delay(120);
  const maleFallback = await screenshot("09-male-existing-renderer");

  const parkingSave = {
    ...save,
    player: { x: 1090, y: 1170 },
    profile: { gender: "female" }
  };
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("hanoiPixelTourSaveV2", ${JSON.stringify(JSON.stringify(parkingSave))})`,
  });
  const parkingLoaded = waitForEvent("Page.loadEventFired");
  await send("Page.reload", { ignoreCache: true });
  await parkingLoaded;
  await delay(700);
  await press("v", "KeyV");
  await delay(fullTransitionDelay);
  await send("Runtime.evaluate", {
    expression: `(async () => {
      const [{ openParkingMenu }, { maps }] = await Promise.all([
        import("./src/systems/parking.js"),
        import("./src/data/maps.js")
      ]);
      openParkingMenu(maps.hoanKiem.parkingSpots[0]);
    })()`,
    awaitPromise: true
  });
  await delay(120);
  await press("Enter", "Enter");
  await delay(180);
  const parkedStatus = await send("Runtime.evaluate", {
    expression: `JSON.parse(localStorage.getItem("hanoiPixelTourSaveV2")).vehicle.status`,
    returnByValue: true
  });
  assert.equal(parkedStatus.result.value, "parked", "Gửi xe bằng menu bàn phím phải giữ hoạt động");
  await send("Runtime.evaluate", {
    expression: `(async () => {
      const [{ openParkingMenu }, { maps }] = await Promise.all([
        import("./src/systems/parking.js"),
        import("./src/data/maps.js")
      ]);
      openParkingMenu(maps.hoanKiem.parkingSpots[0]);
    })()`,
    awaitPromise: true
  });
  await delay(120);
  await press("Enter", "Enter");
  await delay(180);
  const retrievedStatus = await send("Runtime.evaluate", {
    expression: `JSON.parse(localStorage.getItem("hanoiPixelTourSaveV2")).vehicle.status`,
    returnByValue: true
  });
  assert.equal(retrievedStatus.result.value, "riding", "Lấy xe phải khôi phục trạng thái riding");
  const parking = await screenshot("10-parking-retrieved");
  assert.deepEqual(errors, [], `Browser console errors:\n${errors.join("\n")}`);
  console.log(JSON.stringify({ mounting, idle, right, left, upFallback, downFallback, dismounting, walking, moPassengerRain, moAfterDismount, maleFallback, parking }, null, 2));
  console.log("Female bike browser smoke: OK");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
