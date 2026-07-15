#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 10100 + (process.pid % 300);
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-chapter1-${process.pid}`, baseUrl
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
    const { getStoryState, isStoryMapUnlocked } = await import("./src/systems/storyState.js");
    const { getChapter1Progress, getChapter1Objective } = await import("./src/systems/chapter1.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const { maps } = await import("./src/data/maps.js");
    const story = getStoryState();
    return {
      scene: story.currentScene,
      chapter: story.currentChapter,
      stage: story.flags.chapter1 ? getChapter1Progress().stage : null,
      objective: story.flags.chapter1 ? getChapter1Objective() : "",
      activeCutscene: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      dialogueKind: runtime.cutscene?.dialogue?.kind || null,
      dialogueText: runtime.cutscene?.dialogue?.text || "",
      suspicion: Boolean(runtime.cutscene?.suspicion?.active),
      zoom: runtime.cutscene?.camera?.zoom || 1,
      historyMarks: [...story.historyMarks],
      humanMemories: [...story.humanMemories],
      clues: [...story.memoryClues],
      origin: story.originChoice,
      unlockedMaps: [...story.unlockedMaps],
      churchUnlocked: isStoryMapUnlocked("churchInterior"),
      moCount: getScheduledNpcsForMap(maps.hoanKiem).filter((npc) => npc.id === "mo").length,
      choiceOpen: !document.getElementById("choiceModal").classList.contains("hidden"),
      infoOpen: !document.getElementById("infoModal").classList.contains("hidden"),
      quizOpen: !document.getElementById("quizModal").classList.contains("hidden")
    };
  })()`);
}

async function drainCutscene({ expectSuspicion = false } = {}) {
  let sawSuspicion = false;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const current = await getState();
    if (!current.activeCutscene) break;
    if (current.waiting) {
      if (current.dialogueKind === "internal" && current.suspicion) {
        sawSuspicion = true;
        assert(current.zoom >= 1.6, "Cảnh nghi ngờ phải zoom Mơ ít nhất 1.6x");
      }
      await press("Enter", "Enter");
    } else {
      await delay(90);
    }
  }
  if (expectSuspicion) assert.equal(sawSuspicion, true, "Phải thấy độc thoại nghi ngờ lần hai của Mơ");
}

async function interactCurrentPoint() {
  return evaluate(`(async () => {
    const chapter = await import("./src/systems/chapter1.js");
    return chapter.handleChapter1Interaction(chapter.getCurrentChapter1Point());
  })()`);
}

async function beginChapter(origin) {
  await evaluate(`localStorage.clear()`);
  await send("Page.reload", { ignoreCache: true });
  await delay(650);
  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const { startChapter1 } = await import("./src/systems/chapter1.js");
    state.profile.gender = "female";
    state.currentMapId = "hoanKiem";
    player.x = 1192;
    player.y = 1238;
    state.player.x = player.x;
    state.player.y = player.y;
    const story = getStoryState();
    story.introCompleted = true;
    story.originChoice = ${JSON.stringify(origin)};
    story.choices.originChoice = ${JSON.stringify(origin)};
    startChapter1({ reset: true });
  })()`);
  await delay(160);
  const initial = await getState();
  assert.equal(initial.stage, "movement");
  assert.equal(initial.moCount, 1, "Chapter 1 chỉ được có một Mơ");

  const lockResult = await evaluate(`(async () => {
    const { travelToMap } = await import("./src/systems/interaction.js");
    const { setTrackedObjective } = await import("./src/systems/navigation.js");
    return {
      travel: travelToMap({ id: "test-lock", kind: "road", targetMap: "baDinh", targetX: 100, targetY: 100 }),
      churchTravel: travelToMap({ id: "enterNhaThoLon", kind: "churchEntrance", targetMap: "churchInterior", targetX: 688, targetY: 850 }),
      navigate: setTrackedObjective({ id: "test-lock-nav", type: "map", mapId: "baDinh", targetId: "baDinh", label: "Ba Đình" }, { silent: true }),
      churchNavigate: setTrackedObjective({ id: "test-lock-church", type: "church", mapId: "hoanKiem", targetId: "nhaThoLon", label: "Nhà thờ Lớn" }, { silent: true })
    };
  })()`);
  assert.deepEqual(lockResult, { travel: false, churchTravel: false, navigate: false, churchNavigate: false });

  await evaluate(`(async () => {
    const { player } = await import("./src/state.js");
    player.x += 70;
  })()`);
  await delay(120);
  assert.equal((await getState()).stage, "mapTutorial");
  await evaluate(`(async () => {
    const map = await import("./src/systems/mapOverlay.js");
    map.openMapOverlay();
    const text = document.getElementById("mapContent").textContent;
    if (!text.includes("Chưa khám phá")) throw new Error("Bản đồ phải hiển thị khu vực khóa");
    map.closeMapOverlay();
  })()`);
  await delay(100);
  assert.equal((await getState()).stage, "modernLight");
}

async function playSharedChapter() {
  for (const [stage, next] of [
    ["modernLight", "modernBike"],
    ["modernBike", "modernPhone"],
    ["modernPhone", "modernMoney"],
    ["modernMoney", "lakeInfo"]
  ]) {
    assert.equal((await getState()).stage, stage);
    assert.equal(await interactCurrentPoint(), true);
    await drainCutscene();
    assert.equal((await getState()).stage, next);
  }

  assert.equal(await interactCurrentPoint(), true);
  assert.equal((await getState()).infoOpen, true);
  await evaluate(`(async () => {
    const { ui } = await import("./src/state.js");
    ui.infoActions.querySelector("button")?.click();
    const { runtime } = await import("./src/state.js");
    const { quizBank } = await import("./src/data/landmarks.js");
    const quiz = await import("./src/systems/quiz.js");
    quiz.answerQuiz(quizBank[runtime.activeQuiz.id].correctIndex);
    quiz.closeQuiz();
  })()`);
  await delay(140);
  let current = await getState();
  assert.equal(current.stage, "knownAlley");
  assert(current.historyMarks.includes("history-hoan-kiem"));

  await interactCurrentPoint();
  await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "childhoodSong");
  assert(current.clues.includes("clue-known-alley"));

  await interactCurrentPoint();
  await drainCutscene({ expectSuspicion: true });
  current = await getState();
  assert.equal(current.stage, "familiarFood");
  assert(current.clues.includes("clue-childhood-song"));

  await send("Page.reload", { ignoreCache: true });
  await delay(720);
  current = await getState();
  assert.equal(current.stage, "familiarFood", "Reload phải giữ đúng stage Chapter 1");
  assert.equal(current.moCount, 1, "Reload không được nhân đôi Mơ");

  await interactCurrentPoint();
  await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "teaTalk");
  assert(current.clues.includes("clue-familiar-food"));

  await interactCurrentPoint();
  await drainCutscene();
  assert.equal((await getState()).stage, "teaTask");
  await interactCurrentPoint();
  await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "originBranch");
  assert(current.humanMemories.includes("memory-tea-stall"));
}

async function finishOrigin(origin) {
  if (origin === "stay") {
    await interactCurrentPoint();
    assert.equal((await getState()).choiceOpen, true);
    await evaluate(`(async () => {
      const { ui } = await import("./src/state.js");
      ui.choiceActions.querySelector("button")?.click();
    })()`);
  } else {
    await interactCurrentPoint();
  }
  await drainCutscene();
  await delay(180);
  await drainCutscene();
  const complete = await getState();
  assert.equal(complete.chapter, 2);
  assert.equal(complete.scene, "chapter-2");
  assert.equal(complete.churchUnlocked, true);
  assert(complete.unlockedMaps.includes("churchInterior"));
  assert.equal(complete.moCount <= 1, true);

  const churchEntry = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { state } = await import("./src/state.js");
    const { travelToMap } = await import("./src/systems/interaction.js");
    const exit = maps.hoanKiem.exits.find((entry) => entry.id === "enterNhaThoLon");
    return { travelled: travelToMap(exit), mapId: state.currentMapId };
  })()`);
  assert.deepEqual(churchEntry, { travelled: true, mapId: "churchInterior" });

  await send("Page.reload", { ignoreCache: true });
  await delay(700);
  const reloaded = await getState();
  assert.equal(reloaded.chapter, 2);
  assert.equal(reloaded.scene, "chapter-2");
  assert.equal(reloaded.churchUnlocked, true);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(650);

  for (const origin of ["return", "stay", "investigate"]) {
    await beginChapter(origin);
    await playSharedChapter();
    await finishOrigin(origin);
  }

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write("Chapter 1 browser flow: OK (return, stay, investigate)\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
