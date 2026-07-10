import { player, state, ui } from "../state.js";
import { VINFAST_VEHICLE_ID, vehicleCatalog } from "../data/vehicles.js";
import { formatMoney } from "../utils/format.js";
import { addUnique } from "../utils/helpers.js";
import { hasVehicleClearance } from "../utils/collision.js";
import { saveGame } from "../storage.js";
import { closeChoiceModal, isOverlayOpen, openChoiceModal, showMessage } from "./modal.js";
import { checkSideQuests } from "./questSystem.js";

export function getVehicleData() {
  const vehicleId = state.vehicle?.type || VINFAST_VEHICLE_ID;
  return vehicleCatalog[vehicleId] || vehicleCatalog[VINFAST_VEHICLE_ID];
}

export function isVehicleOwned() {
  return Boolean(state.vehicle && state.vehicle.owned);
}

export function isRidingVehicle() {
  return Boolean(isVehicleOwned() && state.vehicle.equipped);
}

export function getPlayerMoveSpeed() {
  const vehicle = getVehicleData();
  return isRidingVehicle() ? player.speed * vehicle.speedMultiplier : player.speed;
}

export function toggleVehicle() {
  if (isOverlayOpen()) {
    return;
  }

  const vehicle = getVehicleData();
  if (!isVehicleOwned()) {
    showMessage("Bạn chưa sở hữu xe máy điện VinFast. Hãy ghé đại lý để mua xe.");
    return;
  }

  if (isRidingVehicle()) {
    state.vehicle.equipped = false;
    showMessage("Bạn đã cất xe máy điện VinFast.");
    saveGame();
    return;
  }

  if (!hasVehicleClearance(player.x, player.y)) {
    showMessage("Không đủ không gian để sử dụng xe tại đây.");
    return;
  }

  state.vehicle.equipped = true;
  showMessage("Bạn đang lái xe máy điện VinFast. Nhấn V để cất xe.");
  saveGame();
}

export function dismountVehicle({ silent = false } = {}) {
  if (!isRidingVehicle()) {
    return;
  }

  state.vehicle.equipped = false;
  if (!silent) {
    showMessage("Bạn đã xuống xe để tiếp tục tương tác.");
  }
  saveGame();
}

export function openVehicleShop(shop) {
  const vehicle = vehicleCatalog[shop.vehicleId] || vehicleCatalog[VINFAST_VEHICLE_ID];

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
    equipped: false
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
