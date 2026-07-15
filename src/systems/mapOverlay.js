import { player, state, ui } from "../state.js";
import { maps } from "../data/maps.js";
import { getMapOverlayData } from "../data/mapOverlay.js";
import { getCurrentMap } from "../utils/helpers.js";
import { getCurrentObjective } from "./questSystem.js";
import { closePanelOverlays, isOverlayOpen } from "./modal.js";
import { getWeatherLabel } from "./weather.js";
import { hasCapturedPhotoSpot, isPhotoSpotKnown } from "./photoMode.js";
import { getActiveEventsForMap } from "./randomEvents.js";
import {
  clearTrackedObjective,
  getCurrentRoute,
  getNavigationHudText,
  getResolvedObjective,
  getTrackedObjective,
  setNavigationRouteMode,
  setTrackedObjective,
  toggleWorldGuidance
} from "./navigation.js";
import {
  getChapter1AreaStatuses,
  getChapter1NavigationObjective,
  isChapter1Active,
  notifyChapter1MapOpened
} from "./chapter1.js";
import { getChapter2NavigationObjective, isChapter2Active } from "./chapter2.js";
import { getChapter3NavigationObjective, isChapter3Active } from "./chapter3.js";
import { getChapter4NavigationObjective, isChapter4Active } from "./chapter4.js";
import { isStoryTargetUnlocked } from "./storyState.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MAP_WIDTH = 680;
const MAP_HEIGHT = 420;
const MAP_PADDING = 24;
const ROUTE_MODES = ["auto", "walking", "vehicle"];
const ROUTE_MODE_LABELS = { auto: "Tự đề xuất", walking: "Đi bộ", vehicle: "Đi VinFast" };
let selectedTargetIndex = 0;

export function toggleMapOverlay() {
  if (isMapOverlayOpen()) {
    closeMapOverlay();
    return;
  }
  if (isOverlayOpen()) return;
  openMapOverlay();
}

export function openMapOverlay() {
  closePanelOverlays("map");
  selectedTargetIndex = 0;
  notifyChapter1MapOpened();
  renderMapOverlay();
  ui.mapPanel.classList.remove("hidden");
  ui.nearbyHint.classList.add("hidden");
}

export function closeMapOverlay() {
  ui.mapPanel.classList.add("hidden");
}

export function isMapOverlayOpen() {
  return ui.mapPanel && !ui.mapPanel.classList.contains("hidden");
}

export function handleMapOverlayKey(key) {
  if (!isMapOverlayOpen()) return false;
  if (["m", "escape"].includes(key)) {
    closeMapOverlay();
    return true;
  }
  const targets = getMapTargets(getCurrentMap(), getMapOverlayData(getCurrentMap()));
  if (["w", "arrowup"].includes(key)) {
    selectedTargetIndex = wrapIndex(selectedTargetIndex - 1, targets.length);
    renderMapOverlay();
  } else if (["s", "arrowdown"].includes(key)) {
    selectedTargetIndex = wrapIndex(selectedTargetIndex + 1, targets.length);
    renderMapOverlay();
  } else if (["a", "arrowleft"].includes(key)) {
    cycleRouteMode(-1);
  } else if (["d", "arrowright"].includes(key)) {
    cycleRouteMode(1);
  } else if (key === "enter") {
    activateMapTarget(targets[selectedTargetIndex]);
  }
  return true;
}

export function renderMapOverlay() {
  const map = getCurrentMap();
  const data = getMapOverlayData(map);
  const targets = getMapTargets(map, data);
  selectedTargetIndex = Math.max(0, Math.min(selectedTargetIndex, Math.max(0, targets.length - 1)));
  const titleElement = ui.mapTitle || document.getElementById("mapTitle");
  if (titleElement) titleElement.textContent = `Bản đồ: ${map.name}`;
  ui.mapContent.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "map-layout";
  const frame = document.createElement("div");
  frame.className = "map-frame";
  frame.appendChild(createMapSvg(map, data));

  const side = document.createElement("aside");
  side.className = "map-side";
  side.append(createMapStat("Khu vực", map.name));
  side.append(createMapStat("Thời tiết", getWeatherLabel()));
  if (state.story?.flags?.chapter1) side.append(createStoryAreaPanel());
  side.append(createNavigationPanel());
  side.append(createTargetList(targets));
  side.append(createLegend());
  layout.append(frame, side);
  ui.mapContent.appendChild(layout);
  ui.mapContent.querySelector(".map-target.is-selected")?.scrollIntoView?.({ block: "nearest" });
}

function createMapSvg(map, data) {
  const svg = createSvg("svg", { class: "map-svg", viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`, role: "img", "aria-label": `Bản đồ ${map.name}` });
  const transform = createMapTransform(data.bounds);
  svg.appendChild(createSvg("rect", { x: 0, y: 0, width: MAP_WIDTH, height: MAP_HEIGHT, class: "map-paper" }));
  data.walkZones.forEach((zone) => svg.appendChild(createMapRect(zone, transform, `map-zone map-zone-${zone.kind}`)));
  data.water.forEach((water) => {
    svg.appendChild(createMapRect(water, transform, "map-water"));
    addMapLabel(svg, water.label, water.x + water.width / 2, water.y + water.height / 2, transform, "map-label map-label-water");
  });
  drawNavigationRoute(svg, transform, map.id);
  data.exits.forEach((exit) => {
    const unlocked = isStoryTargetUnlocked({ ...exit, targetId: exit.id });
    addMarker(svg, exit.x, exit.y, transform, `map-marker map-marker-exit ${unlocked ? "" : "is-locked"}`, unlocked ? "◆" : "×", unlocked ? exit.name : "Chưa khám phá");
  });
  data.shops.forEach((shop) => addMarker(svg, shop.x, shop.y, transform, "map-marker map-marker-shop", "■", shop.name));
  data.vehicleShops.forEach((shop) => addMarker(svg, shop.x, shop.y, transform, "map-marker map-marker-vehicle", "▣", "VinFast"));
  data.parkingSpots.forEach((spot) => addMarker(svg, spot.x, spot.y, transform, "map-marker map-marker-parking", "P", spot.name));
  if (state.moCompanion?.active && data.companionReturnPoint) {
    const point = data.companionReturnPoint;
    addMarker(svg, point.x, point.y, transform, "map-marker map-marker-companion-return", "M", point.name);
  }
  data.photoSpots.filter((spot) => isPhotoSpotKnown(spot.id)).forEach((spot) => {
    const captured = hasCapturedPhotoSpot(spot.id);
    addMarker(svg, spot.x, spot.y, transform, `map-marker map-marker-photo ${captured ? "is-captured" : "is-known"}`, captured ? "✓" : "▣", captured ? spot.name : "Điểm chụp ảnh");
  });
  data.landmarks.forEach((landmark) => {
    const unlocked = isStoryTargetUnlocked({ type: "landmark", mapId: map.id, targetId: landmark.id });
    const discovered = isLandmarkCheckedIn(landmark);
    const seen = state.discoveredLandmarks.includes(landmark.id);
    addMarker(
      svg,
      landmark.x,
      landmark.y,
      transform,
      `map-marker map-marker-landmark ${unlocked ? (discovered ? "is-discovered" : seen ? "is-seen" : "is-new") : "is-locked"}`,
      unlocked ? (discovered ? "★" : "◇") : "×",
      unlocked ? landmark.name : "Chưa khám phá"
    );
  });
  const resolved = getResolvedObjective();
  if (resolved && !resolved.unavailable && resolved.mapId === map.id) {
    addMarker(svg, resolved.x, resolved.y, transform, "map-marker map-marker-objective", "!", resolved.stageLabel || resolved.label);
  }
  addMarker(svg, player.x + player.width / 2, player.y + player.height / 2, transform, "map-marker map-marker-player", "●", "Bạn");
  return svg;
}

function drawNavigationRoute(svg, transform, mapId) {
  const route = getCurrentRoute();
  if (route.length < 2 || getResolvedObjective()?.mapId !== mapId) return;
  const points = route.map((point) => `${transform.x(point.x)},${transform.y(point.y)}`).join(" ");
  svg.appendChild(createSvg("polyline", { points, class: "map-navigation-route" }));
}

function createNavigationPanel() {
  const tracked = getTrackedObjective();
  const block = document.createElement("section");
  block.className = "map-navigation";
  const title = document.createElement("h3");
  title.textContent = "Dẫn đường";
  const objective = document.createElement("p");
  objective.textContent = tracked ? getNavigationHudText() : getDisplayedObjective();
  const mode = document.createElement("p");
  mode.className = "map-navigation-mode";
  mode.textContent = `Phương thức: ${ROUTE_MODE_LABELS[tracked?.routeMode || "auto"]}`;
  const actions = document.createElement("div");
  actions.className = "map-navigation-actions";
  const guidance = document.createElement("button");
  guidance.type = "button";
  guidance.textContent = state.navigation.showWorldGuidance ? "Ẩn dấu ngoài bản đồ" : "Hiện dấu ngoài bản đồ";
  guidance.addEventListener("click", () => { toggleWorldGuidance(); renderMapOverlay(); });
  actions.appendChild(guidance);
  if (tracked) {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.textContent = state.moCompanion?.active ? "Theo dõi Nhà thờ" : "Hủy dẫn đường";
    clear.addEventListener("click", () => { clearTrackedObjective(); renderMapOverlay(); });
    actions.appendChild(clear);
  }
  block.append(title, objective, mode, actions);
  return block;
}

function createTargetList(targets) {
  const block = document.createElement("section");
  block.className = "map-targets";
  const title = document.createElement("h3");
  title.textContent = "Điểm đến";
  block.appendChild(title);
  targets.forEach((target, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `map-target ${index === selectedTargetIndex ? "is-selected" : ""} ${target.locked ? "is-locked" : ""}`;
    button.textContent = target.label;
    button.disabled = Boolean(target.locked);
    button.addEventListener("click", () => {
      selectedTargetIndex = index;
      activateMapTarget(target);
    });
    block.appendChild(button);
  });
  return block;
}

function getMapTargets(map, data) {
  const targets = [];
  const chapterObjective = isChapter1Active()
    ? getChapter1NavigationObjective()
    : isChapter2Active()
      ? getChapter2NavigationObjective()
      : isChapter3Active()
        ? getChapter3NavigationObjective()
        : isChapter4Active() ? getChapter4NavigationObjective() : null;
  if (chapterObjective) targets.push(chapterObjective);
  if (state.moCompanion?.active && data.companionReturnPoint) {
    targets.push({ id: "map-return-mo", type: "returnPoint", mapId: map.id, targetId: data.companionReturnPoint.id, label: "Đưa Mơ về Nhà thờ", description: "Thời gian tiếp tục khi Mơ về Nhà thờ." });
  }
  data.landmarks.forEach((item) => {
    const target = { id: `map-landmark-${item.id}`, type: "landmark", mapId: map.id, targetId: item.id, label: item.name };
    target.locked = !isStoryTargetUnlocked(target);
    if (target.locked) target.label = `${item.name} · Chưa khám phá`;
    targets.push(target);
  });
  data.parkingSpots.forEach((item) => targets.push({ id: `map-parking-${item.id}`, type: "parking", mapId: map.id, targetId: item.id, label: item.name }));
  data.exits.forEach((item) => {
    const target = { id: `map-exit-${item.id}`, type: item.kind === "bus" ? "busStop" : "exit", mapId: map.id, targetMap: item.targetMap, targetId: item.id, label: `${item.name} → ${maps[item.targetMap]?.name || item.targetMap}` };
    target.locked = !isStoryTargetUnlocked(target);
    if (target.locked) target.label = `${maps[item.targetMap]?.name || item.name} · Chưa khám phá`;
    targets.push(target);
  });
  data.shops.forEach((item) => targets.push({ id: `map-shop-${item.id}`, type: "shop", mapId: map.id, targetId: item.id, label: item.name }));
  data.vehicleShops.forEach((item) => targets.push({ id: `map-vehicle-${item.id}`, type: "vehicleShop", mapId: map.id, targetId: item.id, label: item.name }));
  data.photoSpots.filter((spot) => isPhotoSpotKnown(spot.id) && !hasCapturedPhotoSpot(spot.id)).forEach((spot) => targets.push({ id: `map-photo-${spot.id}`, type: "photoSpot", mapId: map.id, targetId: spot.id, label: `Ảnh: ${spot.name}` }));
  getActiveEventsForMap(map.id).filter(({ definition }) => definition.marker !== false).slice(0, 2).forEach(({ definition }) => targets.push({ id: `map-event-${definition.id}`, type: "event", mapId: map.id, targetId: definition.id, label: `Sự kiện: ${definition.name}`, isTemporary: true }));
  return targets;
}

function activateMapTarget(target) {
  if (!target) return;
  if (target.locked || !isStoryTargetUnlocked(target)) return;
  const routeMode = getTrackedObjective()?.routeMode || "auto";
  setTrackedObjective({ ...target, routeMode });
  renderMapOverlay();
}

function createStoryAreaPanel() {
  const block = document.createElement("section");
  block.className = "map-story-areas";
  const title = document.createElement("h3");
  title.textContent = "Khu vực cốt truyện";
  block.appendChild(title);
  getChapter1AreaStatuses().forEach((area) => {
    const row = document.createElement("p");
    row.className = area.unlocked ? "is-unlocked" : "is-locked";
    const label = document.createElement("span");
    label.textContent = area.label;
    const status = document.createElement("strong");
    status.textContent = area.unlocked ? "Đã mở" : "Chưa khám phá";
    row.append(label, status);
    block.appendChild(row);
  });
  return block;
}

function cycleRouteMode(delta) {
  const tracked = getTrackedObjective();
  if (!tracked) return;
  const current = ROUTE_MODES.indexOf(tracked.routeMode || "auto");
  setNavigationRouteMode(ROUTE_MODES[wrapIndex(current + delta, ROUTE_MODES.length)]);
  renderMapOverlay();
}

function createMapTransform(bounds) {
  const scale = Math.min((MAP_WIDTH - MAP_PADDING * 2) / bounds.width, (MAP_HEIGHT - MAP_PADDING * 2) / bounds.height);
  const mapW = bounds.width * scale;
  const mapH = bounds.height * scale;
  return {
    scale,
    offsetX: Math.round((MAP_WIDTH - mapW) / 2),
    offsetY: Math.round((MAP_HEIGHT - mapH) / 2),
    x(value) { return this.offsetX + value * this.scale; },
    y(value) { return this.offsetY + value * this.scale; },
    size(value) { return Math.max(2, value * this.scale); }
  };
}

function createMapRect(rect, transform, className) {
  return createSvg("rect", { x: transform.x(rect.x), y: transform.y(rect.y), width: transform.size(rect.width), height: transform.size(rect.height), class: className });
}

function addMarker(svg, x, y, transform, className, icon, label) {
  const sx = transform.x(x);
  const sy = transform.y(y);
  const group = createSvg("g", { class: className });
  group.appendChild(createSvg("rect", { x: sx - 7, y: sy - 7, width: 14, height: 14 }));
  const text = createSvg("text", { x: sx, y: sy + 4, "text-anchor": "middle" });
  text.textContent = icon;
  group.appendChild(text);
  svg.appendChild(group);
  addMapLabel(svg, label, x, y, transform, "map-label");
}

function addMapLabel(svg, label, x, y, transform, className) {
  if (!label) return;
  const text = createSvg("text", { x: transform.x(x) + 10, y: transform.y(y) - 9, class: className });
  text.textContent = shortenLabel(label);
  svg.appendChild(text);
}

function createMapStat(label, value) {
  const block = document.createElement("section");
  block.className = "map-stat";
  const title = document.createElement("h3");
  title.textContent = label;
  const body = document.createElement("p");
  body.textContent = value;
  block.append(title, body);
  return block;
}

function createLegend() {
  const legend = document.createElement("section");
  legend.className = "map-legend";
  const title = document.createElement("h3");
  title.textContent = "Chú giải";
  legend.appendChild(title);
  [["map-key-player", "Bạn"], ["map-key-objective", "Mục tiêu"], ["map-key-landmark", "Địa danh"], ["map-key-bus", "Trạm/chuyển khu"], ["map-key-parking", "Bãi gửi xe"], ["map-key-photo", "Điểm chụp ảnh"]].forEach(([className, text]) => {
    const item = document.createElement("p");
    const swatch = document.createElement("span");
    swatch.className = `map-key ${className}`;
    item.append(swatch, document.createTextNode(text));
    legend.appendChild(item);
  });
  return legend;
}

function getDisplayedObjective() {
  return state.moCompanion?.active ? "Đưa Mơ về Nhà thờ Lớn để thời gian tiếp tục" : getCurrentObjective();
}

function isLandmarkCheckedIn(landmark) {
  return Boolean(landmark.stamp && state.inventory.stamps.includes(landmark.stamp));
}

function shortenLabel(label) {
  return label.length > 24 ? `${label.slice(0, 22)}…` : label;
}

function wrapIndex(value, length) {
  if (!length) return 0;
  return (value + length) % length;
}

function createSvg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}
