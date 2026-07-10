import { CHURCH_LAYOUT } from "./churchInterior.js";

const MO_INTERIOR_DOOR = { x: 686, y: 838 };

export const MO_NEIGHBORHOOD = {
  id: "moNeighborhood",
  name: "Sân nhỏ gần Nhà thờ Lớn",
  // A paved service courtyard in the alley behind the church-side houses.
  x: 2390,
  y: 1076,
  width: 258,
  height: 78,
  washingPoint: { x: 2422, y: 1088 },
  playPoint: { x: 2512, y: 1100 },
  restPoint: { x: 2434, y: 1108 }
};

export const MO_SCHEDULE = {
  id: "mo",
  name: "Mơ",
  color: "#d66b9a",
  homeMapId: "hoanKiem",
  churchMapId: "churchInterior",
  washingPoint: MO_NEIGHBORHOOD.washingPoint,
  playPoint: MO_NEIGHBORHOOD.playPoint,
  restPoint: MO_NEIGHBORHOOD.restPoint,
  exteriorDoor: CHURCH_LAYOUT.exteriorDoor,
  massSeat: CHURCH_LAYOUT.moSeat,
  routeToChurch: [
    MO_NEIGHBORHOOD.playPoint,
    { x: 2750, y: 1100 },
    { x: 2750, y: 790 },
    { x: 2536, y: 790 },
    CHURCH_LAYOUT.exteriorDoor
  ],
  routeIntoChurch: [
    MO_INTERIOR_DOOR,
    { x: 686, y: 714 },
    { x: 568, y: 648 },
    CHURCH_LAYOUT.moSeat
  ]
};

export const MO_COMPANION_CONFIG = {
  clockPauseReason: "hanging-out-with-mo",
  returnMapId: "hoanKiem",
  returnPointId: "returnMoToChurch",
  returnDestination: "nhaThoLon",
  followSpeed: 2.8,
  catchUpDistance: 340
};

export const MO_CHILDREN = [
  { id: "childLan", x: 2474, y: 1100, color: "#f2bd45", activity: "jump" },
  { id: "childNam", x: 2424, y: 1110, color: "#2f8ec5", activity: "run" },
  { id: "childHoa", x: 2578, y: 1110, color: "#8de097", activity: "talk" },
  { id: "childTung", x: 2510, y: 1120, color: "#f3988d", activity: "rope" }
];

export const CHURCH_SERVICE_TIMES = {
  gatheringStart: 17 * 60 + 45,
  massStart: 18 * 60,
  massEnd: 19 * 60
};
