// Import new biome tiles
// Import new biome tiles
import {
    TILE_SIZE, TILE_FLOOR, TILE_WALL, TILE_GRASS, TILE_WATER,
    TILE_CITY_ENTRANCE, TILE_ROAD, TILE_BUILDING, TILE_DOOR, TILE_DUNGEON_ENTRANCE,
    TILE_FOREST, TILE_MOUNTAIN, TILE_DESERT, TILE_SWAMP,
    TILE_TREE, TILE_STONE // Added obstacles
} from './config.js';
// import { tileset, areAssetsLoaded } from './assets.js'; // No longer needed for drawing map

// --- Define Tile Aliases (Define BEFORE use) ---
const FL = TILE_FLOOR;
const WL = TILE_WALL;
const GR = TILE_GRASS;
const WT = TILE_WATER;
const CE = TILE_CITY_ENTRANCE;
const RD = TILE_ROAD;
const BL = TILE_BUILDING;
const DR = TILE_DOOR;
const DE = TILE_DUNGEON_ENTRANCE;
const FO = TILE_FOREST;
const MT = TILE_MOUNTAIN;
const DS = TILE_DESERT;
const SW = TILE_SWAMP;
const TR = TILE_TREE; // Alias for Tree
const ST = TILE_STONE; // Alias for Stone

// --- Map Definitions ---
const dungeonMap = [ // 25x19 - Using Aliases
    [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL], // Row 0
    [WL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, WL], // Row 1 (Exit at [1][12])
    //                                            ^-- Dungeon Exit Tile (12, 1)
    [WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL], // Row 2
    [WL, FL, WL, FL, FL, FL, FL, FL, WL, FL, FL, FL, FL, FL, FL, FL, WL, FL, FL, FL, FL, FL, WL, FL, WL], // Row 3
    [WL, FL, WL, FL, WL, WL, WL, FL, WL, WL, WL, WL, WL, WL, WL, FL, WL, FL, WL, WL, WL, FL, WL, FL, WL], // Row 4
    [WL, FL, FL, FL, WL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, WL, FL, WL, FL, FL, FL, FL, FL, WL], // Row 5
    [WL, FL, WL, FL, WL, FL, WL, WL, WL, WL, WL, FL, WL, WL, WL, WL, WL, FL, WL, FL, WL, WL, WL, FL, WL], // Row 6
    [WL, FL, WL, FL, WL, FL, WL, FL, FL, FL, FL, FL, FL, FL, FL, FL, WL, FL, WL, FL, FL, FL, WL, FL, WL], // Row 7
    [WL, FL, WL, FL, WL, FL, WL, FL, WL, WL, WL, WL, WL, WL, WL, FL, WL, FL, WL, WL, WL, FL, WL, FL, WL], // Row 8
    [WL, FL, FL, FL, FL, FL, FL, FL, WL, FL, FL, FL, FL, FL, WL, FL, FL, FL, FL, FL, FL, FL, FL, FL, WL], // Row 9
    [WL, WL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, WL, WL, FL, WL, WL, WL, WL, WL], // Row 10
    [WL, FL, FL, FL, FL, FL, WL, FL, FL, FL, WL, FL, FL, FL, WL, FL, FL, FL, WL, FL, FL, FL, FL, FL, WL], // Row 11
    [WL, FL, WL, WL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL], // Row 12
    [WL, FL, FL, FL, FL, FL, FL, FL, WL, FL, FL, FL, WL, FL, FL, FL, WL, FL, FL, FL, FL, FL, FL, FL, WL], // Row 13
    [WL, FL, WL, WL, WL, FL, WL, WL, WL, FL, WL, FL, WL, FL, WL, WL, WL, FL, WL, WL, WL, WL, WL, FL, WL], // Row 14
    [WL, FL, WL, FL, FL, FL, FL, FL, FL, FL, WL, FL, WL, FL, FL, FL, FL, FL, WL, FL, FL, FL, WL, FL, WL], // Row 15
    [WL, FL, WL, FL, WL, WL, WL, WL, WL, WL, WL, FL, WL, WL, WL, WL, WL, WL, WL, FL, WL, FL, WL, FL, WL], // Row 16
    [WL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, FL, WL, FL, FL, FL, WL], // Row 17
    [WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL, WL]  // Row 18
];

// World Map - Expanded to 64x64
// --- Define Large World Map (64x64) with Biomes ---
const WORLD_MAP_SIZE = 64;
const largeWorldMap = [];

// Simple biome layout: Grass center, Forest N, Desert E, Swamp S, Mountain W
const centerSize = 20; // Size of central grass area
const startX = Math.floor((WORLD_MAP_SIZE - centerSize) / 2);
const startY = Math.floor((WORLD_MAP_SIZE - centerSize) / 2);
const endX = startX + centerSize;
const endY = startY + centerSize;

for (let y = 0; y < WORLD_MAP_SIZE; y++) {
    largeWorldMap[y] = [];
    for (let x = 0; x < WORLD_MAP_SIZE; x++) {
        if (x < startX) { // West: Mountain
            largeWorldMap[y][x] = MT;
        } else if (x >= endX) { // East: Desert
            largeWorldMap[y][x] = DS;
        } else if (y < startY) { // North: Forest
            largeWorldMap[y][x] = FO;
        } else if (y >= endY) { // South: Swamp
            largeWorldMap[y][x] = SW;
        } else { // Center: Grass - Add obstacles here
            // Place grass first
            largeWorldMap[y][x] = GR;
            // Add random trees and stones on top of grass (adjust probability)
            const obstacleChance = 0.08; // 8% chance for an obstacle
            if (Math.random() < obstacleChance) {
                largeWorldMap[y][x] = Math.random() < 0.6 ? TR : ST; // 60% tree, 40% stone
            }
        }
    }
}

// Add some water features (example: a river)
for (let y = 0; y < WORLD_MAP_SIZE; y++) {
    if (y > 5 && y < WORLD_MAP_SIZE - 5) { // Avoid edges
        largeWorldMap[y][Math.floor(WORLD_MAP_SIZE * 0.6)] = WT; // Vertical river part
        largeWorldMap[y][Math.floor(WORLD_MAP_SIZE * 0.6) + 1] = WT;
    }
}
for (let x = Math.floor(WORLD_MAP_SIZE * 0.6); x < WORLD_MAP_SIZE - 10; x++) {
     largeWorldMap[Math.floor(WORLD_MAP_SIZE * 0.4)][x] = WT; // Horizontal river part
     largeWorldMap[Math.floor(WORLD_MAP_SIZE * 0.4)+1][x] = WT;
}


// Place City and Dungeon entrances in specific biomes
largeWorldMap[startY + 5][startX + 10] = CE; // City in Grass
largeWorldMap[10][10] = DE; // Dungeon in Mountains (NW)


// --- City Map Definition ---
const cityMap = [ // 20x11 - Using Aliases
    [BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL], // Row 0
    [BL, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, BL], // Row 1
    [BL, RD, BL, BL, BL, RD, BL, BL, BL, RD, BL, BL, BL, RD, BL, BL, BL, BL, RD, BL], // Row 2
    [BL, RD, BL, DR, BL, RD, BL, DR, BL, RD, BL, DR, BL, RD, BL, DR, BL, BL, RD, BL], // Row 3
    [BL, RD, BL, BL, BL, RD, BL, BL, BL, RD, BL, BL, BL, RD, BL, BL, BL, BL, RD, BL], // Row 4
    [BL, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, BL], // Row 5
    [BL, RD, BL, BL, BL, RD, BL, BL, BL, BL, BL, BL, BL, RD, BL, BL, BL, BL, RD, BL], // Row 6
    [BL, RD, BL, DR, BL, RD, BL, DR, BL, DR, BL, DR, BL, RD, BL, DR, BL, BL, RD, BL], // Row 7
    [BL, RD, BL, BL, BL, RD, BL, BL, BL, BL, BL, BL, BL, RD, BL, BL, BL, BL, RD, BL], // Row 8
    [BL, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, RD, BL], // Row 9
    [BL, BL, BL, BL, BL, BL, BL, BL, BL, DR, BL, BL, BL, BL, BL, BL, BL, BL, BL, BL]  // Row 10 (Exit Door at [10][9])
];

// --- Current Map State ---
let currentMapId = 'world'; // Start on the large world map
let currentMapData = largeWorldMap; // Use the large map by default
let worldMapPlayerStart = { x: undefined, y: undefined }; // Store where player was on world map

export function getCurrentMap() {
    return currentMapData;
}

export function getCurrentMapId() {
    return currentMapId;
}

// Function to get default starting pixel coordinates for a map
export function getDefaultStartCoords(mapId) {
    let startTileX, startTileY;
    let mapData; // Need map data to find entrances

    switch (mapId) {
        case 'world':
            mapData = largeWorldMap;
            // Find the city entrance tile on the large map
            let cityEntranceCoords = findTileCoords(mapData, TILE_CITY_ENTRANCE);
            if (cityEntranceCoords) {
                startTileX = cityEntranceCoords.x;
                startTileY = cityEntranceCoords.y + 1; // Place below city entrance
            } else {
                startTileX = Math.floor(WORLD_MAP_SIZE / 2); // Fallback to center
                startTileY = Math.floor(WORLD_MAP_SIZE / 2);
            }
            break;
        case 'city':
            mapData = cityMap;
            // Find the bottom exit door
            let cityExitCoords = findTileCoords(mapData, TILE_DOOR, true); // Search from bottom
             if (cityExitCoords) {
                 startTileX = cityExitCoords.x;
                 startTileY = cityExitCoords.y - 1; // Place above the door
             } else {
                 startTileX = 1; startTileY = 1; // Fallback
             }
            break;
        case 'dungeon':
            mapData = dungeonMap;
            // Find the entrance tile (assuming it's defined, e.g., TILE_FLOOR at a specific spot)
            // For now, use default top-left start
            startTileX = 1;
            startTileY = 1;
            break;
        default:
            console.warn("Unknown map ID for default coords:", mapId);
            startTileX = 1; startTileY = 1; // Generic fallback
            break;
    }
    return { x: startTileX * TILE_SIZE, y: startTileY * TILE_SIZE };
}

// Helper function to find the first occurrence of a tile type
function findTileCoords(mapData, tileType, searchFromBottom = false) {
    const rows = mapData.length;
    const cols = mapData[0] ? mapData[0].length : 0;

    if (searchFromBottom) {
        for (let y = rows - 1; y >= 0; y--) {
            for (let x = 0; x < cols; x++) {
                if (mapData[y][x] === tileType) {
                    return { x, y };
                }
            }
        }
    } else {
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (mapData[y][x] === tileType) {
                    return { x, y };
                }
            }
        }
    }
    return null; // Not found
}


// Function to change the current map data and ID
export function changeMap(mapId) {
    let newMapData;

    switch (mapId) {
        case 'world':
            newMapData = largeWorldMap;
            break;
        case 'city':
            newMapData = cityMap;
            break;
        case 'dungeon':
            newMapData = dungeonMap;
            break;
        default:
            console.error("Unknown map ID:", mapId);
            return; // Don't change map if ID is invalid
    }

    currentMapId = mapId;
    currentMapData = newMapData;
    // Player position is set *before* calling this function
    console.log(`Changed map data to ${mapId}.`);
}


// Calculate map dimensions based on the current map data
export function getMapRows() {
    return currentMapData.length;
}
export function getMapCols() {
    return currentMapData[0] ? currentMapData[0].length : 0;
}


/**
 * Draws the current game map onto the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawMap(ctx) {
    // No longer need to check areAssetsLoaded for the map itself, as we draw programmatically
    // if (!areAssetsLoaded()) {
    //     return;
    // }

    const mapRows = getMapRows();
    const mapCols = getMapCols();

    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            if (currentMapData[y] && currentMapData[y][x] !== undefined) {
                const tileType = currentMapData[y][x];
                let tileColor = '#333'; // Default background color

                // Assign colors based on tile type
                switch (tileType) {
                    case TILE_FLOOR:
                        tileColor = '#666'; // Dark grey for floor
                        break;
                    case TILE_WALL:
                        tileColor = '#BBB'; // Light grey for walls
                        break;
                    case TILE_GRASS:
                        tileColor = '#2E8B57'; // SeaGreen for grass
                        break;
                    case TILE_WATER:
                        tileColor = '#4682B4'; // SteelBlue for water
                        break;
                    case TILE_CITY_ENTRANCE:
                        tileColor = '#FFD700'; // Gold for city entrance
                        break;
                    case TILE_ROAD:
                        tileColor = '#A0522D'; // Sienna for road
                        break;
                    case TILE_BUILDING:
                        tileColor = '#8B4513'; // SaddleBrown for building
                        break;
                    case TILE_DOOR:
                        tileColor = '#CD853F'; // Peru for door
                        break;
                    case TILE_DUNGEON_ENTRANCE:
                        tileColor = '#8A2BE2'; // BlueViolet for dungeon entrance
                        break;
                    // Add new biome colors
                    case TILE_FOREST:
                        tileColor = '#006400'; // DarkGreen for forest
                        break;
                    case TILE_MOUNTAIN:
                        tileColor = '#808080'; // Grey for mountain
                        break;
                    case TILE_DESERT:
                        tileColor = '#F4A460'; // SandyBrown for desert
                        break;
                    case TILE_SWAMP:
                        tileColor = '#556B2F'; // DarkOliveGreen for swamp
                        break;
                    // Add new obstacle colors
                    case TILE_TREE:
                        tileColor = '#228B22'; // ForestGreen for trees
                        break;
                    case TILE_STONE:
                        tileColor = '#708090'; // SlateGray for stones
                        break;
                    default:
                        tileColor = '#FF00FF'; // Magenta for unknown/error
                        console.warn(`Unknown tile type ${tileType} at (${x}, ${y})`);
                        break;
                }

                ctx.fillStyle = tileColor;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

                // Optional: Add a border for better visibility
                ctx.strokeStyle = '#555';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            } else {
                 console.warn(`Undefined map data at map coordinates (${x}, ${y}) in map '${currentMapId}'`);
                 // Draw an error tile
                 ctx.fillStyle = '#FF0000'; // Red for error
                 ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}
