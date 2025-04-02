// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Add path module
const http = require('http'); // Add http module
const { Server } = require("socket.io"); // Add Socket.IO Server

// --- Basic Setup ---
const app = express();
const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, { // Initialize Socket.IO server
    cors: {
        origin: "*", // Allow all origins for now (adjust for production)
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 5001; // Use port from .env or default

// --- Middleware ---
// Enable CORS for all origins (adjust for production later)
app.use(cors());
// Parse JSON request bodies
app.use(express.json());

// --- Serve Static Files ---
// Serve frontend files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// --- Database Connection ---
const dbURI = process.env.MONGODB_URI;

if (!dbURI || dbURI === "YOUR_MONGODB_CONNECTION_STRING") {
    console.error("FATAL ERROR: MONGODB_URI is not defined or is still the placeholder in .env file.");
    console.error("Please add your MongoDB connection string to the .env file.");
    process.exit(1); // Exit if DB connection string is missing/invalid
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "YOUR_VERY_SECRET_RANDOM_KEY_FOR_JWT") {
     console.error("FATAL ERROR: JWT_SECRET is not defined or is still the placeholder in .env file.");
     console.error("Please set a strong secret key for JWT_SECRET in the .env file.");
     process.exit(1); // Exit if JWT secret is missing/invalid
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

// --- API Routes ---
// Authentication Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Player Data Routes
const playerRoutes = require('./routes/player'); // Require the new player routes
app.use('/api/player', playerRoutes); // Mount them under /api/player

// --- Game State (Server-Side) ---
const players = {}; // Store connected players: { socket.id: { id, name, x, y, sprite, mapId, ... } }
const enemiesByMap = {}; // Store enemies per map: { mapId: { enemyId: { id, type, x, y, hp, ... } } }
// let activeMaps = new Set(); // Keep track of maps with players - Można usunąć, jeśli nie jest używane

// --- Game Constants ---
const RESPAWN_INTERVAL = 30000; // Check respawn every 30 seconds (adjust as needed)
const TILE_SIZE = 32; // Assuming tile size is 32 for position checks
const TARGET_ENEMY_COUNT = { // Target number of enemies per map
    world: 20,
    dungeon: 15,
    city: 0, // No enemies in city
    // Add other maps here if needed
};
const MAP_DIMENSIONS = { // Approx dimensions for random spawning (replace with real map data later)
    world: { cols: 50, rows: 50 },
    dungeon: { cols: 30, rows: 30 },
    city: { cols: 40, rows: 40 },
};


// --- Enemy Definitions (Copied from client/enemy.js for now) ---
// TODO: Move this to a shared config file or database later
const enemyTypes = {
    slime: {
        spriteKey: 'slime', baseHp: 15, baseAtk: 4, baseDef: 1, baseDex: 2, baseXp: 5, baseGoldDrop: 3, minLvl: 1, maxLvl: 4,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.3 }, /* ... other drops */ ]
    },
    skeleton: {
        spriteKey: 'skeleton', baseHp: 25, baseAtk: 7, baseDef: 3, baseDex: 5, baseXp: 10, baseGoldDrop: 10, minLvl: 2, maxLvl: 5,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.1 }, /* ... */ ]
    },
    cultist: {
        spriteKey: 'cultist', baseHp: 20, baseAtk: 6, baseDef: 2, baseDex: 4, baseXp: 8, baseGoldDrop: 8, minLvl: 2, maxLvl: 4,
         dropTable: [ { itemKey: 'healthPotion', chance: 0.2 }, /* ... */ ]
    },
    demon: {
        spriteKey: 'demon', baseHp: 40, baseAtk: 10, baseDef: 5, baseDex: 7, baseXp: 20, baseGoldDrop: 25, minLvl: 4, maxLvl: 7,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.1 }, /* ... */ ]
    },
};

// --- Server-Side Enemy Management ---
let nextEnemyId = 1; // Simple counter for unique enemy IDs

function createServerEnemy(type, x, y, level) {
    const baseStats = enemyTypes[type];
    if (!baseStats) return null;

    const levelMultiplier = 1 + (level - 1) * 0.25; // Example: 25% more stats per level above 1
    const hp = Math.floor(baseStats.baseHp * levelMultiplier);
    const id = `enemy-${nextEnemyId++}`; // Generate unique ID

    return {
        id, // Unique server-side ID
        type,
        level,
        x, // Tile X
        y, // Tile Y
        hp,
        maxHp: hp,
        // Add other stats if needed for server logic (atk, def, etc.)
    };
}

// Spawns a specific *number* of new enemies for a map and returns them.
// Does NOT clear existing enemies. Adds to the existing map object.
function spawnNewEnemies(mapId, countToSpawn) {
    if (!enemiesByMap[mapId]) {
        enemiesByMap[mapId] = {}; // Ensure map exists in state
    }
    if (countToSpawn <= 0) return []; // Nothing to spawn

    // console.log(`Attempting to spawn ${countToSpawn} new enemies for map ${mapId}...`); // Less verbose logging

    let enemyConfig = [];
    let levelRange = { min: 1, max: 3 };
    const mapDims = MAP_DIMENSIONS[mapId] || { cols: 30, rows: 30 }; // Default dimensions if not specified
    const mapCols = mapDims.cols;
    const mapRows = mapDims.rows;

    // Define enemy types and levels based on mapId
    switch (mapId) {
        case 'world':
            levelRange = { min: 1, max: 5 };
            enemyConfig = [
                { type: 'slime', weight: 6 },
                { type: 'skeleton', weight: 3 },
                { type: 'cultist', weight: 2 },
            ];
            break;
        case 'city':
             return []; // No enemies in city
        case 'dungeon':
            levelRange = { min: 3, max: 7 };
            enemyConfig = [
                { type: 'slime', weight: 2 },
                { type: 'skeleton', weight: 4 },
                { type: 'cultist', weight: 3 },
                { type: 'demon', weight: 1 },
            ];
            break;
        default:
            // console.warn(`No enemy spawn configuration for map ID: ${mapId}`); // Less verbose
            return []; // Return empty if no config
    }

    if (enemyConfig.length === 0) {
        // console.log(`No enemy types configured for map '${mapId}'.`); // Less verbose
        return [];
    }

    const totalWeight = enemyConfig.reduce((sum, config) => sum + config.weight, 0);
    let attempts = 0;
    const maxAttemptsPerEnemy = 20; // Max attempts to find a spot for *each* enemy
    const newlySpawnedEnemies = [];

    for (let i = 0; i < countToSpawn; i++) {
        attempts = 0; // Reset attempts for each enemy
        let spawned = false;
        while (!spawned && attempts < maxAttemptsPerEnemy) {
            attempts++;
            let randomWeight = Math.random() * totalWeight;
            let chosenType = null;
            for (const config of enemyConfig) {
                randomWeight -= config.weight;
                if (randomWeight <= 0) {
                    chosenType = config.type;
                    break;
                }
            }
            if (!chosenType) continue; // Should not happen if totalWeight > 0

            // Choose random position
            // TODO: Use actual map data for walkable checks later
            const x = Math.floor(Math.random() * mapCols);
            const y = Math.floor(Math.random() * mapRows);

            // Basic check: ensure not spawning on the exact same tile as existing enemies or players
            const enemyOccupied = Object.values(enemiesByMap[mapId] || {}).some(e => e.x === x && e.y === y);
            // Check player positions more accurately (comparing tile coords)
            const playerOccupied = Object.values(players).some(p =>
                p.mapId === mapId &&
                Math.floor(p.x / TILE_SIZE) === x &&
                Math.floor(p.y / TILE_SIZE) === y
            );

            // TODO: Add a proper check for walkable tiles here using map data
            const isWalkable = true; // Placeholder

            if (!enemyOccupied && !playerOccupied && isWalkable) {
                const level = Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)) + levelRange.min;
                const enemy = createServerEnemy(chosenType, x, y, level);
                if (enemy) {
                    enemiesByMap[mapId][enemy.id] = enemy; // Add to state
                    newlySpawnedEnemies.push(enemy); // Add to list to be returned/broadcasted
                    spawned = true;
                }
            }
        } // End while trying to spawn one enemy
        if (!spawned) {
            // console.warn(`Could not find suitable spot for new enemy on map ${mapId} after ${maxAttemptsPerEnemy} attempts.`); // Less verbose
        }
    } // End for loop for countToSpawn

    if (newlySpawnedEnemies.length > 0) {
        console.log(`Successfully spawned ${newlySpawnedEnemies.length} new enemies for map ${mapId}.`);
    }
    return newlySpawnedEnemies;
}

// Function to spawn the *initial* set of enemies for a map (used when map becomes active)
// This was the logic previously misplaced outside a function.
function spawnEnemiesForMap(mapId) {
    // Ensure the map exists in the state, even if empty initially
    if (!enemiesByMap[mapId]) {
        enemiesByMap[mapId] = {};
    }

    const targetCount = TARGET_ENEMY_COUNT[mapId];
    if (targetCount === undefined || targetCount <= 0) {
        console.log(`Initial spawn: Map ${mapId} has no target enemy count or target is 0.`);
        return; // No initial spawning needed
    }

    const currentCount = Object.keys(enemiesByMap[mapId]).length;
    const needed = targetCount - currentCount;

    if (needed > 0) {
        console.log(`Initial spawn: Map ${mapId} needs ${needed} enemies (Target: ${targetCount}, Current: ${currentCount}). Spawning...`);
        const newlySpawned = spawnNewEnemies(mapId, needed); // Use the common spawn function

        // Broadcast the newly spawned enemies (optional for initial spawn,
        // could be included in 'currentEnemies' sent on join/map change)
        // newlySpawned.forEach(enemy => {
        //     io.to(mapId).emit('enemySpawned', enemy);
        // });
    } else {
         console.log(`Initial spawn check: Map ${mapId} already has enough enemies (Target: ${targetCount}, Current: ${currentCount}).`);
    }
}


// Function to check and respawn enemies for a specific map if needed
function respawnEnemiesIfNeeded(mapId) {
    const targetCount = TARGET_ENEMY_COUNT[mapId];
    if (targetCount === undefined || targetCount <= 0) {
        // console.log(`Respawn check: Map ${mapId} has no target enemy count or target is 0.`);
        return; // No respawning needed for this map
    }

    // Only respawn if there are actually players on the map
    const playersOnMap = getPlayersOnMap(mapId);
    if (Object.keys(playersOnMap).length === 0) {
        // console.log(`Respawn check: No players on map ${mapId}, skipping respawn.`);
        // Optionally clear enemies if map is empty for a long time
        // delete enemiesByMap[mapId];
        return;
    }

    if (!enemiesByMap[mapId]) {
        enemiesByMap[mapId] = {}; // Initialize if map doesn't exist in state yet (shouldn't happen if players are present)
    }

    const currentCount = Object.keys(enemiesByMap[mapId]).length;
    const needed = targetCount - currentCount;

    if (needed > 0) {
        console.log(`Respawn check: Map ${mapId} needs ${needed} enemies (Target: ${targetCount}, Current: ${currentCount}). Spawning...`);
        const newlySpawned = spawnNewEnemies(mapId, needed);

        // Broadcast each newly spawned enemy to the players on that map
        newlySpawned.forEach(enemy => {
            io.to(mapId).emit('enemySpawned', enemy); // Send full enemy data
            // console.log(`Broadcasted enemySpawned event for ${enemy.id} (${enemy.type}) to map room ${mapId}.`); // Less verbose
        });
    } else {
        // console.log(`Respawn check: Map ${mapId} is full (Target: ${targetCount}, Current: ${currentCount}).`);
    }
}

// Function to get players on a specific map
function getPlayersOnMap(mapId) {
    const playersOnMap = {};
    for (const playerId in players) {
        if (players[playerId] && players[playerId].mapId === mapId) {
            playersOnMap[playerId] = players[playerId];
        }
    }
    return playersOnMap;
}


// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle player joining
    socket.on('playerJoin', (playerData) => {
        // Basic validation
        if (!playerData || typeof playerData.name !== 'string' || typeof playerData.mapId !== 'string' || typeof playerData.x !== 'number' || typeof playerData.y !== 'number' || typeof playerData.sprite !== 'string') {
             console.warn(`Invalid playerData received on playerJoin from ${socket.id}:`, playerData);
             socket.disconnect(); // Disconnect invalid client
             return;
        }

        console.log(`Player ${socket.id} (${playerData.name}) joining map ${playerData.mapId}`);
        players[socket.id] = {
            id: socket.id, // Use socket ID as the unique player identifier on the server
            name: playerData.name,
            x: playerData.x,
            y: playerData.y,
            sprite: playerData.sprite,
            mapId: playerData.mapId,
            direction: playerData.direction || 'down', // Default direction
            // Add other necessary fields like HP, stats etc. later
        };

        const currentMapId = playerData.mapId;

        // Join the socket room corresponding to the map ID
        socket.join(currentMapId);
        console.log(`Player ${socket.id} joined map room: ${currentMapId}`);

        // Send the list of *other* players currently on the same map to the new player
        const otherPlayersOnMap = {};
        for (const playerId in players) {
            if (players[playerId] && playerId !== socket.id && players[playerId].mapId === currentMapId) {
                otherPlayersOnMap[playerId] = players[playerId]; // Send the full player object for others
            }
        }
        socket.emit('currentPlayers', otherPlayersOnMap);
        console.log(`Sent ${Object.keys(otherPlayersOnMap).length} current players on map ${currentMapId} to ${socket.id}`);

        // --- Enemy Handling on Join ---
        // Check if enemies need *initial* spawning for this map (e.g., first player enters)
        const playersAlreadyOnMap = getPlayersOnMap(currentMapId);
        if (!enemiesByMap[currentMapId] || Object.keys(enemiesByMap[currentMapId]).length === 0) {
             // Spawn only if this is the *only* player currently joining this map
             // (getPlayersOnMap includes the currently joining player as they are added before this check)
             if (Object.keys(playersAlreadyOnMap).length === 1) {
                 console.log(`First player (${socket.id}) on map ${currentMapId}. Performing initial enemy spawn.`);
                 spawnEnemiesForMap(currentMapId); // Perform initial spawn
             } else {
                 console.log(`Map ${currentMapId} already has ${Object.keys(playersAlreadyOnMap).length} players, assuming enemies exist.`);
             }
        } else {
             console.log(`Map ${currentMapId} already has enemies defined.`);
        }
        // Send the current enemy list for this map to the new player
        socket.emit('currentEnemies', enemiesByMap[currentMapId] || {});
        console.log(`Sent ${Object.keys(enemiesByMap[currentMapId] || {}).length} current enemies on map ${currentMapId} to ${socket.id}`);
        // --- End Enemy Handling ---

        // Notify *other* players on the same map that a new player has joined
        // Send the full data of the newly joined player
        socket.to(currentMapId).emit('playerUpdate', players[socket.id]);
        console.log(`Notified map ${currentMapId} about new player ${socket.id}`);
    });

    // Handle player movement
    socket.on('playerMove', (moveData) => {
        const player = players[socket.id];
        if (player && moveData) {
            // Basic validation/Sanitization (optional but recommended)
            player.x = typeof moveData.x === 'number' ? moveData.x : player.x;
            player.y = typeof moveData.y === 'number' ? moveData.y : player.y;
            player.direction = typeof moveData.direction === 'string' ? moveData.direction : player.direction;

            // Broadcast only necessary update data to others in the same map room
            socket.to(player.mapId).emit('playerUpdate', {
                id: socket.id,
                x: player.x,
                y: player.y,
                direction: player.direction,
                // name: player.name // Name usually doesn't change with movement
            });
            // console.log(`Player ${socket.id} moved to (${player.x}, ${player.y}) dir ${player.direction} on map ${player.mapId}`); // Too verbose
        } else if (!player) {
            console.warn(`Received move from unknown player: ${socket.id}`);
        }
    });

    // Handle map change (client should tell server *before* actually changing map scene)
    socket.on('changeMap', (data) => {
        const player = players[socket.id];
         // Validate input
        if (!player || !data || typeof data.newMapId !== 'string' || typeof data.x !== 'number' || typeof data.y !== 'number') {
             console.warn(`Invalid changeMap request from ${socket.id}:`, data);
             return;
        }

        const oldMapId = player.mapId;
        const newMapId = data.newMapId;
        const newX = data.x;
        const newY = data.y;

        if (oldMapId === newMapId) {
             console.warn(`Player ${socket.id} sent changeMap to the same map (${newMapId}). Ignoring.`);
             return; // Ignore if changing to the same map
        }

        console.log(`Player ${socket.id} changing map from ${oldMapId} to ${newMapId} at (${newX}, ${newY})`);

        // 1. Leave the old map room
        socket.leave(oldMapId);
        // 2. Notify players in the old map that this player left
        io.to(oldMapId).emit('playerLeft', socket.id); // Use io.to to ensure message is sent even after leaving

        // 3. Update player's state on the server
        player.mapId = newMapId;
        player.x = newX;
        player.y = newY;
        player.direction = data.direction || player.direction; // Update direction if provided

        // 4. Join the new map room
        socket.join(newMapId);

        // 5. Send the list of players *already* in the new map to the joining player
        const otherPlayersOnNewMap = {};
        for (const playerId in players) {
            // Check if player exists, is not self, and is on the new map
            if (players[playerId] && playerId !== socket.id && players[playerId].mapId === newMapId) {
                otherPlayersOnNewMap[playerId] = players[playerId]; // Send full player object
            }
        }
        socket.emit('currentPlayers', otherPlayersOnNewMap);
        console.log(`Sent ${Object.keys(otherPlayersOnNewMap).length} current players on map ${newMapId} to ${socket.id}`);

        // 6. --- Enemy Handling on Map Change ---
        const playersAlreadyOnNewMap = getPlayersOnMap(newMapId); // Get players *including* the one changing map
        if (!enemiesByMap[newMapId] || Object.keys(enemiesByMap[newMapId]).length === 0) {
             // Spawn only if this player is the *only* one on the new map now
             if (Object.keys(playersAlreadyOnNewMap).length === 1) {
                 console.log(`First player (${socket.id}) on new map ${newMapId}. Performing initial enemy spawn.`);
                 spawnEnemiesForMap(newMapId);
             } else {
                  console.log(`New map ${newMapId} already has ${Object.keys(playersAlreadyOnNewMap).length} players, assuming enemies exist.`);
             }
        }
        // Send the current enemy list for the new map to the changing player
        socket.emit('currentEnemies', enemiesByMap[newMapId] || {});
        console.log(`Sent ${Object.keys(enemiesByMap[newMapId] || {}).length} current enemies on map ${newMapId} to ${socket.id}`);
        // --- End Enemy Handling ---

        // 7. Notify players *already* in the new map that this player has joined (send full data)
        socket.to(newMapId).emit('playerUpdate', player);
        console.log(`Notified map ${newMapId} about player ${socket.id} joining`);
    });


    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id}, Reason: ${reason}`);
        const player = players[socket.id];
        if (player) {
            const mapId = player.mapId;
            // Remove player from server state *first*
            delete players[socket.id];
            // Notify other players on the same map that this player left
            io.to(mapId).emit('playerLeft', socket.id);
            console.log(`Notified map ${mapId} about player ${socket.id} leaving. Remaining players: ${Object.keys(players).length}`);

            // Optional: Check if the map is now empty and clean up enemies after a delay
            // const remainingPlayersOnMap = getPlayersOnMap(mapId);
            // if (Object.keys(remainingPlayersOnMap).length === 0) {
            //     console.log(`Map ${mapId} is now empty. Clearing enemies.`);
            //     delete enemiesByMap[mapId];
            // }

        } else {
            console.warn(`Disconnected player ${socket.id} not found in players list.`);
        }
        // console.log("Current players:", Object.keys(players)); // Less verbose
    });

    // Handle enemy defeat reported by a client
    socket.on('enemyDefeated', (data) => {
        const player = players[socket.id];
        // Basic validation
        if (!player || !data || typeof data.enemyId !== 'string' || typeof data.mapId !== 'string') {
            console.warn(`Received invalid enemyDefeated data from ${socket.id}:`, data);
            return;
        }

        const { enemyId, mapId } = data;

        // Verify the player is actually on the map they claim
        if (player.mapId !== mapId) {
            console.warn(`Player ${socket.id} reported enemy defeat on map ${mapId} but is on map ${player.mapId}. Ignoring.`);
            return;
        }

        console.log(`Received enemyDefeated event for enemy ${enemyId} on map ${mapId} from player ${socket.id} (${player.name})`);

        // Validate if the map and enemy exist in the server state
        if (enemiesByMap[mapId] && enemiesByMap[mapId][enemyId]) {
            // TODO: Add server-side validation if needed (e.g., check distance, last hit)

            const defeatedEnemy = enemiesByMap[mapId][enemyId]; // Get enemy data before deleting

            // Remove the enemy from the server state
            delete enemiesByMap[mapId][enemyId];
            console.log(`Removed enemy ${enemyId} from map ${mapId} state.`);

            // Broadcast the removal to all players in that map room (including the sender)
            io.to(mapId).emit('enemyRemoved', enemyId);
            console.log(`Broadcasted enemyRemoved event for ${enemyId} to map room ${mapId}.`);

            // --- Award XP/Gold/Drops (Server-Side) ---
            // Example: Awarding to the player who reported the kill
            // More complex logic might distribute rewards or track damage contribution
            const enemyBaseStats = enemyTypes[defeatedEnemy.type];
            if (enemyBaseStats) {
                const xpGain = enemyBaseStats.baseXp || 0; // Add level scaling later if needed
                const goldGain = enemyBaseStats.baseGoldDrop || 0;
                // TODO: Calculate drops based on dropTable

                // Send reward notification to the specific player
                // You might want a more robust way to update player stats (e.g., via API or another socket event)
                socket.emit('playerReward', { xp: xpGain, gold: goldGain /*, items: calculatedDrops */ });
                console.log(`Sent reward (XP: ${xpGain}, Gold: ${goldGain}) to player ${socket.id} for defeating ${enemyId}`);
            }
            // --- End Reward Logic ---

            // Note: Respawns are handled by the interval timer, not immediately on defeat.

        } else {
            console.warn(`Received enemyDefeated for non-existent enemy (${enemyId}) on map (${mapId}). Might have been defeated already. Ignoring.`);
        }
    });

    // Add more event handlers here (e.g., player attack, enemy attack, item usage, chat)
});


// --- Periodic Tasks ---
// Function to run periodic checks (like respawn)
function runPeriodicChecks() {
    // console.log("Running periodic checks..."); // Can be verbose
    const mapsWithPlayers = new Set();
    Object.values(players).forEach(p => mapsWithPlayers.add(p.mapId));

    // Check respawn only for maps that currently have players or have target counts
    const mapsToCheck = new Set([...mapsWithPlayers, ...Object.keys(TARGET_ENEMY_COUNT)]);

    mapsToCheck.forEach(mapId => {
        if (TARGET_ENEMY_COUNT[mapId] !== undefined && TARGET_ENEMY_COUNT[mapId] > 0) {
            respawnEnemiesIfNeeded(mapId);
        }
    });
}

// --- Catch-all for SPA routing (Place after API routes, before starting server) ---
// If no API route or static file matched, send the main index.html file.
app.get('*', (req, res) => {
    // Avoid sending index.html for potential API-like paths not caught earlier
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
         return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// --- Start Server & Periodic Tasks ---
server.listen(PORT, () => { // Use the http server to listen
    console.log(`Server listening on port ${PORT}`);
    // Start periodic checks *after* the server is running
    console.log(`Starting periodic enemy respawn check every ${RESPAWN_INTERVAL / 1000} seconds.`);
    setInterval(runPeriodicChecks, RESPAWN_INTERVAL);
});