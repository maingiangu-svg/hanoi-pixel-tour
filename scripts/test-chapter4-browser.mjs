#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 11100 + (process.pid % 300);
const screenshotDir = "/tmp/hanoi-chapter4";
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-chapter4-${process.pid}`, baseUrl
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

async function press(key, code = key) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key, code });
  await delay(35);
  await send("Input.dispatchKeyEvent", { type: "keyUp", key, code });
  await delay(185);
}

async function getState() {
  return evaluate(`(async () => {
    const { runtime, state } = await import("./src/state.js");
    const { maps } = await import("./src/data/maps.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const chapter = await import("./src/systems/chapter4.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const story = getStoryState();
    const sceneState = runtime.cutscene?.scene?.renderer === "chapter4Reveal" ? runtime.cutscene.scene.state : null;
    return {
      scene: story.currentScene,
      chapter: story.currentChapter,
      objective: chapter.getChapter4Objective(),
      prerequisites: chapter.getChapter4PrerequisiteStatus(),
      progress: story.flags.chapter4 ? { ...chapter.getChapter4Progress() } : null,
      cutsceneId: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      kind: runtime.cutscene?.dialogue?.kind || null,
      text: runtime.cutscene?.dialogue?.text || "",
      suspicion: Boolean(runtime.cutscene?.suspicion?.active),
      zoom: runtime.cutscene?.camera?.zoom || 1,
      view: sceneState?.view || null,
      flash: sceneState?.flash || null,
      storm: sceneState?.storm || 0,
      portal: sceneState?.portal || 0,
      checkpoint: story.checkpoint ? { ...story.checkpoint } : null,
      flags: { ...story.flags },
      marks: [...story.historyMarks],
      memories: [...story.humanMemories],
      clues: [...story.memoryClues],
      weather: JSON.parse(JSON.stringify(state.weather)),
      moCount: getScheduledNpcsForMap(maps.longBien).filter((npc) => npc.id === "mo").length,
      mapId: state.currentMapId
    };
  })()`);
}

async function setupChapter4() {
  await evaluate("localStorage.clear()");
  await send("Page.reload", { ignoreCache: true });
  await delay(780);
  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const { closeCharacterSelection } = await import("./src/systems/characterSelection.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const chapter = await import("./src/systems/chapter4.js");
    const { updateNpcSchedules } = await import("./src/systems/npcSchedule.js");
    state.profile.gender = "female";
    closeCharacterSelection();
    state.currentMapId = "longBien";
    player.x = 1878;
    player.y = 578;
    state.player.x = player.x;
    state.player.y = player.y;
    state.gameTime.day = 2;
    state.gameTime.hour = 19;
    state.gameTime.minute = 12;
    state.gameTime.totalGameMinutes = 2592;
    state.weather.type = "cloudy";
    state.weather.intensity = 0;
    state.weather.startedAtGameMinute = 2500;
    state.weather.durationGameMinutes = 300;
    state.weather.nextWeatherType = "drizzle";
    state.weather.surfaceWetness = 0.27;
    state.weather.lastUpdatedAtGameMinute = 2592;
    const story = getStoryState();
    story.introCompleted = true;
    story.currentChapter = 4;
    story.currentScene = "chapter-4";
    story.completedChapters = ["1", "2", "3"];
    story.flags.chapter1Completed = true;
    story.flags.chapter2Completed = true;
    story.flags.chapter3Completed = true;
    story.flags["mo-knows-player-origin"] = true;
    story.unlockedMaps = ["hoanKiem", "churchInterior", "baDinh", "longBien"];
    chapter.startChapter4({ reset: true });
    updateNpcSchedules();
    chapter.updateChapter4();
  })()`);
  await delay(260);
}

async function handleReveal() {
  return evaluate(`(async () => {
    const chapter = await import("./src/systems/chapter4.js");
    return chapter.handleChapter4Interaction(chapter.getChapter4RevealPoint());
  })()`);
}

async function waitForCutscene(id) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const current = await getState();
    if (current.cutsceneId === id) return current;
    await delay(50);
  }
  assert.fail(`Cutscene ${id} did not start`);
}

async function advanceUntilText(expectedText) {
  const observed = createObserved();
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const current = await getState();
    observe(current, observed);
    if (current.waiting && current.text === expectedText) return observed;
    if (current.waiting) await press("Enter", "Enter");
    else await delay(60);
  }
  assert.fail(`Dialogue was not reached: ${expectedText}`);
}

async function drainReveal() {
  const observed = createObserved();
  let screenshotSaved = false;
  let finalLineAt = 0;
  let silenceObserved = 0;
  for (let attempt = 0; attempt < 720; attempt += 1) {
    const current = await getState();
    if (current.cutsceneId !== "chapter4-origin-reveal") break;
    observe(current, observed);
    if (current.text === "Bạn chỉ mất cả một đời để tìm đường trở về.") finalLineAt = performance.now();
    if (!current.waiting && finalLineAt) silenceObserved = Math.max(silenceObserved, performance.now() - finalLineAt);
    if (current.suspicion && current.waiting && !screenshotSaved) {
      assert(current.zoom >= 1.6, "Cảnh Mơ phải zoom cận ít nhất 1.6x");
      const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(screenshotDir, { recursive: true });
      await writeFile(`${screenshotDir}/chapter4-mo-final-suspicion.png`, Buffer.from(capture.data, "base64"));
      screenshotSaved = true;
    }
    if (current.waiting) await press("Enter", "Enter");
    else await delay(65);
  }
  observed.silenceObserved = silenceObserved;
  observed.screenshotSaved = screenshotSaved;
  return observed;
}

function createObserved() {
  return {
    views: new Set(),
    flashes: new Set(),
    internal: new Set(),
    narration: new Set(),
    speech: new Set(),
    suspicion: false,
    storm: false,
    portal: false
  };
}

function observe(current, observed) {
  if (current.view) observed.views.add(current.view);
  if (current.flash) observed.flashes.add(current.flash);
  if (current.kind === "internal" && current.text) observed.internal.add(current.text);
  if (current.kind === "narration" && current.text) observed.narration.add(current.text);
  if (current.kind === "speech" && current.text) observed.speech.add(current.text);
  observed.suspicion ||= current.suspicion;
  observed.storm ||= current.storm >= 0.6;
  observed.portal ||= current.portal >= 0.7;
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(700);

  await setupChapter4();
  let current = await getState();
  assert.equal(current.prerequisites.ready, true);
  assert.equal(current.moCount, 1, "Chapter 4 chỉ được có một Mơ tại Long Biên");
  let originalWeather = current.weather;

  await evaluate(`(async () => {
    const { getStoryState } = await import("./src/systems/storyState.js");
    const story = getStoryState();
    story.memoryClues = story.memoryClues.filter((id) => id !== "clue-childhood-song");
  })()`);
  assert.equal(await handleReveal(), true);
  current = await getState();
  assert.equal(current.cutsceneId, null, "Thiếu clue không được bắt đầu reveal");
  assert.equal(current.prerequisites.ready, false);
  assert.equal(current.prerequisites.missing[0].id, "clue-childhood-song");
  assert.match(current.objective, /bài hát tuổi thơ/i);

  const recovery = await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const chapter = await import("./src/systems/chapter4.js");
    state.currentMapId = "hoanKiem";
    player.x = 900;
    player.y = 1090;
    const interaction = chapter.getChapter4Interactables("hoanKiem")[0];
    const handled = chapter.handleChapter4Interaction(interaction.source);
    state.currentMapId = "longBien";
    player.x = 1878;
    player.y = 578;
    state.player.x = player.x;
    state.player.y = player.y;
    chapter.updateChapter4();
    return { handled, id: interaction.source.recoveryId };
  })()`);
  assert.deepEqual(recovery, { handled: true, id: "clue-childhood-song" });
  assert.equal((await getState()).prerequisites.ready, true, "Objective cũ phải phục hồi được clue còn thiếu");
  assert.equal(await handleReveal(), true);
  await waitForCutscene("chapter4-origin-reveal");
  originalWeather = (await getState()).weather;
  const beforeReload = await advanceUntilText("Đứa trẻ này…");
  assert(beforeReload.views.has("old-photo"));
  assert(beforeReload.views.has("pendant-compare"));

  await send("Page.reload", { ignoreCache: true });
  await delay(900);
  current = await getState();
  assert.equal(current.cutsceneId, "chapter4-origin-reveal", "Reload phải phục hồi reveal từ checkpoint an toàn");
  assert.equal(current.moCount, 1, "Reload giữa cinematic không được nhân đôi Mơ");

  const observed = await drainReveal();
  current = await getState();
  const requiredFlashes = [
    "childhood-hanoi", "bridge-storm", "child-rift", "broken-pendant", "worlds-time",
    "elder-immortal", "tree-seed", "tree-return", "disciples-safe", "young-restored"
  ];
  requiredFlashes.forEach((flash) => assert(observed.flashes.has(flash), `Thiếu flashback ${flash}`));
  [
    "Nếu nói ra, người ấy có thể sẽ rời đi.",
    "Nhưng giữ im lặng còn tàn nhẫn hơn.",
    "Bạn không phải người lạ.",
    "Bạn là người đã trở về."
  ].forEach((line) => assert(observed.internal.has(line), `Thiếu độc thoại Mơ: ${line}`));
  assert(observed.suspicion, "Phải kích hoạt cinematic zoom Mơ");
  assert(observed.storm, "Phải có giông cinematic");
  assert(observed.portal, "Portal phải mở trong cinematic");
  assert(observed.speech.has("Ta không xuyên không tới nơi này…"));
  assert(observed.speech.has("Bạn chỉ mất cả một đời để tìm đường trở về."));
  assert(observed.narration.has("Dị giới không phải quê hương của người."));
  assert(observed.narration.has("Nó mới là thế giới xa lạ."));
  assert(observed.narration.has("Hà Nội là nơi người đã bị lấy mất."));
  assert(observed.silenceObserved >= 1500, "Câu chốt cần có khoảng lặng rõ ràng");
  assert(observed.screenshotSaved);

  assert.equal(current.scene, "final-choice");
  assert.equal(current.chapter, 4);
  assert.equal(current.flags.originRevealed, true);
  assert.equal(current.progress.completed, true);
  assert.equal(current.progress.portalOpen, true);
  assert.equal(current.checkpoint?.cutsceneId, "story-final-choice", "Final choice phải bắt đầu ngay sau reveal");
  assert.equal(current.checkpoint?.sceneId, "final-choice");
  assert.equal(current.moCount, 1);
  assert.equal(current.weather.type, originalWeather.type, "Cinematic không được thay weather type thật");
  assert.equal(current.weather.startedAtGameMinute, originalWeather.startedAtGameMinute);
  assert.equal(current.weather.durationGameMinutes, originalWeather.durationGameMinutes);
  assert.equal(current.weather.nextWeatherType, originalWeather.nextWeatherType);
  assert(
    Math.abs(current.weather.surfaceWetness - originalWeather.surfaceWetness) < 0.002,
    "Cinematic không được ghi đè surface wetness; chỉ cho phép clock chạy tiếp tự nhiên sau cảnh"
  );

  const collectionCounts = { marks: current.marks.length, memories: current.memories.length, clues: current.clues.length };
  assert.equal(await handleReveal(), false, "Reveal đã hoàn thành không được chạy lại");
  await send("Page.reload", { ignoreCache: true });
  await delay(850);
  current = await getState();
  assert.equal(current.scene, "final-choice");
  assert.equal(current.flags.originRevealed, true);
  assert.equal(current.moCount, 1);
  assert.deepEqual(
    { marks: current.marks.length, memories: current.memories.length, clues: current.clues.length },
    collectionCounts,
    "Reload không được cộng lại story reward"
  );
  assert.deepEqual(errors, [], "Browser console không được có runtime error");

  const portalCapture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await mkdir(screenshotDir, { recursive: true });
  await writeFile(`${screenshotDir}/chapter4-final-portal.png`, Buffer.from(portalCapture.data, "base64"));
  process.stdout.write(`${JSON.stringify({
    scene: current.scene,
    originRevealed: current.flags.originRevealed,
    portalOpen: current.progress.portalOpen,
    screenshot: `${screenshotDir}/chapter4-final-portal.png`
  }, null, 2)}\n`);
  process.stdout.write("Chapter 4 browser flow: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
