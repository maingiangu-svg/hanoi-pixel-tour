import assert from "node:assert/strict";

const runtimeConsoleIssues = [];
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
console.error = (...args) => runtimeConsoleIssues.push(["error", ...args]);
console.warn = (...args) => runtimeConsoleIssues.push(["warn", ...args]);

function classList(initial = ["hidden"]) {
  const values = new Set(initial);
  return { add(...names) { names.forEach((name) => values.add(name)); }, remove(...names) { names.forEach((name) => values.delete(name)); }, contains(name) { return values.has(name); }, toggle(name, force) { if (force) values.add(name); else values.delete(name); } };
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
  measureText(text) { return { width: String(text).length * 7 }; }, drawImage() {}, getImageData() { return { data: new Uint8ClampedArray(4) }; }, putImageData() {}
}, { get(target, property) { return property in target ? target[property] : () => {}; } });
const canvas = { ...element([]), width: 1280, height: 720, getContext() { return context; }, getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; } };
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
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) || null; }, setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); } };
globalThis.Image = class { addEventListener() {} set src(value) { this._src = value; } };

await import(`../src/main.js?smoke=${Date.now()}`);
assert.equal(typeof globalThis.__nextFrame, "function", "Main loop phải được lên lịch");
let timestamp = performance.now();
for (let frame = 0; frame < 180; frame += 1) {
  const callback = globalThis.__nextFrame;
  callback(timestamp += 16.67);
}
assert.equal(typeof globalThis.__nextFrame, "function", "Main loop phải tiếp tục sau frame đầu");
const { keys, player, runtime, state } = await import("../src/state.js");
assert(state.branchingQuestProgress && typeof state.branchingQuestProgress === "object");
assert(state.randomEvents && typeof state.randomEvents.active === "object");

const { movePlayer } = await import("../src/systems/movement.js");
const {
  isRidingVehicle,
  isVehicleTransitionActive,
  toggleVehicle,
  updateVehicleTransition
} = await import("../src/systems/vehicle.js");
elements.get("characterModal")?.classList.add("hidden");
state.profile.gender = "female";
state.vehicle = { owned: true, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null };
runtime.vehicleToggleBlockedUntil = 0;
toggleVehicle();
assert.equal(isVehicleTransitionActive(), true, "Nữ phải phát transition trước khi lên xe");
assert.equal(isRidingVehicle(), false, "Không được đổi sang riding trước frame cuối");
const transition = runtime.vehicleTransition;
toggleVehicle();
assert.equal(runtime.vehicleTransition, transition, "V lặp không được tạo transition thứ hai");
const lockedX = player.x;
keys.arrowright = true;
movePlayer();
keys.arrowright = false;
assert.equal(player.x, lockedX, "Movement phải khóa trong transition");
runtime.vehicleTransition.startedAt -= runtime.vehicleTransition.durationMs + 1;
updateVehicleTransition(performance.now());
assert.equal(isRidingVehicle(), true, "Kết thúc mount mới chuyển sang riding");
runtime.vehicleToggleBlockedUntil = 0;
toggleVehicle();
assert.equal(runtime.vehicleTransition?.type, "dismounting");
assert.equal(isRidingVehicle(), true, "Dismount giữ riding tới frame cuối");
runtime.vehicleTransition.startedAt -= runtime.vehicleTransition.durationMs + 1;
updateVehicleTransition(performance.now());
assert.equal(isRidingVehicle(), false, "Dismount hoàn tất mới cất xe");
runtime.vehicleToggleBlockedUntil = 0;
toggleVehicle();
runtime.vehicleTransition.startedAt -= runtime.vehicleTransition.durationMs + 1;
updateVehicleTransition(performance.now());
const { travelToMap } = await import("../src/systems/interaction.js");
const { isMapTransitionActive } = await import("../src/systems/mapTransition.js");
travelToMap({ targetMap: "longBien", targetX: 150, targetY: 890, kind: "walk", message: "Kiểm tra chuyển map" });
assert.equal(state.currentMapId, "longBien", "Chuyển map phải giữ luồng cũ");
assert.equal(isRidingVehicle(), false, "Chuyển map phải cất xe tức thời");
assert.equal(isMapTransitionActive(), true, "Fade chuyển map phải được kích hoạt");
assert.deepEqual(runtimeConsoleIssues, [], "Runtime không được ghi lỗi hoặc cảnh báo console");
console.error = originalConsoleError;
console.warn = originalConsoleWarn;
process.stdout.write("Runtime bootstrap smoke: OK (180 frames + female vehicle transitions)\n");
