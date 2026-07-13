const hour = (value) => Math.round(value * 60);

export const ACTIVITY_SCHEDULES = {
  exercise: [
    { start: hour(5), end: hour(8), state: "morningExercise" },
    { start: hour(16.5), end: hour(20), state: "eveningExercise" }
  ],
  jog: [
    { start: hour(5), end: hour(8), state: "morningJog" },
    { start: hour(16.5), end: hour(20), state: "eveningJog" }
  ],
  danceGroup: [
    { start: hour(18.5), end: hour(21), state: "eveningDance" }
  ],
  couple: [
    { start: hour(16), end: hour(21.5), state: "eveningWalk" }
  ],
  walk: [
    { start: hour(5.5), end: hour(9), state: "morningWalk" },
    { start: hour(15.5), end: hour(22), state: "eveningWalk" }
  ],
  teaSeller: [
    { start: hour(5.5), end: hour(6.5), state: "settingUp", customerCount: 0 },
    { start: hour(6.5), end: hour(11.5), state: "sellingTea", customerCount: 2 },
    { start: hour(11.5), end: hour(14), state: "resting", customerCount: 0 },
    { start: hour(14), end: hour(20.5), state: "sellingTeaBusy", customerCount: 3 },
    { start: hour(20.5), end: hour(21.5), state: "packingUp", customerCount: 0 }
  ]
};

export const NPC_SCHEDULES = {
  xeOmHoanKiem: [
    { start: hour(5.5), end: hour(11.5), state: "waitingMorning" },
    { start: hour(11.5), end: hour(14), state: "resting", position: { x: 2288, y: 1348 } },
    { start: hour(14), end: hour(22.5), state: "waitingEvening" },
    { start: hour(22.5), end: hour(23.25), state: "lateShift" }
  ],
  xeOmBaDinh: [
    { start: hour(6), end: hour(11.5), state: "waitingMorning" },
    { start: hour(11.5), end: hour(14), state: "resting", position: { x: 2412, y: 1588 } },
    { start: hour(14), end: hour(22.5), state: "waitingEvening" }
  ],
  xeOmLongBien: [
    { start: hour(5.5), end: hour(11.5), state: "waitingMorning", position: { x: 1380, y: 1290 } },
    { start: hour(11.5), end: hour(14), state: "resting", position: { x: 1240, y: 1210 } },
    { start: hour(14), end: hour(22.5), state: "waitingEvening" }
  ],
  xeOmDongXuan: [
    { start: hour(5), end: hour(11.5), state: "waitingMorning" },
    { start: hour(11.5), end: hour(14), state: "resting", position: { x: 682, y: 1086 } },
    { start: hour(14), end: hour(22.5), state: "waitingEvening", position: { x: 410, y: 708 } }
  ]
};

export const SHOP_SCHEDULES = {
  phoHaNoi: [
    { start: hour(5.5), end: hour(10.5) },
    { start: hour(16.5), end: hour(22) }
  ],
  phoGanh: [
    { start: hour(5), end: hour(10.5) },
    { start: hour(17), end: hour(22) }
  ],
  bunCha: [
    { start: hour(10), end: hour(15) },
    { start: hour(17), end: hour(21) }
  ],
  banhCuon: [{ start: hour(5.5), end: hour(11) }],
  caPheTrung: [{ start: hour(7), end: hour(22.5) }],
  comLangVong: [{ start: hour(8), end: hour(20.5) }],
  traDa: [{ start: hour(6.5), end: hour(20.5) }],
  "vinfast-electric": [{ start: hour(8), end: hour(18) }]
};

export const PEDESTRIAN_DENSITY_SCHEDULE = [
  { start: hour(5), end: hour(7), factor: 0.38, state: "earlyMorning" },
  { start: hour(7), end: hour(9), factor: 0.68, state: "commute" },
  { start: hour(9), end: hour(16), factor: 0.76, state: "daytime" },
  { start: hour(16), end: hour(21.5), factor: 1, state: "eveningPeak" },
  { start: hour(21.5), end: hour(22), factor: 0.42, state: "windingDown" },
  { start: hour(22), end: hour(5), factor: 0.14, state: "lateNight" }
];

export const AMBIENT_PEDESTRIANS = {
  hoanKiem: [
    ["hkWalk01", 1030, 1194, "#7bdff2"],
    ["hkWalk02", 1210, 1260, "#f2bd45"],
    ["hkWalk03", 1510, 1208, "#f59ac0"],
    ["hkWalk04", 1740, 1248, "#8de097"],
    ["hkWalk05", 2140, 1120, "#caa6ff"],
    ["hkWalk06", 2270, 1060, "#f7a072"],
    ["hkWalk07", 1100, 750, "#9eced6"],
    ["hkWalk08", 760, 1380, "#e7c067"],
    ["hkWalk09", 2380, 930, "#8fcbbd"],
    ["hkWalk10", 2680, 1020, "#d6a3a3"]
  ],
  baDinh: [
    ["bdWalk01", 720, 850, "#7bdff2"],
    ["bdWalk02", 1180, 840, "#f2bd45"],
    ["bdWalk03", 1588, 1030, "#8de097"],
    ["bdWalk04", 2040, 1460, "#f59ac0"],
    ["bdWalk05", 2520, 1740, "#caa6ff"],
    ["bdWalk06", 440, 1710, "#f7a072"],
    ["bdWalk07", 850, 1390, "#7894b8"],
    ["bdWalk08", 1220, 1460, "#d7a65b"],
    ["bdWalk09", 1380, 1745, "#9b6f7f"],
    ["bdWalk10", 720, 1840, "#6f9878"]
  ],
  longBien: [
    ["lbWalk01", 430, 900, "#7bdff2"],
    ["lbWalk02", 760, 930, "#f2bd45"],
    ["lbWalk03", 1040, 1160, "#8de097"],
    ["lbWalk04", 1350, 1370, "#f59ac0"],
    ["lbWalk05", 1500, 1060, "#caa6ff"],
    ["lbWalk06", 1180, 680, "#f7a072"],
    ["lbWalk07", 1520, 1320, "#7e9bad"],
    ["lbWalk08", 1680, 1100, "#d5ad58"],
    ["lbWalk09", 1420, 620, "#8c6e98"]
  ]
};

export const CHURCH_EXTERIOR_CROWD = [
  ["churchVisitor01", 2670, 1030, "#5b77a8"],
  ["churchVisitor02", 2605, 980, "#9b5b68"],
  ["churchVisitor03", 2560, 922, "#8c7650"],
  ["churchVisitor04", 2530, 875, "#4d8b72"],
  ["churchVisitor05", 2455, 900, "#c98762"],
  ["churchVisitor06", 2410, 940, "#6d7b9a"],
  ["churchVisitor07", 2360, 890, "#a46b78"],
  ["churchVisitor08", 2310, 930, "#5f876a"]
];

export const CHILD_COUNT_SCHEDULE = [
  { start: hour(6.5), end: hour(7.5), count: 2 },
  { start: hour(7.5), end: hour(11.5), count: 1 },
  { start: hour(11.5), end: hour(13.5), count: 2 },
  { start: hour(13.5), end: hour(16), count: 1 },
  { start: hour(16), end: hour(19.5), count: 4 },
  { start: hour(19.5), end: hour(20.5), count: 2 },
  { start: hour(20.5), end: hour(22), count: 1 }
];
