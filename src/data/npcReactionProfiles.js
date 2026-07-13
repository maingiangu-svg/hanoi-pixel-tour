export const NPC_REACTION_PROFILES = {
  friendly: {
    id: "friendly",
    glanceRange: 112,
    vehicleRange: 118,
    glanceChance: 0.72,
    greetingChance: 0.3,
    stepDistance: 18,
    cooldownMs: 4300,
    canStepAside: true,
    greetings: ["Chào bạn!", "Đi chơi vui nhé!"],
    warnings: ["Đi chậm thôi nhé.", "Cẩn thận nhé!"]
  },
  calm: {
    id: "calm",
    glanceRange: 92,
    vehicleRange: 105,
    glanceChance: 0.48,
    greetingChance: 0.08,
    stepDistance: 15,
    cooldownMs: 5600,
    canStepAside: true,
    greetings: ["Chào bạn."],
    warnings: ["Cẩn thận nhé."]
  },
  busy: {
    id: "busy",
    glanceRange: 72,
    vehicleRange: 112,
    glanceChance: 0.24,
    greetingChance: 0,
    stepDistance: 20,
    cooldownMs: 3300,
    canStepAside: true,
    greetings: [],
    warnings: ["Cho mình đi nhờ chút.", "Đi chậm thôi nhé!"]
  },
  strict: {
    id: "strict",
    glanceRange: 104,
    vehicleRange: 138,
    glanceChance: 0.62,
    greetingChance: 0.04,
    stepDistance: 18,
    cooldownMs: 5200,
    canStepAside: true,
    greetings: ["Chào bạn."],
    warnings: ["Khu này đi bộ thôi nhé.", "Ở đây đông người, đi chậm thôi cháu."]
  },
  child: {
    id: "child",
    glanceRange: 86,
    vehicleRange: 158,
    glanceChance: 0.68,
    greetingChance: 0.1,
    stepDistance: 28,
    cooldownMs: 2800,
    canStepAside: true,
    greetings: ["Chào bạn!"],
    warnings: ["Cẩn thận nhé!"]
  },
  vendor: {
    id: "vendor",
    glanceRange: 118,
    vehicleRange: 132,
    glanceChance: 0.82,
    greetingChance: 0.28,
    stepDistance: 0,
    cooldownMs: 6000,
    canStepAside: false,
    greetings: ["Cháu ghé nghỉ chân nhé!", "Chào cháu!"],
    warnings: ["Đi chậm thôi cháu, đổ hết cốc bây giờ!", "Cẩn thận bàn ghế nhé cháu!"]
  }
};

export const REACTION_PROFILE_BY_ACTIVITY = {
  teaSeller: "vendor",
  xeOm: "friendly",
  jog: "busy",
  walk: "busy",
  exercise: "calm",
  danceGroup: "calm",
  couple: "friendly",
  talk: "friendly"
};

export const REACTION_PROFILE_BY_ROLE = {
  guard: "strict",
  guide: "friendly",
  vendor: "vendor",
  porter: "busy",
  commuter: "busy",
  jogger: "busy",
  student: "friendly",
  reader: "calm",
  parishioner: "calm"
};

export const VEHICLE_RESTRICTION_LINES = [
  "Cháu đi xuống lòng đường giúp cô!",
  "Ở đây đông người, đi chậm thôi cháu.",
  "Khu này phải đi bộ nhé.",
  "Cẩn thận trẻ con đấy!"
];
