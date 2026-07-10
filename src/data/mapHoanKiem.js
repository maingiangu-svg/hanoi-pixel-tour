import { NPC_REWARD } from "../state.js";
import { repeatDecor, rowApartments, rowHouses } from "./mapHelpers.js";

export const hoanKiemMap = {
  id: "hoanKiem",
  name: "Hoàn Kiếm - Phố Cổ",
  arrivalName: "khu Hoàn Kiếm - Phố Cổ",
  width: 2800,
  height: 1900,
  background: "#85847b",
  spawn: { x: 610, y: 1370 },
  walkZones: [
    { x: 112, y: 128, width: 1128, height: 1506, kind: "sidewalk" },
    { x: 1148, y: 150, width: 132, height: 1128, kind: "sidewalk" },
    { x: 1278, y: 150, width: 820, height: 132, kind: "sidewalk" },
    { x: 1278, y: 1156, width: 840, height: 162, kind: "sidewalk" },
    { x: 2080, y: 230, width: 180, height: 1050, kind: "sidewalk" },
    { x: 2190, y: 438, width: 522, height: 632, kind: "sidewalk" },
    { x: 2240, y: 730, width: 420, height: 214, kind: "plaza" },
    { x: 2180, y: 480, width: 536, height: 86, kind: "road" },
    { x: 2600, y: 418, width: 96, height: 654, kind: "road" },
    { x: 2380, y: 1058, width: 304, height: 262, kind: "sidewalk" },
    { x: 0, y: 1328, width: 1280, height: 112, kind: "road" },
    { x: 112, y: 326, width: 1160, height: 104, kind: "road" },
    { x: 118, y: 720, width: 1160, height: 96, kind: "road" },
    { x: 520, y: 150, width: 104, height: 1560, kind: "road" },
    { x: 850, y: 238, width: 96, height: 1200, kind: "road" },
    { x: 1110, y: 650, width: 126, height: 790, kind: "road" },
    { x: 610, y: 548, width: 520, height: 82, kind: "sidewalk" },
    { x: 620, y: 842, width: 560, height: 84, kind: "sidewalk" },
    { x: 1160, y: 170, width: 1040, height: 104, kind: "sidewalk" },
    { x: 1150, y: 1188, width: 1100, height: 116, kind: "sidewalk" },
    { x: 1160, y: 220, width: 116, height: 1048, kind: "sidewalk" },
    { x: 2110, y: 238, width: 122, height: 1030, kind: "sidewalk" },
    { x: 2028, y: 602, width: 292, height: 206, kind: "plaza" },
    { x: 1848, y: 690, width: 292, height: 54, kind: "bridge" },
    { x: 2200, y: 1320, width: 430, height: 108, kind: "road" },
    { x: 2498, y: 1320, width: 112, height: 390, kind: "road" },
    { x: 2100, y: 1240, width: 244, height: 92, kind: "sidewalk" },
    { x: 2360, y: 1510, width: 310, height: 112, kind: "sidewalk" }
  ],
  water: [
    { x: 1318, y: 294, width: 760, height: 860, label: "Hồ Gươm", kind: "lake" }
  ],
  groundPatches: [
    { x: 0, y: 0, width: 1300, height: 1900, kind: "paving" },
    { x: 1142, y: 120, width: 1128, height: 1220, kind: "plaza" },
    { x: 2140, y: 390, width: 620, height: 760, kind: "brick" },
    { x: 2140, y: 1190, width: 650, height: 560, kind: "paving" },
    { x: 1260, y: 280, width: 56, height: 850, kind: "grass" },
    { x: 2076, y: 300, width: 52, height: 820, kind: "grass" }
  ],
  buildings: [
    ...rowHouses({ x: 190, y: 168, count: 4, width: 72, height: 112, signs: ["PHỞ", "CÀ PHÊ", "TẠP HÓA", "BÁNH"] }),
    ...rowHouses({ x: 650, y: 166, count: 6, width: 66, height: 108, signs: ["ÁO", "SÁCH", "CHÈ", "BÚN", "LỤA", "TRÀ"] }),
    ...rowHouses({ x: 170, y: 456, count: 4, width: 74, height: 100, signs: ["PHỐ", "CAFE", "BIA", "NÓN"] }),
    ...rowHouses({ x: 640, y: 456, count: 6, width: 70, height: 106, signs: ["BÚN", "GIÀY", "CỐM", "TRÀ", "SÁCH", "PHỞ"] }),
    ...rowHouses({ x: 170, y: 842, count: 4, width: 78, height: 98, signs: ["BÁNH", "ĐÈN", "MAY", "PHỞ"] }),
    ...rowHouses({ x: 642, y: 960, count: 5, width: 74, height: 106, signs: ["NƯỚC", "CAFE", "BÚN", "CHÈ", "LỤA"] }),
    ...rowHouses({ x: 166, y: 1465, count: 4, width: 78, height: 98, signs: ["XE", "QUÀ", "TRÀ", "PHỐ"] }),
    ...rowHouses({ x: 646, y: 1462, count: 6, width: 72, height: 104, signs: ["PHỞ", "BÚN", "ÁO", "SÁCH", "TRÀ", "CỐM"] }),
    ...rowHouses({ x: 2195, y: 328, count: 4, width: 82, height: 110, gap: 14, signs: ["CAFE", "SÁCH", "HOA", "BÁNH"] }),
    ...rowHouses({ x: 2208, y: 960, count: 5, width: 78, height: 104, gap: 12, signs: ["CÀ PHÊ", "TRÀ", "ẢNH", "KEM", "BÁNH"] }),
    ...rowApartments({ x: 2220, y: 1168, count: 3, width: 118, height: 148, gap: 18 }),
    { kind: "tubeHouse", x: 1028, y: 470, width: 92, height: 134, color: "#e7c067", roof: "#9e4038", door: "#244f6b" },
    { kind: "tubeHouse", x: 1000, y: 946, width: 112, height: 124, color: "#8fcbbd", roof: "#315f8f", door: "#5d3b28" },
    { kind: "cafeFront", x: 2630, y: 586, width: 118, height: 94, color: "#d8b35f", roof: "#9e4038", sign: "CAFE" },
    { kind: "cafeFront", x: 2634, y: 948, width: 112, height: 88, color: "#d2a061", roof: "#315f8f", sign: "TRÀ" },
    { kind: "wall", x: 1242, y: 210, width: 46, height: 1048, color: "#d6c57a" },
    { kind: "wall", x: 2070, y: 244, width: 44, height: 1020, color: "#d6c57a" }
  ],
  landmarks: [
    {
      id: "hoGuom",
      name: "Hồ Gươm",
      kind: "lake",
      x: 1318,
      y: 294,
      width: 760,
      height: 860,
      solid: false,
      priority: 6,
      range: 105,
      interactionPoint: { x: 1226, y: 1020, radius: 50, visibleRange: 240, labelOffsetY: -34 },
      quizId: "hoGuom",
      stamp: "Tem check-in Hồ Gươm",
      description: "Mặt hồ xanh nằm giữa trung tâm Hà Nội."
    },
    {
      id: "denNgocSon",
      name: "Đền Ngọc Sơn",
      kind: "temple",
      x: 2126,
      y: 638,
      width: 154,
      height: 124,
      range: 112,
      interactionPoint: { x: 2162, y: 790, radius: 48, visibleRange: 220, labelOffsetY: -34 },
      quizId: "denNgocSon",
      stamp: "Tem Đền Ngọc Sơn",
      description: "Ngôi đền nhỏ nổi bật bên Hồ Gươm."
    },
    {
      id: "cauTheHuc",
      name: "Cầu Thê Húc",
      kind: "redBridge",
      x: 1848,
      y: 690,
      width: 292,
      height: 54,
      solid: false,
      range: 84,
      interactionPoint: { x: 1858, y: 718, radius: 44, visibleRange: 220, labelOffsetY: -32 },
      quizId: "cauTheHuc",
      stamp: "Tem Cầu Thê Húc",
      souvenir: "Vé tham quan Cầu Thê Húc",
      description: "Cây cầu đỏ dẫn vào Đền Ngọc Sơn."
    },
    {
      id: "phoCo",
      name: "Phố Cổ",
      kind: "oldQuarter",
      x: 188,
      y: 168,
      width: 920,
      height: 420,
      solid: false,
      range: 120,
      interactionPoint: { x: 878, y: 620, radius: 50, visibleRange: 230, labelOffsetY: -34 },
      quizId: "phoCo",
      stamp: "Tem Phố Cổ",
      description: "Khu phố buôn bán lâu đời với những ngôi nhà nhỏ san sát."
    },
    {
      id: "nhaThoLon",
      name: "Nhà thờ Lớn Hà Nội",
      kind: "cathedral",
      x: 2348,
      y: 548,
      width: 270,
      height: 194,
      range: 90,
      interactionPoint: { x: 2483, y: 792, radius: 50, visibleRange: 240, labelOffsetY: -36 },
      quizId: "nhaThoLon",
      stamp: "Tem Nhà thờ Lớn Hà Nội",
      description: "Công trình kiến trúc nổi bật giữa khu phố trung tâm với quảng trường nhỏ phía trước."
    }
  ],
  shops: [
    { id: "shopBunCha", foodId: "bunCha", x: 646, y: 626, width: 158, height: 78 },
    { id: "shopCaPheTrung", foodId: "caPheTrung", x: 976, y: 826, width: 166, height: 78 }
  ],
  vehicleShops: [
    {
      id: "vinfastHoanKiem",
      name: "Đại lý VinFast Bờ Hồ",
      vehicleId: "vinfast-electric",
      x: 2160,
      y: 1342,
      width: 178,
      height: 92,
      interactionPoint: { x: 2180, y: 1304, radius: 48, visibleRange: 220, labelOffsetY: -34 }
    }
  ],
  npcs: [
    {
      id: "vendorHoanKiem",
      name: "Cô bán hàng",
      x: 625,
      y: 812,
      color: "#ffd15f",
      task: {
        type: "simple",
        taskId: "vendorIntro",
        reward: NPC_REWARD,
        souvenir: "Thẻ giới thiệu Bún Chả",
        title: "Cô bán hàng",
        intro: "Cháu giúp cô giới thiệu với du khách rằng Bún Chả Hà Nội có chả nướng thơm, bún mềm và nước chấm hài hòa nhé?",
        action: "Giới thiệu món ăn",
        done: "Cô bán hàng cười tươi: Cảm ơn cháu, du khách nghe xong muốn thử ngay!"
      }
    },
    {
      id: "touristHoanKiem",
      name: "Du khách nước ngoài",
      x: 1232,
      y: 1112,
      color: "#7bdff2",
      task: {
        type: "quiz",
        taskId: "touristPostcard",
        quizId: "touristHoGuom",
        intro: "Bạn du khách muốn hỏi về Hồ Gươm. Hãy giúp bạn ấy trả lời nhé.",
        done: "Du khách mỉm cười và tặng bạn một bưu thiếp Hồ Gươm."
      }
    },
    {
      id: "coupleHoGuom",
      name: "Đôi bạn bên hồ",
      x: 1450,
      y: 1240,
      color: "#f59ac0",
      activity: "couple",
      task: {
        type: "ambient",
        taskId: "ambientCoupleHoGuom",
        reward: 5000,
        souvenir: "Ghi chú hẹn bên Hồ Gươm",
        title: "Đôi bạn bên hồ",
        intro: "Hai bạn trẻ đang ngồi nhìn mặt hồ và kể rằng phố đi bộ cuối tuần làm Hồ Gươm giống một phòng khách chung của thành phố.",
        action: "Nghe câu chuyện",
        done: "Hai bạn cười: Hà Nội đông nhưng vẫn có những góc rất chậm."
      }
    },
    {
      id: "danceGroupNhaTho",
      name: "Nhóm nhảy phố đi bộ",
      x: 2310,
      y: 858,
      color: "#f2bd45",
      activity: "danceGroup",
      task: {
        type: "ambient",
        taskId: "ambientDanceNhaTho",
        reward: 5000,
        souvenir: "Nhịp nhảy phố đi bộ",
        title: "Nhóm nhảy phố đi bộ",
        intro: "Một nhóm bạn đang tập động tác ngắn ở quảng trường nhỏ trước Nhà thờ Lớn, nhường lối cho người đi bộ qua lại.",
        action: "Vỗ tay cổ vũ",
        done: "Nhóm nhảy cảm ơn bạn và rủ bạn nhớ quay lại khu Nhà thờ vào buổi tối."
      }
    },
    {
      id: "foodResearcherHoanKiem",
      name: "Nhà nghiên cứu ẩm thực",
      x: 720,
      y: 734,
      color: "#caa6ff",
      task: {
        type: "quizChain",
        taskId: "foodResearchHoanKiem",
        quizIds: ["bunChaHistory", "caPheTrungHistory"],
        reward: NPC_REWARD,
        souvenir: "Phiếu ghi chép ẩm thực phố cổ",
        intro: "Mình đang ghi chép về bún chả và cà phê trứng. Trả lời hai câu khó hơn một chút nhé.",
        done: "Bạn đã giúp hoàn thiện ghi chép ẩm thực phố cổ."
      }
    }
  ],
  exits: [
    {
      id: "busToBaDinh",
      name: "Xe buýt Ba Đình",
      kind: "bus",
      x: 2448,
      y: 1540,
      width: 126,
      height: 76,
      targetMap: "baDinh",
      targetX: 340,
      targetY: 1850,
      message: "Bạn đã đi xe buýt đến khu Ba Đình - Văn Miếu."
    },
    {
      id: "roadToLongBien",
      name: "Lối Long Biên",
      kind: "road",
      x: 36,
      y: 1324,
      width: 102,
      height: 118,
      targetMap: "longBien",
      targetX: 150,
      targetY: 890,
      message: "Bạn đã theo đường phố cổ đến khu Long Biên - Đồng Xuân."
    }
  ],
  decorations: [
    { type: "skyline", x: 120, y: 20, width: 1040, height: 118 },
    { type: "skyline", x: 2180, y: 210, width: 560, height: 120 },
    { type: "turtleTower", x: 1640, y: 690 },
    { type: "lakeRail", x: 1290, y: 266, width: 820, height: 924 },
    ...repeatDecor("tree", [[1212, 292], [1168, 520], [1168, 1020], [2136, 318], [2180, 1000], [1274, 1260], [2060, 1248], [238, 1280], [1000, 1276]]),
    ...repeatDecor("lamp", [[1220, 420], [1218, 832], [2148, 430], [2148, 890], [1510, 1226], [1890, 1226], [580, 1336], [1128, 1358], [2480, 1450]]),
    ...repeatDecor("bench", [[1300, 1228], [1450, 1228], [2060, 1178], [1190, 530], [2134, 534]]),
    ...repeatDecor("motorbike", [[452, 444], [782, 444], [548, 820], [1032, 924], [2485, 1492]]),
    ...repeatDecor("powerPole", [[510, 230], [510, 610], [510, 1020], [850, 330], [850, 1070]]),
    ...repeatDecor("bicycle", [[2260, 706], [2630, 812], [720, 704]]),
    ...repeatDecor("trashBin", [[2294, 746], [1230, 1174], [2118, 1284]]),
    ...repeatDecor("electricBox", [[2220, 676], [1048, 1320]]),
    { type: "zebra", x: 506, y: 1328, width: 132, height: 112, direction: "vertical" },
    { type: "zebra", x: 1120, y: 720, width: 116, height: 96, direction: "vertical" },
    { type: "sign", x: 2512, y: 1490, text: "XE" },
    { type: "streetSign", x: 2298, y: 710, text: "NHÀ THỜ" },
    { type: "banner", x: 892, y: 646, color: "#c9413a" }
  ]
};
