import assert from "node:assert/strict";

const classList = { add() {}, remove() {}, toggle() {}, contains() { return false; } };
const element = () => ({
  classList,
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
const context = {
  imageSmoothingEnabled: false,
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 1,
  globalAlpha: 1,
  fillRect() {},
  strokeRect() {},
  clearRect() {},
  save() {},
  restore() {},
  translate() {},
  scale() {},
  beginPath() {},
  moveTo() {},
  lineTo() {},
  stroke() {},
  setLineDash() {},
  fillText() {},
  measureText(text) { return { width: String(text).length * 7 }; }
};
const canvas = {
  ...element(),
  width: 1280,
  height: 720,
  getContext() { return context; },
  getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; }
};

globalThis.document = {
  hidden: false,
  addEventListener() {},
  getElementById(id) { return id === "gameCanvas" ? canvas : element(); }
};
globalThis.window = { confirm() { return true; }, addEventListener() {}, devicePixelRatio: 1 };
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.performance = globalThis.performance || { now: () => 0 };

const { maps } = await import("../src/data/maps.js");
const { state } = await import("../src/state.js");
const { normalizeState } = await import("../src/storage.js");
const { pauseGameClock, resumeGameClock, updateGameClock } = await import("../src/systems/gameClock.js");
const {
  getAmbientVehicleSpeedMultiplier,
  getPlayerVehicleSpeedMultiplier,
  getSurfaceWetness,
  getWeatherIntensity,
  getWeatherType,
  setWeather,
  transitionToWeather,
  updateWeather
} = await import("../src/systems/weather.js");
const { getActiveMapNpcs, getScheduledChildCount, updateWorldSchedules } = await import("../src/systems/worldSchedule.js");
const { drawRainOverlay, drawWeatherAtmosphere, drawWetSurfaceEffects } = await import("../src/render/renderWeather.js");

function setGameMinute(value) {
  state.gameTime.totalGameMinutes = value;
  state.gameTime.day = Math.floor(value / 1440) + 1;
  state.gameTime.hour = Math.floor((value % 1440) / 60);
  state.gameTime.minute = Math.floor(value % 60);
}

setGameMinute(420);
setWeather("clear", 300);
updateWeather();
assert.equal(getWeatherType(), "clear");
assert.equal(getWeatherIntensity(), 0);
assert.equal(getSurfaceWetness(), 0);

setWeather("cloudy", 180);
assert.equal(getWeatherType(), "cloudy");
assert.equal(getWeatherIntensity(), 0);

setWeather("drizzle", 180);
setGameMinute(450);
updateWeather();
assert(getWeatherIntensity() > 0.2 && getWeatherIntensity() < 0.4);
assert(getSurfaceWetness() > 0);

setWeather("rain", 120);
setGameMinute(480);
updateWeather();
assert(getWeatherIntensity() >= 0.6);
assert(getSurfaceWetness() > 0.2);

setWeather("heavyRain", 60);
setGameMinute(510);
updateWeather();
assert.equal(getWeatherIntensity(), 1);
assert.equal(getAmbientVehicleSpeedMultiplier(), 0.84);
assert.equal(getPlayerVehicleSpeedMultiplier(), 0.9);

state.currentMapId = "hoanKiem";
updateWorldSchedules();
assert.equal(getScheduledChildCount(18 * 60 + 30), 0);
assert(!getActiveMapNpcs(maps.hoanKiem).some((npc) => npc.activity === "danceGroup"));

const wetAtRainEnd = getSurfaceWetness();
setWeather("clear", 240);
setGameMinute(570);
updateWeather();
assert(getSurfaceWetness() < wetAtRainEnd);
assert(getSurfaceWetness() > 0);

setWeather("cloudy", 200);
const pausedType = getWeatherType();
const pausedWetness = getSurfaceWetness();
const pausedMinute = state.gameTime.totalGameMinutes;
pauseGameClock("weather-test");
updateGameClock(1000);
updateGameClock(61000);
updateWeather();
updateWeather();
assert.equal(state.gameTime.totalGameMinutes, pausedMinute);
assert.equal(getWeatherType(), pausedType);
assert.equal(getSurfaceWetness(), pausedWetness);
resumeGameClock("weather-test");

assert.equal(transitionToWeather("rain"), true);
setGameMinute(state.weather.startedAtGameMinute + state.weather.durationGameMinutes);
updateWeather();
assert.equal(getWeatherType(), "rain");
drawWeatherAtmosphere(maps.hoanKiem);
drawWetSurfaceEffects(maps.hoanKiem);
drawRainOverlay(maps.hoanKiem);
for (const mapId of ["baDinh", "longBien"]) {
  drawWeatherAtmosphere(maps[mapId]);
  drawWetSurfaceEffects(maps[mapId]);
  drawRainOverlay(maps[mapId]);
}

const restored = normalizeState({
  money: 88000,
  gameTime: { totalGameMinutes: 1000 },
  weather: {
    type: "rain",
    intensity: 0.62,
    startedAtGameMinute: 940,
    durationGameMinutes: 120,
    nextWeatherType: "drizzle",
    transitionProgress: 0,
    surfaceWetness: 0.73,
    lastUpdatedAtGameMinute: 1000
  }
});
assert.equal(restored.money, 88000);
assert.equal(restored.weather.type, "rain");
assert.equal(restored.weather.surfaceWetness, 0.73);

const oldSave = normalizeState({ money: 77000, gameTime: { totalGameMinutes: 420 } });
assert.equal(oldSave.money, 77000);
assert.equal(oldSave.weather.type, "clear");

drawWeatherAtmosphere(maps.churchInterior);
drawWetSurfaceEffects(maps.churchInterior);
drawRainOverlay(maps.churchInterior);

process.stdout.write("Weather tests: OK\n");
