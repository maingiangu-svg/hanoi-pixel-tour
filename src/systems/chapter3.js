import {
  CHAPTER_3_CLUES,
  CHAPTER_3_CUTSCENES,
  CHAPTER_3_ID,
  CHAPTER_3_MEMORY_SCENE,
  CHAPTER_3_OBJECTIVES,
  CHAPTER_3_POINTS,
  CHAPTER_3_QUESTS,
  CHAPTER_3_REWARDS,
  CHAPTER_3_STAGE_ORDER
} from "../data/chapter3.js";
import { MO_SCHEDULE } from "../data/npcSchedules.js";
import { runtime, state } from "../state.js";
import { saveGame } from "../storage.js";
import { findLandmark, getPlayerCenter, isQuizCorrect } from "../utils/helpers.js";
import { updateHud } from "../render/renderUI.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { discoverLandmark } from "./journal.js";
import { closeInfoModal, isOverlayOpen, openLandmarkInfoPanel, showMessage } from "./modal.js";
import { enterNpcDialogue } from "./dialogueView.js";
import { isMoCompanionActive } from "./moCompanion.js";
import { getTrackedObjective, setTrackedObjective } from "./navigation.js";
import { openQuiz } from "./quiz.js";
import {
  addHistoryMark,
  addHumanMemory,
  addMemoryClue,
  getStoryState,
  unlockStoryMap
} from "./storyState.js";

const CUTSCENE_PREFIX = "chapter3";
const STORY_CLOCK_PAUSE_REASON = "story-chapter-3-cutscene";
const AUTO_STAGES = new Set([
  "focusChoice",
  "tourGroupChoice",
  "schoolGroupChoice",
  "fearChoice",
  "moRecognition",
  "chapterComplete"
]);
const INTERACTION_STAGES = new Set([
  "langBacHistory",
  "langBacQuiz",
  "onePillarHistory",
  "onePillarQuiz",
  "guideHistory",
  "guideQuiz",
  "vanMieuGate",
  "khueVanMemory",
  "stelaeHistory",
  "vanMieuQuiz",
  "oldWitness"
]);
const QUIZ_STAGES = Object.freeze({
  langBacQuiz: { quizId: "langBac", nextStage: "onePillarHistory" },
  onePillarQuiz: { quizId: "chuaMotCot", nextStage: "guideHistory" },
  guideQuiz: { quizId: "guideQuocKhanh", nextStage: "focusChoice", reward: "baDinh" },
  vanMieuQuiz: { quizId: "studentVanMieu", nextStage: "schoolGroupChoice", reward: "vanMieu" }
});
const MO_ANCHORS = Object.freeze({
  baDinhArrival: { x: 816, y: 716 },
  langBacHistory: { x: 1200, y: 430 },
  langBacQuiz: { x: 1200, y: 430 },
  onePillarHistory: { x: 1660, y: 568 },
  onePillarQuiz: { x: 1660, y: 568 },
  guideHistory: { x: 688, y: 842 },
  guideQuiz: { x: 688, y: 842 },
  focusChoice: { x: 688, y: 842 },
  tourGroupChoice: { x: 748, y: 820 },
  vanMieuGate: { x: 1152, y: 1390 },
  khueVanMemory: { x: 1154, y: 1632 },
  stelaeHistory: { x: 1154, y: 1806 },
  vanMieuQuiz: { x: 1154, y: 1806 },
  schoolGroupChoice: { x: 1248, y: 1762 },
  fearChoice: { x: 1248, y: 1762 },
  moRecognition: { x: 1248, y: 1762 },
  oldWitness: { x: 1380, y: 1800 },
  chapterComplete: { x: 1380, y: 1800 }
});

let initialized = false;

export function initChapter3() {
  if (initialized) return;
  initialized = true;
  registerChapterCutscene("baDinhArrival", "langBacHistory", {
    scene: CHAPTER_3_MEMORY_SCENE,
    onComplete: () => {
      const progress = getChapter3Progress();
      addHumanMemory(CHAPTER_3_REWARDS.heldHandMemory, { save: false });
      addMemoryClue(CHAPTER_3_CLUES.heldHand, { save: false });
      progress.baDinhMemorySeen = true;
    }
  });
  registerChapterCutscene("guideHistory", "guideQuiz", {
    onComplete: () => { getChapter3Progress().guideHeard = true; }
  });
  registerChapterCutscene("focusChoice", "tourGroupChoice", {
    onComplete: () => {
      getChapter3Progress().focusChoice = getStoryState().choices.chapter3FocusChoice || null;
    }
  });
  registerChapterCutscene("tourGroupChoice", "vanMieuGate", {
    onComplete: () => {
      getChapter3Progress().tourGroupChoice = getStoryState().choices.chapter3TourGroupChoice || null;
    }
  });
  registerChapterCutscene("vanMieuGate", "khueVanMemory", {
    onComplete: () => { getChapter3Progress().vanMieuGateVisited = true; }
  });
  registerChapterCutscene("khueVanMemory", "stelaeHistory", {
    scene: CHAPTER_3_MEMORY_SCENE,
    onComplete: () => {
      const progress = getChapter3Progress();
      addHumanMemory(CHAPTER_3_REWARDS.schoolTripMemory, { save: false });
      addMemoryClue(CHAPTER_3_CLUES.schoolLesson, { save: false });
      progress.schoolMemorySeen = true;
    }
  });
  registerChapterCutscene("schoolGroupChoice", "fearChoice", {
    onComplete: () => {
      const progress = getChapter3Progress();
      progress.schoolGroupChoice = getStoryState().choices.chapter3SchoolGroupChoice || null;
      addMemoryClue(CHAPTER_3_CLUES.pendantThread, { save: false });
      progress.pendantDetailRemembered = true;
    }
  });
  registerChapterCutscene("fearChoice", "moRecognition", {
    onComplete: () => {
      getChapter3Progress().fearChoice = getStoryState().choices.chapter3FearChoice || null;
    }
  });
  registerChapterCutscene("moRecognition", "oldWitness", {
    onComplete: () => {
      const story = getStoryState();
      story.flags["mo-knows-player-origin"] = true;
      getChapter3Progress().moRecognitionSeen = true;
    }
  });
  registerChapterCutscene("oldWitness", "chapterComplete", {
    scene: CHAPTER_3_MEMORY_SCENE,
    onComplete: () => {
      addMemoryClue(CHAPTER_3_CLUES.longBienDisappearance, { save: false });
      getChapter3Progress().longBienClueFound = true;
    }
  });
  registerCutscene(`${CUTSCENE_PREFIX}-finale`, {
    allowSkip: false,
    timeline: CHAPTER_3_CUTSCENES.finale,
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    onComplete: completeChapter3
  });
  installDebugHelpers();
}

export function startChapter3({ reset = false } = {}) {
  initChapter3();
  const story = getStoryState();
  if (reset || !story.flags.chapter3 || story.flags.chapter3.completed) {
    story.flags.chapter3 = createChapterProgress();
  } else {
    story.flags.chapter3 = normalizeChapterProgress(story.flags.chapter3);
  }
  story.currentChapter = 3;
  story.currentScene = CHAPTER_3_ID;
  unlockStoryMap("baDinh", { save: false });
  runtime.chapter3 = createRuntimeState();
  applyObjective(story.flags.chapter3.stage);
  saveGame();
  updateHud();
  return story.flags.chapter3;
}

export function hydrateChapter3() {
  initChapter3();
  const story = getStoryState();
  if (story.currentScene !== CHAPTER_3_ID || Number(story.currentChapter) !== 3 || story.flags.chapter3?.completed) {
    runtime.chapter3 = createRuntimeState();
    return false;
  }
  story.flags.chapter3 = normalizeChapterProgress(story.flags.chapter3 || createChapterProgress());
  runtime.chapter3 = createRuntimeState();
  runtime.chapter3.active = true;
  applyObjective(story.flags.chapter3.stage);
  return true;
}

export function updateChapter3() {
  if (!isChapter3Active()) {
    if (runtime.chapter3) runtime.chapter3.active = false;
    return;
  }

  const story = getStoryState();
  const needsBootstrap = !story.flags.chapter3;
  const progress = getChapter3Progress();
  const chapterRuntime = runtime.chapter3 || (runtime.chapter3 = createRuntimeState());
  chapterRuntime.active = true;
  chapterRuntime.stage = progress.stage;
  if (needsBootstrap) {
    applyObjective(progress.stage);
    saveGame();
  }

  if (state.currentMapId === "baDinh") updateChapter3Mo(progress.stage);

  const quizStage = QUIZ_STAGES[progress.stage];
  if (quizStage && !runtime.activeQuiz && isQuizCorrect(quizStage.quizId)) {
    completeQuizStage(progress.stage, quizStage);
    return;
  }

  if (progress.stage === "baDinhArrival" && state.currentMapId === "baDinh" && !isOverlayOpen() && !isCutsceneActive()) {
    const point = CHAPTER_3_POINTS.baDinhArrival;
    const center = getPlayerCenter();
    if (Math.hypot(center.x - point.x, center.y - point.y) <= point.radius) {
      startChapterCutscene("baDinhArrival");
    }
    return;
  }

  if (AUTO_STAGES.has(progress.stage) && state.currentMapId === "baDinh" && !isOverlayOpen() && !isCutsceneActive()) {
    const key = progress.stage === "chapterComplete" ? "finale" : progress.stage;
    if (chapterRuntime.autoStage !== progress.stage && startChapterCutscene(key)) {
      chapterRuntime.autoStage = progress.stage;
    }
  }
}

export function getChapter3Interactables(mapId) {
  if (!isChapter3Active() || !INTERACTION_STAGES.has(getChapter3Progress().stage)) return [];
  const point = getCurrentChapter3Point();
  if (!point || point.mapId !== mapId) return [];
  return [{
    type: "chapter3",
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

export function handleChapter3Interaction(point) {
  if (!isChapter3Active() || !point || point.id !== getCurrentChapter3Point()?.id) return false;
  const stage = getChapter3Progress().stage;
  if (stage === "langBacHistory" || stage === "langBacQuiz") {
    return openHistoryLandmark("langBac", "langBacQuiz");
  }
  if (stage === "onePillarHistory" || stage === "onePillarQuiz") {
    return openHistoryLandmark("chuaMotCot", "onePillarQuiz");
  }
  if (stage === "guideHistory") return startChapterCutscene("guideHistory");
  if (stage === "guideQuiz") return openStoryQuiz("guideQuocKhanh", "guideBaDinh");
  if (stage === "vanMieuGate") return startChapterCutscene("vanMieuGate");
  if (stage === "khueVanMemory") return startChapterCutscene("khueVanMemory");
  if (stage === "stelaeHistory" || stage === "vanMieuQuiz") return openStelaeHistory();
  if (stage === "oldWitness") return startChapterCutscene("oldWitness");
  return false;
}

export function handleChapter3MoInteraction() {
  if (!isChapter3Active() || isMoCompanionActive()) return false;
  enterNpcDialogue(runtime.scheduledMo || "mo", {
    text: getChapter3MoDialogue(),
    expression: ["fearChoice", "moRecognition"].includes(getChapter3Progress().stage) ? "worried" : "curious"
  });
  return true;
}

export function getChapter3MoDialogue() {
  if (!isChapter3Active()) return "";
  const stage = getChapter3Progress().stage;
  if (["baDinhArrival", "langBacHistory", "langBacQuiz", "onePillarHistory", "onePillarQuiz"].includes(stage)) {
    return "Mình đi chậm qua Ba Đình nhé. Nếu cơn đau quay lại, bạn phải nói với mình.";
  }
  if (["guideHistory", "guideQuiz", "focusChoice", "tourGroupChoice"].includes(stage)) {
    return "Lịch sử chung và ký ức riêng của bạn đang chạm vào nhau ở nơi này.";
  }
  if (["vanMieuGate", "khueVanMemory", "stelaeHistory", "vanMieuQuiz", "schoolGroupChoice"].includes(stage)) {
    return "Ở Văn Miếu, bạn có vẻ nhớ từng bước chân rõ hơn cả đường trên bản đồ.";
  }
  if (["fearChoice", "moRecognition"].includes(stage)) {
    return "Mình đang nghe đây. Bạn không cần giấu điều khiến mình sợ.";
  }
  return "Người lớn tuổi kia từng sống gần Cầu Long Biên. Có lẽ ông biết điều gì đó.";
}

export function getChapter3Objective() {
  if (!isChapter3Active()) return "";
  return CHAPTER_3_OBJECTIVES[getChapter3Progress().stage] || "Khám phá Ba Đình và Văn Miếu cùng Mơ.";
}

export function getChapter3NavigationObjective() {
  if (!isChapter3Active()) return null;
  const progress = getChapter3Progress();
  if (AUTO_STAGES.has(progress.stage)) return null;
  const point = getCurrentChapter3Point();
  if (!point) return null;
  return {
    id: "chapter3-current",
    type: point.kind === "oldWitness" || point.kind === "guide" ? "npc" : "questPoint",
    mapId: point.mapId,
    targetId: point.id,
    targetPosition: { x: point.x, y: point.y },
    label: point.label,
    description: getChapter3Objective(),
    questId: CHAPTER_3_ID,
    routeMode: "walking"
  };
}

export function getChapter3QuestEntries() {
  if (!isChapter3Active() && !getStoryState().flags.chapter3) return [];
  const progress = getChapter3Progress();
  const stageIndex = CHAPTER_3_STAGE_ORDER.indexOf(progress.stage);
  return CHAPTER_3_QUESTS.map((quest) => {
    const finalStageIndex = Math.max(...quest.stages.map((stage) => CHAPTER_3_STAGE_ORDER.indexOf(stage)));
    const done = getQuestCompletion(quest.id, progress);
    const active = !done && quest.stages.includes(progress.stage);
    return {
      ...quest,
      done,
      active,
      progress: done ? "Hoàn thành" : stageIndex <= finalStageIndex ? getChapter3Objective() : "Chưa mở",
      navigation: active ? getChapter3NavigationObjective() : null
    };
  });
}

export function getCurrentChapter3Point() {
  if (!isChapter3Active()) return null;
  return CHAPTER_3_POINTS[getChapter3Progress().stage] || null;
}

export function getChapter3Progress() {
  const story = getStoryState();
  story.flags.chapter3 = normalizeChapterProgress(story.flags.chapter3 || createChapterProgress());
  return story.flags.chapter3;
}

export function isChapter3Active() {
  const story = getStoryState();
  return story.currentScene === CHAPTER_3_ID && Number(story.currentChapter) === 3 && !story.flags.chapter3?.completed;
}

function registerChapterCutscene(key, nextStage, options = {}) {
  registerCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    allowSkip: false,
    scene: options.scene || null,
    timeline: CHAPTER_3_CUTSCENES[key],
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    onComplete: () => {
      if (typeof options.onComplete === "function") options.onComplete();
      advanceChapter3Stage(nextStage, getStageCompletionMessage(key));
    }
  });
}

function startChapterCutscene(key) {
  return startCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    sceneId: CHAPTER_3_ID,
    returnScene: CHAPTER_3_ID,
    chapter: 3,
    audioDuck: ["baDinhArrival", "khueVanMemory", "moRecognition", "oldWitness"].includes(key) ? 0.14 : 0.48
  });
}

function openHistoryLandmark(landmarkId, quizStage) {
  const landmark = findLandmark(landmarkId);
  if (!landmark) return false;
  discoverLandmark(landmark.id);
  const alreadyCorrect = isQuizCorrect(landmark.quizId);
  openLandmarkInfoPanel(landmark, {
    statusNote: alreadyCorrect
      ? "Bạn đã trả lời đúng câu hỏi lịch sử tại điểm này."
      : "Đọc kỹ bối cảnh và ý nghĩa công trình trước khi trả lời câu hỏi.",
    actions: [{
      label: alreadyCorrect ? "Tiếp tục hành trình" : "Trả lời câu hỏi lịch sử",
      className: "primary-choice",
      onClick: () => {
        closeInfoModal();
        if (alreadyCorrect) {
          if (getChapter3Progress().stage !== quizStage) advanceChapter3Stage(quizStage);
          completeQuizStage(quizStage, QUIZ_STAGES[quizStage]);
          return;
        }
        if (getChapter3Progress().stage !== quizStage) advanceChapter3Stage(quizStage);
        openQuiz(landmark.quizId, { landmarkId, storyChapter: CHAPTER_3_ID });
      }
    }]
  });
  return true;
}

function openStelaeHistory() {
  const landmark = findLandmark("vanMieu");
  if (!landmark) return false;
  discoverLandmark(landmark.id);
  const alreadyCorrect = isQuizCorrect("studentVanMieu");
  openLandmarkInfoPanel(landmark, {
    statusNote: alreadyCorrect
      ? "Bạn đã hiểu bia tiến sĩ không chỉ ghi tên người đỗ đạt mà còn chuyển tải quan niệm trọng dụng hiền tài."
      : "Hãy đọc kỹ vai trò của bia tiến sĩ rồi trả lời câu hỏi lịch sử.",
    actions: [{
      label: alreadyCorrect ? "Ghi lại Dấu ấn lịch sử" : "Trả lời câu hỏi về bia tiến sĩ",
      className: "primary-choice",
      onClick: () => {
        closeInfoModal();
        if (alreadyCorrect) {
          if (getChapter3Progress().stage !== "vanMieuQuiz") advanceChapter3Stage("vanMieuQuiz");
          completeQuizStage("vanMieuQuiz", QUIZ_STAGES.vanMieuQuiz);
          return;
        }
        if (getChapter3Progress().stage !== "vanMieuQuiz") advanceChapter3Stage("vanMieuQuiz");
        openQuiz("studentVanMieu", { landmarkId: "vanMieu", storyChapter: CHAPTER_3_ID });
      }
    }]
  });
  return true;
}

function openStoryQuiz(quizId, npcId) {
  if (isQuizCorrect(quizId)) {
    completeQuizStage(getChapter3Progress().stage, QUIZ_STAGES[getChapter3Progress().stage]);
    return true;
  }
  openQuiz(quizId, { npcId, storyChapter: CHAPTER_3_ID });
  return true;
}

function completeQuizStage(stage, config) {
  if (!config || getChapter3Progress().stage !== stage) return false;
  const progress = getChapter3Progress();
  if (config.reward === "baDinh" && !progress.baDinhHistoryAwarded) {
    addHistoryMark(CHAPTER_3_REWARDS.baDinhHistory, { save: false });
    progress.baDinhHistoryAwarded = true;
  }
  if (config.reward === "vanMieu" && !progress.vanMieuHistoryAwarded) {
    addHistoryMark(CHAPTER_3_REWARDS.vanMieuHistory, { save: false });
    progress.vanMieuHistoryAwarded = true;
  }
  const message = config.reward === "baDinh"
    ? "Bạn nhận Dấu ấn lịch sử: Ba Đình."
    : config.reward === "vanMieu" ? "Bạn nhận Dấu ấn lịch sử: Văn Miếu." : "";
  return advanceChapter3Stage(config.nextStage, message);
}

function advanceChapter3Stage(nextStage, message = "") {
  if (!CHAPTER_3_STAGE_ORDER.includes(nextStage)) return false;
  const progress = getChapter3Progress();
  progress.stage = nextStage;
  progress.updatedAtGameMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  if (runtime.chapter3) runtime.chapter3.autoStage = null;
  applyObjective(nextStage);
  syncTrackedChapterObjective();
  saveGame();
  updateHud();
  if (message) showMessage(message);
  return true;
}

function applyObjective(stage) {
  getStoryState().flags.chapter3Objective = CHAPTER_3_OBJECTIVES[stage] || "Khám phá Ba Đình và Văn Miếu cùng Mơ.";
}

function syncTrackedChapterObjective() {
  if (getTrackedObjective()?.id !== "chapter3-current") return;
  const objective = getChapter3NavigationObjective();
  if (objective) setTrackedObjective(objective, { silent: true });
}

function updateChapter3Mo(stage) {
  if (isMoCompanionActive()) return;
  const anchor = MO_ANCHORS[stage] || MO_ANCHORS.baDinhArrival;
  const mo = runtime.scheduledMo || {
    id: MO_SCHEDULE.id,
    name: MO_SCHEDULE.name,
    color: MO_SCHEDULE.color,
    width: 24,
    height: 46
  };
  mo.x = anchor.x;
  mo.y = anchor.y;
  mo.mapId = "baDinh";
  mo.currentMap = "baDinh";
  mo.visible = true;
  mo.interactable = true;
  mo.companion = false;
  mo.ridingWithPlayer = false;
  mo.state = "chapter3Investigating";
  mo.activity = "talking";
  mo.facing = anchor.x > getPlayerCenter().x ? "left" : "right";
  runtime.scheduledMo = mo;
  runtime.chapter3.mo = mo;
}

function getQuestCompletion(questId, progress) {
  const story = getStoryState();
  if (questId === "chapter3-ba-dinh") {
    return progress.guideHeard &&
      story.historyMarks.includes(CHAPTER_3_REWARDS.baDinhHistory) &&
      story.humanMemories.includes(CHAPTER_3_REWARDS.heldHandMemory);
  }
  if (questId === "chapter3-ba-dinh-choice") return Boolean(progress.focusChoice && progress.tourGroupChoice);
  if (questId === "chapter3-van-mieu") {
    return progress.schoolMemorySeen && story.historyMarks.includes(CHAPTER_3_REWARDS.vanMieuHistory) &&
      story.humanMemories.includes(CHAPTER_3_REWARDS.schoolTripMemory);
  }
  if (questId === "chapter3-long-bien-clue") {
    return progress.longBienClueFound && progress.moRecognitionSeen && Boolean(progress.fearChoice);
  }
  return false;
}

function canCompleteChapter3() {
  const story = getStoryState();
  const progress = getChapter3Progress();
  return progress.baDinhMemorySeen &&
    progress.guideHeard &&
    progress.schoolMemorySeen &&
    progress.moRecognitionSeen &&
    progress.longBienClueFound &&
    Boolean(progress.focusChoice) &&
    Boolean(progress.tourGroupChoice) &&
    Boolean(progress.schoolGroupChoice) &&
    Boolean(progress.fearChoice) &&
    story.historyMarks.includes(CHAPTER_3_REWARDS.baDinhHistory) &&
    story.historyMarks.includes(CHAPTER_3_REWARDS.vanMieuHistory) &&
    story.humanMemories.includes(CHAPTER_3_REWARDS.heldHandMemory) &&
    story.humanMemories.includes(CHAPTER_3_REWARDS.schoolTripMemory) &&
    story.memoryClues.includes(CHAPTER_3_CLUES.longBienDisappearance);
}

function completeChapter3() {
  if (!canCompleteChapter3()) {
    if (runtime.chapter3) runtime.chapter3.autoStage = null;
    showMessage("Hãy hoàn thành các ký ức còn thiếu trước khi rời chương.");
    return;
  }
  const story = getStoryState();
  const progress = getChapter3Progress();
  progress.completed = true;
  progress.status = "completed";
  progress.stage = "completed";
  story.flags.chapter3Completed = true;
  story.flags.chapter3LongBienUnlocked = true;
  story.flags.chapter3Objective = "Tới Cầu Long Biên để tiếp tục lần theo ký ức.";
  if (!story.completedChapters.includes("3")) story.completedChapters.push("3");
  story.currentChapter = 4;
  story.currentScene = "chapter-4";
  unlockStoryMap("longBien", { save: false });
  runtime.chapter3.active = false;
  saveGame();
  updateHud();
  showMessage("Đã mở khóa: Long Biên");
}

function getStageCompletionMessage(key) {
  if (key === "baDinhArrival") return "Bạn nhận Ký ức con người: Bàn tay giữa Ba Đình.";
  if (key === "khueVanMemory") return "Bạn nhận Ký ức con người: Chuyến đi học Văn Miếu.";
  if (key === "moRecognition") return "Mơ đã hiểu điều bức ảnh cũ muốn nói, nhưng vẫn chưa nói ra.";
  if (key === "oldWitness") return "Manh mối mới: Đứa trẻ mất tích gần Cầu Long Biên.";
  return "";
}

function createChapterProgress() {
  return {
    version: 1,
    status: "active",
    stage: "baDinhArrival",
    baDinhMemorySeen: false,
    baDinhHistoryAwarded: false,
    guideHeard: false,
    focusChoice: null,
    tourGroupChoice: null,
    vanMieuGateVisited: false,
    schoolMemorySeen: false,
    vanMieuHistoryAwarded: false,
    schoolGroupChoice: null,
    pendantDetailRemembered: false,
    fearChoice: null,
    moRecognitionSeen: false,
    longBienClueFound: false,
    completed: false,
    updatedAtGameMinute: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
}

function normalizeChapterProgress(raw) {
  const base = createChapterProgress();
  const source = raw && typeof raw === "object" ? raw : {};
  const stage = CHAPTER_3_STAGE_ORDER.includes(source.stage) || source.stage === "completed" ? source.stage : base.stage;
  return {
    ...base,
    ...source,
    stage,
    focusChoice: typeof source.focusChoice === "string" ? source.focusChoice : null,
    tourGroupChoice: typeof source.tourGroupChoice === "string" ? source.tourGroupChoice : null,
    schoolGroupChoice: typeof source.schoolGroupChoice === "string" ? source.schoolGroupChoice : null,
    fearChoice: typeof source.fearChoice === "string" ? source.fearChoice : null,
    completed: Boolean(source.completed)
  };
}

function createRuntimeState() {
  return { active: false, stage: null, autoStage: null, mo: null };
}

function installDebugHelpers() {
  if (typeof window === "undefined") return;
  window.getChapter3StateForDebug = () => ({
    active: isChapter3Active(),
    progress: { ...getChapter3Progress() },
    objective: getChapter3Objective(),
    historyMarks: [...getStoryState().historyMarks],
    humanMemories: [...getStoryState().humanMemories],
    clues: [...getStoryState().memoryClues]
  });
  window.advanceChapter3ForDebug = (stage) => advanceChapter3Stage(stage);
}
