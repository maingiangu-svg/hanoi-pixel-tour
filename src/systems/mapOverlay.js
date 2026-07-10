import { player, state, ui } from "../state.js";
import { maps } from "../data/maps.js";
import { getMapOverlayData } from "../data/mapOverlay.js";
import { getCurrentMap } from "../utils/helpers.js";
import { getCurrentObjective } from "./questSystem.js";
import { closePanelOverlays, isOverlayOpen } from "./modal.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const MAP_WIDTH = 680;
const MAP_HEIGHT = 420;
const MAP_PADDING = 24;

export function toggleMapOverlay() {
  if (isMapOverlayOpen()) {
    closeMapOverlay();
    return;
  }

  if (isOverlayOpen()) {
    return;
  }

  openMapOverlay();
}

export function openMapOverlay() {
  closePanelOverlays("map");
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

export function renderMapOverlay() {
  const map = getCurrentMap();
  const data = getMapOverlayData(map);
  const titleElement = ui.mapTitle || document.getElementById("mapTitle");
  if (titleElement) {
    titleElement.textContent = `Bản đồ: ${map.name}`;
  }
  ui.mapContent.innerHTML = "";

  const layout = document.createElement("div");
  layout.className = "map-layout";

  const frame = document.createElement("div");
  frame.className = "map-frame";
  frame.appendChild(createMapSvg(map, data));

  const side = document.createElement("aside");
  side.className = "map-side";
  side.append(createMapStat("Khu vực", map.name));
  side.append(createMapStat("Vị trí", "Chấm đỏ là bạn"));
  side.append(createMapStat("Mục tiêu", getCurrentObjective()));
  side.append(createLegend());
  side.append(createRouteList(data));

  layout.append(frame, side);
  ui.mapContent.appendChild(layout);
}

function createMapSvg(map, data) {
  const svg = createSvg("svg", {
    class: "map-svg",
    viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,
    role: "img",
    "aria-label": `Bản đồ ${map.name}`
  });

  const transform = createMapTransform(data.bounds);
  svg.appendChild(createSvg("rect", {
    x: 0,
    y: 0,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    class: "map-paper"
  }));

  data.walkZones.forEach((zone) => {
    svg.appendChild(createMapRect(zone, transform, `map-zone map-zone-${zone.kind}`));
  });

  data.water.forEach((water) => {
    const rect = createMapRect(water, transform, "map-water");
    svg.appendChild(rect);
    addMapLabel(svg, water.label, water.x + water.width / 2, water.y + water.height / 2, transform, "map-label map-label-water");
  });

  data.exits.forEach((exit) => {
    addMarker(svg, exit.x, exit.y, transform, "map-marker map-marker-exit", "◆", exit.name);
  });

  data.shops.forEach((shop) => {
    addMarker(svg, shop.x, shop.y, transform, "map-marker map-marker-shop", "■", shop.name);
  });

  data.vehicleShops.forEach((shop) => {
    addMarker(svg, shop.x, shop.y, transform, "map-marker map-marker-vehicle", "▣", "VinFast");
  });

  data.landmarks.forEach((landmark) => {
    const discovered = isLandmarkCheckedIn(landmark);
    const seen = state.discoveredLandmarks.includes(landmark.id);
    addMarker(
      svg,
      landmark.x,
      landmark.y,
      transform,
      `map-marker map-marker-landmark ${discovered ? "is-discovered" : seen ? "is-seen" : "is-new"}`,
      discovered ? "★" : "◇",
      landmark.name
    );
  });

  const playerX = player.x + player.width / 2;
  const playerY = player.y + player.height / 2;
  addMarker(svg, playerX, playerY, transform, "map-marker map-marker-player", "●", "Bạn");

  return svg;
}

function createMapTransform(bounds) {
  const scale = Math.min(
    (MAP_WIDTH - MAP_PADDING * 2) / bounds.width,
    (MAP_HEIGHT - MAP_PADDING * 2) / bounds.height
  );
  const mapW = bounds.width * scale;
  const mapH = bounds.height * scale;
  return {
    scale,
    offsetX: Math.round((MAP_WIDTH - mapW) / 2),
    offsetY: Math.round((MAP_HEIGHT - mapH) / 2),
    x(value) {
      return this.offsetX + value * this.scale;
    },
    y(value) {
      return this.offsetY + value * this.scale;
    },
    size(value) {
      return Math.max(2, value * this.scale);
    }
  };
}

function createMapRect(rect, transform, className) {
  return createSvg("rect", {
    x: transform.x(rect.x),
    y: transform.y(rect.y),
    width: transform.size(rect.width),
    height: transform.size(rect.height),
    class: className
  });
}

function addMarker(svg, x, y, transform, className, icon, label) {
  const sx = transform.x(x);
  const sy = transform.y(y);
  const group = createSvg("g", { class: className });
  group.appendChild(createSvg("rect", {
    x: sx - 7,
    y: sy - 7,
    width: 14,
    height: 14
  }));
  const text = createSvg("text", {
    x: sx,
    y: sy + 4,
    "text-anchor": "middle"
  });
  text.textContent = icon;
  group.appendChild(text);
  svg.appendChild(group);
  addMapLabel(svg, label, x, y, transform, "map-label");
}

function addMapLabel(svg, label, x, y, transform, className) {
  if (!label) {
    return;
  }

  const sx = transform.x(x);
  const sy = transform.y(y);
  const text = createSvg("text", {
    x: sx + 10,
    y: sy - 9,
    class: className
  });
  text.textContent = shortenLabel(label);
  svg.appendChild(text);
}

function shortenLabel(label) {
  return label.length > 24 ? `${label.slice(0, 22)}…` : label;
}

function isLandmarkCheckedIn(landmark) {
  return Boolean(landmark.stamp && state.inventory.stamps.includes(landmark.stamp));
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

  [
    ["map-key-player", "Bạn"],
    ["map-key-landmark", "Địa danh"],
    ["map-key-seen", "Đã biết"],
    ["map-key-food", "Ẩm thực"],
    ["map-key-bus", "Chuyển khu"]
  ].forEach(([className, text]) => {
    const item = document.createElement("p");
    const swatch = document.createElement("span");
    swatch.className = `map-key ${className}`;
    item.append(swatch, document.createTextNode(text));
    legend.appendChild(item);
  });

  return legend;
}

function createRouteList(data) {
  const block = document.createElement("section");
  block.className = "map-routes";
  const title = document.createElement("h3");
  title.textContent = "Lối đi";
  block.appendChild(title);

  data.exits.forEach((exit) => {
    const target = maps[exit.targetMap]?.name || exit.targetMap;
    const row = document.createElement("p");
    row.textContent = `${exit.name}: ${target}`;
    block.appendChild(row);
  });

  return block;
}

function createSvg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}
