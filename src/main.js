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
import { initCanvasLayout } from "./systems/canvasLayout.js";
import { initGameClock, resetGameClockFrame, updateGameClock } from "./systems/gameClock.js";
import { updateNpcSchedules } from "./systems/npcSchedule.js";

function gameLoop(timestamp) {
  updateGameClock(timestamp);
  updateNpcSchedules();
  movePlayer();
  updateCamera();
  updateNearbyInteractable();
  drawGame();
  requestAnimationFrame(gameLoop);
}

function bootGame() {
  setAfterSaveHandler(updateHud);
  setInfoCloseHandler(handlePendingVictory);
  initGameClock();
  setState(loadGame());
  resetGameClockFrame();
  initCanvasLayout();
  player.x = state.player.x;
  player.y = state.player.y;
  updateNpcSchedules();
  if (!isPlayerAreaWalkable(player.x, player.y)) placePlayerAtSafeStart(state.currentMapId);
  snapCameraToPlayer();
  addUnique(state.visitedMaps, state.currentMapId);
  updateHud();
  saveGame();
  initInput();
  initCharacterSelection();
  if (state.profile.gender) {
    showMessage("Bắt đầu chuyến đi: hãy ghé Hồ Gươm, ăn đặc sản, sưu tầm tem và mở Sổ tay khám phá bằng phím J.");
  } else {
    openCharacterSelection({ firstTime: true });
  }
  requestAnimationFrame(gameLoop);
}

bootGame();
