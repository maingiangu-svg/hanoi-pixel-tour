import assert from "node:assert/strict";

let now = 1000;
globalThis.performance = { now: () => now };

const hiddenClassList = {
  add() {},
  remove() {},
  toggle() {},
  contains(name) { return name === "hidden"; }
};
const element = () => ({
  classList: hiddenClassList,
  style: {},
  dataset: {},
  textContent: "",
  innerHTML: "",
  addEventListener() {},
  appendChild() {},
  append() {},
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
  removeEventListener() {},
  getElementById(id) { return id === "gameCanvas" ? canvas : element(); }
};
globalThis.window = {
  confirm() { return true; },
  addEventListener() {},
  devicePixelRatio: 1
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const { maps } = await import("../src/data/maps.js");
const { MO_NEIGHBORHOOD } = await import("../src/data/npcSchedules.js");
const { player, runtime, state } = await import("../src/state.js");
const { updateNpcSchedules, getMoChildren } = await import("../src/systems/npcSchedule.js");
const { getActiveMapNpcs } = await import("../src/systems/worldSchedule.js");
const {
  clearNpcReactionBubble,
  getContextualNpcSpeech,
  getNpcReactionProfile,
  getNpcReactionVisual,
  isVehicleHornActive,
  requestNpcReaction,
  triggerVehicleHorn,
  updateNpcReaction,
  updateNpcReactions
} = await import("../src/systems/npcReactions.js");

state.currentMapId = "hoanKiem";
state.gameTime.hour = 18;
state.gameTime.minute = 30;
state.gameTime.totalGameMinutes = 18 * 60 + 30;
updateNpcSchedules();

const pedestrian = getActiveMapNpcs(maps.hoanKiem).find((npc) => npc.activity === "walk");
assert(pedestrian, "Hoàn Kiếm cần có người đi bộ để kiểm tra phản ứng");
player.x = pedestrian.x - 42;
player.y = pedestrian.y;
state.player.x = player.x;
state.player.y = player.y;
state.vehicle = { owned: true, type: "vinfast-electric", equipped: true, status: "riding", parkedAt: null };
runtime.playerMotionSpeed = player.speed * 1.8;
updateNpcReactions(now);
assert(["avoidingVehicle", "startled"].includes(getNpcReactionVisual(pedestrian).state));

const teaVendor = getActiveMapNpcs(maps.hoanKiem).find((npc) => npc.activity === "teaSeller");
assert(teaVendor, "Khung giờ chiều cần có cô bán trà đá");
assert.equal(getNpcReactionProfile(teaVendor).id, "vendor");
clearNpcReactionBubble();
assert.equal(requestNpcReaction(teaVendor, "annoyed", {
  force: true,
  bubbleText: "Đi chậm thôi cháu, đổ hết cốc bây giờ!"
}), true);
assert.equal(getNpcReactionVisual(teaVendor).bubbleText, "Đi chậm thôi cháu, đổ hết cốc bây giờ!");
clearNpcReactionBubble();
assert.equal(getNpcReactionVisual(teaVendor).bubbleText, "");

const child = getMoChildren()[0];
assert(child, "Khung giờ chiều cần có trẻ em trong sân");
player.x = child.x - 30;
player.y = child.y;
now += 2000;
assert.equal(requestNpcReaction(child, "startled", { force: true, durationMs: 700 }), true);
now += 120;
updateNpcReactions(now);
const childVisual = getNpcReactionVisual(child);
const childX = child.x + childVisual.offsetX;
const childY = child.y + childVisual.offsetY;
assert(childX >= MO_NEIGHBORHOOD.x + 12 && childX <= MO_NEIGHBORHOOD.x + MO_NEIGHBORHOOD.width - 12);
assert(childY >= MO_NEIGHBORHOOD.y + 12 && childY <= MO_NEIGHBORHOOD.y + MO_NEIGHBORHOOD.height - 12);

const xeOm = getActiveMapNpcs(maps.hoanKiem).find((npc) => npc.activity === "xeOm");
assert(xeOm, "Hoàn Kiếm cần có xe ôm trong khung giờ kiểm tra");
assert.equal(getContextualNpcSpeech(xeOm), "Có xe rồi à cháu, đi cẩn thận nhé!");

now += 2000;
assert.equal(triggerVehicleHorn(), true);
assert.equal(isVehicleHornActive(now), true);
assert.equal(triggerVehicleHorn(), false, "Giữ phím H không được phát còi lặp ngay");
now += 1100;
assert.equal(triggerVehicleHorn(), true);

state.vehicle.equipped = false;
state.vehicle.status = "stored";
state.currentMapId = "baDinh";
updateNpcSchedules();
player.x = maps.baDinh.spawn.x;
player.y = maps.baDinh.spawn.y;
const blockedWalker = {
  id: "reactionTestWalker",
  name: "Người đi bộ",
  x: player.x + 22,
  y: player.y,
  width: 24,
  height: 46,
  activity: "walk",
  visible: true
};
runtime.playerMotionSpeed = 0;
now += 1000;
updateNpcReactions(now);
updateNpcReaction(blockedWalker, {
  x: player.x + player.width / 2,
  y: player.y + player.height / 2
}, 16, now);
assert.equal(getNpcReactionVisual(blockedWalker).state, "waitingForPath");
now += 420;
updateNpcReactions(now);
assert.equal(getNpcReactionVisual(blockedWalker).state, "stepAside");

process.stdout.write("NPC reaction tests: OK\n");
