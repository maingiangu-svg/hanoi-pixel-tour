import assert from "node:assert/strict";

function createClassList(initial = ["hidden"]) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) {
      if (force === true) values.add(name);
      else if (force === false) values.delete(name);
      else if (values.has(name)) values.delete(name);
      else values.add(name);
    }
  };
}

function element(initialClasses) {
  return {
    classList: createClassList(initialClasses),
    style: {},
    dataset: {},
    textContent: "",
    innerHTML: "",
    disabled: false,
    addEventListener() {},
    appendChild() {},
    append() {},
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    scrollIntoView() {}
  };
}

const context = {
  imageSmoothingEnabled: false,
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  globalAlpha: 1,
  textAlign: "left",
  textBaseline: "alphabetic",
  font: "",
  fillRect() {},
  strokeRect() {},
  clearRect() {},
  save() {},
  restore() {},
  translate() {},
  scale() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  setLineDash() {},
  fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }
};
const canvas = {
  ...element([]),
  width: 1280,
  height: 720,
  getContext() { return context; },
  getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; }
};
const elements = new Map();

globalThis.document = {
  hidden: false,
  addEventListener() {},
  removeEventListener() {},
  getElementById(id) {
    if (id === "gameCanvas") return canvas;
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  },
  createElement() { return element([]); },
  createElementNS() { return element([]); }
};
globalThis.window = {
  confirm() { return true; },
  addEventListener() {},
  removeEventListener() {},
  clearTimeout,
  setTimeout,
  devicePixelRatio: 1,
  location: { search: "", hostname: "localhost" }
};
globalThis.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.get(key) || null; },
  setItem(key, value) { this.values.set(key, value); },
  removeItem(key) { this.values.delete(key); }
};

const { photoSpots } = await import("../src/data/photoSpots.js");
const { player, runtime, state, ui } = await import("../src/state.js");
const { snapCameraToPlayer } = await import("../src/camera.js");
const { maps } = await import("../src/data/maps.js");
const { getMapOverlayData } = await import("../src/data/mapOverlay.js");
const { isPlayerAreaWalkable } = await import("../src/utils/collision.js");
const { normalizeState } = await import("../src/storage.js");
const { drawPhotoModeOverlay, drawPhotoSpots } = await import("../src/render/renderPhotoMode.js");
const {
  captureCurrentPhoto,
  closePhotoMode,
  evaluatePhotoComposition,
  getPhotoRating,
  hasCapturedPhotoSpot,
  isPhotoModeActive,
  openPhotoMode,
  updatePhotoSpotDiscovery
} = await import("../src/systems/photoMode.js");

for (const spot of photoSpots) {
  state.currentMapId = spot.mapId;
  player.x = spot.x - player.width / 2;
  player.y = spot.y - player.height / 2;
  assert.equal(isPlayerAreaWalkable(player.x, player.y), true, `${spot.id} phải đứng tới được`);
  player.facing = spot.requiredFacing;
  snapCameraToPlayer();
  const result = evaluatePhotoComposition(spot);
  assert.equal(result.valid, true, `${spot.id} phải có target nằm trong khung`);
  assert.equal(result.rating, 3, `${spot.id} phải đạt Hoàn hảo tại tâm`);
  drawPhotoSpots(maps[spot.mapId]);
}

for (const mapId of ["hoanKiem", "baDinh", "longBien", "churchInterior"]) {
  assert.equal(
    getMapOverlayData(maps[mapId]).photoSpots.length,
    photoSpots.filter((spot) => spot.mapId === mapId).length,
    `${mapId} phải đưa đủ photo spot vào bản đồ M`
  );
}

const firstSpot = photoSpots[0];
state.currentMapId = firstSpot.mapId;
player.x = firstSpot.x - player.width / 2;
player.y = firstSpot.y - player.height / 2;
player.facing = firstSpot.requiredFacing === "right" ? "left" : "right";
snapCameraToPlayer();
assert.equal(evaluatePhotoComposition(firstSpot).valid, false);
player.facing = firstSpot.requiredFacing;

state.vehicle.owned = true;
state.vehicle.equipped = true;
state.vehicle.status = "riding";
assert.equal(openPhotoMode(), false, "Không mở photo mode khi đang lái xe");
state.vehicle.equipped = false;
state.vehicle.status = "stored";

state.gameTime.pauseReasons = [];
state.gameTime.paused = false;
state.gameTime.totalGameMinutes = 20 * 60 + 15;
state.gameTime.day = 2;
state.weather.type = "rain";
state.moCompanion.active = true;
state.moCompanion.currentMap = firstSpot.mapId;
player.y = firstSpot.y + 45 - player.height / 2;
snapCameraToPlayer();
assert.equal(evaluatePhotoComposition(firstSpot).rating, 1);
assert.equal(openPhotoMode(), true);
assert.equal(isPhotoModeActive(), true);
assert(state.gameTime.pauseReasons.includes("photo-mode"));
assert.equal(captureCurrentPhoto(), true);
assert.equal(isPhotoModeActive(), false);
assert.equal(hasCapturedPhotoSpot(firstSpot.id), true);
assert.equal(getPhotoRating(firstSpot.id), 1);

player.x = firstSpot.x - player.width / 2;
player.y = firstSpot.y - player.height / 2;
player.facing = firstSpot.requiredFacing;
snapCameraToPlayer();
assert.equal(openPhotoMode(), true);
assert.equal(captureCurrentPhoto(), true);
assert.equal(getPhotoRating(firstSpot.id), 3);
assert.equal(state.photoAlbum.photos[firstSpot.id].weather, "rain");
assert.equal(state.photoAlbum.photos[firstSpot.id].gameTime, "20:15");
assert.equal(state.photoAlbum.photos[firstSpot.id].withMo, true);
assert(!JSON.stringify(state.photoAlbum).includes("data:image"));
assert(JSON.stringify(state.photoAlbum).length < 12000, "Album metadata phải gọn");

player.y = firstSpot.y + 45 - player.height / 2;
snapCameraToPlayer();
assert.equal(openPhotoMode(), true);
assert.equal(captureCurrentPhoto(), true);
assert.equal(getPhotoRating(firstSpot.id), 3, "Ảnh kém hơn chưa được tự thay");
assert.equal(ui.choiceModal.classList.contains("hidden"), false, "Ảnh kém hơn phải hỏi lựa chọn");
ui.choiceModal.classList.add("hidden");

updatePhotoSpotDiscovery(1000);
assert(state.photoAlbum.discoveredSpots.includes(firstSpot.id));

const restored = normalizeState({
  money: 88000,
  photoAlbum: state.photoAlbum,
  gameTime: { totalGameMinutes: 1215 },
  moCompanion: { active: false }
});
assert.equal(restored.money, 88000);
assert.equal(restored.photoAlbum.photos[firstSpot.id].rating, 3);
assert.equal(restored.photoAlbum.photos[firstSpot.id].weather, "rain");

const oldSave = normalizeState({ money: 77000, gameTime: { totalGameMinutes: 420 } });
assert.deepEqual(oldSave.photoAlbum, { photos: {}, discoveredSpots: [] });

closePhotoMode();
runtime.photoFlashUntil = 0;
drawPhotoModeOverlay();
clearTimeout(runtime.messageTimer);
process.stdout.write(`Photo mode tests: OK (${photoSpots.length} spots)\n`);
