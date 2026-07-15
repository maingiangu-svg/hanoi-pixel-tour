#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  STORY_VERSION,
  createDefaultStoryState,
  normalizeStoryState
} from "../src/data/storyState.js";

const mapIds = ["hoanKiem", "baDinh", "longBien", "churchInterior"];

const fresh = createDefaultStoryState();
assert.equal(fresh.version, STORY_VERSION);
assert.equal(fresh.currentScene, "gender-selection");
assert.equal(fresh.introCompleted, false);

const legacy = normalizeStoryState(null, {
  profile: { gender: "male" },
  visitedMaps: ["hoanKiem", "baDinh"],
  money: 64000
}, mapIds);
assert.equal(legacy.introCompleted, true);
assert.deepEqual(legacy.unlockedMaps, mapIds);

const partialLegacy = normalizeStoryState({
  version: 1,
  currentScene: "legacy-tour",
  flags: { kept: true },
  unlockedMaps: []
}, {
  profile: { gender: "female" },
  visitedMaps: ["hoanKiem", "longBien"]
}, mapIds);
assert.equal(partialLegacy.introCompleted, true);
assert.deepEqual(partialLegacy.unlockedMaps, mapIds);
assert.equal(partialLegacy.flags.kept, true);

const modernIntro = normalizeStoryState({
  version: STORY_VERSION,
  introCompleted: false,
  currentScene: "immortalIntro",
  unlockedMaps: []
}, {
  profile: { gender: "female" },
  visitedMaps: ["hoanKiem"]
}, mapIds);
assert.equal(modernIntro.introCompleted, false);
assert.deepEqual(modernIntro.unlockedMaps, []);

const checkpoint = normalizeStoryState({
  version: STORY_VERSION,
  introCompleted: true,
  currentScene: "chapter-4",
  checkpoint: {
    sceneId: "chapter-4",
    checkpointId: "portal-awakening",
    cutsceneId: "chapter4-origin-reveal",
    chapter: 4,
    stepIndex: 24,
    active: true,
    sceneState: { portal: 1, storm: 0.8, animation: { type: "transient" } },
    visualState: { fadeColor: "#fff", fadeAlpha: 2, letterbox: 1, lightingAlpha: -1 },
    cameraState: { locked: true, focusX: 1900, focusY: 620, zoom: 9 }
  }
}, {}, mapIds).checkpoint;
assert.deepEqual(checkpoint.sceneState, { portal: 1, storm: 0.8 });
assert.equal(checkpoint.visualState.fadeAlpha, 1);
assert.equal(checkpoint.visualState.lightingAlpha, 0);
assert.deepEqual(checkpoint.cameraState, { locked: true, focusX: 1900, focusY: 620, zoom: 2.2 });

process.stdout.write("Story state tests: OK (fresh, legacy migration, checkpoint restore)\n");
