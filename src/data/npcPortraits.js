const EXPRESSIONS = Object.freeze({
  idle: Object.freeze({ eyes: "center", brows: "level", mouth: "flat", head: 0 }),
  neutral: Object.freeze({ eyes: "center", brows: "level", mouth: "flat", head: 0 }),
  smile: Object.freeze({ eyes: "soft", brows: "soft", mouth: "smile", head: -1 }),
  happy: Object.freeze({ eyes: "soft", brows: "raised", mouth: "smile", head: -1 }),
  gentleSmile: Object.freeze({ eyes: "soft", brows: "soft", mouth: "smile", head: -1 }),
  curious: Object.freeze({ eyes: "side", brows: "curious", mouth: "small", head: 2 }),
  concerned: Object.freeze({ eyes: "center", brows: "concerned", mouth: "small", head: 1 }),
  suspect: Object.freeze({ eyes: "side", brows: "suspicious", mouth: "flat", head: 2 }),
  suspicious: Object.freeze({ eyes: "side", brows: "suspicious", mouth: "flat", head: 2 }),
  worried: Object.freeze({ eyes: "down", brows: "concerned", mouth: "small", head: 1 }),
  surprised: Object.freeze({ eyes: "wide", brows: "raised", mouth: "open", head: 0 }),
  sad: Object.freeze({ eyes: "down", brows: "sad", mouth: "sad", head: 1 }),
  annoyed: Object.freeze({ eyes: "side", brows: "annoyed", mouth: "flat", head: -1 }),
  determined: Object.freeze({ eyes: "center", brows: "determined", mouth: "firm", head: 0 }),
  relieved: Object.freeze({ eyes: "soft", brows: "soft", mouth: "smile", head: 1 })
});

export const MO_DIALOGUE_EXPRESSIONS = Object.freeze([
  "idle", "smile", "worried", "surprised", "sad", "suspect"
]);

const MO_EXPRESSION_ALIASES = Object.freeze({
  idle: "idle",
  neutral: "idle",
  smile: "smile",
  happy: "smile",
  gentleSmile: "smile",
  relieved: "smile",
  worried: "worried",
  concerned: "worried",
  surprised: "surprised",
  sad: "sad",
  suspect: "suspect",
  suspicious: "suspect"
});

export const NPC_PORTRAITS = Object.freeze({
  mo: portrait({
    name: "Mơ",
    background: "lake",
    skin: "#f0ba91",
    skinShadow: "#c98267",
    hair: "#251b24",
    hairLight: "#50353f",
    top: "#4b7a6a",
    topShadow: "#294d46",
    accent: "#f0c95d",
    hairStyle: "long",
    seed: 3,
    expressions: [
      ...MO_DIALOGUE_EXPRESSIONS,
      "neutral", "gentleSmile", "curious", "suspicious", "determined", "relieved"
    ]
  }),
  teaSeller: portrait({
    name: "Cô bán trà đá",
    background: "teaStall",
    skin: "#d99b72",
    skinShadow: "#a96350",
    hair: "#2d2321",
    hairLight: "#5a4237",
    top: "#c7674d",
    topShadow: "#854536",
    accent: "#f2d878",
    hairStyle: "bun",
    seed: 7,
    expressions: ["neutral", "happy", "concerned", "surprised", "annoyed"]
  }),
  xeOm: portrait({
    name: "Chú xe ôm",
    background: "street",
    skin: "#c88a62",
    skinShadow: "#93573f",
    hair: "#272424",
    hairLight: "#514843",
    top: "#356e87",
    topShadow: "#214758",
    accent: "#f0bd45",
    hairStyle: "helmet",
    seed: 11,
    expressions: ["neutral", "happy", "concerned", "surprised", "annoyed"]
  }),
  priest: portrait({
    name: "Cha xứ",
    background: "church",
    skin: "#d8a27c",
    skinShadow: "#9d684f",
    hair: "#3b3532",
    hairLight: "#70655d",
    top: "#24262b",
    topShadow: "#111217",
    accent: "#f0eadb",
    hairStyle: "short",
    seed: 13,
    expressions: ["neutral", "gentleSmile", "concerned", "determined"]
  }),
  oldWitness: portrait({
    name: "Ông lão",
    background: "longBien",
    skin: "#bd8566",
    skinShadow: "#875346",
    hair: "#d2d0c7",
    hairLight: "#f0eadb",
    top: "#6f6657",
    topShadow: "#494238",
    accent: "#9db6aa",
    hairStyle: "elder",
    age: "elder",
    seed: 17,
    expressions: ["neutral", "gentleSmile", "concerned", "sad", "surprised"]
  }),
  guide: portrait({
    name: "Hướng dẫn viên",
    background: "temple",
    skin: "#dda27a",
    skinShadow: "#a76751",
    hair: "#302525",
    hairLight: "#59403b",
    top: "#b84e3d",
    topShadow: "#743127",
    accent: "#f4d369",
    hairStyle: "short",
    seed: 19,
    expressions: ["neutral", "happy", "curious", "concerned", "determined"]
  }),
  tourist: portrait({
    name: "Du khách",
    background: "lake",
    skin: "#e0ab83",
    skinShadow: "#aa6d55",
    hair: "#6b4935",
    hairLight: "#98705a",
    top: "#805b9e",
    topShadow: "#513d68",
    accent: "#8ccad0",
    hairStyle: "short",
    seed: 23,
    expressions: ["neutral", "happy", "concerned", "surprised", "worried"]
  }),
  storyChild: portrait({
    name: "Em nhỏ",
    background: "courtyard",
    skin: "#e5a77e",
    skinShadow: "#aa6b50",
    hair: "#30231f",
    hairLight: "#5a4035",
    top: "#d25a63",
    topShadow: "#8d3940",
    accent: "#f5d65d",
    hairStyle: "short",
    seed: 29,
    expressions: ["neutral", "happy", "concerned", "surprised", "sad"]
  })
});

const ID_ALIASES = Object.freeze({
  mo: "mo",
  chaXu: "priest",
  guideBaDinh: "guide",
  "chapter3-guide": "guide",
  "chapter3-old-witness": "oldWitness",
  oldWitness: "oldWitness",
  "arrival-tea-vendor": "teaSeller",
  "arrival-xe-om": "xeOm",
  lostTourist: "tourist",
  lostTouristStart: "tourist",
  walletWitness: "oldWitness",
  walletOwner: "tourist",
  walletGuard: "guide",
  elderQuest: "oldWitness",
  crossingGuard: "guide",
  tourGuideQuest: "guide",
  transportHost: "guide",
  touristQuestDriver: "xeOm",
  transportQuestDriver: "xeOm",
  teaQuestVendor: "teaSeller",
  childToyStart: "storyChild"
});

export function resolveNpcPortraitId(npcOrId) {
  const id = typeof npcOrId === "string" ? npcOrId : npcOrId?.id;
  const name = typeof npcOrId === "object" ? npcOrId?.name : "";
  if (ID_ALIASES[id]) return ID_ALIASES[id];
  if (/^teaSeller/i.test(id || "") || /trà đá/i.test(name || "")) return "teaSeller";
  if (/^xeOm/i.test(id || "") || /xe ôm/i.test(name || "")) return "xeOm";
  if (/guide|hướng dẫn viên/i.test(`${id || ""} ${name || ""}`)) return "guide";
  if (/tourist|du khách/i.test(`${id || ""} ${name || ""}`)) return "tourist";
  if (/old|ông lão|nhân chứng/i.test(`${id || ""} ${name || ""}`)) return "oldWitness";
  if (/child|trẻ|em nhỏ/i.test(`${id || ""} ${name || ""}`)) return "storyChild";
  return null;
}

export function resolvePortraitIdForSpeaker(speaker) {
  if (!speaker) return null;
  if (/^Mơ(?:\s|$|\()/i.test(speaker)) return "mo";
  if (/Cha xứ/i.test(speaker)) return "priest";
  if (/Hướng dẫn viên|Giáo viên/i.test(speaker)) return "guide";
  if (/Ông lão/i.test(speaker)) return "oldWitness";
  if (/trà đá/i.test(speaker)) return "teaSeller";
  if (/xe ôm/i.test(speaker)) return "xeOm";
  if (/du khách/i.test(speaker)) return "tourist";
  return null;
}

export function getNpcPortrait(profileId) {
  return NPC_PORTRAITS[profileId] || null;
}

export function getNpcExpression(profile, expressionId) {
  const allowed = profile?.expressions || ["neutral"];
  const id = allowed.includes(expressionId) ? expressionId : "neutral";
  return EXPRESSIONS[id] || EXPRESSIONS.neutral;
}

export function resolveMoDialogueExpression(expressionId) {
  return MO_EXPRESSION_ALIASES[expressionId] || "idle";
}

export function isCinematicDialogueNpc(npcOrId) {
  return Boolean(resolveNpcPortraitId(npcOrId));
}

function portrait(config) {
  return Object.freeze({
    age: "adult",
    ...config,
    expressions: Object.freeze(config.expressions || ["neutral"])
  });
}
