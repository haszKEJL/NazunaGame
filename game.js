import { TILE_SIZE, TILE_FLOOR, TILE_CITY_ENTRANCE, TILE_DOOR, TILE_DUNGEON_ENTRANCE } from './config.js'; // Added TILE_DUNGEON_ENTRANCE
import { onAssetsLoaded, areAssetsLoaded, playerSprites } from './assets.js';
import { isWalkable, getTileAt, findNearestWalkableTile } from './utils.js'; // Added findNearestWalkableTile
import {
    drawMap,
    getCurrentMap,
    getMapCols,
    getMapRows,
    changeMap,
    getCurrentMapId,
    getDefaultStartCoords // Import the new function
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
let lastMoveTime = 0; // Track the time of the last successful move or attempt
const MOVE_COOLDOWN = 150; // Milliseconds between moves

// --- Camera State ---
let cameraX = 0;
let cameraY = 0;

// --- Initialization ---
// We need to ensure both assets are loaded AND player data is initialized
// before starting the main game logic.
let assetsAreLoaded = false;
let playerDataInitialized = false;
function initializeGame() {
    console.log("[DEBUG] initializeGame: Function started."); // ADDED LOG
    // Initialize player's derived stats based on core stats BEFORE placing them
    // Initialize player's derived stats based on core stats
    // Note: initializePlayerFromData (called on login/refresh) already handles loading stats,
    // position, and setting player.loadedMapId. initializePlayerStats is a fallback.
    if (!player.loadedMapId) { // Check if data was loaded (set by initializePlayerFromData)
        console.log("No loaded map ID found, initializing default stats.");
        initializePlayerStats(); // Initialize default stats if no data loaded
    }

    const initialMapId = player.loadedMapId || 'world'; // Use loaded map ID or default

    // --- Set Player Coordinates ---
    // 1. Get default coordinates for the target map first.
    const defaultCoords = getDefaultStartCoords(initialMapId);
    player.x = defaultCoords.x;
    player.y = defaultCoords.y;
    console.log(`[DEBUG] initializeGame: Initial default coordinates set to (${player.x}, ${player.y}) for map ${initialMapId}.`);

    // 2. Try to overwrite with loaded coordinates ONLY if they are valid numbers.
    //    (player.x and player.y might have been set to undefined or valid numbers by initializePlayerFromData)
    const loadedX = player.x; // Temporarily store value potentially set by initializePlayerFromData
    const loadedY = player.y;

    if (typeof loadedX === 'number' && typeof loadedY === 'number' && !isNaN(loadedX) && !isNaN(loadedY) && loadedX >= 0 && loadedY >= 0) {
        // If initializePlayerFromData set valid numbers, keep them.
         console.log(`[DEBUG] initializeGame: Using valid loaded/existing coordinates (${loadedX}, ${loadedY})`);
         // No change needed, player.x/y already hold the loaded values if they were valid
    } else {
        // If loaded coords were invalid (undefined, NaN, negative), stick with the defaults already set.
        console.warn(`Invalid or missing loaded coordinates detected (${loadedX}, ${loadedY}). Using default coordinates (${player.x}, ${player.y}).`);
        // Ensure player.x/y still hold the defaultCoords values set above.
        player.x = defaultCoords.x;
        player.y = defaultCoords.y;
    }
    // --- End Set Player Coordinates ---

    console.log(`[DEBUG] initializeGame: Proceeding with map setup. Final player start coords: (${player.x}, ${player.y})`);

    // --- Ensure Player Starts on Walkable Tile ---
    const startTileX = Math.floor(player.x / TILE_SIZE);
    const startTileY = Math.floor(player.y / TILE_SIZE);
    const currentMap = getCurrentMap(); // Get map data *before* potentially changing it
    const mapCols = getMapCols();
    const mapRows = getMapRows();

    if (!isWalkable(startTileX, startTileY, currentMap, mapCols, mapRows)) {
        console.warn(`Player initial position (${startTileX}, ${startTileY}) is not walkable. Finding nearest walkable tile...`);
        const nearestWalkable = findNearestWalkableTile(startTileX, startTileY, currentMap, mapCols, mapRows);
        if (nearestWalkable) {
            player.x = nearestWalkable.x * TILE_SIZE;
            player.y = nearestWalkable.y * TILE_SIZE;
            console.log(`Player moved to nearest walkable tile: (${nearestWalkable.x}, ${nearestWalkable.y}) -> Pixel coords: (${player.x}, ${player.y})`);
        } else {
            console.error("CRITICAL: Could not find any walkable tile near player start! Halting initialization.");
            return; // Stop initialization if no walkable tile found
        }
    }
    // --- End Ensure Player Starts on Walkable Tile ---

    try {
        changeMap(initialMapId); // Change map data *after* coords are set and validated
        console.log("[DEBUG] initializeGame: changeMap finished."); // ADDED LOG

        // Spawn entities for the initial map (needs to happen *after* changeMap sets currentMapId)
        spawnEnemiesForMap(getCurrentMapId()); // Spawn enemies for the current map
        console.log("[DEBUG] initializeGame: spawnEnemiesForMap finished."); // ADDED LOG
        spawnNpcsForMap(getCurrentMapId()); // Spawn initial NPCs
        console.log("[DEBUG] initializeGame: spawnNpcsForMap finished."); // ADDED LOG
        setupInputHandlers();
        console.log("[DEBUG] initializeGame: setupInputHandlers finished."); // ADDED LOG
        canvas.focus(); // Explicitly focus the canvas
        console.log("[DEBUG] initializeGame: Canvas focused."); // ADDED LOG
        gameRunning = true;
        console.log("[DEBUG] initializeGame: gameRunning set to true."); // ADDED LOG
        console.log("Game initialized. Starting loop...");
    } catch (error) {
        console.error("[CRITICAL] Error during initializeGame sequence:", error); // ADDED ERROR CATCH
        // Optionally, display an error message to the user on the screen/UI
        return; // Prevent starting the game loop if initialization failed critically
    }
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

    // --- Initial Camera Position ---
    // Calculate initial camera position immediately after setting player coords
    // to avoid seeing the player at (0,0) relative to viewport on the first frame.
    const mapWidth = getMapCols() * TILE_SIZE;
    const mapHeight = getMapRows() * TILE_SIZE;
    let targetCameraX = player.x - CANVAS_WIDTH / 2 + TILE_SIZE / 2;
    let targetCameraY = player.y - CANVAS_HEIGHT / 2 + TILE_SIZE / 2;
    cameraX = Math.max(0, Math.min(targetCameraX, mapWidth - CANVAS_WIDTH));
    cameraY = Math.max(0, Math.min(targetCameraY, mapHeight - CANVAS_HEIGHT));
    cameraX = Math.floor(cameraX);
    cameraY = Math.floor(cameraY);
    console.log(`[DEBUG] initializeGame: Initial camera set to (${cameraX}, ${cameraY})`);
    // --- End Initial Camera Position ---
}

// --- Input Handling ---
function setupInputHandlers() {
    // Attach listeners only to the window for global input handling
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    console.log("Input handlers attached to window.");
}

function handleKeyDown(e) {
    // console.log(`--- Keydown event fired on window: ${e.key} ---`); // Less verbose log
    // Prevent default browser actions for keys we handle (like Tab, Space)
    if (['Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    // Only add keys needed for continuous press checks (movement, maybe combat actions)
    // Convert WASD to lowercase for consistent checking
    const key = e.key.toLowerCase();
    if (gameState === 'overworld' && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
         // console.log(`[DEBUG] Adding key to keysPressed: ${key}`); // Reduce noise
         keysPressed[key] = true;
    } else if (gameState === 'combat' && ['a', 'i', 'f'].includes(key)) { // Check lowercase combat keys
         // Add combat keys to check in updateCombat if needed, though keyup might be sufficient
         keysPressed[e.key] = true;
    }
}

function handleKeyUp(e) {
    // Convert key to lowercase for consistent checking
    const key = e.key.toLowerCase();
    // console.log(`[DEBUG] Keyup detected on window: ${key}, Current gameState: ${gameState}`); // Less verbose log

    // --- Inventory Toggle (Simplified) ---
    if (key === 'tab' || (gameState === 'inventory' && key === 'escape')) {
        console.log("[DEBUG] Toggling inventory via Tab/Escape."); // DIAGNOSTIC LOG
        e.preventDefault();
        toggleInventoryScreen();
    }
    // --- Other Single-Press Actions based on State ---
    else if (gameState === 'overworld') {
        if (key === 'h') { // Check lowercase 'h'
            useItem('Health Potion');
        // REMOVED 'E' key binding for equip
        } else if (key === ' ' || key === 'enter') { // Check lowercase 'enter'
            attemptInteraction();
        } else if (key === 'p') { // Check lowercase 'p'
            if (player.statPoints > 0) {
                openStatModal();
            } else {
                console.log("No stat points to allocate.");
            }
         }
    } else if (gameState === 'dialogue') {
         if (key === ' ' || key === 'enter') { // Check lowercase
             advanceDialogue();
         }
    }
    // Combat keyup is handled below

    // --- Clear specific key on keyup ---
    // This handles removing movement and combat action keys when released
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'i', 'f'].includes(key)) {
         delete keysPressed[key];
    }
    // Special case for combat 'a' (attack) - might need different handling if actions are queued
    if (gameState === 'combat' && key === 'a') {
        delete keysPressed[key];
    }
    // if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'a', 'A', 'i', 'I', 'f', 'F'].includes(e.key)) {
    //     delete keysPressed[e.key];
    // }
}

// --- Inventory Toggle ---
function toggleInventoryScreen() {
    if (gameState === 'overworld') {
        gameState = 'inventory';
        console.log("GAME: Player inventory before showing UI:", JSON.stringify(player.inventory)); // Log inventory state
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
    if (!gameRunning) {
        // console.log("Update skipped: gameRunning is false"); // Reduce noise
        return;
    }

    // Log state at start of update
    //console.log(`Update start: gameState=${gameState}, player=(${player.x}, ${player.y}), camera=(${cameraX}, ${cameraY}), keys=`, keysPressed); // Log keysPressed

    // Only process movement/world/camera updates if in overworld
    if (gameState === 'overworld') {
        // Handle player movement
        let moved = false;
        let targetX = player.x;
        let targetY = player.y;
        let attemptedMove = false;
        let moveX = 0;
        let moveY = 0;

        // Check WASD first, then Arrows as fallback/alternative
        if (keysPressed['w'] || keysPressed['arrowup']) {
            moveY = -TILE_SIZE;
            player.sprite = playerSprites.back;
            attemptedMove = true;
        } else if (keysPressed['s'] || keysPressed['arrowdown']) {
            moveY = TILE_SIZE;
            player.sprite = playerSprites.front;
            attemptedMove = true;
        } else if (keysPressed['a'] || keysPressed['arrowleft']) {
            moveX = -TILE_SIZE;
            player.sprite = playerSprites.left;
            attemptedMove = true;
        } else if (keysPressed['d'] || keysPressed['arrowright']) {
            moveX = TILE_SIZE;
            player.sprite = playerSprites.right;
            attemptedMove = true;
        }

        // Check movement cooldown *before* calculating target coordinates
        const now = Date.now();
        if (attemptedMove && (now - lastMoveTime > MOVE_COOLDOWN)) {
            // Calculate target pixel coordinates
            targetX = player.x + moveX;
            targetY = player.y + moveY;

            // Calculate target tile coordinates for collision/interaction checks
            const targetTileX = Math.floor(targetX / TILE_SIZE);
            const targetTileY = Math.floor(targetY / TILE_SIZE);
            const targetTileType = getTileAt(targetTileX, targetTileY, getCurrentMap());

            // Check for map transitions first
            const currentMapId = getCurrentMapId();
            let mapChanged = false;
            let newMapId = null;
            let newPlayerCoords = null;

            // Check for map transitions first
            if (currentMapId === 'world') {
                if (targetTileType === TILE_CITY_ENTRANCE) {
                    newMapId = 'city';
                    newPlayerCoords = getDefaultStartCoords(newMapId); // Get default start for city
                } else if (targetTileType === TILE_DUNGEON_ENTRANCE) {
                    newMapId = 'dungeon';
                    newPlayerCoords = getDefaultStartCoords(newMapId); // Get default start for dungeon
                }
            } else if (currentMapId === 'city' && targetTileType === TILE_DOOR && targetTileY === getMapRows() - 1) {
                newMapId = 'world';
                // TODO: Ideally, place player near the city entrance they just exited from.
                // For now, use default world start.
                newPlayerCoords = getDefaultStartCoords(newMapId);
            } else if (currentMapId === 'dungeon') {
                // TODO: Add logic to exit dungeon later, potentially finding the entrance tile
                // if (targetTileType === TILE_FLOOR && targetTileX === 1 && targetTileY === 0) { // Example exit condition
                // Check for dungeon exit at specific coordinates (12, 1)
                if (targetTileX === 12 && targetTileY === 1) {
                    console.log("Player reached dungeon exit tile (12, 1).");
                    newMapId = 'world';
                    // Find dungeon entrance on world map to place player nearby
                    const worldMapData = largeWorldMap; // Need access to the world map definition
                    let entranceCoords = null;
                    for (let y = 0; y < worldMapData.length; y++) {
                        const x = worldMapData[y].indexOf(TILE_DUNGEON_ENTRANCE);
                        if (x !== -1) {
                            entranceCoords = { x, y };
                            break;
                        }
                    }
                    if (entranceCoords) {
                        // Place player one tile below the entrance
                        newPlayerCoords = { x: entranceCoords.x * TILE_SIZE, y: (entranceCoords.y + 1) * TILE_SIZE };
                        console.log(`Found dungeon entrance at (${entranceCoords.x}, ${entranceCoords.y}). Placing player at (${newPlayerCoords.x}, ${newPlayerCoords.y})`);
                    } else {
                        console.warn("Could not find dungeon entrance on world map! Using default world start.");
                        newPlayerCoords = getDefaultStartCoords(newMapId); // Fallback
                    }
                }
            }

            // If a transition was triggered, update player coords and change map
            if (newMapId && newPlayerCoords) {
                console.log(`Transitioning to map ${newMapId}. New coords: (${newPlayerCoords.x}, ${newPlayerCoords.y})`);
                player.x = newPlayerCoords.x;
                player.y = newPlayerCoords.y;
                changeMap(newMapId); // Change map data FIRST
                mapChanged = true;

                // --- Ensure Player Lands on Walkable Tile After Transition ---
                const newMapData = getCurrentMap();
                const newMapCols = getMapCols();
                const newMapRows = getMapRows();
                const landTileX = Math.floor(player.x / TILE_SIZE);
                const landTileY = Math.floor(player.y / TILE_SIZE);

                if (!isWalkable(landTileX, landTileY, newMapData, newMapCols, newMapRows)) {
                    console.warn(`Player landed on non-walkable tile (${landTileX}, ${landTileY}) after map transition. Finding nearest...`);
                    const nearestWalkable = findNearestWalkableTile(landTileX, landTileY, newMapData, newMapCols, newMapRows);
                    if (nearestWalkable) {
                        player.x = nearestWalkable.x * TILE_SIZE;
                        player.y = nearestWalkable.y * TILE_SIZE;
                        console.log(`Player moved to nearest walkable tile after transition: (${nearestWalkable.x}, ${nearestWalkable.y}) -> Pixel coords: (${player.x}, ${player.y})`);
                    } else {
                         console.error(`CRITICAL: Could not find walkable tile after transition to ${newMapId}! Player might be stuck.`);
                         // Consider alternative fallback? For now, log error.
                    }
                }
                // --- End Ensure Walkable After Transition ---

                // Clear and respawn entities for the new map
                clearEnemies();
                clearNpcs();
                spawnEnemiesForMap(getCurrentMapId()); // Use the *new* currentMapId
                spawnNpcsForMap(getCurrentMapId());
                    moved = true; // Count map change as a move
                    lastMoveTime = now; // Update last move time on successful transition
            } else {
                // No map transition, check for combat/NPC/walkable
                // Check for enemy at the PLAYER'S TARGET tile location by comparing player's target tile coords with enemy's tile coords
                console.log(`GAME: Checking collision at target tile (${targetTileX}, ${targetTileY}). Enemies present:`, JSON.stringify(enemies.map(e => ({ type: e.type, x: e.x, y: e.y })))); // Log target and enemy coords
                const enemyAtTarget = enemies.find(e => e.x === targetTileX && e.y === targetTileY);
                const npcAtTarget = npcs.find(n => Math.floor(n.x / TILE_SIZE) === targetTileX && Math.floor(n.y / TILE_SIZE) === targetTileY);

                if (enemyAtTarget) {
                    console.log(`Player encountered ${enemyAtTarget.type}!`);
                    gameState = 'combat';
                    startCombat(enemyAtTarget);
                    moved = true; // Bump counts as move/action
                    lastMoveTime = now; // Update last move time on starting combat
                    keysPressed = {}; // Clear movement keys on combat start
                } else if (npcAtTarget) {
                     // Bumped into NPC, counts as an action but no movement
                     console.log(`Bumped into ${npcAtTarget.name}`);
                     moved = true; // Still counts as a turn
                     lastMoveTime = now; // Update last move time even on NPC bump
                     // Don't clear keysPressed here, interaction needs Space/Enter keyup
                } else if (isWalkable(targetTileX, targetTileY, getCurrentMap(), getMapCols(), getMapRows())) {
                    player.x = targetX;
                    player.y = targetY;
                    moved = true;
                    lastMoveTime = now; // Update last move time on successful move
                } else {
                    // Bumped into wall
                    moved = true; // Still counts as a turn
                    lastMoveTime = now; // Update last move time on wall bump
                    // Don't clear keysPressed here, allows holding direction against wall
                }
            }
        } // End of cooldown check block
        // Removed duplicated block here

        // Clear movement keys ONLY if combat starts
        // Let keyup handle removing keys for normal movement stop
        if (moved && gameState === 'combat') { // Only clear all keys if combat started
            keysPressed = {};
        }
        // REMOVED the general keysPressed = {} clear after successful move.

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

    // Log state at end of update, before draw uses it
    //console.log(`Update end: gameState=${gameState}, player=(${player.x}, ${player.y}), camera=(${cameraX}, ${cameraY}), gameRunning=${gameRunning}`); // UNCOMMENTED
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

    // Handle Player Input for Combat Actions (Check lowercase keys)
    let playerAction = null;
    if (keysPressed['a']) {
        playerAction = 'attack';
        delete keysPressed['a']; // Consume key
    } else if (keysPressed['i']) {
        playerAction = 'item'; // Placeholder for Item
        delete keysPressed['i']; // Consume key
    } else if (keysPressed['f']) {
        playerAction = 'flee'; // Placeholder for Flee
        delete keysPressed['f']; // Consume key
    }
    // Add more actions later (Defend?)

    if (playerAction) {
        processPlayerAction(playerAction); // Let combat.js handle the action and turn flow
        // keysPressed = {}; // Don't clear all keys, just the one used
    }

    // Enemy turn logic is handled via setTimeout within combat.js's nextTurn()
}


function draw() {
    // Use local flags set by initialization logic
    if (!gameRunning || !assetsAreLoaded || !playerDataInitialized) {
         // console.log(`Draw skipped: gameRunning=${gameRunning}, assetsAreLoaded=${assetsAreLoaded}, playerDataInitialized=${playerDataInitialized}`); // Optional detailed log
        return;
    }
    // If we get here, all flags are true.
    //console.log("Draw function proceeding..."); // UNCOMMENTED

    // Clear the canvas
    ctx.fillStyle = '#333'; // Background color
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Draw based on Game State ---
    // Always draw the world first (map, entities) using camera offset
    ctx.save(); // Save camera state
    ctx.translate(-cameraX, -cameraY); // Apply camera translation
    drawMap(ctx);
    drawEnemies(ctx);
    drawNpcs(ctx); // Draw NPCs
    drawPlayer(ctx);
    ctx.restore(); // Restore camera state

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

    // --- Simple Drawing Test (Outside save/restore) ---
    ctx.fillStyle = 'yellow';
    ctx.fillRect(10, 10, 50, 50); // Draw a yellow square at top-left
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(`State: ${gameState}`, 15, 30);
    ctx.fillText(`Coords: ${player.x},${player.y}`, 15, 50);

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
    // console.log("[DEBUG] gameLoop tick."); // ADDED LOG (Can be noisy)
    // Add a check here too, just in case gameRunning is modified between frames somehow
    if (!gameRunning) {
        console.log("Game loop stopping: gameRunning became false.");
        return;
    }
    try {
        update();
    } catch (error) {
        console.error("Error during game update:", error);
        gameRunning = false; // Stop the loop on error
        // Optionally display error to user
        return;
    }
    try {
        draw();
    } catch (error) {
        console.error("Error during game draw:", error);
        gameRunning = false; // Stop the loop on error
        // Optionally display error to user
        return;
    }
    draw();

    requestAnimationFrame(gameLoop); // Keep the loop running
}

// --- Start Game Logic ---
function attemptGameInitialization() {
    console.log(`[DEBUG] attemptGameInitialization called. assetsAreLoaded=${assetsAreLoaded}, playerDataInitialized=${playerDataInitialized}`); // ADDED LOG
    if (assetsAreLoaded && playerDataInitialized) {
        console.log("Assets loaded and player data initialized. Starting game.");
        initializeGame(); // Initialize game only after both are ready
    } else {
        console.log(`Waiting: Assets Loaded=${assetsAreLoaded}, Player Data Initialized=${playerDataInitialized}`);
    }
}

// Listen for asset loading completion
console.log("Waiting for assets...");
onAssetsLoaded(() => {
    console.log("Assets finished loading.");
    assetsAreLoaded = true;
    attemptGameInitialization(); // Try to initialize after assets load
});

// Listen for the player data ready event from auth.js
console.log("Waiting for player data ready signal...");
document.addEventListener('playerDataReady', () => {
    console.log("Received playerDataReady event.");
    try {
        const storedData = localStorage.getItem('initialPlayerData');
        if (storedData) {
            const initialData = JSON.parse(storedData);
            console.log("[DEBUG] Calling initializePlayerFromData with stored data..."); // ADDED LOG
            initializePlayerFromData(initialData); // Use the imported function
            console.log("[DEBUG] initializePlayerFromData finished."); // ADDED LOG
            localStorage.removeItem('initialPlayerData'); // Clean up storage
        } else {
            console.log("No initial player data found in storage, using defaults.");
            console.log("[DEBUG] Calling initializePlayerFromData with null..."); // ADDED LOG
            initializePlayerFromData(null); // Explicitly pass null
            console.log("[DEBUG] initializePlayerFromData finished (with null)."); // ADDED LOG
        }
        playerDataInitialized = true;
        console.log("[DEBUG] playerDataInitialized set to true."); // ADDED LOG
    } catch (error) {
        console.error("Error processing initial player data:", error);
        // Handle error, maybe proceed with defaults? Or halt?
        // For now, let's still try to initialize to see if defaults work
        console.log("[DEBUG] Error occurred, calling initializePlayerFromData with null as fallback..."); // ADDED LOG
        initializePlayerFromData(null);
        console.log("[DEBUG] initializePlayerFromData finished (after error)."); // ADDED LOG
        playerDataInitialized = true; // Mark as initialized even on error to proceed
        console.log("[DEBUG] playerDataInitialized set to true (after error)."); // ADDED LOG
    }
    attemptGameInitialization(); // Try to initialize after player data is processed
});
