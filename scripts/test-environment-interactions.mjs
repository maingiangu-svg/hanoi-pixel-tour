import assert from "node:assert/strict";

const runtimeConsoleIssues = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => runtimeConsoleIssues.push(["error", ...args]);
console.warn = (...args) => runtimeConsoleIssues.push(["warn", ...args]);

function classList(initial = ["hidden"]) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) { if (force === undefined ? !values.has(name) : force) values.add(name); else values.delete(name); }
  };
}

function element(classes) {
  const children = [];
  return {
    classList: classList(classes), style: {}, dataset: {}, textContent: "", innerHTML: "", disabled: false,
    offsetHeight: 48, value: "0.5", checked: true, type: "button", children,
    addEventListener() {}, appendChild(child) { children.push(child); }, append(...items) { children.push(...items); },
    setAttribute() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getContext() { return context; }
  };
}

const context = new Proxy({
  imageSmoothingEnabled: false, fillStyle: "", strokeStyle: "", lineWidth: 1, globalAlpha: 1,
  clearRect() {}, fillRect() {}, strokeRect() {}, save() {}, restore() {}, translate() {}, scale() {},
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, setLineDash() {}, fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }, drawImage() {},
  getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {}
}, { get(target, property) { return property in target ? target[property] : () => {}; } });

const canvas = {
  ...element([]), width: 1280, height: 720,
  getContext() { return context; },
  getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; }
};
const elements = new Map();
const layoutElements = new Map([[".game-card", element([])], [".game-frame", element([])], [".title-row", element([])]]);
globalThis.document = {
  hidden: false, body: element([]), addEventListener() {}, removeEventListener() {},
  getElementById(id) { if (id === "gameCanvas") return canvas; if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  querySelector(selector) { return layoutElements.get(selector) || null; },
  createElement(tag) { const node = element([]); if (tag === "canvas") { node.width = 1; node.height = 1; } return node; },
  createElementNS() { return element([]); }
};
globalThis.window = {
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, location: { search: "", hostname: "localhost" },
  addEventListener() {}, removeEventListener() {}, clearTimeout, setTimeout, confirm() { return true; },
  requestAnimationFrame(callback) { globalThis.__nextFrame = callback; return 1; }, cancelAnimationFrame() {}
};
globalThis.requestAnimationFrame = window.requestAnimationFrame;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
globalThis.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.get(key) || null; },
  setItem(key, value) { this.values.set(key, value); },
  removeItem(key) { this.values.delete(key); }
};
globalThis.Image = class { addEventListener() {} set src(value) { this._src = value; } };

await import(`../src/main.js?environment-smoke=${Date.now()}`);
const { player, runtime, state } = await import("../src/state.js");
const { getEnvironmentInteractionsForMap } = await import("../src/data/environmentInteractions.js");
const {
  canUseEnvironmentInteraction,
  endEnvironmentInteraction,
  getActiveEnvironmentInteraction,
  handleEnvironmentInteractionKey,
  startEnvironmentInteraction
} = await import("../src/systems/environmentInteraction.js");
const { closePhotoMode, isPhotoModeActive } = await import("../src/systems/photoMode.js");
const { endMoHangout, getMoCompanionNpc, updateMoCompanion } = await import("../src/systems/moCompanion.js");
const { getPlayerMoveSpeed, isRidingVehicle, isWalkingBike, toggleVehicle } = await import("../src/systems/vehicle.js");
const { startWalkingBike } = await import("../src/systems/parking.js");
const { movePlayer } = await import("../src/systems/movement.js");
const { normalizeState, saveGame } = await import("../src/storage.js");
const { updateWorldSchedules } = await import("../src/systems/worldSchedule.js");

elements.get("characterModal")?.classList.add("hidden");
state.profile.gender = "male";
state.currentMapId = "hoanKiem";
state.weather.type = "clear";
state.weather.intensity = 0;
state.gameTime.hour = 18;
state.gameTime.minute = 0;
state.gameTime.totalGameMinutes = 1080;
updateWorldSchedules({ force: true });

const hoanKiemInteractions = getEnvironmentInteractionsForMap("hoanKiem");
const freeBench = hoanKiemInteractions.find((entry) => entry.id === "bench-ho-guom-01");
const occupiedBench = hoanKiemInteractions.find((entry) => entry.id === "bench-ho-guom-02");
const lakeView = hoanKiemInteractions.find((entry) => entry.id === "view-ho-guom");
assert(freeBench && occupiedBench && lakeView, "Dữ liệu ghế và viewpoint phải tồn tại");
assert.equal(canUseEnvironmentInteraction(occupiedBench).allowed, false, "Ghế có cặp đôi phải được đánh dấu đang dùng");

player.x = freeBench.x - 12;
player.y = freeBench.y - 16;
const origin = { x: player.x, y: player.y };
assert.equal(startEnvironmentInteraction(freeBench), true, "Ghế trống phải ngồi được");
assert.equal(getActiveEnvironmentInteraction()?.pose, "sit");
const lockedX = player.x;
movePlayer();
assert.equal(player.x, lockedX, "Ngồi phải khóa movement");
endEnvironmentInteraction({ silent: true });
assert.deepEqual({ x: player.x, y: player.y }, origin, "Đứng dậy phải trả player về vị trí an toàn ban đầu");

state.moCompanion.active = true;
state.moCompanion.currentMap = "hoanKiem";
state.moCompanion.followingPlayer = true;
state.moCompanion.ridingWithPlayer = false;
player.x = freeBench.x - 12;
player.y = freeBench.y - 16;
assert.equal(startEnvironmentInteraction(freeBench), true);
updateMoCompanion();
assert.equal(getMoCompanionNpc().activity, "resting", "Mơ phải dùng pose ngồi cạnh player");
assert.equal(getMoCompanionNpc().visible, true);
endEnvironmentInteraction({ silent: true });
endMoHangout();

state.weather.type = "heavyRain";
state.weather.intensity = 1;
assert.equal(canUseEnvironmentInteraction(freeBench).allowed, false, "Ghế ngoài trời phải khóa khi mưa lớn");
state.weather.type = "clear";
state.weather.intensity = 0;

player.x = lakeView.x - 12;
player.y = lakeView.y - 16;
assert.equal(startEnvironmentInteraction(lakeView), true, "Viewpoint Hồ Gươm phải hoạt động");
handleEnvironmentInteractionKey("p");
assert.equal(isPhotoModeActive(), true, "P tại viewpoint phải mở photo mode hiện có");
closePhotoMode();
endEnvironmentInteraction({ silent: true });

state.currentMapId = "longBien";
const bridgeView = getEnvironmentInteractionsForMap("longBien").find((entry) => entry.id === "view-cau-long-bien");
state.randomEvents.active.longBienTrainPass = {
  eventId: "longBienTrainPass", mapId: "longBien", startedAt: 0, endsAt: 99999, state: "active", phase: "passing"
};
assert.equal(canUseEnvironmentInteraction(bridgeView).allowed, false, "Viewpoint gần ray phải khóa khi tàu chạy");
delete state.randomEvents.active.longBienTrainPass;

state.currentMapId = "hoanKiem";
player.x = 320;
player.y = 1320;
state.vehicle = { owned: true, type: "vinfast-electric", equipped: true, status: "riding", parkedAt: null };
assert.equal(startWalkingBike(), true, "Xe đang chạy phải chuyển được sang dắt xe");
assert.equal(isWalkingBike(), true);
assert.equal(getPlayerMoveSpeed(), player.speed * 0.86, "Dắt xe phải chậm hơn đi bộ");
runtime.vehicleToggleBlockedUntil = 0;
toggleVehicle();
assert.equal(isRidingVehicle(), true, "Ngoài vùng cấm, V phải lên xe lại");
startWalkingBike();
saveGame();
const normalized = normalizeState(JSON.parse(localStorage.getItem("hanoiPixelTourSaveV2")));
assert.equal(normalized.vehicle.status, "walking-bike", "Reload phải giữ trạng thái dắt xe");
assert.equal(normalized.vehicle.equipped, true);

assert.deepEqual(runtimeConsoleIssues, [], "Environment runtime không được ghi lỗi hoặc cảnh báo console");
console.error = originalConsoleError;
console.warn = originalConsoleWarn;
process.stdout.write("Environment interactions: OK (seat, occupancy, weather, viewpoint/photo, train lock, walking-bike, save)\n");
