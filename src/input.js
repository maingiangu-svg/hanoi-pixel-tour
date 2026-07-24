import { keys, runtime, ui } from "./state.js";
import { interact } from "./systems/interaction.js";
import { toggleInventory } from "./systems/inventory.js";
import { handleJournalKey, isJournalOpen, toggleJournal } from "./systems/journal.js";
import { handleQuestLogKey, isQuestLogOpen, toggleQuestLog } from "./systems/questSystem.js";
import { answerQuiz, closeQuiz, confirmSelectedQuizOption, moveQuizSelection, selectQuizOption } from "./systems/quiz.js";
import { confirmReset } from "./storage.js";
import { activateSelectedChoiceAction, activateSelectedInfoAction, closeAllOverlays, closeChoiceModal, closeInfoModal, dismissQuestCompletionNotification, isOverlayOpen, isQuestCompletionNotificationActive, moveChoiceActionSelection, moveInfoActionSelection } from "./systems/modal.js";
import { handleCharacterSelectionKey, isCharacterSelectionOpen, openCharacterSelection } from "./systems/characterSelection.js";
import { toggleVehicle } from "./systems/vehicle.js";
import { closeMapOverlay, handleMapOverlayKey, isMapOverlayOpen, toggleMapOverlay } from "./systems/mapOverlay.js";
import { closeAudioSettings, isAudioSettingsOpen } from "./systems/audioManager.js";
import { triggerVehicleHorn } from "./systems/npcReactions.js";
import { handlePhotoModeKey, isPhotoModeActive, togglePhotoMode } from "./systems/photoMode.js";
import { handleEnvironmentInteractionKey, isEnvironmentInteractionActive } from "./systems/environmentInteraction.js";
import { handleCutsceneKey, isCutsceneActive } from "./systems/cutscene.js";
import { handleFinalEndingKey, isFinalEndingPanelOpen } from "./systems/finalEnding.js";
import { handleGameClockTimeScaleDebugKey, isGameClockTimeScaleDebugEnabled } from "./systems/gameClock.js";
import { handleViewModeKey, isViewModeActive } from "./systems/viewMode.js";
import { handleDialogueViewKey, isDialogueViewActive } from "./systems/dialogueView.js";

const movementKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
const handledKeys = [...movementKeys, " ", "enter", "escape", "e", "h", "i", "q", "j", "m", "p", "r", "tab", "v"];
const gameClockDebugKeys = ["[", "]", "\\"];
const verticalKeys = {
  arrowup: -1,
  w: -1,
  arrowdown: 1,
  s: 1
};

function isPanelOverlayOpen() {
  return !ui.inventoryPanel.classList.contains("hidden") ||
    !ui.questPanel.classList.contains("hidden") ||
    !ui.journalPanel.classList.contains("hidden");
}

export function initInput() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (handledKeys.includes(key) || (isGameClockTimeScaleDebugEnabled() && gameClockDebugKeys.includes(key))) event.preventDefault();
    if (event.repeat && ["v", "e", "enter", " ", "tab"].includes(key)) return;
    if (event.repeat && gameClockDebugKeys.includes(key)) return;

    if (handleGameClockTimeScaleDebugKey(key)) return;

    if (isQuestCompletionNotificationActive() && key === "enter") {
      dismissQuestCompletionNotification();
      return;
    }

    if (isCutsceneActive()) {
      handleCutsceneKey(key);
      return;
    }

    if (isDialogueViewActive()) {
      handleDialogueViewKey(key);
      return;
    }

    if (isFinalEndingPanelOpen()) {
      handleFinalEndingKey(key);
      return;
    }

    if (isCharacterSelectionOpen()) {
      handleCharacterSelectionKey(key);
      return;
    }

    if (isPhotoModeActive()) {
      handlePhotoModeKey(key);
      return;
    }

    if (isViewModeActive()) {
      if (key === "p") togglePhotoMode();
      else handleViewModeKey(key);
      return;
    }

    if (isMapOverlayOpen()) {
      handleMapOverlayKey(key);
      return;
    }

    if (isAudioSettingsOpen()) {
      if (key === "escape") closeAudioSettings();
      return;
    }

    if (runtime.activeQuiz) {
      if (key in verticalKeys) {
        moveQuizSelection(verticalKeys[key]);
        return;
      }
      if (["1", "2", "3", "4"].includes(key)) {
        const optionIndex = Number(key) - 1;
        selectQuizOption(optionIndex);
        answerQuiz(optionIndex);
        return;
      }
      if (key === "enter") {
        confirmSelectedQuizOption();
        return;
      }
      if (key === "escape" && runtime.activeQuiz.answered) {
        closeQuiz();
        return;
      }
      return;
    }

    if (!ui.choiceModal.classList.contains("hidden")) {
      if (key in verticalKeys) {
        moveChoiceActionSelection(verticalKeys[key]);
        return;
      }
      if (key === "enter") {
        activateSelectedChoiceAction();
        return;
      }
      if (key === "escape") {
        closeChoiceModal();
        return;
      }
      return;
    }

    if (!ui.infoModal.classList.contains("hidden")) {
      if (key in verticalKeys) {
        moveInfoActionSelection(verticalKeys[key]);
        return;
      }
      if (key === "enter") {
        activateSelectedInfoAction();
        return;
      }
      if ([" ", "e", "escape"].includes(key)) {
        closeInfoModal();
        return;
      }
      return;
    }

    if (isEnvironmentInteractionActive()) {
      handleEnvironmentInteractionKey(key);
      return;
    }

    if (isJournalOpen()) {
      handleJournalKey(key);
      return;
    }

    if (isQuestLogOpen()) {
      handleQuestLogKey(key);
      return;
    }

    if (isPanelOverlayOpen()) {
      if (["enter", "escape"].includes(key)) {
        closeAllOverlays();
      }
      if ((key === "i" && !ui.inventoryPanel.classList.contains("hidden")) ||
        (key === "q" && !ui.questPanel.classList.contains("hidden")) ||
        (key === "j" && !ui.journalPanel.classList.contains("hidden"))) {
        closeAllOverlays();
      }
      return;
    }

    if (isOverlayOpen() && movementKeys.includes(key)) {
      return;
    }

    keys[key] = true;
    if (key === "e") interact();
    if (key === "i") toggleInventory();
    if (key === "q") toggleQuestLog();
    if (key === "j") toggleJournal();
    if (key === "m") toggleMapOverlay();
    if (key === "p") togglePhotoMode();
    if (key === "v") toggleVehicle();
    if (key === "h") triggerVehicleHorn();
    if (key === "r" && confirmReset()) openCharacterSelection({ firstTime: true });
    if (key === "escape") {
      closeAllOverlays();
      if (!ui.quizModal.classList.contains("hidden") && runtime.activeQuiz && runtime.activeQuiz.answered) closeQuiz();
    }
  });
  document.addEventListener("keyup", (event) => { keys[event.key.toLowerCase()] = false; });
  ui.closeInventory.addEventListener("click", () => ui.inventoryPanel.classList.add("hidden"));
  ui.closeQuest.addEventListener("click", () => ui.questPanel.classList.add("hidden"));
  ui.closeJournal.addEventListener("click", () => ui.journalPanel.classList.add("hidden"));
  ui.closeMap.addEventListener("click", closeMapOverlay);
  ui.quizContinue.addEventListener("click", closeQuiz);
  ui.dialogueBox.addEventListener("click", (event) => {
    if (!isQuestCompletionNotificationActive()) return;
    event.preventDefault();
    event.stopPropagation();
    dismissQuestCompletionNotification();
  });
}
