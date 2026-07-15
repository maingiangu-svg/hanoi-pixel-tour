#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 10800 + (process.pid % 300);
const screenshotDir = "/tmp/hanoi-chapter3";
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-chapter3-${process.pid}`, baseUrl
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
    const { getStoryState, isStoryMapUnlocked } = await import("./src/systems/storyState.js");
    const chapter = await import("./src/systems/chapter3.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const story = getStoryState();
    return {
      scene: story.currentScene,
      chapter: story.currentChapter,
      stage: story.flags.chapter3 ? chapter.getChapter3Progress().stage : null,
      objective: story.flags.chapter3 ? chapter.getChapter3Objective() : "",
      cutsceneId: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      kind: runtime.cutscene?.dialogue?.kind || null,
      text: runtime.cutscene?.dialogue?.text || "",
      choices: runtime.cutscene?.dialogue?.choices?.length || 0,
      selected: runtime.cutscene?.dialogue?.selectedIndex ?? -1,
      suspicion: Boolean(runtime.cutscene?.suspicion?.active),
      zoom: runtime.cutscene?.camera?.zoom || 1,
      flash: runtime.cutscene?.scene?.renderer === "chapter3Memory" ? runtime.cutscene.scene.state.flash : null,
      marks: [...story.historyMarks],
      memories: [...story.humanMemories],
      clues: [...story.memoryClues],
      choicesState: { ...story.choices },
      scores: { ...story.scores },
      flags: { ...story.flags },
      longBienUnlocked: isStoryMapUnlocked("longBien"),
      moCount: getScheduledNpcsForMap(maps.baDinh).filter((npc) => npc.id === "mo").length,
      mapId: state.currentMapId,
      infoOpen: !document.getElementById("infoModal").classList.contains("hidden"),
      quizOpen: !document.getElementById("quizModal").classList.contains("hidden")
    };
  })()`);
}

async function setupChapter3() {
  await evaluate("localStorage.clear()");
  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const { closeCharacterSelection } = await import("./src/systems/characterSelection.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const { startChapter3 } = await import("./src/systems/chapter3.js");
    const { updateNpcSchedules } = await import("./src/systems/npcSchedule.js");
    state.profile.gender = "female";
    closeCharacterSelection();
    state.currentMapId = "baDinh";
    state.gameTime.totalGameMinutes = 10 * 60;
    state.gameTime.day = 1;
    state.gameTime.hour = 10;
    state.gameTime.minute = 0;
    player.x = 748;
    player.y = 720;
    state.player.x = player.x;
    state.player.y = player.y;
    const story = getStoryState();
    story.introCompleted = true;
    story.currentChapter = 3;
    story.currentScene = "chapter-3";
    story.flags.chapter1Completed = true;
    story.flags.chapter2Completed = true;
    story.flags["mo-suspects-player-origin"] = true;
    story.unlockedMaps = ["hoanKiem", "churchInterior", "baDinh"];
    startChapter3({ reset: true });
    updateNpcSchedules();
  })()`);
  await delay(260);
}

async function waitForCutscene(id) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const current = await getState();
    if (current.cutsceneId === id) return current;
    await delay(50);
  }
  assert.fail(`Cutscene ${id} did not start`);
}

async function drainCutscene(id, choiceIndex = null) {
  const observed = { flashes: new Set(), internal: [], suspicion: false };
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const current = await getState();
    if (current.cutsceneId !== id) break;
    if (current.flash) observed.flashes.add(current.flash);
    if (current.suspicion) {
      observed.suspicion = true;
      if (current.waiting) assert(current.zoom >= 1.6, "Cảnh Mơ phải zoom ít nhất 1.6x");
    }
    if (current.kind === "internal" && current.text) observed.internal.push(current.text);
    if (current.waiting) {
      if (current.choices) {
        assert.notEqual(choiceIndex, null, `Cutscene ${id} cần choiceIndex`);
        for (let index = 0; index <= choiceIndex; index += 1) await press("ArrowDown", "ArrowDown");
      }
      await press("Enter", "Enter");
    } else {
      await delay(65);
    }
  }
  return observed;
}

async function interactCurrentPoint() {
  return evaluate(`(async () => {
    const chapter = await import("./src/systems/chapter3.js");
    return chapter.handleChapter3Interaction(chapter.getCurrentChapter3Point());
  })()`);
}

async function completeOpenQuiz() {
  await evaluate(`(async () => {
    const { runtime } = await import("./src/state.js");
    const { quizBank } = await import("./src/data/landmarks.js");
    const quiz = await import("./src/systems/quiz.js");
    const id = runtime.activeQuiz.id;
    quiz.answerQuiz(quizBank[id].correctIndex);
    quiz.closeQuiz();
  })()`);
  await delay(230);
}

async function openInfoQuizAndComplete() {
  assert.equal(await interactCurrentPoint(), true);
  assert.equal((await getState()).infoOpen, true);
  await evaluate(`document.querySelector("#infoActions button")?.click()`);
  await delay(90);
  assert.equal((await getState()).quizOpen, true);
  await completeOpenQuiz();
}

async function reloadAndAssertStage(stage) {
  await send("Page.reload", { ignoreCache: true });
  await delay(850);
  const current = await getState();
  assert.equal(current.stage, stage, `Reload phải giữ stage ${stage}`);
  assert.equal(current.moCount, 1, "Reload không được nhân đôi Mơ ở Ba Đình");
}

async function runFullChapter() {
  await setupChapter3();
  await waitForCutscene("chapter3-baDinhArrival");
  const arrival = await drainCutscene("chapter3-baDinhArrival");
  let current = await getState();
  assert.equal(current.stage, "langBacHistory");
  assert(arrival.flashes.has("child-hand") && arrival.flashes.has("ba-dinh-flags"));
  assert(current.memories.includes("memory-held-hand"));
  assert.equal(current.longBienUnlocked, false);
  const lockedLongBien = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { travelToMap } = await import("./src/systems/interaction.js");
    return travelToMap(maps.baDinh.exits.find((exit) => exit.id === "busToLongBien"));
  })()`);
  assert.equal(lockedLongBien, false, "Long Biên phải còn khóa trước khi kết thúc Chapter 3");

  await reloadAndAssertStage("langBacHistory");
  await openInfoQuizAndComplete();
  assert.equal((await getState()).stage, "onePillarHistory");
  await openInfoQuizAndComplete();
  assert.equal((await getState()).stage, "guideHistory");

  assert.equal(await interactCurrentPoint(), true);
  await drainCutscene("chapter3-guideHistory");
  assert.equal((await getState()).stage, "guideQuiz");
  assert.equal(await interactCurrentPoint(), true);
  await completeOpenQuiz();
  await waitForCutscene("chapter3-focusChoice");
  await drainCutscene("chapter3-focusChoice", 0);
  await waitForCutscene("chapter3-tourGroupChoice");
  await drainCutscene("chapter3-tourGroupChoice", 0);
  current = await getState();
  assert.equal(current.stage, "vanMieuGate");
  assert(current.marks.includes("history-ba-dinh"));
  assert.equal(current.choicesState.chapter3FocusChoice, "history");
  assert.equal(current.choicesState.chapter3TourGroupChoice, "help");

  assert.equal(await interactCurrentPoint(), true);
  await drainCutscene("chapter3-vanMieuGate");
  assert.equal((await getState()).stage, "khueVanMemory");
  assert.equal(await interactCurrentPoint(), true);
  const schoolMemory = await drainCutscene("chapter3-khueVanMemory");
  current = await getState();
  assert.equal(current.stage, "stelaeHistory");
  assert(schoolMemory.flashes.has("school-trip") && schoolMemory.flashes.has("khue-van-cac"));
  assert(current.memories.includes("memory-school-trip"));
  assert(current.clues.includes("clue-modern-school-lesson"));

  await reloadAndAssertStage("stelaeHistory");
  await openInfoQuizAndComplete();
  await waitForCutscene("chapter3-schoolGroupChoice");
  await drainCutscene("chapter3-schoolGroupChoice", 0);
  await waitForCutscene("chapter3-fearChoice");
  await drainCutscene("chapter3-fearChoice", 0);
  await waitForCutscene("chapter3-moRecognition");
  const recognition = await drainCutscene("chapter3-moRecognition");
  current = await getState();
  assert.equal(current.stage, "oldWitness");
  assert.equal(current.flags["mo-knows-player-origin"], true);
  assert.equal(recognition.suspicion, true);
  assert(recognition.internal.includes("Không còn là nghi ngờ nữa."));
  assert(recognition.internal.includes("Mình phải đưa bạn ấy tới Cầu Long Biên."));
  const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await mkdir(screenshotDir, { recursive: true });
  await writeFile(`${screenshotDir}/chapter3-after-recognition.png`, Buffer.from(capture.data, "base64"));

  assert.equal(await interactCurrentPoint(), true);
  const witness = await drainCutscene("chapter3-oldWitness");
  assert(witness.flashes.has("long-bien-tracks") && witness.flashes.has("rift-light"));
  await waitForCutscene("chapter3-finale");
  await drainCutscene("chapter3-finale");
  current = await getState();
  assert.equal(current.chapter, 4);
  assert.equal(current.scene, "chapter-4");
  assert.equal(current.longBienUnlocked, true);
  assert(current.clues.includes("clue-long-bien-disappearance"));
  assert(current.marks.includes("history-van-mieu"));
  assert.equal(current.moCount, 0, "Mơ story phải rời Ba Đình sau khi chương kết thúc");

  const unlockedTravel = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { state } = await import("./src/state.js");
    const { travelToMap } = await import("./src/systems/interaction.js");
    const travelled = travelToMap(maps.baDinh.exits.find((exit) => exit.id === "busToLongBien"));
    return { travelled, mapId: state.currentMapId };
  })()`);
  assert.deepEqual(unlockedTravel, { travelled: true, mapId: "longBien" });

  await send("Page.reload", { ignoreCache: true });
  await delay(820);
  current = await getState();
  assert.equal(current.chapter, 4);
  assert.equal(current.longBienUnlocked, true);
  return current;
}

async function runAlternateChoices() {
  await setupChapter3();
  await waitForCutscene("chapter3-baDinhArrival");
  await drainCutscene("chapter3-baDinhArrival");
  await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    state.completedQuizzes.langBac = { correct: true, completedAt: Date.now() };
  })()`);
  assert.equal(await interactCurrentPoint(), true);
  await evaluate(`document.querySelector("#infoActions button")?.click()`);
  await delay(180);
  assert.equal((await getState()).stage, "onePillarHistory", "Quiz cũ phải cho phép bỏ qua bước trả lời lại");
  await evaluate(`window.advanceChapter3ForDebug("focusChoice")`);
  await waitForCutscene("chapter3-focusChoice");
  await drainCutscene("chapter3-focusChoice", 1);
  await waitForCutscene("chapter3-tourGroupChoice");
  await drainCutscene("chapter3-tourGroupChoice", 1);
  await evaluate(`window.advanceChapter3ForDebug("schoolGroupChoice")`);
  await waitForCutscene("chapter3-schoolGroupChoice");
  await drainCutscene("chapter3-schoolGroupChoice", 1);
  await waitForCutscene("chapter3-fearChoice");
  await drainCutscene("chapter3-fearChoice", 1);
  const current = await getState();
  assert.equal(current.choicesState.chapter3FocusChoice, "memory");
  assert.equal(current.choicesState.chapter3TourGroupChoice, "skip");
  assert.equal(current.choicesState.chapter3SchoolGroupChoice, "clue");
  assert.equal(current.choicesState.chapter3FearChoice, "hide");
  assert(current.scores.return >= 3);
  assert(current.scores.truth >= 2);
  assert(current.scores.curiosity >= 2);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(700);
  const result = await runFullChapter();
  await runAlternateChoices();
  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  process.stdout.write(`${JSON.stringify({
    completedScene: result.scene,
    completedChapter: result.chapter,
    longBienUnlocked: result.longBienUnlocked,
    screenshot: `${screenshotDir}/chapter3-after-recognition.png`
  }, null, 2)}\n`);
  process.stdout.write("Chapter 3 browser flow: OK\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
