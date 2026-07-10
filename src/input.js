import { keys, runtime, ui } from "./state.js";
import { interact } from "./systems/interaction.js";
import { toggleInventory } from "./systems/inventory.js";
import { toggleJournal } from "./systems/journal.js";
import { toggleQuestLog } from "./systems/questSystem.js";
import { answerQuiz, closeQuiz, confirmSelectedQuizOption, moveQuizSelection, selectQuizOption } from "./systems/quiz.js";
import { confirmReset } from "./storage.js";
import { activateSelectedInfoAction, closeAllOverlays, closeInfoModal, isOverlayOpen, moveInfoActionSelection } from "./systems/modal.js";

const movementKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
const handledKeys = [...movementKeys, " ", "enter", "escape", "e"];
const verticalKeys = {
  arrowup: -1,
  w: -1,
  arrowdown: 1,
  s: 1
};

export function initInput() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (handledKeys.includes(key)) event.preventDefault();

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

    if (isOverlayOpen() && movementKeys.includes(key)) {
      return;
    }

    keys[key] = true;
    if (key === "e") interact();
    if (key === "i") toggleInventory();
    if (key === "q") toggleQuestLog();
    if (key === "j") toggleJournal();
    if (key === "r") confirmReset();
    if (key === "escape") {
      closeAllOverlays();
      if (!ui.quizModal.classList.contains("hidden") && runtime.activeQuiz && runtime.activeQuiz.answered) closeQuiz();
    }
  });
  document.addEventListener("keyup", (event) => { keys[event.key.toLowerCase()] = false; });
  ui.closeInventory.addEventListener("click", () => ui.inventoryPanel.classList.add("hidden"));
  ui.closeQuest.addEventListener("click", () => ui.questPanel.classList.add("hidden"));
  ui.closeJournal.addEventListener("click", () => ui.journalPanel.classList.add("hidden"));
  ui.quizContinue.addEventListener("click", closeQuiz);
}
