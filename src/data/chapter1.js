export const CHAPTER_1_ID = "chapter-1";
export const CHAPTER_1_TITLE = "Người lạ giữa Hà Nội";

export const CHAPTER_1_REWARDS = Object.freeze({
  historyMark: "history-hoan-kiem",
  humanMemory: "memory-tea-stall"
});

export const CHAPTER_1_CLUES = Object.freeze({
  knownAlley: "clue-known-alley",
  childhoodSong: "clue-childhood-song",
  familiarFood: "clue-familiar-food"
});

export const CHAPTER_1_AREAS = Object.freeze([
  { id: "ho-guom", label: "Hồ Gươm", mapId: "hoanKiem", unlocked: true },
  { id: "pho-co", label: "Phố cổ", mapId: "hoanKiem", unlocked: true },
  { id: "tea-stall", label: "Khu trà đá", mapId: "hoanKiem", unlocked: true },
  { id: "nha-tho-lon", label: "Nhà thờ Lớn", mapId: "churchInterior", storyFlag: "chapter1ChurchUnlocked" },
  { id: "ba-dinh", label: "Ba Đình", mapId: "baDinh", storyFlag: "chapter2BaDinhUnlocked" },
  { id: "van-mieu", label: "Văn Miếu", mapId: "baDinh", storyFlag: "chapter2VanMieuUnlocked" },
  { id: "long-bien", label: "Long Biên", mapId: "longBien" }
]);

export const CHAPTER_1_POINTS = Object.freeze({
  movement: point("chapter1-movement", "Đi theo Mơ", 1248, 1216, "guide"),
  mapTutorial: point("chapter1-map", "Mở bản đồ", 1274, 1216, "guide"),
  modernLight: point("chapter1-light", "Quan sát đèn điện", 1320, 1212, "lamp"),
  modernBike: point("chapter1-bike", "Quan sát xe máy", 1400, 1230, "motorbike"),
  modernPhone: point("chapter1-phone", "Quan sát điện thoại", 1480, 1208, "phone"),
  modernMoney: point("chapter1-money", "Tìm hiểu tiền hiện đại", 1550, 1214, "money"),
  lakeInfo: point("chapter1-lake", "Tìm hiểu Hồ Gươm", 1226, 1020, "information", 52),
  knownAlley: point("chapter1-alley", "Đi vào ngõ nhỏ", 1018, 1148, "alley", 54),
  childhoodSong: point("chapter1-song", "Lắng nghe đứa trẻ", 1112, 1056, "child", 52),
  familiarFood: point("chapter1-food", "Nếm món Hà Nội", 1050, 1200, "food", 52),
  teaTalk: point("chapter1-tea-talk", "Nói chuyện với cô trà đá", 1170, 906, "teaVendor", 58),
  teaTask: point("chapter1-tea-task", "Xếp lại bàn ghế trà đá", 1128, 934, "teaTask", 52),
  branchReturn: point("chapter1-return", "Tìm dấu hiệu ở Tháp Rùa", 1294, 824, "turtleSignal", 58),
  branchStay: point("chapter1-stay", "Giúp bác bán báo tính tiền", 824, 740, "newspaperVendor", 58),
  branchInvestigate: point("chapter1-investigate", "Đọc bảng thông tin cũ", 884, 620, "oldBoard", 54)
});

export const CHAPTER_1_STAGE_ORDER = Object.freeze([
  "movement",
  "mapTutorial",
  "modernLight",
  "modernBike",
  "modernPhone",
  "modernMoney",
  "lakeInfo",
  "lakeQuiz",
  "knownAlley",
  "childhoodSong",
  "familiarFood",
  "teaTalk",
  "teaTask",
  "originBranch",
  "chapterComplete"
]);

export const CHAPTER_1_OBJECTIVES = Object.freeze({
  movement: "Đi theo Mơ và làm quen với cách di chuyển.",
  mapTutorial: "Nhấn M để xem bản đồ Hoàn Kiếm.",
  modernLight: "Theo Mơ và quan sát chiếc đèn điện.",
  modernBike: "Quan sát chiếc xe máy trên phố.",
  modernPhone: "Tìm hiểu chiếc điện thoại hiện đại.",
  modernMoney: "Nghe Mơ giải thích cách dùng tiền hiện đại.",
  lakeInfo: "Tới Hồ Gươm và đọc thông tin bên bờ hồ.",
  lakeQuiz: "Trả lời câu hỏi lịch sử về Hồ Gươm.",
  knownAlley: "Theo cảm giác quen thuộc tới con ngõ nhỏ.",
  childhoodSong: "Lắng nghe đứa trẻ đang hát gần bờ hồ.",
  familiarFood: "Nếm một món Hà Nội ở quầy nhỏ gần phố.",
  teaTalk: "Nói chuyện với cô bán trà đá.",
  teaTask: "Giúp cô trà đá xếp lại bàn ghế và cốc nước.",
  originBranch: "Hoàn thành lựa chọn đầu tiên của bạn ở Hà Nội.",
  chapterComplete: "Nói chuyện với Mơ để tiếp tục hành trình."
});

export const CHAPTER_1_QUESTS = Object.freeze([
  {
    id: "chapter1-modern-world",
    title: "Thế giới không có linh khí",
    description: "Đi cùng Mơ và làm quen với những vật dụng của Hà Nội hiện đại.",
    stages: ["movement", "mapTutorial", "modernLight", "modernBike", "modernPhone", "modernMoney"]
  },
  {
    id: "chapter1-lake",
    title: "Mặt hồ giữa thành phố",
    description: "Tìm hiểu Hồ Gươm và trả lời câu hỏi lịch sử.",
    stages: ["lakeInfo", "lakeQuiz"]
  },
  {
    id: "chapter1-tea",
    title: "Một cốc trà, một câu chuyện",
    description: "Nghe một câu chuyện đời sống và giúp cô bán trà đá một việc nhỏ.",
    stages: ["teaTalk", "teaTask"]
  }
]);

export const CHAPTER_1_CUTSCENES = Object.freeze({
  light: [
    speech("Mơ", "Đó là đèn điện. Nó sáng nhờ dòng điện chạy trong dây."),
    speech("Bạn", "Không có linh khí mà vẫn giữ được ánh sáng. Người ở đây đã thuần hóa sấm chớp sao?"),
    speech("Mơ", "Bọn mình gọi là đóng tiền điện đúng hạn."),
    speech("Bạn", "Một loại cống nạp rất thực tế.")
  ],
  bike: [
    speech("Bạn", "Cỗ xe sắt ấy nhanh, nhưng tiếng kêu không nhỏ."),
    speech("Mơ", "Xe máy đấy. Ở Hà Nội, nghe tiếng xe cũng là một cách biết phố đang thức."),
    speech("Bạn", "Ta sẽ đứng cách nó một khoảng đáng kính.")
  ],
  phone: [
    speech("Mơ", "Đây là điện thoại. Nó giúp gọi người ở rất xa, xem bản đồ và giữ đủ thứ thông tin."),
    speech("Bạn", "Truyền âm ngàn dặm, vậy sao ai dùng nó cũng cúi đầu?"),
    speech("Mơ", "Đó là điểm yếu khó chữa nhất của pháp bảo này.")
  ],
  money: [
    speech("Mơ", "Đây là tiền hiện đại. Bạn dùng nó để mua đồ ăn, đi xe và trả cho các dịch vụ."),
    speech("Bạn", "Một tờ giấy nhỏ mà đổi được cả bữa ăn?"),
    speech("Mơ", "Đúng. Và đừng thử trả quán bằng linh thạch nhé."),
    speech("Bạn", "Ta sẽ ghi nhớ. Có vẻ chủ quán ở đây không nhận bảo vật cổ.")
  ],
  alley: [
    speech("Bạn", "Rẽ bên này."),
    speech("Mơ", "Bạn đã từng tới đây sao?"),
    speech("Bạn", "Không… nhưng chân ta tự bước."),
    { type: "storyClue", clueId: CHAPTER_1_CLUES.knownAlley }
  ],
  song: [
    narration("Một đứa trẻ ngân nga một giai điệu cũ rồi bỏ lửng ở cuối câu."),
    speech("Bạn", "…và ngọn gió đưa ta về ngõ nhỏ."),
    narration("Đứa trẻ cười, còn Mơ bỗng im lặng."),
    { type: "storyClue", clueId: CHAPTER_1_CLUES.childhoodSong },
    { type: "letterbox", to: 1, duration: 220 },
    { type: "camera", entityId: "mo", zoom: 1.8, duration: 480, trackEntity: true },
    { type: "suspicion", active: true, entityId: "mo", zoom: 1.8, audioDuck: 0.18, heartbeat: true },
    internal("Bài hát đó…"),
    internal("Bà từng hát nó mỗi khi nhắc tới đứa trẻ mất tích."),
    internal("Không thể nào. Chuyện đó đã xảy ra quá lâu rồi."),
    { type: "suspicion", active: false, audioDuck: 0.5 },
    { type: "cameraRestore", duration: 480 },
    { type: "letterbox", to: 0, duration: 220 },
    speech("Mơ", "Bạn học bài hát ấy ở đâu?"),
    speech("Bạn", "Ta không nhớ.")
  ],
  food: [
    narration("Người bán hàng mời hai người một miếng bánh cuốn nóng vừa tráng."),
    speech("Bạn", "Vị này… vẫn giống như trước."),
    speech("Mơ", "Trước nào?"),
    speech("Bạn", "Ta không biết. Ký ức vừa tới rồi lại biến mất."),
    { type: "storyClue", clueId: CHAPTER_1_CLUES.familiarFood }
  ],
  teaTalk: [
    speech("Cô bán trà đá", "Vỉa hè Hà Nội vui nhất là lúc người ta chịu ngồi lại với nhau một lát."),
    speech("Bạn", "Một chiếc bàn nhỏ mà biết được chuyện của cả con phố."),
    speech("Cô bán trà đá", "Cháu nói nghe lạ, nhưng cũng đúng. Giúp cô xếp lại mấy chiếc ghế và cốc nước nhé?"),
    speech("Mơ", "Việc nhỏ thôi. Mình làm cùng bạn.")
  ],
  teaTask: [
    narration("Bạn kê hai chiếc ghế nhựa sát bàn, gom cốc và đặt bình trà ngay ngắn."),
    speech("Cô bán trà đá", "Thế là gọn rồi. Uống cốc trà đi, coi như cô cảm ơn."),
    speech("Bạn", "Ở nơi này, một cốc trà cũng đủ khiến người xa lạ ngồi gần nhau hơn.")
  ],
  branchReturn: [
    narration("Mặt nước quanh Tháp Rùa rung lên thành một vòng sáng rất mảnh."),
    speech("Bạn", "Không phải linh khí… nhưng cấu trúc không gian ở đây từng bị chạm tới."),
    speech("Mơ", "Bạn thấy điều gì mà mình không thấy?"),
    speech("Bạn", "Một dấu vết. Chưa đủ để mở đường, nhưng đủ để biết ta không tới đây ngẫu nhiên.")
  ],
  branchInvestigate: [
    narration("Tấm bảng cũ ghi những lần đổi tên phố và mốc tu sửa quanh hồ."),
    speech("Bạn", "Ta nhớ một lối đi không còn được ghi ở đây."),
    speech("Mơ", "Nếu ký ức của bạn cũ hơn tấm bảng này, nó có thể dẫn tới câu trả lời."),
    speech("Bạn", "Hoặc dẫn tới một câu hỏi lớn hơn.")
  ],
  branchStay: [
    speech("Bác bán báo", "Đúng rồi, mười tám nghìn. Cháu tính nhanh đấy."),
    speech("Bạn", "Tiền ở đây nhiều con số hơn linh thạch, nhưng quy tắc lại rất công bằng."),
    speech("Mơ", "Bạn vừa giúp bác ấy, lại học được cách dùng tiền. Khá nhanh đấy."),
    speech("Bạn", "Nếu ở lại, ta nên bắt đầu bằng việc không trả nhầm tiền.")
  ],
  finale: [
    speech("Mơ", "Có một nơi mình muốn đưa bạn tới. Có thể tiếng chuông ở đó sẽ giúp bạn nhớ thêm.")
  ]
});

function point(id, label, x, y, kind, radius = 50) {
  return Object.freeze({ id, label, mapId: "hoanKiem", x, y, kind, radius, visibleRange: 210 });
}

function speech(speaker, text) {
  return Object.freeze({ type: "dialogue", kind: "speech", speaker, text });
}

function internal(text) {
  return Object.freeze({ type: "dialogue", kind: "internal", speaker: "Mơ (nghĩ)", text });
}

function narration(text) {
  return Object.freeze({ type: "dialogue", kind: "narration", text });
}
