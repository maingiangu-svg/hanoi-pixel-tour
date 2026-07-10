import { runtime, state, ui } from "../state.js";
import { areaQuests } from "../data/quests.js";
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
  return next ? next.text : "Chuyến đi đã hoàn thành!";
}

export function checkVictory() {
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
}

export function handlePendingVictory() {
  if (runtime.pendingVictory) {
    runtime.pendingVictory = false;
    checkVictory();
  }
}

