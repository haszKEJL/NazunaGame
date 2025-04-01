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
        id: Date.now() + Math.random()
    };
}

/** Clears all enemies from the game. */
export function clearEnemies() {
    enemies = [];
    console.log("All enemies cleared.");
}

// Spawn enemies randomly based on the current map ID
export function spawnEnemiesForMap(mapId) {
    clearEnemies();
    const currentMap = getCurrentMap();
    const mapCols = getMapCols();
    const mapRows = getMapRows();
    let spawnCount = 0;
    let enemyConfig = [];
    let levelRange = { min: 1, max: 3 }; // Default level range

    switch (mapId) {
        case 'world':
            // Determine biome based on player location
            const playerTileX = Math.floor(player.x / TILE_SIZE);
            const playerTileY = Math.floor(player.y / TILE_SIZE);
            const currentTileType = getTileAt(playerTileX, playerTileY, currentMap); // Use currentMap data

            console.log(`Spawning for world map. Player at (${playerTileX}, ${playerTileY}), TileType: ${currentTileType}`);

            switch (currentTileType) {
                case TILE_GRASS: // Zone 1: Grass (Levels 1-4)
                    spawnCount = 8;
                    levelRange = { min: 1, max: 4 };
                    enemyConfig = [
                        { type: 'slime', weight: 6 },
                        { type: 'cultist', weight: 2 }, // Early cultists
                    ];
                    console.log("Biome: Grass");
                    break;
                case TILE_FOREST: // Zone 2: Forest (Levels 3-6)
                    spawnCount = 10;
                     levelRange = { min: 3, max: 6 };
                    enemyConfig = [
                        { type: 'slime', weight: 3 },
                        { type: 'skeleton', weight: 4 },
                        { type: 'cultist', weight: 3 },
                    ];
                     console.log("Biome: Forest");
                    break;
                case TILE_MOUNTAIN: // Zone 3: Mountain (Levels 5-8)
                    spawnCount = 12;
                     levelRange = { min: 5, max: 8 };
                    enemyConfig = [
                        { type: 'skeleton', weight: 5 },
                        { type: 'demon', weight: 2 }, // Introduce demons
                        { type: 'cultist', weight: 1 }, // Fewer cultists
                    ];
                     console.log("Biome: Mountain");
                    break;
                case TILE_DESERT: // Zone 4: Desert (Levels 7-10)
                    spawnCount = 10;
                     levelRange = { min: 7, max: 10 };
                    enemyConfig = [
                        { type: 'skeleton', weight: 3 }, // Tougher skeletons
                        { type: 'demon', weight: 4 },
                        // Add desert-specific enemy type later?
                    ];
                     console.log("Biome: Desert");
                    break;
                 case TILE_SWAMP: // Zone 5: Swamp (Levels 9-12)
                    spawnCount = 15;
                     levelRange = { min: 9, max: 12 };
                    enemyConfig = [
                        { type: 'slime', weight: 2 }, // Stronger slimes?
                        { type: 'demon', weight: 5 },
                        { type: 'cultist', weight: 3 }, // Swamp cultists?
                        // Add swamp-specific enemy type later?
                    ];
                     console.log("Biome: Swamp");
                    break;
                default: // Water, City Entrance etc. - No spawns or default grass?
                    spawnCount = 5; // Default to grass spawns if on non-biome tile
                     levelRange = { min: 1, max: 4 };
                    enemyConfig = [ { type: 'slime', weight: 1 } ];
                    console.log("Biome: Other (Defaulting to low-level Slime)");
                    break;
            }
            break; // End of case 'world'

        case 'city':
            spawnCount = 0; // No enemies in city
            break;
        case 'dungeon':
            spawnCount = 10; // Example: Max 10 enemies in dungeon
            enemyConfig = [
                { type: 'slime', weight: 3 },
                { type: 'skeleton', weight: 4 },
                { type: 'cultist', weight: 3 },
                { type: 'demon', weight: 1 }, // Lower chance for demon
            ];
            break;
        default:
            console.error("Unknown map ID for spawning enemies:", mapId);
            return;
    }

    if (spawnCount === 0 || enemyConfig.length === 0) {
        console.log(`No enemies to spawn for map '${mapId}'.`);
        return;
    }

    // Calculate total weight for weighted random selection
    const totalWeight = enemyConfig.reduce((sum, config) => sum + config.weight, 0);

    let attempts = 0;
    const maxAttempts = spawnCount * 5; // Prevent infinite loop if map is full

    while (enemies.length < spawnCount && attempts < maxAttempts) {
        attempts++;
        // Choose enemy type based on weight
        let randomWeight = Math.random() * totalWeight;
        let chosenType = null;
        for (const config of enemyConfig) {
            randomWeight -= config.weight;
            if (randomWeight <= 0) {
                chosenType = config.type;
                break;
            }
        }
        if (!chosenType) continue; // Should not happen if totalWeight > 0

        // Choose random position
        const x = Math.floor(Math.random() * mapCols);
        const y = Math.floor(Math.random() * mapRows);

        // Check if tile is walkable and not already occupied by another enemy
        if (isWalkable(x, y, currentMap, mapCols, mapRows) && !enemies.some(e => e.x === x && e.y === y)) {
            const enemyData = enemyTypes[chosenType];
            // Determine random level within the ZONE's level range
            const level = Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)) + levelRange.min;

            const enemy = createEnemy(chosenType, x, y, level);
            if (enemy) {
                // Optional: Check if the spawned enemy's tile matches the target biome?
                // This prevents enemies spawning randomly across the whole map if desired.
                // For now, allow random placement anywhere walkable.
                enemies.push(enemy);
            }
        }
    }

    if (attempts >= maxAttempts) {
        console.warn(`Reached max spawn attempts (${maxAttempts}) for map '${mapId}'. Spawned ${enemies.length}/${spawnCount} enemies.`);
    }
    console.log(`Enemies spawned for map '${mapId}':`, enemies);
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
