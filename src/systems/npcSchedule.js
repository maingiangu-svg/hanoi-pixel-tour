import { CHURCH_LAYOUT } from "../data/churchInterior.js";
import { CHURCH_SERVICE_TIMES, MO_CHILDREN, MO_SCHEDULE } from "../data/npcSchedules.js";
import { runtime, state } from "../state.js";
import { GAME_MINUTES_PER_DAY, getMinuteOfDay } from "../utils/gameTime.js";
import { getMoCompanionNpc, isMoCompanionActive, updateMoCompanion } from "./moCompanion.js";
import { getScheduledChildCount, updateWorldSchedules } from "./worldSchedule.js";

const MINUTES = {
  morningWashEnd: 8 * 60,
  middayRestStart: 12 * 60,
  middayRestEnd: 13 * 60 + 30,
  afternoonWashEnd: 16 * 60 + 30,
  churchWalkStart: 17 * 60 + 50,
  churchInteriorStart: 17 * 60 + 58,
  massStart: 18 * 60,
  massEnd: 19 * 60,
  churchLeaveEnd: 19 * 60 + 4,
  congregationDepartEnd: 19 * 60 + 5,
  returnEnd: 19 * 60 + 12,
  nightStart: 22 * 60,
  morningStart: 6 * 60
};

const routeToChurch = createRouteMetrics(MO_SCHEDULE.routeToChurch);
const routeIntoChurch = createRouteMetrics(MO_SCHEDULE.routeIntoChurch);
const congregation = CHURCH_LAYOUT.congregationSeats.map((seat, index) => ({
  ...seat,
  name: "Giáo dân",
  color: ["#5b77a8", "#9b5b68", "#8c7650", "#4d8b72"][index % 4]
}));
const quietVisitors = congregation.slice(0, 3);
const childGroups = Array.from({ length: MO_CHILDREN.length + 1 }, (_, count) => MO_CHILDREN.slice(0, count));
const scheduledNpcsByMap = {
  hoanKiem: [],
  churchInterior: []
};

export function updateNpcSchedules() {
  const minuteOfDay = getPreciseMinuteOfDay();
  const companionActive = isMoCompanionActive();
  const mo = companionActive ? updateMoCompanion() : updateMoSchedule(minuteOfDay);
  const service = updateChurchService(minuteOfDay);
  updateScheduledNpcLists(companionActive ? null : mo, service);
  updateScheduledCollisionBlocks(mo, service);
  updateWorldSchedules();
}

export function getScheduledNpcsForMap(map) {
  const scheduled = scheduledNpcsByMap[map.id] || [];
  const storyMoActive = (
    state.story?.currentScene === "chapter-1" &&
    Number(state.story?.currentChapter) === 1 &&
    !state.story?.flags?.chapter1?.completed
  ) || (
    state.story?.currentScene === "chapter-3" &&
    Number(state.story?.currentChapter) === 3 &&
    !state.story?.flags?.chapter3?.completed
  ) || (
    state.story?.currentScene === "chapter-4" &&
    Number(state.story?.currentChapter) === 4 &&
    !state.story?.flags?.chapter4?.completed
  ) || (
    state.story?.currentScene === "final-choice" &&
    Boolean(state.story?.flags?.originRevealed) &&
    Boolean(state.story?.flags?.chapter4?.portalOpen)
  );
  if (storyMoActive && runtime.scheduledMo && !isMoCompanionActive()) {
    const withoutScheduledMo = scheduled.filter((npc) => npc.id !== MO_SCHEDULE.id);
    if (runtime.scheduledMo.visible && runtime.scheduledMo.mapId === map.id) {
      return [...withoutScheduledMo, runtime.scheduledMo];
    }
    return withoutScheduledMo;
  }
  if (isMoCompanionActive()) {
    const companion = getMoCompanionNpc();
    if (companion && companion.visible && companion.mapId === map.id) {
      return [...scheduled, companion];
    }
  }

  return scheduled;
}

export function getChurchService() {
  return runtime.churchService;
}

export function getMoChildren() {
  const count = getScheduledChildCount(getMinuteOfDay(state.gameTime));
  return childGroups[Math.min(MO_CHILDREN.length, count)];
}

export function isMassInProgress() {
  return Boolean(runtime.churchService && runtime.churchService.isMassActive);
}

export function getScheduledNpcDialogue(npc) {
  if (npc.id === MO_SCHEDULE.id) {
    return getMoDialogue(npc.state);
  }

  if (npc.id === CHURCH_LAYOUT.priest.id) {
    return "Thánh lễ đang diễn ra. Bạn hãy giữ yên lặng và quan sát từ lối đi chính nhé.";
  }

  return "Chúc bạn có một chuyến khám phá Hà Nội bình an.";
}

function updateMoSchedule(minuteOfDay) {
  const mo = runtime.scheduledMo || createMoRuntimeNpc();
  const totalMinutes = Number(state.gameTime.totalGameMinutes) || 0;

  if (minuteOfDay < MINUTES.morningStart || minuteOfDay >= MINUTES.nightStart) {
    applyMoPosition(mo, "sleeping", null, 0, 0, "down", "sleeping", false);
  } else if (minuteOfDay < MINUTES.morningWashEnd) {
    applyMoPosition(mo, "washing", MO_SCHEDULE.homeMapId, MO_SCHEDULE.washingPoint.x, MO_SCHEDULE.washingPoint.y, "down", "washing");
  } else if (minuteOfDay < MINUTES.middayRestStart) {
    applyMoPlayPosition(mo, totalMinutes, "playingWithChildren");
  } else if (minuteOfDay < MINUTES.middayRestEnd) {
    applyMoPosition(mo, "resting", MO_SCHEDULE.homeMapId, MO_SCHEDULE.restPoint.x, MO_SCHEDULE.restPoint.y, "left", "resting");
  } else if (minuteOfDay < MINUTES.afternoonWashEnd) {
    applyMoPosition(mo, "washing", MO_SCHEDULE.homeMapId, MO_SCHEDULE.washingPoint.x, MO_SCHEDULE.washingPoint.y, "down", "washing");
  } else if (minuteOfDay < MINUTES.churchWalkStart) {
    applyMoPlayPosition(mo, totalMinutes, "playingWithChildren");
  } else if (minuteOfDay < MINUTES.churchInteriorStart) {
    applyRoutePosition(mo, "walkingToChurch", MO_SCHEDULE.homeMapId, routeToChurch, normalizeRange(minuteOfDay, MINUTES.churchWalkStart, MINUTES.churchInteriorStart), false, "walking");
  } else if (minuteOfDay < MINUTES.massStart) {
    applyRoutePosition(mo, "enteringChurch", MO_SCHEDULE.churchMapId, routeIntoChurch, normalizeRange(minuteOfDay, MINUTES.churchInteriorStart, MINUTES.massStart), false, "walking");
  } else if (minuteOfDay < MINUTES.massEnd) {
    applyMoPosition(mo, "attendingMass", MO_SCHEDULE.churchMapId, MO_SCHEDULE.massSeat.x, MO_SCHEDULE.massSeat.y, "up", "attendingMass");
  } else if (minuteOfDay < MINUTES.churchLeaveEnd) {
    applyRoutePosition(mo, "leavingChurch", MO_SCHEDULE.churchMapId, routeIntoChurch, normalizeRange(minuteOfDay, MINUTES.massEnd, MINUTES.churchLeaveEnd), true, "walking");
  } else if (minuteOfDay < MINUTES.returnEnd) {
    applyRoutePosition(mo, "returningToChildren", MO_SCHEDULE.homeMapId, routeToChurch, normalizeRange(minuteOfDay, MINUTES.churchLeaveEnd, MINUTES.returnEnd), true, "walking");
  } else {
    applyMoPlayPosition(mo, totalMinutes, "playingWithChildren");
  }

  runtime.scheduledMo = mo;
  const savedMo = state.npcSchedules.mo || (state.npcSchedules.mo = {});
  savedMo.currentState = mo.state;
  savedMo.currentMap = mo.mapId;
  savedMo.x = Math.round(mo.x);
  savedMo.y = Math.round(mo.y);
  return mo;
}

function createMoRuntimeNpc() {
  return {
    id: MO_SCHEDULE.id,
    name: MO_SCHEDULE.name,
    color: MO_SCHEDULE.color,
    width: 24,
    height: 46,
    x: MO_SCHEDULE.washingPoint.x,
    y: MO_SCHEDULE.washingPoint.y,
    mapId: MO_SCHEDULE.homeMapId,
    state: "washing",
    activity: "washing",
    facing: "down",
    visible: true,
    interactable: true
  };
}

function applyMoPlayPosition(mo, totalMinutes, stateName) {
  const phase = totalMinutes * 0.42;
  const x = MO_SCHEDULE.playPoint.x + Math.round(Math.sin(phase) * 12);
  const y = MO_SCHEDULE.playPoint.y + Math.round(Math.cos(phase * 0.7) * 5);
  applyMoPosition(mo, stateName, MO_SCHEDULE.homeMapId, x, y, "right", "playing");
}

function applyMoPosition(mo, stateName, mapId, x, y, facing, activity, visible = true) {
  mo.state = stateName;
  mo.mapId = mapId;
  mo.x = x;
  mo.y = y;
  mo.facing = facing;
  mo.activity = activity;
  mo.visible = visible;
  mo.interactable = visible;
  mo.companion = false;
  mo.ridingWithPlayer = false;
}

function applyRoutePosition(mo, stateName, mapId, route, progress, reverse, activity) {
  const routeProgress = reverse ? 1 - progress : progress;
  const point = getRoutePoint(route, routeProgress);
  const direction = reverse ? invertFacing(point.facing) : point.facing;
  applyMoPosition(mo, stateName, mapId, point.x, point.y, direction, activity);
}

function updateChurchService(minuteOfDay) {
  const service = runtime.churchService || {
    phase: "quiet",
    attendees: congregation,
    quietVisitors,
    activeCount: quietVisitors.length,
    posture: "seated",
    priest: {
      id: CHURCH_LAYOUT.priest.id,
      name: CHURCH_LAYOUT.priest.name,
      x: CHURCH_LAYOUT.priest.x,
      y: CHURCH_LAYOUT.priest.y,
      width: 24,
      height: 46,
      color: "#f1f0e5",
      facing: CHURCH_LAYOUT.priest.facing,
      visible: false,
      interactable: false
    },
    isMassActive: false
  };

  if (minuteOfDay >= CHURCH_SERVICE_TIMES.gatheringStart && minuteOfDay < MINUTES.massStart) {
    applyServiceState(service, "gathering", 8, "walking", true, false);
  } else if (minuteOfDay >= MINUTES.massStart && minuteOfDay < MINUTES.massStart + 15) {
    applyServiceState(service, "massStanding", 20, "standing", true, true);
  } else if (minuteOfDay < MINUTES.massEnd - 15 && minuteOfDay >= MINUTES.massStart + 15) {
    applyServiceState(service, "massSeated", 24, "seated", true, true);
  } else if (minuteOfDay >= MINUTES.massEnd - 15 && minuteOfDay < MINUTES.massEnd) {
    applyServiceState(service, "massClosing", 20, "standing", true, true);
  } else if (minuteOfDay >= MINUTES.massEnd && minuteOfDay < MINUTES.congregationDepartEnd) {
    const remaining = Math.max(4, 20 - Math.floor((minuteOfDay - MINUTES.massEnd) * 3));
    applyServiceState(service, "departing", remaining, "walking", false, false);
  } else {
    applyServiceState(service, "quiet", quietVisitors.length, "seated", false, false);
  }

  runtime.churchService = service;
  return service;
}

function applyServiceState(service, phase, activeCount, posture, priestVisible, isMassActive) {
  service.phase = phase;
  service.activeCount = activeCount;
  service.posture = posture;
  service.priest.visible = priestVisible;
  service.priest.interactable = isMassActive;
  service.isMassActive = isMassActive;
}

function updateScheduledNpcLists(mo, service) {
  const exteriorList = scheduledNpcsByMap.hoanKiem;
  const interiorList = scheduledNpcsByMap.churchInterior;
  exteriorList.length = 0;
  interiorList.length = 0;

  if (mo && mo.visible && mo.mapId === MO_SCHEDULE.homeMapId) {
    exteriorList.push(mo);
  }

  if (mo && mo.visible && mo.mapId === MO_SCHEDULE.churchMapId) {
    interiorList.push(mo);
  }

  if (service.priest.visible) {
    interiorList.push(service.priest);
  }
}

function updateScheduledCollisionBlocks(mo, service) {
  const blocks = runtime.scheduledCollisionBlocks;
  blocks.length = 0;

  if (mo && !mo.companion && mo.visible && mo.mapId === MO_SCHEDULE.churchMapId) {
    blocks.push(createNpcCollisionBlock(mo));
  }

  if (service.priest.visible) {
    blocks.push(createNpcCollisionBlock(service.priest));
  }

  const attendees = service.phase === "quiet" ? service.quietVisitors : service.attendees;
  for (let index = 0; index < service.activeCount; index += 1) {
    blocks.push(createNpcCollisionBlock(attendees[index]));
  }
}

function createNpcCollisionBlock(npc) {
  return {
    mapId: MO_SCHEDULE.churchMapId,
    x: npc.x - 3,
    y: npc.y + 19,
    width: 22,
    height: 22
  };
}

function createRouteMetrics(points) {
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    totalLength += length;
    segments.push({ start, end, length, totalLength });
  }
  return { points, segments, totalLength };
}

function getRoutePoint(route, progress) {
  const targetDistance = Math.max(0, Math.min(1, progress)) * route.totalLength;
  let previousTotal = 0;
  for (const segment of route.segments) {
    if (targetDistance <= segment.totalLength) {
      const localProgress = segment.length ? (targetDistance - previousTotal) / segment.length : 0;
      const x = segment.start.x + (segment.end.x - segment.start.x) * localProgress;
      const y = segment.start.y + (segment.end.y - segment.start.y) * localProgress;
      return {
        x: Math.round(x),
        y: Math.round(y),
        facing: getFacing(segment.end.x - segment.start.x, segment.end.y - segment.start.y)
      };
    }
    previousTotal = segment.totalLength;
  }

  const last = route.points[route.points.length - 1];
  const beforeLast = route.points[route.points.length - 2] || last;
  return {
    x: last.x,
    y: last.y,
    facing: getFacing(last.x - beforeLast.x, last.y - beforeLast.y)
  };
}

function normalizeRange(value, start, end) {
  return Math.max(0, Math.min(1, (value - start) / Math.max(1, end - start)));
}

function getFacing(dx, dy) {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy >= 0 ? "down" : "up";
}

function invertFacing(facing) {
  return ({ up: "down", down: "up", left: "right", right: "left" })[facing] || "down";
}

function getMoDialogue(stateName) {
  if (stateName === "washing") {
    return "Hôm nay trời đẹp, quần áo chắc mau khô. Mình giặt nốt chỗ này đã.";
  }
  if (stateName === "resting") {
    return "Mình nghỉ một chút rồi lát nữa lại ra với mấy đứa nhỏ.";
  }
  if (stateName === "walkingToChurch" || stateName === "enteringChurch") {
    return "Sắp đến giờ lễ rồi, mình phải vào nhà thờ.";
  }
  if (stateName === "attendingMass") {
    return "Mình đang dự lễ, lát nữa nói chuyện nhé.";
  }
  if (stateName === "leavingChurch" || stateName === "returningToChildren") {
    return "Lễ xong rồi, mình lại ra chơi với mấy đứa nhỏ.";
  }
  return "Mấy đứa nhỏ hôm nay vui quá. Bạn có muốn chơi cùng bọn trẻ không?";
}

function getPreciseMinuteOfDay() {
  const total = Math.max(0, Number(state.gameTime.totalGameMinutes) || 0);
  return total % GAME_MINUTES_PER_DAY;
}
