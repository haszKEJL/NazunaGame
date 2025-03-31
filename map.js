import {
    TILE_SIZE, TILE_FLOOR, TILE_WALL, TILE_GRASS, TILE_WATER,
    TILE_CITY_ENTRANCE, TILE_ROAD, TILE_BUILDING, TILE_DOOR, TILE_DUNGEON_ENTRANCE // Added dungeon entrance
} from './config.js';
// import { tileset, areAssetsLoaded } from './assets.js'; // No longer needed for drawing map

// --- Map Definitions ---
const dungeonMap = [ // 25x19
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// World Map - Expanded to 25x19
const G = TILE_GRASS; // Alias for readability
const W = TILE_WATER;
const C = TILE_CITY_ENTRANCE;
const D = TILE_DUNGEON_ENTRANCE;

// Example Large World Map (50x50) - Procedural generation would be better for 128x128
const largeWorldMap = [];
const WORLD_MAP_SIZE = 50;
for (let y = 0; y < WORLD_MAP_SIZE; y++) {
    largeWorldMap[y] = [];
    for (let x = 0; x < WORLD_MAP_SIZE; x++) {
        if (x === 0 || x === WORLD_MAP_SIZE - 1 || y === 0 || y === WORLD_MAP_SIZE - 1) {
            largeWorldMap[y][x] = G; // Water border
        } else {
            largeWorldMap[y][x] = G; // Grass interior
        }
    }
}
// Place City and Dungeon entrances somewhere
largeWorldMap[10][15] = C; // City at (15, 10)
largeWorldMap[25][30] = D; // Dungeon at (30, 25)

// Keep original smaller maps for now
const worldMap_UNUSED = [ // 25x19 - No longer used directly, replaced by largeWorldMap
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, C, G, G, G, G, G, G, G, G, G, G, G, G, G, W], // City Entrance (Tile 4)
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    // ... (rest of the old world map definition - commented out or removed) ...
    // [W, G, G, G, G, G, G, G, D, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W], // Dungeon Entrance (Tile 8)
    // ...
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, G, W],
    [W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
];


const cityMap = [ // 20x11 - Stays the same size
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6],
    [6, 5, 6, 6, 6, 5, 6, 6, 6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 5, 6],
    [6, 5, 6, 7, 6, 5, 6, 7, 6, 5, 6, 7, 6, 5, 6, 7, 6, 6, 5, 6],
    [6, 5, 6, 6, 6, 5, 6, 6, 6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 5, 6],
    [6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6],
    [6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 6, 6, 6, 5, 6, 6, 6, 6, 5, 6],
    [6, 5, 6, 7, 6, 5, 6, 7, 6, 7, 6, 7, 6, 5, 6, 7, 6, 6, 5, 6],
    [6, 5, 6, 6, 6, 5, 6, 6, 6, 6, 6, 6, 6, 5, 6, 6, 6, 6, 5, 6],
    [6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6],
    [6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6], // Exit Door (Tile 7) at the bottom
];

// --- Current Map State ---
let currentMapId = 'world'; // Start on the large world map
let currentMapData = largeWorldMap; // Use the large map
let worldMapPlayerStart = { x: undefined, y: undefined }; // Store where player was on world map

export function getCurrentMap() {
    return currentMapData;
}

export function getCurrentMapId() {
    return currentMapId;
}

export function changeMap(mapId, player) {
    let newMapData;
    let startTileX, startTileY; // Use tile coordinates for placement logic

    // Store player's current world position if leaving world map
    if (currentMapId === 'world' && (mapId === 'city' || mapId === 'dungeon')) {
        worldMapPlayerStart.x = Math.floor(player.x / TILE_SIZE);
        worldMapPlayerStart.y = Math.floor(player.y / TILE_SIZE);
    }


    switch (mapId) {
        case 'world':
            newMapData = largeWorldMap; // Use the large map
            // Try to place player where they left off, otherwise find entrance
            if (worldMapPlayerStart.x !== undefined && worldMapPlayerStart.y !== undefined) {
                 // Place player adjacent to where they entered the city/dungeon
                 // This logic might need refinement depending on which entrance they used
                 // For now, just place them at the stored coords if possible
                 startTileX = worldMapPlayerStart.x;
                 startTileY = worldMapPlayerStart.y;
                 // Clear stored position after using it
                 worldMapPlayerStart.x = undefined;
                 worldMapPlayerStart.y = undefined;

            } else {
                 // Fallback: Find the city entrance tile (or default if none)
                 let entranceFound = false;
                 // Prioritize finding the specific entrance the player used if possible (more complex)
                 // Simple fallback: find *any* entrance or default
                 for (let y = 0; y < newMapData.length; y++) {
                    let x = newMapData[y].indexOf(TILE_CITY_ENTRANCE);
                    if (x !== -1) {
                        startTileX = x;
                        startTileY = y + 1; // Place below city
                        entranceFound = true;
                        break;
                    }
                    x = newMapData[y].indexOf(TILE_DUNGEON_ENTRANCE);
                     if (x !== -1) {
                        startTileX = x;
                        startTileY = y + 1; // Place below dungeon
                        entranceFound = true;
                        break;
                    }
                 }
                 if (!entranceFound) { startTileX = 10; startTileY = 10; } // Default start pos on large map
            }
            break;
        case 'city':
            newMapData = cityMap;
            // Find the bottom exit door to place the player near it when entering from world
             let cityExitFound = false;
             for (let y = newMapData.length - 1; y >= 0; y--) {
                const x = newMapData[y].indexOf(TILE_DOOR);
                if (x !== -1 && y === newMapData.length - 1) { // Ensure it's the bottom door
                    startTileX = x;
                    startTileY = y - 1; // Place above the door
                    cityExitFound = true;
                    break;
                }
            }
             if (!cityExitFound) { startTileX = 1; startTileY = 1; } // Fallback
            break;
        case 'dungeon':
            newMapData = dungeonMap;
            startTileX = 1; // Default start for dungeon (top-left corner inside walls)
            startTileY = 1;
            break;
        default:
            console.error("Unknown map ID:", mapId);
            return;
    }

    currentMapId = mapId;
    currentMapData = newMapData;
    // Update player position (pixel coordinates) based on the calculated start tile
    player.x = startTileX * TILE_SIZE;
    player.y = startTileY * TILE_SIZE;

    console.log(`Changed map to ${mapId}. Player at tile (${startTileX}, ${startTileY})`);
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
