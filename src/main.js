import { player, setState, state } from "./state.js";
import { initInput } from "./input.js";
import { snapCameraToPlayer, updateCamera } from "./camera.js";
import { loadGame, saveGame, setAfterSaveHandler } from "./storage.js";
import { movePlayer } from "./systems/movement.js";
import { updateNearbyInteractable } from "./systems/interaction.js";
import { handlePendingVictory } from "./systems/questSystem.js";
import { setInfoCloseHandler, showMessage } from "./systems/modal.js";
import { addUnique, placePlayerAtSafeStart } from "./utils/helpers.js";
import { isPlayerAreaWalkable } from "./utils/collision.js";
import { drawGame } from "./render/renderGame.js";
import { updateHud } from "./render/renderUI.js";

function gameLoop() {
  movePlayer();
  updateCamera();
  updateNearbyInteractable();
  drawGame();
  requestAnimationFrame(gameLoop);
}

function bootGame() {
  setAfterSaveHandler(updateHud);
  setInfoCloseHandler(handlePendingVictory);
  setState(loadGame());
  player.x = state.player.x;
  player.y = state.player.y;
  if (!isPlayerAreaWalkable(player.x, player.y)) placePlayerAtSafeStart(state.currentMapId);
  snapCameraToPlayer();
  addUnique(state.visitedMaps, state.currentMapId);
  showMessage("Bắt đầu chuyến đi: hãy ghé Hồ Gươm, ăn đặc sản, sưu tầm tem và mở Sổ tay khám phá bằng phím J.");
  updateHud();
  saveGame();
  initInput();
  gameLoop();
}

bootGame();
