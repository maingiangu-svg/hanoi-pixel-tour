export const CHAPTER_3_ID = "chapter-3";
export const CHAPTER_3_TITLE = "Ký ức của một đất nước";

export const CHAPTER_3_REWARDS = Object.freeze({
  baDinhHistory: "history-ba-dinh",
  heldHandMemory: "memory-held-hand",
  vanMieuHistory: "history-van-mieu",
  schoolTripMemory: "memory-school-trip"
});

export const CHAPTER_3_CLUES = Object.freeze({
  heldHand: "clue-ba-dinh-held-hand",
  schoolLesson: "clue-modern-school-lesson",
  pendantThread: "clue-pendant-blue-thread",
  longBienDisappearance: "clue-long-bien-disappearance"
});

export const CHAPTER_3_POINTS = Object.freeze({
  baDinhArrival: point("chapter3-ba-dinh-arrival", "Dừng lại tại Quảng trường Ba Đình", 760, 748, "memory", 118),
  langBacHistory: point("chapter3-lang-bac", "Tìm hiểu Lăng Bác", 1145, 462, "history", 54),
  langBacQuiz: point("chapter3-lang-bac-quiz", "Trả lời câu hỏi về Lăng Bác", 1145, 462, "history", 54),
  onePillarHistory: point("chapter3-one-pillar", "Tìm hiểu Chùa Một Cột", 1718, 600, "history", 54),
  onePillarQuiz: point("chapter3-one-pillar-quiz", "Trả lời câu hỏi về Chùa Một Cột", 1718, 600, "history", 54),
  guideHistory: point("chapter3-guide", "Nghe hướng dẫn viên tại Ba Đình", 632, 875, "guide", 62),
  guideQuiz: point("chapter3-guide-quiz", "Trả lời câu hỏi lịch sử sâu", 632, 875, "guide", 62),
  vanMieuGate: point("chapter3-van-mieu-gate", "Khám phá cổng Văn Miếu", 1100, 1422, "gate", 58),
  khueVanMemory: point("chapter3-khue-van-memory", "Tới Khuê Văn Các", 1100, 1662, "khueVan", 60),
  stelaeHistory: point("chapter3-stelae", "Tìm hiểu bia tiến sĩ", 1100, 1840, "stelae", 58),
  vanMieuQuiz: point("chapter3-stelae-quiz", "Trả lời câu hỏi về bia tiến sĩ", 1100, 1840, "stelae", 58),
  oldWitness: point("chapter3-old-witness", "Nói chuyện với người từng sống ở Long Biên", 1440, 1830, "oldWitness", 66)
});

export const CHAPTER_3_STAGE_ORDER = Object.freeze([
  "baDinhArrival",
  "langBacHistory",
  "langBacQuiz",
  "onePillarHistory",
  "onePillarQuiz",
  "guideHistory",
  "guideQuiz",
  "focusChoice",
  "tourGroupChoice",
  "vanMieuGate",
  "khueVanMemory",
  "stelaeHistory",
  "vanMieuQuiz",
  "schoolGroupChoice",
  "fearChoice",
  "moRecognition",
  "oldWitness",
  "chapterComplete"
]);

export const CHAPTER_3_OBJECTIVES = Object.freeze({
  baDinhArrival: "Tới Quảng trường Ba Đình cùng Mơ.",
  langBacHistory: "Tìm hiểu bối cảnh lịch sử của Lăng Chủ tịch Hồ Chí Minh.",
  langBacQuiz: "Trả lời câu hỏi lịch sử về Lăng Bác.",
  onePillarHistory: "Tìm hiểu kiến trúc và ý nghĩa của Chùa Một Cột.",
  onePillarQuiz: "Trả lời câu hỏi về Chùa Một Cột.",
  guideHistory: "Nghe hướng dẫn viên kể về Quảng trường Ba Đình.",
  guideQuiz: "Trả lời câu hỏi lịch sử sâu của hướng dẫn viên.",
  focusChoice: "Chọn điều bạn muốn ưu tiên tại Ba Đình.",
  tourGroupChoice: "Quyết định có ở lại giúp đoàn khách hay không.",
  vanMieuGate: "Tới cổng Văn Miếu - Quốc Tử Giám.",
  khueVanMemory: "Đi qua các lớp sân và tới Khuê Văn Các.",
  stelaeHistory: "Tìm hiểu bia tiến sĩ trong Văn Miếu.",
  vanMieuQuiz: "Trả lời câu hỏi về truyền thống trọng dụng hiền tài.",
  schoolGroupChoice: "Quyết định giúp đoàn học sinh hay tiếp tục tìm manh mối.",
  fearChoice: "Nói với Mơ điều bạn thực sự lo sợ.",
  moRecognition: "Quan sát phản ứng của Mơ.",
  oldWitness: "Gặp người lớn tuổi đang nghỉ ở sân Văn Miếu.",
  chapterComplete: "Lắng nghe điều Mơ đã quyết định."
});

export const CHAPTER_3_QUESTS = Object.freeze([
  Object.freeze({
    id: "chapter3-ba-dinh",
    title: "Bàn tay giữa quảng trường",
    description: "Khám phá Lăng Bác, Chùa Một Cột và câu chuyện lịch sử tại Ba Đình.",
    stages: Object.freeze(["baDinhArrival", "langBacHistory", "langBacQuiz", "onePillarHistory", "onePillarQuiz", "guideHistory", "guideQuiz"])
  }),
  Object.freeze({
    id: "chapter3-ba-dinh-choice",
    title: "Lịch sử hay ký ức",
    description: "Chọn cách nhìn những điều đang hiện ra và quyết định có giúp đoàn khách hay không.",
    stages: Object.freeze(["focusChoice", "tourGroupChoice"])
  }),
  Object.freeze({
    id: "chapter3-van-mieu",
    title: "Bài học đã thuộc từ lâu",
    description: "Khám phá cổng, Khuê Văn Các và bia tiến sĩ để ghép lại ký ức chuyến đi học.",
    stages: Object.freeze(["vanMieuGate", "khueVanMemory", "stelaeHistory", "vanMieuQuiz", "schoolGroupChoice"])
  }),
  Object.freeze({
    id: "chapter3-long-bien-clue",
    title: "Sợi dây bị đứt",
    description: "Đối diện nỗi sợ, lắng nghe điều Mơ chưa nói và tìm đầu mối dẫn tới Cầu Long Biên.",
    stages: Object.freeze(["fearChoice", "moRecognition", "oldWitness", "chapterComplete"])
  })
]);

export const CHAPTER_3_MEMORY_SCENE = Object.freeze({
  id: "chapter3-memory-scene",
  renderer: "chapter3Memory",
  state: Object.freeze({ flash: null })
});

export const CHAPTER_3_CUTSCENES = Object.freeze({
  baDinhArrival: Object.freeze([
    { type: "letterbox", to: 1, duration: 220 },
    narration("Giữa khoảng quảng trường rộng, một cơn đau nhói khiến bạn đứng khựng lại."),
    memoryFlash("child-hand", 320),
    memoryFlash("ba-dinh-flags", 300),
    speech("Giọng nói trong ký ức", "Đừng buông tay."),
    memoryFlash("separating-hands", 320),
    { type: "shake", magnitude: 2, duration: 220 },
    speech("Mơ", "Bạn sao vậy?"),
    speech("Bạn", "Ta vừa thấy mình khi còn nhỏ… đang nắm tay một người ở chính nơi này."),
    { type: "storyClue", clueId: CHAPTER_3_CLUES.heldHand },
    { type: "sceneState", patch: { flash: null } },
    { type: "letterbox", to: 0, duration: 220 }
  ]),
  guideHistory: Object.freeze([
    speech("Hướng dẫn viên", "Quảng trường Ba Đình không chỉ là một không gian nghi lễ. Ngày 2 tháng 9 năm 1945 khiến nơi này trở thành một mốc của lịch sử quốc gia hiện đại."),
    speech("Hướng dẫn viên", "Lăng Chủ tịch Hồ Chí Minh và Chùa Một Cột ở gần nhau nhưng thuộc những lớp thời gian rất khác. Đọc chúng cùng nhau, ta thấy Hà Nội không chỉ có một quá khứ."),
    speech("Mơ", "Bạn nghe kỹ nhé. Có khi lịch sử chung sẽ giúp ký ức riêng của bạn tìm được chỗ đứng.")
  ]),
  focusChoice: Object.freeze([
    {
      type: "dialogue",
      kind: "speech",
      speaker: "Mơ",
      text: "Bạn muốn tiếp tục theo cách nào?",
      choices: Object.freeze([
        Object.freeze({ id: "history", text: "Ta muốn hiểu lịch sử nơi này trước.", choiceKey: "chapter3FocusChoice", value: "history", scores: Object.freeze({ curiosity: 1, belonging: 1 }) }),
        Object.freeze({ id: "memory", text: "Ta phải theo mảnh ký ức vừa xuất hiện.", choiceKey: "chapter3FocusChoice", value: "memory", scores: Object.freeze({ truth: 1, return: 1 }) })
      ])
    },
    {
      type: "choiceDialogue",
      choiceKey: "chapter3FocusChoice",
      entries: Object.freeze({
        history: speech("Mơ", "Vậy mình sẽ nghe những câu chuyện ở đây thật trọn vẹn."),
        memory: speech("Mơ", "Được. Nhưng đừng để cơn đau buộc bạn phải vội vàng.")
      })
    }
  ]),
  tourGroupChoice: Object.freeze([
    {
      type: "dialogue",
      kind: "speech",
      speaker: "Hướng dẫn viên",
      text: "Đoàn khách của tôi đang lẫn lộn vai trò của quảng trường, Lăng Bác và Chùa Một Cột. Bạn có thể giúp họ ghép lại tuyến tham quan không?",
      choices: Object.freeze([
        Object.freeze({ id: "help", text: "Ở lại giúp đoàn khách.", choiceKey: "chapter3TourGroupChoice", value: "help", scores: Object.freeze({ compassion: 1, belonging: 1 }) }),
        Object.freeze({ id: "skip", text: "Xin lỗi, ta cần tìm manh mối ngay.", choiceKey: "chapter3TourGroupChoice", value: "skip", scores: Object.freeze({ truth: 1, curiosity: 1 }) })
      ])
    },
    {
      type: "choiceDialogue",
      choiceKey: "chapter3TourGroupChoice",
      entries: Object.freeze({
        help: narration("Bạn cùng hướng dẫn viên sắp lại lộ trình: quảng trường trước, Lăng Bác, rồi Chùa Một Cột. Đoàn khách hiểu vì sao mỗi nơi thuộc một lớp lịch sử khác nhau."),
        skip: narration("Bạn xin lỗi đoàn khách và đi tiếp. Mơ không trách, nhưng lặng lẽ ghi nhớ sự vội vàng ấy.")
      })
    }
  ]),
  vanMieuGate: Object.freeze([
    narration("Qua cổng Văn Miếu, tiếng phố lùi lại sau những lớp tường gạch và sân lát."),
    speech("Mơ", "Ở đây người ta lưu giữ ký ức bằng tên tuổi, bia đá và việc học."),
    speech("Bạn", "Cảm giác này… giống một chuyến đi mà ta từng chờ đợi từ rất lâu.")
  ]),
  khueVanMemory: Object.freeze([
    narration("Đứng trước Khuê Văn Các, bạn bất chợt đọc tiếp một câu học thuộc của trẻ em Hà Nội."),
    speech("Bạn", "Em yêu Hà Nội, yêu hàng cây trước lớp… và mỗi con đường dẫn tới một trang sách mới."),
    speech("Mơ", "Người ở dị giới không thể biết câu đó."),
    speech("Bạn", "Có lẽ… ta không phải người ở đó từ đầu."),
    memoryFlash("school-trip", 320),
    memoryFlash("red-scarf", 300),
    memoryFlash("khue-van-cac", 320),
    { type: "storyClue", clueId: CHAPTER_3_CLUES.schoolLesson },
    { type: "sceneState", patch: { flash: null } }
  ]),
  schoolGroupChoice: Object.freeze([
    {
      type: "dialogue",
      kind: "speech",
      speaker: "Giáo viên",
      text: "Các em đang ghép ý nghĩa Khuê Văn Các với bia tiến sĩ. Bạn có muốn giúp một nhóm nhỏ không?",
      choices: Object.freeze([
        Object.freeze({ id: "help", text: "Ở lại giúp đoàn học sinh.", choiceKey: "chapter3SchoolGroupChoice", value: "help", scores: Object.freeze({ compassion: 1, belonging: 1 }) }),
        Object.freeze({ id: "clue", text: "Tập trung tìm mảnh ký ức cá nhân.", choiceKey: "chapter3SchoolGroupChoice", value: "clue", scores: Object.freeze({ return: 1, curiosity: 1 }) })
      ])
    },
    {
      type: "choiceDialogue",
      choiceKey: "chapter3SchoolGroupChoice",
      entries: Object.freeze({
        help: narration("Bạn giúp các em phân biệt biểu tượng văn chương của Khuê Văn Các với ý nghĩa tôn vinh hiền tài của bia tiến sĩ."),
        clue: narration("Bạn bước khỏi nhóm học sinh, lần theo một cảm giác quen thuộc chạy dọc lối sân lát.")
      })
    },
    narration("Bạn chạm vào mặt dây chuyền và bỗng nhớ ra một chi tiết rất nhỏ."),
    speech("Bạn", "Mặt dây này từng đứt trong một chuyến đi học. Người đi cùng ta đã buộc nó lại bằng một sợi chỉ xanh."),
    { type: "storyClue", clueId: CHAPTER_3_CLUES.pendantThread }
  ]),
  fearChoice: Object.freeze([
    {
      type: "dialogue",
      kind: "speech",
      speaker: "Mơ",
      text: "Bạn đang sợ điều gì?",
      choices: Object.freeze([
        Object.freeze({ id: "share", text: "Ta sợ ký ức này sẽ chứng minh cả đời ta từng sống là một lối rẽ.", choiceKey: "chapter3FearChoice", value: "share", scores: Object.freeze({ truth: 1, compassion: 1 }) }),
        Object.freeze({ id: "hide", text: "Không có gì đáng sợ. Ta vẫn tự tìm được đường.", choiceKey: "chapter3FearChoice", value: "hide", scores: Object.freeze({ return: 1 }) })
      ])
    },
    {
      type: "choiceDialogue",
      choiceKey: "chapter3FearChoice",
      entries: Object.freeze({
        share: speech("Mơ", "Dù ký ức trả lời thế nào, cuộc đời bạn đã sống vẫn là thật. Bạn không cần đối diện một mình."),
        hide: speech("Mơ", "Mình sẽ không ép. Nhưng khi bạn sẵn sàng, hãy nói thật với mình.")
      })
    }
  ]),
  moRecognition: Object.freeze([
    { type: "letterbox", to: 1, duration: 240 },
    { type: "camera", entityId: "mo", zoom: 1.95, duration: 540, trackEntity: true },
    { type: "suspicion", active: true, entityId: "mo", zoom: 1.95, audioDuck: 0.08 },
    internal("Không còn là nghi ngờ nữa."),
    internal("Người này chính là đứa trẻ trong bức ảnh."),
    internal("Nhưng làm sao một đứa trẻ mất tích lại trở về với ký ức của cả một đời?"),
    narration("Mơ nhìn bạn, rồi nhớ tới nút chỉ xanh ở mặt sau chiếc dây trong bức ảnh cũ."),
    internal("Mình phải đưa bạn ấy tới Cầu Long Biên."),
    { type: "suspicion", active: false, audioDuck: 0.5 },
    { type: "cameraRestore", duration: 520 },
    { type: "letterbox", to: 0, duration: 220 }
  ]),
  oldWitness: Object.freeze([
    speech("Ông lão", "Nhiều năm trước, trong một đêm giông, có một đứa trẻ mất tích gần cầu."),
    speech("Ông lão", "Người ta chỉ tìm thấy chiếc dây đeo bị đứt."),
    narration("Bạn chạm vào mặt dây chuyền. Một chuỗi hình ảnh vỡ ra trong đầu."),
    memoryFlash("long-bien-tracks", 320),
    memoryFlash("storm-rain", 300),
    memoryFlash("slipping-hand", 320),
    memoryFlash("rift-light", 330),
    { type: "storyClue", clueId: CHAPTER_3_CLUES.longBienDisappearance },
    { type: "sceneState", patch: { flash: null } }
  ]),
  finale: Object.freeze([
    speech("Mơ", "Mình biết nơi chúng ta phải tới."),
    speech("Bạn", "Cầu Long Biên?"),
    speech("Mơ", "Ừ. Và lần này… mình sẽ không giấu bạn nữa.")
  ])
});

function point(id, label, x, y, kind, radius) {
  return Object.freeze({ id, label, mapId: "baDinh", x, y, kind, radius, visibleRange: 230 });
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
