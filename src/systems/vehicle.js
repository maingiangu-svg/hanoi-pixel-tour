import { player, runtime, state, ui } from "../state.js";
import { VINFAST_VEHICLE_ID, vehicleCatalog } from "../data/vehicles.js";
import { FEMALE_BIKE_TRANSITION_DURATION_MS } from "../../assets/sprites/vehicle/female/female-bike-animations.js";
import { formatMoney } from "../utils/format.js";
import { addUnique } from "../utils/helpers.js";
import { getVehicleRestrictedZoneAt, hasVehicleClearance } from "../utils/collision.js";
import { saveGame } from "../storage.js";
import { closeChoiceModal, isOverlayOpen, openChoiceModal, showMessage } from "./modal.js";
import { checkSideQuests } from "./questSystem.js";
import { getVehicleParkingLabel, isVehicleParked, showVehicleRestrictionMessage } from "./parking.js";
import { syncMoCompanionToPlayer } from "./moCompanion.js";
import { getShopHoursText, isShopOpen } from "./worldSchedule.js";
import { getPlayerVehicleSpeedMultiplier } from "./weather.js";
import { canUseVehicleWithQuestFollower } from "./questFollower.js";

export function getVehicleData() {
  const vehicleId = state.vehicle?.type || VINFAST_VEHICLE_ID;
  return vehicleCatalog[vehicleId] || vehicleCatalog[VINFAST_VEHICLE_ID];
}

export function isVehicleOwned() {
  return Boolean(state.vehicle && state.vehicle.owned);
}

export function isRidingVehicle() {
  return Boolean(isVehicleOwned() && state.vehicle.equipped && state.vehicle.status === "riding");
}

export function isWalkingBike() {
  return Boolean(isVehicleOwned() && state.vehicle.equipped && state.vehicle.status === "walking-bike");
}

export function isVehicleTransitionActive() {
  return Boolean(runtime.vehicleTransition);
}

export function getVehicleTransition() {
  return runtime.vehicleTransition;
}

export function getPlayerMoveSpeed() {
  const vehicle = getVehicleData();
  return isRidingVehicle()
    ? player.speed * vehicle.speedMultiplier * getPlayerVehicleSpeedMultiplier()
    : isWalkingBike()
      ? player.speed * 0.86
      : player.speed;
}

export function toggleVehicle() {
  const now = performance.now();
  if (isOverlayOpen() || isVehicleTransitionActive() || now < runtime.vehicleToggleBlockedUntil) {
    return;
  }

  const vehicle = getVehicleData();
  if (!isVehicleOwned()) {
    showMessage("Bạn chưa sở hữu xe máy điện VinFast. Hãy ghé đại lý để mua xe.");
    return;
  }

  if (isWalkingBike()) {
    const restrictedZone = getVehicleRestrictedZoneAt(player.x, player.y);
    if (restrictedZone) {
      showMessage("Khu vực này chỉ được dắt xe.");
      return;
    }
    if (!hasVehicleClearance(player.x, player.y)) {
      showMessage("Không đủ không gian để lên xe tại đây.");
      return;
    }
    if (isFemaleProfile()) beginVehicleTransition("mounting");
    else finishMount();
    return;
  }

  if (isRidingVehicle()) {
    if (isFemaleProfile()) {
      beginVehicleTransition("dismounting");
    } else {
      finishDismount("Bạn đã cất xe máy điện VinFast.");
    }
    return;
  }

  if (isVehicleParked()) {
    showMessage(`Xe đang gửi tại ${getVehicleParkingLabel()}. Hãy quay lại bãi gửi xe để lấy xe.`);
    return;
  }

  const followerCheck = canUseVehicleWithQuestFollower();
  if (!followerCheck.allowed) {
    showMessage(followerCheck.message);
    return;
  }

  const restrictedZone = getVehicleRestrictedZoneAt(player.x, player.y);
  if (restrictedZone) {
    showVehicleRestrictionMessage(restrictedZone);
    return;
  }

  if (!hasVehicleClearance(player.x, player.y)) {
    showMessage("Không đủ không gian để sử dụng xe tại đây.");
    return;
  }

  if (isFemaleProfile()) {
    beginVehicleTransition("mounting");
  } else {
    finishMount();
  }
}

export function dismountVehicle({ silent = false } = {}) {
  if (isWalkingBike()) {
    storeVehicle();
    if (!silent) showMessage("Bạn đã cất xe máy điện VinFast.");
    saveGame();
    return;
  }
  if (!isRidingVehicle()) {
    return;
  }

  finishDismount(silent ? null : "Bạn đã xuống xe để tiếp tục tương tác.");
}

export function updateVehicleTransition(timestamp = performance.now()) {
  const transition = runtime.vehicleTransition;
  if (!transition || timestamp - transition.startedAt < transition.durationMs) {
    return;
  }

  runtime.vehicleTransition = null;
  runtime.vehicleToggleBlockedUntil = timestamp + 180;
  if (transition.type === "mounting") {
    finishMount();
  } else {
    finishDismount("Bạn đã cất xe máy điện VinFast.");
  }
}

export function openVehicleShop(shop) {
  const vehicle = vehicleCatalog[shop.vehicleId] || vehicleCatalog[VINFAST_VEHICLE_ID];

  if (!isShopOpen(shop)) {
    openChoiceModal({
      tag: "VinFast",
      title: vehicle.name,
      body: `Đại lý hiện đang đóng cửa.\nGiờ mở cửa: ${getShopHoursText(shop)}.`,
      actions: [{ label: "Đóng", className: "primary-choice", onClick: closeChoiceModal }]
    });
    return;
  }

  if (isVehicleOwned()) {
    openChoiceModal({
      tag: "VinFast",
      title: vehicle.name,
      body: `Bạn đã sở hữu xe máy điện VinFast.\nNhấn V khi đang đi bộ để gọi hoặc cất xe.`,
      actions: [
        { label: "Đóng", className: "primary-choice", onClick: closeChoiceModal }
      ]
    });
    return;
  }

  openChoiceModal({
    tag: "VinFast",
    title: vehicle.name,
    body: createVehicleShopBody(vehicle),
    actions: [
      {
        label: "Mua",
        className: "primary-choice",
        onClick: () => buyVehicle(vehicle)
      },
      { label: "Hủy", onClick: closeChoiceModal }
    ]
  });
}

export function buyVehicle(vehicle) {
  if (isVehicleOwned()) {
    ui.choiceBody.textContent = "Bạn đã sở hữu xe máy điện VinFast.";
    return;
  }

  if (state.money < vehicle.price) {
    ui.choiceBody.textContent = `${createVehicleShopBody(vehicle)}\n\nBạn chưa đủ tiền để mua xe.`;
    showMessage("Bạn chưa đủ tiền để mua xe.");
    return;
  }

  state.money -= vehicle.price;
  state.vehicle = {
    owned: true,
    type: vehicle.id,
    equipped: false,
    status: "stored",
    parkedAt: null
  };
  addUnique(state.inventory.specialItems, vehicle.item);
  closeChoiceModal();
  showMessage(`Bạn đã mua ${vehicle.name}. Nhấn V để gọi xe khi có đủ không gian.`);
  saveGame();
  checkSideQuests();
}

export function createVehicleShopBody(vehicle) {
  return `${vehicle.name}\nGiá: ${formatMoney(vehicle.price)}\nTiền hiện có: ${formatMoney(state.money)}\nLợi ích: ${vehicle.benefit}`;
}

function storeVehicle() {
  state.vehicle = {
    ...state.vehicle,
    equipped: false,
    status: "stored",
    parkedAt: null
  };
  syncMoCompanionToPlayer({ force: true });
}

function beginVehicleTransition(type) {
  const horizontalFacing = player.facing === "left" || player.facing === "right"
    ? player.facing
    : (runtime.vehicleTransition?.visualFacing || "right");
  player.moving = false;
  runtime.playerMotionX = 0;
  runtime.playerMotionY = 0;
  runtime.playerMotionSpeed = 0;
  runtime.vehicleTransition = {
    type,
    startedAt: performance.now(),
    durationMs: FEMALE_BIKE_TRANSITION_DURATION_MS,
    visualFacing: horizontalFacing
  };
}

function finishMount() {
  state.vehicle = {
    ...state.vehicle,
    equipped: true,
    status: "riding",
    parkedAt: null
  };
  syncMoCompanionToPlayer({ force: true });
  showMessage("Bạn đang lái xe máy điện VinFast. Nhấn V để cất xe.");
  saveGame();
}

function finishDismount(message) {
  storeVehicle();
  if (message) {
    showMessage(message);
  }
  saveGame();
}

function isFemaleProfile() {
  return state.profile.gender === "female";
}
