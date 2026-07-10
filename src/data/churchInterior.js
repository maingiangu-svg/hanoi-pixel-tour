const PEW_ROWS = [276, 346, 416, 486, 556, 626];

const pews = PEW_ROWS.flatMap((y) => [
  { x: 154, y, width: 330, height: 28, side: "left" },
  { x: 916, y, width: 330, height: 28, side: "right" }
]);

const congregationSeats = PEW_ROWS.flatMap((y, rowIndex) => [
  { id: `congregation-${rowIndex}-left-a`, x: 246, y: y - 20, facing: "up" },
  { id: `congregation-${rowIndex}-left-b`, x: 386, y: y - 20, facing: "up" },
  { id: `congregation-${rowIndex}-right-a`, x: 1004, y: y - 20, facing: "up" },
  { id: `congregation-${rowIndex}-right-b`, x: 1144, y: y - 20, facing: "up" }
]);

export const CHURCH_LAYOUT = {
  interiorDoor: { x: 664, y: 868, width: 72, height: 42 },
  exteriorDoor: { x: 2483, y: 752 },
  aisle: { x: 550, y: 224, width: 300, height: 690 },
  sanctuary: { x: 320, y: 52, width: 760, height: 172 },
  altar: { x: 540, y: 88, width: 320, height: 86 },
  priest: { id: "chaXu", name: "Cha xứ", x: 686, y: 138, facing: "down" },
  moSeat: { x: 446, y: 602, facing: "up" },
  pews,
  congregationSeats,
  windows: [
    { x: 76, y: 166 }, { x: 76, y: 334 }, { x: 76, y: 502 }, { x: 76, y: 670 },
    { x: 1296, y: 166 }, { x: 1296, y: 334 }, { x: 1296, y: 502 }, { x: 1296, y: 670 }
  ],
  columns: [
    { x: 120, y: 238 }, { x: 120, y: 442 }, { x: 120, y: 646 },
    { x: 1258, y: 238 }, { x: 1258, y: 442 }, { x: 1258, y: 646 }
  ]
};

export const churchInteriorMap = {
  id: "churchInterior",
  name: "Nhà thờ Lớn - Bên trong",
  arrivalName: "bên trong Nhà thờ Lớn Hà Nội",
  kind: "churchInterior",
  width: 1400,
  height: 980,
  background: "#443b36",
  spawn: { x: 688, y: 850 },
  walkZones: [
    { x: 54, y: 50, width: 1292, height: 870, kind: "courtyard", vehicleAllowed: false }
  ],
  water: [],
  groundPatches: [],
  buildings: [],
  landmarks: [],
  shops: [],
  vehicleShops: [],
  npcs: [],
  decorations: [],
  church: CHURCH_LAYOUT,
  collisionBlocks: [
    { x: 0, y: 0, width: 1400, height: 50 },
    { x: 0, y: 0, width: 54, height: 980 },
    { x: 1346, y: 0, width: 54, height: 980 },
    { x: 0, y: 920, width: 620, height: 60 },
    { x: 780, y: 920, width: 620, height: 60 },
    { x: 320, y: 52, width: 760, height: 172 },
    ...pews,
    ...CHURCH_LAYOUT.columns.map((column) => ({ x: column.x - 12, y: column.y, width: 28, height: 34 }))
  ],
  exits: [
    {
      id: "churchDoorOut",
      name: "Cửa chính Nhà thờ Lớn",
      kind: "churchExit",
      prompt: "E · Ra ngoài",
      x: 648,
      y: 862,
      width: 104,
      height: 48,
      interactionPoint: { x: 700, y: 876, radius: 54, visibleRange: 180, labelOffsetY: -34, label: "Cửa chính" },
      targetMap: "hoanKiem",
      targetX: 2480,
      targetY: 764,
      message: "Bạn trở lại quảng trường nhỏ trước Nhà thờ Lớn Hà Nội."
    }
  ]
};
