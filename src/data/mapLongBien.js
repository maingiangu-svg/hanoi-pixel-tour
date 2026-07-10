import { NPC_REWARD } from "../state.js";
import { repeatDecor, rowApartments, rowHouses } from "./mapHelpers.js";

export const longBienMap = {
  id: "longBien",
  name: "Long Biên - Đồng Xuân",
  arrivalName: "khu Long Biên - Đồng Xuân",
  width: 3000,
  height: 1800,
  background: "#817d73",
  spawn: { x: 150, y: 890 },
  walkZones: [
    { x: 350, y: 88, width: 900, height: 1540, kind: "sidewalk" },
    { x: 1010, y: 420, width: 690, height: 1040, kind: "sidewalk" },
    { x: 1460, y: 520, width: 270, height: 950, kind: "plaza" },
    { x: 0, y: 840, width: 1240, height: 118, kind: "road" },
    { x: 232, y: 250, width: 116, height: 1360, kind: "road" },
    { x: 420, y: 280, width: 760, height: 106, kind: "road" },
    { x: 420, y: 1160, width: 980, height: 110, kind: "road" },
    { x: 760, y: 720, width: 110, height: 560, kind: "road" },
    { x: 500, y: 430, width: 560, height: 270, kind: "plaza" },
    { x: 856, y: 592, width: 265, height: 104, kind: "sidewalk" },
    { x: 1080, y: 530, width: 1760, height: 128, kind: "bridge" },
    { x: 1090, y: 660, width: 1760, height: 64, kind: "bridge" },
    { x: 1240, y: 1268, width: 410, height: 138, kind: "sidewalk" },
    { x: 1030, y: 1080, width: 360, height: 92, kind: "sidewalk" }
  ],
  water: [
    { x: 1760, y: 0, width: 1240, height: 1800, label: "Sông Hồng", kind: "river" }
  ],
  groundPatches: [
    { x: 0, y: 0, width: 1760, height: 1800, kind: "paving" },
    { x: 362, y: 98, width: 860, height: 1228, kind: "brick" },
    { x: 1000, y: 420, width: 760, height: 1040, kind: "embankment" },
    { x: 1010, y: 1060, width: 660, height: 390, kind: "brick" },
    { x: 1742, y: 0, width: 18, height: 1800, kind: "grass" }
  ],
  buildings: [
    ...rowHouses({ x: 420, y: 130, count: 7, width: 74, height: 104, signs: ["SẮT", "TRÀ", "PHỞ", "KHO", "XE", "BÚN", "ĐIỆN"] }),
    ...rowHouses({ x: 420, y: 980, count: 5, width: 78, height: 102, signs: ["PHỞ", "TRÀ", "CƠM", "BIA", "XE"] }),
    ...rowHouses({ x: 430, y: 1310, count: 6, width: 76, height: 106, signs: ["CỐM", "TRÀ", "BÚN", "CAFE", "SÁCH", "CHỢ"] }),
    ...rowHouses({ x: 900, y: 138, count: 4, width: 76, height: 108, gap: 12, signs: ["GẠCH", "SƠN", "GỖ", "BIA"] }),
    ...rowApartments({ x: 1070, y: 900, count: 3, width: 118, height: 146, gap: 18 }),
    { kind: "marketHall", x: 540, y: 392, width: 470, height: 246, color: "#f0c46b", roof: "#c73c35" },
    { kind: "tubeHouse", x: 90, y: 680, width: 104, height: 126, color: "#9eced6", roof: "#9e4038", door: "#274e68" },
    { kind: "tubeHouse", x: 1040, y: 780, width: 102, height: 118, color: "#e7a768", roof: "#88443d", door: "#5d3b28" },
    { kind: "cafeFront", x: 1136, y: 760, width: 118, height: 92, color: "#d7a65b", roof: "#88443d", sign: "TRÀ ĐÁ" },
    { kind: "cafeFront", x: 1520, y: 1168, width: 120, height: 92, color: "#d8b35f", roof: "#315f8f", sign: "CỐM" },
    { kind: "wall", x: 1700, y: 0, width: 42, height: 1800, color: "#c28d54" }
  ],
  landmarks: [
    {
      id: "cauLongBien",
      name: "Cầu Long Biên",
      kind: "longBridge",
      x: 1060,
      y: 470,
      width: 1800,
      height: 270,
      solid: false,
      range: 110,
      interactionPoint: { x: 1125, y: 610, radius: 52, visibleRange: 250, labelOffsetY: -34 },
      quizId: "cauLongBien",
      stamp: "Tem Cầu Long Biên",
      description: "Cây cầu lịch sử bắc qua Sông Hồng."
    },
    {
      id: "choDongXuan",
      name: "Chợ Đồng Xuân",
      kind: "market",
      x: 540,
      y: 392,
      width: 470,
      height: 246,
      range: 112,
      interactionPoint: { x: 508, y: 665, radius: 50, visibleRange: 230, labelOffsetY: -34 },
      quizId: "choDongXuan",
      stamp: "Tem Chợ Đồng Xuân",
      description: "Khu chợ lâu đời nằm trong vùng phố cổ Hà Nội."
    },
    {
      id: "songHong",
      name: "Sông Hồng",
      kind: "riverLabel",
      x: 1760,
      y: 0,
      width: 1240,
      height: 1800,
      solid: false,
      priority: 9,
      range: 90,
      interactionPoint: { x: 1690, y: 610, radius: 50, visibleRange: 240, labelOffsetY: -34 },
      stamp: "Tem Sông Hồng",
      description: "Dòng sông lớn tạo nên cảnh quan đặc biệt cho khu vực Long Biên."
    }
  ],
  shops: [
    { id: "shopPhoGanh", foodId: "phoGanh", x: 404, y: 1080, width: 164, height: 78 },
    { id: "shopComLangVong", foodId: "comLangVong", x: 1212, y: 1182, width: 170, height: 78 },
    { id: "shopTraDa", foodId: "traDa", x: 910, y: 760, width: 150, height: 70 }
  ],
  npcs: [
    {
      id: "xeOmLongBien",
      name: "Bác xe ôm",
      x: 1350,
      y: 1254,
      color: "#ffd15f",
      task: {
        type: "delivery",
        taskId: "deliveryDongXuan",
        reward: NPC_REWARD,
        souvenir: "Phiếu giao hàng Đồng Xuân",
        packageItem: "Gói hàng nhỏ",
        intro: "Bác cần gửi một gói hàng nhỏ đến Chợ Đồng Xuân. Cháu nhận giúp bác nhé?",
        done: "Bác xe ôm cảm ơn bạn vì đã giao hàng đúng chỗ."
      }
    },
    {
      id: "comVendor",
      name: "Cô bán cốm",
      x: 1420,
      y: 1390,
      color: "#9ef090",
      task: {
        type: "quiz",
        taskId: "comCulture",
        quizId: "comLangVong",
        intro: "Cô bán cốm hỏi bạn một câu nhỏ về thức quà mùa thu Hà Nội.",
        done: "Cô bán cốm gật đầu: Cháu biết về cốm rồi đấy!"
      }
    },
    {
      id: "riversideWalker",
      name: "Người đi dạo ven sông",
      x: 1600,
      y: 920,
      color: "#f2bd45",
      activity: "walk",
      pathAmplitude: 28,
      task: {
        type: "ambient",
        taskId: "ambientRiversideWalker",
        reward: 5000,
        souvenir: "Gió ven Sông Hồng",
        title: "Ven Sông Hồng",
        intro: "Người đi dạo chỉ về phía sông và nói rằng Long Biên luôn có cảm giác vừa cũ vừa rộng vì bờ sông mở ra sau phố.",
        action: "Nghe kể",
        done: "Bạn đứng nhìn một lát và nghe tiếng phố nhỏ phía sau lưng."
      }
    },
    {
      id: "bridgeRunner",
      name: "Bạn chạy bộ trên cầu",
      x: 1320,
      y: 610,
      color: "#ff8fab",
      activity: "jog",
      pathAmplitude: 42,
      task: {
        type: "ambient",
        taskId: "ambientBridgeRunner",
        reward: 5000,
        souvenir: "Nhịp chạy Cầu Long Biên",
        title: "Nhịp cầu Long Biên",
        intro: "Bạn chạy bộ bảo rằng nhịp thép của cầu khiến mỗi bước chân nghe rõ hơn, nhất là lúc gió từ Sông Hồng thổi lên.",
        action: "Chạy theo nhịp cầu",
        done: "Bạn thử bước vài nhịp và hiểu vì sao nhiều người thích đi bộ trên cầu."
      }
    },
    {
      id: "streetStoryteller",
      name: "Bác kể chuyện phố",
      x: 1180,
      y: 870,
      color: "#caa6ff",
      task: {
        type: "quizChain",
        taskId: "streetFoodStoryLongBien",
        quizIds: ["phoGanhHistory", "traDaCulture"],
        reward: NPC_REWARD,
        souvenir: "Mẩu chuyện vỉa hè Long Biên",
        intro: "Bác ngồi bên quán trà đá, kể về phở gánh và vỉa hè. Cháu thử trả lời hai câu để xem có hiểu nhịp phố không nhé.",
        done: "Bác gật gù: Biết ăn cũng là biết nhìn phố."
      }
    }
  ],
  exits: [
    {
      id: "roadBackHoanKiem",
      name: "Lối Hoàn Kiếm",
      kind: "road",
      x: 36,
      y: 832,
      width: 112,
      height: 128,
      targetMap: "hoanKiem",
      targetX: 90,
      targetY: 1370,
      message: "Bạn đã theo con đường cũ quay về khu Hoàn Kiếm - Phố Cổ."
    },
    {
      id: "busToBaDinhFromLongBien",
      name: "Xe buýt Ba Đình",
      kind: "bus",
      x: 1402,
      y: 1310,
      width: 128,
      height: 76,
      targetMap: "baDinh",
      targetX: 2550,
      targetY: 960,
      message: "Bạn đã đi xe buýt đến khu Ba Đình - Văn Miếu."
    }
  ],
  decorations: [
    { type: "skyline", x: 1820, y: 80, width: 880, height: 150 },
    { type: "skyline", x: 420, y: 18, width: 760, height: 118 },
    ...repeatDecor("tree", [[360, 790], [360, 1030], [1150, 970], [1180, 1320], [1660, 780], [1640, 1220]]),
    ...repeatDecor("lamp", [[1040, 560], [1240, 560], [1440, 560], [1640, 560], [1840, 560], [2040, 560], [2240, 560], [2440, 560], [2640, 560]]),
    ...repeatDecor("powerPole", [[238, 420], [238, 740], [238, 1080], [760, 720], [760, 1060]]),
    ...repeatDecor("motorbike", [[370, 968], [620, 968], [870, 968], [1130, 1272], [1300, 1412]]),
    ...repeatDecor("crate", [[1014, 660], [1042, 660], [510, 670], [540, 670], [570, 670]]),
    ...repeatDecor("stall", [[620, 710], [660, 710], [930, 720], [970, 720]]),
    ...repeatDecor("bicycle", [[480, 840], [1080, 1166], [1480, 1264]]),
    ...repeatDecor("streetSign", [[250, 810], [1520, 1260]], { text: "LONG BIÊN" }),
    ...repeatDecor("trashBin", [[390, 838], [1010, 1158], [1540, 1406]]),
    ...repeatDecor("electricBox", [[776, 842], [1190, 1070]]),
    { type: "bridgeTruss", x: 1100, y: 462, width: 1720 },
    { type: "rail", x: 1120, y: 590, width: 1680 },
    { type: "rail", x: 1120, y: 672, width: 1680 },
    { type: "zebra", x: 220, y: 832, width: 140, height: 128, direction: "vertical" },
    { type: "sign", x: 1468, y: 1260, text: "XE" },
    { type: "bench", x: 1010, y: 1090 },
    { type: "banner", x: 610, y: 380, color: "#c9413a" }
  ]
};
