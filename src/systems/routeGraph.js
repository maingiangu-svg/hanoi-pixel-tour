import { maps } from "../data/maps.js";
import { runtime } from "../state.js";

const GRID_SIZE = 64;
const graphCache = new Map();
const ROUTE_MODES = new Set(["walking", "vehicle", "pushingBike"]);
const VEHICLE_ZONE_KINDS = new Set(["road", "bridge", "plaza", "courtyard"]);

export function findRoute(mapId, start, target, mode = "walking") {
  const map = maps[mapId];
  const normalizedMode = ROUTE_MODES.has(mode) ? mode : "walking";
  if (!map || !isPointNavigable(map, start.x, start.y, normalizedMode) || !isPointNavigable(map, target.x, target.y, normalizedMode)) {
    return [];
  }

  if (isSegmentNavigable(map, start, target, normalizedMode)) {
    return [roundPoint(start), roundPoint(target)];
  }

  const graph = getRouteGraph(mapId, normalizedMode);
  const startNode = findNearestVisibleNode(graph, map, start, normalizedMode);
  const targetNode = findNearestVisibleNode(graph, map, target, normalizedMode);
  if (!startNode || !targetNode) return [];

  const nodePath = findAStarPath(graph, startNode, targetNode);
  if (!nodePath.length) return [];
  return simplifyRoute(map, [start, ...nodePath, target], normalizedMode).map(roundPoint);
}

export function getRouteGraph(mapId, mode = "walking") {
  const normalizedMode = ROUTE_MODES.has(mode) ? mode : "walking";
  const key = `${mapId}:${normalizedMode}`;
  if (graphCache.has(key)) return graphCache.get(key);
  const map = maps[mapId];
  if (!map || (normalizedMode === "pushingBike" && map.kind === "churchInterior")) {
    return { mapId, mode: normalizedMode, nodes: [], byKey: new Map(), spacing: GRID_SIZE };
  }

  const nodes = [];
  const byKey = new Map();
  for (let y = GRID_SIZE / 2; y < map.height; y += GRID_SIZE) {
    for (let x = GRID_SIZE / 2; x < map.width; x += GRID_SIZE) {
      if (!isPointNavigable(map, x, y, normalizedMode, false)) continue;
      const node = { x, y, key: gridKey(x, y) };
      nodes.push(node);
      byKey.set(node.key, node);
    }
  }
  const graph = { mapId, mode: normalizedMode, nodes, byKey, spacing: GRID_SIZE };
  graphCache.set(key, graph);
  return graph;
}

export function validateRouteGraphForDebug(mapId) {
  const result = {};
  ["walking", "vehicle", "pushingBike"].forEach((mode) => {
    const graph = getRouteGraph(mapId, mode);
    const visited = new Set();
    const queue = graph.nodes.length ? [graph.nodes[0]] : [];
    while (queue.length) {
      const node = queue.shift();
      if (!node || visited.has(node.key)) continue;
      visited.add(node.key);
      getGraphNeighbors(graph, node).forEach((neighbor) => {
        if (!visited.has(neighbor.key)) queue.push(neighbor);
      });
    }
    result[mode] = { nodes: graph.nodes.length, connectedNodes: visited.size };
  });
  return result;
}

export function showRouteGraphForDebug(enabled = true) {
  runtime.navigation ||= {};
  runtime.navigation.debugGraph = Boolean(enabled);
  return runtime.navigation.debugGraph;
}

export function clearRouteGraphCache() {
  graphCache.clear();
}

function findAStarPath(graph, start, target) {
  const open = [start];
  const openKeys = new Set([start.key]);
  const cameFrom = new Map();
  const gScore = new Map([[start.key, 0]]);
  const fScore = new Map([[start.key, distance(start, target)]]);

  while (open.length) {
    let bestIndex = 0;
    for (let index = 1; index < open.length; index += 1) {
      if ((fScore.get(open[index].key) ?? Infinity) < (fScore.get(open[bestIndex].key) ?? Infinity)) bestIndex = index;
    }
    const current = open.splice(bestIndex, 1)[0];
    openKeys.delete(current.key);
    if (current.key === target.key) return reconstructPath(cameFrom, graph, current.key);

    getGraphNeighbors(graph, current).forEach((neighbor) => {
      const tentative = (gScore.get(current.key) ?? Infinity) + distance(current, neighbor);
      if (tentative >= (gScore.get(neighbor.key) ?? Infinity)) return;
      cameFrom.set(neighbor.key, current.key);
      gScore.set(neighbor.key, tentative);
      fScore.set(neighbor.key, tentative + distance(neighbor, target));
      if (!openKeys.has(neighbor.key)) {
        open.push(neighbor);
        openKeys.add(neighbor.key);
      }
    });
  }
  return [];
}

function getGraphNeighbors(graph, node) {
  const result = [];
  const offsets = [
    [-GRID_SIZE, 0], [GRID_SIZE, 0], [0, -GRID_SIZE], [0, GRID_SIZE],
    [-GRID_SIZE, -GRID_SIZE], [GRID_SIZE, -GRID_SIZE], [-GRID_SIZE, GRID_SIZE], [GRID_SIZE, GRID_SIZE]
  ];
  offsets.forEach(([dx, dy]) => {
    const neighbor = graph.byKey.get(gridKey(node.x + dx, node.y + dy));
    if (!neighbor) return;
    const map = maps[graph.mapId];
    if (isSegmentNavigable(map, node, neighbor, graph.mode, false)) result.push(neighbor);
  });
  return result;
}

function findNearestVisibleNode(graph, map, point, mode) {
  const candidates = graph.nodes
    .map((node) => ({ node, distance: distance(point, node) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 28);
  return candidates.find(({ node }) => isSegmentNavigable(map, point, node, mode))?.node || null;
}

function simplifyRoute(map, route, mode) {
  if (route.length <= 2) return route;
  const result = [route[0]];
  let anchor = 0;
  while (anchor < route.length - 1) {
    let next = route.length - 1;
    while (next > anchor + 1 && !isSegmentNavigable(map, route[anchor], route[next], mode)) next -= 1;
    result.push(route[next]);
    anchor = next;
  }
  return result;
}

function isSegmentNavigable(map, from, to, mode, includeEventBlocks = true) {
  const length = distance(from, to);
  const steps = Math.max(1, Math.ceil(length / 22));
  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = from.x + (to.x - from.x) * ratio;
    const y = from.y + (to.y - from.y) * ratio;
    if (!isPointNavigable(map, x, y, mode, includeEventBlocks)) return false;
  }
  return true;
}

function isPointNavigable(map, x, y, mode, includeEventBlocks = true) {
  if (mode === "pushingBike" && map.kind === "churchInterior") return false;
  const zones = (map.walkZones || []).filter((zone) => pointInRect(x, y, zone));
  if (!zones.length) return false;
  if (mode === "vehicle" && !zones.some(isVehicleZoneAllowed)) return false;
  if (mode === "vehicle" && (map.vehicleRestrictedZones || []).some((zone) => pointInRect(x, y, zone))) return false;

  const blockers = [
    ...(map.buildings || []),
    ...(map.shops || []),
    ...(map.vehicleShops || []),
    ...(map.collisionBlocks || []),
    ...(map.landmarks || []).filter((landmark) => landmark.solid !== false),
    ...(mode === "vehicle" ? (map.vehicleBlocked || []) : [])
  ];
  if (includeEventBlocks && map.id === runtime.navigation?.currentRouteMapId) {
    blockers.push(...(runtime.eventCollisionBlocks || []).filter((block) => !block.mapId || block.mapId === map.id));
  }
  return !blockers.some((block) => pointInExpandedRect(x, y, block, mode === "vehicle" ? 10 : 6));
}

function isVehicleZoneAllowed(zone) {
  if (zone.vehicleAllowed === false) return false;
  if (zone.vehicleAllowed === true) return true;
  if (VEHICLE_ZONE_KINDS.has(zone.kind)) return true;
  return zone.kind === "sidewalk" && Math.min(zone.width, zone.height) >= 90;
}

function reconstructPath(cameFrom, graph, currentKey) {
  const path = [graph.byKey.get(currentKey)];
  while (cameFrom.has(currentKey)) {
    currentKey = cameFrom.get(currentKey);
    path.unshift(graph.byKey.get(currentKey));
  }
  return path;
}

function gridKey(x, y) {
  return `${Math.round(x / GRID_SIZE)}:${Math.round(y / GRID_SIZE)}`;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function pointInExpandedRect(x, y, rect, margin) {
  return x >= rect.x - margin && x <= rect.x + rect.width + margin && y >= rect.y - margin && y <= rect.y + rect.height + margin;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function roundPoint(point) {
  return { x: Math.round(point.x), y: Math.round(point.y) };
}
