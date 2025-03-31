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
        stats: { attack: 3, strength: 1 },
        stackable: false,
        baseValue: 10, // Base value for upgrades/selling
        upgradeLevel: 0, // Track upgrade level
        maxUpgradeLevel: 5
    },
    leatherArmor: {
        name: 'Leather Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 2, agility: 1 },
        stackable: false,
        baseValue: 15,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ironSword: {
        name: 'Iron Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 6, strength: 2 },
        stackable: false,
        baseValue: 30,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    chainmail: {
        name: 'Chainmail',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 5, constitution: 1 },
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    steelSword: {
        name: 'Steel Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 9, strength: 3 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    steelArmor: {
        name: 'Steel Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 8, constitution: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    longsword: {
        name: 'Longsword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 12, strength: 4 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    plateArmor: {
        name: 'Plate Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 11, constitution: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    dagger: {
        name: 'Dagger',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 5, dexterity: 2 },
        stackable: false,
        baseValue: 25,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    helmet: {
        name: 'Helmet',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 3, constitution: 1 },
        stackable: false,
        baseValue: 20,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    battleAxe: {
        name: 'Battle Axe',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 15, strength: 5 },
        stackable: false,
        baseValue: 90,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    shield: {
        name: 'Shield',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 7, strength: 1 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    shortBow: {
        name: 'Short Bow',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 8, dexterity: 3 },
        stackable: false,
        baseValue: 45,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    boots: {
        name: 'Boots',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 1, agility: 2 },
        stackable: false,
        baseValue: 30,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    greatSword: {
        name: 'Great Sword',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 18, strength: 6 },
        stackable: false,
        baseValue: 110,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    fullPlate: {
        name: 'Full Plate Armor',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 14, constitution: 4 },
        stackable: false,
        baseValue: 100,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    magicStaff: {
        name: 'Magic Staff',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 10, intelligence: 5 },
        stackable: false,
        baseValue: 65,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ringOfDefense: {
        name: 'Ring of Defense',
        type: 'armor',
        slot: 'armor',
        stats: { defense: 4, intelligence: 2 },
        stackable: false,
        baseValue: 55,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    throwingKnives: {
        name: 'Throwing Knives',
        type: 'weapon',
        slot: 'weapon',
        stats: { attack: 7, dexterity: 4 },
        stackable: true,
        baseValue: 35,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    amuletOfHealth: {
        name: 'Amulet of Health',
        type: 'armor',
        slot: 'armor',
        stats: { maxHp: 20, constitution: 1 },
        stackable: false,
        baseValue: 75,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    // --- New Items ---
    ironHelmet: {
        name: 'Iron Helmet',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 4, constitution: 1 },
        stackable: false,
        baseValue: 35,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    steelHelmet: {
        name: 'Steel Helmet',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 6, constitution: 2 },
        stackable: false,
        baseValue: 55,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    leatherBoots: {
        name: 'Leather Boots',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 1, agility: 2 },
        stackable: false,
        baseValue: 25,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ironBoots: {
        name: 'Iron Boots',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 3, agility: 1 },
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    woodenShield: {
        name: 'Wooden Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 3 },
        stackable: false,
        baseValue: 15,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ironShield: {
        name: 'Iron Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 6, strength: 1 },
        stackable: false,
        baseValue: 45,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    steelShield: {
        name: 'Steel Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 9, strength: 2 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    amuletOfStrength: {
        name: 'Amulet of Strength',
        type: 'armor',
        slot: 'necklace',
        stats: { strength: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    amuletOfDexterity: {
        name: 'Amulet of Dexterity',
        type: 'armor',
        slot: 'necklace',
        stats: { dexterity: 2 },
        stackable: false,
        baseValue: 60,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ringOfPower: {
        name: 'Ring of Power',
        type: 'armor',
        slot: 'ring', // Use generic 'ring' slot
        stats: { attack: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ringOfProtection: {
        name: 'Ring of Protection',
        type: 'armor',
        slot: 'ring',
        stats: { defense: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    ringOfAgility: {
        name: 'Ring of Agility',
        type: 'armor',
        slot: 'ring',
        stats: { agility: 2 },
        stackable: false,
        baseValue: 50,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    talismanOfWisdom: {
        name: 'Talisman of Wisdom',
        type: 'armor',
        slot: 'talisman',
        stats: { intelligence: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    talismanOfFortitude: {
        name: 'Talisman of Fortitude',
        type: 'armor',
        slot: 'talisman',
        stats: { constitution: 3 },
        stackable: false,
        baseValue: 80,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    // Add 5 more diverse items
    greatHelm: {
        name: 'Great Helm',
        type: 'armor',
        slot: 'helmet',
        stats: { defense: 8, constitution: 1 },
        stackable: false,
        baseValue: 85,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    platedGreaves: {
        name: 'Plated Greaves',
        type: 'armor',
        slot: 'boots',
        stats: { defense: 5 },
        stackable: false,
        baseValue: 65,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    towerShield: {
        name: 'Tower Shield',
        type: 'armor',
        slot: 'shield',
        stats: { defense: 12, strength: -1 }, // Heavy shield penalty
        stackable: false,
        baseValue: 100,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    pendantOfCourage: {
        name: 'Pendant of Courage',
        type: 'armor',
        slot: 'necklace',
        stats: { attack: 1, defense: 1 },
        stackable: false,
        baseValue: 70,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    },
    signetRing: {
        name: 'Signet Ring',
        type: 'armor',
        slot: 'ring',
        stats: { goldDropBonus: 0.05 }, // Example: 5% gold bonus (needs implementation)
        stackable: false,
        baseValue: 40,
        upgradeLevel: 0,
        maxUpgradeLevel: 5
    }
};
