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
    // Add more items here later (e.g., better weapons, helmets, boots, rings)
};
