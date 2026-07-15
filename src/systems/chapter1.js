import {
  CHAPTER_1_AREAS,
  CHAPTER_1_CUTSCENES,
  CHAPTER_1_ID,
  CHAPTER_1_OBJECTIVES,
  CHAPTER_1_POINTS,
  CHAPTER_1_QUESTS,
  CHAPTER_1_REWARDS,
  CHAPTER_1_STAGE_ORDER
} from "../data/chapter1.js";
import { player, runtime, state } from "../state.js";
import { saveGame } from "../storage.js";
import { findLandmark, getPlayerCenter, isQuizCorrect } from "../utils/helpers.js";
import { updateHud } from "../render/renderUI.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { closeChoiceModal, closeInfoModal, isOverlayOpen, openChoiceModal, openLandmarkInfoPanel, showMessage } from "./modal.js";
import { getTrackedObjective, setTrackedObjective } from "./navigation.js";
import { openQuiz } from "./quiz.js";
import {
  addHistoryMark,
  addHumanMemory,
  getStoryState,
  unlockStoryMap
} from "./storyState.js";

const CUTSCENE_PREFIX = "chapter1";
const STORY_CLOCK_PAUSE_REASON = "story-chapter-1-cutscene";
const MOVEMENT_TUTORIAL_DISTANCE = 54;
const MO_LEAD_SPEED = 76;
const MO_WAIT_DISTANCE = 176;
const STAGE_POINT_KEYS = Object.freeze({
  movement: "movement",
  mapTutorial: "mapTutorial",
  modernLight: "modernLight",
  modernBike: "modernBike",
  modernPhone: "modernPhone",
  modernMoney: "modernMoney",
  lakeInfo: "lakeInfo",
  lakeQuiz: "lakeInfo",
  knownAlley: "knownAlley",
  childhoodSong: "childhoodSong",
  familiarFood: "familiarFood",
  teaTalk: "teaTalk",
  teaTask: "teaTask"
});

let initialized = false;

export function initChapter1() {
  if (initialized) return;
  initialized = true;
  registerChapterCutscene("light", "modernBike");
  registerChapterCutscene("bike", "modernPhone");
  registerChapterCutscene("phone", "modernMoney");
  registerChapterCutscene("money", "lakeInfo", { completeFlag: "modernWorldCompleted" });
  registerChapterCutscene("alley", "childhoodSong");
  registerChapterCutscene("song", "familiarFood");
  registerChapterCutscene("food", "teaTalk");
  registerChapterCutscene("teaTalk", "teaTask");
  registerChapterCutscene("teaTask", "originBranch", { reward: "humanMemory" });
  registerChapterCutscene("branchReturn", "chapterComplete", { branch: "return" });
  registerChapterCutscene("branchStay", "chapterComplete", { branch: "stay" });
  registerChapterCutscene("branchInvestigate", "chapterComplete", { branch: "investigate" });
  registerCutscene(`${CUTSCENE_PREFIX}-finale`, {
    allowSkip: false,
    timeline: CHAPTER_1_CUTSCENES.finale,
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    onComplete: completeChapter1
  });
  installDebugHelpers();
}

export function startChapter1({ reset = false } = {}) {
  initChapter1();
  const story = getStoryState();
  if (reset || !story.flags.chapter1 || story.flags.chapter1.completed) {
    story.flags.chapter1 = createChapterProgress();
  } else {
    story.flags.chapter1 = normalizeChapterProgress(story.flags.chapter1);
  }
  story.currentChapter = 1;
  story.currentScene = CHAPTER_1_ID;
  story.unlockedMaps = ["hoanKiem"];
  story.flags.chapter1ChurchUnlocked = false;
  applyObjective(story.flags.chapter1.stage);
  runtime.chapter1 = createRuntimeState();
  saveGame();
  updateHud();
  return story.flags.chapter1;
}

export function hydrateChapter1() {
  initChapter1();
  const story = getStoryState();
  if (story.currentScene !== CHAPTER_1_ID || Number(story.currentChapter) !== 1) {
    runtime.chapter1 = createRuntimeState();
    return false;
  }
  story.flags.chapter1 = normalizeChapterProgress(story.flags.chapter1 || createChapterProgress());
  if (story.flags.chapter1.finaleStarted && !story.checkpoint?.active) {
    story.flags.chapter1.finaleStarted = false;
  }
  runtime.chapter1 = createRuntimeState();
  applyObjective(story.flags.chapter1.stage);
  return true;
}

export function updateChapter1(timestamp) {
  if (!isChapter1Active()) {
    if (runtime.chapter1) runtime.chapter1.active = false;
    return;
  }

  const progress = getChapter1Progress();
  const chapterRuntime = runtime.chapter1 || (runtime.chapter1 = createRuntimeState());
  const deltaSeconds = chapterRuntime.lastTimestamp
    ? Math.min(0.1, Math.max(0, (timestamp - chapterRuntime.lastTimestamp) / 1000))
    : 0;
  chapterRuntime.lastTimestamp = timestamp;
  chapterRuntime.active = true;

  if (state.currentMapId === "hoanKiem") updateChapter1Mo(progress, deltaSeconds);

  if (progress.stage === "movement") {
    const moved = Math.hypot(player.x - progress.startedAt.x, player.y - progress.startedAt.y);
    progress.movementDistance = Math.max(progress.movementDistance, Math.round(moved));
    if (progress.movementDistance >= MOVEMENT_TUTORIAL_DISTANCE) {
      advanceChapter1Stage("mapTutorial", "Mơ: Tốt rồi. Nhấn M để xem mình đang ở đâu nhé.");
      return;
    }
  }

  if (progress.stage === "lakeQuiz" && !runtime.activeQuiz && isQuizCorrect("hoGuom") && !hasHistoryMark()) {
    addHistoryMark(CHAPTER_1_REWARDS.historyMark, { save: false });
    progress.historyMarkAwarded = true;
    advanceChapter1Stage("knownAlley", "Bạn nhận Dấu ấn lịch sử: Hồ Gươm.");
    return;
  }

  if (progress.stage === "chapterComplete" && !progress.finaleStarted && canCompleteChapter1() && !isOverlayOpen()) {
    if (startChapterCutscene("finale")) {
      progress.finaleStarted = true;
      saveGame();
    }
  }
}

export function notifyChapter1MapOpened() {
  if (!isChapter1Active()) return false;
  const progress = getChapter1Progress();
  if (progress.stage !== "mapTutorial") return false;
  progress.mapOpened = true;
  advanceChapter1Stage("modernLight", "Mơ đang chờ cạnh chiếc đèn điện trên lối ven hồ.");
  return true;
}

export function getChapter1Interactables(mapId) {
  if (!isChapter1Active() || mapId !== "hoanKiem") return [];
  const point = getCurrentChapter1Point();
  if (!point || ["movement", "mapTutorial"].includes(getChapter1Progress().stage)) return [];
  return [{
    type: "chapter1",
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
      labelOffsetY: -30
    },
    priority: 0,
    range: point.radius
  }];
}

export function handleChapter1Interaction(point) {
  if (!isChapter1Active() || !point) return false;
  const stage = getChapter1Progress().stage;
  if (point.id !== getCurrentChapter1Point()?.id) return false;

  if (stage === "modernLight") return startChapterCutscene("light");
  if (stage === "modernBike") return startChapterCutscene("bike");
  if (stage === "modernPhone") return startChapterCutscene("phone");
  if (stage === "modernMoney") return startChapterCutscene("money");
  if (stage === "lakeInfo" || stage === "lakeQuiz") return openChapter1LakeInfo();
  if (stage === "knownAlley") return startChapterCutscene("alley");
  if (stage === "childhoodSong") return startChapterCutscene("song");
  if (stage === "familiarFood") return startChapterCutscene("food");
  if (stage === "teaTalk") return startChapterCutscene("teaTalk");
  if (stage === "teaTask") return startChapterCutscene("teaTask");
  if (stage === "originBranch") return openOriginBranchInteraction();
  return false;
}

export function handleChapter1MoInteraction() {
  if (!isChapter1Active()) return false;
  const progress = getChapter1Progress();
  const line = progress.stage === "chapterComplete"
    ? "Mơ: Mình nghĩ đã đến lúc đi tới nơi tiếp theo."
    : `Mơ: ${CHAPTER_1_OBJECTIVES[progress.stage] || "Mình đi tiếp nhé."}`;
  showMessage(line);
  return true;
}

export function getChapter1Objective() {
  if (!isChapter1Active()) return "";
  return CHAPTER_1_OBJECTIVES[getChapter1Progress().stage] || "Khám phá Hoàn Kiếm cùng Mơ.";
}

export function getChapter1NavigationObjective() {
  if (!isChapter1Active()) return null;
  const point = getCurrentChapter1Point();
  if (!point) return null;
  return {
    id: "chapter1-current",
    type: "questPoint",
    mapId: point.mapId,
    targetId: point.id,
    targetPosition: { x: point.x, y: point.y },
    label: point.label,
    description: getChapter1Objective(),
    questId: "chapter-1",
    routeMode: "walking"
  };
}

export function getChapter1QuestEntries() {
  if (!isChapter1Active() && !getStoryState().flags.chapter1) return [];
  const progress = getChapter1Progress();
  const stageIndex = CHAPTER_1_STAGE_ORDER.indexOf(progress.stage);
  const entries = CHAPTER_1_QUESTS.map((quest) => {
    const finalStageIndex = Math.max(...quest.stages.map((stage) => CHAPTER_1_STAGE_ORDER.indexOf(stage)));
    const done = quest.id === "chapter1-modern-world"
      ? Boolean(progress.modernWorldCompleted)
      : quest.id === "chapter1-lake" ? hasHistoryMark() : hasHumanMemory();
    return {
      ...quest,
      done,
      active: !done && quest.stages.includes(progress.stage),
      progress: done ? "Hoàn thành" : stageIndex <= finalStageIndex ? getChapter1Objective() : "Chưa mở",
      navigation: !done && quest.stages.includes(progress.stage) ? getChapter1NavigationObjective() : null
    };
  });
  entries.push({
    id: "chapter1-origin-branch",
    title: getOriginBranchTitle(),
    description: getOriginBranchDescription(),
    done: Boolean(progress.branchCompleted),
    active: progress.stage === "originBranch",
    progress: progress.branchCompleted ? "Hoàn thành" : progress.stage === "originBranch" ? getChapter1Objective() : "Hội tụ ở cuối chương",
    navigation: progress.stage === "originBranch" ? getChapter1NavigationObjective() : null
  });
  return entries;
}

export function getChapter1AreaStatuses() {
  const story = getStoryState();
  return CHAPTER_1_AREAS.map((area) => ({
    ...area,
    unlocked: area.unlocked || (area.storyFlag ? Boolean(story.flags[area.storyFlag]) : story.unlockedMaps.includes(area.mapId))
  }));
}

export function isChapter1LandmarkUnlocked(landmarkId) {
  if (landmarkId !== "nhaThoLon") return true;
  if (!isChapter1Active()) return true;
  return Boolean(getStoryState().flags.chapter1ChurchUnlocked);
}

export function isChapter1Active() {
  const story = getStoryState();
  return story.currentScene === CHAPTER_1_ID && Number(story.currentChapter) === 1 && !story.flags.chapter1?.completed;
}

export function getChapter1Progress() {
  const story = getStoryState();
  story.flags.chapter1 = normalizeChapterProgress(story.flags.chapter1 || createChapterProgress());
  return story.flags.chapter1;
}

export function getCurrentChapter1Point() {
  if (!isChapter1Active()) return null;
  const progress = getChapter1Progress();
  if (progress.stage === "originBranch") {
    const branchKey = {
      return: "branchReturn",
      stay: "branchStay",
      investigate: "branchInvestigate"
    }[getStoryState().originChoice];
    return CHAPTER_1_POINTS[branchKey] || CHAPTER_1_POINTS.branchInvestigate;
  }
  return CHAPTER_1_POINTS[STAGE_POINT_KEYS[progress.stage]] || null;
}

function openChapter1LakeInfo() {
  const landmark = findLandmark("hoGuom");
  if (!landmark) return false;
  openLandmarkInfoPanel(landmark, {
    statusNote: hasHistoryMark()
      ? "Bạn đã nhận Dấu ấn lịch sử Hồ Gươm."
      : "Đọc kỹ bối cảnh lịch sử rồi trả lời câu hỏi để nhận Dấu ấn lịch sử.",
    actions: hasHistoryMark() ? [] : [{
      label: "Trả lời câu hỏi lịch sử",
      className: "primary-choice",
      onClick: () => {
        closeInfoModal();
        if (getChapter1Progress().stage !== "lakeQuiz") advanceChapter1Stage("lakeQuiz");
        openQuiz("hoGuom", { landmarkId: "hoGuom", storyChapter: CHAPTER_1_ID });
      }
    }]
  });
  return true;
}

function openOriginBranchInteraction() {
  const origin = getStoryState().originChoice;
  if (origin === "return") return startChapterCutscene("branchReturn");
  if (origin === "investigate") return startChapterCutscene("branchInvestigate");
  if (origin !== "stay") return false;

  openChoiceModal({
    tag: "Học cách dùng tiền",
    title: "Bác bán báo",
    body: "Một tờ báo giá 32.000đ. Khách đưa 50.000đ. Bác cần trả lại bao nhiêu?",
    actions: [
      { label: "18.000đ", className: "primary-choice", onClick: () => { closeChoiceModal(); startChapterCutscene("branchStay"); } },
      { label: "22.000đ", onClick: () => showMessage("Mơ khẽ lắc đầu: Bạn thử trừ lại một lần nữa nhé.") },
      { label: "28.000đ", onClick: () => showMessage("Bác bán báo cười hiền: Thế này bác lỗ mất, cháu tính lại nhé.") },
      { label: "Để mình nghĩ thêm", onClick: closeChoiceModal }
    ]
  });
  return true;
}

function registerChapterCutscene(key, nextStage, options = {}) {
  registerCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    allowSkip: false,
    timeline: CHAPTER_1_CUTSCENES[key],
    clockPauseReason: STORY_CLOCK_PAUSE_REASON,
    onComplete: () => {
      const progress = getChapter1Progress();
      if (options.completeFlag) progress[options.completeFlag] = true;
      if (options.reward === "humanMemory") {
        addHumanMemory(CHAPTER_1_REWARDS.humanMemory, { save: false });
        progress.humanMemoryAwarded = true;
      }
      if (options.branch) {
        progress.branchCompleted = true;
        progress.branchOutcome = options.branch;
      }
      advanceChapter1Stage(nextStage, getStageCompletionMessage(key));
    }
  });
}

function startChapterCutscene(key) {
  return startCutscene(`${CUTSCENE_PREFIX}-${key}`, {
    sceneId: CHAPTER_1_ID,
    returnScene: CHAPTER_1_ID,
    chapter: 1,
    audioDuck: key === "song" ? 0.24 : 0.5
  });
}

function advanceChapter1Stage(nextStage, message = "") {
  const progress = getChapter1Progress();
  if (!CHAPTER_1_STAGE_ORDER.includes(nextStage)) return false;
  progress.stage = nextStage;
  progress.updatedAtGameMinute = Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  applyObjective(nextStage);
  syncTrackedChapterObjective();
  saveGame();
  updateHud();
  if (message) showMessage(message);
  return true;
}

function applyObjective(stage) {
  getStoryState().flags.chapter1Objective = CHAPTER_1_OBJECTIVES[stage] || "Khám phá Hoàn Kiếm cùng Mơ.";
}

function syncTrackedChapterObjective() {
  if (getTrackedObjective()?.id !== "chapter1-current") return;
  const objective = getChapter1NavigationObjective();
  if (objective) setTrackedObjective(objective, { silent: true });
}

function updateChapter1Mo(progress, deltaSeconds) {
  const mo = runtime.scheduledMo;
  if (!mo) return;
  if (!runtime.chapter1.moInitialized) {
    mo.x = player.x + 52;
    mo.y = player.y - 16;
    runtime.chapter1.moInitialized = true;
  }
  const point = getCurrentChapter1Point() || CHAPTER_1_POINTS.teaTalk;
  const target = {
    x: point.x + (point.kind === "lake" ? -54 : 54),
    y: point.y - 12
  };
  const playerCenter = getPlayerCenter();
  const moCenterX = Number(mo.x || target.x) + 12;
  const moCenterY = Number(mo.y || target.y) + 23;
  const distanceToPlayer = Math.hypot(playerCenter.x - moCenterX, playerCenter.y - moCenterY);
  const dx = target.x - Number(mo.x || target.x);
  const dy = target.y - Number(mo.y || target.y);
  const distance = Math.hypot(dx, dy);

  mo.mapId = "hoanKiem";
  mo.currentMap = "hoanKiem";
  mo.visible = true;
  mo.interactable = true;
  mo.companion = false;
  mo.state = "chapter1Guiding";
  mo.activity = distance > 3 ? "walking" : "talking";

  if (!isCutsceneActive() && distance > 2 && distanceToPlayer <= MO_WAIT_DISTANCE) {
    const amount = Math.min(distance, MO_LEAD_SPEED * deltaSeconds);
    mo.x += dx / distance * amount;
    mo.y += dy / distance * amount;
    mo.facing = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "right" : "left") : (dy >= 0 ? "down" : "up");
  } else if (distanceToPlayer > MO_WAIT_DISTANCE) {
    mo.activity = "waiting";
    mo.facing = Math.abs(playerCenter.x - moCenterX) >= Math.abs(playerCenter.y - moCenterY)
      ? (playerCenter.x >= moCenterX ? "right" : "left")
      : (playerCenter.y >= moCenterY ? "down" : "up");
  }

  state.npcSchedules.mo = {
    ...(state.npcSchedules.mo || {}),
    currentState: mo.state,
    currentMap: "hoanKiem",
    x: Math.round(mo.x),
    y: Math.round(mo.y)
  };
  runtime.chapter1.mo = mo;
  runtime.chapter1.stage = progress.stage;
}

function canCompleteChapter1() {
  const progress = getChapter1Progress();
  const story = getStoryState();
  return progress.branchCompleted &&
    story.historyMarks.includes(CHAPTER_1_REWARDS.historyMark) &&
    story.humanMemories.includes(CHAPTER_1_REWARDS.humanMemory) &&
    story.memoryClues.length >= 2;
}

function completeChapter1() {
  const story = getStoryState();
  const progress = getChapter1Progress();
  progress.completed = true;
  progress.status = "completed";
  progress.stage = "completed";
  progress.finaleStarted = false;
  story.flags.chapter1Completed = true;
  story.flags.chapter1ChurchUnlocked = true;
  story.flags.chapter1Objective = "Tới Nhà thờ Lớn Hà Nội.";
  if (!story.completedChapters.includes("1")) story.completedChapters.push("1");
  story.currentChapter = 2;
  story.currentScene = "chapter-2";
  unlockStoryMap("churchInterior", { save: false });
  runtime.chapter1.active = false;
  saveGame();
  updateHud();
  showMessage("Đã mở khóa: Nhà thờ Lớn");
}

function hasHistoryMark() {
  return getStoryState().historyMarks.includes(CHAPTER_1_REWARDS.historyMark);
}

function hasHumanMemory() {
  return getStoryState().humanMemories.includes(CHAPTER_1_REWARDS.humanMemory);
}

function getStageCompletionMessage(key) {
  if (key === "money") return "Hoàn thành: Thế giới không có linh khí.";
  if (key === "teaTask") return "Bạn nhận Ký ức con người: Quán trà đá.";
  if (key.startsWith("branch")) return "Lựa chọn ban đầu của bạn đã để lại một dấu vết trong câu chuyện.";
  return "";
}

function getOriginBranchTitle() {
  return ({
    return: "Dấu hiệu của đường về",
    stay: "Một đời sống khác",
    investigate: "Ký ức trên tấm bảng cũ"
  })[getStoryState().originChoice] || "Lựa chọn đầu tiên";
}

function getOriginBranchDescription() {
  return ({
    return: "Tìm dấu hiệu không gian quanh Tháp Rùa.",
    stay: "Giúp một người Hà Nội và học cách dùng tiền hiện đại.",
    investigate: "Đối chiếu ký ức với một bảng thông tin cũ."
  })[getStoryState().originChoice] || "Theo đuổi mục đích đã chọn khi tới Hà Nội.";
}

function createChapterProgress() {
  return {
    version: 1,
    status: "active",
    stage: "movement",
    startedAt: { x: Math.round(player.x), y: Math.round(player.y) },
    movementDistance: 0,
    mapOpened: false,
    modernWorldCompleted: false,
    historyMarkAwarded: false,
    humanMemoryAwarded: false,
    branchCompleted: false,
    branchOutcome: null,
    finaleStarted: false,
    completed: false,
    updatedAtGameMinute: Math.floor(Number(state.gameTime.totalGameMinutes) || 0)
  };
}

function normalizeChapterProgress(raw) {
  const base = createChapterProgress();
  const source = raw && typeof raw === "object" ? raw : {};
  const stage = CHAPTER_1_STAGE_ORDER.includes(source.stage) || source.stage === "completed" ? source.stage : base.stage;
  return {
    ...base,
    ...source,
    stage,
    startedAt: Number.isFinite(Number(source.startedAt?.x)) && Number.isFinite(Number(source.startedAt?.y))
      ? { x: Number(source.startedAt.x), y: Number(source.startedAt.y) }
      : base.startedAt,
    movementDistance: Math.max(0, Number(source.movementDistance) || 0),
    completed: Boolean(source.completed),
    finaleStarted: Boolean(source.finaleStarted)
  };
}

function createRuntimeState() {
  return { active: false, lastTimestamp: 0, stage: null, mo: null, moInitialized: false };
}

function installDebugHelpers() {
  if (typeof window === "undefined") return;
  window.getChapter1StateForDebug = () => ({
    active: isChapter1Active(),
    progress: { ...getChapter1Progress() },
    objective: getChapter1Objective(),
    historyMarks: [...getStoryState().historyMarks],
    humanMemories: [...getStoryState().humanMemories],
    clues: [...getStoryState().memoryClues]
  });
  window.advanceChapter1ForDebug = (stage) => advanceChapter1Stage(stage);
}
