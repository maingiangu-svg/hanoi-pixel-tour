import {
  HANOI_ARRIVAL_CLUE,
  HANOI_ARRIVAL_OBJECTIVES,
  HANOI_ARRIVAL_PLAYER_POSITION,
  HANOI_ARRIVAL_SCENE,
  HANOI_ARRIVAL_TIMELINE
} from "../data/hanoiArrival.js";
import { HANOI_ARRIVAL_ID } from "../data/immortalIntro.js";
import { player, state } from "../state.js";
import { snapCameraToPlayer } from "../camera.js";
import { addUnique } from "../utils/helpers.js";
import { playVehicleHorn } from "./audioManager.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { showMessage } from "./modal.js";
import { getStoryState } from "./storyState.js";
import { startChapter1 } from "./chapter1.js";

const ARRIVAL_CLOCK_PAUSE_REASON = "story-hanoi-arrival";
const VALID_ORIGINS = new Set(Object.keys(HANOI_ARRIVAL_OBJECTIVES));
let initialized = false;

export function initHanoiArrival() {
  if (initialized) return;
  initialized = true;
  registerCutscene(HANOI_ARRIVAL_ID, {
    allowSkip: false,
    initialVisual: { fadeColor: "#ffffff", fadeAlpha: 1, letterbox: 1 },
    scene: HANOI_ARRIVAL_SCENE,
    timeline: HANOI_ARRIVAL_TIMELINE,
    clockPauseReason: ARRIVAL_CLOCK_PAUSE_REASON,
    cueHandler: handleArrivalCue,
    onComplete: finishHanoiArrival
  });
}

export function startHanoiArrival() {
  initHanoiArrival();
  const story = getStoryState();
  if (story.introCompleted || isCutsceneActive()) return false;
  prepareArrivalWorld();
  story.currentScene = HANOI_ARRIVAL_ID;
  return startCutscene(HANOI_ARRIVAL_ID, {
    sceneId: HANOI_ARRIVAL_ID,
    returnScene: HANOI_ARRIVAL_ID,
    audioDuck: 0.62
  });
}

export function isHanoiArrivalPending() {
  const story = getStoryState();
  return !story.introCompleted && story.currentScene === HANOI_ARRIVAL_ID;
}

function prepareArrivalWorld() {
  state.currentMapId = "hoanKiem";
  player.x = HANOI_ARRIVAL_PLAYER_POSITION.x;
  player.y = HANOI_ARRIVAL_PLAYER_POSITION.y;
  player.facing = "right";
  player.moving = false;
  state.player.x = Math.round(player.x);
  state.player.y = Math.round(player.y);
  addUnique(state.visitedMaps, "hoanKiem");
  snapCameraToPlayer();
}

function finishHanoiArrival() {
  const story = getStoryState();
  const originChoice = story.originChoice || story.choices.originChoice;
  if (!VALID_ORIGINS.has(originChoice)) return;

  story.originChoice = originChoice;
  story.introCompleted = true;
  story.currentChapter = 1;
  story.currentScene = "chapter-1";
  story.unlockedMaps = ["hoanKiem"];
  story.flags.hanoiArrivalCompleted = true;
  story.flags.originChapter1Objective = HANOI_ARRIVAL_OBJECTIVES[originChoice];
  if (!story.memoryClues.includes(HANOI_ARRIVAL_CLUE)) story.memoryClues.push(HANOI_ARRIVAL_CLUE);

  prepareArrivalWorld();
  startChapter1({ reset: true });
  showMessage("W/A/S/D di chuyển · E tương tác · M mở bản đồ");
}

function handleArrivalCue(cue) {
  if (cue === "arrivalStreet") playVehicleHorn();
}

export function getHanoiArrivalStateForDebug() {
  const story = getStoryState();
  return {
    scene: story.currentScene,
    chapter: story.currentChapter,
    introCompleted: story.introCompleted,
    originChoice: story.originChoice,
    clue: story.memoryClues.includes(HANOI_ARRIVAL_CLUE),
    unlockedMaps: [...story.unlockedMaps]
  };
}
