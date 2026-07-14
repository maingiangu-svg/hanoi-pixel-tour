import { ui } from "../state.js";

const SETTINGS_KEY = "hanoiPixelTourAudioSettingsV1";
const FADE_SECONDS = 1.15;
const LAYER_NAMES = ["base", "traffic", "crowd", "nature", "landmark", "weather"];
const DEFAULT_SETTINGS = Object.freeze({
  soundEnabled: true,
  masterVolume: 0.48,
  ambienceVolume: 0.42,
  effectsVolume: 0.52
});

let settings = loadSettings();
let audioContext = null;
let masterGain = null;
let ambienceGain = null;
let layerNodes = null;
let initialized = false;
let unlocked = false;
let targetLayers = createSilentTargets();

export function initAudioManager() {
  if (initialized) return;
  initialized = true;

  document.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
  document.addEventListener("keydown", unlockAudio, { once: true });
  wireSettingsUi();
  renderSettingsUi();
}

export function setAudioTargets(nextTargets, fadeSeconds = FADE_SECONDS) {
  LAYER_NAMES.forEach((name) => {
    targetLayers[name] = clamp01(nextTargets?.[name] || 0);
  });
  if (unlocked) applyTargets(fadeSeconds);
}

export function updateAudioTargets(nextTargets) {
  setAudioTargets(nextTargets, 0.35);
}

export function playBellChime() {
  if (!unlocked || !settings.soundEnabled || !audioContext || !masterGain) return;

  const now = audioContext.currentTime;
  [0, 0.34].forEach((delay, index) => {
    const oscillator = audioContext.createOscillator();
    const toneGain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(index ? 392 : 330, now + delay);
    oscillator.frequency.exponentialRampToValueAtTime(index ? 330 : 277, now + delay + 1.3);
    toneGain.gain.setValueAtTime(0.0001, now + delay);
    toneGain.gain.exponentialRampToValueAtTime(0.055 * settings.effectsVolume, now + delay + 0.035);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.45);
    oscillator.connect(toneGain).connect(masterGain);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 1.5);
  });
}

export function playVehicleHorn() {
  if (!unlocked || !settings.soundEnabled || !audioContext || !masterGain) return;

  const now = audioContext.currentTime;
  const hornGain = audioContext.createGain();
  hornGain.gain.setValueAtTime(0.0001, now);
  hornGain.gain.exponentialRampToValueAtTime(0.07 * settings.effectsVolume, now + 0.015);
  hornGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
  hornGain.connect(masterGain);

  [214, 267].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = index ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency - 12, now + 0.17);
    oscillator.connect(hornGain);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  });
}

export function playCameraShutter() {
  if (!unlocked || !settings.soundEnabled || !audioContext || !masterGain) return;

  const now = audioContext.currentTime;
  const shutterGain = audioContext.createGain();
  shutterGain.gain.setValueAtTime(0.0001, now);
  shutterGain.gain.linearRampToValueAtTime(0.055 * settings.effectsVolume, now + 0.006);
  shutterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  shutterGain.connect(masterGain);

  [860, 430].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.055);
    oscillator.connect(shutterGain);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + index * 0.055 + 0.045);
  });
}

export function playTrainPassCue() {
  if (!unlocked || !settings.soundEnabled || !audioContext || !masterGain) return;
  const now = audioContext.currentTime;
  [0, 0.22, 0.44].forEach((delay, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index % 2 ? "square" : "triangle";
    oscillator.frequency.setValueAtTime(112 - index * 9, now + delay);
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.026 * settings.effectsVolume, now + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.17);
    oscillator.connect(gain).connect(masterGain);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.19);
  });
}

export function getAudioSettings() {
  return { ...settings };
}

export function updateAudioSetting(name, value) {
  if (!(name in DEFAULT_SETTINGS)) return;
  settings = {
    ...settings,
    [name]: name === "soundEnabled" ? Boolean(value) : clamp01(Number(value))
  };
  saveSettings();
  renderSettingsUi();
  applyMasterVolumes(0.2);
}

export function isAudioSettingsOpen() {
  return Boolean(ui.settingsPanel && !ui.settingsPanel.classList.contains("hidden"));
}

export function openAudioSettings() {
  if (!ui.settingsPanel) return;
  ui.settingsPanel.classList.remove("hidden");
  renderSettingsUi();
}

export function closeAudioSettings() {
  if (ui.settingsPanel) ui.settingsPanel.classList.add("hidden");
}

export function toggleAudioSettings() {
  if (isAudioSettingsOpen()) closeAudioSettings();
  else openAudioSettings();
}

async function unlockAudio() {
  if (unlocked) return;
  document.removeEventListener("pointerdown", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return;

  try {
    audioContext = new AudioContextCtor();
    buildAudioGraph();
    if (audioContext.state === "suspended") await audioContext.resume();
    unlocked = true;
    applyMasterVolumes(0.05);
    applyTargets(0.35);
  } catch (_error) {
    audioContext = null;
    masterGain = null;
    layerNodes = null;
  }
}

function buildAudioGraph() {
  masterGain = audioContext.createGain();
  ambienceGain = audioContext.createGain();
  masterGain.gain.value = 0;
  ambienceGain.gain.value = settings.ambienceVolume;
  ambienceGain.connect(masterGain).connect(audioContext.destination);

  const noiseBuffer = createNoiseBuffer(audioContext, 4);
  layerNodes = Object.create(null);
  const filters = {
    base: ["lowpass", 420, 0.45],
    traffic: ["lowpass", 240, 0.7],
    crowd: ["bandpass", 680, 0.35],
    nature: ["bandpass", 2100, 0.65],
    landmark: ["bandpass", 360, 1.1],
    weather: ["highpass", 980, 0.4]
  };

  LAYER_NAMES.forEach((name, index) => {
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    const config = filters[name];
    source.buffer = noiseBuffer;
    source.loop = true;
    source.playbackRate.value = 0.82 + index * 0.035;
    filter.type = config[0];
    filter.frequency.value = config[1];
    filter.Q.value = config[2];
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(ambienceGain);
    source.start();
    layerNodes[name] = gain;
  });
}

function createNoiseBuffer(context, seconds) {
  const sampleRate = context.sampleRate;
  const buffer = context.createBuffer(1, sampleRate * seconds, sampleRate);
  const channel = buffer.getChannelData(0);
  let seed = 17391;
  let previous = 0;
  for (let index = 0; index < channel.length; index += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const white = (seed / 4294967295) * 2 - 1;
    previous = previous * 0.82 + white * 0.18;
    channel[index] = previous * 0.48;
  }
  return buffer;
}

function applyTargets(fadeSeconds) {
  if (!layerNodes || !audioContext) return;
  const now = audioContext.currentTime;
  const layerScale = {
    base: 0.07,
    traffic: 0.075,
    crowd: 0.055,
    nature: 0.035,
    landmark: 0.035,
    weather: 0.105
  };
  LAYER_NAMES.forEach((name) => {
    const gain = layerNodes[name].gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(targetLayers[name] * layerScale[name], now + Math.max(0.03, fadeSeconds));
  });
}

function applyMasterVolumes(fadeSeconds) {
  if (!audioContext || !masterGain || !ambienceGain) return;
  const now = audioContext.currentTime;
  const masterTarget = settings.soundEnabled ? settings.masterVolume : 0;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value, now);
  masterGain.gain.linearRampToValueAtTime(masterTarget, now + fadeSeconds);
  ambienceGain.gain.cancelScheduledValues(now);
  ambienceGain.gain.setValueAtTime(ambienceGain.gain.value, now);
  ambienceGain.gain.linearRampToValueAtTime(settings.ambienceVolume, now + fadeSeconds);
}

function wireSettingsUi() {
  ui.audioSettingsButton?.addEventListener("click", openAudioSettings);
  ui.closeSettings?.addEventListener("click", closeAudioSettings);
  ui.soundEnabled?.addEventListener("change", (event) => updateAudioSetting("soundEnabled", event.target.checked));
  ui.masterVolume?.addEventListener("input", (event) => updateAudioSetting("masterVolume", Number(event.target.value) / 100));
  ui.ambienceVolume?.addEventListener("input", (event) => updateAudioSetting("ambienceVolume", Number(event.target.value) / 100));
  ui.effectsVolume?.addEventListener("input", (event) => updateAudioSetting("effectsVolume", Number(event.target.value) / 100));
}

function renderSettingsUi() {
  if (ui.soundEnabled) ui.soundEnabled.checked = settings.soundEnabled;
  setRangeUi(ui.masterVolume, ui.masterVolumeValue, settings.masterVolume);
  setRangeUi(ui.ambienceVolume, ui.ambienceVolumeValue, settings.ambienceVolume);
  setRangeUi(ui.effectsVolume, ui.effectsVolumeValue, settings.effectsVolume);
}

function setRangeUi(input, label, value) {
  if (input) input.value = String(Math.round(value * 100));
  if (label) label.textContent = `${Math.round(value * 100)}%`;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    return {
      soundEnabled: saved?.soundEnabled !== false,
      masterVolume: clamp01(Number(saved?.masterVolume ?? DEFAULT_SETTINGS.masterVolume)),
      ambienceVolume: clamp01(Number(saved?.ambienceVolume ?? DEFAULT_SETTINGS.ambienceVolume)),
      effectsVolume: clamp01(Number(saved?.effectsVolume ?? DEFAULT_SETTINGS.effectsVolume))
    };
  } catch (_error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_error) {
    // Audio preferences are optional; gameplay remains available without storage.
  }
}

function createSilentTargets() {
  return Object.fromEntries(LAYER_NAMES.map((name) => [name, 0]));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
