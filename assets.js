// --- Tileset ---
export const tileset = new Image();
tileset.src = 'simple_tiles.png';
let tilesetLoaded = false;
tileset.onload = () => {
    console.log("Tileset loaded: simple_tiles.png");
    tilesetLoaded = true;
    checkAllAssetsLoaded();
};
tileset.onerror = () => {
    console.error("CRITICAL: Failed to load tileset: simple_tiles.png");
    criticalAssetErrorOccurred = true; // Set critical error flag
    tilesetLoaded = true; // Mark as loaded anyway to ensure check runs
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

function enemySpriteLoaded(spriteName) {
    console.log(`Enemy sprite loaded: ${spriteName}`);
    enemySpritesLoadedCount++;
    checkAllAssetsLoaded();
}
function enemySpriteError(spriteName) {
    console.error(`Failed to load enemy sprite: ${spriteName}`);
    enemySpritesLoadedCount++; // Increment even on error to prevent blocking
    checkAllAssetsLoaded();
}

enemySprites.slime.src = 'slime.png';
enemySprites.slime.onload = () => enemySpriteLoaded('slime.png');
enemySprites.slime.onerror = () => enemySpriteError('slime.png');
enemySprites.skeleton.src = 'skeleton.png';
enemySprites.skeleton.onload = () => enemySpriteLoaded('skeleton.png');
enemySprites.skeleton.onerror = () => enemySpriteError('skeleton.png');
enemySprites.demon.src = 'demon.png';
enemySprites.demon.onload = () => enemySpriteLoaded('demon.png');
enemySprites.demon.onerror = () => enemySpriteError('demon.png');
enemySprites.cultist.src = 'cultist.png';
enemySprites.cultist.onload = () => enemySpriteLoaded('cultist.png');
enemySprites.cultist.onerror = () => enemySpriteError('cultist.png');

// --- Player Sprites ---
export const playerSprites = {
    front: new Image(),
    back: new Image(),
    left: new Image(),
    right: new Image()
};
let playerSpritesLoadedCount = 0;
const totalPlayerSprites = Object.keys(playerSprites).length;

function playerSpriteLoaded(spriteName) {
    console.log(`Player sprite loaded: ${spriteName}`);
    playerSpritesLoadedCount++;
    checkAllAssetsLoaded();
}
function playerSpriteError(spriteName) {
    console.error(`CRITICAL: Failed to load player sprite: ${spriteName}`);
    criticalAssetErrorOccurred = true; // Set critical error flag
    playerSpritesLoadedCount++; // Increment count anyway to ensure check runs
    checkAllAssetsLoaded();
}

playerSprites.front.src = 'nazuna_front.png';
playerSprites.front.onload = () => playerSpriteLoaded('nazuna_front.png');
playerSprites.front.onerror = () => playerSpriteError('nazuna_front.png');
playerSprites.back.src = 'nazuna_back.png';
playerSprites.back.onload = () => playerSpriteLoaded('nazuna_back.png');
playerSprites.back.onerror = () => playerSpriteError('nazuna_back.png');
playerSprites.left.src = 'nazuna_left.png';
playerSprites.left.onload = () => playerSpriteLoaded('nazuna_left.png');
playerSprites.left.onerror = () => playerSpriteError('nazuna_left.png');
playerSprites.right.src = 'nazuna_right.png';
playerSprites.right.onload = () => playerSpriteLoaded('nazuna_right.png');
playerSprites.right.onerror = () => playerSpriteError('nazuna_right.png');

// --- NPC Sprites (Placeholders) ---
export const npcSprites = {
    merchant: new Image(),
    villager: new Image()
};
let npcSpritesLoadedCount = 0;
const totalNpcSprites = Object.keys(npcSprites).length;

function npcSpriteLoaded(spriteName) {
    console.log(`NPC sprite loaded: ${spriteName}`);
    npcSpritesLoadedCount++;
    checkAllAssetsLoaded();
}
function npcSpriteError(spriteName) {
    console.error(`Failed to load NPC sprite: ${spriteName}`);
    npcSpritesLoadedCount++; // Increment even on error
    checkAllAssetsLoaded();
}

// Using existing sprite as placeholder
npcSprites.merchant.src = 'nazuna_front.png'; // Placeholder
npcSprites.merchant.onload = () => npcSpriteLoaded('merchant (nazuna_front.png)');
npcSprites.merchant.onerror = () => npcSpriteError('merchant (nazuna_front.png)');
npcSprites.villager.src = 'nazuna_front.png'; // Placeholder
npcSprites.villager.onload = () => npcSpriteLoaded('villager (nazuna_front.png)');
npcSprites.villager.onerror = () => npcSpriteError('villager (nazuna_front.png)');

// --- Combat Background ---
export const combatBackground = new Image();
let combatBackgroundLoaded = false;

function combatBackgroundAssetLoaded(assetName) {
    console.log(`Combat background loaded: ${assetName}`);
    combatBackgroundLoaded = true;
    checkAllAssetsLoaded();
}
function combatBackgroundAssetError(assetName) {
    console.error(`Failed to load combat background: ${assetName}`);
    combatBackgroundLoaded = true; // Mark as loaded anyway
    checkAllAssetsLoaded();
}

combatBackground.src = 'combat_background.png'; // Placeholder filename
combatBackground.onload = () => combatBackgroundAssetLoaded('combat_background.png');
combatBackground.onerror = () => combatBackgroundAssetError('combat_background.png');


// --- Asset Loading Check ---
let criticalAssetErrorOccurred = false; // Flag to track critical errors
let allAssetsLoaded = false;
let onAllAssetsLoadedCallback = null;

function checkAllAssetsLoaded() {
    const allPlayerSpritesLoaded = playerSpritesLoadedCount === totalPlayerSprites;
    const allEnemySpritesLoaded = enemySpritesLoadedCount === totalEnemySprites;
    const allNpcSpritesLoaded = npcSpritesLoadedCount === totalNpcSprites;
    const allCombatBackgroundLoaded = combatBackgroundLoaded; // Use the flag directly

    const allCountersMet = allPlayerSpritesLoaded && tilesetLoaded && allEnemySpritesLoaded && allNpcSpritesLoaded && allCombatBackgroundLoaded;

    if (allCountersMet && !criticalAssetErrorOccurred && !allAssetsLoaded) {
        // Only set allAssetsLoaded to true if all counters are met AND no critical error occurred
        allAssetsLoaded = true;
        console.log("All assets loaded successfully.");
        if (onAllAssetsLoadedCallback) {
            onAllAssetsLoadedCallback();
        }
    } else if (allCountersMet && criticalAssetErrorOccurred && !allAssetsLoaded) {
        // If all counters met but a critical error occurred, log it and don't proceed
        console.error("Asset loading complete, but critical assets failed to load. Game cannot start.");
        // Optionally, display an error message to the user via the UI here
        // e.g., document.getElementById('loadingError').textContent = 'Failed to load critical game assets. Please check file paths and reload.';
    } else if (!allAssetsLoaded) {
         // Still loading or non-critical error occurred
         // Optional: More detailed logging during development
         // console.log(`Asset loading status: Player ${playerSpritesLoadedCount}/${totalPlayerSprites}, Tileset ${tilesetLoaded}, Enemies ${enemySpritesLoadedCount}/${totalEnemySprites}, NPCs ${npcSpritesLoadedCount}/${totalNpcSprites}, CombatBG ${combatBackgroundLoaded}, CriticalError: ${criticalAssetErrorOccurred}`);
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
