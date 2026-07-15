import assert from "node:assert/strict";

function classList(initial = ["hidden"]) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) { if (force === undefined ? !values.has(name) : force) values.add(name); else values.delete(name); }
  };
}

function element(classes = ["hidden"]) {
  const children = [];
  return {
    classList: classList(classes), style: {}, dataset: {}, textContent: "", innerHTML: "", disabled: false,
    offsetHeight: 48, value: "0.5", checked: true, type: "button", children,
    addEventListener() {}, appendChild(child) { children.push(child); return child; }, append(...items) { children.push(...items); },
    setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, scrollIntoView() {}, getContext() { return context; }
  };
}

const context = new Proxy({
  imageSmoothingEnabled: false, clearRect() {}, fillRect() {}, strokeRect() {}, save() {}, restore() {}, translate() {}, scale() {}, rotate() {},
  beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, stroke() {}, fill() {}, setLineDash() {}, fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }, drawImage() {},
  getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {}
}, { get(target, property) { return property in target ? target[property] : () => {}; } });

const canvas = { ...element([]), width: 1280, height: 720, getContext() { return context; }, getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; } };
const elements = new Map();
const layoutElements = new Map([[".game-card", element([])], [".game-frame", element([])], [".title-row", element([])]]);
globalThis.document = {
  hidden: false, body: element([]), addEventListener() {}, removeEventListener() {},
  getElementById(id) { if (id === "gameCanvas") return canvas; if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  querySelector(selector) { return layoutElements.get(selector) || null; },
  createElement() { return element([]); }, createElementNS() { return element([]); }
};
globalThis.window = {
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, location: { search: "", hostname: "localhost" },
  addEventListener() {}, removeEventListener() {}, clearTimeout, setTimeout, confirm() { return true; },
  requestAnimationFrame(callback) { globalThis.__nextFrame = callback; return 1; }, cancelAnimationFrame() {}
};
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) || null; }, setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); } };
globalThis.Image = class { addEventListener() {} set src(value) { this._src = value; } };

await import(`../src/main.js?navigation-smoke=${Date.now()}`);
const { player, runtime, state } = await import("../src/state.js");
const { normalizeState } = await import("../src/storage.js");
const { startBranchingQuest, chooseQuestOption } = await import("../src/systems/branchingQuest.js");
const {
  clearTrackedObjective,
  getCurrentRoute,
  getResolvedObjective,
  getTrackedObjective,
  setTrackedObjective,
  trackBranchingQuest,
  updateTrackedObjective
} = await import("../src/systems/navigation.js");
const { findRoute, isRouteSegmentNavigable, validateRouteGraphForDebug } = await import("../src/systems/routeGraph.js");

state.profile.gender = "male";
state.currentMapId = "hoanKiem";
player.x = 610;
player.y = 1370;
state.vehicle.status = "stored";
state.vehicle.equipped = false;
state.vehicle.owned = true;

assert.equal(setTrackedObjective({ id: "lake", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "walking" }, { silent: true }), true);
assert.equal(getResolvedObjective().stage, "reachFinalTarget");
assert.equal(getResolvedObjective().mapId, "hoanKiem");
assert(getCurrentRoute().length >= 2, "Landmark cùng map phải có route waypoint");

setTrackedObjective({ id: "bridge", type: "landmark", targetId: "cauLongBien", label: "Cầu Long Biên", routeMode: "auto" }, { silent: true });
assert.equal(getResolvedObjective().stage, "reachTransit");
assert.equal(getResolvedObjective().targetId, "roadToLongBien");
assert(getCurrentRoute().length >= 2, "Mục tiêu khác map phải có route tới transition hiện tại");

state.vehicle.status = "riding";
state.vehicle.equipped = true;
setTrackedObjective({ id: "lake-drive", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "auto" }, { silent: true });
assert.equal(getResolvedObjective().stage, "reachParking");
assert.equal(getResolvedObjective().targetId, "parkingHoGuom");
assert(getCurrentRoute().length >= 2, "Xe phải được dẫn tới bãi gửi trước khu đi bộ");
state.vehicle.status = "stored";
state.vehicle.equipped = false;
updateTrackedObjective({ force: true });
assert.equal(getResolvedObjective().stage, "reachFinalTarget");

clearTrackedObjective({ force: true, silent: true });
state.moCompanion.active = true;
state.moCompanion.currentMap = "hoanKiem";
updateTrackedObjective({ force: true });
assert.equal(getTrackedObjective().type, "returnPoint");
clearTrackedObjective({ silent: true });
assert.equal(getTrackedObjective().type, "returnPoint", "Không được hủy hoàn toàn mục tiêu trả Mơ");
state.moCompanion.active = false;
clearTrackedObjective({ force: true, silent: true });

startBranchingQuest("lostTourist");
chooseQuestOption("lostTourist", "escort");
assert.equal(trackBranchingQuest("lostTourist"), true);
assert.equal(getResolvedObjective().mapId, "hoanKiem");
assert.equal(getResolvedObjective().label, "Du khách bị lạc");
assert(getCurrentRoute().length >= 2);

setTrackedObjective({ id: "photo", type: "photoSpot", targetId: "photo-ho-guom", label: "Ảnh Hồ Gươm", routeMode: "walking" }, { silent: true });
state.photoAlbum.photos["photo-ho-guom"] = { photoSpotId: "photo-ho-guom" };
updateTrackedObjective({ force: true });
assert.equal(getTrackedObjective(), null, "Chụp thành công phải xóa marker ảnh");

const legacy = normalizeState({ currentMapId: "hoanKiem", player: { x: 610, y: 1370 } });
assert.deepEqual(legacy.navigation, { trackedObjective: null, showWorldGuidance: true });
const restored = normalizeState({
  currentMapId: "hoanKiem",
  player: { x: 610, y: 1370 },
  navigation: {
    showWorldGuidance: false,
    trackedObjective: { id: "saved-church", type: "church", targetId: "nhaThoLon", routeMode: "walking", label: "Nhà thờ Lớn" }
  }
});
assert.equal(restored.navigation.showWorldGuidance, false);
assert.equal(restored.navigation.trackedObjective.targetId, "nhaThoLon");
const graphStats = validateRouteGraphForDebug("hoanKiem");
assert(graphStats.walking.nodes > 100 && graphStats.walking.connectedNodes > 100, "Graph Hoàn Kiếm phải có mạng waypoint hữu dụng");
const routeCases = [
  ["baDinh", { x: 352, y: 1866 }, { x: 1145, y: 462 }],
  ["longBien", { x: 162, y: 906 }, { x: 1125, y: 610 }],
  ["churchInterior", { x: 700, y: 850 }, { x: 700, y: 720 }]
];
routeCases.forEach(([mapId, start, target]) => {
  const route = findRoute(mapId, start, target, "walking");
  assert(route.every((point, index) => index === 0 || isRouteSegmentNavigable(mapId, route[index - 1], point, "walking")), `Route ${mapId} không được cắt collision`);
});
assert(findRoute("longBien", routeCases[1][1], routeCases[1][2], "walking").length >= 2, "Long Biên phải có route tới cầu");
assert(findRoute("churchInterior", routeCases[2][1], routeCases[2][2], "walking").length >= 2, "Nhà thờ phải có route nội thất");

setTrackedObjective({ id: "cache", type: "landmark", targetId: "hoGuom", label: "Hồ Gươm", routeMode: "walking" }, { silent: true });
const routeRef = runtime.navigation.route;
updateTrackedObjective();
assert.equal(runtime.navigation.route, routeRef, "Không được tính lại route khi fingerprint không đổi");

runtime.eventCollisionBlocks = [{ id: "moving-train", mapId: "hoanKiem", x: 820, y: 1180, width: 140, height: 36 }];
updateTrackedObjective();
const blockedRouteKey = runtime.navigation.routeKey;
assert.notEqual(runtime.navigation.route, routeRef, "Event chặn đường phải buộc route tính lại");
runtime.eventCollisionBlocks[0].x += 144;
updateTrackedObjective();
assert.notEqual(runtime.navigation.routeKey, blockedRouteKey, "Event di chuyển phải làm mới khóa cache route");
runtime.eventCollisionBlocks = [];

process.stdout.write("Navigation tests: OK (landmark, transit, parking, Mơ, branching quest, photo, migration, event reroute, collision, cache)\n");
