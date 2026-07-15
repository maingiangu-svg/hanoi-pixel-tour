#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9300 + (process.pid % 300);
const outputDir = "/tmp/hanoi-navigation-browser";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-navigation-test-${process.pid}`, baseUrl
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
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text || "Runtime exception");
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
  await delay(140);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(500);
  await evaluate(`(async () => {
    const { state, player } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    const modal = await import("./src/systems/modal.js");
    state.profile.gender = "female";
    state.currentMapId = "hoanKiem";
    state.navigation = { trackedObjective: null, showWorldGuidance: true };
    state.moCompanion.active = false;
    state.vehicle = { owned: true, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null };
    player.x = 610; player.y = 1370;
    modal.closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    navigation.setTrackedObjective({ id: "browser-lake", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "walking" }, { silent: true });
    return navigation.getCurrentRoute().length;
  })()`);

  await press("m", "KeyM");
  const mapState = await evaluate(`({
    open: !document.getElementById("mapPanel").classList.contains("hidden"),
    route: Boolean(document.querySelector(".map-navigation-route")),
    objective: Boolean(document.querySelector(".map-marker-objective")),
    targets: document.querySelectorAll(".map-target").length,
    selected: document.querySelectorAll(".map-target.is-selected").length
  })`);
  assert.equal(mapState.open, true);
  assert.equal(mapState.route, true);
  assert.equal(mapState.objective, true);
  assert(mapState.targets >= 8);
  assert.equal(mapState.selected, 1);
  const map = await screenshot("01-map-route");

  const playerBefore = await evaluate(`(async () => { const { player } = await import("./src/state.js"); return { x: player.x, y: player.y }; })()`);
  await press("w", "KeyW");
  const playerAfter = await evaluate(`(async () => { const { player } = await import("./src/state.js"); return { x: player.x, y: player.y }; })()`);
  assert.deepEqual(playerAfter, playerBefore, "Player không được di chuyển phía sau bản đồ");
  await press("s", "KeyS");
  await press("d", "KeyD");
  await press("Enter", "Enter");
  assert.equal(await evaluate(`(async () => Boolean((await import("./src/systems/navigation.js")).getTrackedObjective()))()`), true);
  await press("m", "KeyM");
  assert.equal(await evaluate(`document.getElementById("mapPanel").classList.contains("hidden")`), true);
  const worldArrow = await screenshot("02-world-guidance");

  const transit = await evaluate(`(async () => {
    const navigation = await import("./src/systems/navigation.js");
    navigation.setTrackedObjective({ id: "browser-bridge", type: "landmark", targetId: "cauLongBien", label: "Cầu Long Biên", routeMode: "auto" }, { silent: true });
    const resolved = navigation.getResolvedObjective();
    return { stage: resolved.stage, targetId: resolved.targetId, routeLength: navigation.getCurrentRoute().length };
  })()`);
  assert.equal(transit.stage, "reachTransit");
  assert.equal(transit.targetId, "roadToLongBien");
  assert(transit.routeLength >= 2);

  const parking = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    state.vehicle.status = "riding"; state.vehicle.equipped = true;
    navigation.setTrackedObjective({ id: "browser-lake-bike", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "auto" }, { silent: true });
    const resolved = navigation.getResolvedObjective();
    return { stage: resolved.stage, targetId: resolved.targetId };
  })()`);
  assert.deepEqual(parking, { stage: "reachParking", targetId: "parkingHoGuom" });

  const companion = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    state.vehicle.status = "stored"; state.vehicle.equipped = false;
    state.moCompanion.active = true; state.moCompanion.currentMap = "hoanKiem";
    navigation.clearTrackedObjective({ force: true, silent: true });
    navigation.updateTrackedObjective({ force: true });
    navigation.clearTrackedObjective({ silent: true });
    return navigation.getTrackedObjective()?.type;
  })()`);
  assert.equal(companion, "returnPoint");

  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await press("m", "KeyM");
  const mobileLayout = await evaluate(`(() => {
    const panel = document.querySelector("#mapPanel .map-panel");
    const overlay = document.getElementById("mapPanel");
    const rect = panel.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      open: !overlay.classList.contains("hidden"),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      contentOverflow: document.getElementById("mapContent").scrollHeight >= document.getElementById("mapContent").clientHeight
    };
  })()`);
  assert.equal(mobileLayout.open, true);
  assert.notEqual(mobileLayout.display, "none");
  assert.equal(mobileLayout.visibility, "visible");
  assert.notEqual(mobileLayout.opacity, "0");
  assert(mobileLayout.left >= 0 && mobileLayout.right <= mobileLayout.viewportWidth, "Bản đồ mobile không được tràn ngang");
  assert(mobileLayout.top >= 0 && mobileLayout.bottom <= mobileLayout.viewportHeight, "Bản đồ mobile không được tràn dọc viewport");
  const mobileMap = await screenshot("03-map-mobile");
  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ map, worldArrow, mobileMap, mobileLayout }, null, 2)}\n`);
  process.stdout.write("Navigation browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
