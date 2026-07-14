import { foodCatalog } from "../data/foods.js";
import { getEnvironmentInteractionsForMap } from "../data/environmentInteractions.js";
import { player, runtime, state, ui } from "../state.js";
import { saveGame } from "../storage.js";
import { isPlayerAreaWalkable } from "../utils/collision.js";
import { addUnique, getCurrentMap, getPlayerCenter } from "../utils/helpers.js";
import { closeChoiceModal, openChoiceModal, showMessage } from "./modal.js";
import { isMoCompanionActive, syncMoCompanionToPlayer } from "./moCompanion.js";
import { getScheduledNpcsForMap } from "./npcSchedule.js";
import { openParkingMenu } from "./parking.js";
import { togglePhotoMode } from "./photoMode.js";
import { isEventActive } from "./randomEvents.js";
import { isRidingVehicle, isWalkingBike } from "./vehicle.js";
import { getWeatherType } from "./weather.js";
import { getActiveMapNpcs } from "./worldSchedule.js";

const TEA_PRICE = foodCatalog.traDa.price;
const MOVEMENT_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);
const ACTIVE_HINT_CLASS = "is-environment-status";

const interactablesByMap = Object.freeze(Object.fromEntries(
  ["hoanKiem", "baDinh", "longBien", "churchInterior"].map((mapId) => [
    mapId,
    Object.freeze(getEnvironmentInteractionsForMap(mapId).map(createInteractable))
  ])
));

export function getEnvironmentInteractables(mapId = state.currentMapId) {
  const list = interactablesByMap[mapId] || [];
  return list.filter((item) => item.source.type !== "vehicleWalkZone" || isRidingVehicle() || isWalkingBike());
}

export function getNearestEnvironmentInteraction({ includeUnavailable = true } = {}) {
  const center = getPlayerCenter();
  return getEnvironmentInteractables()
    .map((item) => ({ item, distance: Math.hypot(center.x - item.point.x, center.y - item.point.y) }))
    .filter(({ item, distance }) => distance <= item.point.radius && (includeUnavailable || canUseEnvironmentInteraction(item.source).allowed))
    .sort((a, b) => a.distance - b.distance)[0] || null;
}

export function isEnvironmentInteractionActive() {
  return Boolean(runtime.environmentInteraction?.active);
}

export function isEnvironmentMovementLocked() {
  return isEnvironmentInteractionActive();
}

export function getActiveEnvironmentInteraction() {
  return isEnvironmentInteractionActive() ? runtime.environmentInteraction : null;
}

export function canUseEnvironmentInteraction(interaction) {
  if (!interaction || interaction.mapId !== state.currentMapId) {
    return { allowed: false, message: "Điểm tương tác này không ở khu vực hiện tại." };
  }
  if (interaction.blockedEventIds?.some(isEventActive)) {
    return { allowed: false, message: "Hãy đợi đoàn tàu đi qua." };
  }
  if (isSeatType(interaction.type) && isSeatOccupied(interaction)) {
    return { allowed: false, message: "Ghế này đang có người ngồi." };
  }

  const weather = getWeatherType();
  if (!interaction.sheltered && isSeatType(interaction.type) && ["rain", "heavyRain"].includes(weather)) {
    return { allowed: false, message: "Ghế ngoài trời đang ướt, hãy tìm chỗ có mái che." };
  }
  if (interaction.type === "teaSeat" && weather === "heavyRain") {
    return { allowed: false, message: "Mưa lớn nên cô đã thu ghế trà đá vào chỗ khô." };
  }
  if (!interaction.sheltered && interaction.type === "railingView" && weather === "heavyRain") {
    return { allowed: false, message: "Mưa lớn và gió mạnh, lúc này không nên đứng lâu bên lan can." };
  }
  return { allowed: true, message: "" };
}

export function handleEnvironmentInteractable(interaction) {
  if (!interaction) return false;
  if (isWalkingBike() && interaction.type !== "vehicleWalkZone") {
    showMessage("Hãy gửi hoặc cất xe trước khi sử dụng chỗ này.");
    return false;
  }
  if (interaction.type === "inspectObject") {
    return startEnvironmentInteraction(interaction, { pose: "inspect" });
  }
  if (interaction.type === "teaSeat") {
    openTeaSeatMenu(interaction);
    return true;
  }
  if (interaction.type === "vehicleWalkZone") {
    openVehicleWalkMenu(interaction);
    return true;
  }
  return startEnvironmentInteraction(interaction);
}

export function startEnvironmentInteraction(interaction, options = {}) {
  if (isEnvironmentInteractionActive()) return false;
  const check = canUseEnvironmentInteraction(interaction);
  if (!check.allowed) {
    showMessage(check.message);
    return false;
  }
  if (isRidingVehicle()) {
    showMessage("Nhấn V để xuống xe trước khi sử dụng chỗ này.");
    return false;
  }
  if (isWalkingBike()) {
    showMessage("Hãy gửi hoặc cất xe trước khi ngồi hay ngắm cảnh.");
    return false;
  }

  const origin = { x: player.x, y: player.y, facing: player.facing };
  const target = interaction.playerPosition || { x: player.x, y: player.y };
  player.x = target.x;
  player.y = target.y;
  player.facing = interaction.direction || player.facing;
  player.moving = false;
  clearMotion();

  runtime.environmentInteraction = {
    active: true,
    id: interaction.id,
    type: interaction.type,
    mapId: interaction.mapId,
    interaction,
    origin,
    pose: options.pose || interaction.pose || "sit",
    startedAt: performance.now(),
    allowPhoto: Boolean(interaction.allowPhoto),
    cameraFocus: createCameraFocus(interaction),
    companionPose: createCompanionPose(interaction),
    statusText: createStatusText(interaction, options.pose)
  };

  runtime.nearbyInteractable = null;
  document.body.classList.toggle("environment-focus", isViewType(interaction.type));
  syncMoCompanionToPlayer({ force: true });
  showMessage(createStartMessage(interaction, options.pose), 2600);
  return true;
}

export function endEnvironmentInteraction({ restore = true, silent = false } = {}) {
  const active = getActiveEnvironmentInteraction();
  if (!active) return false;

  if (restore && active.origin) {
    player.x = active.origin.x;
    player.y = active.origin.y;
    player.facing = active.origin.facing;
    state.player.x = Math.round(player.x);
    state.player.y = Math.round(player.y);
  }
  player.moving = false;
  clearMotion();
  runtime.environmentInteraction = createEmptyRuntimeState();
  document.body.classList.remove("environment-focus");
  ui.nearbyHint.classList.remove(ACTIVE_HINT_CLASS);
  ui.nearbyHint.classList.add("hidden");
  syncMoCompanionToPlayer({ force: true });
  if (!silent) showMessage("Bạn tiếp tục chuyến đi.", 1500);
  return true;
}

export function updateEnvironmentInteraction(timestamp = performance.now()) {
  const active = getActiveEnvironmentInteraction();
  if (!active) return;
  if (active.mapId !== state.currentMapId) {
    endEnvironmentInteraction({ restore: false, silent: true });
    return;
  }
  if (active.pose === "drink" && timestamp - active.startedAt > 1550) {
    active.pose = "sit";
    active.statusText = "Đang ngồi uống trà đá — E/Esc để đứng dậy";
  }
}

export function handleEnvironmentInteractionKey(key) {
  const active = getActiveEnvironmentInteraction();
  if (!active) return false;
  if (key === "p" && active.allowPhoto) {
    togglePhotoMode();
    return true;
  }
  if (key === "e" || key === "escape" || MOVEMENT_KEYS.has(key)) {
    endEnvironmentInteraction();
    return true;
  }
  return true;
}

export function showActiveEnvironmentHint() {
  const active = getActiveEnvironmentInteraction();
  if (!active) return false;
  runtime.nearbyInteractable = null;
  ui.nearbyHint.textContent = active.statusText;
  ui.nearbyHint.style.left = "50%";
  ui.nearbyHint.style.top = "auto";
  ui.nearbyHint.style.bottom = "12px";
  ui.nearbyHint.classList.add(ACTIVE_HINT_CLASS);
  ui.nearbyHint.classList.remove("hidden");
  return true;
}

export function getEnvironmentSavePosition() {
  const active = getActiveEnvironmentInteraction();
  return active?.origin || null;
}

export function hydrateEnvironmentInteraction() {
  runtime.environmentInteraction = createEmptyRuntimeState();
  document.body.classList.remove("environment-focus");
}

function openTeaSeatMenu(interaction) {
  const check = canUseEnvironmentInteraction(interaction);
  const helped = isTeaVendorHelped();
  const freeTea = helped && !hasClaimedFreeTea();
  const priceText = freeTea ? "Miễn phí vì bạn đã giúp cô lần trước." : `Giá một cốc: ${TEA_PRICE.toLocaleString("vi-VN")}đ.`;
  openChoiceModal({
    tag: "Trà đá vỉa hè",
    title: interaction.name,
    body: check.allowed
      ? `Một chiếc bàn thấp, vài ghế nhựa và ấm trà đặt gọn trên vỉa hè.\n${priceText}`
      : check.message,
    actions: check.allowed ? [
      {
        label: "Uống trà đá",
        className: "primary-choice",
        onClick: () => drinkTea(interaction, freeTea)
      },
      {
        label: "Ngồi nghỉ",
        onClick: () => {
          closeChoiceModal();
          startEnvironmentInteraction(interaction, { pose: "sit" });
        }
      },
      {
        label: "Nói chuyện",
        onClick: () => {
          closeChoiceModal();
          showMessage("Cô bán trà: Ngồi nghỉ một lát đi cháu, vỉa hè Hà Nội vui nhất khi có người chuyện trò.", 3800);
        }
      },
      { label: "Rời đi", onClick: closeChoiceModal }
    ] : [{ label: "Rời đi", className: "primary-choice", onClick: closeChoiceModal }]
  });
}

function drinkTea(interaction, freeTea) {
  if (!freeTea && state.money < TEA_PRICE) {
    showMessage("Bạn chưa đủ tiền để uống trà đá.");
    return;
  }
  if (!freeTea) state.money -= TEA_PRICE;
  if (freeTea) markFreeTeaClaimed();
  addUnique(state.inventory.foods, foodCatalog.traDa.item);
  addUnique(state.discoveredFoods, foodCatalog.traDa.id);
  closeChoiceModal();
  startEnvironmentInteraction(interaction, { pose: "drink" });
  saveGame();
  showMessage(freeTea ? "Cô mời bạn một cốc trà đá để cảm ơn lần trước." : "Bạn ngồi xuống và uống một cốc trà đá mát.", 2600);
}

function openVehicleWalkMenu(interaction) {
  const map = getCurrentMap();
  const spot = (map.parkingSpots || []).find((candidate) => candidate.id === interaction.parkingSpotId);
  if (!spot) {
    showMessage("Không tìm thấy điểm gửi xe gần lối vào.");
    return;
  }
  openParkingMenu(spot, { allowWalkingBike: true });
}

function isSeatOccupied(interaction) {
  const map = getCurrentMap();
  const occupantIds = interaction.occupiedByNpcIds || [];
  const nearbyNpcs = [
    ...getActiveMapNpcs(map),
    ...getScheduledNpcsForMap(map)
  ];
  if (occupantIds.some((id) => nearbyNpcs.some((npc) => npc.id === id && npc.visible !== false))) return true;

  const seat = interaction.playerPosition || interaction;
  return nearbyNpcs.some((npc) => {
    if (npc.id === "mo" && isMoCompanionActive()) return false;
    if (npc.visible === false || npc.ridingWithPlayer) return false;
    const sitting = ["resting", "attendingMass", "sitting"].includes(npc.activity) || npc.scheduleState === "resting";
    return sitting && Math.hypot((npc.x || 0) - seat.x, (npc.y || 0) - seat.y) < 34;
  });
}

function createCompanionPose(interaction) {
  if (!isMoCompanionActive()) return null;
  if (interaction.companionPosition) return { ...interaction.companionPosition };
  const base = interaction.playerPosition || { x: player.x, y: player.y };
  const candidates = [
    { x: base.x + 38, y: base.y, facing: interaction.direction, activity: isSeatType(interaction.type) ? "resting" : "hangingOut" },
    { x: base.x - 38, y: base.y, facing: interaction.direction, activity: isSeatType(interaction.type) ? "resting" : "hangingOut" },
    { x: base.x, y: base.y + 38, facing: interaction.direction, activity: "hangingOut" }
  ];
  return candidates.find((candidate) => interaction.type === "churchSeat" || isPlayerAreaWalkable(candidate.x, candidate.y)) || candidates[0];
}

function createCameraFocus(interaction) {
  if (!isViewType(interaction.type)) return null;
  const offset = interaction.cameraOffset || {};
  return {
    x: interaction.x + (Number(offset.x) || 0),
    y: interaction.y + (Number(offset.y) || 0),
    strength: 0.8
  };
}

function createStatusText(interaction, pose) {
  if (isViewType(interaction.type)) return `Đang ngắm ${interaction.name} — P chụp ảnh · E/Esc rời đi`;
  if (interaction.type === "inspectObject") return `Đang xem ${interaction.name} — E/Esc để rời đi`;
  if (pose === "drink") return "Đang uống trà đá — E/Esc để đứng dậy";
  return interaction.type === "churchSeat"
    ? "Đang ngồi trong Nhà thờ — E/Esc để đứng dậy"
    : "Đang ngồi nghỉ — E/Esc để đứng dậy";
}

function createStartMessage(interaction, pose) {
  if (isViewType(interaction.type)) return `${interaction.name}: ${interaction.description}`;
  if (interaction.type === "inspectObject") return `${interaction.name}: ${interaction.description}`;
  if (pose === "drink") return "Bạn ngồi xuống bên chiếc bàn trà đá nhỏ.";
  return interaction.type === "churchSeat" ? "Bạn ngồi xuống một chỗ trống và giữ yên lặng." : "Bạn ngồi nghỉ một lát.";
}

function createInteractable(source) {
  const point = Object.freeze({
    id: source.id,
    type: "environment",
    targetId: source.id,
    x: source.x,
    y: source.y,
    radius: source.interactionRadius,
    visibleRange: source.visibleRange,
    labelOffsetX: source.labelOffsetX,
    labelOffsetY: source.labelOffsetY,
    label: source.name
  });
  return Object.freeze({
    type: "environment",
    source,
    point,
    object: Object.freeze({ id: source.id, name: source.name, x: source.x - 8, y: source.y - 8, width: 16, height: 16 }),
    priority: source.type === "vehicleWalkZone" || source.type === "teaSeat" ? 1 : 4,
    range: point.radius
  });
}

function isSeatType(type) {
  return type === "seat" || type === "teaSeat" || type === "churchSeat";
}

function isViewType(type) {
  return type === "viewpoint" || type === "railingView";
}

function isTeaVendorHelped() {
  const progress = state.branchingQuestProgress?.teaVendorHelp;
  return Boolean(progress && progress.status === "completed" && ["excellent", "good"].includes(progress.outcome));
}

function hasClaimedFreeTea() {
  return Boolean(state.branchingQuestProgress?.teaVendorHelp?.flags?.environmentFreeTeaClaimed);
}

function markFreeTeaClaimed() {
  const progress = state.branchingQuestProgress?.teaVendorHelp;
  if (progress) progress.flags.environmentFreeTeaClaimed = true;
}

function clearMotion() {
  runtime.playerMotionX = 0;
  runtime.playerMotionY = 0;
  runtime.playerMotionSpeed = 0;
}

function createEmptyRuntimeState() {
  return {
    active: false,
    id: null,
    type: null,
    mapId: null,
    interaction: null,
    origin: null,
    pose: null,
    startedAt: 0,
    allowPhoto: false,
    cameraFocus: null,
    companionPose: null,
    statusText: ""
  };
}
