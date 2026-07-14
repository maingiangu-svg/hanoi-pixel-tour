import { BUS_PRICE, NPC_REWARD, player, runtime, state, ui } from "../state.js";
import { maps } from "../data/maps.js";
import { snapCameraToPlayer, worldToScreen } from "../camera.js";
import { foodCatalog } from "../data/foods.js";
import { distanceToRect, isPlayerAreaWalkable } from "../utils/collision.js";
import { addUnique, findLandmark, findNpcTask, getCurrentMap, getPlayerCenter, grantLandmarkRewards, isQuizCorrect, placePlayerAtSafeStart, removeItem } from "../utils/helpers.js";
import { formatMoney } from "../utils/format.js";
import { saveGame } from "../storage.js";
import { discoverLandmark } from "./journal.js";
import { distanceToInteractionPoint, getExitInteractionPoints, getLandmarkInteractionPoints, getParkingInteractionPoints, getVehicleShopInteractionPoints } from "./interactionPoints.js";
import { openQuiz } from "./quiz.js";
import { openShop } from "./shop.js";
import { dismountVehicle, isRidingVehicle, openVehicleShop } from "./vehicle.js";
import { checkAreaQuests, checkVictory } from "./questSystem.js";
import { closeChoiceModal, closeInfoModal, isOverlayOpen, openChoiceModal, openLandmarkInfoPanel, showMessage } from "./modal.js";
import { screenToFramePosition } from "./canvasLayout.js";
import { openParkingMenu } from "./parking.js";
import { getScheduledNpcDialogue, getScheduledNpcsForMap, updateNpcSchedules } from "./npcSchedule.js";
import { beginMapTransition } from "./mapTransition.js";
import { canInviteMo, endMoHangout, getMoCompanionDialogue, getMoInvitationBlockedMessage, getMoReturnPoint, isMoCompanionActive, isNearMoReturnPoint, startMoHangout, syncMoCompanionToPlayer } from "./moCompanion.js";
import { getActiveMapNpcs } from "./worldSchedule.js";
import { clearNpcReactionBubble } from "./npcReactions.js";
import {
  getBranchingQuestInteractables,
  handleBranchingQuestActor,
  handleBranchingLinkedNpc,
  handleMoQuestInteraction,
  notifyBranchingQuestMapTransition,
  notifyMoReturned,
  openMoDestinationQuest
} from "./branchingQuest.js";
import { canChangeMapWithQuestFollowers } from "./questFollower.js";
import { getRandomEventInteractables } from "./randomEvents.js";
import { handleRandomEventInteraction } from "./randomEventInteractions.js";
import {
  endEnvironmentInteraction,
  getEnvironmentInteractables,
  handleEnvironmentInteractable,
  isEnvironmentInteractionActive,
  showActiveEnvironmentHint
} from "./environmentInteraction.js";
import { completeTrackedObjective } from "./navigation.js";

export function updateNearbyInteractable() {
  if (isEnvironmentInteractionActive()) {
    if (runtime.photoMode?.active) {
      ui.nearbyHint.classList.add("hidden");
    } else {
      showActiveEnvironmentHint();
    }
    return;
  }
  ui.nearbyHint.classList.remove("is-environment-status");
  if (isOverlayOpen() || runtime.photoMode?.active) {
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

  const nonCompanionInteractables = interactables.filter((item) => !item.object?.companion);
  runtime.nearbyInteractable = nonCompanionInteractables[0] || interactables[0] || null;

  if (runtime.nearbyInteractable) {
    ui.nearbyHint.textContent = getInteractionPrompt(runtime.nearbyInteractable);
    const screen = runtime.nearbyInteractable.point
      ? worldToScreen(
        runtime.nearbyInteractable.point.x + runtime.nearbyInteractable.point.labelOffsetX,
        runtime.nearbyInteractable.point.y + runtime.nearbyInteractable.point.labelOffsetY
      )
      : worldToScreen(player.x + player.width / 2, player.y - 6);
    const display = screenToFramePosition(screen);
    ui.nearbyHint.style.left = `${Math.round(display.x)}px`;
    ui.nearbyHint.style.top = `${Math.round(display.y)}px`;
    ui.nearbyHint.style.bottom = "auto";
    ui.nearbyHint.classList.remove("hidden");
  } else {
    ui.nearbyHint.classList.add("hidden");
  }
}

export function getInteractables() {
  const map = getCurrentMap();
  const exitPoints = getExitInteractionPoints(map);
  const moReturnPoint = getMoReturnPoint(map);
  return [
    ...(moReturnPoint ? [{
      type: "moReturn",
      object: {
        id: moReturnPoint.id,
        name: "Nhà thờ Lớn Hà Nội",
        x: moReturnPoint.x - 8,
        y: moReturnPoint.y - 8,
        width: 16,
        height: 16
      },
      point: moReturnPoint,
      priority: 0,
      range: moReturnPoint.radius
    }] : []),
    ...map.exits.map((object) => {
      const point = exitPoints.find((candidate) => candidate.exit === object);
      return {
        type: "exit",
        object,
        point,
        priority: 1,
        range: point ? point.radius : 76
      };
    }),
    ...getBranchingQuestInteractables(map.id),
    ...getRandomEventInteractables(map.id),
    ...getEnvironmentInteractables(map.id),
    ...getActiveMapNpcs(map).filter((object) => object.interactable !== false).map((object) => ({
      type: "npc",
      object: { ...object, width: 24, height: 46 },
      source: object,
      priority: 2,
      range: 78
    })),
    ...getScheduledNpcsForMap(map)
      .filter((npc) => npc.interactable)
      .map((npc) => ({
        type: "scheduledNpc",
        object: { ...npc, width: npc.width || 24, height: npc.height || 46 },
        source: npc,
        priority: npc.companion ? 5 : 2,
        range: npc.companion ? 52 : 72
      })),
    ...map.shops.map((object) => ({
      type: "shop",
      object: { ...object, name: foodCatalog[object.foodId].name },
      source: object,
      priority: 3,
      range: 86
    })),
    ...getVehicleShopInteractionPoints(map).map((point) => ({
      type: "vehicleShop",
      object: {
        id: point.id,
        name: point.shop.name,
        x: point.x - 8,
        y: point.y - 8,
        width: 16,
        height: 16
      },
      source: point.shop,
      point,
      priority: 3,
      range: point.radius
    })),
    ...getParkingInteractionPoints(map).map((point) => ({
      type: "parking",
      object: {
        id: point.id,
        name: point.spot.name,
        x: point.x - 8,
        y: point.y - 8,
        width: 16,
        height: 16
      },
      source: point.spot,
      point,
      priority: 2,
      range: point.radius
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
  if (isRidingVehicle()) {
    if (item.type === "exit") {
      return "E · Cất xe và chuyển khu";
    }
    if (item.type === "parking") {
      return "E · Gửi xe";
    }
    if (item.type === "environment" && item.source?.type === "vehicleWalkZone") {
      return "E · Dắt hoặc gửi xe";
    }
    return "[V] Xuống xe để tương tác";
  }

  if (item.type === "exit") {
    if (item.object.prompt) {
      return item.object.prompt;
    }
    const targetName = maps[item.object.targetMap].name;
    if (item.object.kind === "bus") {
      return `E · Xe buýt đến ${targetName}`;
    }
    return `E · Đi đến ${targetName}`;
  }

  if (item.type === "moReturn") {
    return "E · Đưa Mơ về";
  }

  if (item.type === "branchingQuest") {
    return `E · ${item.object.kind === "item" || item.object.kind === "clue" ? "Kiểm tra" : `Nói chuyện với ${item.object.name}`}`;
  }

  if (item.type === "randomEvent") {
    return item.source.definition.interaction.prompt || `E · ${item.object.name}`;
  }

  if (item.type === "shop") {
    return `E · Ghé ${item.object.name}`;
  }

  if (item.type === "npc" || item.type === "scheduledNpc") {
    return `E · Nói chuyện với ${item.object.name}`;
  }

  if (item.type === "vehicleShop") {
    return "[E] Xem xe VinFast";
  }

  if (item.type === "parking") {
    return "E · Bãi gửi xe";
  }

  if (item.type === "environment") {
    return `E · ${item.source.prompt}`;
  }

  return `${item.source ? item.source.name : item.object.name}\n[E] Khám phá`;
}

export function interact() {
  if (isOverlayOpen() || runtime.photoMode?.active) {
    return;
  }

  clearNpcReactionBubble();
  updateNearbyInteractable();

  if (!runtime.nearbyInteractable) {
    showMessage("Bạn chưa đứng gần nơi có thể tương tác.");
    return;
  }

  const ridingEnvironmentType = runtime.nearbyInteractable.type === "environment"
    ? runtime.nearbyInteractable.source?.type
    : null;
  if (isRidingVehicle() && !["exit", "parking"].includes(runtime.nearbyInteractable.type) && ridingEnvironmentType !== "vehicleWalkZone") {
    showMessage("Nhấn V để xuống xe trước khi tương tác.");
    return;
  }

  if (runtime.nearbyInteractable.type === "exit") {
    travelToMap(runtime.nearbyInteractable.object);
  }

  if (runtime.nearbyInteractable.type === "shop") {
    openShop(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "vehicleShop") {
    openVehicleShop(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "parking") {
    openParkingMenu(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "environment") {
    handleEnvironmentInteractable(runtime.nearbyInteractable.source);
    completeTrackedObjective("environmentInteraction", runtime.nearbyInteractable.source.id);
    return;
  }

  if (runtime.nearbyInteractable.type === "moReturn") {
    openMoReturnConfirmation();
  }

  if (runtime.nearbyInteractable.type === "npc") {
    handleNpc(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "scheduledNpc") {
    handleScheduledNpc(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "branchingQuest") {
    handleBranchingQuestActor(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "randomEvent") {
    handleRandomEventInteraction(runtime.nearbyInteractable.source);
  }

  if (runtime.nearbyInteractable.type === "landmark") {
    handleLandmark(runtime.nearbyInteractable.source || runtime.nearbyInteractable.object);
  }

  const navigationTypes = {
    landmark: "landmark",
    shop: "shop",
    vehicleShop: "vehicleShop",
    parking: "parking",
    npc: "npc",
    scheduledNpc: "npc",
    randomEvent: "event"
  };
  const navigationType = navigationTypes[runtime.nearbyInteractable.type];
  if (navigationType) {
    completeTrackedObjective(navigationType, runtime.nearbyInteractable.source?.id || runtime.nearbyInteractable.object?.id);
  }
}

export function travelToMap(exit) {
  const travelCheck = canChangeMapWithQuestFollowers(exit.targetMap);
  if (!travelCheck.allowed) {
    showMessage(travelCheck.message);
    return;
  }
  const travelMethod = exit.kind === "bus" ? "bus" : (isRidingVehicle() ? "vinfast" : "walk");
  endEnvironmentInteraction({ restore: true, silent: true });
  dismountVehicle({ silent: true });

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

  syncMoCompanionToPlayer({ force: true });

  snapCameraToPlayer();
  beginMapTransition();
  showMessage(exit.message);
  notifyBranchingQuestMapTransition(exit.targetMap, travelMethod);
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
  if (handleBranchingLinkedNpc(npc)) {
    return;
  }
  const task = npc.task;

  if (!task) {
    showMessage(`${npc.name}: Chúc bạn có một chuyến đi vui vẻ.`);
    return;
  }

  if (task.taskId && state.completedTasks[task.taskId]) {
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

  if (task.type === "ambient") {
    openChoiceModal({
      tag: "Đời sống Hà Nội",
      title: task.title || npc.name,
      body: task.intro,
      actions: [
        {
          label: task.action || "Trò chuyện",
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

  if (task.type === "chat") {
    openChoiceModal({
      tag: "Chuyện phố Hà Nội",
      title: task.title || npc.name,
      body: task.intro,
      actions: [
        {
          label: task.action || "Trò chuyện",
          className: "primary-choice",
          onClick: () => {
            closeChoiceModal();
            showMessage(task.done || `${npc.name}: Cảm ơn bạn đã ghé lại.`);
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

export function handleScheduledNpc(npc) {
  if (npc.id === "mo") {
    handleMoInteraction(npc);
    return;
  }

  const dialogue = getScheduledNpcDialogue(npc);
  if (npc.id === "chaXu") {
    showMessage(dialogue);
    return;
  }

  openChoiceModal({
    tag: "Chuyện ở sân nhỏ",
    title: npc.name,
    body: dialogue,
    actions: [
      {
        label: "Trò chuyện",
        className: "primary-choice",
        onClick: () => {
          closeChoiceModal();
          showMessage(dialogue);
        }
      },
      { label: "Rời đi", onClick: closeChoiceModal }
    ]
  });
}

function handleMoInteraction(npc) {
  if (handleMoQuestInteraction(npc)) {
    return;
  }
  if (isMoCompanionActive()) {
    openMoCompanionMenu();
    return;
  }

  if (!canInviteMo(npc)) {
    showMessage(getMoInvitationBlockedMessage(npc));
    return;
  }

  const dialogue = getScheduledNpcDialogue(npc);
  openChoiceModal({
    tag: "Mơ",
    title: "Mơ",
    body: dialogue,
    actions: [
      {
        label: "Nói chuyện",
        className: "primary-choice",
        onClick: () => {
          closeChoiceModal();
          showMessage(dialogue);
        }
      },
      {
        label: "Mời Mơ đi chơi",
        onClick: () => {
          closeChoiceModal();
          openMoHangoutConfirmation(npc);
        }
      },
      { label: "Rời đi", onClick: closeChoiceModal }
    ]
  });
}

function openMoHangoutConfirmation(npc) {
  openChoiceModal({
    tag: "Mơ",
    title: "Đi chơi cùng Mơ",
    body: "Được thôi, mình đi cùng bạn nhé. Nhưng nhớ đưa mình về Nhà thờ Lớn nhé!",
    actions: [
      {
        label: "Đi thôi",
        className: "primary-choice",
        onClick: () => {
          const currentMo = runtime.scheduledMo || npc;
          if (!canInviteMo(currentMo) || !startMoHangout()) {
            closeChoiceModal();
            showMessage(getMoInvitationBlockedMessage(currentMo));
            return;
          }

          closeChoiceModal();
          updateNpcSchedules();
          saveGame();
          showMessage("Mơ đang đi cùng bạn. Thời gian đã tạm dừng - hãy đưa Mơ về Nhà thờ Lớn để tiếp tục.");
        }
      },
      { label: "Để hôm khác", onClick: closeChoiceModal }
    ]
  });
}

function openMoCompanionMenu() {
  const dialogue = getMoCompanionDialogue();
  openChoiceModal({
    tag: "Đi chơi cùng Mơ",
    title: "Mơ",
    body: dialogue,
    actions: [
      {
        label: "Nói chuyện",
        className: "primary-choice",
        onClick: () => {
          closeChoiceModal();
          showMessage(dialogue);
        }
      },
      {
        label: "Mơ muốn đi đâu?",
        onClick: () => {
          closeChoiceModal();
          openMoDestinationQuest();
        }
      },
      {
        label: "Đưa Mơ về Nhà thờ",
        onClick: () => {
          closeChoiceModal();
          if (isNearMoReturnPoint()) {
            openMoReturnConfirmation();
          } else {
            showMessage("Hãy đưa Mơ tới cửa Nhà thờ Lớn Hà Nội để thời gian tiếp tục.");
          }
        }
      },
      { label: "Tiếp tục đi chơi", onClick: closeChoiceModal }
    ]
  });
}

function openMoReturnConfirmation() {
  if (!isNearMoReturnPoint()) {
    showMessage("Hãy đến khoảng sân trước cửa Nhà thờ Lớn để đưa Mơ về.");
    return;
  }

  openChoiceModal({
    tag: "Đi chơi cùng Mơ",
    title: "Đưa Mơ về Nhà thờ",
    body: "Bạn muốn kết thúc buổi đi chơi và đưa Mơ về Nhà thờ?",
    actions: [
      {
        label: "Đưa Mơ về",
        className: "primary-choice",
        onClick: () => {
          closeChoiceModal();
          endMoHangout();
          notifyMoReturned();
          updateNpcSchedules();
          saveGame();
          showMessage("Bạn đã đưa Mơ về Nhà thờ Lớn. Thời gian tiếp tục.");
        }
      },
      { label: "Đi chơi thêm", onClick: closeChoiceModal }
    ]
  });
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
