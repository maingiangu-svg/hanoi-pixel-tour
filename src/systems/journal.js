import { state, ui } from "../state.js";
import { foodCatalog } from "../data/foods.js";
import { landmarkDetails } from "../data/landmarks.js";
import { photoSpots } from "../data/photoSpots.js";
import { WEATHER_PROFILES } from "../data/weatherProfiles.js";
import { addUnique, findLandmark } from "../utils/helpers.js";
import { getCapturedPhoto, getPhotoRatingLabel, isPhotoSpotKnown } from "./photoMode.js";
import { closePanelOverlays, openFoodInfoPanel, openLandmarkInfoPanel } from "./modal.js";
import { setTrackedObjective } from "./navigation.js";

const JOURNAL_VIEWS = ["notes", "album"];
const ALBUM_COLUMNS = 2;
let currentView = "notes";
let selectedPhotoIndex = 0;
let openPhotoId = null;
let selectedJournalActionIndex = 0;

export function toggleJournal() {
  if (isJournalOpen()) {
    closeJournal();
    return;
  }

  closePanelOverlays("journal");
  openPhotoId = null;
  renderJournal();
  ui.journalPanel.classList.remove("hidden");
}

export function closeJournal() {
  ui.journalPanel.classList.add("hidden");
  openPhotoId = null;
}

export function isJournalOpen() {
  return !ui.journalPanel.classList.contains("hidden");
}

export function handleJournalKey(key) {
  if (!isJournalOpen()) {
    return false;
  }

  if (key === "j") {
    closeJournal();
    return true;
  }
  if (key === "escape") {
    if (openPhotoId) {
      openPhotoId = null;
      renderJournal();
    } else {
      closeJournal();
    }
    return true;
  }
  if (key === "tab") {
    const index = JOURNAL_VIEWS.indexOf(currentView);
    currentView = JOURNAL_VIEWS[(index + 1) % JOURNAL_VIEWS.length];
    openPhotoId = null;
    renderJournal();
    return true;
  }
  if (currentView !== "album") {
    const actions = [...ui.journalContent.querySelectorAll(".journal-nav-action")];
    if (["arrowup", "w"].includes(key)) selectedJournalActionIndex = Math.max(0, selectedJournalActionIndex - 1);
    if (["arrowdown", "s"].includes(key)) selectedJournalActionIndex = Math.min(Math.max(0, actions.length - 1), selectedJournalActionIndex + 1);
    if (key === "enter") actions[selectedJournalActionIndex]?.click();
    updateJournalActionSelection();
    return true;
  }
  if (openPhotoId) {
    const actions = [...ui.journalContent.querySelectorAll(".journal-nav-action")];
    if (["arrowup", "w"].includes(key)) selectedJournalActionIndex = Math.max(0, selectedJournalActionIndex - 1);
    else if (["arrowdown", "s"].includes(key)) selectedJournalActionIndex = Math.min(Math.max(0, actions.length - 1), selectedJournalActionIndex + 1);
    else if (key === "enter" || key === " ") actions[selectedJournalActionIndex]?.click();
    updateJournalActionSelection();
    return true;
  }

  if (["arrowleft", "a"].includes(key)) moveAlbumSelection(-1);
  if (["arrowright", "d"].includes(key)) moveAlbumSelection(1);
  if (["arrowup", "w"].includes(key)) moveAlbumSelection(-ALBUM_COLUMNS);
  if (["arrowdown", "s"].includes(key)) moveAlbumSelection(ALBUM_COLUMNS);
  if (key === "enter" || key === " ") {
    openPhotoId = photoSpots[selectedPhotoIndex]?.id || null;
    renderJournal();
  }
  return true;
}

export function renderJournal() {
  ui.journalContent.innerHTML = "";
  ui.journalContent.appendChild(createViewTabs());

  if (currentView === "album") {
    renderAlbum();
  } else {
    renderNotes();
  }
}

function createViewTabs() {
  const tabs = document.createElement("div");
  tabs.className = "journal-view-tabs";
  [
    ["notes", "Sổ tay khám phá"],
    ["album", "Album Hà Nội"]
  ].forEach(([view, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = currentView === view ? "is-selected" : "";
    button.addEventListener("click", () => {
      currentView = view;
      openPhotoId = null;
      renderJournal();
    });
    tabs.appendChild(button);
  });

  const hint = document.createElement("span");
  hint.textContent = "Tab: Đổi mục · W/S/A/D: Chọn · Enter: Mở · Esc: Quay lại";
  tabs.appendChild(hint);
  return tabs;
}

function renderNotes() {
  const foods = state.discoveredFoods.map((foodId) => foodCatalog[foodId]).filter(Boolean);
  const landmarks = state.discoveredLandmarks.map((landmarkId) => findLandmark(landmarkId)).filter(Boolean);
  const stats = document.createElement("div");
  stats.className = "journal-stats";
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

  foods.forEach((food) => grid.appendChild(createJournalCard({
    title: food.name,
    summary: food.description,
    buttonLabel: "Xem món ăn",
    onClick: () => openFoodInfoPanel(food, { fromJournal: true })
  })));
  landmarks.forEach((landmark) => {
    const detail = landmarkDetails[landmark.id];
    grid.appendChild(createJournalCard({
      title: landmark.name,
      summary: detail ? detail.intro : landmark.description,
      buttonLabel: "Xem địa danh",
      onClick: () => openLandmarkInfoPanel(landmark, { fromJournal: true }),
      navigationLabel: "Dẫn đường tới đây",
      onNavigate: () => setTrackedObjective({
        id: `journal-${landmark.id}`,
        type: "landmark",
        targetId: landmark.id,
        label: landmark.name,
        routeMode: "auto"
      })
    }));
  });
  ui.journalContent.appendChild(grid);
  updateJournalActionSelection();
}

function renderAlbum() {
  selectedPhotoIndex = clamp(selectedPhotoIndex, 0, Math.max(0, photoSpots.length - 1));
  if (openPhotoId) {
    renderPhotoDetail(openPhotoId);
    return;
  }

  const summary = document.createElement("p");
  summary.className = "album-summary";
  const capturedCount = Object.keys(state.photoAlbum?.photos || {}).length;
  summary.textContent = `Đã chụp ${capturedCount}/${photoSpots.length} góc check-in Hà Nội.`;
  ui.journalContent.appendChild(summary);

  const grid = document.createElement("div");
  grid.className = "photo-album-grid";
  photoSpots.forEach((spot, index) => {
    const photo = getCapturedPhoto(spot.id);
    const known = isPhotoSpotKnown(spot.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `photo-card ${photo ? "is-captured" : "is-locked"} ${index === selectedPhotoIndex ? "is-selected" : ""}`;
    card.dataset.photoSpotId = spot.id;
    card.setAttribute("aria-label", photo ? `Mở ảnh ${spot.title}` : "Ảnh chưa chụp");
    card.appendChild(createPhotoPreview(spot, photo));

    const copy = document.createElement("span");
    copy.className = "photo-card-copy";
    const title = document.createElement("strong");
    title.textContent = known ? spot.title : "Địa điểm chưa khám phá";
    const meta = document.createElement("small");
    meta.textContent = photo
      ? `${getPhotoRatingLabel(photo.rating)} · Ngày ${photo.gameDay}, ${photo.gameTime}${photo.eventId ? " · Sự kiện" : ""}`
      : known ? "Chưa chụp" : "Đang khóa";
    copy.append(title, meta);
    card.appendChild(copy);
    card.addEventListener("click", () => {
      selectedPhotoIndex = index;
      openPhotoId = spot.id;
      renderJournal();
    });
    grid.appendChild(card);
  });
  ui.journalContent.appendChild(grid);
  ui.journalContent.querySelector(".photo-card.is-selected")?.scrollIntoView?.({ block: "nearest" });
}

function renderPhotoDetail(spotId) {
  const spot = photoSpots.find((candidate) => candidate.id === spotId);
  if (!spot) {
    openPhotoId = null;
    renderAlbum();
    return;
  }
  const photo = getCapturedPhoto(spotId);
  const known = isPhotoSpotKnown(spotId);
  const detail = document.createElement("article");
  detail.className = "photo-detail";
  detail.appendChild(createPhotoPreview(spot, photo, true));

  const copy = document.createElement("div");
  const heading = document.createElement("h3");
  heading.textContent = known ? spot.title : "Địa điểm chưa khám phá";
  copy.appendChild(heading);
  if (photo) {
    [
      ["Đánh giá", getPhotoRatingLabel(photo.rating)],
      ["Thời gian", `Ngày ${photo.gameDay} · ${photo.gameTime}`],
      ["Thời tiết", WEATHER_PROFILES[photo.weather]?.label || photo.weather],
      ["Bạn đồng hành", photo.withMo ? "Chụp cùng Mơ" : "Ảnh cá nhân"],
      ...(photo.eventId ? [["Khoảnh khắc", photo.eventTags?.join(" · ") || "Sự kiện Hà Nội"]] : [])
    ].forEach(([label, value]) => {
      const row = document.createElement("p");
      row.innerHTML = `<strong>${label}:</strong> ${value}`;
      copy.appendChild(row);
    });
  } else {
    const locked = document.createElement("p");
    locked.textContent = known
      ? "Hãy tới đúng biểu tượng máy ảnh và nhấn P để lưu góc check-in này."
      : "Tới gần khu vực này để mở vị trí chụp ảnh.";
    copy.appendChild(locked);
  }
  const back = document.createElement("button");
  back.type = "button";
  back.className = "journal-nav-action";
  back.textContent = "Quay lại album";
  back.addEventListener("click", () => {
    openPhotoId = null;
    renderJournal();
  });
  if (!photo) {
    const navigate = document.createElement("button");
    navigate.type = "button";
    navigate.className = "journal-nav-action";
    navigate.textContent = "Tìm điểm chụp";
    navigate.addEventListener("click", () => setTrackedObjective({
      id: `album-${spot.id}`,
      type: "photoSpot",
      mapId: spot.mapId,
      targetId: spot.id,
      label: spot.title,
      routeMode: "auto"
    }));
    copy.appendChild(navigate);
  }
  copy.appendChild(back);
  detail.appendChild(copy);
  ui.journalContent.appendChild(detail);
  updateJournalActionSelection();
}

function createPhotoPreview(spot, photo, large = false) {
  const preview = document.createElement("span");
  preview.className = `photo-preview photo-preview-${spot.preview} ${large ? "is-large" : ""} ${photo ? "" : "is-silhouette"}`;
  preview.dataset.weather = photo?.weather || "unknown";
  preview.dataset.timeOfDay = getPhotoTimeOfDay(photo?.gameTime);
  const horizon = document.createElement("span");
  horizon.className = "photo-preview-horizon";
  const subject = document.createElement("span");
  subject.className = "photo-preview-subject";
  subject.textContent = photo ? spot.glyph : "?";
  preview.append(horizon, subject);
  if (photo?.withMo) {
    const mo = document.createElement("span");
    mo.className = "photo-with-mo";
    mo.textContent = "MƠ";
    preview.appendChild(mo);
  }
  if (photo) {
    const badge = document.createElement("span");
    badge.className = "photo-rating-badge";
    badge.textContent = getPhotoRatingLabel(photo.rating);
    preview.appendChild(badge);
  }
  return preview;
}

function moveAlbumSelection(delta) {
  selectedPhotoIndex = clamp(selectedPhotoIndex + delta, 0, photoSpots.length - 1);
  renderJournal();
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

export function createJournalCard({ title, summary, buttonLabel, onClick, navigationLabel = null, onNavigate = null }) {
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
  if (navigationLabel && onNavigate) {
    const navigate = document.createElement("button");
    navigate.type = "button";
    navigate.className = "journal-nav-action";
    navigate.textContent = navigationLabel;
    navigate.addEventListener("click", onNavigate);
    card.appendChild(navigate);
  }
  return card;
}

function updateJournalActionSelection() {
  const actions = [...ui.journalContent.querySelectorAll(".journal-nav-action")];
  selectedJournalActionIndex = Math.max(0, Math.min(selectedJournalActionIndex, Math.max(0, actions.length - 1)));
  actions.forEach((button, index) => button.classList.toggle("is-selected", index === selectedJournalActionIndex));
}

export function discoverFood(foodId) {
  return addUnique(state.discoveredFoods, foodId);
}

export function discoverLandmark(landmarkId) {
  return addUnique(state.discoveredLandmarks, landmarkId);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPhotoTimeOfDay(time) {
  const hour = Number.parseInt(String(time || "12:00").split(":")[0], 10);
  if (hour >= 18 || hour < 5) return "night";
  if (hour >= 15) return "afternoon";
  return "day";
}
