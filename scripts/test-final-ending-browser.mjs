#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 11600 + (process.pid % 300);
const screenshotDir = "/tmp/hanoi-final-ending";
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-final-ending-${process.pid}`, baseUrl
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

async function reload() {
  await send("Page.reload", { ignoreCache: true });
  await delay(850);
}

async function setupFinalChoice(eligible) {
  await evaluate("localStorage.clear()");
  await reload();
  await evaluate(`(async () => {
    const eligible = ${JSON.stringify(eligible)};
    const { player, runtime, state } = await import("./src/state.js");
    const { closeCharacterSelection } = await import("./src/systems/characterSelection.js");
    const { saveGame } = await import("./src/storage.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const ending = await import("./src/systems/finalEnding.js");
    state.profile.gender = "female";
    closeCharacterSelection();
    state.currentMapId = "longBien";
    player.x = 1888;
    player.y = 580;
    state.player.x = player.x;
    state.player.y = player.y;
    state.photoAlbum.photos = {
      "photo-ho-guom": { title: "Hồ Gươm từ lối đi ven hồ" },
      "photo-nha-tho": { title: "Nhà thờ Lớn từ sân trước" },
      "photo-khue-van": { title: "Khuê Văn Các" }
    };
    state.branchingQuestProgress = eligible ? {
      teaVendorHelp: { status: "completed", outcome: "excellent", flags: { teaVendorHelped: true } },
      childToy: { status: "completed", outcome: "excellent", flags: { childrenGreetPlayer: true } },
      tourGroup: { status: "completed", outcome: "good", flags: { guideRemembersPlayer: true } },
      lostTourist: { status: "completed", outcome: "good", flags: { touristUsedXeOm: true } }
    } : {};
    const story = getStoryState();
    story.introCompleted = true;
    story.currentChapter = 4;
    story.currentScene = "final-choice";
    story.originChoice = eligible ? "investigate" : "return";
    story.completedChapters = ["1", "2", "3", "4"];
    story.unlockedMaps = ["hoanKiem", "churchInterior", "baDinh", "longBien"];
    story.historyMarks = ["history-hoan-kiem", "history-cathedral", "history-ba-dinh", "history-van-mieu"];
    story.humanMemories = ["memory-tea-stall", "memory-mo-and-children", "memory-held-hand", "memory-school-trip"];
    story.memoryClues = eligible ? [
      "intro-bridge-flash", "intro-church-bell", "intro-turtle-pendant",
      "clue-instinctive-hoan-kiem-name", "clue-known-alley", "clue-childhood-song", "clue-familiar-food",
      "clue-church-bell-memory", "clue-mo-old-photo", "clue-modern-school-lesson", "clue-long-bien-disappearance"
    ] : ["clue-instinctive-hoan-kiem-name", "clue-childhood-song"];
    story.scores = eligible
      ? { return: 2, belonging: 4, truth: 4, compassion: 5, curiosity: 5 }
      : { return: 4, belonging: 0, truth: 0, compassion: 0, curiosity: 0 };
    story.choices = eligible ? {
      originChoice: "investigate",
      chapter2RelationshipChoice: "trust",
      chapter3FocusChoice: "history",
      chapter3TourGroupChoice: "help",
      chapter3SchoolGroupChoice: "help",
      chapter3FearChoice: "share"
    } : { originChoice: "return", chapter2RelationshipChoice: "return" };
    story.flags = {
      originRevealed: true,
      chapter4Completed: true,
      chapter4: { completed: true, revealCompleted: true, portalOpen: true, status: "completed" }
    };
    story.endingId = null;
    story.checkpoint = null;
    runtime.chapter4.portalWaiting = true;
    ending.hydrateFinalEnding();
    saveGame();
    ending.updateFinalEnding();
  })()`);
  let lastChoiceState = null;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    const current = await getState();
    lastChoiceState = current;
    if (current.cutsceneId === "story-final-choice" && current.waiting && current.choiceCount > 0) return;
    if (current.cutsceneId === "story-final-choice" && current.waiting) await press("Enter", "Enter");
    else await delay(60);
  }
  assert.fail(`Timed out waiting for the selectable final choice: ${JSON.stringify(lastChoiceState)}`);
}

async function getState() {
  return evaluate(`(async () => {
    const { runtime, state, ui } = await import("./src/state.js");
    const ending = await import("./src/systems/finalEnding.js");
    const { maps } = await import("./src/data/maps.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const story = state.story;
    return {
      scene: story.currentScene,
      endingId: story.endingId,
      cutsceneId: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      choiceCount: runtime.cutscene?.dialogue?.choices?.length || 0,
      text: runtime.cutscene?.dialogue?.text || "",
      frame: runtime.cutscene?.scene?.state?.frame || null,
      checkpoint: story.checkpoint ? { ...story.checkpoint } : null,
      panelOpen: !ui.endingPanel.classList.contains("hidden"),
      panelText: ui.endingContent.textContent,
      actions: Array.from(ui.endingActions.querySelectorAll("button")).map((button) => button.dataset.actionLabel),
      finalEnding: story.flags.finalEnding ? {
        status: story.flags.finalEnding.status,
        replayCount: story.flags.finalEnding.replayCount,
        epilogueFlags: [...story.flags.finalEnding.epilogueFlags],
        snapshot: story.flags.finalEnding.journeySnapshot ? {
          photoCount: story.flags.finalEnding.journeySnapshot.photoCount,
          helpedNpcCount: story.flags.finalEnding.journeySnapshot.helpedNpcCount,
          nearlyComplete: story.flags.finalEnding.journeySnapshot.nearlyComplete
        } : null
      } : null,
      eligibility: ending.getBridgeEndingEligibility().unlocked,
      gender: state.profile.gender,
      moCount: Object.values(maps).reduce((count, map) => count + getScheduledNpcsForMap(map).filter((npc) => npc.id === "mo").length, 0)
    };
  })()`);
}

async function waitFor(read, predicate, label, attempts = 140) {
  let lastValue = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await read();
    lastValue = value;
    if (predicate(value)) return value;
    await delay(60);
  }
  assert.fail(`Timed out waiting for ${label}: ${JSON.stringify(lastValue)}`);
}

async function selectFinalChoice(index) {
  await press("ArrowDown", "ArrowDown");
  for (let step = 0; step < index; step += 1) await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
}

async function drainToSummary({ reloadMidEnding = false } = {}) {
  let reloaded = false;
  for (let attempt = 0; attempt < 520; attempt += 1) {
    const current = await getState();
    if (current.panelOpen) return current;
    if (reloadMidEnding && !reloaded && current.cutsceneId?.startsWith("story-ending-") && current.waiting) {
      assert(current.checkpoint?.active, "Ending cutscene must have a safe checkpoint before reload");
      await reload();
      reloaded = true;
      continue;
    }
    if (current.waiting) await press("Enter", "Enter");
    else await delay(65);
  }
  assert.fail("Ending summary did not open");
}

async function capture(name) {
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  await mkdir(screenshotDir, { recursive: true });
  await writeFile(`${screenshotDir}/${name}.png`, Buffer.from(result.data, "base64"));
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");

  await setupFinalChoice(false);
  let current = await getState();
  assert.equal(current.choiceCount, 2, "Bridge ending must stay hidden when requirements are missing");
  assert.equal(current.eligibility, false);
  await selectFinalChoice(0);
  current = await drainToSummary();
  assert.equal(current.endingId, "return-to-immortal-world");
  assert.equal(current.moCount, 1, "Ending must keep exactly one scheduled Mơ instance");
  assert.match(current.panelText, /hai nơi được gọi là quê hương/i);
  assert.deepEqual(current.actions, ["Tiếp tục khám phá", "Xem lại đoạn kết", "Bắt đầu hành trình mới"]);
  await reload();
  current = await waitFor(() => getState(), (value) => value.panelOpen, "ending journal after reload");
  assert.equal(current.endingId, "return-to-immortal-world");
  await press("Enter", "Enter");
  current = await getState();
  assert.equal(current.scene, "continue-mode");
  assert.equal(current.panelOpen, false);
  await reload();
  await delay(350);
  current = await getState();
  assert.equal(current.scene, "continue-mode");
  assert.equal(current.panelOpen, false, "Continue mode must not replay or reopen the ending automatically");
  assert.equal(current.cutsceneId, null);

  await setupFinalChoice(true);
  current = await getState();
  assert.equal(current.choiceCount, 3, "Bridge ending must appear when every condition is met");
  assert.equal(current.eligibility, true);
  await selectFinalChoice(1);
  current = await drainToSummary();
  assert.equal(current.endingId, "stay-in-hanoi");
  assert.equal(current.moCount, 1);
  assert(current.finalEnding.snapshot.helpedNpcCount >= 4);
  assert.equal(new Set(current.finalEnding.epilogueFlags).size, current.finalEnding.epilogueFlags.length, "Epilogue flags must not duplicate");
  await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
  current = await waitFor(() => getState(), (value) => value.cutsceneId === "story-ending-stay-in-hanoi", "ending replay");
  current = await drainToSummary();
  assert.equal(current.finalEnding.replayCount, 1);

  await setupFinalChoice(true);
  await selectFinalChoice(2);
  current = await drainToSummary({ reloadMidEnding: true });
  assert.equal(current.endingId, "bridge-between-worlds");
  assert.equal(current.moCount, 1);
  assert.match(current.panelText, /con đường giữa hai thế giới/i);
  assert.match(current.panelText, /Bạn đã quên Hà Nội/);
  assert.match(current.panelText, /Hà Nội chưa từng quên bạn/);
  assert.equal(current.finalEnding.snapshot.nearlyComplete, true);
  await capture("bridge-ending-journal");

  await evaluate("window.confirm = () => false");
  await press("ArrowDown", "ArrowDown");
  await press("ArrowDown", "ArrowDown");
  await press("Enter", "Enter");
  current = await getState();
  assert.equal(current.panelOpen, true, "Cancelling a new journey must preserve the completed save");
  assert.equal(current.endingId, "bridge-between-worlds");

  await evaluate(`(() => {
    window.confirm = () => true;
    setTimeout(() => import("./src/systems/finalEnding.js").then((ending) => ending.beginNewJourney()), 0);
    return true;
  })()`);
  await delay(1200);
  current = await getState();
  assert.equal(current.scene, "gender-selection");
  assert.equal(current.endingId, null);
  assert.equal(current.gender, null);
  assert.equal(current.panelOpen, false);

  assert.equal(errors.length, 0, `Browser errors: ${errors.join("\n")}`);
  process.stdout.write("Final ending browser tests passed.\n");
} finally {
  try { socket?.close(); } catch {}
  try { process.kill(-chrome.pid, "SIGTERM"); } catch { chrome.kill("SIGTERM"); }
}
