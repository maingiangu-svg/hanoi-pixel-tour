export const STORY_VERSION = 2;

export const STORY_SCORE_TYPES = Object.freeze([
  "return",
  "belonging",
  "truth",
  "compassion",
  "curiosity"
]);

export function createDefaultStoryState() {
  return {
    version: STORY_VERSION,
    introCompleted: false,
    currentScene: "gender-selection",
    currentChapter: 0,
    originChoice: null,
    unlockedMaps: [],
    historyMarks: [],
    humanMemories: [],
    memoryClues: [],
    scores: Object.fromEntries(STORY_SCORE_TYPES.map((type) => [type, 0])),
    choices: {},
    flags: {},
    endingId: null,
    completedChapters: [],
    checkpoint: null
  };
}

export function normalizeStoryState(rawStory, savedState, availableMapIds = []) {
  const base = createDefaultStoryState();
  const raw = rawStory && typeof rawStory === "object" ? rawStory : {};
  const hasCurrentIntroState = Number(raw.version) >= STORY_VERSION && typeof raw.introCompleted === "boolean";
  const legacyProgress = !hasCurrentIntroState && hasLegacyProgress(savedState);
  const unlockedFallback = legacyProgress ? availableMapIds : base.unlockedMaps;

  return {
    ...base,
    version: STORY_VERSION,
    introCompleted: legacyProgress || Boolean(raw.introCompleted),
    currentScene: normalizeText(raw.currentScene)
      || (legacyProgress ? "hanoi-tour" : base.currentScene),
    currentChapter: normalizeChapter(raw.currentChapter),
    originChoice: normalizeNullableText(raw.originChoice),
    unlockedMaps: normalizeIdList(legacyProgress ? unlockedFallback : raw.unlockedMaps, availableMapIds, unlockedFallback),
    historyMarks: normalizeStringList(raw.historyMarks),
    humanMemories: normalizeStringList(raw.humanMemories),
    memoryClues: normalizeStringList(raw.memoryClues),
    scores: normalizeScores(raw.scores),
    choices: normalizeRecord(raw.choices),
    flags: normalizeRecord(raw.flags),
    endingId: normalizeNullableText(raw.endingId),
    completedChapters: normalizeStringList(raw.completedChapters),
    checkpoint: normalizeCheckpoint(raw.checkpoint)
  };
}

export function hasLegacyProgress(savedState) {
  if (!savedState || typeof savedState !== "object") return false;
  const hasGender = ["male", "female"].includes(
    savedState.profile?.gender || savedState.playerProfile?.gender || savedState.gender
  );
  const hasCollectionProgress = [
    savedState.discoveredLandmarks,
    savedState.discoveredFoods,
    savedState.eatenFoods,
    savedState.inventory?.foods,
    savedState.inventory?.souvenirs,
    savedState.inventory?.stamps,
    savedState.inventory?.specialItems
  ].some((list) => Array.isArray(list) && list.length > 0);
  const hasTaskProgress = [
    savedState.completedQuizzes,
    savedState.completedTasks,
    savedState.taskStages,
    savedState.branchingQuestProgress
  ].some((record) => record && typeof record === "object" && Object.keys(record).length > 0);
  const hasTravelProgress = Array.isArray(savedState.visitedMaps) && savedState.visitedMaps.length > 1;
  const hasClockProgress = Number(savedState.gameTime?.totalGameMinutes) > 420;

  return hasGender || hasCollectionProgress || hasTaskProgress || hasTravelProgress || hasClockProgress ||
    Boolean(savedState.vehicle?.owned) || Boolean(savedState.moCompanion?.active) ||
    (Number.isFinite(savedState.money) && savedState.money !== 50000);
}

function normalizeScores(rawScores) {
  const source = rawScores && typeof rawScores === "object" ? rawScores : {};
  return Object.fromEntries(STORY_SCORE_TYPES.map((type) => [
    type,
    Number.isFinite(Number(source[type])) ? Number(source[type]) : 0
  ]));
}

function normalizeCheckpoint(rawCheckpoint) {
  if (!rawCheckpoint || typeof rawCheckpoint !== "object") return null;
  const sceneId = normalizeText(rawCheckpoint.sceneId);
  const checkpointId = normalizeText(rawCheckpoint.checkpointId);
  if (!sceneId || !checkpointId) return null;
  return {
    sceneId,
    checkpointId,
    cutsceneId: normalizeNullableText(rawCheckpoint.cutsceneId),
    chapter: normalizeChapter(rawCheckpoint.chapter),
    stepIndex: Number.isFinite(Number(rawCheckpoint.stepIndex))
      ? Math.max(0, Math.floor(Number(rawCheckpoint.stepIndex)))
      : null,
    sceneState: normalizeSceneState(rawCheckpoint.sceneState),
    visualState: normalizeVisualState(rawCheckpoint.visualState),
    cameraState: normalizeCameraState(rawCheckpoint.cameraState),
    active: Boolean(rawCheckpoint.active)
  };
}

function normalizeSceneState(value) {
  const source = normalizeRecord(value);
  delete source.animation;
  return source;
}

function normalizeVisualState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    fadeColor: typeof value.fadeColor === "string" ? value.fadeColor : "#000000",
    fadeAlpha: clamp01(value.fadeAlpha),
    letterbox: clamp01(value.letterbox),
    lightingColor: typeof value.lightingColor === "string" ? value.lightingColor : "#000000",
    lightingAlpha: clamp01(value.lightingAlpha)
  };
}

function normalizeCameraState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    locked: Boolean(value.locked),
    focusX: finiteOrNull(value.focusX),
    focusY: finiteOrNull(value.focusY),
    zoom: Number.isFinite(Number(value.zoom)) ? Math.max(1, Math.min(2.2, Number(value.zoom))) : 1
  };
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...value } : {};
}

function normalizeIdList(value, availableMapIds, fallback = []) {
  const allowed = new Set(availableMapIds);
  const source = Array.isArray(value) ? value : fallback;
  return Array.from(new Set(source.filter((id) => typeof id === "string" && allowed.has(id))));
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item) => typeof item === "string" && item.length > 0)));
}

function normalizeChapter(value) {
  if (typeof value === "string" && value.length > 0) return value;
  return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
}

function normalizeNullableText(value) {
  return value === null ? null : normalizeText(value);
}

function normalizeText(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function finiteOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}
