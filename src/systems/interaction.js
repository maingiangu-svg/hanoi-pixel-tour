import { BUS_PRICE, NPC_REWARD, player, runtime, state, ui } from "../state.js";
import { maps } from "../data/maps.js";
import { snapCameraToPlayer, worldToScreen } from "../camera.js";
import { foodCatalog } from "../data/foods.js";
import { distanceToRect, isPlayerAreaWalkable } from "../utils/collision.js";
import { addUnique, findLandmark, findNpcTask, getCurrentMap, getPlayerCenter, grantLandmarkRewards, isQuizCorrect, placePlayerAtSafeStart, removeItem } from "../utils/helpers.js";
import { formatMoney } from "../utils/format.js";
import { saveGame } from "../storage.js";
import { discoverLandmark } from "./journal.js";
import { distanceToInteractionPoint, getLandmarkInteractionPoints } from "./interactionPoints.js";
import { openQuiz } from "./quiz.js";
import { openShop } from "./shop.js";
import { checkAreaQuests, checkVictory } from "./questSystem.js";
import { closeChoiceModal, closeInfoModal, isOverlayOpen, openChoiceModal, openLandmarkInfoPanel, showMessage } from "./modal.js";

export function updateNearbyInteractable() {
  if (isOverlayOpen()) {
    runtime.nearbyInteractable = null;
    ui.nearbyHint.classList.add("hidden");
    return;
  }

  const playerCenter = getPlayerCenter();
  const interactables = getInteractables()
    .map((item) => ({
      ...item,
      distance: item.point
        ? distanceToInteractionPoint(item.point, playerCenter)
        : distanceToRect(playerCenter, item.object),
      range: item.point ? item.point.radius : (item.object.range || item.range || 76)
    }))
    .filter((item) => item.distance <= item.range)
    .sort((a, b) => a.distance - b.distance || a.priority - b.priority);

  runtime.nearbyInteractable = interactables[0] || null;

  if (runtime.nearbyInteractable) {
    ui.nearbyHint.textContent = getInteractionPrompt(runtime.nearbyInteractable);
    const screen = runtime.nearbyInteractable.point
      ? worldToScreen(
        runtime.nearbyInteractable.point.x + runtime.nearbyInteractable.point.labelOffsetX,
        runtime.nearbyInteractable.point.y + runtime.nearbyInteractable.point.labelOffsetY
      )
      : worldToScreen(player.x + player.width / 2, player.y - 6);
    ui.nearbyHint.style.left = `${Math.round(screen.x)}px`;
    ui.nearbyHint.style.top = `${Math.round(screen.y)}px`;
    ui.nearbyHint.style.bottom = "auto";
    ui.nearbyHint.classList.remove("hidden");
  } else {
    ui.nearbyHint.classList.add("hidden");
  }
}

export function getInteractables() {
  const map = getCurrentMap();
  return [
    ...map.exits.map((object) => ({ type: "exit", object, priority: 1, range: 76 })),
    ...map.npcs.map((object) => ({
      type: "npc",
      object: { ...object, width: 24, height: 46 },
      source: object,
      priority: 2,
      range: 78
    })),
    ...map.shops.map((object) => ({
      type: "shop",
      object: { ...object, name: foodCatalog[object.foodId].name },
      source: object,
      priority: 3,
      range: 86
    })),
    ...getLandmarkInteractionPoints(map).map((point) => ({
      type: "landmark",
      object: {
        id: point.id,
        name: point.landmark.name,
        x: point.x - 8,
        y: point.y - 8,
        width: 16,
        height: 16
      },
      source: point.landmark,
      point,
      priority: point.landmark.priority || 4,
      range: point.radius
    }))
  ];
}

export function getInteractionPrompt(item) {
  if (item.type === "exit") {
    const targetName = maps[item.object.targetMap].name;
    if (item.object.kind === "bus") {
      return `E · Xe buýt đến ${targetName}`;
    }
    return `E · Đi đến ${targetName}`;
  }

  if (item.type === "shop") {
    return `E · Ghé ${item.object.name}`;
  }

  if (item.type === "npc") {
    return `E · Nói chuyện với ${item.object.name}`;
  }

  return `${item.source ? item.source.name : item.object.name}\n[E] Khám phá`;
}

export function interact() {
  if (isOverlayOpen()) {
    return;
  }

  updateNearbyInteractable();

  if (!runtime.nearbyInteractable) {
    showMessage("Bạn chưa đứng gần nơi có thể tương tác.");
    return;
  }

  if (runtime.nearbyInteractable.type === "exit") {
    travelToMap(runtime.nearbyInteractable.object);
  }

  if (runtime.nearbyInteractable.type === "shop") {
    openShop(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "npc") {
    handleNpc(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "landmark") {
    handleLandmark(runtime.nearbyInteractable.source || runtime.nearbyInteractable.object);
  }
}

export function travelToMap(exit) {
  if (exit.kind === "bus") {
    const freeReturn = state.money < BUS_PRICE && exit.targetMap === "hoanKiem" && !state.freeReturnUsed;

    if (state.money >= BUS_PRICE) {
      state.money -= BUS_PRICE;
      addUnique(state.inventory.specialItems, "Vé xe buýt");
    } else if (freeReturn) {
      state.freeReturnUsed = true;
      showMessage("Bạn được phụ xe cho một chuyến quay về miễn phí để tránh lỡ hành trình.");
    } else {
      showMessage("Bạn cần 7.000đ để mua vé xe buýt. Hãy làm nhiệm vụ hoặc trả lời câu hỏi để kiếm thêm VND.");
      saveGame();
      return;
    }
  }

  state.currentMapId = exit.targetMap;
  player.x = exit.targetX;
  player.y = exit.targetY;
  state.player.x = exit.targetX;
  state.player.y = exit.targetY;
  addUnique(state.visitedMaps, exit.targetMap);

  if (!isPlayerAreaWalkable(player.x, player.y)) {
    placePlayerAtSafeStart(exit.targetMap);
  }

  snapCameraToPlayer();
  showMessage(exit.message);
  saveGame();
  checkVictory();
}

export function handleLandmark(landmark) {
  discoverLandmark(landmark.id);

  if (landmark.id === "choDongXuan" && state.taskStages.deliveryDongXuan === "accepted" && !state.completedTasks.deliveryDongXuan) {
    const deliveryNote = completeDeliveryTask();
    openLandmarkInfoPanel(landmark, {
      statusNote: deliveryNote
    });
    return;
  }

  if (landmark.quizId) {
    if (isQuizCorrect(landmark.quizId)) {
      const rewards = grantLandmarkRewards(landmark);
      const statusNote = rewards.length
        ? `Trạng thái khám phá: Đã check-in. Bạn nhận ${rewards.join(", ")}.`
        : "Trạng thái khám phá: Đã check-in.";
      openLandmarkInfoPanel(landmark, { statusNote });
      saveGame();
      checkAreaQuests();
      checkVictory();
      return;
    }

    openLandmarkInfoPanel(landmark, {
      statusNote: "Bạn đã mở khóa thông tin địa điểm. Hãy trả lời câu hỏi để nhận tem check-in.",
      actions: [
        {
          label: "Trả lời câu hỏi",
          className: "primary-choice",
          onClick: () => {
            closeInfoModal();
            openQuiz(landmark.quizId, { landmarkId: landmark.id });
          }
        }
      ]
    });
    saveGame();
    return;
  }

  const rewards = grantLandmarkRewards(landmark);
  const statusNote = rewards.length
    ? `Trạng thái khám phá: Đã check-in. Bạn nhận ${rewards.join(", ")}.`
    : (landmark.stamp && state.inventory.stamps.includes(landmark.stamp) ? "Trạng thái khám phá: Đã check-in." : "");
  openLandmarkInfoPanel(landmark, { statusNote });
  saveGame();
  checkAreaQuests();
  checkVictory();
}

export function handleNpc(npc) {
  const task = npc.task;

  if (state.completedTasks[task.taskId]) {
    showMessage(task.done || `${npc.name}: Cảm ơn bạn nhé!`);
    return;
  }

  if (task.type === "simple") {
    openChoiceModal({
      tag: "Nhiệm vụ",
      title: task.title || npc.name,
      body: task.intro,
      actions: [
        {
          label: task.action,
          className: "primary-choice",
          onClick: () => {
            completeNpcTask(task);
            closeChoiceModal();
          }
        },
        { label: "Rời đi", onClick: closeChoiceModal }
      ]
    });
  }

  if (task.type === "quiz") {
    showMessage(`${npc.name}: ${task.intro}`);
    openQuiz(task.quizId, { npcId: npc.id, taskId: task.taskId });
  }

  if (task.type === "quizChain") {
    const nextQuiz = task.quizIds.find((quizId) => !isQuizCorrect(quizId));
    if (!nextQuiz) {
      completeNpcTask(task);
      return;
    }

    showMessage(`${npc.name}: ${task.intro}`);
    openQuiz(nextQuiz, { npcId: npc.id, taskId: task.taskId, quizChain: task.quizIds });
  }

  if (task.type === "requiresStampQuiz") {
    if (!state.inventory.stamps.includes(task.requiredStamp)) {
      showMessage(`${npc.name}: ${task.intro}`);
      return;
    }

    openQuiz(task.quizId, { npcId: npc.id, taskId: task.taskId });
  }

  if (task.type === "delivery") {
    if (state.taskStages[task.taskId] === "accepted") {
      showMessage(`${npc.name}: Gói hàng đang chờ ở Chợ Đồng Xuân. Cháu đem đến quầy chính giúp bác nhé.`);
      return;
    }

    openChoiceModal({
      tag: "Nhiệm vụ",
      title: npc.name,
      body: task.intro,
      actions: [
        {
          label: "Nhận gói hàng",
          className: "primary-choice",
          onClick: () => {
            state.taskStages[task.taskId] = "accepted";
            addUnique(state.inventory.specialItems, task.packageItem);
            showMessage("Bạn đã nhận Gói hàng nhỏ. Hãy mang đến Chợ Đồng Xuân.");
            closeChoiceModal();
            saveGame();
          }
        },
        { label: "Rời đi", onClick: closeChoiceModal }
      ]
    });
  }
}

export function completeNpcTask(task) {
  if (state.completedTasks[task.taskId]) {
    return;
  }

  state.completedTasks[task.taskId] = true;
  state.money += task.reward || NPC_REWARD;

  if (task.souvenir) {
    addUnique(state.inventory.souvenirs, task.souvenir);
  }

  showMessage(`${task.done || "Nhiệm vụ hoàn thành!"} Bạn nhận ${formatMoney(task.reward || NPC_REWARD)}.`);
  saveGame();
  checkAreaQuests();
  checkVictory();
}

export function completeDeliveryTask() {
  const task = findNpcTask("deliveryDongXuan");
  state.completedTasks.deliveryDongXuan = true;
  state.taskStages.deliveryDongXuan = "delivered";
  state.money += task.reward;
  removeItem(state.inventory.specialItems, task.packageItem);
  addUnique(state.inventory.souvenirs, task.souvenir);

  const message = `Bạn đã giao Gói hàng nhỏ tại Chợ Đồng Xuân. Bạn nhận ${formatMoney(task.reward)} và ${task.souvenir}.`;
  showMessage(message);
  saveGame();
  checkVictory();
  return message;
}
