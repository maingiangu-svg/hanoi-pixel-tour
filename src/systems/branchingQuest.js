import { snapCameraToPlayer } from "../camera.js";
import { branchingQuestActors, branchingQuestActorsById, branchingQuests } from "../data/branchingQuests.js";
import { maps } from "../data/maps.js";
import { player, state } from "../state.js";
import { saveGame } from "../storage.js";
import { addUnique, getPlayerCenter, placePlayerAtSafeStart } from "../utils/helpers.js";
import { isPlayerAreaWalkable } from "../utils/collision.js";
import { formatMoney } from "../utils/format.js";
import { beginMapTransition } from "./mapTransition.js";
import { closeChoiceModal, openChoiceModal, showMessage } from "./modal.js";
import { isMoCompanionActive, syncMoCompanionToPlayer } from "./moCompanion.js";
import { hydrateQuestFollower, startQuestFollower, updateQuestFollower } from "./questFollower.js";
import { enterNpcDialogue, isNpcCinematicDialogueEnabled } from "./dialogueView.js";

const ACTIVE_STATUSES = new Set(["active", "unresolved"]);

export function startBranchingQuest(questId) {
  const quest = branchingQuests[questId];
  if (!quest || !isQuestAvailable(quest)) {
    return null;
  }

  const existing = state.branchingQuestProgress[questId];
  if (existing) {
    return existing;
  }

  const progress = {
    status: "active",
    currentNodeId: quest.startNodeId,
    choices: [],
    choiceLabels: [],
    outcome: null,
    rewardClaimed: false,
    flags: {},
    activeObjective: createActiveObjective(quest, quest.startNodeId),
    relatedNpcIds: branchingQuestActors.filter((actor) => actor.questId === questId).map((actor) => actor.linkedNpcId || actor.id),
    objectiveProgress: { index: 0, completedIds: [] },
    follower: null,
    startedAt: state.gameTime.totalGameMinutes,
    completedAt: null
  };
  state.branchingQuestProgress[questId] = progress;
  saveGame();
  return progress;
}

export function getCurrentQuestNode(questId) {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId];
  return quest && progress ? quest.nodes[progress.currentNodeId] || null : null;
}

export function chooseQuestOption(questId, choiceId) {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId];
  const node = getCurrentQuestNode(questId);
  const selected = node?.choices?.find((choice) => choice.id === choiceId);
  if (!quest || !progress || !selected || !ACTIVE_STATUSES.has(progress.status)) {
    return false;
  }
  if (!meetsRequirement(selected.requires)) {
    showMessage(getRequirementMessage(selected.requires));
    return false;
  }
  if (!canApplyEffects(selected.effects || [])) {
    return false;
  }

  progress.choices.push(selected.id);
  progress.choiceLabels.push(selected.text);
  if (selected.nextNodeId) {
    advanceQuestNode(questId, selected.nextNodeId, { save: false });
  }
  applyEffects(questId, selected.effects || []);
  saveGame();
  return true;
}

export function advanceQuestNode(questId, nodeId, { save = true } = {}) {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId];
  if (!quest?.nodes[nodeId] || !progress || !ACTIVE_STATUSES.has(progress.status)) {
    return false;
  }
  progress.currentNodeId = nodeId;
  progress.status = "active";
  progress.activeObjective = createActiveObjective(quest, nodeId);
  progress.objectiveProgress = { index: 0, completedIds: [] };
  if (save) saveGame();
  return true;
}

export function completeQuestBranch(questId, outcome = "neutral") {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId];
  if (!quest || !progress || ["completed", "failed"].includes(progress.status)) {
    return false;
  }

  progress.status = outcome === "failed" ? "failed" : "completed";
  progress.outcome = outcome;
  progress.completedAt = state.gameTime.totalGameMinutes;
  progress.activeObjective = null;
  progress.follower = null;
  applyQuestConsequence(questId);

  let rewardText = "";
  if (!progress.rewardClaimed) {
    const reward = Number(quest.rewards?.[outcome]) || 0;
    if (reward > 0) {
      state.money += reward;
      rewardText = ` Bạn nhận ${formatMoney(reward)}.`;
    }
    grantOutcomeItems(quest.outcomeItems?.[outcome]);
    progress.rewardClaimed = true;
  }

  saveGame();
  showMessage(`${getOutcomeMessage(quest, outcome)}${rewardText}`);
  return true;
}

export function getQuestOutcome(questId) {
  return state.branchingQuestProgress[questId]?.outcome || null;
}

export function hasChosenQuestOption(questId, choiceId) {
  return Boolean(state.branchingQuestProgress[questId]?.choices?.includes(choiceId));
}

export function applyQuestConsequence(questId) {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId];
  if (!quest || !progress) return false;
  if (quest.consequenceFlag) progress.flags[quest.consequenceFlag] = progress.outcome || true;
  return true;
}

export function openBranchingQuest(questId, options = {}) {
  const quest = branchingQuests[questId];
  const progress = state.branchingQuestProgress[questId] || startBranchingQuest(questId);
  const actor = options.actor || null;
  if (!quest || !progress) {
    showMessage("Nhiệm vụ này chưa thể bắt đầu lúc này.");
    return false;
  }

  if (progress.status === "completed" || progress.status === "failed") {
    showActorDialogue(actor, getConsequenceDialogue(questId, progress), "happy");
    return true;
  }

  const node = getCurrentQuestNode(questId);
  if (!node) return false;
  if (node.type !== "choice") {
    showActorDialogue(actor, node.hint || "Hãy tiếp tục mục tiêu hiện tại.", "concerned");
    return true;
  }

  if (actor && isNpcCinematicDialogueEnabled(actor)) {
    return enterNpcDialogue(actor, {
      text: getChoiceBody(node),
      expression: "neutral",
      pose: "gesture",
      choices: node.choices.map((entry) => ({
        text: entry.text,
        disabled: !meetsRequirement(entry.requires),
        expression: getBranchChoiceExpression(entry.id),
        afterClose: () => {
          if (entry.confirm) {
            openChoiceConfirmation(questId, entry);
            return;
          }
          if (chooseQuestOption(questId, entry.id)) openNextNodeOrHint(questId, actor);
        }
      })).concat({ text: "Để sau" })
    });
  }

  openChoiceModal({
    tag: "Nhiệm vụ có lựa chọn",
    title: node.title || quest.title,
    body: getChoiceBody(node),
    actions: node.choices.map((entry) => ({
      label: entry.text,
      disabled: !meetsRequirement(entry.requires),
      className: entry.id === node.choices[0].id ? "primary-choice" : "",
      onClick: () => {
        closeChoiceModal();
        if (entry.confirm) {
          openChoiceConfirmation(questId, entry);
          return;
        }
        if (chooseQuestOption(questId, entry.id)) {
          openNextNodeOrHint(questId);
        }
      }
    })).concat({ label: "Để sau", onClick: closeChoiceModal })
  });
  return true;
}

export function getBranchingQuestInteractables(mapId = state.currentMapId) {
  return getVisibleBranchingQuestActors(mapId).map((actor) => ({
    type: "branchingQuest",
    source: actor,
    object: actor,
    point: {
      id: actor.id,
      x: actor.x + actor.width / 2,
      y: actor.y + actor.height - 4,
      radius: actor.radius || 62,
      visibleRange: actor.visibleRange || 180,
      labelOffsetX: 0,
      labelOffsetY: -42
    },
    priority: 1,
    range: actor.radius || 62
  }));
}

export function getVisibleBranchingQuestActors(mapId = state.currentMapId) {
  return branchingQuestActors
    .filter((actor) => actor.render !== false && actor.mapId === mapId && isActorVisible(actor))
    .map(resolveActorPosition);
}

export function handleBranchingLinkedNpc(npc) {
  const actor = branchingQuestActors.find((candidate) => candidate.linkedNpcId === npc?.id);
  return actor ? handleBranchingQuestActor(actor) : false;
}

export function handleBranchingQuestActor(actor) {
  const quest = branchingQuests[actor.questId];
  let progress = state.branchingQuestProgress[actor.questId];
  if (!quest) return false;
  if (!progress) {
    if (!actor.start) return false;
    startBranchingQuest(actor.questId);
    openBranchingQuest(actor.questId, { actor });
    return true;
  }
  if (progress.status === "completed" || progress.status === "failed") {
    showActorDialogue(actor, getConsequenceDialogue(actor.questId, progress), "happy");
    return true;
  }

  const node = getCurrentQuestNode(actor.questId);
  if (node?.type === "choice") {
    openBranchingQuest(actor.questId, { actor });
    return true;
  }
  if (consumeActorObjective(actor.questId, actor.id)) {
    return true;
  }
  showActorDialogue(actor, node?.hint || "Chúng ta sẽ nói tiếp sau nhé.", "concerned");
  return true;
}

export function updateBranchingQuests() {
  Object.entries(state.branchingQuestProgress).forEach(([questId, progress]) => {
    if (!ACTIVE_STATUSES.has(progress.status)) return;
    updateQuestFollower(progress);
    updateWorldObjective(questId, progress);
  });
}

export function hydrateBranchingQuests() {
  state.branchingQuestProgress ||= {};
  Object.entries(state.branchingQuestProgress).forEach(([questId, progress]) => {
    if (!branchingQuests[questId] || !progress || typeof progress !== "object") {
      delete state.branchingQuestProgress[questId];
      return;
    }
    hydrateQuestFollower(progress);
  });
}

export function getActiveBranchingQuestEntries() {
  return Object.entries(state.branchingQuestProgress)
    .filter(([questId]) => branchingQuests[questId])
    .map(([questId, progress]) => {
      const quest = branchingQuests[questId];
      const node = quest.nodes[progress.currentNodeId];
      return {
        id: questId,
        title: quest.title,
        description: quest.description,
        status: progress.status,
        outcome: progress.outcome,
        choice: progress.choiceLabels?.[0] || "Chưa chọn cách giải quyết",
        objective: progress.status === "completed" || progress.status === "failed"
          ? getOutcomeLabel(progress.outcome)
          : (node?.hint || "Hãy nói chuyện với NPC liên quan."),
        hint: getObjectiveHint(node?.objective, progress)
      };
    });
}

export function getActiveBranchingObjective() {
  const active = getActiveBranchingQuestEntries().find((entry) => ACTIVE_STATUSES.has(entry.status));
  return active ? `${active.title}: ${active.objective}` : "";
}

export function notifyBranchingQuestMapTransition(targetMapId, method) {
  Object.entries(state.branchingQuestProgress).forEach(([questId, progress]) => {
    if (!ACTIVE_STATUSES.has(progress.status)) return;
    const objective = getCurrentQuestNode(questId)?.objective;
    if (objective?.type === "transport" && objective.mapId === targetMapId && objective.method === method) {
      completeCurrentObjective(questId);
    }
  });
}

export function handleMoQuestInteraction(npc = null) {
  if (npc && ["walkingToChurch", "enteringChurch", "attendingMass", "leavingChurch"].includes(npc.state)) {
    return false;
  }
  const childProgress = state.branchingQuestProgress.childToy;
  const childObjective = getCurrentQuestNode("childToy")?.objective;
  if (ACTIVE_STATUSES.has(childProgress?.status) && childObjective?.type === "talkToMo") {
    completeCurrentObjective("childToy");
    return true;
  }
  return false;
}

export function openMoDestinationQuest() {
  if (!isMoCompanionActive()) {
    showMessage("Mơ chỉ chọn điểm đến khi đang đi chơi cùng bạn.");
    return false;
  }
  if (state.branchingQuestProgress.moDestination?.status === "completed") {
    showMessage("Mơ: Chuyến ghé vừa rồi vui thật. Giờ mình đi dạo thêm nhé.");
    return true;
  }
  return openBranchingQuest("moDestination");
}

export function notifyMoReturned() {
  const progress = state.branchingQuestProgress.moDestination;
  if (ACTIVE_STATUSES.has(progress?.status)) {
    completeQuestBranch("moDestination", "neutral");
  }
}

function openChoiceConfirmation(questId, entry) {
  openChoiceModal({
    tag: "Xác nhận lựa chọn",
    title: "Bạn đã cân nhắc kỹ?",
    body: "Lựa chọn này sẽ kết thúc nhiệm vụ mà không có phần thưởng.",
    actions: [
      { label: "Xác nhận", className: "primary-choice", onClick: () => { closeChoiceModal(); chooseQuestOption(questId, entry.id); } },
      { label: "Quay lại", onClick: () => { closeChoiceModal(); openBranchingQuest(questId); } }
    ]
  });
}

function showActorDialogue(actor, text, expression = "neutral") {
  if (actor && isNpcCinematicDialogueEnabled(actor)) {
    return enterNpcDialogue(actor, { text, expression });
  }
  showMessage(text);
  return true;
}

function getBranchChoiceExpression(choiceId) {
  if (/decline|keep|skip|wrong/i.test(choiceId)) return "concerned";
  if (/escort|help|return|find|share/i.test(choiceId)) return "happy";
  return "curious";
}

function openNextNodeOrHint(questId, actor = null) {
  const progress = state.branchingQuestProgress[questId];
  if (!progress || !ACTIVE_STATUSES.has(progress.status)) return;
  const node = getCurrentQuestNode(questId);
  if (node?.type === "choice") openBranchingQuest(questId, { actor });
  else if (node?.hint) showActorDialogue(actor, node.hint, "concerned");
}

function consumeActorObjective(questId, actorId) {
  const progress = state.branchingQuestProgress[questId];
  const node = getCurrentQuestNode(questId);
  const objective = node?.objective;
  if (!objective) return false;
  if (objective.type === "interactActor" && objective.actorId === actorId) {
    const notBefore = Number(progress.flags[objective.notBeforeFlag]) || 0;
    if (notBefore && state.gameTime.totalGameMinutes < notBefore) {
      showMessage("Du khách đang hỏi thêm người quanh phố. Hãy quay lại sau ít phút trong game.");
      return true;
    }
    completeCurrentObjective(questId);
    return true;
  }
  if (objective.type === "actorSequence") {
    const index = progress.objectiveProgress?.index || 0;
    if (objective.actorIds[index] !== actorId) {
      showMessage(`Hãy làm theo thứ tự. Bước tiếp theo: ${branchingQuestActorsById[objective.actorIds[index]]?.name || "điểm được đánh dấu"}.`);
      return true;
    }
    progress.objectiveProgress.index = index + 1;
    addUnique(progress.objectiveProgress.completedIds, actorId);
    if (progress.objectiveProgress.index >= objective.actorIds.length) completeCurrentObjective(questId);
    else {
      saveGame();
      const nextName = branchingQuestActorsById[objective.actorIds[progress.objectiveProgress.index]]?.name || "điểm tiếp theo";
      showMessage(`Đã xong bước này. Tiếp theo: ${nextName}.`);
    }
    return true;
  }
  return false;
}

function updateWorldObjective(questId, progress) {
  const node = getCurrentQuestNode(questId);
  const objective = node?.objective;
  if (!objective) return;
  const center = getPlayerCenter();
  if (objective.type === "reachPoint" && state.currentMapId === objective.mapId && Math.hypot(center.x - objective.x, center.y - objective.y) <= objective.radius) {
    completeCurrentObjective(questId);
  }
  if (objective.type === "photo" && hasCapturedPhoto(objective.spotId)) {
    completeCurrentObjective(questId);
  }
  if (objective.type === "routePoints" && state.currentMapId === objective.mapId) {
    const index = progress.objectiveProgress.index || 0;
    const point = objective.points[index];
    if (point && Math.hypot(center.x - point.x, center.y - point.y) <= 92) {
      progress.objectiveProgress.index = index + 1;
      if (progress.objectiveProgress.index >= objective.points.length) completeCurrentObjective(questId);
      else {
        saveGame();
        showMessage(`Đoàn đã tới điểm ${progress.objectiveProgress.index}/${objective.points.length}. Tiếp tục theo lộ trình.`);
      }
    }
  }
}

function completeCurrentObjective(questId) {
  const node = getCurrentQuestNode(questId);
  if (!node || node.type !== "objective") return false;
  applyEffects(questId, node.onComplete || []);
  saveGame();
  if (ACTIVE_STATUSES.has(state.branchingQuestProgress[questId]?.status)) openNextNodeOrHint(questId);
  return true;
}

function applyEffects(questId, effects) {
  const progress = state.branchingQuestProgress[questId];
  if (!progress) return;
  const terminalEffects = [];
  effects.forEach((effect) => {
    if (["complete", "completeByFlag"].includes(effect.type)) {
      terminalEffects.push(effect);
      return;
    }
    if (effect.type === "goTo") advanceQuestNode(questId, effect.nodeId, { save: false });
    if (effect.type === "setFlag") progress.flags[effect.key] = effect.value;
    if (effect.type === "incrementFlag") progress.flags[effect.key] = (Number(progress.flags[effect.key]) || 0) + effect.amount;
    if (effect.type === "setOutcome") { progress.outcome = effect.outcome; progress.status = effect.outcome === "unresolved" ? "unresolved" : progress.status; }
    if (effect.type === "waitMinutes") progress.flags[effect.key] = state.gameTime.totalGameMinutes + effect.amount;
    if (effect.type === "startFollower") startQuestFollower(progress, effect);
    if (effect.type === "spendMoney") state.money -= effect.amount;
    if (effect.type === "questTravel") movePlayerForQuest(effect);
  });
  terminalEffects.forEach((effect) => {
    if (effect.type === "complete") completeQuestBranch(questId, effect.outcome);
    if (effect.type === "completeByFlag") {
      const value = Number(progress.flags[effect.key]) || 0;
      completeQuestBranch(questId, value >= effect.minimum ? effect.passOutcome : effect.failOutcome);
    }
  });
}

function canApplyEffects(effects) {
  const cost = effects.filter((effect) => effect.type === "spendMoney").reduce((sum, effect) => sum + effect.amount, 0);
  if (cost > state.money) {
    showMessage(`Bạn cần ${formatMoney(cost)} để chọn cách này.`);
    return false;
  }
  return true;
}

function movePlayerForQuest(effect) {
  const map = maps[effect.mapId];
  if (!map) return;
  state.vehicle.equipped = false;
  state.vehicle.status = state.vehicle.parkedAt ? "parked" : "stored";
  state.currentMapId = effect.mapId;
  player.x = effect.x;
  player.y = effect.y;
  state.player.x = effect.x;
  state.player.y = effect.y;
  addUnique(state.visitedMaps, effect.mapId);
  if (!isPlayerAreaWalkable(player.x, player.y)) placePlayerAtSafeStart(effect.mapId);
  syncMoCompanionToPlayer({ force: true });
  snapCameraToPlayer();
  beginMapTransition();
}

function isActorVisible(actor) {
  const progress = state.branchingQuestProgress[actor.questId];
  if (!progress) return Boolean(actor.start) && isQuestAvailable(branchingQuests[actor.questId]);
  if (progress.status === "completed" || progress.status === "failed") {
    if (actor.hideWhenCompleted) return false;
    return Boolean(actor.start || (actor.completedFlag && progress.flags[actor.completedFlag]));
  }
  if (!ACTIVE_STATUSES.has(progress.status)) return false;
  if (actor.hideWhileFollower && progress.follower?.active) return false;
  if (progress.objectiveProgress?.completedIds?.includes(actor.id)) return false;
  return Boolean(actor.start || actor.nodes?.includes(progress.currentNodeId));
}

function resolveActorPosition(actor) {
  const progress = state.branchingQuestProgress[actor.questId];
  if (progress?.status === "completed" && actor.completedPosition && (!actor.completedPosition.flag || progress.flags[actor.completedPosition.flag])) {
    return { ...actor, x: actor.completedPosition.x, y: actor.completedPosition.y };
  }
  return actor;
}

function isQuestAvailable(quest) {
  return quest?.availability !== "moCompanion" || isMoCompanionActive();
}

function meetsRequirement(requirement) {
  if (!requirement) return true;
  if (requirement === "vehicleOwned") return Boolean(state.vehicle?.owned);
  if (requirement.startsWith("photo:")) return hasCapturedPhoto(requirement.slice(6));
  return true;
}

function getRequirementMessage(requirement) {
  return requirement === "vehicleOwned" ? "Bạn cần sở hữu xe máy điện VinFast để chọn cách này." : "Lựa chọn này chưa khả dụng.";
}

function grantOutcomeItems(items = {}) {
  Object.entries(items).forEach(([key, values]) => {
    if (!Array.isArray(values)) return;
    const targetKey = key === "foods" ? "specialItems" : key;
    const target = state.inventory[targetKey];
    if (!Array.isArray(target)) return;
    values.forEach((item) => addUnique(target, item));
  });
}

function getOutcomeMessage(quest, outcome) {
  const labels = {
    excellent: `Bạn đã hoàn thành “${quest.title}” theo cách rất chu đáo.`,
    good: `Bạn đã hoàn thành “${quest.title}”.`,
    neutral: `“${quest.title}” đã khép lại với một kết quả bình thường.`,
    declined: `Bạn đã từ chối “${quest.title}”.`,
    failed: `Cách giải quyết “${quest.title}” chưa thành công.`,
    unresolved: `“${quest.title}” vẫn chưa được giải quyết.`
  };
  return labels[outcome] || `Nhiệm vụ “${quest.title}” đã kết thúc.`;
}

function getChoiceBody(node) {
  if (!node.weatherAware) return node.body;
  const weather = state.weather?.type;
  if (["rain", "heavyRain", "drizzle"].includes(weather)) {
    return `${node.body}\nMưa đang tới, cô muốn thu xếp quầy nhanh nhưng các cách giúp khác vẫn khả dụng.`;
  }
  return `${node.body}\nTrời đang khô ráo; quán đông khách nên cô vẫn cần một tay giúp.`;
}

function getOutcomeLabel(outcome) {
  return { excellent: "Kết quả xuất sắc", good: "Kết quả tốt", neutral: "Kết quả bình thường", declined: "Đã từ chối", failed: "Chưa thành công", unresolved: "Chưa giải quyết" }[outcome] || "Đã kết thúc";
}

function getConsequenceDialogue(questId, progress) {
  if (questId === "lostTourist" && progress.flags.touristAtCathedral) return "Du khách: Cảm ơn bạn, nhờ bạn mà tôi tới đúng nơi rồi!";
  if (questId === "lostWallet" && progress.flags.walletOwnerThankful) return "Chủ chiếc ví: Tôi vẫn nhớ sự tử tế của bạn. Cảm ơn bạn nhiều lắm.";
  if (questId === "lostWallet" && progress.flags.keptWallet) return "Bác ngồi ghế: Hình như có người vẫn đang hỏi tìm một chiếc ví quanh đây.";
  if (questId === "teaVendorHelp" && progress.flags.teaVendorHelped) return "Cô Hương: Lần trước cháu giúp cô nhiều lắm. Ghé uống cốc trà nhé!";
  if (questId === "childToy" && progress.flags.childrenGreetPlayer) return "Bé Lan: A, bạn đã tìm đồ chơi giúp mình!";
  if (questId === "tourGroup" && progress.flags.guideRemembersPlayer) return "Hướng dẫn viên: Đoàn khách vẫn nhắc buổi tham quan hôm ấy đấy.";
  return getOutcomeMessage(branchingQuests[questId], progress.outcome);
}

function getObjectiveHint(objective, progress) {
  if (!objective) return "";
  if (objective.type === "actorSequence") return `Tiến độ ${progress.objectiveProgress.index || 0}/${objective.actorIds.length}`;
  if (objective.type === "routePoints") return `Lộ trình ${progress.objectiveProgress.index || 0}/${objective.points.length}`;
  if (objective.type === "photo") return hasCapturedPhoto(objective.spotId) ? "Ảnh phù hợp đã có trong Album." : "Mở chế độ ảnh tại điểm chụp được đánh dấu.";
  return "Theo dõi điểm nhiệm vụ có dấu chấm vàng trên bản đồ hiện tại.";
}

function hasCapturedPhoto(spotId) {
  return Boolean(state.photoAlbum?.photos?.[spotId]);
}

function createActiveObjective(quest, nodeId) {
  const node = quest.nodes[nodeId];
  return node ? { nodeId, type: node.type, objectiveType: node.objective?.type || null } : null;
}
