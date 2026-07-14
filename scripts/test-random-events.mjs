import assert from "node:assert/strict";

function classList(initial = ["hidden"]) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) { if (force) values.add(name); else values.delete(name); }
  };
}

function element(initial) {
  const children = [];
  const listeners = new Map();
  const node = {
    classList: classList(initial), style: {}, dataset: {}, textContent: "", disabled: false,
    type: "", children, checked: true, value: "0.5",
    addEventListener(type, handler) { listeners.set(type, handler); },
    click() { listeners.get("click")?.({ stopPropagation() {} }); },
    appendChild(child) { children.push(child); }, append(...items) { children.push(...items); },
    setAttribute() {}, querySelector() { return null; },
    querySelectorAll(selector) { return selector === "button" ? children.filter((child) => child.type === "button") : []; },
    scrollIntoView() {}
  };
  Object.defineProperty(node, "innerHTML", { get() { return ""; }, set() { children.length = 0; } });
  return node;
}

const context = new Proxy({
  imageSmoothingEnabled: false, globalAlpha: 1,
  clearRect() {}, fillRect() {}, strokeRect() {}, save() {}, restore() {}, translate() {}, scale() {},
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, setLineDash() {}, fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }
}, { get(target, property) { return property in target ? target[property] : () => {}; } });
const canvas = { ...element([]), width: 1280, height: 720, getContext() { return context; }, getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; } };
const elements = new Map();
globalThis.document = {
  hidden: false, body: element([]), addEventListener() {}, removeEventListener() {},
  getElementById(id) { if (id === "gameCanvas") return canvas; if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  querySelector() { return element([]); }, createElement() { return element([]); }, createElementNS() { return element([]); }
};
globalThis.window = {
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, location: { search: "", hostname: "localhost" },
  addEventListener() {}, removeEventListener() {}, clearTimeout, setTimeout, confirm() { return true; }
};
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) || null; }, setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); } };

const stateModule = await import("../src/state.js");
const { randomEventDefinitions } = await import("../src/data/randomEvents.js");
const { normalizeState } = await import("../src/storage.js");
const { isNpcAreaWalkable } = await import("../src/utils/collision.js");
const { activateSelectedChoiceAction } = await import("../src/systems/modal.js");
const {
  canStartEvent,
  clearEventCooldownForDebug,
  evaluateRandomEvents,
  endEventForDebug,
  getActiveEventsForMap,
  getPhotoEventForSpot,
  getRandomEventInteractables,
  hydrateRandomEvents,
  isEventActive,
  listAvailableEventsForDebug,
  markPhotoEventCaptured,
  startEventForDebug,
  startRandomEvent,
  updateActiveEvents,
  updateRandomEvents
} = await import("../src/systems/randomEvents.js");
const { handleRandomEventInteraction } = await import("../src/systems/randomEventInteractions.js");
const { drawRandomEvents } = await import("../src/render/renderRandomEvents.js");

function reset(overrides = {}) {
  stateModule.setState(normalizeState({
    profile: { gender: "female" },
    gameTime: { day: 1, hour: 15, minute: 0, totalGameMinutes: 900, pauseReasons: [] },
    weather: { type: "clear", intensity: 0, startedAtGameMinute: 900, durationGameMinutes: 300, nextWeatherType: "cloudy", surfaceWetness: 0 },
    ...overrides
  }));
  stateModule.player.x = stateModule.state.player.x;
  stateModule.player.y = stateModule.state.player.y;
  stateModule.runtime.eventCollisionBlocks.length = 0;
  stateModule.ui.choiceModal.classList.add("hidden");
  stateModule.ui.choiceActions.innerHTML = "";
  hydrateRandomEvents();
}

assert(randomEventDefinitions.length >= 14, "Phải có tập sự kiện đủ đa dạng");
reset();
assert.deepEqual(stateModule.state.randomEvents, { active: {}, cooldowns: {}, completedFlags: {} }, "Save cũ có fallback event rỗng");

for (const event of randomEventDefinitions.filter((entry) => entry.interaction)) {
  const mapId = event.mapId;
  const anchor = event.anchor;
  reset({ currentMapId: mapId, player: { x: anchor.x - 12, y: anchor.y - 23 } });
  assert.equal(isNpcAreaWalkable(anchor.x - 12, anchor.y - 23, 24, 46), true, `${event.id} phải có điểm tương tác tiếp cận được`);
}

reset({ currentMapId: "hoanKiem", gameTime: { totalGameMinutes: 1140, pauseReasons: [] } });
assert.equal(startEventForDebug("hoanKiemDanceGroup"), true);
assert.equal(getActiveEventsForMap("hoanKiem").some((entry) => entry.definition.id === "hoanKiemDanceGroup"), true);
drawRandomEvents({ id: "hoanKiem" });
stateModule.state.weather.type = "heavyRain";
updateActiveEvents();
assert.equal(isEventActive("hoanKiemDanceGroup"), false, "Mưa lớn phải giải tán nhóm nhảy");

reset({ currentMapId: "longBien", player: { x: 800, y: 800 } });
assert.equal(startEventForDebug("longBienTrainPass"), true);
assert.equal(stateModule.runtime.eventCollisionBlocks.length, 1, "Tín hiệu tàu phải chặn lối ray tạm thời");
stateModule.state.gameTime.totalGameMinutes = 908;
updateActiveEvents();
assert.equal(stateModule.state.randomEvents.active.longBienTrainPass.phase, "passing");
drawRandomEvents({ id: "longBien" });
endEventForDebug("longBienTrainPass");
assert.equal(stateModule.runtime.eventCollisionBlocks.length, 0, "Kết thúc tàu phải dọn collision tạm");

reset({ currentMapId: "hoanKiem" });
startEventForDebug("vanMieuStudentGroup");
assert.equal(getActiveEventsForMap("baDinh").length, 1, "Event map khác vẫn phải được mô phỏng");
assert.equal(getActiveEventsForMap("hoanKiem").length, 0);
const serialized = JSON.parse(JSON.stringify(stateModule.state));
stateModule.setState(normalizeState(serialized));
hydrateRandomEvents();
assert.equal(getActiveEventsForMap("baDinh").length, 1, "Reload giữa event không được nhân đôi hoặc làm mất event");

reset({ currentMapId: "hoanKiem", money: 50000 });
startEventForDebug("hoanKiemDroppedItem");
const dropped = getRandomEventInteractables("hoanKiem")[0];
assert.equal(handleRandomEventInteraction(dropped.source), true);
activateSelectedChoiceAction();
assert.equal(stateModule.state.money, 55000);
assert.equal(isEventActive("hoanKiemDroppedItem"), false);
assert.equal(handleRandomEventInteraction(dropped.source), false, "Phần thưởng event không được nhận lần hai");

reset({ currentMapId: "hoanKiem" });
startEventForDebug("couplePhotoHoanKiem");
assert.deepEqual(getPhotoEventForSpot("photo-nha-tho-lon"), {
  eventId: "couplePhotoHoanKiem",
  eventTags: ["sự kiện", "cặp đôi", "Nhà thờ Lớn"]
});
markPhotoEventCaptured("couplePhotoHoanKiem");
assert.equal(stateModule.state.randomEvents.active.couplePhotoHoanKiem.interactionResolved, true);

reset({ currentMapId: "baDinh", gameTime: { totalGameMinutes: 600, pauseReasons: [] }, branchingQuestProgress: { tourGroup: { status: "active", currentNodeId: "choose" } } });
clearEventCooldownForDebug("vanMieuStudentGroup");
assert.equal(canStartEvent("vanMieuStudentGroup"), false, "Event không được chồng actor của branching quest quan trọng");

reset({ currentMapId: "churchInterior", gameTime: { totalGameMinutes: 600, pauseReasons: [] } });
assert.equal(startRandomEvent("vanMieuStudentGroup"), true);
assert.equal(canStartEvent("baDinhVisitorGroup"), false, "Mỗi map chỉ được có một event lớn");

reset({ currentMapId: "churchInterior", gameTime: { totalGameMinutes: 900, pauseReasons: [] } });
assert.equal(startRandomEvent("busArrivalHoanKiem"), true);
assert.equal(startRandomEvent("hoanKiemDroppedItem"), true);
assert.equal(canStartEvent("couplePhotoHoanKiem"), false, "Mỗi map chỉ được có tối đa hai event nhỏ");

reset({ currentMapId: "hoanKiem" });
stateModule.state.weather.type = "rain";
updateRandomEvents();
assert.equal(isEventActive("weatherRainRush"), true, "Chuyển sang mưa phải kích hoạt phản ứng trú mưa");
stateModule.state.weather.type = "clear";
updateRandomEvents();
assert.equal(isEventActive("weatherRainRush"), false, "Pha trú mưa phải cleanup trước pha sau mưa");
assert.equal(isEventActive("weatherAfterRain"), true, "Mưa tạnh phải giữ pha sinh hoạt sau mưa");

reset({ currentMapId: "hoanKiem", gameTime: { totalGameMinutes: 400, pauseReasons: [] } });
evaluateRandomEvents({ reason: "minute" });
assert.equal(isEventActive("longBienTrainPass"), true, "Lịch tàu phải được đánh giá dù player đang ở map khác");
endEventForDebug("longBienTrainPass");
assert.equal(canStartEvent("longBienTrainPass"), false, "Cooldown phải chặn event lặp lại ngay");

reset({ gameTime: { totalGameMinutes: 1140, pauseReasons: ["hanging-out-with-mo"] } });
startEventForDebug("hoanKiemDanceGroup");
const pausedEnd = stateModule.state.randomEvents.active.hoanKiemDanceGroup.endsAt;
updateActiveEvents();
assert.equal(stateModule.state.randomEvents.active.hoanKiemDanceGroup.endsAt, pausedEnd, "Pause thời gian giữ nguyên thời lượng event");

reset({ currentMapId: "baDinh" });
startEventForDebug("busArrivalBaDinh");
drawRandomEvents({ id: "baDinh" });
assert.equal(isEventActive("busArrivalBaDinh"), true, "Visual xe buýt không được phá fast travel state");
assert(listAvailableEventsForDebug().some((entry) => entry.id === "longBienTrainPass"));

const photoMigration = normalizeState({ photoAlbum: { photos: { "photo-cau-long-bien": { rating: 3, eventId: "longBienTrainPass", eventTags: ["sự kiện", "tàu qua cầu"] } } } });
assert.equal(photoMigration.photoAlbum.photos["photo-cau-long-bien"].eventId, "longBienTrainPass");
assert.deepEqual(photoMigration.photoAlbum.photos["photo-cau-long-bien"].eventTags, ["sự kiện", "tàu qua cầu"]);

reset({ randomEvents: { active: { longBienTrainPass: { startedAt: 700, endsAt: 710, mapId: "longBien" } } } });
assert.equal(isEventActive("longBienTrainPass"), false, "Reload phải cleanup event đã hết hạn");

clearTimeout(stateModule.runtime.messageTimer);
process.stdout.write(`Random event tests: OK (${randomEventDefinitions.length} definitions, cooldown, weather, train, bus, photo, reload, pause)\n`);
