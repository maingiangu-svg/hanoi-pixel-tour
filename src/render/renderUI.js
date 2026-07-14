import { ctx, state, ui } from "../state.js";
import { getCurrentMap } from "../utils/helpers.js";
import { formatGameTimeHud } from "../utils/gameTime.js";
import { renderInventory } from "../systems/inventory.js";
import { renderJournal } from "../systems/journal.js";
import { getCurrentObjective, renderQuestLog } from "../systems/questSystem.js";
import { getVehicleData, isRidingVehicle, isVehicleOwned, isWalkingBike } from "../systems/vehicle.js";
import { getVehicleParkingLabel, isVehicleParked } from "../systems/parking.js";
import { getCurrentAreaAmbience } from "../systems/areaAmbience.js";
import { getNavigationHudText } from "../systems/navigation.js";

export function drawPixelRect(x, y, width, height, fill, stroke, strokeWidth) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = strokeWidth;
  ctx.strokeRect(x, y, width, height);
}

export function drawTextBadge(text, centerX, centerY, maxWidth, fill) {
  ctx.font = "700 13px 'Courier New', monospace";
  const lines = wrapCanvasText(text, maxWidth - 12);
  const lineHeight = 15;
  const width = maxWidth;
  const height = lines.length * lineHeight + 8;
  const x = Math.round(centerX - width / 2);
  const y = Math.round(centerY - height / 2);

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "#151515";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = "#fff8d6";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, y + 5 + index * lineHeight);
  });
  ctx.textBaseline = "alphabetic";
}

export function wrapCanvasText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

export function updateHud() {
  ui.hudMapName.textContent = getCurrentAreaAmbience().profile.label || getCurrentMap().name;
  updateClockHud();
  ui.hudObjective.textContent = state.moCompanion?.active
    ? "Đưa Mơ về Nhà thờ Lớn để thời gian tiếp tục."
    : (getNavigationHudText() || getCurrentObjective());

  if (isVehicleOwned()) {
    const vehicle = getVehicleData();
    ui.vehicleStatus.textContent = isRidingVehicle()
      ? (state.moCompanion?.ridingWithPlayer ? "Đang lái VinFast · Mơ ngồi sau" : "Đang lái VinFast · V cất xe")
      : isWalkingBike()
        ? "Đang dắt VinFast · V lên xe khi ra khỏi khu cấm"
      : isVehicleParked()
        ? `Xe gửi: ${getVehicleParkingLabel()}`
        : `${vehicle.name} · V gọi xe`;
    ui.vehicleStatus.classList.remove("hidden");
  } else {
    ui.vehicleStatus.classList.add("hidden");
  }

  if (!ui.inventoryPanel.classList.contains("hidden")) {
    renderInventory();
  }

  if (!ui.questPanel.classList.contains("hidden")) {
    renderQuestLog();
  }

  if (!ui.journalPanel.classList.contains("hidden")) {
    renderJournal();
  }
}

export function updateClockHud() {
  if (ui.hudClock) {
    ui.hudClock.textContent = formatGameTimeHud(state.gameTime);
  }
}
