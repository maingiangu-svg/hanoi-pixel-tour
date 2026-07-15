#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9860 + (process.pid % 100);
const outputDir = "/tmp/hanoi-arrival";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-arrival-${process.pid}`, baseUrl
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
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result.value;
}

async function press(key, code = key, hold = 40) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await delay(hold);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await delay(185);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function getState() {
  return evaluate(`(async () => {
    const { player, runtime, state } = await import("./src/state.js");
    const { getCurrentMap } = await import("./src/utils/helpers.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const dialogue = runtime.cutscene?.dialogue;
    return {
      active: Boolean(runtime.cutscene?.active),
      cutsceneId: runtime.cutscene?.id || null,
      renderer: runtime.cutscene?.scene?.renderer || null,
      actorCount: runtime.cutscene?.scene?.entities?.filter((entity) => entity.kind !== "focus").length || 0,
      moCount: runtime.cutscene?.scene?.entities?.filter((entity) => entity.kind === "mo").length || 0,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      kind: dialogue?.kind || null,
      text: dialogue?.text || "",
      choices: dialogue?.choices?.length || 0,
      selectedIndex: dialogue?.selectedIndex ?? null,
      zoom: runtime.cutscene?.camera?.zoom || 1,
      suspicion: Boolean(runtime.cutscene?.suspicion?.active),
      scene: state.story.currentScene,
      chapter: state.story.currentChapter,
      introCompleted: state.story.introCompleted,
      originChoice: state.story.originChoice,
      scores: { ...state.story.scores },
      clues: [...state.story.memoryClues],
      unlockedMaps: [...state.story.unlockedMaps],
      checkpointScene: state.story.checkpoint?.sceneId || null,
      clockPaused: state.gameTime.paused,
      hudHidden: document.getElementById("gameFrame").classList.contains("is-cutscene"),
      hudObjective: document.getElementById("hudObjective")?.textContent || "",
      scheduledMoCount: getScheduledNpcsForMap(getCurrentMap()).filter((npc) => npc.id === "mo").length,
      player: { x: player.x, y: player.y }
    };
  })()`);
}

async function beginNewArrival({ reloadArrival = false } = {}) {
  await evaluate("localStorage.clear()");
  await send("Page.reload", { ignoreCache: true });
  await delay(650);
  await evaluate(`(async () => {
    const selection = await import("./src/systems/characterSelection.js");
    selection.selectCharacter(0);
    selection.confirmCharacterSelection();
  })()`);
  await delay(260);
  await press("Escape", "Escape");
  await delay(180);
  let current = await getState();
  assert.equal(current.cutsceneId, "hanoiArrival");
  assert.equal(current.actorCount, 5);
  assert.equal(current.moCount, 1);
  assert.equal(current.hudHidden, true);
  assert.equal(current.clockPaused, true);
  const blockedPosition = current.player;
  await press("d", "KeyD", 160);
  assert.deepEqual((await getState()).player, blockedPosition, "Player phải bị khóa trong arrival");
  if (reloadArrival) {
    await send("Page.reload", { ignoreCache: true });
    await delay(760);
    current = await getState();
    assert.equal(current.cutsceneId, "hanoiArrival", "Reload phải tiếp tục từ checkpoint arrival an toàn");
    assert.equal(current.actorCount, 5);
    assert.equal(current.moCount, 1);
  }
}

async function playOrigin(origin, choiceIndex, imagePrefix) {
  let choiceChecked = false;
  let suspicionChecked = false;
  let choiceImage = null;
  let suspicionImage = null;

  for (let attempt = 0; attempt < 180; attempt += 1) {
    const current = await getState();
    if (!current.active) break;
    if (current.choices) {
      if (!choiceChecked) {
        assert.equal(current.selectedIndex, -1, "Choice không được tự chọn mục đầu tiên");
        await press("Enter", "Enter");
        assert.equal((await getState()).selectedIndex, -1, "Enter không xác nhận khi chưa highlight");
        choiceImage = await screenshot(`${imagePrefix}-choice`);
        for (let index = 0; index <= choiceIndex; index += 1) await press("ArrowDown", "ArrowDown");
        await press("Enter", "Enter");
        const selected = await getState();
        assert.equal(selected.originChoice, origin);
        assert.equal(selected.checkpointScene, "hanoiArrival");
        choiceChecked = true;
      }
    } else if (current.waiting) {
      if (current.kind === "internal") {
        assert.equal(current.suspicion, true);
        assert(current.zoom >= 1.6, "Zoom Mơ phải đạt ít nhất 1.6x");
        if (!suspicionChecked) {
          suspicionImage = await screenshot(`${imagePrefix}-mo-suspicion`);
          suspicionChecked = true;
        }
      }
      await press("Enter", "Enter");
    } else {
      await delay(90);
    }
  }

  const completed = await getState();
  assert.equal(completed.active, false);
  assert.equal(completed.scene, "chapter-1");
  assert.equal(completed.chapter, 1);
  assert.equal(completed.introCompleted, true);
  assert.equal(completed.originChoice, origin);
  assert(completed.clues.includes("clue-instinctive-hoan-kiem-name"));
  assert.deepEqual(completed.unlockedMaps, ["hoanKiem"]);
  assert.equal(completed.hudHidden, false);
  assert.equal(completed.clockPaused, false);
  assert.equal(completed.actorCount, 0);
  assert(completed.scheduledMoCount <= 1, "Mơ gameplay không được nhân đôi");
  assert.equal(choiceChecked, true);
  assert.equal(suspicionChecked, true);

  const expectedScores = {
    return: { return: 2, belonging: 0, truth: 0, curiosity: 0 },
    stay: { return: 0, belonging: 2, truth: 0, curiosity: 0 },
    investigate: { return: 0, belonging: 0, truth: 2, curiosity: 1 }
  }[origin];
  const expectedObjective = "Đi theo Mơ và làm quen với cách di chuyển.";
  assert.equal(completed.hudObjective, expectedObjective);
  Object.entries(expectedScores).forEach(([key, value]) => assert.equal(completed.scores[key], value));

  const beforeMove = completed.player;
  await press("d", "KeyD", 180);
  const afterMove = (await getState()).player;
  assert(afterMove.x > beforeMove.x, "Player phải điều khiển được sau arrival");

  const lockedMap = await evaluate(`(async () => {
    const { travelToMap } = await import("./src/systems/interaction.js");
    const { state } = await import("./src/state.js");
    const result = travelToMap({ targetMap: "baDinh", targetX: 100, targetY: 100, kind: "exit" });
    return { result, mapId: state.currentMapId };
  })()`);
  assert.deepEqual(lockedMap, { result: false, mapId: "hoanKiem" });

  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  const reloaded = await getState();
  assert.equal(reloaded.active, false, "Intro không được replay sau khi hoàn thành");
  assert.equal(reloaded.originChoice, origin);
  assert.equal(reloaded.scene, "chapter-1");
  assert.equal(reloaded.scheduledMoCount <= 1, true);
  Object.entries(expectedScores).forEach(([key, value]) => assert.equal(reloaded.scores[key], value));
  return { choiceImage, suspicionImage };
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(650);

  await beginNewArrival({ reloadArrival: true });
  const returnRun = await playOrigin("return", 0, "01-return");
  await beginNewArrival();
  const stayRun = await playOrigin("stay", 1, "02-stay");
  await beginNewArrival();
  const investigateRun = await playOrigin("investigate", 2, "03-investigate");

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({ returnRun, stayRun, investigateRun }, null, 2)}\n`);
  process.stdout.write("Hanoi arrival browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
