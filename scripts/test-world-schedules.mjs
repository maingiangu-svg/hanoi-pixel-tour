import assert from "node:assert/strict";

const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
const element = () => ({
  classList,
  style: {},
  textContent: "",
  innerHTML: "",
  addEventListener() {},
  appendChild() {},
  setAttribute() {},
  querySelectorAll() { return []; }
});
const canvas = {
  ...element(),
  width: 1280,
  height: 720,
  getContext() { return { imageSmoothingEnabled: false }; },
  getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; }
};

globalThis.document = {
  hidden: false,
  addEventListener() {},
  getElementById(id) { return id === "gameCanvas" ? canvas : element(); }
};
globalThis.window = { confirm() { return true; }, addEventListener() {}, devicePixelRatio: 1 };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.performance = globalThis.performance || { now: () => 0 };

const { maps } = await import("../src/data/maps.js");
const { player, state } = await import("../src/state.js");
const {
  getActiveMapNpcs,
  getScheduledChildCount,
  getShopStatus,
  updateWorldSchedules
} = await import("../src/systems/worldSchedule.js");
const { getChurchService, getScheduledNpcsForMap, updateNpcSchedules } = await import("../src/systems/npcSchedule.js");
const { pauseGameClock, updateGameClock } = await import("../src/systems/gameClock.js");
const { normalizeState } = await import("../src/storage.js");

player.x = -10000;
player.y = -10000;

function setTime(hour, minute = 0, day = 1) {
  state.gameTime.day = day;
  state.gameTime.hour = hour;
  state.gameTime.minute = minute;
  state.gameTime.totalGameMinutes = (day - 1) * 1440 + hour * 60 + minute;
  updateNpcSchedules();
}

function ids(mapId) {
  return getActiveMapNpcs(maps[mapId]).map((npc) => npc.id);
}

function assertUnique(mapId) {
  const list = ids(mapId);
  assert.equal(new Set(list).size, list.length, `${mapId} không được có NPC trùng ID`);
}

setTime(5, 30);
assert(ids("hoanKiem").includes("teaSellerHoGuom"));
assert(ids("baDinh").includes("exerciseBaDinh"));
assert(ids("longBien").includes("bridgeRunner"));

setTime(8, 0);
assert(!ids("baDinh").includes("exerciseBaDinh"));
assert(!ids("longBien").includes("bridgeRunner"));
assert.equal(getScheduledChildCount(), 1);

setTime(12, 0);
assert.equal(getActiveMapNpcs(maps.hoanKiem).find((npc) => npc.id === "teaSellerHoGuom")?.scheduleState, "resting");
assert.equal(getShopStatus(maps.hoanKiem.shops.find((shop) => shop.foodId === "bunCha")).open, true);
assert.equal(getShopStatus(maps.baDinh.shops.find((shop) => shop.foodId === "phoHaNoi")).open, false);
assert.equal(getShopStatus(maps.baDinh.shops.find((shop) => shop.foodId === "banhCuon")).open, false);

setTime(17, 45);
assert.equal(getScheduledChildCount(), 4);
assert(ids("hoanKiem").filter((id) => id.startsWith("churchVisitor")).length >= 4);

setTime(18, 30);
assert(ids("hoanKiem").includes("danceGroupNhaTho"));
assert.equal(getChurchService().isMassActive, true);
assert(getChurchService().activeCount >= 20);
assert(getScheduledNpcsForMap(maps.churchInterior).some((npc) => npc.id === "mo"));

setTime(21, 0);
assert.equal(getActiveMapNpcs(maps.hoanKiem).find((npc) => npc.id === "teaSellerHoGuom")?.scheduleState, "packingUp");
assert.equal(getShopStatus(maps.hoanKiem.shops.find((shop) => shop.foodId === "bunCha")).open, false);

setTime(2, 0);
for (const mapId of ["hoanKiem", "baDinh", "longBien"]) {
  const active = getActiveMapNpcs(maps[mapId]);
  assert(!active.some((npc) => ["teaSeller", "jog", "exercise", "danceGroup"].includes(npc.activity)));
  assertUnique(mapId);
}
assert.equal(getScheduledChildCount(), 0);

setTime(18, 30, 2);
assert(ids("hoanKiem").includes("danceGroupNhaTho"));
assertUnique("hoanKiem");

state.currentMapId = "longBien";
updateWorldSchedules();
assertUnique("longBien");
state.currentMapId = "baDinh";
updateWorldSchedules();
assertUnique("baDinh");
state.currentMapId = "hoanKiem";
updateWorldSchedules();

const beforePause = state.gameTime.totalGameMinutes;
pauseGameClock("schedule-test");
updateGameClock(1000);
updateGameClock(61000);
assert.equal(state.gameTime.totalGameMinutes, beforePause);

const oldSave = normalizeState({ money: 123456, visitedMaps: ["hoanKiem"] });
assert.equal(oldSave.money, 123456);
assert.equal(oldSave.gameTime.hour, 7);
assert.equal(oldSave.gameTime.minute, 0);

process.stdout.write("World schedule tests: OK\n");
