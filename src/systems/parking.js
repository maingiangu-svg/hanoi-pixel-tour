import { player, runtime, state } from "../state.js";
import { hasVehicleClearance, getVehicleRestrictedZoneAt } from "../utils/collision.js";
import { getCurrentMap, getPlayerCenter } from "../utils/helpers.js";
import { saveGame } from "../storage.js";
import { closeChoiceModal, openChoiceModal, showMessage } from "./modal.js";
import { syncMoCompanionToPlayer } from "./moCompanion.js";

export function isVehicleParked() {
  return Boolean(state.vehicle?.owned && state.vehicle.status === "parked" && state.vehicle.parkedAt);
}

export function getVehicleParkingLabel() {
  return isVehicleParked() ? state.vehicle.parkedAt.name : "";
}

export function getNearestParkingSpot(map = getCurrentMap(), point = getPlayerCenter()) {
  const spots = map.parkingSpots || [];
  return spots
    .map((spot) => ({
      spot,
      distance: Math.hypot(point.x - spot.interactionPoint.x, point.y - spot.interactionPoint.y)
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.spot || null;
}

export function isPlayerInVehicleRestrictedZone() {
  return Boolean(getVehicleRestrictedZoneAt(player.x, player.y));
}

export function showVehicleRestrictionMessage(zone) {
  if (!zone) {
    return;
  }

  const now = performance.now();
  if (runtime.lastVehicleRestrictionId === zone.id && now - runtime.lastVehicleRestrictionAt < 1800) {
    return;
  }

  runtime.lastVehicleRestrictionId = zone.id;
  runtime.lastVehicleRestrictionAt = now;
  const parking = getNearestParkingSpot(getCurrentMap(), {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2
  });
  const direction = parking ? ` Đi tới ${parking.name}.` : "";
  showMessage(`${zone.message || "Khu vực này cần đi bộ. Hãy gửi xe trước."}${direction}`);
}

export function openParkingMenu(spot) {
  if (!state.vehicle?.owned) {
    openChoiceModal({
      tag: "Bãi gửi xe",
      title: spot.name,
      body: "Bạn đang đi bộ nên có thể vào khu tham quan bình thường. Khi sở hữu xe VinFast, hãy ghé đây để gửi xe trước khi vào khu đi bộ.",
      actions: [{ label: "Đóng", className: "primary-choice", onClick: closeChoiceModal }]
    });
    return;
  }

  if (state.vehicle.equipped) {
    openChoiceModal({
      tag: "Bãi gửi xe",
      title: spot.name,
      body: "Khu tham quan phía trước chỉ dành cho người đi bộ. Bạn muốn gửi xe máy điện VinFast tại đây chứ?",
      actions: [
        { label: "Gửi xe", className: "primary-choice", onClick: () => parkVehicleAt(spot) },
        { label: "Để sau", onClick: closeChoiceModal }
      ]
    });
    return;
  }

  if (isVehicleParkedAt(spot)) {
    openChoiceModal({
      tag: "Bãi gửi xe",
      title: spot.name,
      body: "Xe máy điện VinFast của bạn đang được gửi tại đây. Bạn muốn lấy xe chứ?",
      actions: [
        { label: "Lấy xe", className: "primary-choice", onClick: () => retrieveVehicleAt(spot) },
        { label: "Để sau", onClick: closeChoiceModal }
      ]
    });
    return;
  }

  if (isVehicleParked()) {
    openChoiceModal({
      tag: "Bãi gửi xe",
      title: spot.name,
      body: `Xe của bạn đang gửi tại ${getVehicleParkingLabel()}. Hãy quay lại đúng bãi để lấy xe.`,
      actions: [{ label: "Đóng", className: "primary-choice", onClick: closeChoiceModal }]
    });
    return;
  }

  openChoiceModal({
    tag: "Bãi gửi xe",
    title: spot.name,
    body: "Bạn đang đi bộ. Nhấn V ở khu vực rộng, ngoài phố đi bộ để gọi xe máy điện VinFast.",
    actions: [{ label: "Đóng", className: "primary-choice", onClick: closeChoiceModal }]
  });
}

function parkVehicleAt(spot) {
  state.vehicle = {
    ...state.vehicle,
    equipped: false,
    status: "parked",
    parkedAt: {
      mapId: state.currentMapId,
      spotId: spot.id,
      name: spot.name
    }
  };
  syncMoCompanionToPlayer({ force: true });
  closeChoiceModal();
  showMessage("Bạn đã gửi xe. Hãy tiếp tục đi bộ tham quan.");
  saveGame();
}

function retrieveVehicleAt(spot) {
  if (isPlayerInVehicleRestrictedZone() || !hasVehicleClearance(player.x, player.y)) {
    showMessage("Không đủ không gian để lấy xe tại đây.");
    return;
  }

  state.vehicle = {
    ...state.vehicle,
    equipped: true,
    status: "riding",
    parkedAt: null
  };
  syncMoCompanionToPlayer({ force: true });
  closeChoiceModal();
  showMessage("Bạn đã lấy xe máy điện VinFast. Nhấn V để cất xe.");
  saveGame();
}

function isVehicleParkedAt(spot) {
  const parkedAt = state.vehicle?.parkedAt;
  return Boolean(parkedAt && parkedAt.mapId === state.currentMapId && parkedAt.spotId === spot.id);
}
