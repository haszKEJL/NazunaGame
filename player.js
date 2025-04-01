import { TILE_SIZE } from './config.js';
import { playerSprites } from './assets.js';
import { items } from './items.js'; // Needed for equipItem logic potentially
import { getCurrentMapId } from './map.js'; // Import function to get current map ID

// Player state object
export let player = {
    x: 0, // Initial position will be set in game.js
    y: 0,
    sprite: playerSprites.front, // Default sprite
    // Core Stats
    strength: 5,     // Affects physical attack
    dexterity: 5,    // Affects accuracy/crit (potentially)
    constitution: 5, // Affects HP
    intelligence: 5, // Affects magic/skills (potentially)
    agility: 5,      // Affects evasion/speed (potentially)
    // Derived Stats (calculated)
    hp: 0,           // Current HP
    maxHp: 0,        // Maximum HP (based on CON)
    attack: 0,       // Physical attack power (based on STR)
    defense: 0,      // Physical defense (based on CON/AGI?)
    // Leveling & Progression
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    inventory: [],
    equipment: {
        weapon: null,
        armor: null, // Body armor
        helmet: null,
        boots: null,
        shield: null,
        necklace: null,
        ring1: null,
        ring2: null,
        talisman: null
    },
    statPoints: 3, // Start with more points for testing new stats
    gold: 50 // Starting gold
};

// --- Stat Calculation Functions ---

// Base HP calculation (e.g., 50 base + 10 per CON point)
function calculateMaxHp() {
    return 50 + (player.constitution * 10) + getStatBonus('maxHp');
}

// Base Attack calculation (e.g., 5 base + 2 per STR point)
function calculateAttack() {
    return 5 + (player.strength * 2) + getStatBonus('attack');
}

// Base Defense calculation (e.g., 1 base + 1 per CON point + 0.5 per AGI point?)
function calculateDefense() {
    // Example: Mix of CON and AGI for defense
    return 1 + (player.constitution * 1) + Math.floor(player.agility * 0.5) + getStatBonus('defense');
}

// Function to recalculate all derived stats
export function recalculateStats() {
    player.maxHp = calculateMaxHp();
    player.attack = calculateAttack();
    player.defense = calculateDefense();
    // Ensure HP doesn't exceed new maxHp
    player.hp = Math.min(player.hp, player.maxHp);
    console.log("Player stats recalculated:", { maxHp: player.maxHp, attack: player.attack, defense: player.defense });
}

// Function to initialize player state from server data
export function initializePlayerFromData(serverData) { // Added export keyword
    console.log("Initializing player data from server:", serverData);
    if (!serverData) {
        console.error("No server data provided for player initialization.");
        // Fallback to default initialization
        initializePlayerStats(); // Use default stats if no server data
        return;
    }

    // Overwrite local player object properties with server data
    // Use || default to handle potentially missing fields from older DB entries
    player.level = serverData.level || 1;
    player.xp = serverData.xp || 0;
    player.xpToNextLevel = serverData.xpToNextLevel || 100;
    player.statPoints = serverData.statPoints || 0;
    player.strength = serverData.strength || 5;
    player.dexterity = serverData.dexterity || 5;
    player.constitution = serverData.constitution || 5;
    player.intelligence = serverData.intelligence || 5;
    player.agility = serverData.agility || 5;
    player.gold = serverData.gold || 0;

    // Equipment needs careful handling - assume server sends full objects
    // Initialize with defaults first, then overwrite with server data if available
    player.equipment = {
        weapon: serverData.equipment?.weapon || null,
        armor: serverData.equipment?.armor || null,
        helmet: serverData.equipment?.helmet || null,
        boots: serverData.equipment?.boots || null,
        shield: serverData.equipment?.shield || null,
        necklace: serverData.equipment?.necklace || null,
        ring1: serverData.equipment?.ring1 || null,
        ring2: serverData.equipment?.ring2 || null,
        talisman: serverData.equipment?.talisman || null
    };

    // Inventory needs careful handling - assume server sends array of objects
    player.inventory = serverData.inventory || [];

    // Recalculate derived stats based on loaded core stats
    recalculateStats();

    // Set current HP - use saved HP, but cap at new maxHp
    player.hp = Math.min(serverData.hp || player.maxHp, player.maxHp);

    // --- Load Position (but don't change map here) ---
    // Load tile coordinates from server or use defaults
    const loadedTileX = serverData.lastX; // Might be undefined
    const loadedTileY = serverData.lastY; // Might be undefined

    // Convert loaded/default tile coordinates to PIXEL coordinates for player state
    // If loadedTileX/Y are undefined/invalid, getDefaultStartCoords will be used later in game.js
    // We set potentially invalid coords here, game.js will validate and fix if needed.
    player.x = (typeof loadedTileX === 'number') ? loadedTileX * TILE_SIZE : undefined; // Convert to pixels or keep undefined
    player.y = (typeof loadedTileY === 'number') ? loadedTileY * TILE_SIZE : undefined; // Convert to pixels or keep undefined

    // Store the loaded map ID temporarily; game.js will use this to change map
    player.loadedMapId = serverData.lastMapId || 'world'; // Store the map ID to load

    console.log(`Player state initialized (Raw loaded coords: tileX=${loadedTileX}, tileY=${loadedTileY}). Pixel coords set to: (${player.x}, ${player.y})`, player);

    // Note: UI update should be triggered by the caller after this function runs.
    // Note: Map change needs to be triggered by the caller (game.js) using player.loadedMapId
}

// Initialize HP and stats on game start (used as fallback if no server data)
export function initializePlayerStats() {
    recalculateStats();
    player.hp = player.maxHp; // Start with full health
}


// --- Leveling ---
const STAT_POINTS_PER_LEVEL = 3; // How many points gained per level

export function gainXP(amount) {
    player.xp += amount;
    console.log(`Player gained ${amount} XP. Total XP: ${player.xp}/${player.xpToNextLevel}`);

    let leveledUp = false;
    while (player.xp >= player.xpToNextLevel) {
        player.level++;
        const xpOver = player.xp - player.xpToNextLevel;
        player.xp = xpOver;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5); // Increase XP needed for next level

        // Automatic increases
        // player.maxHp += 10; // MaxHP now derived from CON
        player.statPoints += STAT_POINTS_PER_LEVEL; // Grant stat points
        recalculateStats(); // Recalculate stats after potential base changes or just for safety
        player.hp = player.maxHp; // Fully heal on level up

        console.log(`LEVEL UP! Player reached level ${player.level}!`);
        console.log(`Gained ${STAT_POINTS_PER_LEVEL} stat points. Total: ${player.statPoints}. Next level at ${player.xpToNextLevel} XP.`);
        leveledUp = true;

        // --- Trigger Save on Level Up ---
        console.log("Level up occurred, triggering immediate save...");
        savePlayerData(); // Call save function immediately after level up

        // TODO: Add visual feedback for level up in ui.js (e.g., flash effect)
        // TODO: Notify player they have points to spend in ui.js
    }
    return leveledUp; // Return true if a level up occurred
}

/**
 * Spends a stat point on the specified core stat if available.
 * @param {'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'agility'} statName - The name of the core stat to increase.
 */
export function spendStatPoint(statName) {
    if (player.statPoints <= 0) {
        console.log("No stat points available to spend.");
        return false;
    }

    const validStats = ['strength', 'dexterity', 'constitution', 'intelligence', 'agility'];
    if (validStats.includes(statName)) {
        player[statName]++;
        player.statPoints--;
        console.log(`Increased ${statName} to ${player[statName]}. ${player.statPoints} points remaining.`);
        recalculateStats(); // Recalculate derived stats after spending a point
        savePlayerData(); // --- Trigger Save on Stat Point Spend ---
        return true;
    } else {
        console.log(`Cannot spend points on '${statName}'. Valid stats are: ${validStats.join(', ')}.`);
        return false;
    }
}


// --- Equipment & Stat Calculation ---
// Get total bonus for a specific stat from all equipped items
export function getStatBonus(statName) {
    let bonus = 0;
    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        // Check if the item exists and has a stats object with the specified stat
        if (item && typeof item.stats === 'object' && item.stats !== null && typeof item.stats[statName] === 'number') {
            bonus += item.stats[statName];
        }
    }
    return bonus;
}

// --- Inventory Management ---
export function addItemToInventory(itemData) {
    const item = { ...itemData }; // Create a copy

    if (item.stackable) {
        const existingItem = player.inventory.find(i => i.name === item.name);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            console.log(`Added another ${item.name}. Quantity: ${existingItem.quantity}`);
        } else {
            item.quantity = 1;
            player.inventory.push(item);
            console.log(`Added ${item.name} to inventory.`);
        }
    } else {
        player.inventory.push(item);
        console.log(`Added ${item.name} to inventory.`);
    }
}

export function useItem(itemName) {
    const itemIndex = player.inventory.findIndex(i => i.name === itemName);
    if (itemIndex === -1) {
        console.log(`No ${itemName} in inventory.`);
        return false; // Indicate failure
    }

    const item = player.inventory[itemIndex];

    if (item.type === 'consumable' && item.effect.hp) {
        if (player.hp >= player.maxHp) {
            console.log("Player HP is already full.");
            return false; // Indicate failure
        }
        player.hp = Math.min(player.maxHp, player.hp + item.effect.hp);
        console.log(`Used ${item.name}. Restored ${item.effect.hp} HP. Current HP: ${player.hp}/${player.maxHp}`);

        item.quantity--;
        if (item.quantity <= 0) {
            player.inventory.splice(itemIndex, 1);
        }
        return true; // Indicate success
    } else {
        console.log(`Cannot use ${itemName} right now.`);
        return false; // Indicate failure
    }
}

export function equipItem(itemIndex) {
    if (itemIndex < 0 || itemIndex >= player.inventory.length) {
        console.log("Invalid item index to equip.");
        return;
    }

    const itemToEquip = player.inventory[itemIndex];
    if (!itemToEquip.slot) {
        console.log(`${itemToEquip.name} is not equippable.`);
        return;
    }

    let slot = itemToEquip.slot; // Get the intended slot

    // Special handling for rings
    if (slot === 'ring') {
        if (!player.equipment.ring1) {
            slot = 'ring1'; // Equip in ring1 if empty
        } else if (!player.equipment.ring2) {
            slot = 'ring2'; // Equip in ring2 if ring1 is full
        } else {
            // Both ring slots are full, unequip ring1 by default
            addItemToInventory(player.equipment.ring1);
            console.log(`Unequipped ${player.equipment.ring1.name} from ring1.`);
            player.equipment.ring1 = null; // Clear slot before equipping new one
            slot = 'ring1'; // Equip the new ring in ring1
        }
    }

    // Check if the final determined slot exists in player.equipment
    if (!(slot in player.equipment)) {
        console.error(`Invalid equipment slot determined: ${slot}`);
        return;
    }

    const currentItem = player.equipment[slot]; // Get item currently in the target slot

    if (currentItem) {
        addItemToInventory(currentItem); // Add it back to inventory
        console.log(`Unequipped ${currentItem.name}.`);
    }

    player.equipment[slot] = itemToEquip;
    player.inventory.splice(itemIndex, 1); // Remove from inventory
    console.log(`Equipped ${itemToEquip.name} in ${slot} slot.`);
    recalculateStats(); // Recalculate stats after equipping/unequipping
}

// Simple function to equip the first weapon/armor found
export function equipFirstAvailableItem() {
    let itemIndex = -1;
    if (!player.equipment.weapon) {
        itemIndex = player.inventory.findIndex(item => item.type === 'weapon');
    }
    if (itemIndex === -1 && !player.equipment.armor) {
        itemIndex = player.inventory.findIndex(item => item.type === 'armor');
    }
     if (itemIndex === -1) {
        itemIndex = player.inventory.findIndex(item => item.type === 'weapon' || item.type === 'armor');
    }

    if (itemIndex !== -1) {
        equipItem(itemIndex);
    } else {
        console.log("No equippable items found in inventory.");
    }
}

// --- Item Upgrading ---
// Basic upgrade cost formula (exponential)
function calculateUpgradeCost(item) {
    if (!item || typeof item.upgradeLevel === 'undefined' || !item.baseValue) {
        return Infinity; // Cannot calculate cost
    }
    // Example: baseValue * 2^level (cost doubles each level)
    return Math.floor(item.baseValue * Math.pow(2, item.upgradeLevel));
}

// Function to attempt upgrading an item in the inventory
export function upgradeInventoryItem(itemIndex) {
    if (itemIndex < 0 || itemIndex >= player.inventory.length) {
        console.log("Upgrade failed: Invalid item index.");
        return false;
    }

    const item = player.inventory[itemIndex];

    // Check if item is upgradable
    if (typeof item.upgradeLevel === 'undefined' || typeof item.maxUpgradeLevel === 'undefined' || !item.baseValue) {
        console.log(`Upgrade failed: ${item.name} is not upgradable.`);
        return false;
    }

    // Check if max level reached - REMOVED FOR INFINITE UPGRADES
    // if (item.upgradeLevel >= item.maxUpgradeLevel) {
    //     console.log(`Upgrade failed: ${item.name} is already at max level (${item.maxUpgradeLevel}).`);
    //     return false;
    // }

    // Check cost
    const cost = calculateUpgradeCost(item);
    if (player.gold < cost) {
        console.log(`Upgrade failed: Not enough gold. Need ${cost}, have ${player.gold}.`);
        return false;
    }

    // --- Apply Upgrade ---
    player.gold -= cost;
    item.upgradeLevel++;

    // Apply stat increases (example: +1 to primary stat, maybe + defense for armor)
    // This modifies the item instance directly in the inventory.
    if (item.stats) {
        if (item.type === 'weapon' && item.stats.attack) {
            item.stats.attack += 1; // Example: +1 attack per level
            console.log(`Upgraded ${item.name} Attack to ${item.stats.attack}`);
        } else if (item.type === 'weapon' && item.stats.strength) {
             item.stats.strength += 1; // Example: +1 str per 2 levels?
             console.log(`Upgraded ${item.name} Strength to ${item.stats.strength}`);
        }
        if (item.type === 'armor' && item.stats.defense) {
            item.stats.defense += 1; // Example: +1 defense per level
             console.log(`Upgraded ${item.name} Defense to ${item.stats.defense}`);
        }
         // Add more specific stat upgrades based on item type/stats if needed
    }

    console.log(`Successfully upgraded ${item.name} to Level ${item.upgradeLevel}! Cost: ${cost} gold.`);

    // If the upgraded item is currently equipped, recalculate player stats
    let itemIsEquipped = false;
    for (const slot in player.equipment) {
        if (player.equipment[slot] === item) {
            itemIsEquipped = true;
            break;
        }
    }
    if (itemIsEquipped) {
        console.log("Recalculating player stats as upgraded item was equipped.");
        recalculateStats();
    }

    return true; // Indicate success
}


// --- Drawing ---
/**
 * Draws the player character onto the canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
 */
export function drawPlayer(ctx) {
    // Rely on onAssetsLoaded to ensure sprite is ready or errored.
    // The .complete check can be unreliable in the first frame.
    if (!player.sprite) {
        console.warn("Player sprite object is missing.");
        return;
    }
    // Player x and y are now pixel coordinates
    ctx.drawImage(
        player.sprite,
        player.x, // Use pixel coordinate directly
        player.y, // Use pixel coordinate directly
        TILE_SIZE,
        TILE_SIZE
    );
}

// --- Data Persistence ---
/**
 * Sends the current player state to the server to be saved.
 */
export async function savePlayerData() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Save failed: No authentication token found.");
        return;
    }

    // Prepare the data payload - only include fields managed by the client
    const dataToSave = {
        level: player.level,
        xp: player.xp,
        xpToNextLevel: player.xpToNextLevel,
        statPoints: player.statPoints,
        strength: player.strength,
        dexterity: player.dexterity,
        constitution: player.constitution,
        intelligence: player.intelligence,
        agility: player.agility,
        hp: player.hp, // Save current HP
        maxHp: player.maxHp, // Save max HP in case CON changed
        gold: player.gold,
        equipment: player.equipment, // Send the whole equipment object
        inventory: player.inventory,  // Send the whole inventory array
        // Add position and map ID (save TILE coordinates)
        lastMapId: getCurrentMapId(),
        lastX: Math.floor(player.x / TILE_SIZE), // Convert PIXEL to TILE for saving
        lastY: Math.floor(player.y / TILE_SIZE)  // Convert PIXEL to TILE for saving
    };

    console.log("Attempting to save player data:", dataToSave);

    try {
        const response = await fetch('/api/player/save', { // Use relative URL
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Include the JWT token
            },
            body: JSON.stringify(dataToSave)
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Player data saved successfully:", result.message);
        } else {
            console.error(`Failed to save player data: ${response.status} - ${result.message || 'Unknown server error'}`);
            // Handle specific errors? e.g., if token expired (401/403), prompt re-login?
            if (response.status === 401 || response.status === 403) {
                 console.error("Authentication error during save. Token might be invalid or expired.");
                 // Optionally clear token and force logout?
                 // localStorage.removeItem('token');
                 // window.location.reload();
            }
        }
    } catch (error) {
        console.error("Network error while saving player data:", error);
    }
}
