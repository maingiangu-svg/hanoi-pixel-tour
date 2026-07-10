import { state, ui } from "../state.js";
import { formatMoney } from "../utils/format.js";
import { closePanelOverlays } from "./modal.js";
import { openCharacterSelection } from "./characterSelection.js";
import { getVehicleData, isRidingVehicle, isVehicleOwned } from "./vehicle.js";

export function toggleInventory() {
  if (!ui.inventoryPanel.classList.contains("hidden")) {
    closeInventory();
    return;
  }

  closePanelOverlays("inventory");
  renderInventory();
  ui.inventoryPanel.classList.remove("hidden");
}

export function closeInventory() {
  ui.inventoryPanel.classList.add("hidden");
}

export function renderInventory() {
  ui.inventoryContent.innerHTML = "";

  const stats = document.createElement("div");
  stats.className = "panel-grid";
  stats.appendChild(createStatCard("Tiền", formatMoney(state.money)));
  stats.appendChild(createStatCard("Khu đã ghé", `${state.visitedMaps.length}/3`));
  stats.appendChild(createStatCard("Nhân vật", getGenderLabel()));
  stats.appendChild(createStatCard("Phương tiện", getVehicleLabel()));
  ui.inventoryContent.appendChild(stats);

  const actions = document.createElement("div");
  actions.className = "inventory-actions";
  const changeCharacter = document.createElement("button");
  changeCharacter.type = "button";
  changeCharacter.textContent = "Đổi nhân vật";
  changeCharacter.addEventListener("click", () => openCharacterSelection({ allowClose: true }));
  actions.appendChild(changeCharacter);
  ui.inventoryContent.appendChild(actions);

  const grid = document.createElement("div");
  grid.className = "panel-grid";
  grid.appendChild(createInventorySection("Món đã ăn", state.inventory.foods));
  grid.appendChild(createInventorySection("Quà lưu niệm", state.inventory.souvenirs));
  grid.appendChild(createInventorySection("Tem check-in", state.inventory.stamps));
  grid.appendChild(createInventorySection("Vật phẩm đặc biệt", state.inventory.specialItems));
  ui.inventoryContent.appendChild(grid);
}

export function createStatCard(title, value) {
  const card = document.createElement("section");
  card.className = "stat-card";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const strong = document.createElement("strong");
  strong.textContent = value;
  card.append(heading, strong);
  return card;
}

export function createInventorySection(title, items) {
  const section = document.createElement("section");
  section.className = "inventory-section";

  const heading = document.createElement("h3");
  heading.textContent = title;
  section.appendChild(heading);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Chưa có";
    section.appendChild(empty);
    return section;
  }

  const list = document.createElement("ul");
  list.className = "inventory-list";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
  section.appendChild(list);
  return section;
}

function getGenderLabel() {
  if (state.profile.gender === "female") {
    return "Nữ";
  }
  if (state.profile.gender === "male") {
    return "Nam";
  }
  return "Chưa chọn";
}

function getVehicleLabel() {
  if (!isVehicleOwned()) {
    return "Chưa có";
  }

  const vehicle = getVehicleData();
  return isRidingVehicle() ? `${vehicle.name} (đang lái)` : `${vehicle.name} (đang cất)`;
}
