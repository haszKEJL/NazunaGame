import {
    TILE_FLOOR, TILE_GRASS, TILE_ROAD, TILE_DOOR, TILE_CITY_ENTRANCE, TILE_STONE, // Added TILE_STONE
    TILE_WALL, TILE_WATER, TILE_BUILDING // Import non-walkable for clarity if needed elsewhere
} from './config.js';

// Define walkable tiles in a set for easy checking
const walkableTiles = new Set([
    TILE_FLOOR,         // Floor is walkable again
    TILE_GRASS,         // Grass is walkable again
    TILE_STONE,         // Stone is now walkable
    TILE_ROAD,
    TILE_DOOR,          // Doors are walkable (trigger transitions)
    TILE_CITY_ENTRANCE // City entrances are walkable (trigger transitions)
]);

/**
 * Checks if a given tile coordinate is walkable on the map based on tile type.
 * Does NOT check for entities (player/enemies/NPCs).
 * @param {number} x - The x-coordinate (tile index).
 * @param {number} y - The y-coordinate (tile index).
 * @param {Array<Array<number>>} mapData - The specific map data array to check against.
 * @param {number} mapCols - Total columns in the map.
 * @param {number} mapRows - Total rows in the map.
 * @returns {boolean} True if the tile type is walkable, false otherwise.
 */
export function isWalkable(x, y, mapData, mapCols, mapRows) {
    // Check map boundaries
    if (x < 0 || x >= mapCols || y < 0 || y >= mapRows) {
        return false;
    }
    // Check tile type
    if (!mapData || !mapData[y] || mapData[y][x] === undefined) {
        console.error(`Map data missing or invalid at (${x}, ${y})`);
        return false; // Prevent errors if map data isn't loaded yet or coords are wrong
    }
    const tileType = mapData[y][x];

    // Check if the tile type is in the set of walkable tiles
    return walkableTiles.has(tileType);
}

/**
 * Gets the tile type at a specific coordinate on the map.
 * @param {number} x - The x-coordinate (tile index).
 * @param {number} y - The y-coordinate (tile index).
 * @param {Array<Array<number>>} mapData - The specific map data array.
 * @returns {number | null} The tile type number, or null if out of bounds or invalid.
 */
export function getTileAt(x, y, mapData) {
    if (!mapData || !mapData[y] || mapData[y][x] === undefined) {
        // console.warn(`Attempted to get tile outside map bounds or invalid map data at (${x}, ${y})`);
        return null; // Return null for invalid coordinates or map data
    }
    // Check boundaries explicitly
    const mapRows = mapData.length;
    const mapCols = mapData[0] ? mapData[0].length : 0;
     if (x < 0 || x >= mapCols || y < 0 || y >= mapRows) {
        return null;
    }

    return mapData[y][x];
}


/**
 * Finds the nearest walkable tile coordinates using Breadth-First Search.
 * @param {number} startTileX - The starting X tile coordinate.
 * @param {number} startTileY - The starting Y tile coordinate.
 * @param {Array<Array<number>>} mapData - The map data array.
 * @param {number} mapCols - Total columns in the map.
 * @param {number} mapRows - Total rows in the map.
 * @returns {{x: number, y: number} | null} Coordinates of the nearest walkable tile, or null if none found (shouldn't happen on valid maps).
 */
export function findNearestWalkableTile(startTileX, startTileY, mapData, mapCols, mapRows) {
    const queue = [{ x: startTileX, y: startTileY }];
    const visited = new Set([`${startTileX},${startTileY}`]);
    const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        // Check if the current tile itself is walkable
        if (isWalkable(current.x, current.y, mapData, mapCols, mapRows)) {
            return { x: current.x, y: current.y };
        }

        // Explore neighbors
        for (const dir of directions) {
            const nextX = current.x + dir.dx;
            const nextY = current.y + dir.dy;
            const key = `${nextX},${nextY}`;

            // Check bounds and if already visited
            if (nextX >= 0 && nextX < mapCols && nextY >= 0 && nextY < mapRows && !visited.has(key)) {
                 // Check if the neighbor is walkable (Optimization: Check here instead of adding all neighbors)
                 if (isWalkable(nextX, nextY, mapData, mapCols, mapRows)) {
                    return { x: nextX, y: nextY }; // Found the nearest walkable neighbor
                 }
                 // If neighbor is not walkable, add to queue to explore its neighbors later
                 visited.add(key);
                 queue.push({ x: nextX, y: nextY });
            }
        }
    }

    console.error(`findNearestWalkableTile: Could not find any walkable tile starting from (${startTileX}, ${startTileY}). This might indicate a map issue.`);
    return null; // Should ideally not happen on a map with walkable areas
}


// Add other utility functions here later if needed
