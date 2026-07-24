import { createDefaultStoryState, STORY_SCORE_TYPES } from "../data/storyState.js";
import { state } from "../state.js";
import { saveGame } from "../storage.js";
import { recordMoStoryChoice } from "./moRelationship.js";

export function getStoryState() {
  if (!state.story || typeof state.story !== "object") {
    state.story = createDefaultStoryState();
  }
  return state.story;
}

export function setStoryScene(sceneId, { save = true } = {}) {
  if (!isNonEmptyString(sceneId)) return false;
  getStoryState().currentScene = sceneId;
  if (save) saveGame();
  return true;
}

export function startStoryChapter(chapterId, { sceneId = null, save = true } = {}) {
  if (!isValidChapter(chapterId)) return false;
  const story = getStoryState();
  story.currentChapter = chapterId;
  if (isNonEmptyString(sceneId)) story.currentScene = sceneId;
  if (save) saveGame();
  return true;
}

export function completeStoryChapter(chapterId, { nextChapter = null, save = true } = {}) {
  if (!isValidChapter(chapterId)) return false;
  const story = getStoryState();
  const key = String(chapterId);
  if (!story.completedChapters.includes(key)) story.completedChapters.push(key);
  if (isValidChapter(nextChapter)) story.currentChapter = nextChapter;
  if (save) saveGame();
  return true;
}

export function completeStoryIntro({ save = true } = {}) {
  const story = getStoryState();
  story.introCompleted = true;
  story.currentScene = "hanoi-tour";
  if (save) saveGame();
}

export function setStoryChoice(key, value, { save = true } = {}) {
  if (!isNonEmptyString(key)) return false;
  const story = getStoryState();
  story.choices[key] = value;
  if (key === "originChoice" && isNonEmptyString(value)) story.originChoice = value;
  recordMoStoryChoice(key, value, { save: false });
  if (save) saveGame();
  return true;
}

export function addStoryScore(type, amount, { save = true } = {}) {
  if (!STORY_SCORE_TYPES.includes(type) || !Number.isFinite(Number(amount))) return false;
  const story = getStoryState();
  story.scores[type] = Number(story.scores[type] || 0) + Number(amount);
  if (save) saveGame();
  return true;
}

export function addMemoryClue(clueId, { save = true } = {}) {
  if (!isNonEmptyString(clueId)) return false;
  const clues = getStoryState().memoryClues;
  if (!clues.includes(clueId)) clues.push(clueId);
  if (save) saveGame();
  return true;
}

export function addHistoryMark(markId, { save = true } = {}) {
  if (!isNonEmptyString(markId)) return false;
  const marks = getStoryState().historyMarks;
  if (!marks.includes(markId)) marks.push(markId);
  if (save) saveGame();
  return true;
}

export function addHumanMemory(memoryId, { save = true } = {}) {
  if (!isNonEmptyString(memoryId)) return false;
  const memories = getStoryState().humanMemories;
  if (!memories.includes(memoryId)) memories.push(memoryId);
  if (save) saveGame();
  return true;
}

export function hasMemoryClue(clueId) {
  return getStoryState().memoryClues.includes(clueId);
}

export function unlockStoryMap(mapId, { save = true } = {}) {
  if (!isNonEmptyString(mapId)) return false;
  const unlockedMaps = getStoryState().unlockedMaps;
  if (!unlockedMaps.includes(mapId)) unlockedMaps.push(mapId);
  if (save) saveGame();
  return true;
}

export function isStoryMapUnlocked(mapId) {
  const story = getStoryState();
  if (!story.introCompleted || story.currentScene === "hanoi-tour") return true;
  if (!story.unlockedMaps.length) return true;
  return story.unlockedMaps.includes(mapId);
}

export function isStoryTargetUnlocked(objective) {
  if (!objective || typeof objective !== "object") return true;
  const targetMapId = objective.targetMap || objective.mapId;
  if (targetMapId && !isStoryMapUnlocked(targetMapId)) return false;
  const story = getStoryState();
  const targetId = objective.targetId || objective.id;
  if (Number(story.currentChapter) === 1 && !story.flags.chapter1Completed) {
    if (["nhaThoLon", "enterNhaThoLon", "returnMoToChurch"].includes(targetId)) {
      return Boolean(story.flags.chapter1ChurchUnlocked);
    }
  }
  return true;
}

export function saveStoryCheckpoint(checkpoint, { save = true } = {}) {
  if (!checkpoint || !isNonEmptyString(checkpoint.sceneId) || !isNonEmptyString(checkpoint.checkpointId)) {
    return false;
  }
  const story = getStoryState();
  story.currentScene = checkpoint.sceneId;
  if (isValidChapter(checkpoint.chapter)) story.currentChapter = checkpoint.chapter;
  story.checkpoint = {
    sceneId: checkpoint.sceneId,
    checkpointId: checkpoint.checkpointId,
    cutsceneId: isNonEmptyString(checkpoint.cutsceneId) ? checkpoint.cutsceneId : null,
    chapter: isValidChapter(checkpoint.chapter) ? checkpoint.chapter : story.currentChapter,
    stepIndex: Number.isFinite(Number(checkpoint.stepIndex))
      ? Math.max(0, Math.floor(Number(checkpoint.stepIndex)))
      : null,
    sceneState: checkpoint.sceneState && typeof checkpoint.sceneState === "object"
      ? { ...checkpoint.sceneState }
      : {},
    visualState: checkpoint.visualState && typeof checkpoint.visualState === "object"
      ? { ...checkpoint.visualState }
      : {},
    cameraState: checkpoint.cameraState && typeof checkpoint.cameraState === "object"
      ? { ...checkpoint.cameraState }
      : {},
    active: checkpoint.active !== false
  };
  if (save) saveGame();
  return true;
}

export function clearStoryCheckpoint({ save = true } = {}) {
  getStoryState().checkpoint = null;
  if (save) saveGame();
}

export function resumeStoryFromSave() {
  const story = getStoryState();
  if (!story.introCompleted && !state.profile?.gender) {
    story.currentScene = "gender-selection";
  }
  return story.checkpoint?.active ? { ...story.checkpoint } : null;
}

export function resetStoryForDebug() {
  state.story = createDefaultStoryState();
  saveGame();
  return getStoryState();
}

export function listStoryFlagsForDebug() {
  const story = getStoryState();
  return {
    flags: { ...story.flags },
    choices: { ...story.choices },
    scores: { ...story.scores },
    memoryClues: [...story.memoryClues]
  };
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function isValidChapter(value) {
  return (typeof value === "string" && value.length > 0) || Number.isFinite(Number(value));
}
