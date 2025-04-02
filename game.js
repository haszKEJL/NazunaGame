import { TILE_SIZE, TILE_FLOOR, TILE_CITY_ENTRANCE, TILE_DOOR, TILE_DUNGEON_ENTRANCE, TILE_DUNGEON_EXIT } from './config.js'; // Added TILE_DUNGEON_ENTRANCE and TILE_DUNGEON_EXIT
import { onAssetsLoaded, areAssetsLoaded, playerSprites, combatBackground } from './assets.js'; // Added combatBackground import
import { isWalkable, getTileAt, findNearestWalkableTile } from './utils.js'; // Added findNearestWalkableTile
import {
    drawMap,
    getCurrentMap,
    getMapCols,
    getMapRows,
    changeMap,
    getCurrentMapId,
    getDefaultStartCoords, // Import the new function
    largeWorldMap // Import the world map data
} from './map.js';
// Import savePlayerData from player.js
import { player, drawPlayer, useItem, equipFirstAvailableItem, initializePlayerStats, savePlayerData, initializePlayerFromData } from './player.js';
// Import updateEnemiesFromServer and removeEnemy
import { enemies, drawEnemies, clearEnemies, updateEnemiesFromServer, removeEnemy } from './enemy.js';
import { npcs, drawNpcs, clearNpcs, spawnNpcsForMap, getNpcAt } from './npc.js'; // Import NPC functions
import {
    startCombat,
    processPlayerAction,
    // isCombatEnded, // Replaced by getCombatResult
    getCombatResult, // Import the new function
    getCurrentCombatEnemy,
    getCombatLog,
    // Import animation state from combat.js
    isAnimating,
    animatingCharacter,
    animationProgress, // Keep for drawing, but don't modify directly
    updateAnimationProgress, // Import the new function
    nextTurn, // Import nextTurn to call it after animation
    ACTION_RESULT // Import the action result constants
} from './combat.js';
// Import dialogue and inventory functions from ui.js
import {
    updateUI, openStatModal,
    showDialogue, hideDialogue, updateDialogueContent,
    showInventory, hideInventory // Add inventory functions (will be added to ui.js)
} from './ui.js';
import './auth.js'; // Import auth.js to handle login/register
// Socket.IO client library is now loaded globally via index.html

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

// --- Network State ---
let socket = null; // Socket.IO instance
let otherPlayers = {}; // Store data about other connected players { id: { x, y, sprite, name, ... } }

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
        // REMOVED: spawnEnemiesForMap(getCurrentMapId()); // Enemies are now spawned by the server
        // console.log("[DEBUG] initializeGame: spawnEnemiesForMap finished."); // ADDED LOG
        spawnNpcsForMap(getCurrentMapId()); // Spawn initial NPCs (Keep NPCs client-side for now)
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
    } else if (gameState === 'combat' && ['1', '2', '3'].includes(key)) { // Check for 1, 2, 3 in combat
         // Add combat keys to check in updateCombat if needed, though keyup might be sufficient
         keysPressed[key] = true; // Use the actual key ('1', '2', '3')
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
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', '1', '2', '3'].includes(key)) { // Updated combat keys
         delete keysPressed[key];
    }
    // Special case for combat '1' (attack) - might need different handling if actions are queued
    if (gameState === 'combat' && key === '1') {
        delete keysPressed[key];
    }
    // if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3'].includes(e.key)) { // Updated combat keys
    //     delete keysPressed[e.key]; // This general delete might be too broad, stick to specific keys
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
        let newDirection = player.direction; // Keep current direction if no key pressed
        if (keysPressed['w'] || keysPressed['arrowup']) {
            moveY = -TILE_SIZE;
            player.sprite = playerSprites.back;
            newDirection = 'back';
            attemptedMove = true;
        } else if (keysPressed['s'] || keysPressed['arrowdown']) {
            moveY = TILE_SIZE;
            player.sprite = playerSprites.front;
            newDirection = 'front';
            attemptedMove = true;
        } else if (keysPressed['a'] || keysPressed['arrowleft']) {
            moveX = -TILE_SIZE;
            player.sprite = playerSprites.left;
            newDirection = 'left';
            attemptedMove = true;
        } else if (keysPressed['d'] || keysPressed['arrowright']) {
            moveX = TILE_SIZE;
            player.sprite = playerSprites.right;
            newDirection = 'right';
            attemptedMove = true;
        }
        player.direction = newDirection; // Update player direction state

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
                // Check for dungeon exit using the defined tile type
                if (targetTileType === TILE_DUNGEON_EXIT) {
                    console.log("Player reached dungeon exit tile (TILE_DUNGEON_EXIT).");
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
                // --- Notify Server of Map Change ---
                if (socket && socket.connected) {
                    socket.emit('changeMap', newMapId);
                    console.log(`Emitted changeMap event for map: ${newMapId}`);
                    otherPlayers = {}; // Clear other players locally immediately after changing map
                }
                // --- End Notify Server ---
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
                clearEnemies(); // Clear local enemies before server sends new list
                clearNpcs();
                // REMOVED: spawnEnemiesForMap(getCurrentMapId()); // Server will send enemy list via 'currentEnemies' event
                spawnNpcsForMap(getCurrentMapId()); // Keep spawning NPCs client-side
                moved = true; // Count map change as a move
                lastMoveTime = now; // Update last move time on successful transition
                savePlayerData(); // Save after successful map transition
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
                    // --- Emit Movement ---
                    if (socket && socket.connected) {
                        // Send direction string instead of sprite object
                        socket.emit('playerMove', { x: player.x, y: player.y, direction: player.direction });
                    }
                    // --- End Emit Movement ---
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
    // Check combat result from combat.js
    const result = getCombatResult();
    if (result.ended) {
        console.log(`Combat ended. Reason: ${result.reason}. Returning to overworld.`);
        // --- Emit event on victory ---
        if (result.reason === 'victory' && result.defeatedEnemyId && socket && socket.connected) {
            console.log(`Emitting enemyDefeated for ID: ${result.defeatedEnemyId}`);
            socket.emit('enemyDefeated', { enemyId: result.defeatedEnemyId, mapId: getCurrentMapId() });
        }
        // --- End Emit ---
        gameState = 'overworld';
        // currentCombatEnemy is already nullified in combat.js
        return; // Stop further combat processing
    }

    // Handle Animation Progression
    if (isAnimating) {
        const animationFinished = updateAnimationProgress(); // Call the function from combat.js
        if (animationFinished) {
            // Animation finished, now proceed with the next turn
            nextTurn(); // Call nextTurn from combat.js
        }
        return; // Don't process input while animating (whether finished this frame or not)
    }

    // Handle Player Input for Combat Actions (Check 1, 2, 3 keys) - Only if not animating
    let playerAction = null;
    if (keysPressed['1']) {
        playerAction = 'attack';
        delete keysPressed['1']; // Consume key
    } else if (keysPressed['2']) {
        playerAction = 'item'; // Placeholder for Item
        delete keysPressed['2']; // Consume key
    } else if (keysPressed['3']) {
        playerAction = 'flee'; // Placeholder for Flee
        delete keysPressed['3']; // Consume key
    }
    // Add more actions later (Defend?)

    if (playerAction) {
        const result = processPlayerAction(playerAction); // Get the result status

        // Decide whether to proceed the turn based on the result
        // We proceed the turn if the action was successful (with or without animation)
        // AND the combat didn't end as a direct result of the action (like flee success or killing blow).
        // Note: Animation completion handles its own nextTurn call.
        if (result === ACTION_RESULT.SUCCESS_NO_ANIMATION) {
            // Action succeeded without animation (e.g., item use, failed flee)
            // Proceed to the next turn immediately
            nextTurn();
        }
        // If result is SUCCESS_ANIMATING, we wait for animation to finish.
        // If result is FAILED, we don't proceed the turn (playerActionSelected is reset in combat.js).
        // If result is ENDED_COMBAT, the combat loop will terminate anyway.
    }

    // Enemy turn logic is now handled via nextTurn() either after animation completes
    // or immediately after a non-animated successful player action.
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
    drawOtherPlayers(ctx); // Draw other players
    drawPlayer(ctx); // Draw local player last (on top)
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

}

// Placeholder for drawing the combat screen
function drawCombatScreen() {
    // --- Draw Combat Background ---
    if (combatBackground.complete && combatBackground.naturalWidth > 0) {
        // Draw the image, scaling it to fit the canvas
        ctx.drawImage(combatBackground, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
        // Fallback gradient if image not loaded or invalid
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e'); // Dark blue at the top
        gradient.addColorStop(1, '#4a4a6e'); // Lighter purple/blue at the bottom
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // --- Set Combat Font ---
    ctx.fillStyle = 'white';
    ctx.font = '12px "Press Start 2P"'; // Use pixel font, adjust size
    ctx.textAlign = 'center';

    const enemy = getCurrentCombatEnemy(); // Get enemy details from combat.js

    if (enemy) {
        // --- Animation Calculations ---
        let playerOffsetX = 0;
        let playerOffsetY = 0;
        let enemyOffsetX = 0;
        let enemyOffsetY = 0;
        const moveDistance = 20; // How far the sprite moves

        if (isAnimating) {
            // Calculate the forward/backward movement based on progress
            // Uses Math.sin for a simple ease-in/ease-out effect (moves forward then back)
            const moveAmount = Math.sin(animationProgress * Math.PI) * moveDistance;

            if (animatingCharacter === 'player') {
                playerOffsetX = moveAmount; // Player moves right
            } else if (animatingCharacter === 'enemy') {
                enemyOffsetX = -moveAmount; // Enemy moves left
            }
        }

        // --- Draw Enemy ---
        if (enemy.sprite && enemy.sprite.complete) {
            const enemyScale = 3.5; // Slightly larger
            const enemyBaseX = CANVAS_WIDTH * 0.75; // Position more to the right
            const enemyBaseY = CANVAS_HEIGHT * 0.4; // Position slightly lower
            ctx.drawImage(
                enemy.sprite,
                enemyBaseX - (TILE_SIZE * enemyScale / 2) + enemyOffsetX, // Apply offset
                enemyBaseY - (TILE_SIZE * enemyScale / 2) + enemyOffsetY, // Apply offset
                TILE_SIZE * enemyScale,
                TILE_SIZE * enemyScale
            );
            // Draw Enemy HP Bar (Improved Style) - Position relative to base position
            const hpBarWidth = 120;
            const hpBarHeight = 12;
            const hpBarX = enemyBaseX - hpBarWidth / 2;
            const hpBarY = enemyBaseY + (TILE_SIZE * enemyScale / 2) + 10;
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

            // Display enemy name, level, and HP (Adjusted position) - Relative to base position
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`Lvl ${enemy.level} ${enemy.type}`, enemyBaseX, enemyBaseY - (TILE_SIZE * enemyScale / 2) - 20); // Name/Level above sprite
            ctx.fillText(`HP: ${enemy.hp}/${enemy.maxHp}`, enemyBaseX, hpBarY + hpBarHeight + 15); // HP below bar
        } else {
             ctx.fillText(`Loading Lvl ${enemy.level} ${enemy.type}...`, CANVAS_WIDTH * 0.75, CANVAS_HEIGHT * 0.4);
        }

         // --- Draw Player ---
         if (player.sprite && player.sprite.complete) {
            const playerScale = 3; // Slightly larger
            const playerBaseX = CANVAS_WIDTH * 0.25; // Position more to the left
            const playerBaseY = CANVAS_HEIGHT * 0.65; // Position slightly lower
            ctx.drawImage(
                playerSprites.back, // Show player's back in combat
                playerBaseX - (TILE_SIZE * playerScale / 2) + playerOffsetX, // Apply offset
                playerBaseY - (TILE_SIZE * playerScale / 2) + playerOffsetY, // Apply offset
                TILE_SIZE * playerScale,
                TILE_SIZE * playerScale
            );
             // Player HP is shown in the main UI panel, draw player name from player object
             ctx.fillStyle = 'white';
             ctx.textAlign = 'center';
             ctx.fillText(player.name || "Player", playerBaseX, playerBaseY + (TILE_SIZE * playerScale / 2) + 15); // Use player.name
        }

        // --- Draw Combat Menu (Improved Layout) ---
        const menuX = CANVAS_WIDTH / 2;
        const menuY = CANVAS_HEIGHT - 60;
        const menuSpacing = 25;
        ctx.textAlign = 'center';
        ctx.fillText(`ACTIONS`, menuX, menuY - menuSpacing);
        ctx.fillText(`(1) Attack`, menuX, menuY); // Updated key display
        ctx.fillText(`(2) Item`, menuX, menuY + menuSpacing); // Updated key display
        ctx.fillText(`(3) Flee`, menuX, menuY + menuSpacing * 2); // Updated key display

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

// --- Drawing Other Players ---
function drawOtherPlayers(ctx) {
    ctx.font = '10px "Press Start 2P"'; // Use pixel font for names
    ctx.textAlign = 'center';
    for (const id in otherPlayers) {
        const other = otherPlayers[id];
        // Select sprite based on the received direction string
        const direction = other.direction || 'front'; // Default to 'front' if direction is missing
        const spriteToDraw = playerSprites[direction]; // Get the correct Image object from assets.js

        if (spriteToDraw && spriteToDraw.complete && typeof other.x === 'number' && typeof other.y === 'number') {
            ctx.drawImage(
                spriteToDraw, // Use the sprite selected based on direction
                other.x,
                other.y,
                TILE_SIZE,
                TILE_SIZE
            );
            // Draw player name above them
            ctx.fillStyle = 'white'; // Ensure color is set each time
            ctx.fillText(other.name || `Player ${id.substring(0, 4)}`, other.x + TILE_SIZE / 2, other.y - 5);
        } else {
            // console.warn(`Could not draw player ${id}: Missing data or sprite not loaded`, other);
        }
    }
}

// --- Start Game Logic ---
// Original definition removed, the modified one below handles initialization.

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
    // This event should now ONLY fire after successful auth in auth.js
    console.log("Received playerDataReady event (implies successful auth).");
    try {
        const storedData = localStorage.getItem('initialPlayerData');
        if (storedData) {
            const initialData = JSON.parse(storedData);
            console.log("[DEBUG] Calling initializePlayerFromData with stored data...");
            initializePlayerFromData(initialData); // Initialize player with the data
            console.log("[DEBUG] initializePlayerFromData finished.");
            localStorage.removeItem('initialPlayerData'); // Clean up storage
            playerDataInitialized = true; // Set flag: Player data is ready
            console.log("[DEBUG] playerDataInitialized set to true.");
        } else {
            // This case should ideally not happen if auth.js only dispatches on success
            console.error("playerDataReady event received, but no initialPlayerData found in localStorage!");
            // Handle this potential inconsistency? Maybe show auth forms again?
            // For now, we won't set playerDataInitialized = true, preventing game start.
             playerDataInitialized = false;
             console.log("[DEBUG] playerDataInitialized set to false (missing stored data).");
        }
    } catch (error) {
        console.error("Error processing initial player data:", error);
        // If there's an error processing valid data, prevent game start
        playerDataInitialized = false;
        console.log("[DEBUG] playerDataInitialized set to false (error during processing).");
        // Optionally show an error message to the user
    }
    attemptGameInitialization(); // Try to initialize (will only succeed if assets are also loaded)
});

// --- Socket.IO Client Setup ---
function initializeSocketConnection() {
    // Connect to the server using the same origin as the page.
    // OnRender handles HTTPS termination and routing to the correct port.
    // io() without arguments defaults to the current origin.
    console.log(`Attempting to connect to Socket.IO server at origin: ${window.location.origin}`);
    socket = io(); // Connect to the origin the page was served from (handles HTTPS correctly on OnRender)

    socket.on('connect', () => {
        console.log('Connected to game server with ID:', socket.id);
        // Send initial player data to let server know we joined
        // Include name if available, otherwise server might assign one or use ID
        const joinData = {
            name: player.name || "AnonPlayer", // Get player name at the moment of joining
            x: player.x,
            y: player.y,
            direction: player.direction || 'front',
            mapId: getCurrentMapId()
        };
        console.log(`[DEBUG] Emitting playerJoin with name: ${joinData.name}`, joinData); // Log before emitting
        socket.emit('playerJoin', joinData);
    });

    socket.on('disconnect', (reason) => {
        console.log('Disconnected from game server:', reason);
        otherPlayers = {}; // Clear other players on disconnect
        // Optionally, show a message to the user
    });

    // Listen for updates about a specific player (join/move)
    socket.on('playerUpdate', (playerData) => {
        // console.log('Player update received:', playerData); // Optional log
        if (playerData.id !== socket.id) { // Don't store our own data sent back
            // Ensure we store the direction received by merging data
            otherPlayers[playerData.id] = {
                ...otherPlayers[playerData.id], // Keep existing data if any (like name from initial join)
                ...playerData // Overwrite with new data (x, y, direction)
            };
        }
    });

    // Listen for a player disconnecting
    socket.on('playerLeft', (playerId) => {
        console.log('Player left:', playerId);
        delete otherPlayers[playerId];
    });

    // Listen for the initial list of players already in the game/map
    socket.on('currentPlayers', (players) => {
        console.log('Received current players:', players);
        otherPlayers = {}; // Reset local list
        for (const playerId in players) {
            if (playerId !== socket.id) {
                otherPlayers[playerId] = players[playerId];
            }
        }
        console.log("Current otherPlayers:", otherPlayers);
    });

    // Listen for the initial list of enemies on the map
    socket.on('currentEnemies', (serverEnemies) => {
        console.log('Received current enemies:', serverEnemies);
        // Call the function in enemy.js to update the local list
        updateEnemiesFromServer(serverEnemies || {}); // Pass empty object if null/undefined
    });

    // Listen for enemy removal broadcast by the server
    socket.on('enemyRemoved', (enemyId) => {
        console.log(`Received enemyRemoved event for ID: ${enemyId}`);
        // Find the enemy object by ID to pass to removeEnemy (though removeEnemy now works by ID)
        const enemyToRemove = enemies.find(e => e.id === enemyId);
        if (enemyToRemove) {
            removeEnemy(enemyToRemove); // Remove from client's list
        } else {
             // If not found, maybe it was already removed locally (e.g., the player who defeated it)
             console.log(`Enemy ${enemyId} not found locally, possibly already removed.`);
        }
    });

    // TODO: Add listener for 'enemyUpdate' later (for movement/HP changes)

    // Add error handling
    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message, err.data);
        // Maybe display an error to the user (e.g., "Cannot connect to server")
        // Prevent game start or handle gracefully
        gameRunning = false; // Stop game if connection fails initially?
        // Consider adding a UI element to show connection status/errors
    });

    socket.on('error', (error) => {
        console.error('Socket Error:', error);
    });
}

// Modify attemptGameInitialization to include socket connection
// Ensure this is the only definition of this function
function attemptGameInitialization() {
    console.log(`[DEBUG] attemptGameInitialization called. assetsAreLoaded=${assetsAreLoaded}, playerDataInitialized=${playerDataInitialized}`);
    if (assetsAreLoaded && playerDataInitialized && !gameRunning) { // Add !gameRunning check to prevent multiple initializations
        console.log("Assets loaded and player data initialized. Initializing Socket.IO and Game...");
        try {
            initializeSocketConnection(); // Initialize Socket.IO connection
            initializeGame(); // Initialize game logic
            // Note: initializeGame now sets gameRunning = true and starts the loop
        } catch (error) {
            console.error("Error during game/socket initialization:", error);
            gameRunning = false; // Ensure game doesn't run if init fails
            // Display error to user?
        }
    } else {
        console.log(`Waiting or already running: Assets Loaded=${assetsAreLoaded}, Player Data Initialized=${playerDataInitialized}, Game Running=${gameRunning}`);
    }
}
