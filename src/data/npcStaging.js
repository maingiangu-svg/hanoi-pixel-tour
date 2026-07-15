const hour = (value) => Math.round(value * 60);

export const NPC_STAGING_SCENES = Object.freeze({
  hoanKiem: Object.freeze([
    {
      id: "lake-bench-friends",
      type: "benchGroup",
      x: 1450,
      y: 1207,
      start: hour(15.5),
      end: hour(23.5),
      weatherMax: 0.46,
      colors: ["#f59ac0", "#7bdff2"],
      speech: ["Ra hồ ngồi tí nhé.", "Tối nay đông ghê."]
    },
    {
      id: "lake-evening-friends",
      type: "conversation",
      x: 1872,
      y: 1196,
      start: hour(16),
      end: hour(23),
      weatherMax: 0.48,
      colors: ["#f2bd45", "#8de097", "#caa6ff"],
      speech: ["Đi ăn không?", "Quán này ngon đấy."]
    },
    {
      id: "old-quarter-tea-guests",
      type: "teaGroup",
      x: 1028,
      y: 1195,
      start: hour(14),
      end: hour(21.5),
      weatherMax: 0.82,
      colors: ["#7bdff2", "#e7c067", "#f7a072"],
      speech: ["Ngồi thêm cốc trà nhé.", "Phố tối nay vui thật."]
    },
    {
      id: "old-quarter-dinner-stop",
      type: "foodQueue",
      x: 850,
      y: 690,
      start: hour(17),
      end: hour(21.5),
      weatherMax: 0.82,
      colors: ["#e7c067", "#9eced6", "#f59ac0"],
      speech: ["Cho mình hai suất nhé.", "Mùi đồ nướng thơm quá."]
    },
    {
      id: "cathedral-small-group",
      type: "conversation",
      x: 2365,
      y: 900,
      start: hour(16),
      end: hour(22.5),
      weatherMax: 0.48,
      colors: ["#9eced6", "#d6a3a3", "#e7c067"],
      speech: ["Đứng đây chụp đẹp đấy.", "Ra phố đi bộ nhé."]
    },
    {
      id: "cathedral-photo-pair",
      type: "photoPair",
      x: 2570,
      y: 914,
      start: hour(9),
      end: hour(22),
      weatherMax: 0.46,
      colors: ["#8de097", "#f59ac0", "#7bdff2"]
    },
    {
      id: "lake-children-play",
      type: "children",
      x: 1190,
      y: 1188,
      start: hour(16),
      end: hour(20.5),
      weatherMax: 0.18,
      colors: ["#f2bd45", "#7bdff2", "#f59ac0"]
    }
  ]),
  baDinh: Object.freeze([
    {
      id: "ba-dinh-quiet-visitors",
      type: "waitingGroup",
      x: 820,
      y: 726,
      start: hour(7),
      end: hour(21.5),
      weatherMax: 0.48,
      colors: ["#e7c067", "#8fcbbd", "#9eced6"]
    },
    {
      id: "van-mieu-readers",
      type: "conversation",
      x: 1040,
      y: 1782,
      start: hour(8),
      end: hour(19.5),
      weatherMax: 0.48,
      colors: ["#8de097", "#caa6ff"],
      speech: ["Đọc nốt tấm bia này nhé.", "Ở đây yên thật."]
    },
    {
      id: "van-mieu-evening-food",
      type: "foodQueue",
      x: 2300,
      y: 1730,
      start: hour(17),
      end: hour(21),
      weatherMax: 0.82,
      colors: ["#f7a072", "#8fcbbd"],
      speech: ["Ăn xong mình về nhé."]
    }
  ]),
  longBien: Object.freeze([
    {
      id: "dong-xuan-market-chat",
      type: "vendorGroup",
      x: 590,
      y: 686,
      start: hour(5.5),
      end: hour(21.5),
      weatherMax: 0.82,
      colors: ["#f7a072", "#8de097", "#e7c067"],
      speech: ["Hàng mới về đấy.", "Qua chợ rồi về nhé."]
    },
    {
      id: "long-bien-tea-guests",
      type: "teaGroup",
      x: 1178,
      y: 1082,
      start: hour(6.5),
      end: hour(21),
      weatherMax: 0.82,
      colors: ["#7bdff2", "#d6a3a3", "#f2bd45"],
      speech: ["Ngồi tránh gió một lát.", "Cầu tối nay đẹp nhỉ."]
    },
    {
      id: "long-bien-supper-stop",
      type: "foodQueue",
      x: 610,
      y: 1130,
      start: hour(17),
      end: hour(21.5),
      weatherMax: 0.82,
      colors: ["#d6a3a3", "#e7c067", "#7bdff2"],
      speech: ["Làm bát nóng rồi đi nhé.", "Quán này đông ghê."]
    },
    {
      id: "bridge-evening-pair",
      type: "viewPair",
      x: 1500,
      y: 672,
      start: hour(16),
      end: hour(22.5),
      weatherMax: 0.32,
      colors: ["#f59ac0", "#9eced6"],
      speech: ["Gió trên cầu mát thật."]
    },
    {
      id: "riverside-rest-stop",
      type: "waitingGroup",
      x: 1570,
      y: 1110,
      start: hour(15.5),
      end: hour(22),
      weatherMax: 0.46,
      colors: ["#caa6ff", "#8fcbbd"]
    }
  ]),
  churchInterior: Object.freeze([])
});
