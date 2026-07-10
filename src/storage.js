import { createDefaultState, player, runtime, SAVE_KEY, setState, state } from "./state.js";
import { foodCatalog } from "./data/foods.js";
import { maps } from "./data/maps.js";
import { VINFAST_VEHICLE_ID, vehicleCatalog } from "./data/vehicles.js";
import { findLandmark, getLandmarkIdsFromStamps } from "./utils/helpers.js";
import { isOverlayOpen, showMessage } from "./systems/modal.js";

let afterSaveHandler = () => {};
export function setAfterSaveHandler(handler) { afterSaveHandler = handler; }

export function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved) {
      return createDefaultState();
    }
    return normalizeState(saved);
  } catch (error) {
    console.warn("Không thể đọc lưu trữ, tạo hành trình mới.", error);
    return createDefaultState();
  }
}

export function normalizeState(saved) {
  const base = createDefaultState();
  const completedQuizzes = { ...base.completedQuizzes, ...(saved.completedQuizzes || {}) };

  Object.keys(completedQuizzes).forEach((key) => {
    if (completedQuizzes[key] === true) {
      completedQuizzes[key] = { correct: true };
    }
  });

  return {
    ...base,
    ...saved,
    currentMapId: maps[saved.currentMapId] ? saved.currentMapId : base.currentMapId,
    player: { ...base.player, ...(saved.player || {}) },
    profile: normalizeProfile(saved),
    vehicle: normalizeVehicle(saved),
    inventory: { ...base.inventory, ...(saved.inventory || {}) },
    completedQuizzes,
    completedTasks: { ...base.completedTasks, ...(saved.completedTasks || {}) },
    taskStages: { ...base.taskStages, ...(saved.taskStages || {}) },
    visitedMaps: Array.isArray(saved.visitedMaps) && saved.visitedMaps.length
      ? Array.from(new Set(saved.visitedMaps)).filter((mapId) => maps[mapId])
      : base.visitedMaps,
    eatenFoods: Array.isArray(saved.eatenFoods) ? saved.eatenFoods : base.eatenFoods,
    discoveredFoods: Array.isArray(saved.discoveredFoods)
      ? saved.discoveredFoods.filter((foodId) => foodCatalog[foodId])
      : (Array.isArray(saved.eatenFoods) ? saved.eatenFoods.filter((foodId) => foodCatalog[foodId]) : base.discoveredFoods),
    discoveredLandmarks: Array.isArray(saved.discoveredLandmarks)
      ? saved.discoveredLandmarks.filter((landmarkId) => findLandmark(landmarkId))
      : getLandmarkIdsFromStamps(saved.inventory && saved.inventory.stamps),
    money: Number.isFinite(saved.money) ? saved.money : base.money,
    freeReturnUsed: Boolean(saved.freeReturnUsed),
    victoryShown: Boolean(saved.victoryShown)
  };
}

function normalizeProfile(saved) {
  const gender = saved?.profile?.gender || saved?.playerProfile?.gender || saved?.gender;
  return {
    gender: ["male", "female"].includes(gender) ? gender : null
  };
}

function normalizeVehicle(saved) {
  const rawVehicle = saved?.vehicle || {};
  const type = vehicleCatalog[rawVehicle.type] ? rawVehicle.type : VINFAST_VEHICLE_ID;
  return {
    owned: Boolean(rawVehicle.owned),
    type,
    equipped: false
  };
}

export function saveGame() {
  state.player.x = Math.round(player.x);
  state.player.y = Math.round(player.y);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Không thể lưu tiến trình trong trình duyệt này.", error);
  }
  afterSaveHandler();
}

export function saveGameThrottled() {
  const now = performance.now();
  if (now - runtime.lastSavedAt > 900) {
    runtime.lastSavedAt = now;
    saveGame();
  }
}

export function confirmReset() {
  if (isOverlayOpen()) {
    return false;
  }

  const ok = window.confirm("Bạn có chắc muốn xoá tiến trình và bắt đầu lại chuyến đi không?");
  if (!ok) {
    return false;
  }

  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.warn("Không thể xoá lưu trữ trong trình duyệt này.", error);
  }
  setState(createDefaultState());
  player.x = state.player.x;
  player.y = state.player.y;
  player.facing = "down";
  showMessage("Tiến trình đã được đặt lại. Chúc bạn có một chuyến khám phá Hà Nội mới!");
  saveGame();
  return true;
}
