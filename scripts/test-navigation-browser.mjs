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
  const initialGuidance = await evaluate(`(async () => {
    const { state, player, runtime } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    const modal = await import("./src/systems/modal.js");
    state.profile.gender = "female";
    state.currentMapId = "hoanKiem";
    state.navigation = { trackedObjective: null, showWorldGuidance: true };
    state.moCompanion.active = false;
    runtime.cutscene = null;
    runtime.dialogueView = null;
    document.getElementById("gameFrame").classList.remove("is-cutscene", "is-dialogue-view");
    document.getElementById("cutsceneDialogue").classList.add("hidden");
    state.vehicle = { owned: true, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null };
    player.x = 610; player.y = 1370;
    modal.closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    navigation.setTrackedObjective({ id: "browser-lake", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "walking" }, { silent: true });
    const guidance = (await import("./src/render/renderNavigation.js")).getDirectionalGuidanceState();
    return { routeLength: navigation.getCurrentRoute().length, guidance };
  })()`);
  assert(initialGuidance.routeLength >= 2);
  assert.equal(initialGuidance.guidance.showPlayerArrow, true);
  assert.equal(initialGuidance.guidance.showScreenArrow, true);

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
  const hudState = await evaluate(`({
    visible: !document.getElementById("hudObjectiveCard").classList.contains("hidden"),
    title: document.getElementById("hudQuestName").textContent,
    objective: document.getElementById("hudObjective").textContent,
    meta: document.getElementById("hudObjectiveMeta").textContent
  })`);
  assert.equal(hudState.visible, true);
  assert.equal(hudState.title, "Hồ Gươm");
  assert.match(hudState.objective, /Hồ Gươm/);
  assert.match(hudState.meta, /^\d+m$/);
  const worldArrow = await screenshot("02-world-guidance-light");

  const darkWorld = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const weather = await import("./src/systems/weather.js");
    state.gameTime.day = 1; state.gameTime.hour = 20; state.gameTime.minute = 15;
    state.gameTime.totalGameMinutes = 1215;
    weather.setWeatherForDebug("clear");
    return state.weather.type;
  })()`);
  assert.equal(darkWorld, "clear");
  await delay(180);
  const worldDark = await screenshot("03-world-guidance-night");

  const rainWorld = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const weather = await import("./src/systems/weather.js");
    state.gameTime.day = 1; state.gameTime.hour = 12; state.gameTime.minute = 10;
    state.gameTime.totalGameMinutes = 730;
    weather.setWeatherForDebug("heavyRain");
    return state.weather.type;
  })()`);
  assert.equal(rainWorld, "heavyRain");
  await delay(220);
  const worldRain = await screenshot("04-world-guidance-rain");

  const nearGuidance = await evaluate(`(async () => {
    const { player } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    const { snapCameraToPlayer } = await import("./src/camera.js");
    const target = navigation.getResolvedObjective();
    player.x = target.x - player.width / 2 - 60;
    player.y = target.y - player.height / 2;
    snapCameraToPlayer();
    navigation.updateTrackedObjective({ force: true });
    return (await import("./src/render/renderNavigation.js")).getDirectionalGuidanceState();
  })()`);
  assert.equal(nearGuidance.reached, false);
  assert.equal(nearGuidance.showPlayerArrow, true);
  assert.equal(nearGuidance.showScreenArrow, false);
  await delay(180);
  const worldNear = await screenshot("05-world-guidance-near");

  const arrivedGuidance = await evaluate(`(async () => {
    const { player } = await import("./src/state.js");
    const navigation = await import("./src/systems/navigation.js");
    const { snapCameraToPlayer } = await import("./src/camera.js");
    const interaction = await import("./src/systems/interaction.js");
    const target = navigation.getResolvedObjective();
    player.x = target.x - player.width / 2;
    player.y = target.y - player.height / 2;
    snapCameraToPlayer();
    navigation.updateTrackedObjective({ force: true });
    interaction.updateNearbyInteractable();
    const guidance = (await import("./src/render/renderNavigation.js")).getDirectionalGuidanceState();
    return {
      guidance,
      promptVisible: !document.getElementById("nearbyHint").classList.contains("hidden"),
      prompt: document.getElementById("nearbyHint").textContent
    };
  })()`);
  assert.equal(arrivedGuidance.guidance.reached, true);
  assert.equal(arrivedGuidance.guidance.showPlayerArrow, false);
  assert.equal(arrivedGuidance.guidance.showScreenArrow, false);
  assert.equal(arrivedGuidance.promptVisible, true);
  assert.match(arrivedGuidance.prompt, /E/);
  await delay(120);
  const worldArrived = await screenshot("06-world-guidance-arrived");

  const notificationState = await evaluate(`(async () => {
    const { state, player } = await import("./src/state.js");
    const branching = await import("./src/systems/branchingQuest.js");
    const navigation = await import("./src/systems/navigation.js");
    const { snapCameraToPlayer } = await import("./src/camera.js");
    player.x = 610; player.y = 1370;
    snapCameraToPlayer();
    const beforeMoney = state.money;
    branching.startBranchingQuest("lostTourist");
    branching.chooseQuestOption("lostTourist", "escort");
    navigation.trackBranchingQuest("lostTourist");
    const markerBefore = Boolean(navigation.getResolvedObjective());
    const routeBefore = navigation.getCurrentRoute().length;
    const first = branching.completeQuestBranch("lostTourist", "excellent");
    const duplicate = branching.completeQuestBranch("lostTourist", "excellent");
    return {
      first,
      duplicate,
      active: Boolean(document.getElementById("dialogueBox").classList.contains("is-quest-complete")),
      title: document.getElementById("questCompletionName").textContent,
      rewards: document.getElementById("questCompletionRewards").textContent,
      next: document.getElementById("questCompletionNext").textContent,
      markerBefore,
      routeBefore,
      markerAfter: navigation.getResolvedObjective(),
      routeAfter: navigation.getCurrentRoute().length,
      guidanceAfter: (await import("./src/render/renderNavigation.js")).getDirectionalGuidanceState(),
      reward: state.money - beforeMoney
    };
  })()`);
  assert.equal(notificationState.first, true);
  assert.equal(notificationState.duplicate, false);
  assert.equal(notificationState.active, true);
  assert.equal(notificationState.title, "Du khách bị lạc");
  assert.match(notificationState.rewards, /25\.000đ/);
  assert.match(notificationState.next, /Sổ nhiệm vụ/);
  assert.equal(notificationState.markerBefore, true);
  assert(notificationState.routeBefore >= 2);
  assert.equal(notificationState.markerAfter, null);
  assert.equal(notificationState.routeAfter, 0);
  assert.equal(notificationState.guidanceAfter.visible, false);
  assert.equal(notificationState.reward, 25000);
  await delay(240);
  const questFeedback = await screenshot("07-quest-completion");
  const playerBeforeNotificationClick = await evaluate(`(async () => { const { player } = await import("./src/state.js"); return { x: player.x, y: player.y }; })()`);
  await evaluate(`document.getElementById("dialogueBox").click()`);
  await delay(220);
  assert.equal(await evaluate(`document.getElementById("dialogueBox").classList.contains("hidden")`), true);
  const playerAfterNotificationClick = await evaluate(`(async () => { const { player } = await import("./src/state.js"); return { x: player.x, y: player.y }; })()`);
  assert.deepEqual(playerAfterNotificationClick, playerBeforeNotificationClick, "Click notification không được truyền xuống world");

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
  const mobileMap = await screenshot("08-map-mobile");
  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({
    map,
    worldArrow,
    worldDark,
    worldRain,
    worldNear,
    worldArrived,
    questFeedback,
    mobileMap,
    mobileLayout,
    hudState,
    initialGuidance,
    nearGuidance,
    arrivedGuidance,
    notificationState
  }, null, 2)}\n`);
  process.stdout.write("Navigation browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
