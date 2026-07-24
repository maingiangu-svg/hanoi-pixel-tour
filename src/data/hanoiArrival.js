import { HANOI_ARRIVAL_ID } from "./immortalIntro.js";

export const HANOI_ARRIVAL_CLUE = "clue-instinctive-hoan-kiem-name";

export const HANOI_ARRIVAL_PLAYER_POSITION = Object.freeze({ x: 1192, y: 1238 });

export const HANOI_ARRIVAL_OBJECTIVES = Object.freeze({
  return: "Tìm dấu vết về con đường trở về tại Hồ Gươm.",
  stay: "Làm quen với nhịp sống quanh Hồ Gươm.",
  investigate: "Tìm hiểu vì sao cái tên Hoàn Kiếm xuất hiện trong ký ức."
});

export const HANOI_ARRIVAL_SCENE = Object.freeze({
  id: HANOI_ARRIVAL_ID,
  renderer: "hanoiArrival",
  state: Object.freeze({
    playerPose: "lying",
    eyesOpen: false,
    attention: "player",
    motorbikePassed: false
  }),
  entities: Object.freeze([
    Object.freeze({ id: "arrival-group-focus", kind: "focus", x: 1186, y: 1208, width: 132, height: 86 }),
    Object.freeze({ id: "arrival-player", kind: "player", x: HANOI_ARRIVAL_PLAYER_POSITION.x, y: HANOI_ARRIVAL_PLAYER_POSITION.y, width: 24, height: 40, facing: "right", mapId: "hoanKiem" }),
    Object.freeze({ id: "arrival-mo", kind: "mo", name: "Mơ", x: 1240, y: 1222, width: 24, height: 46, facing: "left", color: "#bf7197", mapId: "hoanKiem" }),
    Object.freeze({ id: "arrival-tea-vendor", kind: "teaVendor", name: "Cô bán trà đá", x: 1284, y: 1242, width: 24, height: 46, facing: "left", color: "#f7a072", mapId: "hoanKiem" }),
    Object.freeze({ id: "arrival-xe-om", kind: "xeOm", name: "Chú xe ôm", x: 1138, y: 1230, width: 24, height: 46, facing: "right", color: "#d8a83f", mapId: "hoanKiem" }),
    Object.freeze({ id: "arrival-student", kind: "student", name: "Sinh viên Hà Nội", x: 1182, y: 1184, width: 24, height: 46, facing: "down", color: "#4f83b4", mapId: "hoanKiem" })
  ])
});

export const HANOI_ARRIVAL_TIMELINE = Object.freeze([
  { type: "camera", entityId: "arrival-group-focus", zoom: 1.18, duration: 1, trackEntity: false },
  { type: "fade", mode: "white", to: 0, duration: 720 },
  { type: "wait", duration: 360 },
  { type: "audioCue", cue: "arrivalStreet" },
  { type: "sceneState", patch: { playerPose: "seated", eyesOpen: true }, animation: "wake", duration: 420 },
  { type: "dialogue", kind: "speech", speaker: "Bạn", text: "Đây là nơi nào?" },
  { type: "sceneState", patch: { motorbikePassed: true }, animation: "motorbikePass", duration: 760 },
  { type: "dialogue", kind: "speech", speaker: "Bạn", text: "Cỗ xe sắt kia… không dùng ngựa, cũng không có linh lực?" },
  { type: "dialogue", kind: "speech", speaker: "Cô bán trà đá", text: "Cháu tỉnh rồi à? Ngồi yên đấy, cô lấy cốc nước." },
  { type: "dialogue", kind: "speech", speaker: "Chú xe ôm", text: "Ăn mặc lạ thế. Cháu quay phim ở đâu rồi đi lạc à?" },
  { type: "dialogue", kind: "speech", speaker: "Sinh viên Hà Nội", text: "Chắc bạn ấy bị mất trí nhớ." },
  { type: "dialogue", kind: "speech", speaker: "Mơ", text: "Bạn còn nhớ tên mình không? Bạn từ đâu tới?", expression: "worried" },
  { type: "dialogue", kind: "speech", speaker: "Bạn", text: "Ta đến từ một nơi rất xa. Xa hơn bất kỳ con đường nào các vị biết." },
  {
    type: "dialogue",
    kind: "speech",
    speaker: "Mơ",
    text: "Vậy bạn muốn làm gì bây giờ?",
    expression: "idle",
    choices: Object.freeze([
      Object.freeze({
        id: "return",
        text: "Ta phải tìm đường trở về thế giới của mình.",
        choiceKey: "originChoice",
        value: "return",
        scores: Object.freeze({ return: 2 })
      }),
      Object.freeze({
        id: "stay",
        text: "Có lẽ đây là cơ hội để ta sống một cuộc đời khác.",
        choiceKey: "originChoice",
        value: "stay",
        scores: Object.freeze({ belonging: 2 })
      }),
      Object.freeze({
        id: "investigate",
        text: "Ta muốn biết vì sao mình lại được đưa tới đây.",
        choiceKey: "originChoice",
        value: "investigate",
        scores: Object.freeze({ truth: 2, curiosity: 1 })
      })
    ])
  },
  {
    type: "choiceDialogue",
    choiceKey: "originChoice",
    entries: Object.freeze({
      return: Object.freeze({ kind: "speech", speaker: "Mơ", text: "Muốn tìm đường về, trước hết bạn phải hiểu nơi mình đang đứng.", expression: "idle" }),
      stay: Object.freeze({ kind: "speech", speaker: "Cô bán trà đá", text: "Thế thì cứ bắt đầu chậm thôi. Hà Nội chẳng chạy mất đâu." }),
      investigate: Object.freeze({ kind: "speech", speaker: "Sinh viên Hà Nội", text: "Những nơi lâu đời của Hà Nội có thể giúp bạn tìm câu trả lời." })
    })
  },
  { type: "sceneState", patch: { attention: "lake" }, animation: "lookLake", duration: 360 },
  { type: "dialogue", kind: "speech", speaker: "Bạn", text: "Hồ… Hoàn Kiếm?" },
  { type: "wait", duration: 420 },
  { type: "dialogue", kind: "speech", speaker: "Mơ", text: "Bạn vừa nói gì?", expression: "surprised" },
  { type: "dialogue", kind: "speech", speaker: "Bạn", text: "Ta không biết. Cái tên ấy tự xuất hiện trong đầu." },
  { type: "suspicion", active: true, entityId: "arrival-mo", zoom: 1.82, audioDuck: 0.18, heartbeat: true },
  { type: "camera", entityId: "arrival-mo", zoom: 1.82, duration: 520, trackEntity: true },
  { type: "dialogue", kind: "internal", speaker: "Mơ (nghĩ)", text: "Chưa có ai nói cho người này biết tên hồ…", expression: "suspect" },
  { type: "dialogue", kind: "internal", speaker: "Mơ (nghĩ)", text: "Vậy tại sao lại biết?", expression: "suspect" },
  { type: "storyClue", clueId: HANOI_ARRIVAL_CLUE },
  { type: "wait", duration: 380 },
  { type: "suspicion", active: false, audioDuck: 0.62 },
  { type: "cameraRestore", duration: 520 },
  {
    type: "dialogue",
    kind: "speech",
    speaker: "Mơ",
    text: "Dù sao, mình sẽ dẫn bạn đi một vòng. Có lẽ nơi này sẽ giúp bạn nhớ lại.",
    expression: "smile"
  },
  { type: "sceneState", patch: { playerPose: "standing", attention: "player" }, animation: "stand", duration: 320 },
  { type: "camera", entityId: "player", zoom: 1.08, duration: 420, trackEntity: true },
  { type: "letterbox", to: 0, duration: 300 },
  { type: "wait", duration: 320 }
]);
