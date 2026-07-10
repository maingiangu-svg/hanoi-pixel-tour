import { runtime, state, ui } from "../state.js";
import { areaQuests, sideQuests } from "../data/quests.js";
import { getCorrectQuizCount } from "../utils/helpers.js";
import { formatMoney } from "../utils/format.js";
import { saveGame } from "../storage.js";
import { closeChoiceModal, closePanelOverlays, openChoiceModal, showMessage } from "./modal.js";

export function toggleQuestLog() {
  if (!ui.questPanel.classList.contains("hidden")) {
    closeQuestLog();
    return;
  }

  closePanelOverlays("quest");
  renderQuestLog();
  ui.questPanel.classList.remove("hidden");
}

export function closeQuestLog() {
  ui.questPanel.classList.add("hidden");
}

export function renderQuestLog() {
  ui.questContent.innerHTML = "";

  const mainHeading = document.createElement("h3");
  mainHeading.className = "quest-heading";
  mainHeading.textContent = "Tuyến chính";
  ui.questContent.appendChild(mainHeading);

  const list = document.createElement("ul");
  list.className = "quest-list";
  getQuestObjectives().forEach((objective) => {
    const item = document.createElement("li");
    item.className = `quest-row ${objective.done ? "is-done" : "is-pending"}`;

    const stateText = document.createElement("span");
    stateText.className = "quest-state";
    stateText.textContent = objective.done ? "Xong" : "Đang làm";

    const body = document.createElement("span");
    body.textContent = `${objective.text} ${objective.progress}`;
    item.append(stateText, body);
    list.appendChild(item);
  });

  ui.questContent.appendChild(list);
  renderSideQuestLog();
}

export function getQuestObjectives() {
  const hasHoGuom = state.inventory.stamps.includes("Tem check-in Hồ Gươm");
  const foodCount = state.eatenFoods.length;
  const quizCount = getCorrectQuizCount();
  const stampCount = state.inventory.stamps.length;
  const visitedCount = new Set(state.visitedMaps).size;
  const firstFiveDone = hasHoGuom && foodCount >= 2 && quizCount >= 4 && stampCount >= 5 && visitedCount >= 3;

  return [
    {
      text: "Ghé thăm Hồ Gươm.",
      done: hasHoGuom,
      progress: hasHoGuom ? "(1/1)" : "(0/1)"
    },
    {
      text: "Ăn ít nhất 2 món đặc sản Hà Nội.",
      done: foodCount >= 2,
      progress: `(${Math.min(foodCount, 2)}/2)`
    },
    {
      text: "Trả lời đúng ít nhất 4 câu hỏi văn hóa/lịch sử.",
      done: quizCount >= 4,
      progress: `(${Math.min(quizCount, 4)}/4)`
    },
    {
      text: "Thu thập ít nhất 5 tem check-in.",
      done: stampCount >= 5,
      progress: `(${Math.min(stampCount, 5)}/5)`
    },
    {
      text: "Ghé qua đủ 3 khu vực: Hoàn Kiếm, Ba Đình, Long Biên.",
      done: visitedCount >= 3,
      progress: `(${Math.min(visitedCount, 3)}/3)`
    },
    {
      text: "Hoàn thành chuyến đi và trở về Hoàn Kiếm.",
      done: firstFiveDone && state.currentMapId === "hoanKiem",
      progress: state.currentMapId === "hoanKiem" ? "(đang ở Hoàn Kiếm)" : "(hãy quay về Hoàn Kiếm)"
    }
  ];
}

export function getCurrentObjective() {
  const next = getQuestObjectives().find((objective) => !objective.done);
  if (next) {
    return next.text;
  }

  const sideQuest = sideQuests.find((quest) => !isSideQuestCompleted(quest) && isSideQuestStarted(quest));
  return sideQuest ? `Nhiệm vụ phụ: ${sideQuest.title}` : "Chuyến đi đã hoàn thành!";
}

export function checkVictory() {
  checkSideQuests();

  if (state.victoryShown) {
    
    return;
  }

  const complete = getQuestObjectives().every((objective) => objective.done);

  if (complete) {
    if (runtime.activeQuiz || !ui.infoModal.classList.contains("hidden")) {
      runtime.pendingVictory = true;
      
      return;
    }

    state.victoryShown = true;
    saveGame();
    openChoiceModal({
      tag: "Hoàn thành",
      title: "Một ngày du lịch Hà Nội",
      body: "Bạn đã hoàn thành một ngày du lịch Hà Nội! Bạn đã khám phá văn hóa, lịch sử và ẩm thực Thủ đô.",
      actions: [
        { label: "Tuyệt vời", className: "primary-choice", onClick: closeChoiceModal }
      ]
    });
  }

  
}

export function checkAreaQuests(extraRewards = []) {
  Object.entries(areaQuests).forEach(([mapId, quest]) => {
    const taskKey = `areaQuest_${mapId}`;
    if (state.completedTasks[taskKey]) {
      return;
    }

    const complete = quest.stamps.every((stamp) => state.inventory.stamps.includes(stamp));
    if (!complete) {
      return;
    }

    state.completedTasks[taskKey] = true;
    state.money += quest.reward;
    extraRewards.push(`Hoàn thành nhiệm vụ khu ${quest.name}, nhận ${formatMoney(quest.reward)}.`);
    if (!runtime.activeQuiz) {
      showMessage(`Hoàn thành nhiệm vụ khu ${quest.name}! Bạn nhận ${formatMoney(quest.reward)}.`);
    }
  });

  checkSideQuests(extraRewards);
}

export function handlePendingVictory() {
  if (runtime.pendingVictory) {
    runtime.pendingVictory = false;
    checkVictory();
  }
}

function renderSideQuestLog() {
  const heading = document.createElement("h3");
  heading.className = "quest-heading";
  heading.textContent = "Nhiệm vụ phụ";
  ui.questContent.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "side-quest-grid";

  sideQuests.forEach((quest) => {
    const completed = isSideQuestCompleted(quest);
    const started = isSideQuestStarted(quest);
    const card = document.createElement("article");
    card.className = `side-quest-card ${completed ? "is-done" : started ? "is-active" : "is-available"}`;

    const title = document.createElement("h4");
    title.textContent = quest.title;
    const description = document.createElement("p");
    description.className = "side-quest-description";
    description.textContent = quest.description;

    const meta = document.createElement("p");
    meta.className = "side-quest-meta";
    meta.textContent = `${completed ? "Xong" : started ? "Đang làm" : "Có thể nhận"} · Thưởng ${formatMoney(quest.reward)}`;

    const list = document.createElement("ul");
    list.className = "quest-list side-quest-objectives";
    quest.objectives.forEach((objective) => {
      const item = document.createElement("li");
      const done = isObjectiveDone(objective);
      item.className = `quest-row ${done ? "is-done" : "is-pending"}`;

      const stateText = document.createElement("span");
      stateText.className = "quest-state";
      stateText.textContent = done ? "Xong" : "Đang làm";

      const body = document.createElement("span");
      body.textContent = `${objective.text} ${getObjectiveProgress(objective)}`;
      item.append(stateText, body);
      list.appendChild(item);
    });

    card.append(title, description, meta, list);
    grid.appendChild(card);
  });

  ui.questContent.appendChild(grid);
}

export function checkSideQuests(extraRewards = []) {
  let completedAny = false;

  sideQuests.forEach((quest) => {
    if (isSideQuestCompleted(quest) || !isSideQuestStarted(quest)) {
      return;
    }

    if (!quest.objectives.every(isObjectiveDone)) {
      return;
    }

    state.completedTasks[getSideQuestTaskKey(quest)] = true;
    state.money += quest.reward;
    completedAny = true;
    const message = `Hoàn thành nhiệm vụ "${quest.title}", nhận ${formatMoney(quest.reward)}.`;
    extraRewards.push(message);

    if (!runtime.activeQuiz) {
      showMessage(message);
    }
  });

  if (completedAny) {
    saveGame();
  }

  return extraRewards;
}

function isSideQuestCompleted(quest) {
  return Boolean(state.completedTasks[getSideQuestTaskKey(quest)]);
}

function isSideQuestStarted(quest) {
  return isSideQuestCompleted(quest) || quest.objectives.some(isObjectiveDone);
}

function getSideQuestTaskKey(quest) {
  return `sideQuest_${quest.id}`;
}

function isObjectiveDone(objective) {
  if (objective.type === "stamp") {
    return state.inventory.stamps.includes(objective.value);
  }

  if (objective.type === "food") {
    return state.eatenFoods.includes(objective.value);
  }

  if (objective.type === "task") {
    return Boolean(state.completedTasks[objective.value]);
  }

  if (objective.type === "map") {
    return state.visitedMaps.includes(objective.value);
  }

  if (objective.type === "item") {
    return state.inventory.specialItems.includes(objective.value) ||
      state.inventory.foods.includes(objective.value) ||
      state.inventory.souvenirs.includes(objective.value) ||
      state.inventory.stamps.includes(objective.value);
  }

  if (objective.type === "vehicleOwned") {
    return Boolean(state.vehicle?.owned && state.vehicle.type === objective.value);
  }

  if (objective.type === "visitedMapCount") {
    return new Set(state.visitedMaps).size >= objective.value;
  }

  if (objective.type === "quizCount") {
    return getCorrectQuizCount() >= objective.value;
  }

  return false;
}

function getObjectiveProgress(objective) {
  if (objective.type === "visitedMapCount") {
    const count = new Set(state.visitedMaps).size;
    return `(${Math.min(count, objective.value)}/${objective.value})`;
  }

  if (objective.type === "quizCount") {
    const count = getCorrectQuizCount();
    return `(${Math.min(count, objective.value)}/${objective.value})`;
  }

  return isObjectiveDone(objective) ? "(1/1)" : "(0/1)";
}
