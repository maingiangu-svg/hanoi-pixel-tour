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
  hudObjective: document.getElementById("hudObjective"),
  vehicleStatus: document.getElementById("vehicleStatus"),
  nearbyHint: document.getElementById("nearbyHint"),
  dialogueBox: document.getElementById("dialogueBox"),
  dialogueText: document.getElementById("dialogueText"),
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
  characterConfirm: document.getElementById("characterConfirm")
};

export function createDefaultState() {
  return {
    currentMapId: "hoanKiem",
    player: { x: 610, y: 1370 },
    profile: { gender: null },
    vehicle: { owned: false, type: "vinfast-electric", equipped: false, status: "stored", parkedAt: null },
    gameTime: { day: 1, hour: 7, minute: 0, totalGameMinutes: 420, paused: false, pauseReasons: [] },
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
  mapTransitionStartedAt: 0,
  scheduledMo: null,
  churchService: null,
  scheduledCollisionBlocks: [],
  moCompanionNpc: null,
  moCompanionHydrated: false,
  lastVehicleRestrictionId: null,
  lastVehicleRestrictionAt: 0
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
