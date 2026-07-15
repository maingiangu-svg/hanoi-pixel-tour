#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9850 + (process.pid % 120);
const outputDir = "/tmp/hanoi-story-cutscene";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-story-cutscene-${process.pid}`, baseUrl
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
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      errors.push(message.params.entry.text);
    }
  });
}

function send(method, params = {}) {
  const id = ++requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}

async function press(key, code = key, hold = 45) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await delay(hold);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await delay(180);
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
  await delay(650);

  const freshStory = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    return { story: state.story, characterOpen: !document.getElementById("characterModal").classList.contains("hidden") };
  })()`);
  assert.equal(freshStory.story.version, 2);
  assert.equal(freshStory.story.introCompleted, false);
  assert.equal(freshStory.story.currentScene, "gender-selection");
  assert.equal(freshStory.characterOpen, true);

  const migration = await evaluate(`(async () => {
    const { normalizeState } = await import("./src/storage.js");
    const { maps } = await import("./src/data/maps.js");
    const migrated = normalizeState({
      currentMapId: "baDinh", profile: { gender: "male" }, money: 76543,
      visitedMaps: ["hoanKiem", "baDinh"], inventory: { foods: ["phoHaNoi"], stamps: [], souvenirs: [], specialItems: [] }
    });
    return { story: migrated.story, money: migrated.money, gender: migrated.profile.gender, mapCount: Object.keys(maps).length };
  })()`);
  assert.equal(migration.story.introCompleted, true);
  assert.equal(migration.story.unlockedMaps.length, migration.mapCount);
  assert.equal(migration.money, 76543);
  assert.equal(migration.gender, "male");

  const partialLegacyMigration = await evaluate(`(async () => {
    const { normalizeState } = await import("./src/storage.js");
    const { maps } = await import("./src/data/maps.js");
    const migrated = normalizeState({
      currentMapId: "longBien",
      profile: { gender: "female" },
      visitedMaps: ["hoanKiem", "longBien"],
      story: { version: 1, currentScene: "legacy-tour", flags: { oldFlag: true } }
    });
    return {
      introCompleted: migrated.story.introCompleted,
      scene: migrated.story.currentScene,
      unlockedMaps: migrated.story.unlockedMaps.length,
      mapCount: Object.keys(maps).length,
      oldFlag: migrated.story.flags.oldFlag
    };
  })()`);
  assert.deepEqual(partialLegacyMigration, {
    introCompleted: true,
    scene: "legacy-tour",
    unlockedMaps: migration.mapCount,
    mapCount: migration.mapCount,
    oldFlag: true
  });

  await evaluate(`(async () => {
    const { state, player } = await import("./src/state.js");
    const character = await import("./src/systems/characterSelection.js");
    const schedule = await import("./src/systems/npcSchedule.js");
    state.currentMapId = "hoanKiem";
    state.story.introCompleted = true;
    state.story.currentScene = "hanoi-tour";
    state.gameTime.hour = 10; state.gameTime.minute = 0; state.gameTime.totalGameMinutes = 600;
    player.x = 1600; player.y = 900;
    character.selectCharacter(1);
    character.confirmCharacterSelection();
    schedule.updateNpcSchedules();
  })()`);

  const suspicionStarted = await evaluate(`(async () => {
    const cutscene = await import("./src/systems/cutscene.js");
    return cutscene.playMoSuspicionCutscene({
      clueId: "browser-suspicion", zoom: 1.8, holdMs: 320,
      thoughtLines: ["Có điều gì đó không khớp...", "Mình cần quan sát kỹ hơn."]
    });
  })()`);
  assert.equal(suspicionStarted, true);
  await delay(950);
  const suspicionState = await evaluate(`(async () => {
    const { player, runtime } = await import("./src/state.js");
    return {
      active: runtime.cutscene?.active,
      kind: runtime.cutscene?.dialogue?.kind,
      zoom: runtime.cutscene?.camera?.zoom,
      hudHidden: document.querySelector(".game-frame").classList.contains("is-cutscene"),
      player: { x: player.x, y: player.y }
    };
  })()`);
  assert.equal(suspicionState.active, true);
  assert.equal(suspicionState.kind, "internal");
  assert(suspicionState.zoom >= 1.6);
  assert.equal(suspicionState.hudHidden, true);
  assert.equal(await evaluate(`(async () => (await import("./src/systems/audioManager.js")).getAudioRuntimeStateForDebug().cutsceneDuck)()`), 0.2);
  const suspicionImage = await screenshot("01-mo-suspicion");
  const activeBuffers = await evaluate(`(async () => (await import("./src/render/renderCutscene.js")).getCutsceneRenderBufferStateForDebug())()`);
  assert.equal(activeBuffers.hasSnapshot, true);
  assert.equal(activeBuffers.hasPixelBuffer, true);
  await press("d", "KeyD", 180);
  const playerAfterBlockedMove = await evaluate(`(async () => { const { player } = await import("./src/state.js"); return { x: player.x, y: player.y }; })()`);
  assert.deepEqual(playerAfterBlockedMove, suspicionState.player);
  await press("Enter", "Enter");
  await press("Enter", "Enter");
  await delay(1450);
  const suspicionEnded = await evaluate(`(async () => {
    const { runtime, state } = await import("./src/state.js");
    return {
      active: Boolean(runtime.cutscene?.active),
      clue: state.story.memoryClues.includes("browser-suspicion"),
      hudRestored: !document.querySelector(".game-frame").classList.contains("is-cutscene")
    };
  })()`);
  assert.deepEqual(suspicionEnded, { active: false, clue: true, hudRestored: true });
  assert.equal(await evaluate(`(async () => (await import("./src/systems/audioManager.js")).getAudioRuntimeStateForDebug().cutsceneDuck)()`), 1);
  assert.deepEqual(
    await evaluate(`(async () => (await import("./src/render/renderCutscene.js")).getCutsceneRenderBufferStateForDebug())()`),
    { hasSnapshot: false, hasPixelBuffer: false, capturedCutsceneId: null }
  );

  await evaluate(`(async () => {
    const cutscene = await import("./src/systems/cutscene.js");
    cutscene.registerCutscene("browser-choice", { timeline: [
      { type: "dialogue", kind: "narration", text: "Một lựa chọn xuất hiện." },
      { type: "dialogue", kind: "speech", speaker: "Người thử", text: "Bạn chọn gì?", choices: [
        { id: "wait", text: "Chờ thêm", choiceKey: "browser-choice", value: "wait" },
        { id: "continue", text: "Tiếp tục", choiceKey: "browser-choice", value: "continue" }
      ] }
    ] });
    cutscene.startCutscene("browser-choice");
  })()`);
  await delay(220);
  await press("Enter", "Enter");
  const unselectedChoice = await evaluate(`(async () => { const { runtime } = await import("./src/state.js"); return runtime.cutscene.dialogue.selectedIndex; })()`);
  assert.equal(unselectedChoice, -1);
  await press("Enter", "Enter");
  assert.equal(await evaluate(`(async () => Boolean((await import("./src/state.js")).runtime.cutscene?.active))()`), true);
  await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
  assert.equal(await evaluate(`(async () => Boolean((await import("./src/state.js")).runtime.cutscene?.active))()`), false);

  await evaluate(`window.startCutsceneForDebug("debug-cutscene")`);
  await delay(620);
  const checkpointBeforeReload = await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    return state.story.checkpoint;
  })()`);
  assert.equal(checkpointBeforeReload.checkpointId, "foundation-focus");
  assert.equal(checkpointBeforeReload.sceneState.checkpointMarker, "restored");
  assert(checkpointBeforeReload.visualState.letterbox > 0.95);
  assert(checkpointBeforeReload.cameraState.zoom >= 1.3);
  await send("Page.reload", { ignoreCache: true });
  await delay(900);
  const resumed = await evaluate(`(async () => {
    const { runtime } = await import("./src/state.js");
    return {
      active: Boolean(runtime.cutscene?.active),
      kind: runtime.cutscene?.dialogue?.kind,
      marker: runtime.cutscene?.scene?.state?.checkpointMarker,
      letterbox: runtime.cutscene?.visual?.letterbox,
      zoom: runtime.cutscene?.camera?.zoom
    };
  })()`);
  assert.equal(resumed.active, true);
  assert.equal(resumed.kind, "narration");
  assert.equal(resumed.marker, "restored");
  assert(resumed.letterbox > 0.95);
  assert(resumed.zoom >= 1.3);
  await press("Enter", "Enter");
  await delay(900);
  assert.equal(await evaluate(`(async () => Boolean((await import("./src/state.js")).runtime.cutscene?.active))()`), false);

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ suspicionImage, migration, resumed }, null, 2)}\n`);
  process.stdout.write("Story/cutscene browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
