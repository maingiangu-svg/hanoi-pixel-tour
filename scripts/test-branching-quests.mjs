import assert from "node:assert/strict";

function createClassList(initial = ["hidden"]) {
  const values = new Set(initial);
  return {
    add(...names) { names.forEach((name) => values.add(name)); },
    remove(...names) { names.forEach((name) => values.delete(name)); },
    contains(name) { return values.has(name); },
    toggle(name, force) { if (force) values.add(name); else values.delete(name); }
  };
}

function element(initialClasses) {
  const children = [];
  const listeners = new Map();
  const node = {
    classList: createClassList(initialClasses),
    style: {},
    dataset: {},
    textContent: "",
    disabled: false,
    type: "",
    children,
    addEventListener(type, handler) { listeners.set(type, handler); },
    click() { listeners.get("click")?.({ stopPropagation() {} }); },
    appendChild(child) { children.push(child); },
    append(...items) { children.push(...items); },
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll(selector) { return selector === "button" ? children.filter((child) => child.type === "button") : []; }
  };
  Object.defineProperty(node, "innerHTML", { get() { return ""; }, set() { children.length = 0; } });
  return node;
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
  fillRect() {}, strokeRect() {}, clearRect() {}, save() {}, restore() {}, translate() {}, scale() {},
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, setLineDash() {}, fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }
};
const canvas = { ...element([]), width: 1280, height: 720, getContext() { return context; }, getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; } };
const elements = new Map();
globalThis.document = {
  hidden: false,
  addEventListener() {}, removeEventListener() {},
  getElementById(id) { if (id === "gameCanvas") return canvas; if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
  createElement() { return element([]); }, createElementNS() { return element([]); }
};
globalThis.window = { confirm() { return true; }, addEventListener() {}, removeEventListener() {}, clearTimeout, setTimeout, devicePixelRatio: 1, location: { search: "", hostname: "localhost" } };
globalThis.localStorage = { values: new Map(), getItem(key) { return this.values.get(key) || null; }, setItem(key, value) { this.values.set(key, value); }, removeItem(key) { this.values.delete(key); } };

const stateModule = await import("../src/state.js");
const { branchingQuests, branchingQuestActors } = await import("../src/data/branchingQuests.js");
const { normalizeState } = await import("../src/storage.js");
const { isNpcAreaWalkable } = await import("../src/utils/collision.js");
const { activateSelectedChoiceAction, moveChoiceActionSelection } = await import("../src/systems/modal.js");
const {
  advanceQuestNode,
  chooseQuestOption,
  completeQuestBranch,
  getCurrentQuestNode,
  getQuestOutcome,
  getVisibleBranchingQuestActors,
  handleBranchingQuestActor,
  handleMoQuestInteraction,
  hydrateBranchingQuests,
  startBranchingQuest,
  updateBranchingQuests
} = await import("../src/systems/branchingQuest.js");
const { canUseVehicleWithQuestFollower, getQuestFollowersForMap } = await import("../src/systems/questFollower.js");

function reset(overrides = {}) {
  stateModule.setState(normalizeState({ ...overrides, profile: { gender: "female" } }));
  stateModule.player.x = stateModule.state.player.x;
  stateModule.player.y = stateModule.state.player.y;
  stateModule.player.facing = "down";
  stateModule.ui.choiceModal.classList.add("hidden");
  stateModule.ui.choiceActions.innerHTML = "";
  clearTimeout(stateModule.runtime.messageTimer);
}

for (const quest of Object.values(branchingQuests)) {
  assert(quest.nodes[quest.startNodeId], `${quest.id} phải có node bắt đầu`);
  Object.values(quest.nodes).forEach((node) => {
    (node.choices || []).forEach((choice) => {
      if (choice.nextNodeId) assert(quest.nodes[choice.nextNodeId], `${quest.id}/${choice.id} trỏ tới node hợp lệ`);
    });
    const objective = node.objective;
    const points = objective?.type === "reachPoint" ? [objective] : objective?.type === "routePoints" ? objective.points.map((point) => ({ ...point, mapId: objective.mapId })) : [];
    points.forEach((point) => {
      reset({ currentMapId: point.mapId, player: { x: point.x - stateModule.player.width / 2, y: point.y - stateModule.player.height / 2 } });
      assert.equal(isNpcAreaWalkable(point.x - 12, point.y - 23, 24, 46), true, `${quest.id}/${node.title} phải có đích tiếp cận được`);
    });
  });
}
assert.equal(Object.keys(branchingQuests).length, 8);
assert(branchingQuestActors.length >= 18);
for (const actor of branchingQuestActors) {
  reset({ currentMapId: actor.mapId, player: { x: actor.x, y: actor.y } });
  if (!isNpcAreaWalkable(actor.x, actor.y, actor.width, actor.height)) {
    const candidates = [];
    for (let radius = 20; radius <= 240; radius += 20) {
      for (let dx = -radius; dx <= radius; dx += 20) {
        for (const dy of [-radius, radius]) candidates.push({ x: actor.x + dx, y: actor.y + dy });
      }
      for (let dy = -radius + 20; dy < radius; dy += 20) {
        for (const dx of [-radius, radius]) candidates.push({ x: actor.x + dx, y: actor.y + dy });
      }
    }
    const safe = candidates.find((point) => isNpcAreaWalkable(point.x, point.y, actor.width, actor.height));
    assert.fail(`${actor.id} phải nằm tại vùng tiếp cận được; gợi ý ${safe?.x},${safe?.y}`);
  }
}

reset({ money: 50000 });
assert.deepEqual(stateModule.state.branchingQuestProgress, {}, "Save cũ phải có fallback rỗng");
handleBranchingQuestActor(branchingQuestActors.find((actor) => actor.id === "lostTourist"));
assert.equal(stateModule.ui.choiceModal.classList.contains("hidden"), false);
moveChoiceActionSelection(1);
activateSelectedChoiceAction();
assert.equal(stateModule.state.branchingQuestProgress.lostTourist.choices[0], "escort", "W/S và Enter phải kích hoạt lựa chọn đang highlight");

reset({ money: 50000 });
startBranchingQuest("lostTourist");
assert.equal(chooseQuestOption("lostTourist", "directions"), true);
assert.equal(chooseQuestOption("lostTourist", "wrongNorth"), true);
assert.equal(stateModule.state.branchingQuestProgress.lostTourist.status, "unresolved");
stateModule.state.gameTime.totalGameMinutes += 20;
handleBranchingQuestActor(branchingQuestActors.find((actor) => actor.id === "lostTourist"));
assert.equal(getCurrentQuestNode("lostTourist").type, "choice");
assert.equal(chooseQuestOption("lostTourist", "correctDirection"), true);
assert.equal(getQuestOutcome("lostTourist"), "good");
assert.equal(stateModule.state.money, 62000);
assert.equal(completeQuestBranch("lostTourist", "excellent"), false, "Không nhận thưởng lần hai");
assert.equal(stateModule.state.money, 62000);

reset({ money: 50000 });
startBranchingQuest("lostTourist");
chooseQuestOption("lostTourist", "escort");
assert.equal(canUseVehicleWithQuestFollower().allowed, false);
assert.equal(getQuestFollowersForMap("hoanKiem").length, 1);
assert.equal(getVisibleBranchingQuestActors("hoanKiem").some((actor) => actor.id === "lostTourist"), false, "Follower không được để lại NPC trùng ở điểm xuất phát");
const restoredFollower = normalizeState(JSON.parse(JSON.stringify(stateModule.state)));
assert.equal(restoredFollower.branchingQuestProgress.lostTourist.follower.active, true);
stateModule.setState(restoredFollower);
hydrateBranchingQuests();
assert.equal(getQuestFollowersForMap("hoanKiem").length, 1, "Reload không nhân đôi follower");
stateModule.player.x = 2471;
stateModule.player.y = 776;
updateBranchingQuests();
assert.equal(getQuestOutcome("lostTourist"), "excellent");
assert.equal(getVisibleBranchingQuestActors("hoanKiem").find((actor) => actor.id === "lostTourist")?.x, 2460, "Du khách phải xuất hiện ở Nhà thờ sau nhánh hộ tống");

reset({ money: 50000 });
startBranchingQuest("lostWallet");
chooseQuestOption("lostWallet", "keepWallet");
assert.equal(getQuestOutcome("lostWallet"), "neutral");
assert(stateModule.state.inventory.specialItems.includes("Chiếc ví thất lạc"));

reset({ money: 5000 });
startBranchingQuest("childToy");
assert.equal(chooseQuestOption("childToy", "replace"), false, "Không đủ tiền thì không ghi lựa chọn");
assert.equal(stateModule.state.branchingQuestProgress.childToy.choices.length, 0);
advanceQuestNode("childToy", "askMo");
assert.equal(handleMoQuestInteraction(), true);
assert.equal(stateModule.state.branchingQuestProgress.childToy.currentNodeId, "shortSearch");

reset({ photoAlbum: { photos: { "photo-cong-van-mieu": { rating: 3 } }, discoveredSpots: ["photo-cong-van-mieu"] } });
startBranchingQuest("tourGroup");
chooseQuestOption("tourGroup", "photo");
chooseQuestOption("tourGroup", "useOldPhoto");
assert.equal(getQuestOutcome("tourGroup"), "good", "Ảnh cũ phải thỏa objective ảnh");

reset({ vehicle: { owned: false } });
startBranchingQuest("transportChoice");
assert.equal(chooseQuestOption("transportChoice", "vinfast"), false);
assert.equal(stateModule.state.branchingQuestProgress.transportChoice.choices.length, 0);

reset({ moCompanion: { active: false } });
assert.equal(startBranchingQuest("moDestination"), null);
reset({ moCompanion: { active: true, currentMap: "hoanKiem" }, gameTime: { totalGameMinutes: 900, pauseReasons: ["hanging-out-with-mo"] } });
assert(startBranchingQuest("moDestination"));
chooseQuestOption("moDestination", "lake");
stateModule.player.x = 1214;
stateModule.player.y = 1004;
updateBranchingQuests();
assert.equal(getQuestOutcome("moDestination"), "good");

clearTimeout(stateModule.runtime.messageTimer);
process.stdout.write("Branching quest tests: OK (8 quests, migration, rewards, followers, photo, Mơ)\n");
