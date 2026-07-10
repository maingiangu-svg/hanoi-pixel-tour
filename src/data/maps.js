import { NPC_REWARD } from "../state.js";

export const maps = {
  hoanKiem: {
    id: "hoanKiem",
    name: "Hoàn Kiếm - Phố Cổ",
    arrivalName: "khu Hoàn Kiếm - Phố Cổ",
    background: "#67ad58",
    walkZones: [
      { x: 0, y: 340, width: 1024, height: 78, kind: "road" },
      { x: 0, y: 500, width: 1024, height: 70, kind: "road" },
      { x: 72, y: 58, width: 70, height: 510, kind: "road" },
      { x: 240, y: 38, width: 64, height: 380, kind: "road" },
      { x: 430, y: 70, width: 64, height: 500, kind: "road" },
      { x: 0, y: 150, width: 560, height: 60, kind: "road" },
      { x: 0, y: 250, width: 560, height: 58, kind: "road" },
      { x: 555, y: 74, width: 58, height: 350, kind: "sidewalk" },
      { x: 610, y: 350, width: 350, height: 64, kind: "sidewalk" },
      { x: 610, y: 74, width: 350, height: 48, kind: "sidewalk" },
      { x: 912, y: 92, width: 54, height: 315, kind: "sidewalk" },
      { x: 600, y: 240, width: 270, height: 38, kind: "bridge" }
    ],
    water: [
      { x: 620, y: 120, width: 292, height: 225, label: "Hồ Gươm" }
    ],
    buildings: [
      { x: 150, y: 68, width: 78, height: 62, color: "#e9b15f", roof: "#a64236" },
      { x: 316, y: 70, width: 94, height: 58, color: "#f2d176", roof: "#c05a42" },
      { x: 16, y: 62, width: 48, height: 70, color: "#8bc6d8", roof: "#b5483d" },
      { x: 154, y: 218, width: 72, height: 54, color: "#f0a96b", roof: "#7c4f9e" },
      { x: 316, y: 218, width: 94, height: 55, color: "#d6df74", roof: "#ba4b3e" },
      { x: 16, y: 218, width: 48, height: 54, color: "#f3c56b", roof: "#3d7fa5" },
      { x: 150, y: 426, width: 82, height: 56, color: "#dfe17e", roof: "#a64236" },
      { x: 314, y: 426, width: 96, height: 56, color: "#e7c07a", roof: "#784b9e" },
      { x: 510, y: 428, width: 72, height: 52, color: "#8fd2b1", roof: "#b34844" },
      { x: 622, y: 432, width: 76, height: 50, color: "#f0d071", roof: "#3e6e93" },
      { x: 782, y: 430, width: 86, height: 52, color: "#e3a85d", roof: "#9f3f38" }
    ],
    landmarks: [
      {
        id: "hoGuom",
        name: "Hồ Gươm",
        kind: "lake",
        x: 620,
        y: 120,
        width: 292,
        height: 225,
        solid: false,
        priority: 6,
        range: 84,
        quizId: "hoGuom",
        stamp: "Tem check-in Hồ Gươm",
        description: "Mặt hồ xanh nằm giữa trung tâm Hà Nội."
      },
      {
        id: "denNgocSon",
        name: "Đền Ngọc Sơn",
        kind: "temple",
        x: 820,
        y: 205,
        width: 72,
        height: 66,
        range: 78,
        quizId: "denNgocSon",
        stamp: "Tem Đền Ngọc Sơn",
        description: "Ngôi đền nhỏ nổi bật bên Hồ Gươm."
      },
      {
        id: "cauTheHuc",
        name: "Cầu Thê Húc",
        kind: "redBridge",
        x: 600,
        y: 238,
        width: 252,
        height: 40,
        solid: false,
        range: 70,
        stamp: "Tem Cầu Thê Húc",
        souvenir: "Vé tham quan Cầu Thê Húc",
        description: "Cây cầu đỏ dẫn vào Đền Ngọc Sơn."
      },
      {
        id: "phoCo",
        name: "Phố Cổ",
        kind: "oldQuarter",
        x: 310,
        y: 76,
        width: 110,
        height: 64,
        range: 82,
        quizId: "phoCo",
        stamp: "Tem Phố Cổ",
        description: "Khu phố buôn bán lâu đời với những ngôi nhà nhỏ san sát."
      }
    ],
    shops: [
      { id: "shopBunCha", foodId: "bunCha", x: 148, y: 436, width: 118, height: 56 },
      { id: "shopCaPheTrung", foodId: "caPheTrung", x: 320, y: 216, width: 128, height: 56 }
    ],
    npcs: [
      {
        id: "vendorHoanKiem",
        name: "Cô bán hàng",
        x: 104,
        y: 285,
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
        x: 580,
        y: 314,
        color: "#7bdff2",
        task: {
          type: "quiz",
          taskId: "touristPostcard",
          quizId: "touristHoGuom",
          intro: "Bạn du khách muốn hỏi về Hồ Gươm. Hãy giúp bạn ấy trả lời nhé.",
          done: "Du khách mỉm cười và tặng bạn một bưu thiếp Hồ Gươm."
        }
      }
    ],
    exits: [
      {
        id: "busToBaDinh",
        name: "Xe buýt Ba Đình",
        kind: "bus",
        x: 892,
        y: 502,
        width: 92,
        height: 58,
        targetMap: "baDinh",
        targetX: 888,
        targetY: 520,
        message: "Bạn đã đi xe buýt đến khu Ba Đình - Văn Miếu."
      },
      {
        id: "roadToLongBien",
        name: "Lối Long Biên",
        kind: "road",
        x: 10,
        y: 346,
        width: 70,
        height: 62,
        targetMap: "longBien",
        targetX: 98,
        targetY: 350,
        message: "Bạn đã theo đường phố cổ đến khu Long Biên - Đồng Xuân."
      }
    ],
    decorations: [
      { type: "zebra", x: 72, y: 338, width: 70, height: 82, direction: "vertical" },
      { type: "zebra", x: 424, y: 500, width: 76, height: 70, direction: "horizontal" },
      { type: "tree", x: 585, y: 96 }, { type: "tree", x: 943, y: 136 },
      { type: "tree", x: 586, y: 404 }, { type: "tree", x: 943, y: 384 },
      { type: "lamp", x: 638, y: 84 }, { type: "lamp", x: 914, y: 360 },
      { type: "lamp", x: 538, y: 334 }, { type: "tree", x: 42, y: 592 },
      { type: "tree", x: 990, y: 592 },
      { type: "bench", x: 632, y: 362 }, { type: "bench", x: 842, y: 84 },
      { type: "planter", x: 506, y: 318 }, { type: "planter", x: 944, y: 424 },
      { type: "sign", x: 898, y: 454, text: "XE" }, { type: "banner", x: 250, y: 314, color: "#c9413a" },
      { type: "rail", x: 626, y: 114, width: 270 }, { type: "rail", x: 626, y: 348, width: 270 }
    ]
  },

  baDinh: {
    id: "baDinh",
    name: "Ba Đình - Văn Miếu",
    arrivalName: "khu Ba Đình - Văn Miếu",
    background: "#6da75a",
    walkZones: [
      { x: 0, y: 80, width: 1024, height: 58, kind: "road" },
      { x: 0, y: 350, width: 1024, height: 62, kind: "road" },
      { x: 0, y: 500, width: 1024, height: 72, kind: "road" },
      { x: 70, y: 0, width: 70, height: 640, kind: "road" },
      { x: 480, y: 0, width: 72, height: 640, kind: "road" },
      { x: 800, y: 0, width: 70, height: 640, kind: "road" },
      { x: 180, y: 145, width: 390, height: 175, kind: "plaza" },
      { x: 190, y: 405, width: 315, height: 92, kind: "sidewalk" },
      { x: 610, y: 394, width: 248, height: 104, kind: "sidewalk" }
    ],
    water: [
      { x: 630, y: 248, width: 120, height: 58, label: "Ao sen" }
    ],
    buildings: [
      { x: 16, y: 160, width: 44, height: 132, color: "#e7c872", roof: "#9f4b3f" },
      { x: 152, y: 166, width: 40, height: 105, color: "#d9d2a1", roof: "#3e6e93" },
      { x: 900, y: 154, width: 84, height: 82, color: "#d6b36a", roof: "#9f4b3f" },
      { x: 900, y: 255, width: 84, height: 70, color: "#9ac7ba", roof: "#7752a8" },
      { x: 36, y: 430, width: 88, height: 54, color: "#f0bd69", roof: "#ab3d37" },
      { x: 902, y: 584, width: 84, height: 42, color: "#dde08c", roof: "#3e6e93" }
    ],
    landmarks: [
      {
        id: "quangTruongBaDinh",
        name: "Quảng trường Ba Đình",
        kind: "plazaLabel",
        x: 194,
        y: 246,
        width: 362,
        height: 68,
        solid: false,
        priority: 7,
        range: 65,
        stamp: "Tem Quảng trường Ba Đình",
        description: "Không gian quảng trường rộng lớn trước Lăng Bác."
      },
      {
        id: "langBac",
        name: "Lăng Bác",
        kind: "mausoleum",
        x: 302,
        y: 160,
        width: 184,
        height: 78,
        range: 86,
        quizId: "langBac",
        stamp: "Tem Lăng Bác",
        description: "Công trình trang nghiêm tại Quảng trường Ba Đình."
      },
      {
        id: "chuaMotCot",
        name: "Chùa Một Cột",
        kind: "onePillar",
        x: 650,
        y: 166,
        width: 92,
        height: 92,
        range: 82,
        quizId: "chuaMotCot",
        stamp: "Tem Chùa Một Cột",
        description: "Ngôi chùa có kiến trúc như bông sen trên một cột."
      },
      {
        id: "hoangThanh",
        name: "Hoàng Thành Thăng Long",
        kind: "citadel",
        x: 615,
        y: 404,
        width: 188,
        height: 82,
        range: 86,
        quizId: "hoangThanh",
        stamp: "Tem Hoàng Thành Thăng Long",
        description: "Di sản văn hóa gắn với lịch sử kinh đô Thăng Long."
      },
      {
        id: "vanMieu",
        name: "Văn Miếu - Quốc Tử Giám",
        kind: "gate",
        x: 246,
        y: 418,
        width: 212,
        height: 74,
        range: 90,
        quizId: "vanMieu",
        stamp: "Tem Văn Miếu",
        description: "Không gian văn hóa tôn vinh truyền thống hiếu học."
      }
    ],
    shops: [
      { id: "shopPhoHaNoi", foodId: "phoHaNoi", x: 884, y: 432, width: 108, height: 56 },
      { id: "shopBanhCuon", foodId: "banhCuon", x: 626, y: 440, width: 126, height: 54 }
    ],
    npcs: [
      {
        id: "guideBaDinh",
        name: "Hướng dẫn viên",
        x: 560,
        y: 314,
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
        x: 360,
        y: 506,
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
        x: 900,
        y: 506,
        width: 92,
        height: 58,
        targetMap: "hoanKiem",
        targetX: 842,
        targetY: 516,
        message: "Bạn đã đi xe buýt về khu Hoàn Kiếm - Phố Cổ."
      },
      {
        id: "busToLongBien",
        name: "Xe buýt Long Biên",
        kind: "bus",
        x: 10,
        y: 84,
        width: 92,
        height: 52,
        targetMap: "longBien",
        targetX: 610,
        targetY: 520,
        message: "Bạn đã đi xe buýt đến khu Long Biên - Đồng Xuân."
      }
    ],
    decorations: [
      { type: "zebra", x: 70, y: 348, width: 70, height: 64, direction: "vertical" },
      { type: "zebra", x: 478, y: 498, width: 76, height: 74, direction: "vertical" },
      { type: "flag", x: 394, y: 145 }, { type: "flag", x: 432, y: 145 },
      { type: "tree", x: 172, y: 116 }, { type: "tree", x: 576, y: 120 },
      { type: "tree", x: 162, y: 326 }, { type: "tree", x: 882, y: 372 },
      { type: "lamp", x: 214, y: 330 }, { type: "lamp", x: 528, y: 330 },
      { type: "lamp", x: 768, y: 500 }, { type: "tree", x: 588, y: 584 },
      { type: "bench", x: 246, y: 286 }, { type: "bench", x: 458, y: 286 },
      { type: "planter", x: 568, y: 420 }, { type: "planter", x: 820, y: 420 },
      { type: "lotus", x: 646, y: 262 }, { type: "lotus", x: 708, y: 280 },
      { type: "sign", x: 812, y: 450, text: "SỬ" }, { type: "banner", x: 230, y: 138, color: "#d63131" }
    ]
  },

  longBien: {
    id: "longBien",
    name: "Long Biên - Đồng Xuân",
    arrivalName: "khu Long Biên - Đồng Xuân",
    background: "#72aa52",
    walkZones: [
      { x: 0, y: 330, width: 1024, height: 76, kind: "bridge" },
      { x: 0, y: 105, width: 620, height: 58, kind: "road" },
      { x: 0, y: 245, width: 640, height: 60, kind: "road" },
      { x: 0, y: 520, width: 760, height: 70, kind: "road" },
      { x: 145, y: 0, width: 70, height: 640, kind: "road" },
      { x: 470, y: 70, width: 72, height: 520, kind: "road" },
      { x: 236, y: 245, width: 305, height: 94, kind: "plaza" }
    ],
    water: [
      { x: 705, y: 0, width: 319, height: 640, label: "Sông Hồng" }
    ],
    buildings: [
      { x: 42, y: 36, width: 84, height: 54, color: "#e8c46f", roof: "#9e4038" },
      { x: 234, y: 40, width: 88, height: 48, color: "#8fcbbd", roof: "#315f8f" },
      { x: 348, y: 42, width: 88, height: 48, color: "#efb36b", roof: "#7c4c9d" },
      { x: 48, y: 178, width: 78, height: 52, color: "#dfe179", roof: "#9e4038" },
      { x: 230, y: 180, width: 82, height: 48, color: "#f0ce72", roof: "#315f8f" },
      { x: 352, y: 178, width: 84, height: 50, color: "#e7a768", roof: "#88443d" },
      { x: 44, y: 430, width: 82, height: 58, color: "#9eced6", roof: "#9e4038" },
      { x: 230, y: 430, width: 94, height: 58, color: "#e3c470", roof: "#315f8f" }
    ],
    landmarks: [
      {
        id: "cauLongBien",
        name: "Cầu Long Biên",
        kind: "longBridge",
        x: 574,
        y: 306,
        width: 420,
        height: 94,
        solid: false,
        range: 82,
        quizId: "cauLongBien",
        stamp: "Tem Cầu Long Biên",
        description: "Cây cầu lịch sử bắc qua Sông Hồng."
      },
      {
        id: "choDongXuan",
        name: "Chợ Đồng Xuân",
        kind: "market",
        x: 258,
        y: 128,
        width: 222,
        height: 106,
        range: 92,
        quizId: "choDongXuan",
        stamp: "Tem Chợ Đồng Xuân",
        description: "Khu chợ lâu đời nằm trong vùng phố cổ Hà Nội."
      },
      {
        id: "songHong",
        name: "Sông Hồng",
        kind: "riverLabel",
        x: 705,
        y: 0,
        width: 319,
        height: 640,
        solid: false,
        priority: 9,
        range: 72,
        stamp: "Tem Sông Hồng",
        description: "Dòng sông lớn tạo nên cảnh quan đặc biệt cho khu vực Long Biên."
      }
    ],
    shops: [
      { id: "shopPhoGanh", foodId: "phoGanh", x: 78, y: 436, width: 126, height: 56 },
      { id: "shopComLangVong", foodId: "comLangVong", x: 544, y: 454, width: 126, height: 56 },
      { id: "shopTraDa", foodId: "traDa", x: 330, y: 250, width: 118, height: 50 }
    ],
    npcs: [
      {
        id: "xeOmLongBien",
        name: "Bác xe ôm",
        x: 584,
        y: 420,
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
        x: 628,
        y: 520,
        color: "#9ef090",
        task: {
          type: "quiz",
          taskId: "comCulture",
          quizId: "comLangVong",
          intro: "Cô bán cốm hỏi bạn một câu nhỏ về thức quà mùa thu Hà Nội.",
          done: "Cô bán cốm gật đầu: Cháu biết về cốm rồi đấy!"
        }
      }
    ],
    exits: [
      {
        id: "roadBackHoanKiem",
        name: "Lối Hoàn Kiếm",
        kind: "road",
        x: 10,
        y: 338,
        width: 72,
        height: 58,
        targetMap: "hoanKiem",
        targetX: 116,
        targetY: 356,
        message: "Bạn đã theo con đường cũ quay về khu Hoàn Kiếm - Phố Cổ."
      },
      {
        id: "busToBaDinhFromLongBien",
        name: "Xe buýt Ba Đình",
        kind: "bus",
        x: 628,
        y: 526,
        width: 92,
        height: 54,
        targetMap: "baDinh",
        targetX: 852,
        targetY: 520,
        message: "Bạn đã đi xe buýt đến khu Ba Đình - Văn Miếu."
      }
    ],
    decorations: [
      { type: "zebra", x: 145, y: 328, width: 72, height: 80, direction: "vertical" },
      { type: "zebra", x: 466, y: 516, width: 80, height: 76, direction: "vertical" },
      { type: "tree", x: 20, y: 314 }, { type: "tree", x: 620, y: 94 },
      { type: "tree", x: 236, y: 606 }, { type: "lamp", x: 552, y: 322 },
      { type: "lamp", x: 676, y: 322 }, { type: "lamp", x: 890, y: 322 },
      { type: "stall", x: 262, y: 252 }, { type: "stall", x: 292, y: 252 },
      { type: "stall", x: 472, y: 252 }, { type: "tree", x: 682, y: 604 },
      { type: "crate", x: 492, y: 176 }, { type: "crate", x: 520, y: 178 },
      { type: "crate", x: 252, y: 244 }, { type: "planter", x: 540, y: 588 },
      { type: "sign", x: 644, y: 468, text: "XE" }, { type: "rail", x: 716, y: 304, width: 276 },
      { type: "rail", x: 716, y: 400, width: 276 }, { type: "bench", x: 234, y: 526 }
    ]
  }
};
