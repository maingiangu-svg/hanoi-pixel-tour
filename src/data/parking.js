export const parkingByMap = {
  hoanKiem: {
    restrictedZones: [
      {
        id: "hoGuomWalking",
        name: "Phố đi bộ Hồ Gươm",
        x: 1148,
        y: 150,
        width: 1082,
        height: 1118,
        message: "Khu phố đi bộ Hồ Gươm cần đi bộ. Hãy gửi xe tại bãi gần đường ven hồ."
      }
    ],
    spots: [
      {
        id: "parkingHoGuom",
        name: "Bãi gửi xe Bờ Hồ",
        x: 1040,
        y: 1110,
        width: 82,
        height: 54,
        standingPosition: { x: 1098, y: 1152 },
        interactionPoint: { x: 1112, y: 1184, radius: 50, visibleRange: 220, labelOffsetY: -34 }
      }
    ]
  },
  baDinh: {
    restrictedZones: [
      {
        id: "baDinhSquareWalking",
        name: "Quảng trường Ba Đình",
        x: 520,
        y: 106,
        width: 1100,
        height: 838,
        message: "Quảng trường Ba Đình là không gian tham quan đi bộ. Hãy gửi xe ở cổng phía tây."
      },
      {
        id: "vanMieuWalking",
        name: "Khuôn viên Văn Miếu",
        x: 586,
        y: 1240,
        width: 1044,
        height: 748,
        message: "Khuôn viên Văn Miếu cần đi bộ. Hãy gửi xe tại bãi gần cổng ngoài."
      }
    ],
    spots: [
      {
        id: "parkingBaDinh",
        name: "Điểm gửi xe Ba Đình",
        x: 408,
        y: 824,
        width: 88,
        height: 54,
        standingPosition: { x: 450, y: 850 },
        interactionPoint: { x: 482, y: 888, radius: 50, visibleRange: 220, labelOffsetY: -34 }
      },
      {
        id: "parkingVanMieu",
        name: "Điểm gửi xe Văn Miếu",
        x: 478,
        y: 1528,
        width: 86,
        height: 54,
        standingPosition: { x: 520, y: 1545 },
        interactionPoint: { x: 552, y: 1586, radius: 50, visibleRange: 220, labelOffsetY: -34 }
      }
    ]
  },
  longBien: {
    restrictedZones: [
      {
        id: "dongXuanWalking",
        name: "Phố chợ Đồng Xuân",
        x: 480,
        y: 420,
        width: 600,
        height: 312,
        message: "Khu chợ Đồng Xuân đông người đi bộ. Hãy gửi xe ở đầu phố trước khi vào chợ."
      }
    ],
    spots: [
      {
        id: "parkingDongXuan",
        name: "Bãi gửi xe Đồng Xuân",
        x: 424,
        y: 326,
        width: 88,
        height: 54,
        standingPosition: { x: 470, y: 350 },
        interactionPoint: { x: 494, y: 398, radius: 50, visibleRange: 220, labelOffsetY: -34 }
      }
    ]
  }
};
