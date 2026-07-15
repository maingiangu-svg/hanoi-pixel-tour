#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 9720 + (process.pid % 120);
const outputDir = "/tmp/hanoi-immortal-intro";
mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-immortal-intro-${process.pid}`, baseUrl
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
  await delay(180);
}

async function screenshot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const path = `${outputDir}/${name}.png`;
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}

async function getIntroState() {
  return evaluate(`(async () => {
    const { player, runtime, state } = await import("./src/state.js");
    return {
      gender: state.profile.gender,
      scene: state.story.currentScene,
      introCompleted: state.story.introCompleted,
      checkpointScene: state.story.checkpoint?.sceneId || null,
      cutsceneId: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      action: runtime.cutscene?.scene?.state?.action || null,
      shot: runtime.cutscene?.scene?.state?.shot || null,
      disciplesSafe: Boolean(runtime.cutscene?.scene?.state?.disciplesSafe),
      playerStruck: Boolean(runtime.cutscene?.scene?.state?.playerStruck),
      portal: Number(runtime.cutscene?.scene?.state?.portal || 0),
      mapId: state.currentMapId,
      clues: [...state.story.memoryClues],
      clockPaused: Boolean(state.gameTime.paused),
      player: { x: player.x, y: player.y },
      hudHidden: document.getElementById("gameFrame").classList.contains("is-cutscene"),
      introShell: document.body.classList.contains("is-immortal-intro"),
      cutsceneUiCount: document.querySelectorAll("#cutsceneDialogue").length
    };
  })()`);
}

async function measureFrameRate(sampleMs = 900) {
  return evaluate(`new Promise((resolve) => {
    const startedAt = performance.now();
    let frames = 0;
    const sample = (now) => {
      frames += 1;
      if (now - startedAt >= ${sampleMs}) {
        resolve(Math.round((frames * 1000) / Math.max(1, now - startedAt)));
        return;
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  })`);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(650);

  assert.equal(await evaluate(`!document.getElementById("characterModal").classList.contains("hidden")`), true);
  await evaluate(`(async () => {
    const selection = await import("./src/systems/characterSelection.js");
    selection.selectCharacter(0);
    selection.confirmCharacterSelection();
  })()`);
  await delay(320);
  let stateNow = await getIntroState();
  assert.equal(stateNow.gender, "male");
  assert.equal(stateNow.scene, "immortalIntro");
  assert.equal(stateNow.cutsceneId, "immortalIntro");
  assert.equal(stateNow.introCompleted, false);
  assert.equal(stateNow.clockPaused, true);
  assert.equal(stateNow.hudHidden, true);
  assert.equal(stateNow.introShell, true);
  const maleOpening = await screenshot("01-male-opening");
  const sampledFps = await measureFrameRate();
  assert(sampledFps >= 35, `Intro renderer quá chậm trong smoke test: ${sampledFps} FPS`);

  await send("Page.reload", { ignoreCache: true });
  await delay(850);
  stateNow = await getIntroState();
  assert.equal(stateNow.cutsceneId, "immortalIntro", "Reload phải bắt đầu lại intro tại checkpoint an toàn");
  assert.equal(stateNow.gender, "male");
  assert.equal(stateNow.introShell, true);

  let rescueImage = null;
  let strikeImage = null;
  let portalImage = null;
  const observedActions = [];
  for (let attempt = 0; attempt < 240; attempt += 1) {
    stateNow = await getIntroState();
    if (stateNow.cutsceneId === "hanoiArrival") break;
    if (stateNow.action === "treeFall") throw new Error("Intro không được quay lại staging cây đổ");
    if (stateNow.action && observedActions.at(-1) !== stateNow.action) observedActions.push(stateNow.action);
    if (!rescueImage && stateNow.action === "shield") {
      assert.equal(stateNow.disciplesSafe, true, "Đệ tử phải an toàn trước cú sét");
      assert.equal(stateNow.playerStruck, false, "Player chưa được trúng sét trong shot che chắn");
      rescueImage = await screenshot("02-disciples-rescued");
    }
    if (!strikeImage && stateNow.action === "directStrike") {
      assert.equal(stateNow.disciplesSafe, true, "Cú sét chỉ được xảy ra sau khi cứu đệ tử");
      assert.equal(stateNow.playerStruck, true, "directStrike phải đánh dấu player bị sét đánh");
      await delay(90);
      strikeImage = await screenshot("03-direct-lightning-strike");
    }
    if (!portalImage && stateNow.action === "portalOpen") {
      assert.equal(stateNow.playerStruck, true, "Portal phải mở sau cú sét trực tiếp");
      assert(stateNow.portal > 0, "Portal phải có cường độ mở dương");
      portalImage = await screenshot("04-spirit-rift");
    }
    if (stateNow.waiting) await press("Enter", "Enter");
    else await delay(55);
  }

  await delay(850);
  const arrival = await getIntroState();
  assert.equal(arrival.cutsceneId, "hanoiArrival");
  assert.equal(arrival.scene, "hanoiArrival");
  assert.equal(arrival.mapId, "hoanKiem");
  assert.equal(arrival.introCompleted, false);
  assert.equal(arrival.checkpointScene, "hanoiArrival");
  assert.equal(arrival.clockPaused, true);
  assert.equal(arrival.hudHidden, true);
  assert.equal(arrival.introShell, false, "Chrome riêng của immortalIntro phải được cleanup khi sang Hà Nội");
  assert.equal(arrival.cutsceneUiCount, 1);
  ["intro-bridge-flash", "intro-church-bell", "intro-turtle-pendant"].forEach((clue) => {
    assert(arrival.clues.includes(clue), `Thiếu clue ${clue}`);
  });
  const arrivalImage = await screenshot("05-hanoi-arrival-hold");
  await press("d", "KeyD", 180);
  assert.deepEqual((await getIntroState()).player, arrival.player, "Player chưa được điều khiển tại hanoiArrival");

  await evaluate(`localStorage.clear()`);
  await send("Page.reload", { ignoreCache: true });
  await delay(650);
  await evaluate(`(async () => {
    const selection = await import("./src/systems/characterSelection.js");
    selection.selectCharacter(1);
    selection.confirmCharacterSelection();
  })()`);
  await delay(320);
  const femaleIntro = await getIntroState();
  assert.equal(femaleIntro.gender, "female");
  assert.equal(femaleIntro.cutsceneId, "immortalIntro");
  const femaleOpening = await screenshot("06-female-opening");
  await press("Escape", "Escape");
  await delay(900);
  const skipped = await getIntroState();
  assert.equal(skipped.cutsceneId, "hanoiArrival");
  assert.equal(skipped.gender, "female");
  assert.equal(skipped.introCompleted, false);
  assert.equal(skipped.clues.filter((clue) => clue.startsWith("intro-")).length, 3);

  await evaluate(`localStorage.clear()`);
  await send("Page.reload", { ignoreCache: true });
  await delay(650);
  await evaluate(`(async () => {
    const selection = await import("./src/systems/characterSelection.js");
    selection.selectCharacter(1);
    selection.confirmCharacterSelection();
  })()`);
  await delay(320);
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const femaleState = await getIntroState();
    if (femaleState.cutsceneId === "hanoiArrival") break;
    if (femaleState.waiting) await press("Enter", "Enter");
    else await delay(55);
  }
  const femaleArrival = await getIntroState();
  assert.equal(femaleArrival.gender, "female");
  assert.equal(femaleArrival.cutsceneId, "hanoiArrival", "Flow Nữ phải đi trọn intro tới Hà Nội");
  assert.equal(femaleArrival.introShell, false);
  assert.equal(femaleArrival.clues.filter((clue) => clue.startsWith("intro-")).length, 3);

  await evaluate(`localStorage.setItem("hanoiPixelTourSaveV2", JSON.stringify({
    currentMapId: "baDinh", profile: { gender: "male" }, money: 88888,
    visitedMaps: ["hoanKiem", "baDinh"], inventory: { foods: [], stamps: [], souvenirs: [], specialItems: [] }
  }))`);
  await send("Page.reload", { ignoreCache: true });
  await delay(800);
  const legacy = await getIntroState();
  assert.equal(legacy.introCompleted, true);
  assert.equal(legacy.cutsceneId, null);
  assert.equal(legacy.mapId, "baDinh");

  assert(rescueImage, "Không chụp được shot player che chắn sau khi cứu đệ tử");
  assert(strikeImage, "Không chụp được cú sét đánh trực tiếp vào player");
  assert(portalImage, "Không chụp được khe nứt linh khí");
  const shieldIndex = observedActions.indexOf("shield");
  const strikeIndex = observedActions.indexOf("directStrike");
  const portalIndex = observedActions.indexOf("portalOpen");
  assert(shieldIndex >= 0 && strikeIndex > shieldIndex, "Thứ tự staging phải là cứu đệ tử rồi mới trúng sét");
  assert(portalIndex > strikeIndex, "Khe nứt phải mở sau cú sét");
  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({
    maleOpening,
    rescueImage,
    strikeImage,
    portalImage,
    arrivalImage,
    femaleOpening,
    femaleArrival: { scene: femaleArrival.scene, cutsceneId: femaleArrival.cutsceneId },
    sampledFps,
    observedActions,
    legacy
  }, null, 2)}\n`);
  process.stdout.write("Immortal intro browser smoke: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
