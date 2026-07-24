import {
  MO_RELATIONSHIP_DEFAULTS,
  MO_RELATIONSHIP_MAX,
  MO_RELATIONSHIP_MIN,
  moContextualReactions,
  moQuestRelationshipRules,
  moStoryChoiceRelationshipRules
} from "../data/moReactions.js";
import { state } from "../state.js";
import { saveGame } from "../storage.js";

const RELATIONSHIP_KEYS = Object.freeze(Object.keys(MO_RELATIONSHIP_DEFAULTS));

export function getMoRelationshipState() {
  return ensureMoRelationshipState().relationship;
}

export function recordMoStoryChoice(key, value, { save = true } = {}) {
  const rule = moStoryChoiceRelationshipRules.find((entry) => entry.key === key && entry.value === value);
  if (!rule) return false;
  return applyRelationshipRule(rule, { save });
}

export function recordMoQuestOutcome(questId, outcome, _progress, { save = true } = {}) {
  const rule = moQuestRelationshipRules.find((entry) => (
    entry.questId === questId && entry.outcomes.includes(outcome)
  ));
  if (!rule) return false;
  return applyRelationshipRule(rule, { save });
}

export function getPendingMoReaction() {
  const moState = ensureMoRelationshipState();
  const queuedId = moState.queue.find((reactionId) => (
    getReaction(reactionId) && !moState.seen.includes(reactionId)
  ));
  if (queuedId) return getReaction(queuedId);

  const { trust, suspicion } = moState.relationship;
  if (trust >= 10 && trust > suspicion && !moState.seen.includes("mo_attitude_trusting")) {
    return getReaction("mo_attitude_trusting");
  }
  if (suspicion >= 10 && suspicion >= trust && !moState.seen.includes("mo_attitude_cautious")) {
    return getReaction("mo_attitude_cautious");
  }
  return null;
}

export function markMoReactionShown(reactionId, { save = true } = {}) {
  if (!getReaction(reactionId)) return false;
  const moState = ensureMoRelationshipState();
  moState.queue = moState.queue.filter((id) => id !== reactionId);
  state.story.flags.moReactionQueue = moState.queue;
  if (!moState.seen.includes(reactionId)) moState.seen.push(reactionId);
  if (save) saveGame();
  return true;
}

export function getMoRelationshipDebugState() {
  const moState = ensureMoRelationshipState();
  return {
    relationship: { ...moState.relationship },
    appliedActions: Object.keys(moState.applied),
    pendingReaction: getPendingMoReaction()?.id || null,
    queuedReactions: [...moState.queue],
    playedReactions: [...moState.seen]
  };
}

function applyRelationshipRule(rule, { save }) {
  const moState = ensureMoRelationshipState();
  if (moState.applied[rule.id]) return false;

  RELATIONSHIP_KEYS.forEach((key) => {
    const amount = Number(rule.relationship[key]);
    if (!Number.isFinite(amount) || amount === 0) return;
    moState.relationship[key] = clampRelationship(Number(moState.relationship[key]) + amount);
  });
  moState.applied[rule.id] = true;
  if (rule.reactionId && !moState.seen.includes(rule.reactionId) && !moState.queue.includes(rule.reactionId)) {
    moState.queue.push(rule.reactionId);
  }
  if (save) saveGame();
  return true;
}

function ensureMoRelationshipState() {
  if (!state.story || typeof state.story !== "object") state.story = {};
  if (!state.story.moRelationship || typeof state.story.moRelationship !== "object") {
    state.story.moRelationship = { ...MO_RELATIONSHIP_DEFAULTS };
  }
  RELATIONSHIP_KEYS.forEach((key) => {
    const value = Number(state.story.moRelationship[key]);
    state.story.moRelationship[key] = clampRelationship(
      Number.isFinite(value) ? value : MO_RELATIONSHIP_DEFAULTS[key]
    );
  });
  if (!state.story.flags || typeof state.story.flags !== "object" || Array.isArray(state.story.flags)) {
    state.story.flags = {};
  }

  const applied = normalizeRecord(state.story.flags.moRelationshipApplied);
  const queue = normalizeStringList(state.story.flags.moReactionQueue);
  const seen = normalizeStringList(state.story.flags.moReactionsSeen);
  state.story.flags.moRelationshipApplied = applied;
  state.story.flags.moReactionQueue = queue;
  state.story.flags.moReactionsSeen = seen;
  return { relationship: state.story.moRelationship, applied, queue, seen };
}

function getReaction(reactionId) {
  return moContextualReactions.find((reaction) => reaction.id === reactionId) || null;
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((entry) => typeof entry === "string" && entry.length > 0)));
}

function clampRelationship(value) {
  return Math.max(MO_RELATIONSHIP_MIN, Math.min(MO_RELATIONSHIP_MAX, Number(value) || 0));
}

if (typeof window !== "undefined") {
  window.getMoRelationshipDebug = getMoRelationshipDebugState;
}
