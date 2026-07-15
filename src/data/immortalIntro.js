export const IMMORTAL_INTRO_ID = "immortalIntro";
export const HANOI_ARRIVAL_ID = "hanoiArrival";

export const IMMORTAL_INTRO_SCENE = Object.freeze({
  id: IMMORTAL_INTRO_ID,
  renderer: "immortalIntro",
  state: Object.freeze({
    storm: 0.18,
    wind: 0.12,
    rain: 0,
    treeCharge: 0.12,
    portal: 0,
    focus: "courtyard",
    fromShot: "wide",
    shot: "wide",
    action: "idle",
    disciplesSafe: false,
    playerStruck: false,
    foreshadow: null,
    lightning: 0
  })
});

export const IMMORTAL_INTRO_CLUES = Object.freeze([
  "intro-bridge-flash",
  "intro-church-bell",
  "intro-turtle-pendant"
]);

export const IMMORTAL_INTRO_TIMELINE = Object.freeze([
  { type: "letterbox", to: 1, duration: 240 },
  {
    type: "sceneState",
    patch: { action: "establish", fromShot: "wide", shot: "wide", storm: 0.22, wind: 0.16 },
    animation: "establish",
    duration: 780
  },
  {
    type: "dialogue",
    kind: "narration",
    text: "Sau nhiều thập kỷ tu hành, người đã gần như quên mất thế giới trước khi mình tới nơi này."
  },
  { type: "audioCue", cue: "introWindRise" },
  {
    type: "sceneState",
    patch: { fromShot: "wide", shot: "disciples", storm: 0.38, wind: 0.34, rain: 0.06 },
    animation: "cameraDisciples",
    duration: 420
  },
  { type: "dialogue", kind: "speech", speaker: "Đệ tử 1", text: "Sư phụ, mây đen đang ép xuống núi!" },
  { type: "dialogue", kind: "speech", speaker: "Đệ tử 2", text: "Linh quang quanh cổ thụ đang loạn rồi…" },
  {
    type: "sceneState",
    patch: { fromShot: "disciples", shot: "elder" },
    animation: "cameraElder",
    duration: 380
  },
  { type: "dialogue", kind: "speech", speaker: "Sư phụ", text: "Các con lui vào điện. Ngay." },
  { type: "audioCue", cue: "introDistantThunder" },
  {
    type: "sceneState",
    patch: {
      action: "stormBuild",
      fromShot: "elder",
      shot: "tree",
      storm: 0.76,
      wind: 0.82,
      rain: 0.42,
      treeCharge: 0.58
    },
    animation: "stormBuild",
    duration: 760
  },
  {
    type: "sceneState",
    patch: { action: "distantLightning", lightning: 0.42, treeCharge: 0.78 },
    animation: "distantLightning",
    duration: 180
  },
  {
    type: "sceneState",
    patch: { action: "treeSurge", lightning: 0, treeCharge: 0.96, storm: 0.9, rain: 0.64 },
    animation: "treeSurge",
    duration: 460
  },
  {
    type: "sceneState",
    patch: { fromShot: "tree", shot: "rescue" },
    animation: "cameraRescue",
    duration: 300
  },
  { type: "dialogue", kind: "speech", speaker: "Sư phụ", text: "Sau lưng ta! Mau!" },
  {
    type: "sceneState",
    patch: { action: "rescueRun", disciplesSafe: false },
    animation: "rescueRun",
    duration: 620
  },
  {
    type: "sceneState",
    patch: { action: "shield", disciplesSafe: true },
    animation: "shield",
    duration: 300
  },
  { type: "audioCue", cue: "introLightningStrike" },
  {
    type: "sceneState",
    patch: {
      action: "directStrike",
      fromShot: "rescue",
      shot: "strike",
      lightning: 1,
      playerStruck: true,
      treeCharge: 1
    },
    animation: "directStrike",
    duration: 380
  },
  { type: "shake", magnitude: 7, duration: 380 },
  {
    type: "sceneState",
    patch: { action: "afterStrike", lightning: 0.12, portal: 0.16 },
    animation: "afterStrike",
    duration: 460
  },
  {
    type: "sceneState",
    patch: { action: "portalOpen", fromShot: "strike", shot: "portal", portal: 1, rain: 0.78 },
    animation: "portalOpen",
    duration: 760
  },
  { type: "audioCue", cue: "introPortalResonance" },
  {
    type: "dialogue",
    kind: "speech",
    speaker: "Sư phụ",
    text: "Khí tức này… không kéo ta đi. Nó đang gọi ta trở về."
  },
  { type: "sceneState", patch: { action: "portalPull", portal: 1 }, animation: "portalPull", duration: 760 },
  {
    type: "dialogue",
    kind: "internal",
    speaker: "Ta (nghĩ)",
    text: "Một đời ta tìm đường vượt khỏi thế gian…"
  },
  {
    type: "dialogue",
    kind: "internal",
    speaker: "Ta (nghĩ)",
    text: "…đến cuối cùng, cánh cửa lại mở về nơi ta đã quên."
  },
  { type: "sceneState", patch: { foreshadow: "bridge" }, duration: 120 },
  { type: "storyClue", clueId: "intro-bridge-flash" },
  { type: "sceneState", patch: { foreshadow: null }, duration: 70 },
  { type: "audioCue", cue: "introChurchBell" },
  { type: "storyClue", clueId: "intro-church-bell" },
  { type: "wait", duration: 110 },
  { type: "sceneState", patch: { foreshadow: "pendant" }, duration: 150 },
  { type: "storyClue", clueId: "intro-turtle-pendant" },
  { type: "sceneState", patch: { foreshadow: null }, duration: 80 },
  { type: "fade", mode: "white", to: 1, duration: 680 }
]);
