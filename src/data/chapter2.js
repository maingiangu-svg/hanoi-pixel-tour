export const CHAPTER_2_ID = "chapter-2";
export const CHAPTER_2_TITLE = "Tiếng chuông từ một đời khác";

export const CHAPTER_2_REWARDS = Object.freeze({
  historyMark: "history-cathedral",
  humanMemory: "memory-mo-and-children"
});

export const CHAPTER_2_CLUES = Object.freeze({
  churchBell: "clue-church-bell-memory",
  oldPhoto: "clue-mo-old-photo"
});

export const CHAPTER_2_POINTS = Object.freeze({
  enterChurch: point("chapter2-church-arrival", "Lắng nghe tiếng chuông", "hoanKiem", 2484, 790, "churchBell", 118),
  talkPriest: point("chapter2-priest", "Nói chuyện với Cha xứ", "churchInterior", 700, 252, "priest", 62),
  cathedralHistory: point("chapter2-history", "Tìm hiểu Nhà thờ Lớn", "hoanKiem", 2483, 792, "history", 54),
  cathedralQuiz: point("chapter2-history-quiz", "Trả lời câu hỏi lịch sử", "hoanKiem", 2483, 792, "history", 54),
  helpChildren: point("chapter2-children", "Giúp bọn trẻ ở sân nhỏ", "hoanKiem", 2512, 1100, "children", 62),
  observeMass: point("chapter2-mass", "Quan sát thánh lễ", "churchInterior", 700, 720, "massSeat", 62),
  oldPhoto: point("chapter2-old-box", "Tìm Mơ ở sân nhỏ", "hoanKiem", 2460, 1102, "oldBox", 62),
  hangoutInvite: point("chapter2-find-mo", "Mời Mơ đi chơi", "hoanKiem", 2512, 1100, "mo", 68),
  hangoutDestination: point("chapter2-hangout-lake", "Đưa Mơ tới Hồ Gươm", "hoanKiem", 1226, 1020, "lake", 64),
  hangoutPhoto: point("chapter2-photo-with-mo", "Chụp ảnh cùng Mơ", "hoanKiem", 1226, 1020, "photo", 76),
  returnMo: point("chapter2-return-mo", "Đưa Mơ về Nhà thờ", "hoanKiem", 2518, 842, "return", 62)
});

export const CHAPTER_2_STAGE_ORDER = Object.freeze([
  "enterChurch",
  "talkPriest",
  "cathedralHistory",
  "cathedralQuiz",
  "helpChildren",
  "observeMass",
  "oldPhoto",
  "hangoutInvite",
  "hangoutDestination",
  "hangoutPhoto",
  "returnMo",
  "relationshipChoice",
  "chapterComplete"
]);

export const CHAPTER_2_OBJECTIVES = Object.freeze({
  enterChurch: "Tới Nhà thờ Lớn và lắng nghe tiếng chuông.",
  talkPriest: "Vào bên trong Nhà thờ và nói chuyện với Cha xứ.",
  cathedralHistory: "Tìm hiểu lịch sử Nhà thờ Lớn tại sân trước.",
  cathedralQuiz: "Trả lời câu hỏi lịch sử về Nhà thờ Lớn.",
  helpChildren: "Tới sân nhỏ khi Mơ đang chơi cùng bọn trẻ và giúp các em.",
  observeMass: "Tới Nhà thờ trong giờ lễ 18:00–19:00 và ngồi quan sát.",
  oldPhoto: "Sau giờ lễ, tìm Mơ ở sân nhỏ gần Nhà thờ.",
  hangoutInvite: "Nói chuyện và mời Mơ đi chơi.",
  hangoutDestination: "Đưa Mơ tới bờ Hồ Gươm.",
  hangoutPhoto: "Nhấn P tại điểm chụp Hồ Gươm để chụp một bức ảnh cùng Mơ.",
  returnMo: "Đưa Mơ về Nhà thờ Lớn để thời gian tiếp tục.",
  relationshipChoice: "Nói với Mơ điều bạn đang nghĩ.",
  chapterComplete: "Lắng nghe ký ức cuối cùng của chương."
});

export const CHAPTER_2_QUESTS = Object.freeze([
  Object.freeze({
    id: "chapter2-bell",
    title: "Tiếng chuông quen thuộc",
    description: "Theo tiếng chuông tới Nhà thờ Lớn và nói chuyện với Cha xứ.",
    stages: Object.freeze(["enterChurch", "talkPriest"])
  }),
  Object.freeze({
    id: "chapter2-cathedral-history",
    title: "Những lớp thời gian",
    description: "Tìm hiểu lịch sử Nhà thờ Lớn và giúp bọn trẻ ở sân nhỏ.",
    stages: Object.freeze(["cathedralHistory", "cathedralQuiz", "helpChildren"])
  }),
  Object.freeze({
    id: "chapter2-mass",
    title: "Một giờ yên lặng",
    description: "Tham dự hoặc quan sát thánh lễ diễn ra từ 18:00 đến 19:00.",
    stages: Object.freeze(["observeMass", "oldPhoto"])
  }),
  Object.freeze({
    id: "chapter2-hangout",
    title: "Một buổi đi chơi cùng Mơ",
    description: "Đưa Mơ tới Hồ Gươm, chụp ảnh cùng nhau rồi đưa cô về Nhà thờ.",
    stages: Object.freeze(["hangoutInvite", "hangoutDestination", "hangoutPhoto", "returnMo", "relationshipChoice", "chapterComplete"])
  })
]);

export const CHAPTER_2_MEMORY_SCENE = Object.freeze({
  id: "chapter2-memory-scene",
  renderer: "chapter2Memory",
  state: Object.freeze({ flash: null, oldPhotoVisible: false })
});

export const CHAPTER_2_CUTSCENES = Object.freeze({
  churchBell: Object.freeze([
    { type: "letterbox", to: 1, duration: 220 },
    { type: "audioCue", cue: "churchBell" },
    narration("Tiếng chuông ngân qua khoảng sân. Bạn bỗng đứng khựng lại."),
    memoryFlash("adult-hand", 180),
    memoryFlash("child", 170),
    memoryFlash("church-yard", 190),
    memoryFlash("turtle-pendant", 210),
    memoryFlash("distorted-name", 190),
    { type: "sceneState", patch: { flash: null } },
    speech("Bạn", "Ta đã từng nghe tiếng chuông này."),
    speech("Mơ", "Bạn nói chưa từng tới Hà Nội."),
    speech("Bạn", "Ta không hiểu."),
    { type: "storyClue", clueId: CHAPTER_2_CLUES.churchBell },
    { type: "letterbox", to: 0, duration: 220 }
  ]),
  priest: Object.freeze([
    speech("Cha xứ", "Có những ký ức không trở lại bằng hình ảnh, mà bằng một âm thanh ta từng nghe khi còn rất nhỏ."),
    speech("Bạn", "Nếu tiếng chuông mở được một khe trong ký ức, con nên tìm phần còn lại ở đâu?"),
    speech("Cha xứ", "Hãy nhìn công trình, lắng nghe người sống quanh nó, rồi để ký ức tự tìm đường. Đừng ép nó."),
    speech("Mơ", "Mình sẽ giúp bạn tìm hiểu nơi này.")
  ]),
  children: Object.freeze([
    narration("Chiếc chong chóng giấy của bọn trẻ mắc trên một cành thấp cạnh sân."),
    speech("Bạn", "Đứng lùi lại. Ta không cần khinh công cho việc này."),
    narration("Bạn dùng một chiếc sào nhỏ gỡ món đồ xuống rồi trao lại cho bọn trẻ."),
    speech("Mơ", "Bạn nói chuyện nghe lạ, nhưng bọn trẻ quý bạn rồi đấy."),
    speech("Bạn", "Ở cạnh chúng, ta có cảm giác mình từng biết khoảng sân này.")
  ]),
  mass: Object.freeze([
    narration("Tiếng bước chân lắng xuống. Cha xứ đứng gần bàn thờ, còn giáo dân yên vị hai bên lối đi."),
    narration("Bạn ngồi ở một chỗ trống. Tiếng chuông nhỏ hòa với ánh kính màu và một ký ức chưa thành hình."),
    speech("Mơ", "Mình đang dự lễ, lát nữa nói chuyện nhé."),
    narration("Bạn khẽ gật đầu và tiếp tục quan sát trong yên lặng.")
  ]),
  oldPhoto: Object.freeze([
    narration("Sau giờ lễ, Mơ mở chiếc hộp cũ của bà trong căn phòng nhỏ cạnh sân."),
    { type: "sceneState", patch: { oldPhotoVisible: true } },
    narration("Trong hộp là bức ảnh một đứa trẻ đứng gần Hồ Gươm. Gương mặt đã nhòe, nhưng đường nét khiến Mơ thấy quen."),
    narration("Đứa trẻ đeo mặt dây chuyền hình Tháp Rùa. Sau ảnh ghi: “1986 — Mong con tìm được đường về.”"),
    { type: "letterbox", to: 1, duration: 240 },
    { type: "camera", entityId: "mo", zoom: 1.9, duration: 520, trackEntity: true },
    { type: "suspicion", active: true, entityId: "mo", zoom: 1.9, audioDuck: 0.14, heartbeat: true },
    internal("Chiếc mặt dây trong ảnh…"),
    internal("Giống hệt."),
    internal("Và khuôn mặt này… dù đã khác đi…"),
    internal("Không thể chỉ là trùng hợp."),
    narration("Mơ siết bức ảnh lại rồi giấu nó vào trong hộp."),
    internal("Nhưng nếu mình nói ra mà sai thì sao?"),
    { type: "storyClue", clueId: CHAPTER_2_CLUES.oldPhoto },
    { type: "suspicion", active: false, audioDuck: 0.55 },
    { type: "cameraRestore", duration: 500 },
    { type: "sceneState", patch: { oldPhotoVisible: false } },
    { type: "letterbox", to: 0, duration: 220 }
  ]),
  hangoutDestination: Object.freeze([
    speech("Mơ", "Mặt hồ hôm nay dịu thật. Ở đây, mình luôn có cảm giác thành phố chịu chậm lại một chút."),
    speech("Bạn", "Có lẽ ký ức cũng cần một nơi đủ yên để quay về."),
    speech("Mơ", "Chúng mình chụp một bức ảnh nhé. Biết đâu sau này bạn sẽ cần nó để nhớ.")
  ]),
  relationship: Object.freeze([
    {
      type: "dialogue",
      kind: "speech",
      speaker: "Mơ",
      text: "Bạn đã đi cùng mình cả một buổi. Bạn đang nghĩ gì vậy?",
      choices: Object.freeze([
        Object.freeze({ id: "trust", text: "Cảm ơn vì đã tin ta.", choiceKey: "chapter2RelationshipChoice", value: "trust", scores: Object.freeze({ compassion: 1, belonging: 1 }) }),
        Object.freeze({ id: "return", text: "Ta chỉ cần tìm đường về.", choiceKey: "chapter2RelationshipChoice", value: "return", scores: Object.freeze({ return: 1 }) }),
        Object.freeze({ id: "truth", text: "Ngươi đang giấu ta điều gì?", choiceKey: "chapter2RelationshipChoice", value: "truth", scores: Object.freeze({ truth: 1 }) })
      ])
    },
    {
      type: "choiceDialogue",
      choiceKey: "chapter2RelationshipChoice",
      entries: Object.freeze({
        trust: speech("Mơ", "Mình chưa hiểu hết chuyện của bạn, nhưng mình tin những gì bạn đang cố nhớ."),
        return: speech("Mơ", "Mình hiểu. Dù vậy, trước khi tìm được đường về, bạn đừng tự gánh mọi thứ một mình."),
        truth: speech("Mơ", "Mình có vài điều chưa chắc chắn. Khi hiểu rõ hơn, mình hứa sẽ nói với bạn.")
      })
    }
  ]),
  finale: Object.freeze([
    narration("Một ký ức khác lóe lên, rời rạc như những khung hình cũ."),
    memoryFlash("school-group", 180),
    memoryFlash("flags", 170),
    memoryFlash("large-courtyard", 190),
    memoryFlash("van-mieu-gate", 220),
    { type: "sceneState", patch: { flash: null } },
    speech("Mơ", "Chúng ta nên tới Ba Đình và Văn Miếu. Có lẽ ký ức của bạn liên quan tới những nơi đó.")
  ])
});

function point(id, label, mapId, x, y, kind, radius) {
  return Object.freeze({ id, label, mapId, x, y, kind, radius, visibleRange: 230 });
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

function memoryFlash(flash, duration) {
  return Object.freeze({ type: "sceneState", patch: { flash }, animation: "memoryFlash", duration });
}
