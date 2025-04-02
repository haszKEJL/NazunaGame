// --- Substat Definitions ---

export const possibleSubstats = [ // Added export keyword
    { stat: 'hp', tiers: [100, 150, 200], isPercent: false }, // Flat HP
    { stat: 'hpPercent', tiers: [4, 5, 6], isPercent: true }, // HP %
    { stat: 'attack', tiers: [10, 15, 20], isPercent: false }, // Flat Attack
    { stat: 'attackPercent', tiers: [4, 5, 6], isPercent: true }, // Attack %
    { stat: 'defense', tiers: [10, 15, 20], isPercent: false }, // Flat Defense
    { stat: 'defensePercent', tiers: [5, 6, 7], isPercent: true }, // Defense %
    { stat: 'speed', tiers: [3, 4, 5], isPercent: false }, // Flat Speed
    { stat: 'critRate', tiers: [2, 3, 4], isPercent: true }, // Crit Rate %
    { stat: 'critDamage', tiers: [4, 6, 8], isPercent: true }, // Crit Damage %
    // { stat: 'energyRecharge', tiers: [4, 5, 6], isPercent: true }, // Example for later
];

// Number of initial substats based on item rarity
const initialSubstatsByRarity = {
    1: 0, // Rarity 1 gets 0 initial
    2: 1, // Rarity 2 gets 1 initial
    3: 2, // Rarity 3 gets 2 initial
    4: 3, // Rarity 4 gets 3 initial
    5: 4, // Rarity 5 gets 4 initial
};

/**
 * Generates initial random substats for an item based on its rarity.
 * @param {object} itemDefinition - The base definition of the item from the items object.
 * @returns {Array<object>} An array of substat objects, e.g., [{ stat: 'hp', value: 150 }, ...]
 */
export function generateInitialSubstats(itemDefinition) {
    if (!itemDefinition || typeof itemDefinition.rarity !== 'number' || itemDefinition.rarity < 1 || itemDefinition.rarity > 5) {
        return []; // Return empty if item is not equippable or rarity is invalid
    }

    const numSubstats = initialSubstatsByRarity[itemDefinition.rarity] || 0;
    if (numSubstats === 0) {
        return [];
    }

    const mainStats = Object.keys(itemDefinition.stats || {}); // Get main stats to avoid duplicating them
    let availableSubstats = possibleSubstats.filter(sub => !mainStats.includes(sub.stat)); // Filter out main stats

    const generatedSubstats = [];
    for (let i = 0; i < numSubstats && availableSubstats.length > 0; i++) {
        // Select a random substat definition from the available pool
        const randomIndex = Math.floor(Math.random() * availableSubstats.length);
        const selectedSubstatDef = availableSubstats[randomIndex];

        // Select a random value tier for the chosen substat
        const randomTierIndex = Math.floor(Math.random() * selectedSubstatDef.tiers.length);
        const selectedValue = selectedSubstatDef.tiers[randomTierIndex];

        // Add the generated substat to the result array
        generatedSubstats.push({
            stat: selectedSubstatDef.stat,
            value: selectedValue,
            isPercent: selectedSubstatDef.isPercent // Store if it's a percentage stat
        });

        // Remove the selected substat definition from the available pool to prevent duplicates
        availableSubstats.splice(randomIndex, 1);
    }

    console.log(`Generated ${generatedSubstats.length} initial substats for ${itemDefinition.name}:`, generatedSubstats);
    return generatedSubstats;
}


// --- Item Definitions ---

export const items = {
    healthPotion: {
        name: 'Health Potion',
        type: 'consumable',
        effect: { hp: 30 }, // Restores 30 HP
        stackable: true
    },
    basicSword: {
        name: 'Basic Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 3, strength: 1 }, // Main Stat(s)
        stackable: false,
        baseValue: 10,
        upgradeLevel: 0,
        rarity: 3, // Example rarity
        substats: [] // Array for { stat: 'name', value: number }
    },
    leatherArmor: {
        name: 'Leather Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 2, agility: 1 },
        stackable: false,
        baseValue: 15,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    ironSword: {
        name: 'Iron Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 6, strength: 2 },
        stackable: false,
        baseValue: 30,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    chainmail: {
        name: 'Chainmail',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 5, constitution: 1 },
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    steelSword: {
        name: 'Steel Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 9, strength: 3 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        rarity: 4, // Higher tier item
        substats: []
    },
    steelArmor: {
        name: 'Steel Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 8, constitution: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    longsword: {
        name: 'Longsword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 12, strength: 4 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    plateArmor: {
        name: 'Plate Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 11, constitution: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    dagger: {
        name: 'Dagger',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 5, dexterity: 2 },
        stackable: false,
        baseValue: 25,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    helmet: { // Assuming this is a generic leather/basic helmet
        name: 'Leather Helm', // Renamed for clarity
        type: 'armor',
        slot: 'helmet', // Correct slot
        stats: { defense: 3, constitution: 1 },
        stackable: false,
        baseValue: 20,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    battleAxe: {
        name: 'Battle Axe',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 15, strength: 5 },
        stackable: false,
        baseValue: 90,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    shield: { // Assuming this is a generic basic shield
        name: 'Round Shield', // Renamed for clarity
        type: 'armor',
        slot: 'shield', // Correct slot
        stats: { defense: 7, strength: 1 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    shortBow: {
        name: 'Short Bow',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 8, dexterity: 3 },
        stackable: false,
        baseValue: 45,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    boots: { // Assuming generic basic boots
        name: 'Worn Boots', // Renamed for clarity
        type: 'armor',
        slot: 'boots', // Correct slot
        stats: { defense: 1, agility: 2 },
        stackable: false,
        baseValue: 30,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    greatSword: {
        name: 'Great Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 18, strength: 6 },
        stackable: false,
        baseValue: 110,
        upgradeLevel: 0,
        rarity: 5, // High tier item
        substats: []
    },
    fullPlate: {
        name: 'Full Plate Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 14, constitution: 4 },
        stackable: false,
        baseValue: 100,
        upgradeLevel: 0,
        rarity: 5,
        substats: []
    },
    magicStaff: {
        name: 'Magic Staff',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 10, intelligence: 5 }, // Could be magic attack later
        stackable: false,
        baseValue: 65,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    ringOfDefense: {
        name: 'Ring of Defense',
        type: 'armor',
        slot: 'ring', // Correct slot
        stats: { defense: 4, intelligence: 2 },
        stackable: false,
        baseValue: 55,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    throwingKnives: { // These are consumable weapons? Keep simple for now.
        name: 'Throwing Knives',
        type: 'weapon',
        slot: 'weapon', // Or maybe a different slot type?
        stats: { attack: 7, dexterity: 4 },
        stackable: true, // Consumable weapon
        baseValue: 5, // Value per knife?
        // Upgrade doesn't make sense if stackable/consumable
    },
    amuletOfHealth: {
        name: 'Amulet of Health',
        type: 'armor',
        slot: 'necklace', // Correct slot
        stats: { maxHp: 20, constitution: 1 }, // Using maxHp directly for now
        stackable: false,
        baseValue: 75,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    // --- New Items (Added Rarity/Substats) ---
    ironHelmet: {
        name: 'Iron Helmet',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 4, constitution: 1 },
        stackable: false,
        baseValue: 35,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    steelHelmet: {
        name: 'Steel Helmet',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 6, constitution: 2 },
        stackable: false,
        baseValue: 55,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    leatherBoots: {
        name: 'Leather Boots',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 1, agility: 2 },
        stackable: false,
        baseValue: 25,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    ironBoots: {
        name: 'Iron Boots',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 3, agility: 1 },
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    woodenShield: {
        name: 'Wooden Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 3 },
        stackable: false,
        baseValue: 15,
        upgradeLevel: 0,
        rarity: 2, // Lower rarity
        substats: []
    },
    ironShield: {
        name: 'Iron Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 6, strength: 1 },
        stackable: false,
        baseValue: 45,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    },
    steelShield: {
        name: 'Steel Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 9, strength: 2 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    amuletOfStrength: {
        name: 'Amulet of Strength',
        type: 'armor',
        slot: 'necklace',
        stats: { strength: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    amuletOfDexterity: {
        name: 'Amulet of Dexterity',
        type: 'armor',
        slot: 'necklace',
        stats: { dexterity: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    ringOfPower: {
        name: 'Ring of Power',
        type: 'armor',
        slot: 'ring',
        stats: { attack: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    ringOfProtection: {
        name: 'Ring of Protection',
        type: 'armor',
        slot: 'ring',
        stats: { defense: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    ringOfAgility: {
        name: 'Ring of Agility',
        type: 'armor',
        slot: 'ring',
        stats: { agility: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    talismanOfWisdom: {
        name: 'Talisman of Wisdom',
        type: 'armor',
        slot: 'talisman',
        stats: { intelligence: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        rarity: 5,
        substats: []
    },
    talismanOfFortitude: {
        name: 'Talisman of Fortitude',
        type: 'armor',
        slot: 'talisman',
        stats: { constitution: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        rarity: 5,
        substats: []
    },
    // Add 5 more diverse items (Added Rarity/Substats)
    greatHelm: {
        name: 'Great Helm',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 8, constitution: 1 },
        stackable: false,
        baseValue: 85,
        upgradeLevel: 0,
        rarity: 5,
        substats: []
    },
    platedGreaves: {
        name: 'Plated Greaves',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 5 },
        stackable: false,
        baseValue: 65,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    towerShield: {
        name: 'Tower Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 12, strength: -1 }, // Heavy shield penalty
        stackable: false,
        baseValue: 100,
        upgradeLevel: 0,
        rarity: 5,
        substats: []
    },
    pendantOfCourage: {
        name: 'Pendant of Courage',
        type: 'armor',
        slot: 'necklace',
        stats: { attack: 1, defense: 1 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        rarity: 4,
        substats: []
    },
    signetRing: {
        name: 'Signet Ring',
        type: 'armor',
        slot: 'ring',
        stats: { goldDropBonus: 0.05 }, // Example: 5% gold bonus (needs implementation later)
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        rarity: 3,
        substats: []
    }
};
