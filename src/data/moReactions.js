export const MO_RELATIONSHIP_MIN = 0;
export const MO_RELATIONSHIP_MAX = 100;

export const MO_RELATIONSHIP_DEFAULTS = Object.freeze({
  trust: 0,
  suspicion: 0
});

export const moStoryChoiceRelationshipRules = Object.freeze([
  rule("origin-stay", "originChoice", "stay", { trust: 12 }, "mo_choice_stay"),
  rule("origin-investigate", "originChoice", "investigate", { suspicion: 12 }, "mo_choice_investigate"),
  rule("chapter2-trust", "chapter2RelationshipChoice", "trust", { trust: 15 }, "mo_choice_trust"),
  rule("chapter2-truth", "chapter2RelationshipChoice", "truth", { suspicion: 15 }, "mo_choice_truth")
]);

export const moQuestRelationshipRules = Object.freeze([
  Object.freeze({
    id: "helped-lost-tourist",
    questId: "lostTourist",
    outcomes: Object.freeze(["excellent", "good"]),
    relationship: Object.freeze({ trust: 10 }),
    reactionId: "mo_helped_tourist"
  })
]);

export const moContextualReactions = Object.freeze([
  reaction(
    "mo_choice_stay",
    "Nghe bạn nói muốn thử sống ở đây, mình thấy nhẹ lòng hơn một chút.",
    "smile"
  ),
  reaction(
    "mo_choice_investigate",
    "Bạn muốn biết sự thật đến vậy sao? Mình sẽ giúp, nhưng vẫn có vài điều khiến mình băn khoăn.",
    "suspect"
  ),
  reaction(
    "mo_choice_trust",
    "Cảm ơn bạn. Mình sẽ cố để sự tin tưởng ấy không bị đặt nhầm chỗ.",
    "smile"
  ),
  reaction(
    "mo_choice_truth",
    "Bạn để ý kỹ thật đấy... Mình chưa thể kể hết mọi chuyện lúc này.",
    "suspect"
  ),
  reaction(
    "mo_helped_tourist",
    "Mình nghe chuyện bạn giúp người du khách rồi. Bạn tốt bụng hơn vẻ ngoài đấy.",
    "smile"
  ),
  reaction(
    "mo_attitude_trusting",
    "Dạo này mình thấy nói chuyện với bạn dễ hơn trước.",
    "smile"
  ),
  reaction(
    "mo_attitude_cautious",
    "Mình vẫn muốn giúp bạn, nhưng có lẽ chúng ta cần hiểu nhau thêm một chút.",
    "suspect"
  )
]);

function rule(id, key, value, relationship, reactionId) {
  return Object.freeze({
    id,
    key,
    value,
    relationship: Object.freeze(relationship),
    reactionId
  });
}

function reaction(id, text, expression) {
  return Object.freeze({ id, speaker: "Mơ", text, expression });
}
