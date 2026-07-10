import { baDinhMap } from "./mapBaDinh.js";
import { churchInteriorMap } from "./churchInterior.js";
import { hoanKiemMap } from "./mapHoanKiem.js";
import { longBienMap } from "./mapLongBien.js";
import { ambientVehiclesByMap } from "./ambientVehicles.js";
import { parkingByMap } from "./parking.js";

const baseMaps = [hoanKiemMap, baDinhMap, longBienMap, churchInteriorMap];

export const maps = Object.fromEntries(baseMaps.map((map) => {
  const parking = parkingByMap[map.id] || {};
  return [map.id, {
    ...map,
    ambientVehicles: ambientVehiclesByMap[map.id] || [],
    parkingSpots: parking.spots || [],
    vehicleRestrictedZones: parking.restrictedZones || []
  }];
}));
