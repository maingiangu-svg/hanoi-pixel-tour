import { runtime, state, ui } from "../state.js";
import { foodDetails } from "../data/foods.js";
import { landmarkDetails } from "../data/landmarks.js";
import { formatMoney } from "../utils/format.js";
import { activateSelectedButton, getSelectableButtons, moveSelection, renderButtonSelection } from "./selectableUI.js";

let infoCloseHandler = null;
export function setInfoCloseHandler(handler) { infoCloseHandler = handler; }

function getInfoActionButtons() {
  return getSelectableButtons(ui.infoActions);
}

export function renderInfoActionSelection() {
  const buttons = getInfoActionButtons();
  renderButtonSelection(buttons, runtime.infoSelectedIndex, !ui.infoModal.classList.contains("hidden"));
}

export function selectInfoAction(index) {
  const buttons = getInfoActionButtons();
  if (!buttons.length) {
    runtime.infoSelectedIndex = 0;
    return;
  }

  runtime.infoSelectedIndex = moveSelection(index, 0, buttons.length);
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

  activateSelectedButton(buttons, runtime.infoSelectedIndex);
}

function getChoiceActionButtons() {
  return getSelectableButtons(ui.choiceActions);
}

export function renderChoiceActionSelection() {
  const buttons = getChoiceActionButtons();
  renderButtonSelection(buttons, runtime.choiceSelectedIndex, !ui.choiceModal.classList.contains("hidden"));
}

export function selectChoiceAction(index) {
  const buttons = getChoiceActionButtons();
  if (!buttons.length) {
    runtime.choiceSelectedIndex = 0;
    return;
  }

  runtime.choiceSelectedIndex = moveSelection(index, 0, buttons.length);
  renderChoiceActionSelection();
}

export function moveChoiceActionSelection(delta) {
  selectChoiceAction(runtime.choiceSelectedIndex + delta);
}

export function activateSelectedChoiceAction() {
  const buttons = getChoiceActionButtons();
  if (!buttons.length) {
    closeChoiceModal();
    return;
  }

  activateSelectedButton(buttons, runtime.choiceSelectedIndex);
}

export function closePanelOverlays(keep = "") {
  if (keep !== "inventory") ui.inventoryPanel.classList.add("hidden");
  if (keep !== "quest") ui.questPanel.classList.add("hidden");
  if (keep !== "journal") ui.journalPanel.classList.add("hidden");
  if (keep !== "map" && ui.mapPanel) ui.mapPanel.classList.add("hidden");
  if (keep !== "settings" && ui.settingsPanel) ui.settingsPanel.classList.add("hidden");
  if (keep !== "ending" && ui.endingPanel) ui.endingPanel.classList.add("hidden");
  closeChoiceModal();
}

export function closeAllOverlays() {
  ui.inventoryPanel.classList.add("hidden");
  ui.questPanel.classList.add("hidden");
  ui.journalPanel.classList.add("hidden");
  if (ui.mapPanel) ui.mapPanel.classList.add("hidden");
  if (ui.settingsPanel) ui.settingsPanel.classList.add("hidden");
  if (ui.endingPanel) ui.endingPanel.classList.add("hidden");
  closeChoiceModal();
  if (!ui.infoModal.classList.contains("hidden")) closeInfoModal();
}

export function showMessage(message, duration = 4200) {
  if (runtime.questNotification?.activeId) {
    runtime.pendingMessage = { message, duration };
    return;
  }
  window.clearTimeout(runtime.messageTimer);
  resetDialogueBoxMode();
  ui.dialogueText.textContent = message;
  ui.dialogueBox.classList.remove("hidden");

  runtime.messageTimer = window.setTimeout(() => {
    ui.dialogueBox.classList.add("hidden");
  }, duration);
}

export function showQuestCompletionNotification({
  completionId,
  title,
  summary = "",
  rewards = [],
  nextObjective = ""
}) {
  const id = String(completionId || "");
  const notification = runtime.questNotification;
  if (!id || !notification || notification.shownIds.has(id) || notification.activeId === id ||
    notification.queue.some((entry) => entry.completionId === id)) {
    return false;
  }

  notification.shownIds.add(id);
  notification.queue.push({
    completionId: id,
    title: String(title || "Nhiệm vụ"),
    summary: String(summary || ""),
    rewards: rewards.filter(Boolean).map(String),
    nextObjective: String(nextObjective || "")
  });
  updateNotifications();
  return true;
}

export function updateNotifications() {
  const notification = runtime.questNotification;
  if (!notification || notification.activeId || !notification.queue.length || isQuestFeedbackBlocked()) return false;
  const next = notification.queue.shift();
  notification.activeId = next.completionId;
  window.clearTimeout(runtime.messageTimer);
  window.clearTimeout(notification.timer);

  ui.dialogueText.classList.add("hidden");
  ui.questCompletionContent.classList.remove("hidden");
  ui.questCompletionName.textContent = next.title;
  ui.questCompletionSummary.textContent = next.summary;
  ui.questCompletionSummary.classList.toggle("hidden", !next.summary);
  ui.questCompletionRewards.innerHTML = "";
  const rewardLines = next.rewards.length ? next.rewards : ["Không có phần thưởng"];
  rewardLines.forEach((reward) => {
    const line = document.createElement("span");
    line.textContent = reward;
    ui.questCompletionRewards.appendChild(line);
  });
  ui.questCompletionNext.textContent = next.nextObjective ? `Tiếp theo: ${next.nextObjective}` : "";
  ui.questCompletionNext.classList.toggle("hidden", !next.nextObjective);
  ui.dialogueBox.classList.remove("hidden", "is-leaving");
  ui.dialogueBox.classList.add("is-quest-complete");

  notification.timer = window.setTimeout(() => dismissQuestCompletionNotification(), 4000);
  return true;
}

export function dismissQuestCompletionNotification() {
  const notification = runtime.questNotification;
  if (!notification?.activeId) return false;
  window.clearTimeout(notification.timer);
  notification.timer = null;
  notification.activeId = null;
  ui.dialogueBox.classList.add("is-leaving");
  window.setTimeout(() => {
    resetDialogueBoxMode();
    ui.dialogueBox.classList.add("hidden");
    ui.dialogueBox.classList.remove("is-leaving");
    const pending = runtime.pendingMessage;
    runtime.pendingMessage = null;
    if (pending) showMessage(pending.message, pending.duration);
    else updateNotifications();
  }, 160);
  return true;
}

export function isQuestCompletionNotificationActive() {
  return Boolean(runtime.questNotification?.activeId);
}

export function resetQuestNotifications() {
  const notification = runtime.questNotification;
  if (!notification) return;
  window.clearTimeout(notification.timer);
  notification.activeId = null;
  notification.queue.length = 0;
  notification.shownIds.clear();
  notification.timer = null;
  runtime.pendingMessage = null;
  resetDialogueBoxMode();
  ui.dialogueBox.classList.add("hidden");
}

function resetDialogueBoxMode() {
  ui.dialogueBox.classList.remove("is-quest-complete", "is-leaving");
  ui.questCompletionContent?.classList.add("hidden");
  ui.dialogueText.classList.remove("hidden");
}

function isQuestFeedbackBlocked() {
  return Boolean(runtime.cutscene?.active) ||
    Boolean(runtime.dialogueView?.active) ||
    Boolean(runtime.activeQuiz) ||
    !ui.infoModal.classList.contains("hidden") ||
    !ui.choiceModal.classList.contains("hidden") ||
    !ui.characterModal.classList.contains("hidden") ||
    !ui.inventoryPanel.classList.contains("hidden") ||
    !ui.questPanel.classList.contains("hidden") ||
    !ui.journalPanel.classList.contains("hidden") ||
    (ui.mapPanel && !ui.mapPanel.classList.contains("hidden")) ||
    (ui.endingPanel && !ui.endingPanel.classList.contains("hidden"));
}

export function openChoiceModal({ tag, title, body, actions }) {
  ui.choiceTag.textContent = tag;
  ui.choiceTitle.textContent = title;
  ui.choiceBody.textContent = body;
  ui.choiceActions.innerHTML = "";

  actions.forEach((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.actionLabel = action.label;
    button.textContent = action.label;
    button.disabled = Boolean(action.disabled);
    if (action.className) {
      button.classList.add(action.className);
    }
    button.addEventListener("click", action.onClick);
    ui.choiceActions.appendChild(button);
  });

  runtime.choiceSelectedIndex = 0;
  ui.choiceModal.classList.remove("hidden");
  renderChoiceActionSelection();
  ui.nearbyHint.classList.add("hidden");
}

export function closeChoiceModal() {
  ui.choiceModal.classList.add("hidden");
  runtime.choiceSelectedIndex = 0;
  renderChoiceActionSelection();
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
  return Boolean(runtime.cutscene?.active) ||
    Boolean(runtime.dialogueView?.active) ||
    !ui.inventoryPanel.classList.contains("hidden") ||
    !ui.questPanel.classList.contains("hidden") ||
    !ui.journalPanel.classList.contains("hidden") ||
    (ui.mapPanel && !ui.mapPanel.classList.contains("hidden")) ||
    (ui.settingsPanel && !ui.settingsPanel.classList.contains("hidden")) ||
    (ui.endingPanel && !ui.endingPanel.classList.contains("hidden")) ||
    !ui.infoModal.classList.contains("hidden") ||
    !ui.quizModal.classList.contains("hidden") ||
    !ui.choiceModal.classList.contains("hidden") ||
    !ui.characterModal.classList.contains("hidden");
}
