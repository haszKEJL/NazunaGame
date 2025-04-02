// Import necessary tile types and player object
import { TILE_SIZE, TILE_FLOOR, TILE_GRASS, TILE_FOREST, TILE_MOUNTAIN, TILE_DESERT, TILE_SWAMP } from './config.js';
import { enemySprites, areAssetsLoaded } from './assets.js';
import { isWalkable, getTileAt } from './utils.js';
import { getCurrentMap, getMapCols, getMapRows } from './map.js';
import { player } from './player.js'; // Import player object

// Enemies array
export let enemies = [];

// --- Enemy Definitions with Level Ranges, Gold, and Drops ---
const enemyTypes = {
    slime: {
        spriteKey: 'slime', baseHp: 15, baseAtk: 4, baseDef: 1, baseDex: 2, baseXp: 338, baseGoldDrop: 3, minLvl: 1, maxLvl: 4,
        dropTable: [
            { itemKey: 'healthPotion', chance: 0.3 },
            { itemKey: 'dagger', chance: 0.05 },
            { itemKey: 'leatherBoots', chance: 0.02 },
        ]
    },
    skeleton: {
        spriteKey: 'skeleton', baseHp: 25, baseAtk: 7, baseDef: 3, baseDex: 5, baseXp: 203, baseGoldDrop: 10, minLvl: 2, maxLvl: 5,
        dropTable: [
            { itemKey: 'healthPotion', chance: 0.1 },
            { itemKey: 'basicSword', chance: 0.05 },
            { itemKey: 'woodenShield', chance: 0.04 },
            { itemKey: 'ironHelmet', chance: 0.02 },
            { itemKey: 'ringOfProtection', chance: 0.01 },
        ]
    },
    cultist: {
        spriteKey: 'cultist', baseHp: 20, baseAtk: 6, baseDef: 2, baseDex: 4, baseXp: 135, baseGoldDrop: 8, minLvl: 2, maxLvl: 4,
         dropTable: [
            { itemKey: 'healthPotion', chance: 0.2 },
            { itemKey: 'leatherArmor', chance: 0.08 },
            { itemKey: 'magicStaff', chance: 0.03 },
            { itemKey: 'talismanOfWisdom', chance: 0.01 },
            { itemKey: 'throwingKnives', chance: 0.05 },
        ]
    },
    demon: {
        spriteKey: 'demon', baseHp: 40, baseAtk: 10, baseDef: 5, baseDex: 7, baseXp: 430, baseGoldDrop: 25, minLvl: 4, maxLvl: 7,
        dropTable: [
            { itemKey: 'healthPotion', chance: 0.1 },
            { itemKey: 'ironSword', chance: 0.1 },
            { itemKey: 'chainmail', chance: 0.05 },
            { itemKey: 'steelSword', chance: 0.04 },
            { itemKey: 'steelHelmet', chance: 0.03 },
            { itemKey: 'ironBoots', chance: 0.03 },
            { itemKey: 'ironShield', chance: 0.02 },
            { itemKey: 'amuletOfStrength', chance: 0.01 },
            { itemKey: 'ringOfPower', chance: 0.01 },
        ]
    },
};

// Enemy creation function with level scaling
function createEnemy(type, x, y, level) {
    const baseStats = enemyTypes[type];
    if (!baseStats) {
        console.error("Unknown enemy type:", type);
        return null;
    }

    const sprite = enemySprites[baseStats.spriteKey];
    if (!sprite) {
        console.error(`Sprite key '${baseStats.spriteKey}' not found in enemySprites for type ${type}`);
        return null;
    }

    // Simple scaling example (adjust multipliers as needed)
    const levelMultiplier = 1 + (level - 1) * 0.25; // +25% stats per level above 1
    const hp = Math.floor(baseStats.baseHp * levelMultiplier);
    const attack = Math.floor(baseStats.baseAtk * levelMultiplier);
    const defense = Math.floor(baseStats.baseDef * levelMultiplier);
    const dexterity = Math.floor(baseStats.baseDex * levelMultiplier);
    const xpReward = Math.floor(baseStats.baseXp * levelMultiplier);
    // Calculate gold drop with some randomness (e.g., +/- 20%)
    const baseGold = Math.floor(baseStats.baseGoldDrop * levelMultiplier);
    const goldDrop = Math.max(1, baseGold + Math.floor((Math.random() - 0.5) * baseGold * 0.4)); // Ensure at least 1 gold

    return {
        type,
        level, // Store level
        x, // Tile X
        y, // Tile Y
        sprite,
        hp,
        maxHp: hp,
        attack,
        defense,
        dexterity,
        xpReward,
        goldDrop, // Add gold drop amount
        dropTable: baseStats.dropTable, // Pass drop table reference
        // Use the ID provided by the server if available, otherwise generate one (though server should always provide)
        id: arguments.length > 4 && arguments[4] ? arguments[4] : Date.now() + Math.random()
    };
}

/** Clears all enemies from the game. */
export function clearEnemies() {
    enemies = [];
    console.log("Client: All enemies cleared.");
}

// REMOVED: Client-side spawnEnemiesForMap function is no longer needed.
/*
export function spawnEnemiesForMap(mapId) {
    // ... (entire function removed) ...
}
*/

/**
 * Updates the client's enemy list based on data received from the server.
 * @param {object} serverEnemies - An object where keys are enemy IDs and values are enemy data from the server.
 *                                Example: { 'enemy-1': { id: 'enemy-1', type: 'slime', x: 5, y: 10, level: 2, hp: 20, maxHp: 20 }, ... }
 */
export function updateEnemiesFromServer(serverEnemies) {
    clearEnemies(); // Clear the existing local list first
    const newEnemies = [];

    for (const enemyId in serverEnemies) {
        const data = serverEnemies[enemyId];
        // We need to recreate the full enemy object on the client using createEnemy
        // This ensures we have sprites, full stats, drop tables, etc.
        const clientEnemy = createEnemy(data.type, data.x, data.y, data.level);

        if (clientEnemy) {
            // Overwrite client-generated ID/HP with server-provided data
            clientEnemy.id = data.id;
            clientEnemy.hp = data.hp;
            clientEnemy.maxHp = data.maxHp;
            // Add any other server-authoritative fields here if needed in the future

            newEnemies.push(clientEnemy);
        } else {
            console.warn(`Failed to create client enemy object for server data:`, data);
        }
    }

    enemies = newEnemies; // Replace the local array with the newly created ones
    console.log(`Client: Updated enemies from server. Count: ${enemies.length}`);
}

/**
 * Adds a single enemy received from the server to the client's list.
 * @param {object} enemyData - The data for the single enemy from the server.
 *                             Example: { id: 'enemy-123', type: 'skeleton', x: 15, y: 20, level: 3, hp: 30, maxHp: 30 }
 */
export function addEnemy(enemyData) {
    // Check if enemy with this ID already exists (e.g., due to race condition or duplicate message)
    if (enemies.some(e => e.id === enemyData.id)) {
        console.warn(`Client: Received spawn event for existing enemy ID ${enemyData.id}. Ignoring.`);
        return;
    }

    // Use createEnemy to build the full client-side object
    const clientEnemy = createEnemy(enemyData.type, enemyData.x, enemyData.y, enemyData.level);

    if (clientEnemy) {
        // Overwrite client-generated ID/HP with server-provided data
        clientEnemy.id = enemyData.id;
        clientEnemy.hp = enemyData.hp;
        clientEnemy.maxHp = enemyData.maxHp;
        // Add any other server-authoritative fields here if needed

        enemies.push(clientEnemy); // Add the new enemy to the array
        console.log(`Client: Added spawned enemy ${clientEnemy.id} (${clientEnemy.type})`);
    } else {
        console.warn(`Failed to create client enemy object for spawned server data:`, enemyData);
    }
}


// Draw enemies
/**
 * Draws all enemies onto the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawEnemies(ctx) {
    // Redundant check removed: if (!areAssetsLoaded()) return;

    // Convert tile coordinates to pixel coordinates for drawing
    for (const enemy of enemies) {
        // Removed .complete check, rely on onAssetsLoaded
        if (enemy.sprite) {
             ctx.drawImage(
                enemy.sprite,
                enemy.x * TILE_SIZE, // Enemy x/y are tile coords
                enemy.y * TILE_SIZE, // Enemy x/y are tile coords
                TILE_SIZE,
                TILE_SIZE
            );
        } else {
            // Optionally draw a placeholder if sprite isn't ready
            ctx.fillStyle = 'red'; // Placeholder color
            ctx.fillRect(enemy.x * TILE_SIZE + 8, enemy.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
            console.warn(`Enemy sprite object missing for ${enemy.type}`);
        }
    }
}

/**
 * Removes a specific enemy from the game.
 * @param {object} enemyToRemove - The enemy object to remove.
 */
export function removeEnemy(enemyToRemove) {
    enemies = enemies.filter(e => e.id !== enemyToRemove.id);
}
