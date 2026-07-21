#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173/";
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const debugPort = 10400 + (process.pid % 300);
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-background-networking", "--disable-component-update", "--disable-default-apps",
  "--disable-extensions", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=/tmp/hanoi-chapter2-${process.pid}`, baseUrl
], { stdio: ["ignore", "ignore", "pipe"], start_new_session: true });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const errors = [];
const screenshotDir = "/tmp/hanoi-chapter2";
let oldPhotoScreenshot = null;
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
    const { getChapter2Progress, getChapter2Objective } = await import("./src/systems/chapter2.js");
    const { getScheduledNpcsForMap } = await import("./src/systems/npcSchedule.js");
    const { isGameClockPaused } = await import("./src/systems/gameClock.js");
    const { maps } = await import("./src/data/maps.js");
    const story = getStoryState();
    const scene = runtime.cutscene?.scene;
    return {
      scene: story.currentScene,
      chapter: story.currentChapter,
      stage: story.flags.chapter2 ? getChapter2Progress().stage : null,
      objective: story.flags.chapter2 ? getChapter2Objective() : "",
      activeCutscene: runtime.cutscene?.id || null,
      waiting: Boolean(runtime.cutscene?.waitingForInput),
      dialogueKind: runtime.cutscene?.dialogue?.kind || null,
      dialogueText: runtime.cutscene?.dialogue?.text || "",
      selectedIndex: runtime.cutscene?.dialogue?.selectedIndex ?? -1,
      choiceCount: runtime.cutscene?.dialogue?.choices?.length || 0,
      suspicion: Boolean(runtime.cutscene?.suspicion?.active),
      zoom: runtime.cutscene?.camera?.zoom || 1,
      flash: scene?.renderer === "chapter2Memory" ? scene.state.flash : null,
      oldPhotoVisible: Boolean(scene?.renderer === "chapter2Memory" && scene.state.oldPhotoVisible),
      historyMarks: [...story.historyMarks],
      humanMemories: [...story.humanMemories],
      clues: [...story.memoryClues],
      flags: { ...story.flags },
      choices: { ...story.choices },
      scores: { ...story.scores },
      unlockedMaps: [...story.unlockedMaps],
      baDinhUnlocked: isStoryMapUnlocked("baDinh"),
      longBienUnlocked: isStoryMapUnlocked("longBien"),
      currentMapId: state.currentMapId,
      gameMinute: state.gameTime.totalGameMinutes,
      clockPaused: isGameClockPaused(),
      pauseReasons: [...(state.gameTime.pauseReasons || [])],
      companionActive: Boolean(state.moCompanion?.active),
      photoWithMo: Boolean(state.photoAlbum?.photos?.["photo-ho-guom"]?.withMo),
      moState: runtime.scheduledMo?.state || runtime.moCompanionNpc?.state || null,
      moExteriorCount: getScheduledNpcsForMap(maps.hoanKiem).filter((npc) => npc.id === "mo").length,
      moInteriorCount: getScheduledNpcsForMap(maps.churchInterior).filter((npc) => npc.id === "mo").length,
      choiceOpen: !document.getElementById("choiceModal").classList.contains("hidden"),
      infoOpen: !document.getElementById("infoModal").classList.contains("hidden"),
      quizOpen: !document.getElementById("quizModal").classList.contains("hidden")
    };
  })()`);
}

async function drainCutscene({ choiceIndex = null } = {}) {
  const observed = { flashes: new Set(), suspicion: false, oldPhoto: false, internalLines: [] };
  for (let attempt = 0; attempt < 220; attempt += 1) {
    const current = await getState();
    if (!current.activeCutscene) break;
    if (current.flash) observed.flashes.add(current.flash);
    if (current.oldPhotoVisible) observed.oldPhoto = true;
    if (current.oldPhotoVisible && current.suspicion && !oldPhotoScreenshot) {
      const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
      await mkdir(screenshotDir, { recursive: true });
      oldPhotoScreenshot = `${screenshotDir}/old-photo-suspicion.png`;
      await writeFile(oldPhotoScreenshot, Buffer.from(capture.data, "base64"));
    }
    if (current.suspicion) {
      observed.suspicion = true;
      assert(current.zoom >= 1.6 || !current.waiting, "Cảnh nghi ngờ phải zoom Mơ ít nhất 1.6x khi hiện độc thoại");
    }
    if (current.dialogueKind === "internal" && current.dialogueText) observed.internalLines.push(current.dialogueText);
    if (current.waiting) {
      if (current.choiceCount) {
        assert.notEqual(choiceIndex, null, "Cutscene có lựa chọn cần choiceIndex rõ ràng");
        for (let index = 0; index <= choiceIndex; index += 1) await press("ArrowDown", "ArrowDown");
      }
      await press("Enter", "Enter");
    } else {
      await delay(70);
    }
  }
  return observed;
}

async function setupChapter2() {
  await evaluate("localStorage.clear()");
  await send("Page.reload", { ignoreCache: true });
  await delay(700);
  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const { closeCharacterSelection } = await import("./src/systems/characterSelection.js");
    const { getStoryState } = await import("./src/systems/storyState.js");
    const { startChapter2 } = await import("./src/systems/chapter2.js");
    const { updateNpcSchedules } = await import("./src/systems/npcSchedule.js");
    state.profile.gender = "female";
    closeCharacterSelection();
    state.currentMapId = "hoanKiem";
    state.gameTime.totalGameMinutes = 10 * 60;
    state.gameTime.day = 1;
    state.gameTime.hour = 10;
    state.gameTime.minute = 0;
    player.x = 2450;
    player.y = 770;
    state.player.x = player.x;
    state.player.y = player.y;
    const story = getStoryState();
    story.introCompleted = true;
    story.currentChapter = 2;
    story.currentScene = "chapter-2";
    story.flags.chapter1Completed = true;
    story.flags.chapter1ChurchUnlocked = true;
    story.unlockedMaps = ["hoanKiem", "churchInterior"];
    startChapter2({ reset: true });
    updateNpcSchedules();
  })()`);
  await delay(220);
}

async function setGameMinute(totalGameMinutes) {
  await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const { updateNpcSchedules } = await import("./src/systems/npcSchedule.js");
    state.gameTime.totalGameMinutes = ${totalGameMinutes};
    state.gameTime.day = Math.floor(${totalGameMinutes} / 1440) + 1;
    const minuteOfDay = ${totalGameMinutes} % 1440;
    state.gameTime.hour = Math.floor(minuteOfDay / 60);
    state.gameTime.minute = minuteOfDay % 60;
    updateNpcSchedules();
  })()`);
  await delay(120);
}

async function interactChapterPoint() {
  return evaluate(`(async () => {
    const chapter = await import("./src/systems/chapter2.js");
    return chapter.handleChapter2Interaction(chapter.getCurrentChapter2Point());
  })()`);
}

async function travel(exitId, mapId) {
  const result = await evaluate(`(async () => {
    const { maps } = await import("./src/data/maps.js");
    const { state } = await import("./src/state.js");
    const { travelToMap } = await import("./src/systems/interaction.js");
    const exit = maps[state.currentMapId].exits.find((candidate) => candidate.id === ${JSON.stringify(exitId)});
    return { travelled: travelToMap(exit), mapId: state.currentMapId };
  })()`);
  assert.deepEqual(result, { travelled: true, mapId });
  await delay(650);
}

async function runFullChapter() {
  await setupChapter2();
  let current = await getState();
  assert.equal(current.activeCutscene, "chapter2-churchBell");
  assert.equal(current.baDinhUnlocked, false);
  assert.equal(current.longBienUnlocked, false);

  const bell = await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "talkPriest");
  assert(current.clues.includes("clue-church-bell-memory"));
  assert.equal(current.flags.playerTurtlePendant, true);
  assert(bell.flashes.has("turtle-pendant"), "Bell memory phải hiện mặt dây Tháp Rùa");

  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  current = await getState();
  assert.equal(current.stage, "talkPriest", "Reload phải giữ stage sau ký ức tiếng chuông");
  assert.equal(current.moExteriorCount + current.moInteriorCount <= 1, true, "Reload không được nhân đôi Mơ");
  const chapterUi = await evaluate(`(async () => {
    const map = await import("./src/systems/mapOverlay.js");
    const quest = await import("./src/systems/questSystem.js");
    const { ui } = await import("./src/state.js");
    quest.renderQuestLog();
    const questText = ui.questContent.textContent;
    map.openMapOverlay();
    const mapText = ui.mapContent.textContent;
    map.closeMapOverlay();
    return { questText, mapText };
  })()`);
  assert(chapterUi.questText.includes("Tiếng chuông từ một đời khác"));
  assert(chapterUi.mapText.includes("Ba Đình") && chapterUi.mapText.includes("Chưa khám phá"));
  const lockedTravel = await evaluate(`(async () => {
    const { travelToMap } = await import("./src/systems/interaction.js");
    const { setTrackedObjective } = await import("./src/systems/navigation.js");
    return {
      travel: travelToMap({ id: "chapter2-locked", kind: "bus", targetMap: "baDinh", targetX: 340, targetY: 1850 }),
      navigate: setTrackedObjective({ id: "chapter2-locked-nav", type: "map", mapId: "baDinh", targetId: "baDinh", label: "Ba Đình" }, { silent: true })
    };
  })()`);
  assert.deepEqual(lockedTravel, { travel: false, navigate: false });

  await travel("enterNhaThoLon", "churchInterior");
  assert.equal(await interactChapterPoint(), true);
  await drainCutscene();
  assert.equal((await getState()).stage, "cathedralHistory");

  await travel("churchDoorOut", "hoanKiem");
  assert.equal(await interactChapterPoint(), true);
  assert.equal((await getState()).infoOpen, true);
  await evaluate(`(async () => {
    const { runtime, ui } = await import("./src/state.js");
    const { quizBank } = await import("./src/data/landmarks.js");
    const quiz = await import("./src/systems/quiz.js");
    ui.infoActions.querySelector("button")?.click();
    quiz.answerQuiz(quizBank[runtime.activeQuiz.id].correctIndex);
    quiz.closeQuiz();
  })()`);
  await delay(180);
  current = await getState();
  assert.equal(current.stage, "helpChildren");
  assert(current.historyMarks.includes("history-cathedral"));

  await setGameMinute(17 * 60);
  assert.equal(await interactChapterPoint(), true);
  await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "observeMass");
  assert(current.humanMemories.includes("memory-mo-and-children"));

  await setGameMinute(18 * 60 + 30);
  await travel("enterNhaThoLon", "churchInterior");
  current = await getState();
  assert.equal(current.moState, "attendingMass");
  assert.equal(current.moInteriorCount, 1);
  assert.equal(await interactChapterPoint(), true);
  await drainCutscene();
  assert.equal((await getState()).stage, "oldPhoto");

  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  current = await getState();
  assert.equal(current.stage, "oldPhoto");
  assert.equal(current.moInteriorCount, 1, "Reload 18:30 phải phục hồi Mơ trong Nhà thờ");

  await setGameMinute(19 * 60 + 15);
  await travel("churchDoorOut", "hoanKiem");
  assert.equal(await interactChapterPoint(), true);
  await delay(120);
  assert.equal((await getState()).activeCutscene, "chapter2-oldPhoto");
  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  current = await getState();
  assert.equal(current.stage, "oldPhoto", "Reload giữa cảnh ảnh cũ phải giữ checkpoint an toàn");
  assert.equal(current.activeCutscene, "chapter2-oldPhoto", "Cảnh ảnh cũ phải khởi động lại an toàn sau reload");
  const photoScene = await drainCutscene();
  current = await getState();
  assert.equal(current.stage, "hangoutInvite");
  assert.equal(photoScene.oldPhoto, true, "Cảnh bức ảnh cũ phải được render");
  assert.equal(photoScene.suspicion, true, "Bức ảnh phải kích hoạt zoom nghi ngờ lần ba");
  assert(photoScene.internalLines.includes("Chiếc mặt dây trong ảnh…"));
  assert(photoScene.internalLines.includes("Nhưng nếu mình nói ra mà sai thì sao?"));
  assert(current.clues.includes("clue-mo-old-photo"));
  assert.equal(current.flags["mo-suspects-player-origin"], true);

  await evaluate(`(async () => {
    const { runtime } = await import("./src/state.js");
    const { handleDialogueViewKey, updateDialogueView } = await import("./src/systems/dialogueView.js");
    const { handleScheduledNpc } = await import("./src/systems/interaction.js");
    handleScheduledNpc(runtime.scheduledMo);
    updateDialogueView(performance.now() + 300);
    handleDialogueViewKey("s");
    handleDialogueViewKey("s");
    handleDialogueViewKey("enter");
    updateDialogueView(performance.now() + 600);
    updateDialogueView(performance.now() + 900);
    handleDialogueViewKey("s");
    handleDialogueViewKey("enter");
    updateDialogueView(performance.now() + 1200);
  })()`);
  await delay(220);
  current = await getState();
  assert.equal(current.stage, "hangoutDestination");
  assert.equal(current.companionActive, true);
  assert.equal(current.clockPaused, true);
  const pausedMinute = current.gameMinute;
  await delay(1100);
  assert.equal((await getState()).gameMinute, pausedMinute, "Game clock phải đứng yên khi đi chơi cùng Mơ");

  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    player.x = 1214;
    player.y = 1004;
    player.facing = "right";
    state.player.x = player.x;
    state.player.y = player.y;
  })()`);
  assert.equal(await interactChapterPoint(), true);
  await drainCutscene();
  assert.equal((await getState()).stage, "hangoutPhoto");

  const photoResult = await evaluate(`(async () => {
    const { camera } = await import("./src/camera.js");
    const { canvas, player, state } = await import("./src/state.js");
    const { photoSpotsById } = await import("./src/data/photoSpots.js");
    const photo = await import("./src/systems/photoMode.js");
    const spot = photoSpotsById["photo-ho-guom"];
    state.photoAlbum.photos[spot.id] = { photoSpotId: spot.id, rating: 3, withMo: false, mapId: "hoanKiem" };
    player.x = spot.x - player.width / 2;
    player.y = spot.y - player.height / 2;
    player.facing = spot.requiredFacing;
    state.player.x = player.x;
    state.player.y = player.y;
    camera.x = spot.targetBounds.x - Math.max(48, (canvas.width - spot.targetBounds.width) / 2);
    camera.y = spot.targetBounds.y - Math.max(48, (canvas.height - spot.targetBounds.height) / 2);
    const before = photo.evaluatePhotoComposition(spot);
    const opened = photo.openPhotoMode();
    const captured = opened ? photo.captureCurrentPhoto() : false;
    return { before, opened, captured, stored: state.photoAlbum.photos[spot.id] };
  })()`);
  assert.equal(photoResult.before.valid, true, photoResult.before.reason);
  assert.equal(photoResult.opened, true);
  assert.equal(photoResult.captured, true);
  assert.equal(photoResult.stored.withMo, true, "Ảnh cùng Mơ phải thay được ảnh solo cùng rating");
  await delay(220);
  assert.equal((await getState()).stage, "returnMo");

  await evaluate(`(async () => {
    const { player, state } = await import("./src/state.js");
    const interaction = await import("./src/systems/interaction.js");
    player.x = 2506;
    player.y = 826;
    state.player.x = player.x;
    state.player.y = player.y;
    interaction.updateNearbyInteractable();
    interaction.interact();
  })()`);
  await delay(100);
  assert.equal(await evaluate(`(async () => Boolean((await import("./src/state.js")).runtime.dialogueView?.active))()`), true);
  await evaluate(`(async () => {
    const { handleDialogueViewKey, updateDialogueView } = await import("./src/systems/dialogueView.js");
    updateDialogueView(performance.now() + 300);
    handleDialogueViewKey("s");
    handleDialogueViewKey("enter");
    updateDialogueView(performance.now() + 600);
  })()`);
  await delay(220);
  current = await getState();
  assert.equal(current.companionActive, false);
  assert.equal(current.pauseReasons.includes("hanging-out-with-mo"), false, "Trả Mơ phải gỡ pause reason của companion");
  assert.equal(current.activeCutscene, "chapter2-relationship");

  const relationshipScene = await drainCutscene({ choiceIndex: 0 });
  await delay(180);
  const finale = await drainCutscene();
  current = await getState();
  assert.equal(current.chapter, 3);
  assert.equal(current.scene, "chapter-3");
  assert.equal(current.baDinhUnlocked, true);
  assert.equal(current.longBienUnlocked, false);
  assert(current.unlockedMaps.includes("baDinh"));
  assert.equal(current.scores.compassion, 1);
  assert.equal(current.scores.belonging, 1);
  assert(
    relationshipScene.flashes.has("van-mieu-gate") || finale.flashes.has("van-mieu-gate"),
    "Kết chương phải flash cổng Văn Miếu"
  );
  assert.equal(current.moExteriorCount + current.moInteriorCount <= 1, true);

  await send("Page.reload", { ignoreCache: true });
  await delay(760);
  current = await getState();
  assert.equal(current.chapter, 3);
  assert.equal(current.scene, "chapter-3");
  assert.equal(current.activeCutscene, null, "Intro Chapter 2 không được replay sau khi hoàn thành");
  assert.equal(current.flags.chapter2Completed, true);
}

async function testRelationshipChoice(choiceIndex, key, scoreKey) {
  await setupChapter2();
  await drainCutscene();
  await evaluate(`(async () => {
    const chapter = await import("./src/systems/chapter2.js");
    chapter.getChapter2Progress().hangoutStarted = true;
    window.advanceChapter2ForDebug("hangoutDestination");
  })()`);
  await delay(160);
  assert.equal((await getState()).stage, "hangoutInvite", "Trả Mơ sớm không được làm kẹt Chapter 2");
  await evaluate(`(async () => {
    const { state } = await import("./src/state.js");
    const { getStoryState, addHistoryMark, addHumanMemory, addMemoryClue } = await import("./src/systems/storyState.js");
    const chapter = await import("./src/systems/chapter2.js");
    const story = getStoryState();
    const progress = chapter.getChapter2Progress();
    Object.assign(progress, {
      bellMemorySeen: true,
      priestConversation: true,
      childrenHelped: true,
      massObserved: true,
      oldPhotoSeen: true,
      hangoutStarted: true,
      hangoutDestinationVisited: true,
      photoWithMo: true,
      moReturned: true,
      relationshipChoice: null,
      relationshipStarted: false
    });
    addHistoryMark("history-cathedral", { save: false });
    addHumanMemory("memory-mo-and-children", { save: false });
    addMemoryClue("clue-church-bell-memory", { save: false });
    addMemoryClue("clue-mo-old-photo", { save: false });
    delete story.choices.chapter2RelationshipChoice;
    story.scores.return = 0;
    story.scores.truth = 0;
    story.scores.compassion = 0;
    story.scores.belonging = 0;
    state.moCompanion.active = false;
    window.advanceChapter2ForDebug("relationshipChoice");
  })()`);
  await delay(180);
  assert.equal((await getState()).activeCutscene, "chapter2-relationship");
  await drainCutscene({ choiceIndex });
  await delay(180);
  await drainCutscene();
  const result = await getState();
  assert.equal(result.choices.chapter2RelationshipChoice, key);
  assert.equal(result.scores[scoreKey], 1);
}

try {
  await connect();
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Page.enable");
  await delay(650);

  await runFullChapter();
  await testRelationshipChoice(1, "return", "return");
  await testRelationshipChoice(2, "truth", "truth");

  assert.deepEqual(errors, [], "Browser console không được có runtime error");
  if (oldPhotoScreenshot) process.stdout.write(`Chapter 2 visual: ${oldPhotoScreenshot}\n`);
  process.stdout.write("Chapter 2 browser flow: OK (bell, mass, old photo, hangout, photo, 3 choices, reload)\n");
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  chrome.kill("SIGTERM");
}
