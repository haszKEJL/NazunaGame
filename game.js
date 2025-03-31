import { TILE_SIZE, TILE_FLOOR, TILE_CITY_ENTRANCE, TILE_DOOR, TILE_DUNGEON_ENTRANCE } from './config.js'; // Added TILE_DUNGEON_ENTRANCE
import { onAssetsLoaded, areAssetsLoaded, playerSprites } from './assets.js';
import { isWalkable, getTileAt } from './utils.js';
import {
    drawMap,
    getCurrentMap,
    getMapCols,
    getMapRows,
    changeMap,
    getCurrentMapId
} from './map.js';
import { player, drawPlayer, useItem, equipFirstAvailableItem, initializePlayerStats, savePlayerData, initializePlayerFromData } from './player.js'; // Added savePlayerData and initializePlayerFromData
import { enemies, drawEnemies, clearEnemies, spawnEnemiesForMap } from './enemy.js'; // Removed initializeEnemies import
import { npcs, drawNpcs, clearNpcs, spawnNpcsForMap, getNpcAt } from './npc.js'; // Import NPC functions
import {
    startCombat,
    processPlayerAction,
    isCombatEnded,
    getCurrentCombatEnemy,
    getCombatLog
} from './combat.js';
// Import dialogue and inventory functions from ui.js
import {
    updateUI, openStatModal,
    showDialogue, hideDialogue, updateDialogueContent,
    showInventory, hideInventory // Add inventory functions (will be added to ui.js)
} from './ui.js';
import './auth.js'; // Import auth.js to handle login/register

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

if (!canvas || !ctx) {
    throw new Error("Failed to get canvas element or context.");
}

// Adjust canvas size if needed (or keep fixed based on HTML/CSS)
// canvas.width = MAP_COLS * TILE_SIZE;
// canvas.height = MAP_ROWS * TILE_SIZE;

// --- Game State ---
let gameRunning = false;
let gameState = 'overworld'; // 'overworld', 'combat', 'dialogue', 'inventory', 'trade' (future)
let currentCombatEnemy = null;
let keysPressed = {}; // Input state - Primarily for movement and combat actions held down
let currentDialogueNpc = null;
let currentDialogueIndex = 0;

// --- Camera State ---
let cameraX = 0;
let cameraY = 0;

// --- Player Data Readiness ---
let resolvePlayerReady;
const playerDataReadyPromise = new Promise(resolve => {
    resolvePlayerReady = resolve;
});

// Function to signal that player data is loaded/initialized
function signalPlayerReady() {
    console.log("Signaling player data ready.");
    if (resolvePlayerReady) {
        resolvePlayerReady();
    }
}

// Make functions accessible globally for auth.js
window.signalPlayerReady = signalPlayerReady;
window.initializePlayerFromData = initializePlayerFromData; // Expose the function from player.js

// --- Initialization ---
function initializeGame() {
    // Initialize player's derived stats based on core stats BEFORE placing them
    // Initialize player's derived stats based on core stats
    // Note: initializePlayerFromData (called on login/refresh) already handles loading stats,
    // position, and setting player.loadedMapId. initializePlayerStats is a fallback.
    if (!player.loadedMapId) { // Check if data was loaded
        initializePlayerStats(); // Initialize default stats if no data loaded
    }

    // Set player starting map and position
    // If player data was loaded, player.loadedMapId, player.x, player.y are set.
    // Otherwise, use defaults. changeMap will use player.x/y if they are non-zero,
    // or the map's default start position otherwise.
    const initialMapId = player.loadedMapId || 'world'; // Use loaded map ID or default
    console.log(`Initializing game on map: ${initialMapId} at X:${player.x}, Y:${player.y}`);
    changeMap(initialMapId, player); // Change to the correct map

    // Spawn entities for the initial map
    spawnEnemiesForMap(getCurrentMapId()); // Spawn enemies for the current map
    spawnNpcsForMap(getCurrentMapId()); // Spawn initial NPCs
    setupInputHandlers();
    gameRunning = true;
    console.log("Game initialized. Starting loop...");

    // --- Setup Periodic Save ---
    const SAVE_INTERVAL = 60000; // 60 seconds
    setInterval(() => {
        if (gameRunning && gameState !== 'combat') { // Don't save during combat? Or maybe allow? For now, avoid.
            console.log("Auto-saving player data...");
            savePlayerData();
        }
    }, SAVE_INTERVAL);
    console.log(`Auto-save enabled every ${SAVE_INTERVAL / 1000} seconds.`);

    gameLoop(); // Start the game loop
}

// --- Input Handling ---
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        // Prevent default browser actions for keys we handle (like Tab, Space)
        if (['Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        // Only add keys needed for continuous press checks (movement, maybe combat actions)
        if (gameState === 'overworld' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
             keysPressed[e.key] = true;
        } else if (gameState === 'combat' && ['a', 'A', 'i', 'I', 'f', 'F'].includes(e.key)) {
             // Add combat keys to check in updateCombat if needed, though keyup might be sufficient
             keysPressed[e.key] = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        console.log(`[DEBUG] Keyup detected: ${e.key}, Current gameState: ${gameState}`); // DIAGNOSTIC LOG

        // --- Inventory Toggle (Simplified) ---
        if (e.key === 'Tab' || (gameState === 'inventory' && e.key === 'Escape')) {
            console.log("[DEBUG] Toggling inventory via Tab/Escape."); // DIAGNOSTIC LOG
            e.preventDefault();
            toggleInventoryScreen();
        }
        // --- Other Single-Press Actions based on State ---
        else if (gameState === 'overworld') {
            if (e.key === 'h' || e.key === 'H') {
                useItem('Health Potion');
            } else if (e.key === 'e' || e.key === 'E') {
                equipFirstAvailableItem();
            } else if (e.key === ' ' || e.key === 'Enter') {
                attemptInteraction();
            } else if (e.key === 'p' || e.key === 'P') {
                if (player.statPoints > 0) {
                    openStatModal(); // TODO: Consider pausing game state here
                } else {
                    console.log("No stat points to allocate.");
                }
            }
        } else if (gameState === 'dialogue') {
             if (e.key === ' ' || e.key === 'Enter') {
                 advanceDialogue();
             }
        } else if (gameState === 'combat') {
             // Combat actions are processed in updateCombat based on keysPressed
             // We just need to remove the key from keysPressed now that it's released
             if (['a', 'A', 'i', 'I', 'f', 'F'].includes(e.key)) {
                 delete keysPressed[e.key];
             }
        }

        // --- Clear keys for non-continuous actions ---
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'A', 'i', 'I', 'f', 'F'].includes(e.key)) {
            delete keysPressed[e.key];
        }
    });
}

// --- Inventory Toggle ---
function toggleInventoryScreen() {
    if (gameState === 'overworld') {
        gameState = 'inventory';
        showInventory(); // Call UI function
        keysPressed = {}; // Clear movement keys
        console.log("Switched to inventory state.");
    } else if (gameState === 'inventory') {
        gameState = 'overworld';
        hideInventory(); // Call UI function
        console.log("Switched to overworld state.");
    } else {
        // Don't toggle if in combat or dialogue
        console.log(`Cannot toggle inventory from state: ${gameState}`);
    }
}


// --- Interaction Handling ---
function attemptInteraction() {
    if (gameState !== 'overworld') return;

    // Determine tile player is facing based on last move direction (sprite)
    let targetTileX = Math.floor(player.x / TILE_SIZE);
    let targetTileY = Math.floor(player.y / TILE_SIZE);

    if (player.sprite === playerSprites.front) targetTileY += 1;
    else if (player.sprite === playerSprites.back) targetTileY -= 1;
    else if (player.sprite === playerSprites.left) targetTileX -= 1;
    else if (player.sprite === playerSprites.right) targetTileX += 1;
    else return; // Player hasn't moved yet or sprite is default

    const npc = getNpcAt(targetTileX, targetTileY);
    if (npc) {
        console.log(`Interacting with ${npc.name}`);
        startInteraction(npc);
    } else {
        console.log("Nothing to interact with there.");
        // TODO: Check for interactable objects later?
    }
}

function startInteraction(npc) {
    // Check if NPC has dialogue to start
    if (npc.dialogue && npc.dialogue.length > 0) {
        console.log(`Starting dialogue with ${npc.name}`);
        gameState = 'dialogue';
        currentDialogueNpc = npc;
        currentDialogueIndex = 0;
        // Show the first line using the UI function
        showDialogue(npc.name, npc.dialogue[currentDialogueIndex]);
        // Prevent player movement while in dialogue
        keysPressed = {};
    } else if (npc.interactionType === 'trade') { // Handle trade-only NPCs later
        console.log(`${npc.name} only wants to trade.`);
        // TODO: Implement trade initiation
    } else {
        console.log(`${npc.name} has nothing to say.`);
    }

    // Handle trade aspect if applicable (can happen after dialogue or directly)
    // Note: This part is currently just logging, trade state transition needs implementation
    if (npc.interactionType === 'trade' || npc.interactionType === 'both') {
        // We'll handle the transition to trade state later, maybe after dialogue ends
        console.log(`${npc.name} also has items to trade:`, npc.inventory);
        // TODO: Add option to trade after dialogue
    }
}

// --- Dialogue Handling ---
function advanceDialogue() {
    if (gameState !== 'dialogue' || !currentDialogueNpc) return;

    currentDialogueIndex++;
    if (currentDialogueIndex < currentDialogueNpc.dialogue.length) {
        // Update dialogue content in the UI
        updateDialogueContent(currentDialogueNpc.dialogue[currentDialogueIndex]);
    } else {
        // End of dialogue
        endDialogue();
    }
}

function endDialogue() {
     console.log(`Ending dialogue with ${currentDialogueNpc.name}`);
     hideDialogue(); // Hide the dialogue box via UI function
     gameState = 'overworld'; // Return to normal gameplay
     currentDialogueNpc = null;
     currentDialogueIndex = 0;
     // TODO: Check if trade should be initiated now based on npc.interactionType
}


// --- Game Loop ---
function update() {
    if (!gameRunning) return;

    // Only process movement/world/camera updates if in overworld
    if (gameState === 'overworld') {
        // Handle player movement
        let moved = false;
        let targetX = player.x;
        let targetY = player.y;
        let attemptedMove = false;
        let moveX = 0;
        let moveY = 0;

        if (keysPressed['ArrowUp']) {
            moveY = -TILE_SIZE;
            player.sprite = playerSprites.back;
            attemptedMove = true;
        } else if (keysPressed['ArrowDown']) {
            moveY = TILE_SIZE;
            player.sprite = playerSprites.front;
            attemptedMove = true;
        } else if (keysPressed['ArrowLeft']) {
            moveX = -TILE_SIZE;
            player.sprite = playerSprites.left;
            attemptedMove = true;
        } else if (keysPressed['ArrowRight']) {
            moveX = TILE_SIZE;
            player.sprite = playerSprites.right;
            attemptedMove = true;
        }

        if (attemptedMove) {
            // Calculate target pixel coordinates
            targetX = player.x + moveX;
            targetY = player.y + moveY;

            // Calculate target tile coordinates for collision/interaction checks
            const targetTileX = Math.floor(targetX / TILE_SIZE);
            const targetTileY = Math.floor(targetY / TILE_SIZE);
            const targetTileType = getTileAt(targetTileX, targetTileY, getCurrentMap());

            // Check for map transitions first
            const currentMapId = getCurrentMapId(); // Renamed variable for clarity
            let mapChanged = false;

            if (currentMapId === 'world') {
                if (targetTileType === TILE_CITY_ENTRANCE) {
                    changeMap('city', player);
                    mapChanged = true;
                } else if (targetTileType === TILE_DUNGEON_ENTRANCE) {
                    changeMap('dungeon', player);
                    mapChanged = true;
                }
            } else if (currentMapId === 'city' && targetTileType === TILE_DOOR && targetTileY === getMapRows() - 1) {
                changeMap('world', player);
                mapChanged = true;
            } else if (currentMapId === 'dungeon') {
                // Add logic to exit dungeon later
            }

            if (mapChanged) {
                clearEnemies();
                clearNpcs();
                spawnEnemiesForMap(getCurrentMapId());
                spawnNpcsForMap(getCurrentMapId());
                moved = true;
            } else {
                const enemyAtTarget = enemies.find(e => e.x === targetTileX && e.y === targetTileY);
                const npcAtTarget = npcs.find(n => n.x === targetTileX && n.y === targetTileY);

                if (enemyAtTarget) {
                    console.log(`Player encountered ${enemyAtTarget.type}!`);
                    gameState = 'combat';
                    startCombat(enemyAtTarget);
                    moved = true; // Bump counts as move/action
                    keysPressed = {}; // Clear movement keys on combat start
                } else if (npcAtTarget) {
                     // Bumped into NPC, counts as an action but no movement
                     console.log(`Bumped into ${npcAtTarget.name}`);
                     // Interaction is handled by Space/Enter keyup, not bump
                     moved = true; // Still counts as a turn
                     // Don't clear keysPressed here, interaction needs Space/Enter keyup
                } else if (isWalkable(targetTileX, targetTileY, getCurrentMap(), getMapCols(), getMapRows())) {
                    player.x = targetX;
                    player.y = targetY;
                    moved = true;
                } else {
                    // Bumped into wall
                    moved = true; // Still counts as a turn
                    // Don't clear keysPressed here, allows holding direction against wall
                }
            }
        }

        // Clear movement keys ONLY if a successful move/map change/combat start occurred
        // This allows holding direction against walls/NPCs without clearing the key instantly
        if (moved) {
             // Check if the move was just bumping an NPC, if so, don't clear yet
             const npcAtTarget = npcs.find(n => n.x === Math.floor((player.x + moveX) / TILE_SIZE) && n.y === Math.floor((player.y + moveY) / TILE_SIZE));
             if (!npcAtTarget) { // If not bumping an NPC (or if move was successful)
                 keysPressed = {}; // Clear movement keys
             }
        }

        // --- Camera Update (only in overworld) ---
        const mapWidth = getMapCols() * TILE_SIZE;
        const mapHeight = getMapRows() * TILE_SIZE;
        let targetCameraX = player.x - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
        let targetCameraY = player.y - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;
        cameraX = Math.max(0, Math.min(targetCameraX, mapWidth - CANVAS_WIDTH));
        cameraY = Math.max(0, Math.min(targetCameraY, mapHeight - CANVAS_HEIGHT));
        cameraX = Math.floor(cameraX);
        cameraY = Math.floor(cameraY);

    } // End of overworld-specific update block


    // --- State Updates --- (Handle combat state)
    if (gameState === 'combat') {
        updateCombat(); // Handle combat logic
    }
    // Note: Dialogue state updates are primarily handled by input (advanceDialogue)
    // Note: Inventory state updates are primarily handled by input (toggleInventoryScreen)
    // Note: Trade state updates will be handled later
}

// Combat update logic (This is the correct one, called inside update())
function updateCombat() {
    // Check if combat has ended in combat.js
    if (isCombatEnded()) {
        console.log("Combat ended, returning to overworld.");
        gameState = 'overworld';
        // currentCombatEnemy is already nullified in combat.js
        return; // Stop further combat processing
    }

    // Handle Player Input for Combat Actions
    let playerAction = null;
    // Check keysPressed for combat actions
    if (keysPressed['a'] || keysPressed['A']) {
        playerAction = 'attack';
        delete keysPressed['a']; delete keysPressed['A']; // Consume key
    } else if (keysPressed['i'] || keysPressed['I']) {
        playerAction = 'item'; // Placeholder for Item
        delete keysPressed['i']; delete keysPressed['I']; // Consume key
    } else if (keysPressed['f'] || keysPressed['F']) {
        playerAction = 'flee'; // Placeholder for Flee
        delete keysPressed['f']; delete keysPressed['F']; // Consume key
    }
    // Add more actions later (Defend?)

    if (playerAction) {
        processPlayerAction(playerAction); // Let combat.js handle the action and turn flow
        // keysPressed = {}; // Don't clear all keys, just the one used
    }

    // Enemy turn logic is handled via setTimeout within combat.js's nextTurn()
}


function draw() {
    if (!gameRunning || !areAssetsLoaded()) return;

    // Clear the canvas
    ctx.fillStyle = '#333'; // Background color
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Draw based on Game State ---
    // Always draw the world first (map, entities) using camera offset
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    drawMap(ctx);
    drawEnemies(ctx);
    drawNpcs(ctx); // Draw NPCs
    drawPlayer(ctx);
    ctx.restore();

    // Overlay screens based on state (Combat, Dialogue/Inventory are HTML, Trade later)
    if (gameState === 'combat') {
        // Combat screen is drawn directly to canvas, no camera needed
        drawCombatScreen();
    } else if (gameState === 'dialogue') {
        // Dialogue box is an HTML element managed by ui.js, world is drawn behind.
        // Optional: Dim background
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        // ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (gameState === 'inventory') {
        // Inventory screen is an HTML element managed by ui.js, world is drawn behind.
        // Optional: Dim background
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        // ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (gameState === 'trade') {
         // drawTradeScreen(); // Draw trade UI (future)
         // For now, draw overworld (already done) and maybe a fixed trade box placeholder
        ctx.fillStyle = 'rgba(0, 0, 50, 0.8)';
        ctx.fillRect(50, CANVAS_HEIGHT - 150, CANVAS_WIDTH - 100, 130);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif'; // Use default font for placeholder
        ctx.textAlign = 'left';
        ctx.fillText("Trade placeholder...", 60, CANVAS_HEIGHT - 130);
    }
    // Overworld state doesn't need extra drawing here, world already drawn.


    // Always update the HTML UI container (unaffected by canvas translate)
    updateUI();
}

// Placeholder for drawing the combat screen
function drawCombatScreen() {
    // --- Draw Combat Background ---
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e'); // Dark blue at the top
    gradient.addColorStop(1, '#4a4a6e'); // Lighter purple/blue at the bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Set Combat Font ---
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P"'; // Use pixel font, adjust size
    ctx.textAlign = 'center';

    const enemy = getCurrentCombatEnemy(); // Get enemy details from combat.js

    if (enemy) {
        // --- Draw Enemy ---
        if (enemy.sprite && enemy.sprite.complete) {
            const enemyScale = 3.5; // Slightly larger
            const enemyX = CANVAS_WIDTH * 0.75; // Position more to the right
            const enemyY = CANVAS_HEIGHT * 0.4; // Position slightly lower
            ctx.drawImage(
                enemy.sprite,
                enemyX - (TILE_SIZE * enemyScale / 2),
                enemyY - (TILE_SIZE * enemyScale / 2),
                TILE_SIZE * enemyScale,
                TILE_SIZE * enemyScale
            );
            // Draw Enemy HP Bar (Improved Style)
            const hpBarWidth = 120;
            const hpBarHeight = 12;
            const hpBarX = enemyX - hpBarWidth / 2;
            const hpBarY = enemyY + (TILE_SIZE * enemyScale / 2) + 10;
            const currentHpWidth = Math.max(0, (enemy.hp / enemy.maxHp) * hpBarWidth);
            // Background
            ctx.fillStyle = '#555';
            ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            // HP Fill
            ctx.fillStyle = '#dc3545'; // Red
            ctx.fillRect(hpBarX, hpBarY, currentHpWidth, hpBarHeight);
            // Border
            ctx.strokeStyle = '#eee';
            ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

            // Display enemy name, level, and HP (Adjusted position)
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Lvl ${enemy.level} ${enemy.type}`, enemyX, enemyY - (TILE_SIZE * enemyScale / 2) - 20); // Name/Level above sprite
            ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, enemyX, hpBarY + hpBarHeight + 15); // HP below bar
        } else {
             ctx.fillText(`Loading Lvl ${enemy.level} ${enemy.type}...`, CANVAS_WIDTH * 0.75, CANVAS_HEIGHT * 0.4);
        }

         // --- Draw Player ---
         if (player.sprite && player.sprite.complete) {
            const playerScale = 3; // Slightly larger
            const playerX = CANVAS_WIDTH * 0.25; // Position more to the left
            const playerY = CANVAS_HEIGHT * 0.65; // Position slightly lower
            ctx.drawImage(
                playerSprites.back, // Show player's back in combat
                playerX - (TILE_SIZE * playerScale / 2),
                playerY - (TILE_SIZE * playerScale / 2),
                TILE_SIZE * playerScale,
                TILE_SIZE * playerScale
            );
             // Player HP is shown in the main UI panel, but maybe draw name?
             ctx.fillStyle = 'white';
             ctx.textAlign = 'center';
             ctx.fillText("Nazuna", playerX, playerY + (TILE_SIZE * playerScale / 2) + 15);
        }

        // --- Draw Combat Menu (Improved Layout) ---
        const menuX = CANVAS_WIDTH / 2;
        const menuY = CANVAS_HEIGHT - 60;
        const menuSpacing = 25;
        ctx.textAlign = 'center';
        ctx.fillText(`ACTIONS`, menuX, menuY - menuSpacing);
        ctx.fillText(`(A)ttack`, menuX, menuY);
        ctx.fillText(`(I)tem`, menuX, menuY + menuSpacing);
        ctx.fillText(`(F)lee`, menuX, menuY + menuSpacing * 2);

        // --- Draw Combat Log (Top Area) ---
        const logMessages = getCombatLog();
        ctx.textAlign = 'center';
        ctx.font = '10px "Press Start 2P"'; // Smaller font for log
        let logY = 30; // Start log higher up
        const logLineHeight = 15;
        logMessages.forEach(msg => {
            ctx.fillText(msg, CANVAS_WIDTH / 2, logY);
            logY += logLineHeight;
        });


    } else if (isCombatEnded()) {
         // Handle display after combat ends but before returning to overworld if needed
         ctx.font = '16px "Press Start 2P"';
         ctx.fillText(`Combat Over!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
         // Could add a small delay here before game.js switches state back
    } else {
         ctx.font = '16px "Press Start 2P"';
         ctx.fillText(`Starting Combat...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}


function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();

    requestAnimationFrame(gameLoop); // Keep the loop running
}

// --- Start Game ---
// Wait for both assets AND player data readiness before initializing
console.log("Waiting for assets and player data...");
Promise.all([
    new Promise(resolve => onAssetsLoaded(resolve)), // Wrap asset loading in a promise
    playerDataReadyPromise // Wait for the signal from auth.js
]).then(() => {
    console.log("Assets loaded and player data ready. Initializing game.");
    initializeGame(); // Initialize game only after both are ready
}).catch(error => {
    console.error("Error during initialization:", error);
    // Handle initialization error (e.g., show an error message)
});
