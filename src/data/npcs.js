import { maps } from "./maps.js";

export const npcsByMap = Object.fromEntries(Object.entries(maps).map(([mapId, map]) => [mapId, map.npcs]));
export const allNpcs = Object.values(npcsByMap).flat();

