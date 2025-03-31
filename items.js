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
    }
    // Add more items here later (e.g., better weapons, helmets, boots, rings)
};
