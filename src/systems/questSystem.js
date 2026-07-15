import { runtime, state, ui } from "../state.js";
import { areaQuests, sideQuests } from "../data/quests.js";
import { CHAPTER_1_TITLE } from "../data/chapter1.js";
import { CHAPTER_2_TITLE } from "../data/chapter2.js";
import { CHAPTER_3_TITLE } from "../data/chapter3.js";
import { CHAPTER_4_TITLE } from "../data/chapter4.js";
import { maps } from "../data/maps.js";
import { findLandmark, getCorrectQuizCount } from "../utils/helpers.js";
import { formatMoney } from "../utils/format.js";
import { saveGame } from "../storage.js";
import { closeChoiceModal, closePanelOverlays, openChoiceModal, showMessage } from "./modal.js";
import { getActiveBranchingObjective, getActiveBranchingQuestEntries } from "./branchingQuest.js";
import { setTrackedObjective, trackBranchingQuest } from "./navigation.js";
import { getChapter1Objective, getChapter1QuestEntries, isChapter1Active } from "./chapter1.js";
import { getChapter2Objective, getChapter2QuestEntries, isChapter2Active } from "./chapter2.js";
import { getChapter3Objective, getChapter3QuestEntries, isChapter3Active } from "./chapter3.js";
import { getChapter4Objective, getChapter4QuestEntries, isChapter4Active, isChapter4PortalWaiting } from "./chapter4.js";

const TOUR_MAP_IDS = ["hoanKiem", "baDinh", "longBien"];
let selectedTrackIndex = 0;

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

export function isQuestLogOpen() {
  return !ui.questPanel.classList.contains("hidden");
}

export function handleQuestLogKey(key) {
  if (!isQuestLogOpen()) return false;
  if (["q", "escape"].includes(key)) {
    closeQuestLog();
    return true;
  }
  const buttons = [...ui.questContent.querySelectorAll(".quest-track-button")];
  if (["w", "arrowup"].includes(key)) selectedTrackIndex = Math.max(0, selectedTrackIndex - 1);
  else if (["s", "arrowdown"].includes(key)) selectedTrackIndex = Math.min(Math.max(0, buttons.length - 1), selectedTrackIndex + 1);
  else if (key === "enter") buttons[selectedTrackIndex]?.click();
  else return true;
  updateQuestTrackSelection();
  return true;
}

export function renderQuestLog() {
  ui.questContent.innerHTML = "";

  if (isChapter1Active()) {
    renderChapter1QuestLog();
    updateQuestTrackSelection();
    return;
  }
  if (isChapter2Active()) {
    renderChapter2QuestLog();
    updateQuestTrackSelection();
    return;
  }
  if (isChapter3Active()) {
    renderChapter3QuestLog();
    updateQuestTrackSelection();
    return;
  }
  if (isChapter4Active()) {
    renderChapter4QuestLog();
    updateQuestTrackSelection();
    return;
  }

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
    if (!objective.done && objective.navigation) {
      item.appendChild(createTrackButton("Theo dõi", () => setTrackedObjective(objective.navigation)));
    }
    list.appendChild(item);
  });

  ui.questContent.appendChild(list);
  renderBranchingQuestLog();
  renderSideQuestLog();
  updateQuestTrackSelection();
}

export function getQuestObjectives() {
  const hasHoGuom = state.inventory.stamps.includes("Tem check-in Hồ Gươm");
  const foodCount = state.eatenFoods.length;
  const quizCount = getCorrectQuizCount();
  const stampCount = state.inventory.stamps.length;
  const visitedCount = getVisitedTourMapCount();
  const firstFiveDone = hasHoGuom && foodCount >= 2 && quizCount >= 4 && stampCount >= 5 && visitedCount >= 3;
  const unvisitedMapId = TOUR_MAP_IDS.find((mapId) => !state.visitedMaps.includes(mapId));
  const allLandmarks = Object.values(maps).flatMap((map) => map.landmarks || []);
  const nextQuizLandmark = allLandmarks.find((landmark) => landmark.quizId && !state.completedQuizzes[landmark.quizId]?.correct);
  const nextStampLandmark = allLandmarks.find((landmark) => landmark.stamp && !state.inventory.stamps.includes(landmark.stamp));

  return [
    {
      text: "Ghé thăm Hồ Gươm.",
      done: hasHoGuom,
      progress: hasHoGuom ? "(1/1)" : "(0/1)",
      navigation: landmarkNavigation("hoGuom")
    },
    {
      text: "Ăn ít nhất 2 món đặc sản Hà Nội.",
      done: foodCount >= 2,
      progress: `(${Math.min(foodCount, 2)}/2)`,
      navigation: { id: "quest-food-shop", type: "shop", mapId: "hoanKiem", targetId: "shopBunCha", label: "Tới quán Bún Chả", routeMode: "auto" }
    },
    {
      text: "Trả lời đúng ít nhất 4 câu hỏi văn hóa/lịch sử.",
      done: quizCount >= 4,
      progress: `(${Math.min(quizCount, 4)}/4)`,
      navigation: nextQuizLandmark ? landmarkNavigation(nextQuizLandmark.id) : null
    },
    {
      text: "Thu thập ít nhất 5 tem check-in.",
      done: stampCount >= 5,
      progress: `(${Math.min(stampCount, 5)}/5)`,
      navigation: nextStampLandmark ? landmarkNavigation(nextStampLandmark.id) : null
    },
    {
      text: "Ghé qua đủ 3 khu vực: Hoàn Kiếm, Ba Đình, Long Biên.",
      done: visitedCount >= 3,
      progress: `(${Math.min(visitedCount, 3)}/3)`,
      navigation: unvisitedMapId ? { id: `quest-visit-${unvisitedMapId}`, type: "map", mapId: unvisitedMapId, targetId: unvisitedMapId, label: `Tới ${maps[unvisitedMapId].name}`, routeMode: "auto" } : null
    },
    {
      text: "Hoàn thành chuyến đi và trở về Hoàn Kiếm.",
      done: firstFiveDone && state.currentMapId === "hoanKiem",
      progress: state.currentMapId === "hoanKiem" ? "(đang ở Hoàn Kiếm)" : "(hãy quay về Hoàn Kiếm)",
      navigation: { id: "quest-return-hoan-kiem", type: "map", mapId: "hoanKiem", targetId: "hoanKiem", label: "Quay về Hoàn Kiếm", routeMode: "auto" }
    }
  ];
}

export function getCurrentObjective() {
  if (isChapter4PortalWaiting()) return getChapter4Objective();
  const storyObjective = isChapter1Active()
    ? getChapter1Objective()
    : isChapter2Active()
      ? getChapter2Objective()
      : isChapter3Active()
        ? getChapter3Objective()
        : isChapter4Active() ? getChapter4Objective() : null;
  if (typeof storyObjective === "string" && storyObjective) return storyObjective;
  const branchingObjective = getActiveBranchingObjective();
  if (branchingObjective) {
    return branchingObjective;
  }
  const next = getQuestObjectives().find((objective) => !objective.done);
  if (next) {
    return next.text;
  }

  const sideQuest = sideQuests.find((quest) => !isSideQuestCompleted(quest) && isSideQuestStarted(quest));
  return sideQuest ? `Nhiệm vụ phụ: ${sideQuest.title}` : "Chuyến đi đã hoàn thành!";
}

function renderBranchingQuestLog() {
  const entries = getActiveBranchingQuestEntries();
  if (!entries.length) return;

  const heading = document.createElement("h3");
  heading.className = "quest-heading";
  heading.textContent = "Nhiệm vụ lựa chọn";
  ui.questContent.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "side-quest-grid branching-quest-grid";
  entries.forEach((entry) => {
    const finished = ["completed", "failed"].includes(entry.status);
    const card = document.createElement("article");
    card.className = `side-quest-card ${finished ? "is-done" : "is-active"}`;
    const title = document.createElement("h4");
    title.textContent = entry.title;
    const description = document.createElement("p");
    description.className = "side-quest-description";
    description.textContent = entry.description;
    const choice = document.createElement("p");
    choice.className = "side-quest-meta";
    choice.textContent = `Cách giúp: ${entry.choice}`;
    const objective = document.createElement("p");
    objective.className = "side-quest-description";
    objective.textContent = finished ? `Kết quả: ${entry.objective}` : `Mục tiêu: ${entry.objective}`;
    card.append(title, description, choice, objective);
    if (entry.hint) {
      const hint = document.createElement("p");
      hint.className = "side-quest-meta";
      hint.textContent = entry.hint;
      card.appendChild(hint);
    }
    if (!finished) {
      card.appendChild(createTrackButton("Theo dõi nhiệm vụ", () => trackBranchingQuest(entry.id)));
    }
    grid.appendChild(card);
  });
  ui.questContent.appendChild(grid);
}

function landmarkNavigation(landmarkId) {
  const landmark = findLandmark(landmarkId);
  if (!landmark) return null;
  const map = Object.values(maps).find((candidate) => candidate.landmarks?.some((entry) => entry.id === landmarkId));
  return { id: `quest-landmark-${landmarkId}`, type: "landmark", mapId: map?.id || null, targetId: landmarkId, label: landmark.name, routeMode: "auto" };
}

function createTrackButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quest-track-button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function updateQuestTrackSelection() {
  const buttons = [...ui.questContent.querySelectorAll(".quest-track-button")];
  selectedTrackIndex = Math.max(0, Math.min(selectedTrackIndex, Math.max(0, buttons.length - 1)));
  buttons.forEach((button, index) => button.classList.toggle("is-selected", index === selectedTrackIndex));
  buttons[selectedTrackIndex]?.scrollIntoView?.({ block: "nearest" });
}

export function checkVictory() {
  if (isChapter1Active() || isChapter2Active() || isChapter3Active() || isChapter4Active()) return;
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

function renderChapter1QuestLog() {
  renderStoryChapterQuestLog(1, CHAPTER_1_TITLE, getChapter1QuestEntries());
}

function renderChapter2QuestLog() {
  renderStoryChapterQuestLog(2, CHAPTER_2_TITLE, getChapter2QuestEntries());
}

function renderChapter3QuestLog() {
  renderStoryChapterQuestLog(3, CHAPTER_3_TITLE, getChapter3QuestEntries());
}

function renderChapter4QuestLog() {
  renderStoryChapterQuestLog(4, CHAPTER_4_TITLE, getChapter4QuestEntries());
}

function renderStoryChapterQuestLog(chapterNumber, chapterTitle, entries) {
  const heading = document.createElement("h3");
  heading.className = "quest-heading";
  heading.textContent = `Chương ${chapterNumber} · ${chapterTitle}`;
  ui.questContent.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "side-quest-grid chapter-story-quest-grid";
  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = `side-quest-card ${entry.done ? "is-done" : entry.active ? "is-active" : "is-available"}`;
    const title = document.createElement("h4");
    title.textContent = entry.title;
    const description = document.createElement("p");
    description.className = "side-quest-description";
    description.textContent = entry.description;
    const progress = document.createElement("p");
    progress.className = "side-quest-meta";
    progress.textContent = entry.done ? "Hoàn thành" : entry.progress;
    card.append(title, description, progress);
    if (entry.navigation) {
      card.appendChild(createTrackButton("Theo dõi", () => setTrackedObjective(entry.navigation)));
    }
    grid.appendChild(card);
  });
  ui.questContent.appendChild(grid);
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
    return getVisitedTourMapCount() >= objective.value;
  }

  if (objective.type === "quizCount") {
    return getCorrectQuizCount() >= objective.value;
  }

  if (objective.type === "photo") {
    return Boolean(state.photoAlbum?.photos?.[objective.value]);
  }

  if (objective.type === "photoCount") {
    return Object.keys(state.photoAlbum?.photos || {}).length >= objective.value;
  }

  return false;
}

function getObjectiveProgress(objective) {
  if (objective.type === "visitedMapCount") {
    const count = getVisitedTourMapCount();
    return `(${Math.min(count, objective.value)}/${objective.value})`;
  }

  if (objective.type === "quizCount") {
    const count = getCorrectQuizCount();
    return `(${Math.min(count, objective.value)}/${objective.value})`;
  }

  if (objective.type === "photoCount") {
    const count = Object.keys(state.photoAlbum?.photos || {}).length;
    return `(${Math.min(count, objective.value)}/${objective.value})`;
  }

  return isObjectiveDone(objective) ? "(1/1)" : "(0/1)";
}

export function getVisitedTourMapCount() {
  return TOUR_MAP_IDS.filter((mapId) => state.visitedMaps.includes(mapId)).length;
}
