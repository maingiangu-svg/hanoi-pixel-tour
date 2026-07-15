import {
  CHAPTER_2_CLUES,
  CHAPTER_2_CUTSCENES,
  CHAPTER_2_ID,
  CHAPTER_2_MEMORY_SCENE,
  CHAPTER_2_OBJECTIVES,
  CHAPTER_2_POINTS,
  CHAPTER_2_QUESTS,
  CHAPTER_2_REWARDS,
  CHAPTER_2_STAGE_ORDER
} from "../data/chapter2.js";
import { runtime, state } from "../state.js";
import { saveGame } from "../storage.js";
import { findLandmark, getPlayerCenter, isQuizCorrect } from "../utils/helpers.js";
import { updateHud } from "../render/renderUI.js";
import { playBellChime } from "./audioManager.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { discoverLandmark } from "./journal.js";
import { closeInfoModal, isOverlayOpen, openLandmarkInfoPanel, showMessage } from "./modal.js";
import { isMoCompanionActive } from "./moCompanion.js";
import { getTrackedObjective, setTrackedObjective } from "./navigation.js";
import { getMoChildren, isMassInProgress } from "./npcSchedule.js";
import { openQuiz } from "./quiz.js";
import {
  addHistoryMark,
  addHumanMemory,
  addMemoryClue,
  getStoryState,
  unlockStoryMap
} from "./storyState.js";

const CUTSCENE_PREFIX = "chapter2";
const STORY_CLOCK_PAUSE_REASON = "story-chapter-2-cutscene";
const STORY_PHOTO_SPOT_ID = "photo-ho-guom";
const AUTO_TRIGGER_STAGES = new Set(["enterChurch", "relationshipChoice", "chapterComplete"]);
const INTERACTION_STAGES = new Set([
  "talkPriest",
  "cathedralHistory",
  "cathedralQuiz",
  "helpChildren",
  "observeMass",
  "oldPhoto",
  "hangoutDestination"
]);

let initialized = false;

export function initChapter2() {
  if (initialized) return;
  initialized = true;
  registerChapterCutscene("churchBell", "talkPriest", {
    scene: CHAPTER_2_MEMORY_SCENE,
    onComplete: () => {
      const story = getStoryState();
      addMemoryClue(CHAPTER_2_CLUES.churchBell, { save: false });
      story.flags.playerTurtlePendant = true;
      getChapter2Progress().bellMemorySeen = true;
    }
  });
  registerChapterCutscene("priest", "cathedralHistory", {
    onComplete: () => { getChapter2Progress().priestConversation = true; }
  });
  registerChapterCutscene("children", "observeMass", {
    onComplete: () => {
      addHumanMemory(CHAPTER_2_REWARDS.humanMemory, { save: false });
      getChapter2Progress().childrenHelped = true;
    }
  });
  registerChapterCutscene("mass", "oldPhoto", {
    onComplete: () => { getChapter2Progress().massObserved = true; }
  });
  registerChapterCutscene("oldPhoto", "hangoutInvite", {
    scene: CHAPTER_2_MEMORY_SCENE,
    onComplete: () => {
      const story = getStoryState();
      addMemoryClue(CHAPTER_2_CLUES.oldPhoto, { save: false });
      story.flags["mo-suspects-player-origin"] = true;
      getChapter2Progress().oldPhotoSeen = true;
    }
  });
  registerChapterCutscene("hangoutDestination", "hangoutPhoto", {
    onComplete: () => { getChapter2Progress().hangoutDestinationVisited = true; }
  });
  registerChapterCutscene("relationship", "chapterComplete", {
    onComplete: () => {
      const progress = getChapter2Progress();
      progress.relationshipChoice = getStoryState().choices.chapter2RelationshipChoice || null;
    }
  });
  registerCutscene(`${CUTSCENE_PREFIX}-finale`, {
    allowSkip: false,
    scene: CHAPTER_2_MEMORY_SCENE,
    timeline: CHAPTER_2_CUTSCENES.finale,
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    onComplete: completeChapter2
  });
  installDebugHelpers();
}

export function startChapter2({ reset = false } = {}) {
  initChapter2();
  const story = getStoryState();
  if (reset || !story.flags.chapter2 || story.flags.chapter2.completed) {
    story.flags.chapter2 = createChapterProgress();
  } else {
    story.flags.chapter2 = normalizeChapterProgress(story.flags.chapter2);
  }
  story.currentChapter = 2;
  story.currentScene = CHAPTER_2_ID;
  unlockStoryMap("hoanKiem", { save: false });
  unlockStoryMap("churchInterior", { save: false });
  runtime.chapter2 = createRuntimeState();
  applyObjective(story.flags.chapter2.stage);
  saveGame();
  updateHud();
  return story.flags.chapter2;
}

export function hydrateChapter2() {
  initChapter2();
  const story = getStoryState();
  if (story.currentScene !== CHAPTER_2_ID || Number(story.currentChapter) !== 2 || story.flags.chapter2?.completed) {
    runtime.chapter2 = createRuntimeState();
    return false;
  }
  story.flags.chapter2 = normalizeChapterProgress(story.flags.chapter2 || createChapterProgress());
  runtime.chapter2 = createRuntimeState();
  runtime.chapter2.active = true;
  applyObjective(story.flags.chapter2.stage);
  return true;
}

export function updateChapter2() {
  if (!isChapter2Active()) {
    if (runtime.chapter2) runtime.chapter2.active = false;
    return;
  }

  const needsBootstrap = !getStoryState().flags.chapter2;
  const progress = getChapter2Progress();
  const chapterRuntime = runtime.chapter2 || (runtime.chapter2 = createRuntimeState());
  chapterRuntime.active = true;
  chapterRuntime.stage = progress.stage;
  if (needsBootstrap) {
    applyObjective(progress.stage);
    saveGame();
  }

  if (progress.stage === "enterChurch" && state.currentMapId === "hoanKiem" && !isOverlayOpen()) {
    const point = CHAPTER_2_POINTS.enterChurch;
    const center = getPlayerCenter();
    if (Math.hypot(center.x - point.x, center.y - point.y) <= point.radius) {
      startChapterCutscene("churchBell");
      return;
    }
  }

  if (progress.stage === "cathedralQuiz" && !runtime.activeQuiz && isQuizCorrect("nhaThoLon")) {
    completeCathedralHistory();
    return;
  }

  if (progress.stage === "hangoutInvite" && isMoCompanionActive()) {
    progress.hangoutStarted = true;
    advanceChapter2Stage("hangoutDestination", "Mơ đang đi cùng bạn. Hãy đưa Mơ tới Hồ Gươm.");
    return;
  }

  if (["hangoutDestination", "hangoutPhoto"].includes(progress.stage) && progress.hangoutStarted && !isMoCompanionActive()) {
    progress.hangoutStarted = false;
    progress.hangoutDestinationVisited = false;
    advanceChapter2Stage("hangoutInvite", "Buổi đi chơi chưa hoàn thành. Bạn có thể mời Mơ đi lại khi cô rảnh.");
    return;
  }

  if (progress.stage === "hangoutPhoto" && hasPhotoWithMo()) {
    progress.photoWithMo = true;
    advanceChapter2Stage("returnMo", "Bức ảnh cùng Mơ đã được lưu. Hãy đưa Mơ về Nhà thờ Lớn.");
    return;
  }

  if (progress.stage === "returnMo" && progress.hangoutStarted && !isMoCompanionActive()) {
    progress.moReturned = true;
    advanceChapter2Stage("relationshipChoice");
    return;
  }

  if (progress.stage === "relationshipChoice" && !progress.relationshipStarted && !isOverlayOpen()) {
    if (startChapterCutscene("relationship")) {
      progress.relationshipStarted = true;
      saveGame();
    }
    return;
  }

  if (progress.stage === "chapterComplete" && !progress.finaleStarted && canCompleteChapter2() && !isOverlayOpen()) {
    if (startChapterCutscene("finale")) {
      progress.finaleStarted = true;
      saveGame();
    }
  }
}

export function getChapter2Interactables(mapId) {
  if (!isChapter2Active()) return [];
  const progress = getChapter2Progress();
  if (!INTERACTION_STAGES.has(progress.stage)) return [];
  const point = getCurrentChapter2Point();
  if (!point || point.mapId !== mapId) return [];
  return [{
    type: "chapter2",
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
      labelOffsetY: -32
    },
    priority: 0,
    range: point.radius
  }];
}

export function handleChapter2Interaction(point) {
  if (!isChapter2Active() || !point || point.id !== getCurrentChapter2Point()?.id) return false;
  const stage = getChapter2Progress().stage;

  if (stage === "talkPriest") {
    if (isMassInProgress()) {
      showMessage("Thánh lễ đang diễn ra. Hãy nói chuyện với Cha xứ sau giờ lễ.");
      return true;
    }
    return startChapterCutscene("priest");
  }
  if (stage === "cathedralHistory" || stage === "cathedralQuiz") return openCathedralHistory();
  if (stage === "helpChildren") {
    if (!isMoWithChildren()) {
      showMessage("Mơ chơi với bọn trẻ vào buổi sáng và chiều. Hãy quay lại sân nhỏ khi Mơ có mặt.");
      return true;
    }
    return startChapterCutscene("children");
  }
  if (stage === "observeMass") {
    if (!isMassInProgress()) {
      showMessage("Thánh lễ diễn ra từ 18:00 đến 19:00. Hãy quay lại đúng giờ.");
      return true;
    }
    return startChapterCutscene("mass");
  }
  if (stage === "oldPhoto") {
    if (!isMoAvailableAtHome()) {
      showMessage("Mơ vẫn đang trên đường rời Nhà thờ. Hãy gặp cô ở sân nhỏ sau 19:12.");
      return true;
    }
    return startChapterCutscene("oldPhoto");
  }
  if (stage === "hangoutDestination") {
    if (!isMoCompanionActive()) {
      showMessage("Hãy mời Mơ đi cùng trước khi tới Hồ Gươm.");
      return true;
    }
    return startChapterCutscene("hangoutDestination");
  }
  return false;
}

export function handleChapter2MoInteraction(npc) {
  if (!isChapter2Active() || isMoCompanionActive()) return false;
  const stage = getChapter2Progress().stage;
  if (stage === "hangoutInvite") return false;
  showMessage(getChapter2MoDialogue(npc));
  return true;
}

export function getChapter2MoDialogue(npc) {
  if (!isChapter2Active() || !npc) return "";
  const stage = getChapter2Progress().stage;
  if (stage === "oldPhoto") return "Sau giờ lễ gặp mình ở sân nhỏ nhé. Mình muốn xem lại một chiếc hộp cũ của bà.";
  if (stage === "hangoutInvite") return "Hôm nay mình rảnh rồi. Nếu bạn muốn, chúng ta có thể đi dạo một chút.";
  if (npc.state === "washing") return "Mình giặt nốt chỗ quần áo này đã. Lát nữa bọn trẻ sẽ ra sân.";
  if (npc.state === "resting") return "Mình nghỉ một chút. Chuyện tiếng chuông ban nãy vẫn làm bạn bối rối à?";
  if (npc.state === "walkingToChurch" || npc.state === "enteringChurch") return "Sắp đến giờ lễ rồi, mình phải vào Nhà thờ.";
  if (npc.state === "attendingMass") return "Mình đang dự lễ, lát nữa nói chuyện nhé.";
  if (npc.state === "leavingChurch" || npc.state === "returningToChildren") return "Lễ vừa xong. Mình sẽ gặp bạn ở sân nhỏ sau ít phút.";
  return "Bọn trẻ thích nghe chuyện của bạn lắm. Có lẽ ở cạnh chúng, bạn sẽ nhớ thêm điều gì đó.";
}

export function getChapter2Objective() {
  if (!isChapter2Active()) return "";
  return CHAPTER_2_OBJECTIVES[getChapter2Progress().stage] || "Khám phá Nhà thờ Lớn cùng Mơ.";
}

export function getChapter2NavigationObjective() {
  if (!isChapter2Active()) return null;
  const progress = getChapter2Progress();
  let point = getCurrentChapter2Point();
  if (progress.stage === "hangoutInvite" && runtime.scheduledMo?.visible) {
    point = {
      ...CHAPTER_2_POINTS.hangoutInvite,
      mapId: runtime.scheduledMo.mapId || runtime.scheduledMo.currentMap || "hoanKiem",
      x: Number(runtime.scheduledMo.x) || CHAPTER_2_POINTS.hangoutInvite.x,
      y: Number(runtime.scheduledMo.y) || CHAPTER_2_POINTS.hangoutInvite.y
    };
  }
  if (!point || AUTO_TRIGGER_STAGES.has(progress.stage) && progress.stage !== "enterChurch") return null;
  return {
    id: "chapter2-current",
    type: progress.stage === "hangoutPhoto" ? "photoSpot" : progress.stage === "hangoutInvite" ? "npc" : "questPoint",
    mapId: point.mapId,
    targetId: progress.stage === "hangoutPhoto" ? STORY_PHOTO_SPOT_ID : progress.stage === "hangoutInvite" ? "mo" : point.id,
    targetPosition: { x: point.x, y: point.y },
    label: point.label,
    description: getChapter2Objective(),
    questId: CHAPTER_2_ID,
    routeMode: progress.stage === "returnMo" ? "auto" : "walking"
  };
}

export function getChapter2QuestEntries() {
  if (!isChapter2Active() && !getStoryState().flags.chapter2) return [];
  const progress = getChapter2Progress();
  const stageIndex = CHAPTER_2_STAGE_ORDER.indexOf(progress.stage);
  return CHAPTER_2_QUESTS.map((quest) => {
    const finalStageIndex = Math.max(...quest.stages.map((stage) => CHAPTER_2_STAGE_ORDER.indexOf(stage)));
    const done = getQuestCompletion(quest.id, progress);
    const active = !done && quest.stages.includes(progress.stage);
    return {
      ...quest,
      done,
      active,
      progress: done ? "Hoàn thành" : stageIndex <= finalStageIndex ? getChapter2Objective() : "Chưa mở",
      navigation: active ? getChapter2NavigationObjective() : null
    };
  });
}

export function getCurrentChapter2Point() {
  if (!isChapter2Active()) return null;
  return CHAPTER_2_POINTS[getChapter2Progress().stage] || null;
}

export function getChapter2Progress() {
  const story = getStoryState();
  story.flags.chapter2 = normalizeChapterProgress(story.flags.chapter2 || createChapterProgress());
  return story.flags.chapter2;
}

export function isChapter2Active() {
  const story = getStoryState();
  return story.currentScene === CHAPTER_2_ID && Number(story.currentChapter) === 2 && !story.flags.chapter2?.completed;
}

export function isChapter2HangoutInviteStage() {
  return isChapter2Active() && getChapter2Progress().stage === "hangoutInvite";
}

function registerChapterCutscene(key, nextStage, options = {}) {
  registerCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    allowSkip: false,
    scene: options.scene || null,
    timeline: CHAPTER_2_CUTSCENES[key],
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    cueHandler: handleChapterCue,
    onComplete: () => {
      if (typeof options.onComplete === "function") options.onComplete();
      advanceChapter2Stage(nextStage, getStageCompletionMessage(key));
    }
  });
}

function startChapterCutscene(key) {
  return startCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    sceneId: CHAPTER_2_ID,
    returnScene: CHAPTER_2_ID,
    chapter: 2,
    audioDuck: ["churchBell", "oldPhoto"].includes(key) ? 0.2 : 0.5
  });
}

function handleChapterCue(cue) {
  if (cue === "churchBell") playBellChime();
}

function openCathedralHistory() {
  const landmark = findLandmark("nhaThoLon");
  if (!landmark) return false;
  discoverLandmark(landmark.id);
  const alreadyCorrect = isQuizCorrect("nhaThoLon");
  openLandmarkInfoPanel(landmark, {
    statusNote: alreadyCorrect
      ? "Bạn đã hiểu lớp giao thoa kiến trúc và đô thị quanh Nhà thờ Lớn."
      : "Đọc kỹ lịch sử công trình rồi trả lời câu hỏi để nhận Dấu ấn lịch sử.",
    actions: [{
      label: alreadyCorrect ? "Ghi lại Dấu ấn lịch sử" : "Trả lời câu hỏi lịch sử",
      className: "primary-choice",
      onClick: () => {
        closeInfoModal();
        if (alreadyCorrect) {
          completeCathedralHistory();
          return;
        }
        if (getChapter2Progress().stage !== "cathedralQuiz") advanceChapter2Stage("cathedralQuiz");
        openQuiz("nhaThoLon", { landmarkId: "nhaThoLon", storyChapter: CHAPTER_2_ID });
      }
    }]
  });
  return true;
}

function completeCathedralHistory() {
  const progress = getChapter2Progress();
  if (progress.historyMarkAwarded) return false;
  addHistoryMark(CHAPTER_2_REWARDS.historyMark, { save: false });
  progress.historyMarkAwarded = true;
  advanceChapter2Stage("helpChildren", "Bạn nhận Dấu ấn lịch sử: Nhà thờ Lớn Hà Nội.");
  return true;
}

function advanceChapter2Stage(nextStage, message = "") {
  if (!CHAPTER_2_STAGE_ORDER.includes(nextStage)) return false;
  const progress = getChapter2Progress();
  progress.stage = nextStage;
  progress.updatedAtGameMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  if (nextStage !== "relationshipChoice") progress.relationshipStarted = false;
  applyObjective(nextStage);
  syncTrackedChapterObjective();
  saveGame();
  updateHud();
  if (message) showMessage(message);
  return true;
}

function applyObjective(stage) {
  getStoryState().flags.chapter2Objective = CHAPTER_2_OBJECTIVES[stage] || "Khám phá Nhà thờ Lớn cùng Mơ.";
}

function syncTrackedChapterObjective() {
  if (getTrackedObjective()?.id !== "chapter2-current") return;
  const objective = getChapter2NavigationObjective();
  if (objective) setTrackedObjective(objective, { silent: true });
}

function isMoWithChildren() {
  const mo = runtime.scheduledMo;
  return Boolean(
    !isMoCompanionActive() &&
    mo?.visible &&
    (mo.mapId === "hoanKiem" || mo.currentMap === "hoanKiem") &&
    mo.state === "playingWithChildren" &&
    getMoChildren().length > 0
  );
}

function isMoAvailableAtHome() {
  const mo = runtime.scheduledMo;
  return Boolean(
    !isMoCompanionActive() &&
    mo?.visible &&
    (mo.mapId === "hoanKiem" || mo.currentMap === "hoanKiem") &&
    ["playingWithChildren", "washing", "resting"].includes(mo.state)
  );
}

function hasPhotoWithMo() {
  return Boolean(state.photoAlbum?.photos?.[STORY_PHOTO_SPOT_ID]?.withMo);
}

function getQuestCompletion(questId, progress) {
  const story = getStoryState();
  if (questId === "chapter2-bell") return progress.bellMemorySeen && progress.priestConversation;
  if (questId === "chapter2-cathedral-history") {
    return story.historyMarks.includes(CHAPTER_2_REWARDS.historyMark) && story.humanMemories.includes(CHAPTER_2_REWARDS.humanMemory);
  }
  if (questId === "chapter2-mass") return progress.massObserved && progress.oldPhotoSeen;
  if (questId === "chapter2-hangout") return progress.moReturned && Boolean(progress.relationshipChoice);
  return false;
}

function canCompleteChapter2() {
  const story = getStoryState();
  const progress = getChapter2Progress();
  return progress.bellMemorySeen &&
    progress.priestConversation &&
    progress.massObserved &&
    progress.oldPhotoSeen &&
    progress.childrenHelped &&
    progress.photoWithMo &&
    progress.moReturned &&
    Boolean(progress.relationshipChoice) &&
    story.historyMarks.includes(CHAPTER_2_REWARDS.historyMark) &&
    story.humanMemories.includes(CHAPTER_2_REWARDS.humanMemory) &&
    story.memoryClues.includes(CHAPTER_2_CLUES.churchBell) &&
    story.memoryClues.includes(CHAPTER_2_CLUES.oldPhoto);
}

function completeChapter2() {
  const story = getStoryState();
  const progress = getChapter2Progress();
  progress.completed = true;
  progress.status = "completed";
  progress.stage = "completed";
  progress.finaleStarted = false;
  story.flags.chapter2Completed = true;
  story.flags.chapter2BaDinhUnlocked = true;
  story.flags.chapter2VanMieuUnlocked = true;
  story.flags.chapter2Objective = "Tới Ba Đình hoặc Văn Miếu để tiếp tục tìm ký ức.";
  if (!story.completedChapters.includes("2")) story.completedChapters.push("2");
  story.currentChapter = 3;
  story.currentScene = "chapter-3";
  unlockStoryMap("baDinh", { save: false });
  runtime.chapter2.active = false;
  saveGame();
  updateHud();
  showMessage("Đã mở khóa: Ba Đình và Văn Miếu");
}

function getStageCompletionMessage(key) {
  if (key === "churchBell") return "Một ký ức cũ vừa thức dậy cùng tiếng chuông.";
  if (key === "children") return "Bạn nhận Ký ức con người: Mơ và bọn trẻ.";
  if (key === "oldPhoto") return "Mơ đã cất lại bức ảnh cũ mà không nói gì với bạn.";
  if (key === "hangoutDestination") return "Hãy chụp một bức ảnh cùng Mơ tại Hồ Gươm.";
  return "";
}

function createChapterProgress() {
  return {
    version: 1,
    status: "active",
    stage: "enterChurch",
    bellMemorySeen: false,
    priestConversation: false,
    historyMarkAwarded: false,
    childrenHelped: false,
    massObserved: false,
    oldPhotoSeen: false,
    hangoutStarted: false,
    hangoutDestinationVisited: false,
    photoWithMo: false,
    moReturned: false,
    relationshipChoice: null,
    relationshipStarted: false,
    finaleStarted: false,
    completed: false,
    updatedAtGameMinute: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
}

function normalizeChapterProgress(raw) {
  const base = createChapterProgress();
  const source = raw && typeof raw === "object" ? raw : {};
  const stage = CHAPTER_2_STAGE_ORDER.includes(source.stage) || source.stage === "completed" ? source.stage : base.stage;
  return {
    ...base,
    ...source,
    stage,
    relationshipChoice: typeof source.relationshipChoice === "string" ? source.relationshipChoice : null,
    completed: Boolean(source.completed),
    finaleStarted: Boolean(source.finaleStarted),
    relationshipStarted: Boolean(source.relationshipStarted)
  };
}

function createRuntimeState() {
  return { active: false, stage: null };
}

function installDebugHelpers() {
  if (typeof window === "undefined") return;
  window.getChapter2StateForDebug = () => ({
    active: isChapter2Active(),
    progress: { ...getChapter2Progress() },
    objective: getChapter2Objective(),
    historyMarks: [...getStoryState().historyMarks],
    humanMemories: [...getStoryState().humanMemories],
    clues: [...getStoryState().memoryClues]
  });
  window.advanceChapter2ForDebug = (stage) => advanceChapter2Stage(stage);
}
