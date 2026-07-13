import assert from "node:assert/strict";

const classNames = new Set(["hidden"]);
const stubElement = {
  classList: {
    contains: (name) => classNames.has(name),
    add: (name) => classNames.add(name),
    remove: (name) => classNames.delete(name)
  },
  addEventListener() {},
  setAttribute() {},
  getContext: () => ({ imageSmoothingEnabled: false })
};

globalThis.document = {
  getElementById: () => stubElement,
  addEventListener() {},
  removeEventListener() {}
};
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: () => null,
  setItem() {}
};

const { player, state } = await import("../src/state.js");
const {
  getAreaNpcPresentation,
  getAreaProfile,
  getAreaTrafficFactor,
  getCurrentAreaAmbience
} = await import("../src/systems/areaAmbience.js");

assert.equal(getAreaProfile("hoanKiem", 800, 900).id, "hoanKiemOldQuarter");
assert.equal(getAreaProfile("hoanKiem", 2460, 900).id, "cathedralExterior");
assert.equal(getAreaProfile("baDinh", 1100, 600).id, "baDinhCeremonial");
assert.equal(getAreaProfile("baDinh", 1100, 1640).id, "vanMieuCourtyard");
assert.equal(getAreaProfile("longBien", 720, 930).id, "longBienMarket");
assert.equal(getAreaProfile("longBien", 1420, 620).id, "longBienBridge");
assert.equal(getAreaProfile("longBien", 1680, 1100).id, "longBienRiverside");
assert.equal(getAreaProfile("churchInterior", 700, 500).id, "churchInterior");

state.currentMapId = "hoanKiem";
state.gameTime.hour = 18;
state.gameTime.minute = 30;
state.gameTime.totalGameMinutes = 1110;
player.x = 800;
player.y = 900;
const hoanKiemEvening = getCurrentAreaAmbience();

state.currentMapId = "baDinh";
player.x = 1100;
player.y = 600;
const baDinhEvening = getCurrentAreaAmbience();
assert.ok(hoanKiemEvening.density > baDinhEvening.density, "Hoàn Kiếm phải đông hơn Ba Đình buổi tối");

state.gameTime.hour = 23;
state.gameTime.minute = 30;
state.gameTime.totalGameMinutes = 1410;
const baDinhLateNight = getCurrentAreaAmbience();
assert.ok(baDinhLateNight.density < baDinhEvening.density, "Ba Đình phải yên hơn vào đêm muộn");

state.gameTime.hour = 8;
state.gameTime.minute = 30;
state.gameTime.totalGameMinutes = 510;
const marketTraffic = getAreaTrafficFactor("longBien", 720, 930);
const riversideTraffic = getAreaTrafficFactor("longBien", 1680, 1100);
assert.ok(marketTraffic > riversideTraffic, "Khu chợ Long Biên phải có giao thông dày hơn ven sông");

const presentationA = getAreaNpcPresentation("baDinh", 1100, 1640, "student-a");
const presentationB = getAreaNpcPresentation("baDinh", 1100, 1640, "student-a");
assert.deepEqual(presentationA, presentationB, "Vai trò và tốc độ NPC phải ổn định qua reload");
assert.ok(["student", "reader", "guide", "visitor"].includes(presentationA.ambientRole));
assert.ok(presentationA.movementSpeed < 0.8, "Khách Văn Miếu phải đi chậm");

console.log("Area ambience data tests passed.");
