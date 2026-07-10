export function rowHouses({ x, y, count, width = 70, height = 96, gap = 10, colors = defaultHouseColors, signs = [] }) {
  return Array.from({ length: count }, (_, index) => {
    const color = colors[index % colors.length];
    return {
      kind: "tubeHouse",
      x: x + index * (width + gap),
      y,
      width,
      height: height + (index % 3) * 12,
      color: color.body,
      roof: color.roof,
      door: color.door,
      sign: signs[index % signs.length]
    };
  });
}

export function rowApartments({ x, y, count, width = 118, height = 150, gap = 16 }) {
  return Array.from({ length: count }, (_, index) => ({
    kind: index % 2 === 0 ? "collective" : "apartment",
    x: x + index * (width + gap),
    y,
    width,
    height: height + (index % 2) * 20,
    color: index % 2 === 0 ? "#c8b58b" : "#aeb3aa",
    roof: index % 2 === 0 ? "#8c4a35" : "#5e646a"
  }));
}

export function repeatDecor(type, points, extra = {}) {
  return points.map(([x, y]) => ({ type, x, y, ...extra }));
}

const defaultHouseColors = [
  { body: "#d8b95e", roof: "#9f3e35", door: "#27647d" },
  { body: "#efc66e", roof: "#315f8f", door: "#5d3b28" },
  { body: "#d9d477", roof: "#8f4a2f", door: "#2d6b58" },
  { body: "#e8a866", roof: "#734a91", door: "#5b3726" },
  { body: "#91c2b4", roof: "#9d4138", door: "#304a72" }
];
