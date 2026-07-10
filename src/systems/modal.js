import { runtime, state, ui } from "../state.js";
import { foodDetails } from "../data/foods.js";
import { landmarkDetails } from "../data/landmarks.js";
import { formatMoney } from "../utils/format.js";

let infoCloseHandler = null;
export function setInfoCloseHandler(handler) { infoCloseHandler = handler; }

function getInfoActionButtons() {
  return Array.from(ui.infoActions.querySelectorAll("button"));
}

export function renderInfoActionSelection() {
  const buttons = getInfoActionButtons();

  buttons.forEach((button, index) => {
    const label = button.dataset.actionLabel || button.textContent.replace(/^▶\s*/, "").trim();
    button.dataset.actionLabel = label;
    const selected = !ui.infoModal.classList.contains("hidden") && index === runtime.infoSelectedIndex;
    button.classList.toggle("is-selected", selected);
    button.textContent = selected ? `▶ ${label}` : label;
  });
}

export function selectInfoAction(index) {
  const buttons = getInfoActionButtons();
  if (!buttons.length) {
    runtime.infoSelectedIndex = 0;
    return;
  }

  runtime.infoSelectedIndex = (index + buttons.length) % buttons.length;
  renderInfoActionSelection();
}

export function moveInfoActionSelection(delta) {
  selectInfoAction(runtime.infoSelectedIndex + delta);
}

export function activateSelectedInfoAction() {
  const buttons = getInfoActionButtons();
  if (!buttons.length) {
    closeInfoModal();
    return;
  }

  const index = (runtime.infoSelectedIndex + buttons.length) % buttons.length;
  const button = buttons[index];
  if (!button || button.disabled) {
    return;
  }

  button.click();
}

export function closePanelOverlays(keep = "") {
  if (keep !== "inventory") ui.inventoryPanel.classList.add("hidden");
  if (keep !== "quest") ui.questPanel.classList.add("hidden");
  if (keep !== "journal") ui.journalPanel.classList.add("hidden");
  closeChoiceModal();
}

export function closeAllOverlays() {
  ui.inventoryPanel.classList.add("hidden");
  ui.questPanel.classList.add("hidden");
  ui.journalPanel.classList.add("hidden");
  closeChoiceModal();
  if (!ui.infoModal.classList.contains("hidden")) closeInfoModal();
}

export function showMessage(message, duration = 4200) {
  window.clearTimeout(runtime.messageTimer);
  ui.dialogueText.textContent = message;
  ui.dialogueBox.classList.remove("hidden");

  runtime.messageTimer = window.setTimeout(() => {
    ui.dialogueBox.classList.add("hidden");
  }, duration);
}

export function openChoiceModal({ tag, title, body, actions }) {
  ui.choiceTag.textContent = tag;
  ui.choiceTitle.textContent = title;
  ui.choiceBody.textContent = body;
  ui.choiceActions.innerHTML = "";

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.disabled = Boolean(action.disabled);
    if (action.className) {
      button.classList.add(action.className);
    }
    button.addEventListener("click", action.onClick);
    ui.choiceActions.appendChild(button);
  });

  ui.choiceModal.classList.remove("hidden");
  ui.nearbyHint.classList.add("hidden");
}

export function closeChoiceModal() {
  ui.choiceModal.classList.add("hidden");
}

export function openFoodInfoPanel(food, options = {}) {
  const detail = foodDetails[food.id] || foodDetails.phoHaNoi;
  const priceLine = options.pricePaid
    ? formatMoney(options.pricePaid)
    : (options.alreadyDiscovered || options.fromJournal ? "Đã lưu trong sổ tay" : formatMoney(food.price));

  openInfoModal({
    tag: "Ẩm thực Hà Nội",
    title: `Bạn đã thưởng thức ${food.name}`,
    intro: detail.intro,
    sections: [
      { title: "Thành phần chính", body: detail.mainIngredients },
      { title: "Cách thưởng thức / đặc điểm", body: detail.taste },
      { title: "Nguồn gốc / lịch sử", body: detail.history },
      { title: "Điều thú vị", body: detail.funFact },
      { title: "Giá đã trả", body: priceLine }
    ]
  });
}

export function openLandmarkInfoPanel(landmark, options = {}) {
  const detail = landmarkDetails[landmark.id] || {
    intro: landmark.description,
    meaning: "Đây là một điểm dừng trong hành trình khám phá Hà Nội.",
    highlight: landmark.description,
    funFact: "Hãy quan sát bản đồ để tìm thêm các địa danh xung quanh."
  };

  const sections = [
    { title: "Giới thiệu", body: detail.intro },
    { title: "Lịch sử / ý nghĩa", body: detail.meaning },
    { title: "Điểm nổi bật", body: detail.highlight },
    { title: "Bạn có biết?", body: detail.funFact }
  ];

  if (options.statusNote) {
    sections.push({ title: "Trạng thái khám phá", body: options.statusNote });
  } else if (landmark.stamp && state.inventory.stamps.includes(landmark.stamp)) {
    sections.push({ title: "Trạng thái khám phá", body: "Đã check-in và lưu vào sổ tay." });
  }

  openInfoModal({
    tag: "Địa danh Hà Nội",
    title: landmark.name,
    intro: landmark.description,
    sections,
    actions: options.actions || []
  });
}

export function openInfoModal({ tag, title, intro, sections, actions = [] }) {
  ui.infoTag.textContent = tag;
  ui.infoTitle.textContent = title;
  ui.infoIntro.textContent = intro;
  ui.infoContent.innerHTML = "";
  ui.infoActions.innerHTML = "";

  sections.forEach((section) => {
    const block = document.createElement("section");
    block.className = "info-section";

    const heading = document.createElement("h3");
    heading.textContent = section.title;
    const body = document.createElement("p");
    body.textContent = section.body;

    block.append(heading, body);
    ui.infoContent.appendChild(block);
  });

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.actionLabel = action.label;
    button.textContent = action.label;
    if (action.className) {
      button.classList.add(action.className);
    }
    button.addEventListener("click", action.onClick);
    ui.infoActions.appendChild(button);
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.dataset.actionLabel = "Đóng";
  closeButton.textContent = "Đóng";
  closeButton.addEventListener("click", closeInfoModal);
  ui.infoActions.appendChild(closeButton);

  runtime.infoSelectedIndex = 0;
  renderInfoActionSelection();
  ui.infoModal.classList.remove("hidden");
  renderInfoActionSelection();
  ui.nearbyHint.classList.add("hidden");
}

export function closeInfoModal() {
  ui.infoModal.classList.add("hidden");
  runtime.infoSelectedIndex = 0;
  renderInfoActionSelection();
  if (infoCloseHandler) infoCloseHandler();
}

export function isOverlayOpen() {
  return !ui.inventoryPanel.classList.contains("hidden") ||
    !ui.questPanel.classList.contains("hidden") ||
    !ui.journalPanel.classList.contains("hidden") ||
    !ui.infoModal.classList.contains("hidden") ||
    !ui.quizModal.classList.contains("hidden") ||
    !ui.choiceModal.classList.contains("hidden");
}
