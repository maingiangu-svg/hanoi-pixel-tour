import {
  HANOI_ARRIVAL_ID,
  IMMORTAL_INTRO_CLUES,
  IMMORTAL_INTRO_ID,
  IMMORTAL_INTRO_SCENE,
  IMMORTAL_INTRO_TIMELINE
} from "../data/immortalIntro.js";
import { runtime, state } from "../state.js";
import {
  playForeshadowBell,
  playIntroDistantThunder,
  playIntroLightningStrike,
  playIntroWindRise,
  playPortalResonance,
  setCutsceneAudioDucking
} from "./audioManager.js";
import { isCutsceneActive, registerCutscene, startCutscene } from "./cutscene.js";
import { addMemoryClue, getStoryState } from "./storyState.js";
import { startHanoiArrival } from "./hanoiArrival.js";

const INTRO_CLOCK_PAUSE_REASON = "story-immortal-intro";
let initialized = false;

export function initImmortalIntro() {
  if (initialized) return;
  initialized = true;

  registerCutscene(IMMORTAL_INTRO_ID, {
    allowSkip: true,
    presentationClass: "is-immortal-intro",
    scene: IMMORTAL_INTRO_SCENE,
    timeline: IMMORTAL_INTRO_TIMELINE,
    clockPauseReason: INTRO_CLOCK_PAUSE_REASON,
    cueHandler: handleIntroCue,
    onComplete: finishImmortalIntro
  });

}

export function startImmortalIntro() {
  initImmortalIntro();
  const story = getStoryState();
  if (story.introCompleted || !state.profile?.gender || isCutsceneActive()) return false;
  story.currentScene = IMMORTAL_INTRO_ID;
  return startCutscene(IMMORTAL_INTRO_ID, {
    sceneId: IMMORTAL_INTRO_ID,
    returnScene: IMMORTAL_INTRO_ID,
    audioDuck: 0.24
  });
}

export function resumeImmortalIntroFlow() {
  initImmortalIntro();
  const story = getStoryState();
  if (story.introCompleted || !state.profile?.gender) return false;
  if (isCutsceneActive()) return false;
  if (story.currentScene === HANOI_ARRIVAL_ID) return startHanoiArrival();
  return startImmortalIntro();
}

export function isImmortalIntroPending() {
  return !getStoryState().introCompleted && Boolean(state.profile?.gender);
}

function finishImmortalIntro() {
  IMMORTAL_INTRO_CLUES.forEach((clueId) => addMemoryClue(clueId, { save: false }));
  getStoryState().currentScene = HANOI_ARRIVAL_ID;
  startHanoiArrival();
}

function handleIntroCue(cue) {
  if (cue === "introWindRise") playIntroWindRise();
  if (cue === "introDistantThunder") playIntroDistantThunder();
  if (cue === "introLightningStrike") {
    playIntroLightningStrike();
    setCutsceneAudioDucking(0.1, 0.12);
  }
  if (cue === "introChurchBell") playForeshadowBell();
  if (cue === "introPortalResonance") {
    setCutsceneAudioDucking(0.2, 0.28);
    playPortalResonance();
  }
}

export function getIntroRuntimeStateForDebug() {
  return {
    scene: getStoryState().currentScene,
    activeCutscene: runtime.cutscene?.id || null,
    introCompleted: getStoryState().introCompleted,
    clues: IMMORTAL_INTRO_CLUES.filter((clueId) => getStoryState().memoryClues.includes(clueId))
  };
}
