import { CHECK_IN_REWARD, player, state } from "../state.js";
import { maps } from "../data/maps.js";
import { allNpcs } from "../data/npcs.js";
import { formatMoney } from "./format.js";

export function getCurrentMap() {
  return maps[state.currentMapId];
}

export function findLandmark(landmarkId) {
  return Object.values(maps)
    .flatMap((map) => map.landmarks)
    .find((landmark) => landmark.id === landmarkId);
}

export function getLandmarkIdsFromStamps(stamps = []) {
  if (!Array.isArray(stamps)) {
    return [];
  }

  return Object.values(maps)
    .flatMap((map) => map.landmarks)
    .filter((landmark) => landmark.stamp && stamps.includes(landmark.stamp))
    .map((landmark) => landmark.id);
}

export function findNpcTask(taskId) {
  const npc = allNpcs.find((item) => item.task && item.task.taskId === taskId);
  return npc ? npc.task : null;
}

export function grantLandmarkRewards(landmark) {
  if (!landmark) {
    return [];
  }

  const rewards = [];
  if (landmark.stamp && addUnique(state.inventory.stamps, landmark.stamp)) {
    state.money += CHECK_IN_REWARD;
    rewards.push(`${landmark.stamp} và ${formatMoney(CHECK_IN_REWARD)}`);
  }

  if (landmark.souvenir && addUnique(state.inventory.souvenirs, landmark.souvenir)) {
    rewards.push(landmark.souvenir);
  }

  return rewards;
}

export function addUnique(list, item) {
  if (!item || list.includes(item)) {
    return false;
  }
  list.push(item);
  return true;
}

export function removeItem(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

export function isQuizCorrect(quizId) {
  return Boolean(state.completedQuizzes[quizId] && state.completedQuizzes[quizId].correct);
}

export function getCorrectQuizCount() {
  return Object.values(state.completedQuizzes).filter((result) => result && result.correct).length;
}

export function getPlayerCenter() {
  return {
    x: player.x + player.width / 2,
    y: player.y + player.height / 2
  };
}

export function placePlayerAtSafeStart(mapId) {
  const starts = {
    hoanKiem: { x: 174, y: 356 },
    baDinh: { x: 888, y: 520 },
    longBien: { x: 98, y: 350 }
  };
  const start = starts[mapId] || starts.hoanKiem;
  player.x = start.x;
  player.y = start.y;
  state.player.x = start.x;
  state.player.y = start.y;
}
