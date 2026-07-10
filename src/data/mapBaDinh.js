import { NPC_REWARD } from "../state.js";
import { repeatDecor, rowApartments, rowHouses } from "./mapHelpers.js";

export const baDinhMap = {
  id: "baDinh",
  name: "Ba Đình - Văn Miếu",
  arrivalName: "khu Ba Đình - Văn Miếu",
  width: 3000,
  height: 2200,
  background: "#85847b",
  spawn: { x: 340, y: 1850 },
  walkZones: [
    { x: 520, y: 106, width: 1100, height: 838, kind: "plaza" },
    { x: 1680, y: 300, width: 540, height: 190, kind: "plaza" },
    { x: 1680, y: 650, width: 540, height: 300, kind: "plaza" },
    { x: 2020, y: 490, width: 200, height: 160, kind: "plaza" },
    { x: 586, y: 1240, width: 1044, height: 260, kind: "courtyard" },
    { x: 586, y: 1600, width: 1044, height: 388, kind: "courtyard" },
    { x: 586, y: 1508, width: 166, height: 90, kind: "courtyard" },
    { x: 1018, y: 1508, width: 612, height: 90, kind: "courtyard" },
    { x: 1870, y: 1010, width: 830, height: 770, kind: "sidewalk" },
    { x: 120, y: 1480, width: 520, height: 430, kind: "sidewalk" },
    { x: 180, y: 1780, width: 2580, height: 126, kind: "road" },
    { x: 220, y: 960, width: 2440, height: 122, kind: "road" },
    { x: 358, y: 120, width: 126, height: 1900, kind: "road" },
    { x: 1556, y: 240, width: 126, height: 1700, kind: "road" },
    { x: 2496, y: 820, width: 126, height: 700, kind: "road" },
    { x: 560, y: 168, width: 1040, height: 112, kind: "sidewalk" },
    { x: 560, y: 812, width: 1040, height: 108, kind: "sidewalk" },
    { x: 560, y: 240, width: 106, height: 680, kind: "sidewalk" },
    { x: 1500, y: 240, width: 110, height: 680, kind: "sidewalk" },
    { x: 640, y: 290, width: 820, height: 500, kind: "plaza" },
    { x: 760, y: 680, width: 580, height: 120, kind: "plaza" },
    { x: 1700, y: 320, width: 470, height: 170, kind: "courtyard" },
    { x: 1700, y: 650, width: 470, height: 60, kind: "courtyard" },
    { x: 1660, y: 548, width: 96, height: 96, kind: "sidewalk" },
    { x: 2020, y: 548, width: 150, height: 96, kind: "sidewalk" },
    { x: 1920, y: 1070, width: 610, height: 330, kind: "courtyard" },
    { x: 2030, y: 1410, width: 620, height: 96, kind: "sidewalk" },
    { x: 620, y: 1310, width: 960, height: 190, kind: "courtyard" },
    { x: 620, y: 1600, width: 960, height: 330, kind: "courtyard" },
    { x: 710, y: 1420, width: 780, height: 94, kind: "path" },
    { x: 710, y: 1570, width: 44, height: 94, kind: "path" },
    { x: 1016, y: 1570, width: 474, height: 94, kind: "path" },
    { x: 710, y: 1720, width: 780, height: 94, kind: "path" },
    { x: 2050, y: 1620, width: 560, height: 100, kind: "sidewalk" }
  ],
  water: [
    { x: 1760, y: 508, width: 250, height: 132, label: "Ao sen", kind: "pond" },
    { x: 760, y: 1510, width: 250, height: 88, label: "Hồ Văn", kind: "pond" }
  ],
  groundPatches: [
    { x: 0, y: 0, width: 3000, height: 2200, kind: "paving" },
    { x: 520, y: 106, width: 1710, height: 840, kind: "plaza" },
    { x: 680, y: 500, width: 780, height: 82, kind: "grass" },
    { x: 680, y: 612, width: 780, height: 70, kind: "grass" },
    { x: 586, y: 1240, width: 1044, height: 748, kind: "brick" },
    { x: 1870, y: 1010, width: 830, height: 770, kind: "paving" },
    { x: 1700, y: 320, width: 470, height: 390, kind: "plaza" }
  ],
  collisionBlocks: [
    { x: 1760, y: 508, width: 250, height: 132 },
    { x: 760, y: 1510, width: 250, height: 88 }
  ],
  buildings: [
    { kind: "admin", x: 1030, y: 110, width: 500, height: 112, color: "#d8d0a8", roof: "#9f4b3f" },
    { kind: "admin", x: 1780, y: 170, width: 380, height: 110, color: "#d6c57a", roof: "#8a3f32" },
    { kind: "wall", x: 605, y: 1260, width: 1010, height: 34, color: "#b76d43" },
    { kind: "wall", x: 604, y: 1930, width: 1010, height: 34, color: "#b76d43" },
    { kind: "wall", x: 604, y: 1260, width: 34, height: 704, color: "#b76d43" },
    { kind: "wall", x: 1580, y: 1260, width: 34, height: 704, color: "#b76d43" },
    { kind: "wall", x: 1910, y: 1040, width: 640, height: 34, color: "#b76d43" },
    { kind: "wall", x: 1910, y: 1410, width: 640, height: 34, color: "#b76d43" },
    { kind: "tubeHouse", x: 2080, y: 1518, width: 92, height: 118, color: "#e7c067", roof: "#315f8f", door: "#5d3b28" },
    ...rowHouses({ x: 2150, y: 1736, count: 5, width: 78, height: 106, signs: ["PHỞ", "BÁNH", "TRÀ", "SÁCH", "CAFE"] }),
    ...rowHouses({ x: 170, y: 1540, count: 3, width: 72, height: 112, signs: ["PHỐ", "NƯỚC", "BÚN"] }),
    ...rowApartments({ x: 170, y: 1326, count: 3, width: 118, height: 142, gap: 14 }),
    ...rowApartments({ x: 2260, y: 1280, count: 3, width: 126, height: 150, gap: 18 }),
    { kind: "cafeFront", x: 2250, y: 1530, width: 112, height: 92, color: "#d8b35f", roof: "#88443d", sign: "CAFE" }
  ],
  landmarks: [
    {
      id: "quangTruongBaDinh",
      name: "Quảng trường Ba Đình",
      kind: "plazaLabel",
      x: 640,
      y: 300,
      width: 820,
      height: 490,
      solid: false,
      priority: 7,
      range: 90,
      interactionPoint: { x: 760, y: 748, radius: 50, visibleRange: 240, labelOffsetY: -34 },
      stamp: "Tem Quảng trường Ba Đình",
      description: "Không gian quảng trường rộng lớn trước Lăng Bác."
    },
    {
      id: "langBac",
      name: "Lăng Bác",
      kind: "mausoleum",
      x: 930,
      y: 250,
      width: 430,
      height: 184,
      range: 118,
      interactionPoint: { x: 1145, y: 462, radius: 50, visibleRange: 240, labelOffsetY: -36 },
      quizId: "langBac",
      stamp: "Tem Lăng Bác",
      description: "Công trình trang nghiêm tại Quảng trường Ba Đình."
    },
    {
      id: "chuaMotCot",
      name: "Chùa Một Cột",
      kind: "onePillar",
      x: 1810,
      y: 396,
      width: 190,
      height: 178,
      range: 105,
      interactionPoint: { x: 1718, y: 600, radius: 48, visibleRange: 220, labelOffsetY: -34 },
      quizId: "chuaMotCot",
      stamp: "Tem Chùa Một Cột",
      description: "Ngôi chùa có kiến trúc như bông sen trên một cột."
    },
    {
      id: "hoangThanh",
      name: "Hoàng Thành Thăng Long",
      kind: "citadel",
      x: 1978,
      y: 1102,
      width: 500,
      height: 238,
      range: 120,
      interactionPoint: { x: 2040, y: 1370, radius: 50, visibleRange: 230, labelOffsetY: -34 },
      quizId: "hoangThanh",
      stamp: "Tem Hoàng Thành Thăng Long",
      description: "Di sản văn hóa gắn với lịch sử kinh đô Thăng Long."
    },
    {
      id: "vanMieu",
      name: "Văn Miếu - Quốc Tử Giám",
      kind: "gate",
      x: 690,
      y: 1348,
      width: 820,
      height: 520,
      solid: false,
      range: 120,
      interactionPoint: { x: 1100, y: 1422, radius: 52, visibleRange: 240, labelOffsetY: -36 },
      quizId: "vanMieu",
      stamp: "Tem Văn Miếu",
      description: "Không gian văn hóa tôn vinh truyền thống hiếu học."
    }
  ],
  shops: [
    { id: "shopPhoHaNoi", foodId: "phoHaNoi", x: 2126, y: 1640, width: 166, height: 80 },
    { id: "shopBanhCuon", foodId: "banhCuon", x: 2360, y: 1640, width: 174, height: 80 }
  ],
  npcs: [
    {
      id: "guideBaDinh",
      name: "Hướng dẫn viên",
      x: 610,
      y: 875,
      color: "#ffe36e",
      task: {
        type: "quizChain",
        taskId: "guideHistoryChain",
        quizIds: ["guideThangLong", "guideQuocKhanh"],
        reward: NPC_REWARD,
        souvenir: "Sổ tay lịch sử Ba Đình",
        intro: "Mình có hai câu hỏi lịch sử ngắn. Trả lời lần lượt để nhận sổ tay nhé.",
        done: "Bạn đã hoàn thành chuỗi câu hỏi của hướng dẫn viên."
      }
    },
    {
      id: "studentVanMieu",
      name: "Sinh viên",
      x: 1160,
      y: 1872,
      color: "#9ef090",
      task: {
        type: "requiresStampQuiz",
        taskId: "studentVanMieu",
        requiredStamp: "Tem Văn Miếu",
        quizId: "studentVanMieu",
        reward: NPC_REWARD,
        souvenir: "Sổ tay sinh viên",
        intro: "Bạn sinh viên nhờ bạn ghé Văn Miếu trước, rồi cùng trả lời một câu hỏi về truyền thống hiếu học.",
        done: "Bạn sinh viên cảm ơn và tặng bạn một cuốn sổ nhỏ."
      }
    }
  ],
  exits: [
    {
      id: "busBackHoanKiem",
      name: "Xe buýt Hoàn Kiếm",
      kind: "bus",
      x: 270,
      y: 1818,
      width: 128,
      height: 76,
      targetMap: "hoanKiem",
      targetX: 2450,
      targetY: 1540,
      message: "Bạn đã đi xe buýt về khu Hoàn Kiếm - Phố Cổ."
    },
    {
      id: "busToLongBien",
      name: "Xe buýt Long Biên",
      kind: "bus",
      x: 2550,
      y: 960,
      width: 128,
      height: 76,
      targetMap: "longBien",
      targetX: 1420,
      targetY: 1320,
      message: "Bạn đã đi xe buýt đến khu Long Biên - Đồng Xuân."
    }
  ],
  decorations: [
    { type: "skyline", x: 120, y: 48, width: 520, height: 126 },
    { type: "skyline", x: 2260, y: 610, width: 520, height: 130 },
    ...repeatDecor("flag", [[922, 230], [976, 230], [1030, 230], [1084, 230], [1138, 230]]),
    ...repeatDecor("tree", [[560, 320], [560, 730], [1495, 320], [1495, 730], [1710, 340], [2140, 690], [690, 1308], [1490, 1308], [690, 1888], [1490, 1888]]),
    ...repeatDecor("lamp", [[610, 812], [760, 812], [910, 812], [1060, 812], [1210, 812], [1360, 812], [1580, 945], [370, 1680], [2500, 1540]]),
    ...repeatDecor("bench", [[760, 748], [920, 748], [1080, 748], [1240, 748], [1780, 670], [840, 1810], [1160, 1810]]),
    ...repeatDecor("lotus", [[1790, 560], [1850, 606], [1950, 560], [835, 1548], [940, 1562]]),
    ...repeatDecor("stele", [[980, 1604], [1060, 1604], [1140, 1604], [1220, 1604]]),
    ...repeatDecor("streetSign", [[372, 1510], [2100, 1580]], { text: "PHỐ" }),
    ...repeatDecor("bicycle", [[2240, 1712], [330, 1720]]),
    ...repeatDecor("trashBin", [[1420, 814], [1530, 1300], [2500, 1718]]),
    ...repeatDecor("electricBox", [[2140, 1508], [420, 1540]]),
    { type: "khueVanCac", x: 1068, y: 1450 },
    { type: "zebra", x: 348, y: 1768, width: 140, height: 138, direction: "vertical" },
    { type: "zebra", x: 2488, y: 946, width: 146, height: 140, direction: "vertical" },
    { type: "sign", x: 324, y: 1768, text: "XE" },
    { type: "sign", x: 2616, y: 910, text: "XE" },
    { type: "banner", x: 724, y: 250, color: "#d63131" }
  ]
};
