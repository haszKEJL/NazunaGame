import { TILE_SIZE } from './config.js';
import { npcSprites, areAssetsLoaded } from './assets.js'; // Assuming npcSprites will be added to assets.js
import { isWalkable } from './utils.js';
import { getCurrentMap, getMapCols, getMapRows } from './map.js';

// NPCs array
export let npcs = [];

// NPC creation function
function createNpc(id, name, type, x, y, dialogue = [], inventory = [], interactionType = 'talk') {
    let sprite;
    // Basic sprite assignment - could be more complex later
    switch (type) {
        case 'merchant':
            sprite = npcSprites.merchant; // Example sprite key
            break;
        case 'villager':
        default:
            sprite = npcSprites.villager; // Example sprite key
            break;
    }

    if (!sprite) {
        console.warn(`Sprite not found for NPC type: ${type}. Using default.`);
        sprite = npcSprites.villager; // Fallback
    }

    return {
        id,
        name,
        type,
        x, // Tile X
        y, // Tile Y
        sprite,
        dialogue,
        inventory, // For merchants
        interactionType // 'talk', 'trade', 'both'
    };
}

/** Clears all NPCs from the game. */
export function clearNpcs() {
    npcs = [];
    console.log("All NPCs cleared.");
}

// Spawn NPCs based on the current map ID
export function spawnNpcsForMap(mapId) {
    clearNpcs(); // Ensure no old NPCs remain
    let potentialSpawns = [];
    const currentMap = getCurrentMap();
    const mapCols = getMapCols();
    const mapRows = getMapRows();

    switch (mapId) {
        case 'city':
            potentialSpawns = [
                { id: 'merchant1', name: 'Bob the Merchant', type: 'merchant', x: 3, y: 3, dialogue: ["Welcome! Care to trade?"], inventory: [{ name: 'Health Potion', cost: 10 }, { name: 'Sword', cost: 50 }], interactionType: 'both' },
                { id: 'villager1', name: 'Alice', type: 'villager', x: 8, y: 7, dialogue: ["Hello there, traveler.", "Nice day, isn't it?"], interactionType: 'talk' },
                { id: 'villager2', name: 'Guard', type: 'villager', x: 15, y: 9, dialogue: ["Keep the peace.", "Don't cause trouble."], interactionType: 'talk' },
            ];
            break;
        // No NPCs on world map or dungeon for now
        case 'world':
        case 'dungeon':
        default:
            potentialSpawns = [];
            break;
    }

    potentialSpawns.forEach(spawn => {
        // Check if the tile itself is walkable (NPCs usually stand on walkable tiles)
        if (isWalkable(spawn.x, spawn.y, currentMap, mapCols, mapRows)) {
            const npc = createNpc(spawn.id, spawn.name, spawn.type, spawn.x, spawn.y, spawn.dialogue, spawn.inventory, spawn.interactionType);
            if (npc) {
                npcs.push(npc);
            }
        } else {
            console.warn(`Cannot spawn NPC ${spawn.name} at (${spawn.x},${spawn.y}) on map '${mapId}' - tile not walkable.`);
        }
    });

    console.log(`NPCs spawned for map '${mapId}':`, npcs);
}

/**
 * Draws all NPCs onto the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawNpcs(ctx) {
    if (!areAssetsLoaded()) return; // Ensure assets are ready

    for (const npc of npcs) {
        if (npc.sprite && npc.sprite.complete) {
             ctx.drawImage(
                npc.sprite,
                npc.x * TILE_SIZE, // Convert tile coords to pixel coords
                npc.y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
        } else {
            // Optionally draw a placeholder if sprite isn't ready
            ctx.fillStyle = 'blue'; // Placeholder color for NPCs
            ctx.fillRect(npc.x * TILE_SIZE + 8, npc.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            // console.warn(`NPC sprite not ready for ${npc.name}`);
        }
    }
}

/**
 * Finds an NPC at the given tile coordinates.
 * @param {number} x - Tile x-coordinate.
 * @param {number} y - Tile y-coordinate.
 * @returns {object | null} The NPC object or null if none found.
 */
export function getNpcAt(x, y) {
    return npcs.find(npc => npc.x === x && npc.y === y) || null;
}
