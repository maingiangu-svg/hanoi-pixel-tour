import { player, setState, state } from "./state.js";
import { initInput } from "./input.js";
import { snapCameraToPlayer, updateCamera } from "./camera.js";
import { loadGame, saveGame, setAfterSaveHandler } from "./storage.js";
import { movePlayer } from "./systems/movement.js";
import { updateNearbyInteractable } from "./systems/interaction.js";
import { handlePendingVictory } from "./systems/questSystem.js";
import { setInfoCloseHandler, showMessage } from "./systems/modal.js";
import { initCharacterSelection, openCharacterSelection } from "./systems/characterSelection.js";
import { addUnique, placePlayerAtSafeStart } from "./utils/helpers.js";
import { isPlayerAreaWalkable } from "./utils/collision.js";
import { drawGame } from "./render/renderGame.js";
import { updateHud } from "./render/renderUI.js";
import { preloadSpriteAssets } from "./render/spriteAssets.js";
import { initCanvasLayout } from "./systems/canvasLayout.js";
import { initGameClock, resetGameClockFrame, updateGameClock } from "./systems/gameClock.js";
import { updateNpcSchedules } from "./systems/npcSchedule.js";
import { initWeather, updateWeather } from "./systems/weather.js";
import { initAudioManager } from "./systems/audioManager.js";
import { updateAreaAmbience } from "./systems/areaAmbience.js";
import { updateNpcReactions } from "./systems/npcReactions.js";
import { updatePhotoSpotDiscovery } from "./systems/photoMode.js";
import { hydrateBranchingQuests, updateBranchingQuests } from "./systems/branchingQuest.js";
import { hydrateRandomEvents, initRandomEvents, updateRandomEvents } from "./systems/randomEvents.js";
import { updateVehicleTransition } from "./systems/vehicle.js";
import { hydrateEnvironmentInteraction, updateEnvironmentInteraction } from "./systems/environmentInteraction.js";
import { initNavigation, updateTrackedObjective } from "./systems/navigation.js";
import { initCutsceneController, isCutsceneActive, resumeCutsceneFromStoryCheckpoint, updateCutscene } from "./systems/cutscene.js";
import { resumeStoryFromSave } from "./systems/storyState.js";
import { initImmortalIntro, resumeImmortalIntroFlow } from "./systems/immortalIntro.js";
import { initHanoiArrival } from "./systems/hanoiArrival.js";
import { hydrateChapter1, initChapter1, updateChapter1 } from "./systems/chapter1.js";
import { hydrateChapter2, initChapter2, updateChapter2 } from "./systems/chapter2.js";
import { hydrateChapter3, initChapter3, updateChapter3 } from "./systems/chapter3.js";
import { hydrateChapter4, initChapter4, updateChapter4 } from "./systems/chapter4.js";
import { hydrateFinalEnding, initFinalEnding, updateFinalEnding } from "./systems/finalEnding.js";
import { hydrateViewMode, isViewModeActive, updateViewMode } from "./systems/viewMode.js";
import { hydrateDialogueView, initDialogueView, isDialogueViewActive, updateDialogueView } from "./systems/dialogueView.js";

function gameLoop(timestamp) {
  updateCutscene(timestamp);
  updateDialogueView(timestamp);
  updateFinalEnding();
  updateGameClock(timestamp);
  updateVehicleTransition(timestamp);
  updateWeather();
  updateRandomEvents();
  updateNpcSchedules();
  updateChapter1(timestamp);
  updateChapter2();
  updateChapter3();
  updateChapter4();
  updateAreaAmbience(timestamp);
  updateEnvironmentInteraction(timestamp);
  updateViewMode(timestamp);
  const gameplayLocked = isCutsceneActive() || isDialogueViewActive() || isViewModeActive();
  if (!gameplayLocked) movePlayer();
  if (!gameplayLocked) updateBranchingQuests();
  updateTrackedObjective();
  if (!isDialogueViewActive()) {
    updateNpcReactions(timestamp);
    updateCamera();
  }
  if (!gameplayLocked) {
    updatePhotoSpotDiscovery(timestamp);
    updateNearbyInteractable();
  }
  drawGame();
  requestAnimationFrame(gameLoop);
}

function bootGame() {
  preloadSpriteAssets();
  setAfterSaveHandler(updateHud);
  setInfoCloseHandler(handlePendingVictory);
  initGameClock();
  setState(loadGame());
  resumeStoryFromSave();
  initWeather();
  initRandomEvents();
  initAudioManager();
  initCutsceneController();
  initDialogueView();
  initChapter1();
  initChapter2();
  initChapter3();
  initChapter4();
  initFinalEnding();
  initHanoiArrival();
  initImmortalIntro();
  resetGameClockFrame();
  initCanvasLayout();
  player.x = state.player.x;
  player.y = state.player.y;
  hydrateEnvironmentInteraction();
  hydrateViewMode();
  hydrateDialogueView();
  hydrateBranchingQuests();
  hydrateRandomEvents();
  hydrateChapter1();
  hydrateChapter2();
  hydrateChapter3();
  hydrateChapter4();
  hydrateFinalEnding();
  updateWeather();
  updateNpcSchedules();
  initNavigation();
  resumeCutsceneFromStoryCheckpoint();
  if (!isPlayerAreaWalkable(player.x, player.y)) placePlayerAtSafeStart(state.currentMapId);
  snapCameraToPlayer();
  updatePhotoSpotDiscovery(0);
  addUnique(state.visitedMaps, state.currentMapId);
  updateHud();
  saveGame();
  initInput();
  initCharacterSelection();
  if (!state.profile.gender) {
    openCharacterSelection({ firstTime: true });
  } else if (state.story?.introCompleted && state.story?.currentScene === "hanoi-tour") {
    showMessage("Bắt đầu chuyến đi: hãy ghé Hồ Gươm, ăn đặc sản, sưu tầm tem và mở Sổ tay khám phá bằng phím J.");
  } else if (!isCutsceneActive()) {
    resumeImmortalIntroFlow();
  }
  requestAnimationFrame(gameLoop);
}

bootGame();
