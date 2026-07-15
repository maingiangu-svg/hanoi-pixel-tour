import { camera } from "../camera.js";
import { canvas, keys, player, runtime, state, ui } from "../state.js";
import { getCurrentMap } from "../utils/helpers.js";
import { setCutsceneAudioDucking, playCutsceneHeartbeat } from "./audioManager.js";
import { closeAllOverlays } from "./modal.js";
import { endEnvironmentInteraction, isEnvironmentInteractionActive } from "./environmentInteraction.js";
import { closePhotoMode, isPhotoModeActive } from "./photoMode.js";
import { pauseGameClock, resumeGameClock } from "./gameClock.js";
import {
  addMemoryClue,
  addStoryScore,
  clearStoryCheckpoint,
  getStoryState,
  listStoryFlagsForDebug,
  resetStoryForDebug,
  saveStoryCheckpoint,
  setStoryChoice,
  startStoryChapter
} from "./storyState.js";

const CUTSCENE_ADVANCE_DEBOUNCE_MS = 160;
const DEBUG_CUTSCENE_ID = "debug-cutscene";
const DEBUG_CUTSCENE_DEFINITION = Object.freeze({
  allowSkip: true,
  scene: Object.freeze({ renderer: "debug", state: Object.freeze({ checkpointMarker: null }) }),
  timeline: [
    { type: "letterbox", to: 1, duration: 180 },
    { type: "camera", entityId: "player", zoom: 1.35, duration: 300 },
    { type: "sceneState", patch: { checkpointMarker: "restored" } },
    { type: "checkpoint", checkpointId: "foundation-focus" },
    { type: "dialogue", kind: "narration", text: "Kiểm tra nền móng cutscene." },
    { type: "cameraRestore", duration: 300 },
    { type: "letterbox", to: 0, duration: 180 }
  ]
});
const definitions = new Map();
let initialized = false;

export function initCutsceneController() {
  if (initialized) return;
  initialized = true;
  registerCutscene(DEBUG_CUTSCENE_ID, DEBUG_CUTSCENE_DEFINITION);
  ui.cutsceneChoices?.addEventListener("click", handleChoiceClick);
  installDebugHelpers();
}

export function registerCutscene(cutsceneId, definition) {
  if (!isText(cutsceneId) || !definition || typeof definition !== "object") return false;
  definitions.set(cutsceneId, definition);
  return true;
}

export function startCutscene(cutsceneId, options = {}) {
  if (isCutsceneActive() || !isText(cutsceneId)) return false;
  const definition = options.definition || definitions.get(cutsceneId);
  if (!definition) return false;

  closeAllOverlays();
  if (isPhotoModeActive()) closePhotoMode();
  if (isEnvironmentInteractionActive()) endEnvironmentInteraction({ silent: true });
  clearGameplayKeys();
  runtime.nearbyInteractable = null;
  ui.nearbyHint?.classList.add("hidden");
  ui.dialogueBox?.classList.add("hidden");

  const previousStoryScene = getStoryState().currentScene;
  const initialVisual = definition.initialVisual || {};
  const checkpointState = options.checkpointState || {};
  const restoredVisual = checkpointState.visualState || {};
  const restoredCamera = checkpointState.cameraState || {};
  const timeline = Array.isArray(options.timeline) ? options.timeline : (definition.timeline || []);
  const resumeIndex = Number.isFinite(Number(options.resumeStepIndex))
    ? Math.max(0, Math.min(timeline.length, Math.floor(Number(options.resumeStepIndex))))
    : findResumeIndex(timeline, options.resumeCheckpointId);
  runtime.cutscene = {
    active: true,
    id: cutsceneId,
    timeline,
    stepIndex: resumeIndex,
    stepInitialized: false,
    stepEndsAt: 0,
    waitingForInput: false,
    allowSkip: options.allowSkip ?? definition.allowSkip ?? true,
    lastAdvanceAt: 0,
    startedAt: performance.now(),
    returnScene: options.returnScene || previousStoryScene,
    onComplete: options.onComplete || definition.onComplete || null,
    cueHandler: options.cueHandler || definition.cueHandler || null,
    clockPauseReason: options.clockPauseReason || definition.clockPauseReason || null,
    presentationClass: options.presentationClass || definition.presentationClass || null,
    dialogue: null,
    scene: createSceneRuntime(options.scene || definition.scene, checkpointState.sceneState),
    camera: {
      locked: Boolean(restoredCamera.locked),
      focusX: finiteOr(restoredCamera.focusX, camera.x + canvas.width / 2),
      focusY: finiteOr(restoredCamera.focusY, camera.y + canvas.height / 2),
      zoom: Math.max(1, Math.min(2.2, finiteOr(restoredCamera.zoom, 1))),
      tween: null,
      restoreAfterTween: false
    },
    visual: {
      fadeColor: restoredVisual.fadeColor || initialVisual.fadeColor || "#000000",
      fadeAlpha: clamp01(restoredVisual.fadeAlpha ?? initialVisual.fadeAlpha),
      fadeTween: null,
      letterbox: clamp01(restoredVisual.letterbox ?? initialVisual.letterbox),
      letterboxTween: null,
      lightingColor: restoredVisual.lightingColor || "#000000",
      lightingAlpha: clamp01(restoredVisual.lightingAlpha),
      lightingTween: null,
      shakeX: 0,
      shakeY: 0,
      shakeUntil: 0,
      shakeMagnitude: 0
    },
    suspicion: options.suspicion || null
  };

  ui.gameFrame?.classList.add("is-cutscene");
  if (runtime.cutscene.presentationClass) document.body.classList.add(runtime.cutscene.presentationClass);
  if (runtime.cutscene.clockPauseReason) pauseGameClock(runtime.cutscene.clockPauseReason);
  setCutsceneAudioDucking(options.audioDuck ?? 0.32, 0.35);
  saveStoryCheckpoint({
    sceneId: options.sceneId || cutsceneId,
    checkpointId: options.resumeCheckpointId || "start",
    cutsceneId,
    chapter: options.chapter ?? getStoryState().currentChapter,
    stepIndex: resumeIndex,
    ...captureCheckpointRuntime(runtime.cutscene),
    active: true
  });
  updateCutscene(performance.now());
  return true;
}

export function updateCutscene(timestamp) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return;

  updateCameraTween(cutscene, timestamp);
  updateVisualTweens(cutscene, timestamp);
  updateShake(cutscene, timestamp);

  if (cutscene.waitingForInput) return;
  if (cutscene.stepInitialized && timestamp < cutscene.stepEndsAt) return;
  if (cutscene.stepInitialized) {
    cutscene.stepIndex += 1;
    cutscene.stepInitialized = false;
  }

  let safety = 0;
  while (cutscene.active && !cutscene.waitingForInput && !cutscene.stepInitialized && safety < 24) {
    const step = cutscene.timeline[cutscene.stepIndex];
    if (!step) {
      endCutscene();
      return;
    }
    initializeStep(cutscene, step, timestamp);
    safety += 1;
  }
}

export function advanceCutscene() {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active || !cutscene.waitingForInput) return false;
  const now = performance.now();
  if (now - cutscene.lastAdvanceAt < CUTSCENE_ADVANCE_DEBOUNCE_MS) return false;

  const dialogue = cutscene.dialogue;
  if (dialogue?.choices?.length) {
    if (dialogue.selectedIndex < 0) return false;
    const choice = dialogue.choices[dialogue.selectedIndex];
    if (isText(choice.choiceKey)) {
      const previousValue = getStoryState().choices[choice.choiceKey];
      setStoryChoice(choice.choiceKey, choice.value ?? choice.id ?? choice.text, { save: false });
      if (previousValue === undefined && choice.scores && typeof choice.scores === "object") {
        Object.entries(choice.scores).forEach(([scoreType, amount]) => {
          addStoryScore(scoreType, amount, { save: false });
        });
      }
    }
    if (typeof choice.onSelect === "function") choice.onSelect(choice, dialogue.selectedIndex);
    saveStoryCheckpoint({
      sceneId: getStoryState().currentScene,
      checkpointId: `choice-${cutscene.stepIndex}`,
      cutsceneId: cutscene.id,
      chapter: getStoryState().currentChapter,
      stepIndex: cutscene.stepIndex + 1,
      ...captureCheckpointRuntime(cutscene),
      active: true
    });
  }

  cutscene.lastAdvanceAt = now;
  cutscene.waitingForInput = false;
  cutscene.dialogue = null;
  hideCutsceneDialogue();
  cutscene.stepIndex += 1;
  cutscene.stepInitialized = false;
  updateCutscene(now);
  return true;
}

export function skipCutscene() {
  if (!runtime.cutscene?.active || !runtime.cutscene.allowSkip) return false;
  endCutscene({ skipped: true });
  return true;
}

export function endCutscene({ skipped = false } = {}) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  const onComplete = cutscene.onComplete;

  hideCutsceneDialogue();
  ui.gameFrame?.classList.remove("is-cutscene");
  if (cutscene.presentationClass) document.body.classList.remove(cutscene.presentationClass);
  setCutsceneAudioDucking(1, 0.5);
  runtime.cutscene = null;
  if (cutscene.clockPauseReason) resumeGameClock(cutscene.clockPauseReason);
  getStoryState().currentScene = cutscene.returnScene;
  clearStoryCheckpoint({ save: false });
  clearGameplayKeys();
  if (typeof onComplete === "function") onComplete({ skipped });
  if (!runtime.cutscene?.active) clearStoryCheckpoint();
  return true;
}

export function isCutsceneActive() {
  return Boolean(runtime.cutscene?.active);
}

export function focusCameraOnEntity(entityId, options = {}) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  const entity = resolveEntity(entityId);
  if (!entity) return false;
  const target = getEntityCenter(entity);
  startCameraTween(cutscene, target.x, target.y, options.zoom ?? 1, options.duration ?? 500, {
    entityId: typeof entityId === "string" ? entityId : null,
    trackEntity: options.trackEntity !== false,
    restoreAfterTween: false
  });
  return true;
}

export function restoreGameplayCamera(options = {}) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  const target = getEntityCenter(player);
  startCameraTween(cutscene, target.x, target.y, 1, options.duration ?? 520, {
    trackEntity: false,
    restoreAfterTween: true
  });
  return true;
}

export function fadeScreen(type = "black", duration = 420, targetAlpha = 1) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  const now = performance.now();
  cutscene.visual.fadeColor = type === "white" ? "#ffffff" : "#000000";
  cutscene.visual.fadeTween = createTween(cutscene.visual.fadeAlpha, clamp01(targetAlpha), now, duration);
  return true;
}

export function shakeCamera(options = {}) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  const now = performance.now();
  cutscene.visual.shakeMagnitude = Math.max(1, Math.min(8, Number(options.magnitude) || 3));
  cutscene.visual.shakeUntil = now + Math.max(80, Number(options.duration) || 260);
  return true;
}

export function showCutsceneDialogue(entry = {}) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active || !ui.cutsceneDialogue) return false;
  const kind = ["speech", "internal", "narration"].includes(entry.kind) ? entry.kind : "speech";
  const choices = Array.isArray(entry.choices) ? entry.choices.filter((choice) => isText(choice?.text)) : [];
  cutscene.dialogue = {
    kind,
    speaker: kind === "narration" ? "" : (entry.speaker || (kind === "internal" ? "Mơ (nghĩ)" : "")),
    text: String(entry.text || ""),
    choices,
    selectedIndex: -1
  };
  cutscene.waitingForInput = true;
  renderCutsceneDialogue();
  return true;
}

export function showInternalThought(entry = {}) {
  return showCutsceneDialogue({ ...entry, kind: "internal", speaker: entry.speaker || "Mơ (nghĩ)" });
}

export function playMoSuspicionCutscene(options = {}) {
  const mo = resolveEntity("mo");
  if (!mo || isCutsceneActive()) return false;
  const thoughtLines = Array.isArray(options.thoughtLines) && options.thoughtLines.length
    ? options.thoughtLines
    : ["Có điều gì đó không khớp..."];
  const zoom = Math.max(1.6, Math.min(2, Number(options.zoom) || 1.8));
  const holdMs = Math.max(300, Number(options.holdMs) || 1800);
  const clueId = isText(options.clueId) ? options.clueId : null;
  const timeline = [
    { type: "letterbox", to: 1, duration: 260 },
    { type: "camera", entityId: "mo", zoom, duration: 520, trackEntity: true },
    ...thoughtLines.map((text) => ({ type: "dialogue", kind: "internal", speaker: "Mơ (nghĩ)", text })),
    { type: "wait", duration: holdMs },
    { type: "cameraRestore", duration: 520 },
    { type: "letterbox", to: 0, duration: 240 }
  ];

  const started = startCutscene(options.cutsceneId || `mo-suspicion-${clueId || "moment"}`, {
    definition: { timeline, allowSkip: true },
    timeline,
    allowSkip: true,
    sceneId: options.sceneId || "mo-suspicion",
    suspicion: { active: true, clueId, moEntity: mo, zoom },
    audioDuck: 0.2,
    onComplete: () => {
      if (clueId) addMemoryClue(clueId, { save: false });
      if (typeof options.onComplete === "function") options.onComplete();
    }
  });
  if (started) playCutsceneHeartbeat();
  return started;
}

export function handleCutsceneKey(key) {
  const cutscene = runtime.cutscene;
  if (!cutscene?.active) return false;
  if (["w", "arrowup", "s", "arrowdown"].includes(key) && cutscene.dialogue?.choices?.length) {
    const delta = key === "w" || key === "arrowup" ? -1 : 1;
    const count = cutscene.dialogue.choices.length;
    cutscene.dialogue.selectedIndex = cutscene.dialogue.selectedIndex < 0
      ? (delta > 0 ? 0 : count - 1)
      : (cutscene.dialogue.selectedIndex + delta + count) % count;
    renderCutsceneDialogue();
    return true;
  }
  if (key === "enter" || key === " ") return advanceCutscene();
  if (key === "escape") return skipCutscene();
  return true;
}

export function resumeCutsceneFromStoryCheckpoint() {
  const checkpoint = getStoryState().checkpoint;
  if (!checkpoint?.active) return false;
  const definition = checkpoint.cutsceneId ? definitions.get(checkpoint.cutsceneId) : null;
  if (!definition) {
    clearStoryCheckpoint();
    return false;
  }
  return startCutscene(checkpoint.cutsceneId, {
    definition,
    resumeCheckpointId: checkpoint.checkpointId,
    resumeStepIndex: checkpoint.stepIndex,
    sceneId: checkpoint.sceneId,
    chapter: checkpoint.chapter,
    checkpointState: checkpoint
  });
}

function initializeStep(cutscene, step, timestamp) {
  cutscene.stepInitialized = true;
  const duration = Math.max(0, Number(step.duration) || 0);
  cutscene.stepEndsAt = timestamp + duration;

  switch (step.type) {
    case "dialogue":
      showCutsceneDialogue(step);
      break;
    case "internal":
      showInternalThought(step);
      break;
    case "choiceDialogue": {
      const choiceValue = getStoryState().choices[step.choiceKey];
      const entry = step.entries?.[choiceValue] || step.fallback;
      if (entry) showCutsceneDialogue(entry);
      else {
        cutscene.stepIndex += 1;
        cutscene.stepInitialized = false;
      }
      break;
    }
    case "camera":
      focusCameraOnEntity(step.entityId || step.entity, step);
      break;
    case "cameraRestore":
      restoreGameplayCamera(step);
      break;
    case "fade":
      fadeScreen(step.color || step.mode, duration, step.to ?? 1);
      break;
    case "shake":
      shakeCamera(step);
      break;
    case "letterbox":
      cutscene.visual.letterboxTween = createTween(cutscene.visual.letterbox, clamp01(step.to), timestamp, duration);
      break;
    case "lighting":
      cutscene.visual.lightingColor = step.color || "#000000";
      cutscene.visual.lightingTween = createTween(cutscene.visual.lightingAlpha, clamp01(step.to), timestamp, duration);
      break;
    case "sceneState":
      if (cutscene.scene) {
        Object.assign(cutscene.scene.state, step.patch || {});
        if (step.animation) {
          cutscene.scene.state.animation = {
            type: step.animation,
            startedAt: timestamp,
            duration: Math.max(1, duration)
          };
        }
      }
      if (!duration) {
        cutscene.stepIndex += 1;
        cutscene.stepInitialized = false;
      }
      break;
    case "storyClue":
      if (step.clueId) addMemoryClue(step.clueId, { save: false });
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
    case "suspicion":
      if (step.active) {
        const moEntity = resolveEntity(step.entityId || "mo");
        cutscene.suspicion = {
          active: true,
          clueId: step.clueId || null,
          moEntity,
          zoom: Math.max(1.6, Math.min(2, Number(step.zoom) || 1.8))
        };
        setCutsceneAudioDucking(step.audioDuck ?? 0.2, 0.3);
        if (step.heartbeat) playCutsceneHeartbeat();
      } else {
        cutscene.suspicion = null;
        setCutsceneAudioDucking(step.audioDuck ?? 0.5, 0.4);
      }
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
    case "audioCue":
      if (typeof cutscene.cueHandler === "function") cutscene.cueHandler(step.cue, step);
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
    case "hold":
      cutscene.stepEndsAt = Number.POSITIVE_INFINITY;
      break;
    case "checkpoint":
      saveStoryCheckpoint({
        sceneId: step.sceneId || cutscene.id,
        checkpointId: step.checkpointId || `step-${cutscene.stepIndex}`,
        cutsceneId: cutscene.id,
        chapter: getStoryState().currentChapter,
        stepIndex: cutscene.stepIndex + 1,
        ...captureCheckpointRuntime(cutscene),
        active: true
      });
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
    case "npcAnimation":
      if (typeof step.apply === "function") step.apply(resolveEntity(step.entityId), step.animation);
      if (!duration) {
        cutscene.stepIndex += 1;
        cutscene.stepInitialized = false;
      }
      break;
    case "mapTransition":
      if (typeof step.transition === "function") step.transition(step.mapId, step);
      if (!duration) {
        cutscene.stepIndex += 1;
        cutscene.stepInitialized = false;
      }
      break;
    case "callback":
      if (typeof step.run === "function") step.run();
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
    case "wait":
      break;
    default:
      cutscene.stepIndex += 1;
      cutscene.stepInitialized = false;
      break;
  }
}

function startCameraTween(cutscene, targetX, targetY, zoom, duration, options = {}) {
  const now = performance.now();
  cutscene.camera.locked = true;
  cutscene.camera.restoreAfterTween = Boolean(options.restoreAfterTween);
  cutscene.camera.tween = {
    fromX: cutscene.camera.focusX,
    fromY: cutscene.camera.focusY,
    fromZoom: cutscene.camera.zoom,
    targetX,
    targetY,
    targetZoom: Math.max(1, Math.min(2.2, Number(zoom) || 1)),
    startedAt: now,
    duration: Math.max(1, Number(duration) || 1),
    entityId: options.entityId || null,
    trackEntity: Boolean(options.trackEntity)
  };
}

function updateCameraTween(cutscene, timestamp) {
  const tween = cutscene.camera.tween;
  if (!tween) return;
  if (tween.trackEntity && tween.entityId) {
    const entity = resolveEntity(tween.entityId);
    if (entity) {
      const center = getEntityCenter(entity);
      tween.targetX = center.x;
      tween.targetY = center.y;
    }
  }
  const progress = clamp01((timestamp - tween.startedAt) / tween.duration);
  const eased = easeInOut(progress);
  cutscene.camera.focusX = lerp(tween.fromX, tween.targetX, eased);
  cutscene.camera.focusY = lerp(tween.fromY, tween.targetY, eased);
  cutscene.camera.zoom = lerp(tween.fromZoom, tween.targetZoom, eased);
  if (progress >= 1) {
    cutscene.camera.tween = null;
    if (cutscene.camera.restoreAfterTween) {
      cutscene.camera.locked = false;
      cutscene.camera.restoreAfterTween = false;
    }
  }
}

function updateVisualTweens(cutscene, timestamp) {
  updateVisualTween(cutscene.visual, "fadeAlpha", "fadeTween", timestamp);
  updateVisualTween(cutscene.visual, "letterbox", "letterboxTween", timestamp);
  updateVisualTween(cutscene.visual, "lightingAlpha", "lightingTween", timestamp);
}

function updateVisualTween(visual, valueKey, tweenKey, timestamp) {
  const tween = visual[tweenKey];
  if (!tween) return;
  const progress = clamp01((timestamp - tween.startedAt) / tween.duration);
  visual[valueKey] = lerp(tween.from, tween.to, easeInOut(progress));
  if (progress >= 1) visual[tweenKey] = null;
}

function updateShake(cutscene, timestamp) {
  const visual = cutscene.visual;
  if (timestamp >= visual.shakeUntil) {
    visual.shakeX = 0;
    visual.shakeY = 0;
    return;
  }
  const phase = Math.floor(timestamp / 42);
  visual.shakeX = phase % 2 ? visual.shakeMagnitude : -visual.shakeMagnitude;
  visual.shakeY = phase % 3 ? 0 : Math.round(visual.shakeMagnitude / 2);
}

function renderCutsceneDialogue() {
  const dialogue = runtime.cutscene?.dialogue;
  if (!dialogue || !ui.cutsceneDialogue) return;
  ui.cutsceneDialogue.className = `cutscene-dialogue is-${dialogue.kind}`;
  ui.cutsceneKind.textContent = dialogue.kind === "internal"
    ? "Độc thoại nội tâm"
    : dialogue.kind === "narration" ? "Lời dẫn" : "Hội thoại";
  ui.cutsceneSpeaker.textContent = dialogue.speaker;
  ui.cutsceneSpeaker.classList.toggle("hidden", !dialogue.speaker);
  ui.cutsceneText.textContent = dialogue.text;
  ui.cutsceneChoices.innerHTML = "";
  dialogue.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.choiceIndex = String(index);
    button.className = index === dialogue.selectedIndex ? "is-selected" : "";
    button.textContent = choice.text;
    ui.cutsceneChoices.appendChild(button);
  });
  ui.cutsceneHint.textContent = dialogue.choices.length
    ? "W/S hoặc ↑/↓: Chọn · Enter: Xác nhận"
    : "Enter/Space: Tiếp tục";
  ui.cutsceneDialogue.classList.remove("hidden");
}

function hideCutsceneDialogue() {
  ui.cutsceneDialogue?.classList.add("hidden");
  if (ui.cutsceneChoices) ui.cutsceneChoices.innerHTML = "";
}

function handleChoiceClick(event) {
  const button = event.target.closest("button[data-choice-index]");
  const dialogue = runtime.cutscene?.dialogue;
  if (!button || !dialogue?.choices?.length) return;
  dialogue.selectedIndex = Number(button.dataset.choiceIndex);
  renderCutsceneDialogue();
  advanceCutscene();
}

function resolveEntity(entityOrId) {
  if (entityOrId && typeof entityOrId === "object") return entityOrId;
  if (entityOrId === "player") return player;
  if (entityOrId === "mo") {
    if (state.moCompanion?.active && runtime.moCompanionNpc) return runtime.moCompanionNpc;
    if (runtime.scheduledMo?.mapId === state.currentMapId || runtime.scheduledMo?.currentMap === state.currentMapId) {
      return runtime.scheduledMo;
    }
    return null;
  }
  const sceneEntity = runtime.cutscene?.scene?.entities?.find((entity) => entity.id === entityOrId);
  if (sceneEntity) return sceneEntity;
  const map = getCurrentMap();
  const collections = [map.npcs, map.ambientNpcs, map.landmarks, map.shops, map.vehicleShops];
  for (const collection of collections) {
    const entity = (collection || []).find((candidate) => candidate.id === entityOrId);
    if (entity) return entity;
  }
  return null;
}

function getEntityCenter(entity) {
  return {
    x: Number(entity.x || 0) + Number(entity.width || 24) / 2,
    y: Number(entity.y || 0) + Number(entity.height || 40) * 0.38
  };
}

function findResumeIndex(timeline, checkpointId) {
  if (!checkpointId || checkpointId === "start") return 0;
  const index = timeline.findIndex((step) => step.type === "checkpoint" && step.checkpointId === checkpointId);
  return index >= 0 ? index + 1 : 0;
}

function clearGameplayKeys() {
  Object.keys(keys).forEach((key) => { keys[key] = false; });
}

function createSceneRuntime(scene, restoredState = null) {
  if (!scene || typeof scene !== "object") return null;
  return {
    ...scene,
    state: { ...(scene.state || {}), ...(restoredState || {}) }
  };
}

function captureCheckpointRuntime(cutscene) {
  const sceneState = { ...(cutscene?.scene?.state || {}) };
  delete sceneState.animation;
  return {
    sceneState,
    visualState: {
      fadeColor: cutscene?.visual?.fadeColor || "#000000",
      fadeAlpha: clamp01(cutscene?.visual?.fadeAlpha),
      letterbox: clamp01(cutscene?.visual?.letterbox),
      lightingColor: cutscene?.visual?.lightingColor || "#000000",
      lightingAlpha: clamp01(cutscene?.visual?.lightingAlpha)
    },
    cameraState: {
      locked: Boolean(cutscene?.camera?.locked),
      focusX: finiteOr(cutscene?.camera?.focusX, 0),
      focusY: finiteOr(cutscene?.camera?.focusY, 0),
      zoom: Math.max(1, Math.min(2.2, finiteOr(cutscene?.camera?.zoom, 1)))
    }
  };
}

function installDebugHelpers() {
  window.startCutsceneForDebug = (id = DEBUG_CUTSCENE_ID) => {
    if (!definitions.has(id)) {
      registerCutscene(id, DEBUG_CUTSCENE_DEFINITION);
    }
    return startCutscene(id);
  };
  window.startChapterForDebug = (id) => startStoryChapter(id);
  window.playMoSuspicionForDebug = (clueId = "debug-mo-suspicion") => playMoSuspicionCutscene({
    clueId,
    thoughtLines: ["Mình vừa nhận ra điều gì đó..."]
  });
  window.resetStoryForDebug = resetStoryForDebug;
  window.listStoryFlagsForDebug = listStoryFlagsForDebug;
}

function createTween(from, to, startedAt, duration) {
  return { from, to, startedAt, duration: Math.max(1, Number(duration) || 1) };
}

function easeInOut(value) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function isText(value) {
  return typeof value === "string" && value.length > 0;
}

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}
