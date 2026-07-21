#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9900 + (process.pid % 80);
const outputDir = "/tmp/hanoi-dialogue-view-browser";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-dialogue-view-${process.pid}`, baseUrl
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
  await delay(190);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function prepareWorld({ mapId = "hoanKiem", hour = 10, weather = "clear" } = {}) {
  return evaluate(`(async () => {
    const { camera } = await import("./src/camera.js");
    const { player, state, runtime } = await import("./src/state.js");
    const { hydrateDialogueView, initDialogueView } = await import("./src/systems/dialogueView.js");
    const { closeAllOverlays } = await import("./src/systems/modal.js");
    const { isCutsceneActive, endCutscene } = await import("./src/systems/cutscene.js");
    if (isCutsceneActive()) endCutscene({ skipped: true });
    hydrateDialogueView();
    initDialogueView();
    closeAllOverlays();
    document.getElementById("characterModal").classList.add("hidden");
    state.profile.gender = "female";
    state.story.introCompleted = true;
    state.story.currentScene = "hanoi-tour";
    state.currentMapId = ${JSON.stringify(mapId)};
    state.gameTime.day = 2;
    state.gameTime.hour = ${hour};
    state.gameTime.minute = 15;
    state.gameTime.totalGameMinutes = 1440 + ${hour} * 60 + 15;
    state.gameTime.pauseReasons = [];
    state.gameTime.paused = false;
    state.weather.type = ${JSON.stringify(weather)};
    state.weather.intensity = ${weather === "heavyRain" ? 1 : 0};
    state.weather.surfaceWetness = ${weather === "heavyRain" ? 0.9 : 0};
    state.weather.startedAtGameMinute = state.gameTime.totalGameMinutes;
    state.weather.durationGameMinutes = 240;
    state.weather.nextWeatherType = ${JSON.stringify(weather)};
    state.weather.lastUpdatedAtGameMinute = state.gameTime.totalGameMinutes;
    state.vehicle.equipped = false;
    state.vehicle.status = state.vehicle.owned ? "stored" : "stored";
    runtime.nearbyInteractable = null;
    camera.x = 123;
    camera.y = 234;
    camera.lastMapId = state.currentMapId;
    if (state.currentMapId === "hoanKiem") {
      player.x = 123 + 640 - player.width / 2;
      player.y = 234 + 360 - player.height / 2;
      state.player.x = player.x;
      state.player.y = player.y;
    }
    return true;
  })()`);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(650);

  await prepareWorld({ mapId: "hoanKiem", hour: 20, weather: "clear" });
  const openedMo = await evaluate(`(async () => {
    const { camera } = await import("./src/camera.js");
    const { state } = await import("./src/state.js");
    const { enterNpcDialogue, getDialogueViewDebugState } = await import("./src/systems/dialogueView.js");
    window.__dialogueEffectCount = 0;
    const origin = { x: camera.x, y: camera.y };
    const opened = enterNpcDialogue({ id: "mo", name: "Mơ", x: 1200, y: 900 }, {
      text: "Bạn vẫn ổn chứ?",
      expression: "curious",
      choices: [
        { text: "Ta tin ngươi.", expression: "gentleSmile", response: { text: "Vậy mình sẽ đi cùng bạn.", expression: "gentleSmile" }, afterClose: () => { window.__dialogueEffectCount += 1; } },
        { text: "Ngươi đang giấu điều gì?", expression: "suspicious", response: { text: "Mình chỉ cần thêm thời gian.", expression: "worried" } }
      ]
    });
    return { opened, debug: getDialogueViewDebugState(), paused: [...state.gameTime.pauseReasons], origin };
  })()`);
  assert.equal(openedMo.opened, true);
  assert.equal(openedMo.debug.profileId, "mo");
  assert.equal(openedMo.debug.selectedIndex, -1, "Không được auto-select choice đầu tiên");
  assert.equal(openedMo.debug.uiHidden, false);
  assert.equal(openedMo.debug.uiHintVisible, true);
  assert(openedMo.paused.includes("cinematic-dialogue"));
  await delay(280);
  const moShot = await screenshot("01-mo-night-choice");
  await press("ArrowDown", "ArrowDown");
  const selectionBeforeHide = await evaluate(`(async () => (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState())()`);
  assert.equal(selectionBeforeHide.selectedIndex, 0);
  await press("Tab", "Tab");
  const hiddenState = await evaluate(`(async () => {
    const debug = (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState();
    return {
      ...debug,
      dialogueHidden: document.getElementById("cutsceneDialogue").classList.contains("hidden"),
      titleHidden: getComputedStyle(document.querySelector(".title-row")).display === "none",
      effectCount: window.__dialogueEffectCount
    };
  })()`);
  assert.equal(hiddenState.uiHidden, true);
  assert.equal(hiddenState.dialogueHidden, true);
  assert.equal(hiddenState.titleHidden, true, "Ẩn dialogue phải ẩn cả hướng dẫn phím chung");
  assert.equal(hiddenState.selectedIndex, 0, "Ẩn UI không được reset lựa chọn");
  await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
  const hiddenInputState = await evaluate(`(async () => {
    const debug = (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState();
    return { ...debug, effectCount: window.__dialogueEffectCount };
  })()`);
  assert.equal(hiddenInputState.lineIndex, 0, "Enter không được tiếp tục khi UI đang ẩn");
  assert.equal(hiddenInputState.selectedIndex, 0, "Phím chọn không được đổi lựa chọn khi UI đang ẩn");
  assert.equal(hiddenInputState.effectCount, 0);
  const hiddenShot = await screenshot("01b-mo-dialogue-hidden");
  await press("Tab", "Tab");
  const restoredUiState = await evaluate(`(async () => {
    const debug = (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState();
    const dialogue = document.getElementById("cutsceneDialogue");
    return {
      ...debug,
      dialogueHidden: dialogue.classList.contains("hidden"),
      selectedText: dialogue.querySelector("button.is-selected")?.textContent || ""
    };
  })()`);
  assert.equal(restoredUiState.uiHidden, false);
  assert.equal(restoredUiState.dialogueHidden, false);
  assert.equal(restoredUiState.selectedIndex, 0);
  assert.equal(restoredUiState.selectedText, "Ta tin ngươi.");
  await press("Enter", "Enter");
  const moResponse = await evaluate(`(async () => (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState())()`);
  assert.equal(moResponse.expression, "gentleSmile");
  assert.equal(moResponse.lineIndex, 1);
  await press("Enter", "Enter");
  await delay(280);
  const moClosed = await evaluate(`(async () => {
    const { camera } = await import("./src/camera.js");
    const { runtime, state } = await import("./src/state.js");
    return { active: Boolean(runtime.dialogueView?.active), cameraX: camera.x, cameraY: camera.y, pauses: state.gameTime.pauseReasons, effects: window.__dialogueEffectCount };
  })()`);
  assert.equal(moClosed.active, false);
  assert.equal(moClosed.cameraX, openedMo.origin.x);
  assert.equal(moClosed.cameraY, openedMo.origin.y);
  assert.equal(moClosed.pauses.includes("cinematic-dialogue"), false);
  assert.equal(moClosed.effects, 1, "Choice callback chỉ được chạy một lần");

  await prepareWorld({ mapId: "hoanKiem", hour: 20, weather: "heavyRain" });
  const teaProfile = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { handleNpc } = await import("./src/systems/interaction.js");
    const { getDialogueViewDebugState } = await import("./src/systems/dialogueView.js");
    handleNpc(maps.hoanKiem.npcs.find((npc) => npc.id === "teaSellerHoGuom"));
    return getDialogueViewDebugState();
  })()`);
  assert.equal(teaProfile.profileId, "teaSeller");
  await delay(280);
  const teaShot = await screenshot("02-tea-stall-heavy-rain");
  await press("Tab", "Tab");
  await press("Escape", "Escape");
  await delay(280);
  const escapedWhileHidden = await evaluate(`(async () => ({
    active: (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState().active,
    bodyHiddenClass: document.body.classList.contains("is-dialogue-view-ui-hidden")
  }))()`);
  assert.equal(escapedWhileHidden.active, false, "Esc phải đóng dialogue khi UI đang ẩn");
  assert.equal(escapedWhileHidden.bodyHiddenClass, false, "Đóng dialogue phải cleanup trạng thái ẩn UI");

  await prepareWorld({ mapId: "hoanKiem", hour: 10, weather: "clear" });
  const ridingGuard = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { player, runtime, state, ui } = await import("./src/state.js");
    const { interact } = await import("./src/systems/interaction.js");
    const npc = maps.hoanKiem.npcs.find((entry) => entry.id === "xeOmHoanKiem");
    player.x = npc.x - 3; player.y = npc.y - 8;
    state.player.x = player.x; state.player.y = player.y;
    state.vehicle.owned = true; state.vehicle.equipped = true; state.vehicle.status = "riding";
    interact();
    return { active: Boolean(runtime.dialogueView?.active), message: ui.dialogueText.textContent };
  })()`);
  assert.equal(ridingGuard.active, false);
  assert.equal(ridingGuard.message, "Hãy xuống xe để nói chuyện.");

  await prepareWorld({ mapId: "churchInterior", hour: 18, weather: "heavyRain" });
  const priest = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { getScheduledNpcsForMap, updateNpcSchedules } = await import("./src/systems/npcSchedule.js");
    const { handleScheduledNpc } = await import("./src/systems/interaction.js");
    const { getDialogueViewDebugState } = await import("./src/systems/dialogueView.js");
    updateNpcSchedules();
    const npc = getScheduledNpcsForMap(maps.churchInterior).find((entry) => entry.id === "chaXu");
    handleScheduledNpc(npc);
    return getDialogueViewDebugState();
  })()`);
  assert.equal(priest.profileId, "priest");
  assert.equal(priest.mapId, "churchInterior");
  await delay(280);
  const priestShot = await screenshot("03-priest-interior-rain-outside");
  await press("Escape", "Escape");
  await delay(280);

  await prepareWorld({ mapId: "hoanKiem", hour: 11, weather: "clear" });
  const branchingStart = await evaluate(`(async () => {
    const { branchingQuestActorsById } = await import("./src/data/branchingQuests.js");
    const { handleBranchingQuestActor } = await import("./src/systems/branchingQuest.js");
    const { state } = await import("./src/state.js");
    delete state.branchingQuestProgress.lostTourist;
    handleBranchingQuestActor(branchingQuestActorsById.lostTourist);
    return (await import("./src/systems/dialogueView.js")).getDialogueViewDebugState();
  })()`);
  assert.equal(branchingStart.profileId, "tourist");
  await delay(280);
  await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
  await delay(280);
  const branchingChoice = await evaluate(`(async () => (await import("./src/state.js")).state.branchingQuestProgress.lostTourist.choices)()`);
  assert.equal(branchingChoice.length, 1);

  await prepareWorld({ mapId: "hoanKiem", hour: 16, weather: "cloudy" });
  const reloadPrepared = await evaluate(`(async () => {
    const { enterNpcDialogue } = await import("./src/systems/dialogueView.js");
    const { saveGame } = await import("./src/storage.js");
    enterNpcDialogue("mo", { text: "Đây là kiểm tra reload.", expression: "worried" });
    saveGame();
    return true;
  })()`);
  assert.equal(reloadPrepared, true);
  await evaluate("location.reload()");
  await delay(900);
  const reloadState = await evaluate(`(async () => {
    const { camera } = await import("./src/camera.js");
    const { runtime, state } = await import("./src/state.js");
    return { active: Boolean(runtime.dialogueView?.active), paused: state.gameTime.pauseReasons.includes("cinematic-dialogue"), cameraFinite: Number.isFinite(camera.x) && Number.isFinite(camera.y) };
  })()`);
  assert.equal(reloadState.active, false);
  assert.equal(reloadState.paused, false);
  assert.equal(reloadState.cameraFinite, true);

  await prepareWorld({ mapId: "hoanKiem", hour: 17, weather: "cloudy" });
  const companionPause = await evaluate(`(async () => {
    const { runtime, state } = await import("./src/state.js");
    const { pauseGameClock } = await import("./src/systems/gameClock.js");
    const { enterNpcDialogue, updateDialogueView, handleDialogueViewKey } = await import("./src/systems/dialogueView.js");
    state.moCompanion.active = true;
    state.moCompanion.currentMap = "hoanKiem";
    state.moCompanion.followingPlayer = true;
    pauseGameClock("hanging-out-with-mo");
    enterNpcDialogue("mo", { text: "Mình vẫn đi cùng bạn.", expression: "gentleSmile" });
    updateDialogueView(performance.now() + 300);
    handleDialogueViewKey("enter");
    updateDialogueView(performance.now() + 600);
    return { active: Boolean(runtime.dialogueView?.active), reasons: [...state.gameTime.pauseReasons] };
  })()`);
  assert.equal(companionPause.active, false);
  assert.equal(companionPause.reasons.includes("cinematic-dialogue"), false);
  assert.equal(companionPause.reasons.includes("hanging-out-with-mo"), true, "Đóng dialogue không được gỡ pause reason của Mơ companion");

  const inactiveBudget = await evaluate(`(async () => {
    const { drawGame } = await import("./src/render/renderGame.js");
    const startedAt = performance.now();
    for (let frame = 0; frame < 120; frame += 1) drawGame();
    return performance.now() - startedAt;
  })()`);
  assert(inactiveBudget < 1900, `Renderer thường không được chậm rõ (${inactiveBudget.toFixed(1)}ms/120 frames)`);
  assert.equal(errors.length, 0, errors.join("\n"));

  process.stdout.write(JSON.stringify({
    ok: true,
    screenshots: [moShot, hiddenShot, teaShot, priestShot],
    inactiveRender120FramesMs: Math.round(inactiveBudget)
  }, null, 2) + "\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
