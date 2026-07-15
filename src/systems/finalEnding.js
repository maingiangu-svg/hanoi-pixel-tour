import {
  BRIDGE_ENDING_REQUIREMENTS,
  CONTINUE_MODE_SCENE,
  ENDING_ACTIONS,
  ENDING_COMPLETE_SCENE,
  ENDING_HISTORY_LABELS,
  ENDING_MEMORY_LABELS,
  ENDING_PLAYING_SCENE,
  FINAL_CHOICE_SCENE,
  FINAL_ENDING_IDS,
  FINAL_ENDINGS,
  IMPORTANT_CHOICE_LABELS
} from "../data/finalEndings.js";
import { branchingQuests } from "../data/branchingQuests.js";
import { runtime, SAVE_KEY, state, ui } from "../state.js";
import { saveGame } from "../storage.js";
import { updateHud } from "../render/renderUI.js";
import {
  isCutsceneActive,
  registerCutscene,
  startCutscene
} from "./cutscene.js";
import { clearTrackedObjective, getTrackedObjective } from "./navigation.js";
import { getStoryState } from "./storyState.js";
import {
  activateSelectedButton,
  getSelectableButtons,
  moveSelection,
  renderButtonSelection
} from "./selectableUI.js";

const FINAL_CHOICE_CUTSCENE_ID = "story-final-choice";
const FINAL_ENDING_CUTSCENE_PREFIX = "story-ending-";
const FINAL_ENDING_CLOCK_REASON = "story-final-ending";
const COMPLETE_OUTCOMES = new Set(["excellent", "good", "neutral"]);
let initialized = false;

export function initFinalEnding() {
  if (initialized) return;
  initialized = true;
  ensureRuntimeState();
  registerFinalChoiceDefinition();
  Object.values(FINAL_ENDING_IDS).forEach((endingId) => registerEndingDefinition(endingId));
  ui.endingActions?.addEventListener("click", handleEndingActionClick);
  installDebugHelpers();
}

export function hydrateFinalEnding() {
  initFinalEnding();
  const story = getStoryState();
  const endingState = normalizeFinalEndingState(story.flags.finalEnding);
  story.flags.finalEnding = endingState;
  runtime.finalEnding = createRuntimeState();
  registerFinalChoiceDefinition();
  Object.values(FINAL_ENDING_IDS).forEach((endingId) => registerEndingDefinition(endingId));

  if (story.currentScene === ENDING_COMPLETE_SCENE && story.endingId) {
    runtime.finalEnding.summaryPending = true;
  }
  if (story.currentScene === ENDING_PLAYING_SCENE && endingState.selectedEndingId) {
    runtime.finalEnding.endingStarted = Boolean(story.checkpoint?.active);
  }
  return endingState;
}

export function updateFinalEnding() {
  initFinalEnding();
  if (isCutsceneActive() || isFinalEndingPanelOpen()) return;
  const story = getStoryState();
  const endingRuntime = ensureRuntimeState();

  if (story.currentScene === FINAL_CHOICE_SCENE && story.flags.originRevealed) {
    if (!endingRuntime.choiceStarted) startFinalChoice();
    return;
  }

  if (story.currentScene === ENDING_PLAYING_SCENE) {
    const endingState = getFinalEndingState();
    if (endingState.selectedEndingId && !endingRuntime.endingStarted) {
      startFinalEnding(endingState.selectedEndingId, {
        replay: endingState.replayMode,
        skipEligibility: endingState.replayMode
      });
    }
    return;
  }

  if (story.currentScene === ENDING_COMPLETE_SCENE && story.endingId &&
    (endingRuntime.summaryPending || !endingRuntime.summaryShown)) {
    openFinalEndingJournal();
  }
}

export function startFinalChoice() {
  initFinalEnding();
  const story = getStoryState();
  if (story.currentScene !== FINAL_CHOICE_SCENE || !story.flags.originRevealed || isCutsceneActive()) return false;
  const endingRuntime = ensureRuntimeState();
  registerFinalChoiceDefinition();
  endingRuntime.choiceStarted = true;
  const endingState = getFinalEndingState();
  endingState.status = "choosing";
  endingState.replayMode = false;
  saveGame();
  const started = startCutscene(FINAL_CHOICE_CUTSCENE_ID, {
    sceneId: FINAL_CHOICE_SCENE,
    returnScene: FINAL_CHOICE_SCENE,
    chapter: 4,
    audioDuck: 0.18
  });
  if (!started) endingRuntime.choiceStarted = false;
  return started;
}

export function startFinalEnding(endingId, { replay = false, skipEligibility = false } = {}) {
  initFinalEnding();
  const definition = FINAL_ENDINGS[endingId];
  if (!definition || isCutsceneActive()) return false;
  if (endingId === FINAL_ENDING_IDS.BRIDGE && !skipEligibility && !getBridgeEndingEligibility().unlocked) {
    return false;
  }

  const story = getStoryState();
  const endingState = getFinalEndingState();
  endingState.selectedEndingId = endingId;
  endingState.status = replay ? "replaying" : "playing";
  endingState.replayMode = Boolean(replay);
  story.choices.finalEndingChoice = endingId;
  story.currentScene = ENDING_PLAYING_SCENE;
  runtime.finalEnding.endingStarted = true;
  runtime.finalEnding.choiceStarted = true;
  registerEndingDefinition(endingId);
  saveGame();

  const started = startCutscene(`${FINAL_ENDING_CUTSCENE_PREFIX}${endingId}`, {
    sceneId: ENDING_PLAYING_SCENE,
    returnScene: ENDING_PLAYING_SCENE,
    chapter: 4,
    audioDuck: 0.14
  });
  if (!started) runtime.finalEnding.endingStarted = false;
  return started;
}

export function getBridgeEndingEligibility() {
  const snapshot = createJourneySnapshot();
  const requirements = BRIDGE_ENDING_REQUIREMENTS;
  const checks = {
    historyMarks: snapshot.historyMarks.length >= requirements.historyMarks,
    humanMemories: snapshot.humanMemories.length >= requirements.humanMemories,
    memoryClues: snapshot.memoryClues.length >= requirements.memoryClues,
    curiosity: snapshot.scores.curiosity >= requirements.curiosity,
    compassion: snapshot.scores.compassion >= requirements.compassion,
    helpedNpcCount: snapshot.helpedNpcCount >= requirements.helpedNpcCount,
    majorSkips: snapshot.majorSkips <= requirements.maximumMajorSkips
  };
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key);
  return { unlocked: missing.length === 0, checks, missing, snapshot };
}

export function openFinalEndingJournal() {
  const story = getStoryState();
  if (!story.endingId || !ui.endingPanel || !ui.endingContent || !ui.endingActions) return false;
  const endingState = getFinalEndingState();
  const snapshot = normalizeJourneySnapshot(endingState.journeySnapshot) || createJourneySnapshot();
  renderJourneyJournal(story.endingId, snapshot);
  renderEndingActions();
  runtime.finalEnding.selectedIndex = 0;
  runtime.finalEnding.summaryPending = false;
  runtime.finalEnding.summaryShown = true;
  ui.endingPanel.classList.remove("hidden");
  renderEndingActionSelection();
  return true;
}

export function closeFinalEndingPanel() {
  ui.endingPanel?.classList.add("hidden");
}

export function isFinalEndingPanelOpen() {
  return Boolean(ui.endingPanel && !ui.endingPanel.classList.contains("hidden"));
}

export function handleFinalEndingKey(key) {
  if (!isFinalEndingPanelOpen()) return false;
  if (["w", "arrowup", "s", "arrowdown"].includes(key)) {
    const delta = key === "w" || key === "arrowup" ? -1 : 1;
    const buttons = getSelectableButtons(ui.endingActions);
    runtime.finalEnding.selectedIndex = moveSelection(runtime.finalEnding.selectedIndex, delta, buttons.length);
    renderEndingActionSelection();
    return true;
  }
  if (key === "enter" || key === " ") {
    activateSelectedButton(getSelectableButtons(ui.endingActions), runtime.finalEnding.selectedIndex);
    return true;
  }
  return true;
}

export function continueAfterEnding() {
  const story = getStoryState();
  if (!story.endingId) return false;
  closeFinalEndingPanel();
  const endingState = getFinalEndingState();
  endingState.status = "continue";
  endingState.replayMode = false;
  story.currentScene = CONTINUE_MODE_SCENE;
  story.flags.continueMode = true;
  story.flags.chapter4Objective = "";
  if (story.flags.chapter4) story.flags.chapter4.portalOpen = false;
  if (getTrackedObjective()?.id === "chapter4-current") clearTrackedObjective({ silent: true });
  runtime.chapter4.portalWaiting = false;
  runtime.finalEnding.summaryPending = false;
  saveGame();
  updateHud();
  return true;
}

export function replayFinalEnding() {
  const story = getStoryState();
  if (!story.endingId || isCutsceneActive()) return false;
  closeFinalEndingPanel();
  runtime.finalEnding.summaryShown = false;
  runtime.finalEnding.summaryPending = false;
  runtime.finalEnding.endingStarted = false;
  return startFinalEnding(story.endingId, { replay: true, skipEligibility: true });
}

export function beginNewJourney() {
  const confirmed = window.confirm("Bắt đầu hành trình mới sẽ xoá save hiện tại. Bạn có chắc không?");
  if (!confirmed) return false;
  localStorage.removeItem(SAVE_KEY);
  window.location.reload();
  return true;
}

export function getFinalEndingState() {
  const story = getStoryState();
  story.flags.finalEnding = normalizeFinalEndingState(story.flags.finalEnding);
  return story.flags.finalEnding;
}

export function getJourneySnapshotForEnding() {
  const endingState = getFinalEndingState();
  return normalizeJourneySnapshot(endingState.journeySnapshot) || createJourneySnapshot();
}

function registerFinalChoiceDefinition() {
  const eligibility = getBridgeEndingEligibility();
  const choices = [
    createEndingChoice(FINAL_ENDING_IDS.RETURN),
    createEndingChoice(FINAL_ENDING_IDS.STAY)
  ];
  if (eligibility.unlocked) choices.push(createEndingChoice(FINAL_ENDING_IDS.BRIDGE));

  registerCutscene(FINAL_CHOICE_CUTSCENE_ID, {
    allowSkip: false,
    clockPauseReason: FINAL_ENDING_CLOCK_REASON,
    scene: createEndingScene("choice", null),
    timeline: [
      { type: "letterbox", to: 1, duration: 260 },
      { type: "checkpoint", sceneId: FINAL_CHOICE_SCENE, checkpointId: "before-final-choice" },
      { type: "sceneState", patch: { frame: "choice" }, duration: 320 },
      narration("Cánh cổng rung lên giữa những nhịp thép. Thời gian của nó sắp hết."),
      speech("Mơ", "Dù bạn chọn con đường nào, mình muốn đó là lựa chọn của chính bạn."),
      {
        type: "dialogue",
        kind: "speech",
        speaker: "Bạn",
        text: "Ta đã đi qua hai thế giới. Bây giờ ta chọn…",
        choices
      },
      {
        type: "choiceDialogue",
        choiceKey: "finalEndingChoice",
        entries: {
          [FINAL_ENDING_IDS.RETURN]: speech("Mơ", "Mình hiểu. Những người đã chờ bạn cả một đời cũng xứng đáng có câu trả lời."),
          [FINAL_ENDING_IDS.STAY]: speech("Mơ", "Vậy lần này, mình sẽ cùng bạn học cách sống ở nơi đã chờ bạn trở về."),
          [FINAL_ENDING_IDS.BRIDGE]: speech("Mơ", "Nếu có ai giữ được con đường ấy mà không để hai thế giới làm tổn thương nhau, chắc là bạn.")
        }
      },
      { type: "fade", color: "black", to: 0.72, duration: 380 }
    ],
    onComplete: () => {
      const selected = getStoryState().choices.finalEndingChoice;
      const valid = selected === FINAL_ENDING_IDS.BRIDGE && !getBridgeEndingEligibility().unlocked
        ? FINAL_ENDING_IDS.STAY
        : selected;
      runtime.finalEnding.choiceStarted = true;
      if (!startFinalEnding(FINAL_ENDINGS[valid] ? valid : FINAL_ENDING_IDS.STAY)) {
        runtime.finalEnding.choiceStarted = false;
      }
    }
  });
}

function registerEndingDefinition(endingId) {
  const endingState = getStoryState().flags.finalEnding;
  const savedSnapshot = normalizeJourneySnapshot(endingState?.journeySnapshot);
  const snapshot = savedSnapshot || createJourneySnapshot();
  const replay = Boolean(endingState?.replayMode);
  registerCutscene(`${FINAL_ENDING_CUTSCENE_PREFIX}${endingId}`, {
    allowSkip: false,
    clockPauseReason: FINAL_ENDING_CLOCK_REASON,
    scene: createEndingScene(getOpeningFrame(endingId), endingId),
    timeline: buildEndingTimeline(endingId, snapshot),
    onComplete: () => completeFinalEnding(endingId, { replay })
  });
}

function buildEndingTimeline(endingId, snapshot) {
  const timeline = [
    { type: "letterbox", to: 1, duration: 240 },
    { type: "fade", color: "black", to: 0, duration: 420 },
    { type: "checkpoint", sceneId: ENDING_PLAYING_SCENE, checkpointId: `ending-${endingId}-start` }
  ];
  if (endingId === FINAL_ENDING_IDS.RETURN) timeline.push(...buildReturnTimeline(snapshot));
  if (endingId === FINAL_ENDING_IDS.STAY) timeline.push(...buildStayTimeline(snapshot));
  if (endingId === FINAL_ENDING_IDS.BRIDGE) timeline.push(...buildBridgeTimeline(snapshot));
  timeline.push(...buildNpcEpilogueTimeline(snapshot));
  timeline.push(...buildMoEpilogueTimeline(endingId, snapshot));
  if (snapshot.nearlyComplete) {
    timeline.push(narration("Bạn đã quên Hà Nội."));
    timeline.push(narration("Nhưng Hà Nội chưa từng quên bạn."));
  }
  FINAL_ENDINGS[endingId].finalLines.forEach((line) => timeline.push(narration(line)));
  timeline.push({ type: "sceneState", patch: { frame: "credits", actorId: null }, duration: 540 });
  timeline.push(narration("HÀ NỘI PIXEL TOUR — một hành trình về lịch sử, ký ức và những người đã giữ lại một thành phố."));
  timeline.push({ type: "fade", color: "black", to: 0.66, duration: 420 });
  timeline.push({ type: "letterbox", to: 0, duration: 260 });
  return timeline;
}

function buildReturnTimeline(snapshot) {
  const gentle = snapshot.scores.compassion >= snapshot.scores.return;
  return [
    { type: "sceneState", patch: { frame: "return", portalAmount: 1 }, duration: 360 },
    speech("Bạn", FINAL_ENDINGS[FINAL_ENDING_IDS.RETURN].choiceText),
    speech("Mơ", gentle
      ? "Vậy hãy trở lại với họ. Nhưng xin đừng coi những ngày ở Hà Nội là một giấc mơ."
      : "Mình biết bạn chưa từng quên lời hứa với các đệ tử. Hãy đi trước khi cổng khép lại."),
    narration("Bạn bước qua khe sáng. Bên kia, ba bóng người đã chờ dưới tán cây gãy."),
    { type: "sceneState", patch: { frame: "return", portalAmount: 0.14 }, animation: "portalClosing", duration: 720 },
    narration("Cánh cổng khép lại. Gió trên cầu trở về với tiếng kim loại và dòng sông." )
  ];
}

function buildStayTimeline(snapshot) {
  const rooted = snapshot.scores.belonging >= 3 || snapshot.scores.compassion >= 3;
  return [
    { type: "sceneState", patch: { frame: "choice", portalAmount: 1 }, duration: 300 },
    speech("Bạn", FINAL_ENDINGS[FINAL_ENDING_IDS.STAY].choiceText),
    speech("Mơ", rooted
      ? "Hà Nội không thể trả lại tuổi thơ đã mất, nhưng nơi này vẫn còn rất nhiều ngày để cùng bạn sống tiếp."
      : "Vậy mình sẽ không hỏi bạn thuộc về đâu nữa. Chúng ta cứ bắt đầu từ ngày mai."),
    { type: "sceneState", patch: { frame: "hanoi-walk", portalAmount: 0 }, animation: "portalClosing", duration: 680 },
    narration("Cánh cổng đóng lại. Một buổi tối khác bắt đầu bên Hồ Gươm, bình thường và quý giá." )
  ];
}

function buildBridgeTimeline(snapshot) {
  const truthLine = snapshot.scores.truth >= 3
    ? "Sự thật không buộc ta phải mất một quê hương để giữ lấy quê hương còn lại."
    : "Ta đã đi qua cánh cổng này hai lần. Lần này, ta sẽ không để nó chọn thay mình.";
  return [
    { type: "sceneState", patch: { frame: "bridge", portalAmount: 1 }, duration: 360 },
    speech("Bạn", truthLine),
    narration("Bạn đặt mặt dây chuyền vào chiếc neo. Ánh sáng thôi xé rách không gian và thu lại thành một lối mở ổn định."),
    { type: "sceneState", patch: { frame: "bridge", portalAmount: 0.78 }, animation: "anchorStable", duration: 760 },
    narration("Hai thế giới không nhập vào nhau. Giữa chúng chỉ còn một con đường, được giữ bằng ký ức và lòng trắc ẩn." )
  ];
}

function buildNpcEpilogueTimeline(snapshot) {
  const entries = buildNpcEpilogueEntries(snapshot);
  const timeline = [];
  entries.forEach((entry, index) => {
    if (index === 0) {
      timeline.push({ type: "checkpoint", sceneId: ENDING_PLAYING_SCENE, checkpointId: "ending-epilogue" });
    }
    timeline.push({ type: "sceneState", patch: { frame: "epilogue", actorId: entry.id }, duration: 280 });
    timeline.push(narration(entry.text));
  });
  return timeline;
}

function buildMoEpilogueTimeline(endingId, snapshot) {
  if (endingId === FINAL_ENDING_IDS.RETURN) {
    return [
      { type: "sceneState", patch: { frame: "mo-photo", actorId: "mo" }, duration: 360 },
      narration(snapshot.relationshipTone === "close"
        ? "Mơ giữ bức ảnh mới chụp cùng bạn bên cạnh tấm ảnh cũ. Lần này, cô biết người trong ảnh đã kịp nói lời tạm biệt."
        : "Mơ cất bức ảnh mới cạnh tấm ảnh cũ, như một lời xác nhận rằng người mất tích đã thật sự trở về.")
    ];
  }
  if (endingId === FINAL_ENDING_IDS.STAY) {
    return [
      { type: "sceneState", patch: { frame: "hanoi-walk", actorId: "mo" }, duration: 360 },
      narration("Mơ mỉm cười. Hai người đi chậm quanh Hồ Gươm, không cần một cánh cổng nào để biết mình đang ở đúng nơi.")
    ];
  }
  return [
    { type: "sceneState", patch: { frame: "bridge", actorId: "mo", portalAmount: 0.78 }, duration: 360 },
    speech("Mơ", "Lần sau đừng mất cả một đời mới quay lại nhé.")
  ];
}

function buildNpcEpilogueEntries(snapshot) {
  const helped = new Set(snapshot.helpedQuestIds);
  return [
    {
      id: "tea-vendor",
      text: helped.has("teaVendorHelp")
        ? "Cô Hương vẫn để riêng một cốc trà đá cho người từng giúp cô dọn quán, kể câu chuyện ấy cho mọi vị khách mới."
        : "Cô bán trà đá vẫn nhớ người lạ đã học Hà Nội từ một cốc nước và vài câu chuyện bên đường."
    },
    {
      id: "motorbike-driver",
      text: snapshot.flags.touristUsedXeOm || snapshot.flags.transportChoice === "xeOm"
        ? "Chú xe ôm đầu phố khoe rằng mình từng chở một phần của hành trình lớn hơn bất kỳ cuốc xe nào."
        : "Chú xe ôm vẫn ngồi ở đầu phố, mỗi lần thấy một người lạc đường lại nhớ tới ngày bạn tỉnh dậy giữa Hà Nội."
    },
    {
      id: "children",
      text: helped.has("childToy") || snapshot.flags.childrenGreetPlayer
        ? "Bọn trẻ giữ con quay gỗ cẩn thận hơn. Chúng vẫn reo lên mỗi khi nghe ai kể chuyện về người tu hành biết trèo cây mà không cần khinh công."
        : "Những đứa trẻ quanh Nhà thờ tiếp tục lớn lên giữa tiếng chuông và khoảng sân quen thuộc."
    },
    {
      id: "priest",
      text: "Cha xứ khép cuốn sách sau lễ, nhớ rằng có những ký ức tìm đường trở lại bằng một tiếng chuông rất nhỏ."
    },
    {
      id: "guide",
      text: snapshot.choices.chapter3TourGroupChoice === "help" || helped.has("tourGroup")
        ? "Người hướng dẫn viên tiếp tục kể cho các đoàn khách về lịch sử, và về một người đã ở lại giúp người khác ngay giữa lúc tìm quá khứ của chính mình."
        : "Người hướng dẫn viên vẫn dẫn từng đoàn qua những lớp lịch sử của thành phố, để ký ức chung không bị bỏ quên."
    },
    {
      id: "long-bien-elder",
      text: "Ông lão Long Biên ngồi nhìn đường ray. Câu chuyện về đứa trẻ mất tích cuối cùng đã có một đoạn kết."
    },
    ...(snapshot.extraHelpedQuestTitles.length ? [{
      id: "helped-people",
      text: `Những người bạn từng giúp vẫn nhớ một bàn tay đã dừng lại vì họ: ${snapshot.extraHelpedQuestTitles.join(", ")}.`
    }] : [])
  ];
}

function completeFinalEnding(endingId, { replay = false } = {}) {
  const story = getStoryState();
  const endingState = getFinalEndingState();
  if (!endingState.journeySnapshot) endingState.journeySnapshot = createJourneySnapshot();
  endingState.status = "completed";
  endingState.completed = true;
  endingState.replayMode = false;
  endingState.selectedEndingId = endingId;
  endingState.completedAtGameMinute ??= Math.floor(Number(state.gameTime.totalGameMinutes) || 0);
  if (replay) endingState.replayCount += 1;
  endingState.epilogueFlags = buildNpcEpilogueEntries(normalizeJourneySnapshot(endingState.journeySnapshot)).map((entry) => entry.id);
  story.endingId = endingId;
  story.currentScene = ENDING_COMPLETE_SCENE;
  story.flags.finalEndingCompleted = true;
  story.flags.continueMode = false;
  story.flags.chapter4Objective = "";
  if (story.flags.chapter4) story.flags.chapter4.portalOpen = false;
  runtime.chapter4.portalWaiting = false;
  runtime.finalEnding.endingStarted = false;
  runtime.finalEnding.summaryPending = true;
  runtime.finalEnding.summaryShown = false;
  saveGame();
  updateHud();
}

function createJourneySnapshot() {
  const story = getStoryState();
  const helpedQuestIds = [];
  const branchingFlags = {};
  Object.entries(state.branchingQuestProgress || {}).forEach(([questId, progress]) => {
    if (!progress || typeof progress !== "object") return;
    Object.assign(branchingFlags, progress.flags || {});
    if (progress.status === "completed" && COMPLETE_OUTCOMES.has(progress.outcome)) helpedQuestIds.push(questId);
  });
  const storyHelpIds = [];
  if (story.humanMemories.includes("memory-tea-stall")) storyHelpIds.push("story-tea-stall");
  if (story.humanMemories.includes("memory-mo-and-children")) storyHelpIds.push("story-children");
  if (story.choices.chapter3TourGroupChoice === "help") storyHelpIds.push("story-tour-group");
  if (story.choices.chapter3SchoolGroupChoice === "help") storyHelpIds.push("story-school-group");
  const uniqueHelp = Array.from(new Set([...storyHelpIds, ...helpedQuestIds]));
  const photos = Object.values(state.photoAlbum?.photos || {}).filter(Boolean);
  const choices = { ...story.choices, originChoice: story.originChoice || story.choices.originChoice || null };
  const majorSkips = Number(choices.chapter3TourGroupChoice === "skip");
  const extraHelpedQuestTitles = helpedQuestIds
    .filter((questId) => !["teaVendorHelp", "childToy", "tourGroup"].includes(questId))
    .map((questId) => branchingQuests[questId]?.title)
    .filter(Boolean)
    .slice(0, 5);
  const relationshipTone = choices.chapter2RelationshipChoice === "trust" || choices.chapter3FearChoice === "share"
    ? "close"
    : choices.chapter2RelationshipChoice === "truth" ? "searching" : "guarded";
  const historyMarks = [...story.historyMarks];
  const humanMemories = [...story.humanMemories];
  const memoryClues = [...story.memoryClues];
  return {
    version: 1,
    historyMarks,
    humanMemories,
    memoryClues,
    scores: { ...story.scores },
    choices,
    helpedQuestIds,
    helpedNpcCount: uniqueHelp.length,
    extraHelpedQuestTitles,
    photoCount: photos.length,
    photoTitles: photos.map((photo) => photo.title).filter(Boolean),
    flags: { ...extractRememberedFlags(story.flags), ...branchingFlags },
    majorSkips,
    relationshipTone,
    nearlyComplete: historyMarks.length >= 4 && humanMemories.length >= 4 && memoryClues.length >= 10
  };
}

function extractRememberedFlags(flags) {
  const result = {};
  Object.entries(flags || {}).forEach(([key, value]) => {
    if (["string", "number", "boolean"].includes(typeof value)) result[key] = value;
  });
  return result;
}

function normalizeJourneySnapshot(raw) {
  if (!raw || typeof raw !== "object") return null;
  return {
    version: 1,
    historyMarks: Array.isArray(raw.historyMarks) ? [...raw.historyMarks] : [],
    humanMemories: Array.isArray(raw.humanMemories) ? [...raw.humanMemories] : [],
    memoryClues: Array.isArray(raw.memoryClues) ? [...raw.memoryClues] : [],
    scores: { return: 0, belonging: 0, truth: 0, compassion: 0, curiosity: 0, ...(raw.scores || {}) },
    choices: { ...(raw.choices || {}) },
    helpedQuestIds: Array.isArray(raw.helpedQuestIds) ? [...raw.helpedQuestIds] : [],
    helpedNpcCount: Math.max(0, Number(raw.helpedNpcCount) || 0),
    extraHelpedQuestTitles: Array.isArray(raw.extraHelpedQuestTitles) ? [...raw.extraHelpedQuestTitles] : [],
    photoCount: Math.max(0, Number(raw.photoCount) || 0),
    photoTitles: Array.isArray(raw.photoTitles) ? [...raw.photoTitles] : [],
    flags: { ...(raw.flags || {}) },
    majorSkips: Math.max(0, Number(raw.majorSkips) || 0),
    relationshipTone: typeof raw.relationshipTone === "string" ? raw.relationshipTone : "guarded",
    nearlyComplete: Boolean(raw.nearlyComplete)
  };
}

function normalizeFinalEndingState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    version: 1,
    status: typeof source.status === "string" ? source.status : "idle",
    selectedEndingId: FINAL_ENDINGS[source.selectedEndingId] ? source.selectedEndingId : null,
    completed: Boolean(source.completed),
    completedAtGameMinute: Number.isFinite(Number(source.completedAtGameMinute)) ? Number(source.completedAtGameMinute) : null,
    replayMode: Boolean(source.replayMode),
    replayCount: Math.max(0, Math.floor(Number(source.replayCount) || 0)),
    epilogueFlags: Array.isArray(source.epilogueFlags) ? [...source.epilogueFlags] : [],
    journeySnapshot: normalizeJourneySnapshot(source.journeySnapshot)
  };
}

function renderJourneyJournal(endingId, snapshot) {
  const ending = FINAL_ENDINGS[endingId];
  ui.endingTitle.textContent = ending.journalTitle;
  ui.endingSubtitle.textContent = `Đoạn kết: ${ending.shortTitle}`;
  ui.endingContent.innerHTML = "";
  ui.endingContent.append(
    createJournalSection(
      "Những nơi còn nhớ bạn",
      `${snapshot.historyMarks.length} Dấu ấn lịch sử`,
      formatNamedList(snapshot.historyMarks, ENDING_HISTORY_LABELS, "Chưa ghi lại Dấu ấn lịch sử nào.")
    ),
    createJournalSection(
      "Những ký ức đã mang về",
      `${snapshot.humanMemories.length} Ký ức con người`,
      formatNamedList(snapshot.humanMemories, ENDING_MEMORY_LABELS, "Hành trình vẫn còn những khoảng trống ký ức.")
    ),
    createJournalSection(
      "Những bàn tay đã gặp",
      `${snapshot.helpedNpcCount} người hoặc nhóm đã được giúp`,
      snapshot.extraHelpedQuestTitles.length
        ? snapshot.extraHelpedQuestTitles.join(" · ")
        : "Những cuộc gặp nhỏ vẫn được thành phố giữ lại bằng lời chào và sự biết ơn."
    ),
    createJournalSection(
      "Những khung hình còn lại",
      `${snapshot.photoCount} ảnh trong Album`,
      snapshot.photoTitles.length ? snapshot.photoTitles.slice(0, 6).join(" · ") : "Album vẫn còn chờ những góc Hà Nội tiếp theo."
    ),
    createJournalSection(
      "Những lựa chọn định hình hành trình",
      "Không có con số nào thay cho một lựa chọn",
      formatImportantChoices(snapshot.choices)
    ),
    createJournalSection(
      "Trang cuối",
      ending.shortTitle,
      ending.finalLines.join(" ")
    )
  );
  if (snapshot.nearlyComplete) {
    const special = document.createElement("blockquote");
    special.className = "ending-special-lines";
    special.append(createLine("Bạn đã quên Hà Nội."), createLine("Nhưng Hà Nội chưa từng quên bạn."));
    ui.endingContent.appendChild(special);
  }
}

function createJournalSection(title, meta, body) {
  const section = document.createElement("section");
  section.className = "ending-journal-entry";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const small = document.createElement("p");
  small.className = "ending-journal-meta";
  small.textContent = meta;
  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  section.append(heading, small, paragraph);
  return section;
}

function createLine(text) {
  const line = document.createElement("p");
  line.textContent = text;
  return line;
}

function renderEndingActions() {
  ui.endingActions.innerHTML = "";
  ENDING_ACTIONS.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.endingAction = action.id;
    button.dataset.actionLabel = action.label;
    button.textContent = action.label;
    ui.endingActions.appendChild(button);
  });
}

function renderEndingActionSelection() {
  const buttons = getSelectableButtons(ui.endingActions);
  renderButtonSelection(buttons, runtime.finalEnding.selectedIndex, isFinalEndingPanelOpen());
}

function handleEndingActionClick(event) {
  const button = event.target.closest("button[data-ending-action]");
  if (!button) return;
  if (button.dataset.endingAction === "continue") continueAfterEnding();
  if (button.dataset.endingAction === "replay") replayFinalEnding();
  if (button.dataset.endingAction === "new-journey") beginNewJourney();
}

function createEndingChoice(endingId) {
  const ending = FINAL_ENDINGS[endingId];
  return { id: endingId, text: ending.choiceText, choiceKey: "finalEndingChoice", value: endingId };
}

function createEndingScene(frame, endingId) {
  return {
    id: "final-ending-scene",
    renderer: "finalEnding",
    state: { frame, endingId, actorId: null, portalAmount: 1 }
  };
}

function getOpeningFrame(endingId) {
  if (endingId === FINAL_ENDING_IDS.RETURN) return "return";
  if (endingId === FINAL_ENDING_IDS.STAY) return "hanoi-walk";
  return "bridge";
}

function formatNamedList(ids, labels, fallback) {
  if (!ids.length) return fallback;
  return ids.map((id) => labels[id] || id).join(" · ");
}

function formatImportantChoices(choices) {
  const labels = [];
  Object.entries(IMPORTANT_CHOICE_LABELS).forEach(([key, variants]) => {
    const label = variants[choices[key]];
    if (label) labels.push(label);
  });
  return labels.length ? labels.join(" · ") : "Những lựa chọn của hành trình vẫn nằm trong cách thành phố nhớ về bạn.";
}

function createRuntimeState() {
  return {
    choiceStarted: false,
    endingStarted: false,
    summaryPending: false,
    summaryShown: false,
    selectedIndex: 0
  };
}

function ensureRuntimeState() {
  if (!runtime.finalEnding) runtime.finalEnding = createRuntimeState();
  return runtime.finalEnding;
}

function narration(text) {
  return { type: "dialogue", kind: "narration", text };
}

function speech(speaker, text) {
  return { type: "dialogue", kind: "speech", speaker, text };
}

function installDebugHelpers() {
  window.startFinalChoiceForDebug = startFinalChoice;
  window.startEndingForDebug = (endingId) => startFinalEnding(endingId, { skipEligibility: true });
  window.getBridgeEndingEligibilityForDebug = getBridgeEndingEligibility;
  window.openEndingJournalForDebug = openFinalEndingJournal;
}
