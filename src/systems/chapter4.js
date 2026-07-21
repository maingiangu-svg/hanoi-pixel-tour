import {
  CHAPTER_4_ID,
  CHAPTER_4_PREREQUISITE_TARGETS,
  CHAPTER_4_REQUIRED_CLUES,
  CHAPTER_4_REQUIRED_HISTORY_MARKS,
  CHAPTER_4_REQUIRED_HUMAN_MEMORIES,
  CHAPTER_4_REVEAL_POINT,
  CHAPTER_4_REVEAL_SCENE,
  CHAPTER_4_REVEAL_TIMELINE
} from "../data/chapter4.js";
import { MO_SCHEDULE } from "../data/npcSchedules.js";
import { runtime, state } from "../state.js";
import { saveGame } from "../storage.js";
import { getPlayerCenter } from "../utils/helpers.js";
import { playPortalResonance } from "./audioManager.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { isOverlayOpen, showMessage } from "./modal.js";
import { enterNpcDialogue } from "./dialogueView.js";
import { isMoCompanionActive } from "./moCompanion.js";
import { getTrackedObjective, setTrackedObjective } from "./navigation.js";
import { getStoryState, unlockStoryMap } from "./storyState.js";
import { updateHud } from "../render/renderUI.js";

const REVEAL_CUTSCENE_ID = "chapter4-origin-reveal";
const STORY_CLOCK_PAUSE_REASON = "story-chapter-4-reveal";
const MO_BRIDGE_ANCHOR = Object.freeze({ x: 1962, y: 574 });
let initialized = false;

export function initChapter4() {
  if (initialized) return;
  initialized = true;
  registerCutscene(REVEAL_CUTSCENE_ID, {
    allowSkip: false,
    scene: CHAPTER_4_REVEAL_SCENE,
    timeline: CHAPTER_4_REVEAL_TIMELINE,
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    cueHandler: handleRevealCue,
    onComplete: completeChapter4Reveal
  });
  installDebugHelpers();
}

export function startChapter4({ reset = false, reconcile = true } = {}) {
  initChapter4();
  const story = getStoryState();
  if (reconcile) reconcileCompletedStoryRewards(story);
  if (reset || !story.flags.chapter4 || story.flags.chapter4.completed) {
    story.flags.chapter4 = createChapterProgress();
  } else {
    story.flags.chapter4 = normalizeChapterProgress(story.flags.chapter4);
  }
  story.currentChapter = 4;
  story.currentScene = CHAPTER_4_ID;
  unlockStoryMap("longBien", { save: false });
  runtime.chapter4 = createRuntimeState();
  runtime.chapter4.active = true;
  applyObjective();
  saveGame();
  updateHud();
  return story.flags.chapter4;
}

export function hydrateChapter4() {
  initChapter4();
  const story = getStoryState();
  if (story.currentScene === "final-choice" && story.flags.chapter4?.portalOpen) {
    story.flags.chapter4 = normalizeChapterProgress(story.flags.chapter4);
    runtime.chapter4 = createRuntimeState();
    runtime.chapter4.portalWaiting = true;
    return true;
  }
  if (story.currentScene !== CHAPTER_4_ID || Number(story.currentChapter) !== 4 || story.flags.chapter4?.completed) {
    runtime.chapter4 = createRuntimeState();
    return false;
  }
  reconcileCompletedStoryRewards(story);
  story.flags.chapter4 = normalizeChapterProgress(story.flags.chapter4 || createChapterProgress());
  runtime.chapter4 = createRuntimeState();
  runtime.chapter4.active = true;
  applyObjective();
  return true;
}

export function updateChapter4() {
  if (isChapter4PortalWaiting()) {
    if (!runtime.chapter4) runtime.chapter4 = createRuntimeState();
    runtime.chapter4.portalWaiting = true;
    if (state.currentMapId === "longBien") updateChapter4Mo("portalWaiting");
    return;
  }
  if (!isChapter4Active()) {
    if (runtime.chapter4) runtime.chapter4.active = false;
    return;
  }

  const story = getStoryState();
  const needsBootstrap = !story.flags.chapter4;
  const progress = getChapter4Progress();
  const chapterRuntime = runtime.chapter4 || (runtime.chapter4 = createRuntimeState());
  chapterRuntime.active = true;
  chapterRuntime.revealInProgress = Boolean(progress.revealStarted && !progress.completed);
  if (state.currentMapId === "longBien") updateChapter4Mo("waitingForReveal");
  if (needsBootstrap) {
    applyObjective();
    saveGame();
  }
}

export function getChapter4Interactables(mapId) {
  if (!isChapter4Active() || isCutsceneActive()) return [];
  const prerequisites = getChapter4PrerequisiteStatus();
  if (!prerequisites.ready) {
    const missing = prerequisites.missing[0];
    if (missing.mapId !== mapId) return [];
    return [createStoryInteractable({
      id: `chapter4-recover-${missing.id}`,
      label: missing.label,
      mapId: missing.mapId,
      x: missing.x,
      y: missing.y,
      radius: 58,
      visibleRange: 230,
      kind: "recovery",
      recoveryId: missing.id,
      recoveryType: missing.type
    })];
  }
  if (mapId !== CHAPTER_4_REVEAL_POINT.mapId) return [];
  return [createStoryInteractable(CHAPTER_4_REVEAL_POINT)];
}

function createStoryInteractable(point) {
  return {
    type: "chapter4",
    object: {
      id: point.id,
      name: point.label,
      x: point.x - 12,
      y: point.y - 12,
      width: 24,
      height: 24
    },
    source: point,
    point: {
      id: point.id,
      x: point.x,
      y: point.y,
      radius: point.radius,
      visibleRange: point.visibleRange,
      labelOffsetX: 0,
      labelOffsetY: -38
    },
    priority: 0,
    range: point.radius
  };
}

export function handleChapter4Interaction(point) {
  if (!isChapter4Active() || !point || isCutsceneActive()) return false;
  if (point.kind === "recovery" && point.recoveryId) return recoverMissingPrerequisite(point);
  if (point.id !== CHAPTER_4_REVEAL_POINT.id) return false;
  const prerequisites = getChapter4PrerequisiteStatus();
  if (!prerequisites.ready) {
    const missing = prerequisites.missing[0];
    const progress = getChapter4Progress();
    progress.lastMissingId = missing.id;
    progress.blockedAttempts += 1;
    applyObjective();
    syncTrackedChapterObjective();
    saveGame();
    updateHud();
    showMessage(`Mơ: Chúng ta vẫn còn thiếu một mảnh ký ức. Hãy ${missing.label.toLowerCase()} trước.`);
    return true;
  }

  const progress = getChapter4Progress();
  if (progress.revealStarted || progress.completed) return true;
  progress.revealStarted = true;
  progress.lastMissingId = null;
  const started = startCutscene(REVEAL_CUTSCENE_ID, {
    sceneId: CHAPTER_4_ID,
    returnScene: CHAPTER_4_ID,
    chapter: 4,
    audioDuck: 0.16
  });
  if (!started) progress.revealStarted = false;
  saveGame();
  return started;
}

export function handleChapter4MoInteraction() {
  if (!isChapter4Active() || isMoCompanionActive()) return false;
  const prerequisites = getChapter4PrerequisiteStatus();
  if (!prerequisites.ready) {
    enterNpcDialogue(runtime.scheduledMo || "mo", {
      text: `Mình cần bạn nhớ lại thêm. Trước hết hãy ${prerequisites.missing[0].label.toLowerCase()}.`,
      expression: "worried"
    });
  } else {
    enterNpcDialogue(runtime.scheduledMo || "mo", {
      text: "Khi bạn sẵn sàng, hãy cùng mình đi tới giữa nhịp cầu.",
      expression: "determined",
      cameraShot: "close"
    });
  }
  return true;
}

export function getChapter4Objective() {
  if (isChapter4PortalWaiting()) return "Đứng cùng Mơ trước cánh cổng và chuẩn bị cho lựa chọn cuối cùng.";
  if (!isChapter4Active()) return "";
  const status = getChapter4PrerequisiteStatus();
  if (!status.ready) return status.missing[0].label;
  return "Tới điểm hẹn trên Cầu Long Biên cùng Mơ.";
}

export function getChapter4NavigationObjective() {
  if (!isChapter4Active()) return null;
  const status = getChapter4PrerequisiteStatus();
  if (!status.ready) {
    const missing = status.missing[0];
    return {
      id: "chapter4-current",
      type: "questPoint",
      mapId: missing.mapId,
      targetId: missing.targetId,
      targetPosition: { x: missing.x, y: missing.y },
      label: missing.label,
      description: "Bổ sung mảnh ký ức còn thiếu trước khi trở lại Cầu Long Biên.",
      questId: CHAPTER_4_ID,
      routeMode: "auto"
    };
  }
  const point = CHAPTER_4_REVEAL_POINT;
  return {
    id: "chapter4-current",
    type: "questPoint",
    mapId: point.mapId,
    targetId: point.id,
    targetPosition: { x: point.x, y: point.y },
    label: "Điểm hẹn trên Cầu Long Biên",
    description: getChapter4Objective(),
    questId: CHAPTER_4_ID,
    routeMode: "walking"
  };
}

export function getChapter4QuestEntries() {
  const story = getStoryState();
  if (!isChapter4Active() && !story.flags.chapter4) return [];
  const progress = getChapter4Progress();
  const prerequisites = getChapter4PrerequisiteStatus();
  return [{
    id: CHAPTER_4_ID,
    title: "Con đường trở về",
    description: "Ghép các Dấu ấn lịch sử và Ký ức con người để đối diện sự thật tại Cầu Long Biên.",
    done: Boolean(progress.completed),
    active: isChapter4Active() && !progress.completed,
    progress: progress.completed
      ? "Sự thật về nguồn gốc của bạn đã được hé lộ."
      : prerequisites.ready
        ? "Các mảnh ký ức đã đầy đủ. Hãy tới điểm hẹn trên cầu."
        : `Còn thiếu ${prerequisites.missing.length} mảnh cốt truyện.`,
    navigation: isChapter4Active() ? getChapter4NavigationObjective() : null
  }];
}

export function getChapter4PrerequisiteStatus() {
  const story = getStoryState();
  const missing = [];
  collectMissing(story.historyMarks, CHAPTER_4_REQUIRED_HISTORY_MARKS, "history", missing);
  collectMissing(story.humanMemories, CHAPTER_4_REQUIRED_HUMAN_MEMORIES, "memory", missing);
  collectMissing(story.memoryClues, CHAPTER_4_REQUIRED_CLUES, "clue", missing);
  return { ready: missing.length === 0, missing };
}

export function getChapter4Progress() {
  const story = getStoryState();
  story.flags.chapter4 = normalizeChapterProgress(story.flags.chapter4 || createChapterProgress());
  return story.flags.chapter4;
}

export function isChapter4Active() {
  const story = getStoryState();
  return story.currentScene === CHAPTER_4_ID && Number(story.currentChapter) === 4 && !story.flags.chapter4?.completed;
}

export function isChapter4PortalWaiting() {
  const story = getStoryState();
  return story.currentScene === "final-choice" && Boolean(story.flags.originRevealed) && Boolean(story.flags.chapter4?.portalOpen);
}

export function getChapter4RevealPoint() {
  return CHAPTER_4_REVEAL_POINT;
}

function completeChapter4Reveal() {
  const story = getStoryState();
  const progress = getChapter4Progress();
  if (progress.completed) return;
  progress.completed = true;
  progress.status = "completed";
  progress.revealCompleted = true;
  progress.portalOpen = true;
  story.flags.originRevealed = true;
  story.flags.chapter4Completed = true;
  story.flags.chapter4Objective = "Đứng trước cánh cổng và chuẩn bị cho lựa chọn cuối cùng.";
  story.currentScene = "final-choice";
  if (!story.completedChapters.includes("4")) story.completedChapters.push("4");
  if (runtime.chapter4) {
    runtime.chapter4.active = false;
    runtime.chapter4.portalWaiting = true;
    runtime.chapter4.revealInProgress = false;
  }
  saveGame();
  updateHud();
  showMessage("Sự thật đã được hé lộ. Cánh cổng chỉ còn mở trong thời gian ngắn.");
}

function applyObjective() {
  getStoryState().flags.chapter4Objective = getChapter4Objective();
}

function syncTrackedChapterObjective() {
  if (getTrackedObjective()?.id !== "chapter4-current") return;
  const objective = getChapter4NavigationObjective();
  if (objective) setTrackedObjective(objective, { silent: true });
}

function updateChapter4Mo(stateName) {
  if (isMoCompanionActive()) return;
  const mo = runtime.scheduledMo || {
    id: MO_SCHEDULE.id,
    name: MO_SCHEDULE.name,
    color: MO_SCHEDULE.color,
    width: 24,
    height: 46
  };
  mo.x = MO_BRIDGE_ANCHOR.x;
  mo.y = MO_BRIDGE_ANCHOR.y;
  mo.mapId = "longBien";
  mo.currentMap = "longBien";
  mo.visible = true;
  mo.interactable = isChapter4Active() && !isCutsceneActive();
  mo.companion = false;
  mo.ridingWithPlayer = false;
  mo.state = stateName;
  mo.activity = "waiting";
  mo.facing = MO_BRIDGE_ANCHOR.x > getPlayerCenter().x ? "left" : "right";
  runtime.scheduledMo = mo;
  runtime.chapter4.mo = mo;
}

function collectMissing(currentValues, requiredValues, type, output) {
  requiredValues.forEach((id) => {
    if (currentValues.includes(id)) return;
    const target = CHAPTER_4_PREREQUISITE_TARGETS[id];
    output.push({ id, type, ...target });
  });
}

function recoverMissingPrerequisite(point) {
  const status = getChapter4PrerequisiteStatus();
  const missing = status.missing[0];
  if (!missing || missing.id !== point.recoveryId) return false;
  const story = getStoryState();
  if (point.recoveryType === "history") addUnique(story.historyMarks, point.recoveryId);
  if (point.recoveryType === "memory") addUnique(story.humanMemories, point.recoveryId);
  if (point.recoveryType === "clue") addUnique(story.memoryClues, point.recoveryId);
  const progress = getChapter4Progress();
  progress.lastMissingId = null;
  progress.updatedAtGameMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  applyObjective();
  syncTrackedChapterObjective();
  saveGame();
  updateHud();
  showMessage(`Ký ức đã rõ lại: ${point.label}.`);
  return true;
}

function reconcileCompletedStoryRewards(story) {
  const completed = new Set(story.completedChapters.map(String));
  if (story.introCompleted) addUnique(story.memoryClues, "clue-instinctive-hoan-kiem-name");
  if (story.flags.chapter1Completed || completed.has("1")) {
    addUnique(story.historyMarks, "history-hoan-kiem");
    addUnique(story.humanMemories, "memory-tea-stall");
    addUnique(story.memoryClues, "clue-childhood-song");
  }
  if (story.flags.chapter2Completed || completed.has("2")) {
    addUnique(story.historyMarks, "history-cathedral");
    addUnique(story.humanMemories, "memory-mo-and-children");
    addUnique(story.memoryClues, "clue-church-bell-memory");
    addUnique(story.memoryClues, "clue-mo-old-photo");
  }
  if (story.flags.chapter3Completed || completed.has("3")) {
    addUnique(story.historyMarks, "history-ba-dinh");
    addUnique(story.historyMarks, "history-van-mieu");
    addUnique(story.humanMemories, "memory-held-hand");
    addUnique(story.humanMemories, "memory-school-trip");
    addUnique(story.memoryClues, "clue-modern-school-lesson");
    addUnique(story.memoryClues, "clue-long-bien-disappearance");
  }
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

function handleRevealCue(cue) {
  if (cue === "portalResonance") playPortalResonance();
}

function createChapterProgress() {
  return {
    version: 1,
    status: "active",
    revealStarted: false,
    revealCompleted: false,
    portalOpen: false,
    completed: false,
    blockedAttempts: 0,
    lastMissingId: null,
    updatedAtGameMinute: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
}

function normalizeChapterProgress(raw) {
  const base = createChapterProgress();
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    ...base,
    ...source,
    revealStarted: Boolean(source.revealStarted),
    revealCompleted: Boolean(source.revealCompleted),
    portalOpen: Boolean(source.portalOpen),
    completed: Boolean(source.completed),
    blockedAttempts: Math.max(0, Math.floor(Number(source.blockedAttempts) || 0)),
    lastMissingId: typeof source.lastMissingId === "string" ? source.lastMissingId : null
  };
}

function createRuntimeState() {
  return { active: false, revealInProgress: false, portalWaiting: false, mo: null };
}

function installDebugHelpers() {
  if (typeof window === "undefined") return;
  window.getChapter4StateForDebug = () => ({
    active: isChapter4Active(),
    progress: { ...getChapter4Progress() },
    prerequisites: getChapter4PrerequisiteStatus(),
    objective: getChapter4Objective(),
    portalWaiting: isChapter4PortalWaiting()
  });
  window.startChapter4ForDebug = () => startChapter4({ reset: true });
}
