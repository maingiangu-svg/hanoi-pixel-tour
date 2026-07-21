import { camera } from "../camera.js";
import { getNpcPortrait, isCinematicDialogueNpc, resolveNpcPortraitId } from "../data/npcPortraits.js";
import { keys, runtime, state, ui } from "../state.js";
import { setCutsceneAudioDucking } from "./audioManager.js";
import { pauseGameClock, resumeGameClock } from "./gameClock.js";
import { closeAllOverlays } from "./modal.js";
import { clearDialogueBackgroundCache } from "../render/renderDialogueBackground.js";

const CLOCK_PAUSE_REASON = "cinematic-dialogue";
const INPUT_DEBOUNCE_MS = 160;
const TRANSITION_MS = 220;
const UI_TOGGLE_HINT_MS = 1800;
let initialized = false;

export function initDialogueView() {
  if (initialized) return;
  initialized = true;
  ui.cutsceneChoices?.addEventListener("click", handleChoiceClick);
}

export function enterDialogueView(npcOrId, options = {}) {
  if (isDialogueViewActive() || runtime.cutscene?.active) return false;
  const profileId = options.profileId || resolveNpcPortraitId(npcOrId);
  const profile = getNpcPortrait(profileId);
  if (!profile) return false;
  const lines = normalizeLines(options.lines, options, profile);
  if (!lines.length) return false;

  closeAllOverlays();
  clearGameplayKeys();
  runtime.nearbyInteractable = null;
  ui.nearbyHint?.classList.add("hidden");
  ui.dialogueBox?.classList.add("hidden");
  clearDialogueBackgroundCache();

  const now = performance.now();
  runtime.dialogueView = {
    active: true,
    phase: "opening",
    openedAt: now,
    transitionStartedAt: now,
    lastTimestamp: now,
    lastAdvanceAt: now - INPUT_DEBOUNCE_MS,
    npcId: typeof npcOrId === "string" ? npcOrId : npcOrId?.id,
    npc: typeof npcOrId === "object" ? npcOrId : null,
    profileId,
    profile,
    mapId: options.mapId || state.currentMapId,
    mapKind: options.mapKind || null,
    lines,
    lineIndex: 0,
    selectedIndex: -1,
    uiHidden: false,
    uiHintUntil: now + UI_TOGGLE_HINT_MS,
    lastUiToggleAt: now - INPUT_DEBOUNCE_MS,
    expression: options.expression || lines[0].expression || "neutral",
    pose: options.pose || lines[0].pose || "idle",
    cameraShot: options.cameraShot || lines[0].cameraShot || "medium",
    kind: lines[0].kind || "speech",
    allowExit: options.allowExit !== false,
    onComplete: typeof options.onComplete === "function" ? options.onComplete : null,
    pendingAfterClose: null,
    cancelled: false,
    originCamera: { x: camera.x, y: camera.y, lastMapId: camera.lastMapId },
    inspect: options.inspect || null
  };

  ui.gameFrame?.classList.add("is-dialogue-view");
  setDialogueViewUiHiddenClass(false);
  pauseGameClock(CLOCK_PAUSE_REASON);
  setCutsceneAudioDucking(options.audioDuck ?? 0.38, 0.28);
  renderDialogueViewUi();
  return true;
}

export function enterNpcDialogue(npcOrId, options = {}) {
  return enterDialogueView(npcOrId, options);
}

export function enterInspectView(item, options = {}) {
  if (!item?.id || !item?.description) return false;
  return enterDialogueView(options.hostNpcId || "oldWitness", {
    ...options,
    profileId: options.profileId || "oldWitness",
    inspect: { id: item.id, label: item.label || "Vật phẩm", kind: item.kind || "keepsake" },
    lines: [{
      kind: "narration",
      speaker: "",
      text: item.description,
      expression: "neutral",
      cameraShot: "wide"
    }]
  });
}

export function updateDialogueView(timestamp = performance.now()) {
  const view = runtime.dialogueView;
  if (!view?.active) return false;
  view.lastTimestamp = timestamp;
  if (view.phase === "opening" && timestamp - view.transitionStartedAt >= TRANSITION_MS) {
    view.phase = "active";
  }
  if (view.phase === "closing" && timestamp - view.transitionStartedAt >= TRANSITION_MS) {
    finalizeDialogueView();
  }
  return true;
}

export function exitDialogueView({ immediate = false, cancelled = false } = {}) {
  const view = runtime.dialogueView;
  if (!view?.active) return false;
  view.cancelled = Boolean(cancelled);
  if (immediate) {
    finalizeDialogueView();
    return true;
  }
  if (view.phase === "closing") return true;
  view.phase = "closing";
  view.transitionStartedAt = performance.now();
  hideDialogueViewUi();
  return true;
}

export function hydrateDialogueView() {
  hideDialogueViewUi();
  ui.gameFrame?.classList.remove("is-dialogue-view");
  setDialogueViewUiHiddenClass(false);
  runtime.dialogueView = null;
  resumeGameClock(CLOCK_PAUSE_REASON);
  setCutsceneAudioDucking(1, 0.05);
  clearDialogueBackgroundCache();
  return true;
}

export function isDialogueViewActive() {
  return Boolean(runtime.dialogueView?.active);
}

export function setNpcExpression(expressionId) {
  const view = runtime.dialogueView;
  if (!view?.active || !view.profile?.expressions?.includes(expressionId)) return false;
  view.expression = expressionId;
  return true;
}

export function setDialogueCameraShot(shotId) {
  const view = runtime.dialogueView;
  if (!view?.active || !["wide", "medium", "close", "left", "right"].includes(shotId)) return false;
  view.cameraShot = shotId;
  return true;
}

export function handleDialogueViewKey(key) {
  const view = runtime.dialogueView;
  if (!view?.active) return false;
  if (view.phase !== "active") return true;
  if (key === "tab") {
    toggleDialogueViewUi();
    return true;
  }
  if (key === "escape" && view.allowExit) {
    exitDialogueView({ cancelled: true });
    return true;
  }
  if (view.uiHidden) return true;
  if (["w", "arrowup", "s", "arrowdown"].includes(key) && currentLine(view)?.choices?.length) {
    moveDialogueSelection(key === "w" || key === "arrowup" ? -1 : 1);
    return true;
  }
  if (key === "enter" || key === " ") {
    advanceDialogueView();
    return true;
  }
  return true;
}

export function toggleDialogueViewUi() {
  const view = runtime.dialogueView;
  if (!view?.active || view.phase !== "active") return false;
  const now = performance.now();
  if (now - view.lastUiToggleAt < INPUT_DEBOUNCE_MS) return false;
  view.lastUiToggleAt = now;
  view.uiHidden = !view.uiHidden;
  view.uiHintUntil = now + UI_TOGGLE_HINT_MS;
  setDialogueViewUiHiddenClass(view.uiHidden);
  if (view.uiHidden) ui.cutsceneDialogue?.classList.add("hidden");
  else renderDialogueViewUi();
  return true;
}

export function advanceDialogueView() {
  const view = runtime.dialogueView;
  if (!view?.active || view.phase !== "active") return false;
  const now = performance.now();
  if (now - view.lastAdvanceAt < INPUT_DEBOUNCE_MS) return false;
  const line = currentLine(view);
  if (line?.choices?.length) {
    if (view.selectedIndex < 0) return false;
    const choice = line.choices[view.selectedIndex];
    if (!choice || choice.disabled) return false;
    view.lastAdvanceAt = now;
    applyChoice(view, choice);
    return true;
  }
  view.lastAdvanceAt = now;
  return moveToNextLine(view);
}

export function isNpcCinematicDialogueEnabled(npcOrId) {
  return isCinematicDialogueNpc(npcOrId);
}

export function getDialogueViewDebugState() {
  const view = runtime.dialogueView;
  if (!view?.active) return { active: false };
  return {
    active: true,
    phase: view.phase,
    npcId: view.npcId,
    profileId: view.profileId,
    mapId: view.mapId,
    lineIndex: view.lineIndex,
    selectedIndex: view.selectedIndex,
    uiHidden: view.uiHidden,
    uiHintVisible: performance.now() < view.uiHintUntil,
    expression: view.expression,
    cameraShot: view.cameraShot,
    kind: view.kind
  };
}

function moveDialogueSelection(delta) {
  const view = runtime.dialogueView;
  const choices = currentLine(view)?.choices || [];
  if (!choices.length) return false;
  let next = view.selectedIndex < 0 ? (delta > 0 ? 0 : choices.length - 1) : view.selectedIndex;
  for (let attempts = 0; attempts < choices.length; attempts += 1) {
    if (view.selectedIndex >= 0 || attempts > 0) next = (next + delta + choices.length) % choices.length;
    if (!choices[next].disabled) break;
  }
  view.selectedIndex = next;
  renderDialogueViewUi();
  return true;
}

function applyChoice(view, choice) {
  if (typeof choice.onSelect === "function") choice.onSelect(choice);
  if (typeof choice.afterClose === "function") view.pendingAfterClose = choice.afterClose;
  if (choice.expression) setNpcExpression(choice.expression);
  if (choice.pose) view.pose = choice.pose;
  if (choice.cameraShot) setDialogueCameraShot(choice.cameraShot);

  if (choice.response) {
    const response = normalizeLine(
      typeof choice.response === "string"
        ? { text: choice.response, expression: choice.expression, pose: choice.pose, cameraShot: choice.cameraShot }
        : choice.response,
      view.profile
    );
    view.lines.splice(view.lineIndex + 1, 0, response);
    moveToNextLine(view);
    return;
  }
  exitDialogueView();
}

function moveToNextLine(view) {
  if (view.lineIndex + 1 >= view.lines.length) {
    exitDialogueView();
    return true;
  }
  view.lineIndex += 1;
  view.selectedIndex = -1;
  applyCurrentLinePresentation(view);
  renderDialogueViewUi();
  return true;
}

function applyCurrentLinePresentation(view) {
  const line = currentLine(view);
  view.kind = line.kind;
  if (line.expression && view.profile.expressions.includes(line.expression)) view.expression = line.expression;
  if (line.pose) view.pose = line.pose;
  if (line.cameraShot) view.cameraShot = line.cameraShot;
}

function finalizeDialogueView() {
  const view = runtime.dialogueView;
  if (!view) return;
  const shouldRunActions = !view.cancelled;
  const pendingAfterClose = shouldRunActions ? view.pendingAfterClose : null;
  const onComplete = shouldRunActions ? view.onComplete : null;
  camera.x = view.originCamera?.x ?? camera.x;
  camera.y = view.originCamera?.y ?? camera.y;
  camera.lastMapId = view.originCamera?.lastMapId ?? camera.lastMapId;
  runtime.dialogueView = null;
  ui.gameFrame?.classList.remove("is-dialogue-view");
  setDialogueViewUiHiddenClass(false);
  hideDialogueViewUi();
  clearDialogueBackgroundCache();
  resumeGameClock(CLOCK_PAUSE_REASON);
  setCutsceneAudioDucking(1, 0.45);
  clearGameplayKeys();
  if (typeof pendingAfterClose === "function") pendingAfterClose();
  else if (typeof onComplete === "function") onComplete();
}

function renderDialogueViewUi() {
  const view = runtime.dialogueView;
  const line = currentLine(view);
  if (!view?.active || !line || !ui.cutsceneDialogue) return;
  if (view.uiHidden) {
    ui.cutsceneDialogue.classList.add("hidden");
    return;
  }
  ui.cutsceneDialogue.className = `cutscene-dialogue is-${line.kind} is-cinematic-dialogue`;
  ui.cutsceneKind.textContent = line.kind === "internal"
    ? "Độc thoại nội tâm"
    : line.kind === "narration" ? "Quan sát" : "Hội thoại trực tiếp";
  ui.cutsceneSpeaker.textContent = line.kind === "narration" ? "" : (line.speaker || view.profile.name);
  ui.cutsceneSpeaker.classList.toggle("hidden", !ui.cutsceneSpeaker.textContent);
  ui.cutsceneText.textContent = line.text;
  ui.cutsceneChoices.innerHTML = "";
  (line.choices || []).forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.dialogueChoiceIndex = String(index);
    button.className = index === view.selectedIndex ? "is-selected" : "";
    button.disabled = Boolean(choice.disabled);
    button.textContent = choice.text;
    ui.cutsceneChoices.appendChild(button);
  });
  ui.cutsceneHint.textContent = line.choices?.length
    ? "W/S hoặc ↑/↓: Chọn · Enter: Xác nhận · Esc: Rời"
    : "Enter/Space: Tiếp tục · Esc: Rời";
  ui.cutsceneDialogue.classList.remove("hidden");
}

function hideDialogueViewUi() {
  if (!runtime.cutscene?.active) ui.cutsceneDialogue?.classList.add("hidden");
  if (!runtime.cutscene?.active && ui.cutsceneChoices) ui.cutsceneChoices.innerHTML = "";
}

function handleChoiceClick(event) {
  const button = event.target.closest("button[data-dialogue-choice-index]");
  const view = runtime.dialogueView;
  if (!button || !view?.active || view.phase !== "active" || view.uiHidden) return;
  const index = Number(button.dataset.dialogueChoiceIndex);
  if (!Number.isInteger(index) || currentLine(view)?.choices?.[index]?.disabled) return;
  view.selectedIndex = index;
  renderDialogueViewUi();
  advanceDialogueView();
}

function normalizeLines(lines, options, profile) {
  const source = Array.isArray(lines) && lines.length
    ? lines
    : [{
      kind: options.kind,
      speaker: options.speaker,
      text: options.text,
      expression: options.expression,
      pose: options.pose,
      cameraShot: options.cameraShot,
      choices: options.choices
    }];
  return source.map((line) => normalizeLine(line, profile)).filter((line) => line.text);
}

function normalizeLine(line, profile) {
  const kind = ["speech", "internal", "narration"].includes(line?.kind) ? line.kind : "speech";
  return {
    kind,
    speaker: kind === "narration" ? "" : (line?.speaker || profile.name),
    text: String(line?.text || ""),
    expression: profile.expressions.includes(line?.expression) ? line.expression : "neutral",
    pose: line?.pose || "idle",
    cameraShot: line?.cameraShot || "medium",
    choices: Array.isArray(line?.choices)
      ? line.choices.filter((choice) => choice?.text).map((choice) => ({ ...choice, text: String(choice.text) }))
      : []
  };
}

function currentLine(view) {
  return view?.lines?.[view.lineIndex] || null;
}

function clearGameplayKeys() {
  Object.keys(keys).forEach((key) => { keys[key] = false; });
}

function setDialogueViewUiHiddenClass(hidden) {
  document.body?.classList?.toggle("is-dialogue-view-ui-hidden", Boolean(hidden));
}
