export const FINAL_CHOICE_SCENE = "final-choice";
export const ENDING_PLAYING_SCENE = "ending-playing";
export const ENDING_COMPLETE_SCENE = "ending-complete";
export const CONTINUE_MODE_SCENE = "continue-mode";

export const FINAL_ENDING_IDS = Object.freeze({
  RETURN: "return-to-immortal-world",
  STAY: "stay-in-hanoi",
  BRIDGE: "bridge-between-worlds"
});

export const FINAL_ENDINGS = Object.freeze({
  [FINAL_ENDING_IDS.RETURN]: Object.freeze({
    id: FINAL_ENDING_IDS.RETURN,
    shortTitle: "Trở lại dị giới",
    choiceText: "Các đệ tử của ta vẫn đang chờ.",
    journalTitle: "Hai nơi gọi là quê hương",
    finalLines: Object.freeze([
      "Người đã tìm được đường về, nhưng từ đó có hai nơi được gọi là quê hương."
    ])
  }),
  [FINAL_ENDING_IDS.STAY]: Object.freeze({
    id: FINAL_ENDING_IDS.STAY,
    shortTitle: "Ở lại Hà Nội",
    choiceText: "Ta đã sống một đời ở nơi khác. Có lẽ đời này thuộc về nơi đây.",
    journalTitle: "Một đời giữa trần thế",
    finalLines: Object.freeze([
      "Người từng tu hành để rời khỏi trần thế, cuối cùng lại chọn sống giữa nó."
    ])
  }),
  [FINAL_ENDING_IDS.BRIDGE]: Object.freeze({
    id: FINAL_ENDING_IDS.BRIDGE,
    shortTitle: "Giữ cánh cổng mở",
    choiceText: "Ta sẽ giữ chiếc neo này, để hai thế giới còn một con đường gặp lại.",
    journalTitle: "Con đường giữa hai thế giới",
    finalLines: Object.freeze([
      "Người không chọn một thế giới.",
      "Người trở thành con đường giữa hai thế giới."
    ])
  })
});

export const ENDING_HISTORY_LABELS = Object.freeze({
  "history-hoan-kiem": "Hồ Hoàn Kiếm",
  "history-cathedral": "Nhà thờ Lớn",
  "history-ba-dinh": "Ba Đình",
  "history-van-mieu": "Văn Miếu - Quốc Tử Giám"
});

export const ENDING_MEMORY_LABELS = Object.freeze({
  "memory-tea-stall": "Một cốc trà và câu chuyện đời thường",
  "memory-mo-and-children": "Mơ cùng những đứa trẻ",
  "memory-held-hand": "Bàn tay giữa quảng trường",
  "memory-school-trip": "Chuyến đi học đã bị lãng quên"
});

export const IMPORTANT_CHOICE_LABELS = Object.freeze({
  originChoice: Object.freeze({
    return: "Từng quyết tìm đường trở lại dị giới",
    stay: "Từng muốn thử sống một cuộc đời khác",
    investigate: "Từng quyết tìm sự thật về chuyến trở về"
  }),
  chapter2RelationshipChoice: Object.freeze({
    trust: "Đã đặt niềm tin vào Mơ",
    return: "Đã giữ mục tiêu trở về ở trước mắt",
    truth: "Đã hỏi thẳng Mơ về điều cô che giấu"
  }),
  chapter3FocusChoice: Object.freeze({
    history: "Đã chọn lắng nghe lịch sử chung",
    memory: "Đã chọn lần theo ký ức riêng"
  }),
  chapter3TourGroupChoice: Object.freeze({
    help: "Đã ở lại giúp đoàn khách tại Ba Đình",
    skip: "Đã ưu tiên manh mối trên hành trình ở Ba Đình"
  }),
  chapter3SchoolGroupChoice: Object.freeze({
    help: "Đã ở lại giúp đoàn học sinh tại Văn Miếu",
    clue: "Đã lần theo ký ức cá nhân tại Văn Miếu"
  }),
  chapter3FearChoice: Object.freeze({
    share: "Đã chia sẻ nỗi sợ với Mơ",
    hide: "Đã giấu nỗi sợ và tự bước tiếp"
  })
});

export const BRIDGE_ENDING_REQUIREMENTS = Object.freeze({
  historyMarks: 4,
  humanMemories: 4,
  memoryClues: 8,
  curiosity: 3,
  compassion: 3,
  helpedNpcCount: 4,
  maximumMajorSkips: 1
});

export const ENDING_ACTIONS = Object.freeze([
  Object.freeze({ id: "continue", label: "Tiếp tục khám phá" }),
  Object.freeze({ id: "replay", label: "Xem lại đoạn kết" }),
  Object.freeze({ id: "new-journey", label: "Bắt đầu hành trình mới" })
]);

