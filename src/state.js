import { createDefaultWeatherState } from "./data/weatherProfiles.js";
import { createDefaultStoryState } from "./data/storyState.js";

export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");

export const WORLD_WIDTH = canvas.width;
export const WORLD_HEIGHT = canvas.height;
export const SAVE_KEY = "hanoiPixelTourSaveV2";
export const BUS_PRICE = 7000;
export const QUIZ_REWARD = 10000;
export const CHECK_IN_REWARD = 5000;
export const NPC_REWARD = 20000;
export const AREA_REWARD = 30000;

ctx.imageSmoothingEnabled = false;

export const ui = {
  hudMapName: document.getElementById("hudMapName"),
  hudClock: document.getElementById("hudClock"),
  hudWeather: document.getElementById("hudWeather"),
  hudTimeScale: document.getElementById("hudTimeScale"),
  hudObjectiveCard: document.getElementById("hudObjectiveCard"),
  hudObjectiveLabel: document.getElementById("hudObjectiveLabel"),
  hudQuestName: document.getElementById("hudQuestName"),
  hudObjective: document.getElementById("hudObjective"),
  hudObjectiveMeta: document.getElementById("hudObjectiveMeta"),
  vehicleStatus: document.getElementById("vehicleStatus"),
  nearbyHint: document.getElementById("nearbyHint"),
  dialogueBox: document.getElementById("dialogueBox"),
  dialogueText: document.getElementById("dialogueText"),
  questCompletionContent: document.getElementById("questCompletionContent"),
  questCompletionName: document.getElementById("questCompletionName"),
  questCompletionSummary: document.getElementById("questCompletionSummary"),
  questCompletionRewards: document.getElementById("questCompletionRewards"),
  questCompletionNext: document.getElementById("questCompletionNext"),
  inventoryPanel: document.getElementById("inventoryPanel"),
  inventoryContent: document.getElementById("inventoryContent"),
  closeInventory: document.getElementById("closeInventory"),
  questPanel: document.getElementById("questPanel"),
  questContent: document.getElementById("questContent"),
  closeQuest: document.getElementById("closeQuest"),
  journalPanel: document.getElementById("journalPanel"),
  journalContent: document.getElementById("journalContent"),
  closeJournal: document.getElementById("closeJournal"),
  mapPanel: document.getElementById("mapPanel"),
  mapTitle: document.getElementById("mapTitle"),
  mapContent: document.getElementById("mapContent"),
  closeMap: document.getElementById("closeMap"),
  quizModal: document.getElementById("quizModal"),
  quizTag: document.getElementById("quizTag"),
  quizTitle: document.getElementById("quizTitle"),
  quizQuestion: document.getElementById("quizQuestion"),
  quizOptions: document.getElementById("quizOptions"),
  quizFeedback: document.getElementById("quizFeedback"),
  quizContinue: document.getElementById("quizContinue"),
  choiceModal: document.getElementById("choiceModal"),
  choiceTag: document.getElementById("choiceTag"),
  choiceTitle: document.getElementById("choiceTitle"),
  choiceBody: document.getElementById("choiceBody"),
  choiceActions: document.getElementById("choiceActions"),
  infoModal: document.getElementById("infoModal"),
  infoTag: document.getElementById("infoTag"),
  infoTitle: document.getElementById("infoTitle"),
  infoIntro: document.getElementById("infoIntro"),
  infoContent: document.getElementById("infoContent"),
  infoActions: document.getElementById("infoActions"),
  characterModal: document.getElementById("characterModal"),
  characterOptions: document.getElementById("characterOptions"),
  characterConfirm: document.getElementById("characterConfirm"),
  audioSettingsButton: document.getElementById("audioSettingsButton"),
  settingsPanel: document.getElementById("settingsPanel"),
  closeSettings: document.getElementById("closeSettings"),
  soundEnabled: document.getElementById("soundEnabled"),
  masterVolume: document.getElementById("masterVolume"),
  masterVolumeValue: document.getElementById("masterVolumeValue"),
  ambienceVolume: document.getElementById("ambienceVolume"),
  ambienceVolumeValue: document.getElementById("ambienceVolumeValue"),
  effectsVolume: document.getElementById("effectsVolume"),
  effectsVolumeValue: document.getElementById("effectsVolumeValue"),
  gameFrame: document.getElementById("gameFrame"),
  cutsceneDialogue: document.getElementById("cutsceneDialogue"),
  cutscenePortrait: document.getElementById("cutscenePortrait"),
  cutscenePortraitCanvas: document.getElementById("cutscenePortraitCanvas"),
  cutsceneKind: document.getElementById("cutsceneKind"),
  cutsceneSpeaker: document.getElementById("cutsceneSpeaker"),
  cutsceneText: document.getElementById("cutsceneText"),
  cutsceneChoices: document.getElementById("cutsceneChoices"),
  cutsceneHint: document.getElementById("cutsceneHint"),
  cutsceneContinue: document.getElementById("cutsceneContinue"),
  endingPanel: document.getElementById("endingPanel"),
  endingTitle: document.getElementById("endingTitle"),
  endingSubtitle: document.getElementById("endingSubtitle"),
  endingContent: document.getElementById("endingContent"),
  endingActions: document.getElementById("endingActions")
};

export function createDefaultState() {
  return {
    currentMapId: "hoanKiem",
    player: { x: 610, y: 1370 },
    profile: { gender: null },
    vehicle: { owned: false, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null },
    gameTime: { day: 1, hour: 7, minute: 0, totalGameMinutes: 420, paused: false, pauseReasons: [] },
    weather: createDefaultWeatherState(420),
    npcSchedules: { mo: { currentState: "washing", currentMap: "hoanKiem", x: 0, y: 0 } },
    moCompanion: {
      active: false,
      currentMap: null,
      x: 0,
      y: 0,
      facing: "down",
      followingPlayer: false,
      ridingWithPlayer: false,
      returnDestination: "nhaThoLon",
      pausedAt: null
    },
    photoAlbum: {
      photos: {},
      discoveredSpots: []
    },
    branchingQuestProgress: {},
    randomEvents: {
      active: {},
      cooldowns: {},
      completedFlags: {}
    },
    navigation: {
      trackedObjective: null,
      showWorldGuidance: true
    },
    story: createDefaultStoryState(),
    money: 50000,
    inventory: { foods: [], souvenirs: [], stamps: [], specialItems: [] },
    completedQuizzes: {},
    completedTasks: {},
    taskStages: {},
    visitedMaps: ["hoanKiem"],
    eatenFoods: [],
    discoveredFoods: [],
    discoveredLandmarks: [],
    freeReturnUsed: false,
    victoryShown: false
  };
}

export const keys = {};
export let state = createDefaultState();
export function setState(nextState) { state = nextState; }

export const runtime = {
  messageTimer: null,
  pendingMessage: null,
  questNotification: {
    activeId: null,
    queue: [],
    shownIds: new Set(),
    timer: null
  },
  hudObjectiveKey: "",
  hudObjectiveTimer: null,
  nearbyInteractable: null,
  activeQuiz: null,
  quizSelectedIndex: 0,
  choiceSelectedIndex: 0,
  infoSelectedIndex: 0,
  characterSelectedIndex: 0,
  characterSelection: { allowClose: false, firstTime: false },
  pendingVictory: false,
  lastSavedAt: 0,
  lastGameClockTimestamp: null,
  lastClockDisplay: "",
  gameClockTimeScale: 1,
  mapTransitionStartedAt: 0,
  scheduledMo: null,
  churchService: null,
  scheduledCollisionBlocks: [],
  eventCollisionBlocks: [],
  moCompanionNpc: null,
  moCompanionHydrated: false,
  lastVehicleRestrictionId: null,
  lastVehicleRestrictionAt: 0,
  vehicleTransition: null,
  vehicleToggleBlockedUntil: 0,
  playerMotionX: 0,
  playerMotionY: 0,
  playerMotionSpeed: 0,
  photoMode: {
    active: false,
    openedAt: 0
  },
  dialogueView: null,
  environmentInteraction: {
    active: false,
    id: null,
    type: null,
    mapId: null,
    interaction: null,
    origin: null,
    pose: null,
    startedAt: 0,
    allowPhoto: false,
    cameraFocus: null,
    companionPose: null,
    statusText: ""
  },
  viewMode: {
    active: false,
    viewpointId: null,
    profile: null,
    interaction: null,
    origin: null,
    yaw: 0,
    pitch: 0,
    targetYaw: 0,
    targetPitch: 0,
    openedAt: 0,
    lastTimestamp: 0,
    elapsedMs: 0
  },
  navigation: {
    resolvedObjective: null,
    route: [],
    routeKey: "",
    routeMode: "walking",
    currentRouteMapId: null,
    debugGraph: false
  },
  photoFlashUntil: 0,
  cutscene: null,
  chapter1: {
    active: false,
    lastTimestamp: 0,
    stage: null,
    mo: null,
    moInitialized: false
  },
  chapter2: {
    active: false,
    stage: null
  },
  chapter3: {
    active: false,
    stage: null,
    autoStage: null,
    mo: null
  },
  chapter4: {
    active: false,
    revealInProgress: false,
    portalWaiting: false,
    mo: null
  },
  finalEnding: {
    choiceStarted: false,
    endingStarted: false,
    summaryPending: false,
    summaryShown: false,
    selectedIndex: 0
  }
};

export const player = {
  x: 610,
  y: 1370,
  width: 24,
  height: 32,
  speed: 2.35,
  facing: "down",
  moving: false,
  step: 0
};
