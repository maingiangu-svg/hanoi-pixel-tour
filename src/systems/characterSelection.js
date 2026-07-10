import { runtime, state, ui } from "../state.js";
import { saveGame } from "../storage.js";
import { showMessage } from "./modal.js";

const GENDERS = ["male", "female"];
const GENDER_LABELS = {
  male: "Nam",
  female: "Nữ"
};

let initialized = false;

export function initCharacterSelection() {
  if (initialized || !ui.characterModal || !ui.characterOptions) {
    return;
  }

  initialized = true;

  getCharacterCards().forEach((card, index) => {
    card.addEventListener("click", () => selectCharacter(index));
  });

  ui.characterOptions.querySelectorAll(".character-pick").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const gender = button.dataset.gender;
      const index = GENDERS.indexOf(gender);
      if (index >= 0) {
        selectCharacter(index);
        confirmCharacterSelection();
      }
    });
  });

  ui.characterConfirm.addEventListener("click", confirmCharacterSelection);
}

export function openCharacterSelection({ allowClose = false, firstTime = false } = {}) {
  if (!ui.characterModal) {
    return;
  }

  const currentGender = normalizeGender(state.profile && state.profile.gender);
  runtime.characterSelectedIndex = Math.max(0, GENDERS.indexOf(currentGender || "male"));
  runtime.characterSelection = { allowClose, firstTime };
  renderCharacterSelection();
  ui.nearbyHint.classList.add("hidden");
  ui.characterModal.classList.remove("hidden");
}

export function closeCharacterSelection() {
  if (!isCharacterSelectionOpen()) {
    return;
  }

  if (!runtime.characterSelection.allowClose && !(state.profile && state.profile.gender)) {
    return;
  }

  ui.characterModal.classList.add("hidden");
}

export function isCharacterSelectionOpen() {
  return ui.characterModal && !ui.characterModal.classList.contains("hidden");
}

export function moveCharacterSelection(delta) {
  selectCharacter(runtime.characterSelectedIndex + delta);
}

export function selectCharacter(index) {
  runtime.characterSelectedIndex = (index + GENDERS.length) % GENDERS.length;
  renderCharacterSelection();
}

export function confirmCharacterSelection() {
  const gender = GENDERS[runtime.characterSelectedIndex] || "male";
  const previousGender = state.profile && state.profile.gender;
  state.profile = { ...(state.profile || {}), gender };
  ui.characterModal.classList.add("hidden");
  saveGame();

  const label = GENDER_LABELS[gender];
  if (runtime.characterSelection.firstTime || !previousGender) {
    showMessage(`Bạn đã chọn nhân vật ${label}. Bắt đầu chuyến đi: hãy ghé Hồ Gươm, ăn đặc sản, sưu tầm tem và mở Sổ tay khám phá bằng phím J.`);
  } else {
    showMessage(`Bạn đã đổi ngoại hình nhân vật sang ${label}. Tiến trình vẫn được giữ nguyên.`);
  }
}

export function handleCharacterSelectionKey(key) {
  if (key === "arrowleft" || key === "a") {
    moveCharacterSelection(-1);
    return true;
  }

  if (key === "arrowright" || key === "d") {
    moveCharacterSelection(1);
    return true;
  }

  if (key === "enter") {
    confirmCharacterSelection();
    return true;
  }

  if (key === "escape") {
    closeCharacterSelection();
    return true;
  }

  return true;
}

function renderCharacterSelection() {
  const cards = getCharacterCards();
  cards.forEach((card, index) => {
    const selected = index === runtime.characterSelectedIndex;
    const stateLabel = card.querySelector(".character-state");
    card.classList.toggle("is-selected", selected);
    if (stateLabel) {
      stateLabel.textContent = selected ? "Đang chọn" : "Chưa chọn";
    }
  });

  const gender = GENDERS[runtime.characterSelectedIndex] || "male";
  ui.characterConfirm.textContent = `Xác nhận ${GENDER_LABELS[gender]}`;
}

function getCharacterCards() {
  return Array.from(ui.characterOptions.querySelectorAll(".character-card"));
}

function normalizeGender(gender) {
  return GENDERS.includes(gender) ? gender : null;
}
