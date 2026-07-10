import { state, ui } from "../state.js";
import { foodCatalog } from "../data/foods.js";
import { landmarkDetails } from "../data/landmarks.js";
import { addUnique, findLandmark } from "../utils/helpers.js";
import { closePanelOverlays, openFoodInfoPanel, openLandmarkInfoPanel } from "./modal.js";

export function toggleJournal() {
  if (!ui.journalPanel.classList.contains("hidden")) {
    closeJournal();
    return;
  }

  closePanelOverlays("journal");
  renderJournal();
  ui.journalPanel.classList.remove("hidden");
}

export function closeJournal() {
  ui.journalPanel.classList.add("hidden");
}

export function renderJournal() {
  ui.journalContent.innerHTML = "";

  const foods = state.discoveredFoods
    .map((foodId) => foodCatalog[foodId])
    .filter(Boolean);
  const landmarks = state.discoveredLandmarks
    .map((landmarkId) => findLandmark(landmarkId))
    .filter(Boolean);

  const stats = document.createElement("div");
  stats.className = "journal-tabs";
  stats.appendChild(createJournalStat("Món đã khám phá", `${foods.length}`));
  stats.appendChild(createJournalStat("Địa danh đã tìm hiểu", `${landmarks.length}`));
  ui.journalContent.appendChild(stats);

  const grid = document.createElement("div");
  grid.className = "journal-grid";

  if (!foods.length && !landmarks.length) {
    const empty = document.createElement("p");
    empty.className = "journal-empty";
    empty.textContent = "Chưa có ghi chép. Hãy ghé quán ăn hoặc tìm hiểu một địa danh để mở khóa sổ tay.";
    grid.appendChild(empty);
  }

  foods.forEach((food) => {
    grid.appendChild(createJournalCard({
      title: food.name,
      summary: food.description,
      buttonLabel: "Xem món ăn",
      onClick: () => openFoodInfoPanel(food, { fromJournal: true })
    }));
  });

  landmarks.forEach((landmark) => {
    const detail = landmarkDetails[landmark.id];
    grid.appendChild(createJournalCard({
      title: landmark.name,
      summary: detail ? detail.intro : landmark.description,
      buttonLabel: "Xem địa danh",
      onClick: () => openLandmarkInfoPanel(landmark, { fromJournal: true })
    }));
  });

  ui.journalContent.appendChild(grid);
}

export function createJournalStat(label, value) {
  const card = document.createElement("section");
  card.className = "journal-stat";
  const span = document.createElement("span");
  span.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = value;
  card.append(span, strong);
  return card;
}

export function createJournalCard({ title, summary, buttonLabel, onClick }) {
  const card = document.createElement("article");
  card.className = "journal-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = summary;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = buttonLabel;
  button.addEventListener("click", onClick);

  card.append(heading, text, button);
  return card;
}

export function discoverFood(foodId) {
  return addUnique(state.discoveredFoods, foodId);
}

export function discoverLandmark(landmarkId) {
  return addUnique(state.discoveredLandmarks, landmarkId);
}
