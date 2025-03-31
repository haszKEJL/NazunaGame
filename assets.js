// --- Tileset ---
export const tileset = new Image();
tileset.src = 'simple_tiles.png';
let tilesetLoaded = false;
tileset.onload = () => {
    tilesetLoaded = true;
    checkAllAssetsLoaded();
};

// --- Enemy Sprites ---
export const enemySprites = {
    slime: new Image(),
    skeleton: new Image(),
    demon: new Image(),
    cultist: new Image()
};
let enemySpritesLoadedCount = 0;
const totalEnemySprites = Object.keys(enemySprites).length;

function enemySpriteLoaded() {
    enemySpritesLoadedCount++;
    checkAllAssetsLoaded();
}

enemySprites.slime.src = 'slime.png';
enemySprites.slime.onload = enemySpriteLoaded;
enemySprites.skeleton.src = 'skeleton.png';
enemySprites.skeleton.onload = enemySpriteLoaded;
enemySprites.demon.src = 'demon.png';
enemySprites.demon.onload = enemySpriteLoaded;
enemySprites.cultist.src = 'cultist.png';
enemySprites.cultist.onload = enemySpriteLoaded;

// --- Player Sprites ---
export const playerSprites = {
    front: new Image(),
    back: new Image(),
    left: new Image(),
    right: new Image()
};
let playerSpritesLoadedCount = 0;
const totalPlayerSprites = Object.keys(playerSprites).length;

function playerSpriteLoaded() {
    playerSpritesLoadedCount++;
    checkAllAssetsLoaded();
}

playerSprites.front.src = 'nazuna_front.png';
playerSprites.front.onload = playerSpriteLoaded;
playerSprites.back.src = 'nazuna_back.png';
playerSprites.back.onload = playerSpriteLoaded;
playerSprites.left.src = 'nazuna_left.png';
playerSprites.left.onload = playerSpriteLoaded;
playerSprites.right.src = 'nazuna_right.png';
playerSprites.right.onload = playerSpriteLoaded;

// --- NPC Sprites (Placeholders) ---
export const npcSprites = {
    merchant: new Image(),
    villager: new Image()
};
let npcSpritesLoadedCount = 0;
const totalNpcSprites = Object.keys(npcSprites).length;

function npcSpriteLoaded() {
    npcSpritesLoadedCount++;
    checkAllAssetsLoaded();
}

// Using existing sprite as placeholder
npcSprites.merchant.src = 'nazuna_front.png'; // Placeholder
npcSprites.merchant.onload = npcSpriteLoaded;
npcSprites.villager.src = 'nazuna_front.png'; // Placeholder
npcSprites.villager.onload = npcSpriteLoaded;


// --- Asset Loading Check ---
let allAssetsLoaded = false;
let onAllAssetsLoadedCallback = null;

function checkAllAssetsLoaded() {
    const allPlayerSpritesLoaded = playerSpritesLoadedCount === totalPlayerSprites;
    const allEnemySpritesLoaded = enemySpritesLoadedCount === totalEnemySprites;
    const allNpcSpritesLoaded = npcSpritesLoadedCount === totalNpcSprites; // Added NPC check

    if (allPlayerSpritesLoaded && tilesetLoaded && allEnemySpritesLoaded && allNpcSpritesLoaded && !allAssetsLoaded) { // Added NPC check
        allAssetsLoaded = true;
        console.log("All assets loaded.");
        if (onAllAssetsLoadedCallback) {
            onAllAssetsLoadedCallback();
        }
    } else {
         // Optional: More detailed logging during development
         // console.log(`Asset loading status: Player ${playerSpritesLoadedCount}/${totalPlayerSprites}, Tileset ${tilesetLoaded}, Enemies ${enemySpritesLoadedCount}/${totalEnemySprites}, NPCs ${npcSpritesLoadedCount}/${totalNpcSprites}`);
    }
}

/**
 * Registers a callback function to be executed once all assets are loaded.
 * If assets are already loaded, the callback is executed immediately.
 * @param {function} callback - The function to call when assets are loaded.
 */
export function onAssetsLoaded(callback) {
    if (allAssetsLoaded) {
        callback();
    } else {
        onAllAssetsLoadedCallback = callback;
    }
}

/**
 * Returns whether all assets have finished loading.
 * @returns {boolean}
 */
export function areAssetsLoaded() {
    return allAssetsLoaded;
}
