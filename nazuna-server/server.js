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

// --- Catch-all for SPA routing (Optional, but good practice) ---
// If no API route or static file matched, send the main index.html file.
// This allows client-side routing to handle paths like /game, /profile etc.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// --- Game State (Server-Side) ---
const players = {}; // Store connected players: { socket.id: { id, name, x, y, sprite, mapId, ... } }
const enemiesByMap = {}; // Store enemies per map: { mapId: { enemyId: { id, type, x, y, hp, ... } } }
let activeMaps = new Set(); // Keep track of maps with players

// --- Game Constants ---
const RESPAWN_INTERVAL = 60000; // Check respawn every 60 seconds (1 minute)
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
        spriteKey: 'slime', baseHp: 15, baseAtk: 4, baseDef: 1, baseDex: 2, baseXp: 338, baseGoldDrop: 3, minLvl: 1, maxLvl: 4,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.3 }, /* ... other drops */ ]
    },
    skeleton: {
        spriteKey: 'skeleton', baseHp: 25, baseAtk: 7, baseDef: 3, baseDex: 5, baseXp: 203, baseGoldDrop: 10, minLvl: 2, maxLvl: 5,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.1 }, /* ... */ ]
    },
    cultist: {
        spriteKey: 'cultist', baseHp: 20, baseAtk: 6, baseDef: 2, baseDex: 4, baseXp: 135, baseGoldDrop: 8, minLvl: 2, maxLvl: 4,
         dropTable: [ { itemKey: 'healthPotion', chance: 0.2 }, /* ... */ ]
    },
    demon: {
        spriteKey: 'demon', baseHp: 40, baseAtk: 10, baseDef: 5, baseDex: 7, baseXp: 430, baseGoldDrop: 25, minLvl: 4, maxLvl: 7,
        dropTable: [ { itemKey: 'healthPotion', chance: 0.1 }, /* ... */ ]
    },
};

// --- Server-Side Enemy Management ---
let nextEnemyId = 1; // Simple counter for unique enemy IDs

function createServerEnemy(type, x, y, level) {
    const baseStats = enemyTypes[type];
    if (!baseStats) return null;

    const levelMultiplier = 1 + (level - 1) * 0.25;
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
        // We might not need the full client-side structure here initially
    };
}


// Spawns a specific *number* of new enemies for a map and returns them.
// Does NOT clear existing enemies. Adds to the existing map object.
function spawnNewEnemies(mapId, countToSpawn) {
    if (!enemiesByMap[mapId]) {
        enemiesByMap[mapId] = {}; // Ensure map exists in state
    }
    if (countToSpawn <= 0) return []; // Nothing to spawn

    console.log(`Attempting to spawn ${countToSpawn} new enemies for map ${mapId}...`);

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
            console.warn(`No enemy spawn configuration for map ID: ${mapId}`);
            return []; // Return empty if no config
    }

    if (enemyConfig.length === 0) {
        console.log(`No enemy types configured for map '${mapId}'.`);
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
            const enemyOccupied = Object.values(enemiesByMap[mapId]).some(e => e.x === x && e.y === y);
            const playerOccupied = Object.values(players).some(p => p.mapId === mapId && Math.floor(p.x / 32) === x && Math.floor(p.y / 32) === y); // Assuming TILE_SIZE is 32

            if (!enemyOccupied && !playerOccupied) { // Add isWalkable check later
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
            console.warn(`Could not find suitable spot for new enemy on map ${mapId} after ${maxAttemptsPerEnemy} attempts.`);
        }
    } // End for loop for countToSpawn

    console.log(`Successfully spawned ${newlySpawnedEnemies.length} new enemies for map ${mapId}.`);
    return newlySpawnedEnemies;
}


// Function to check and respawn enemies for a specific map if needed
function respawnEnemiesIfNeeded(mapId) {
    const targetCount = TARGET_ENEMY_COUNT[mapId];
    if (targetCount === undefined || targetCount <= 0) {
        // console.log(`Respawn check: Map ${mapId} has no target enemy count or target is 0.`);
        return; // No respawning needed for this map
    }

    if (!enemiesByMap[mapId]) {
        enemiesByMap[mapId] = {}; // Initialize if map doesn't exist in state yet
    }

    const currentCount = Object.keys(enemiesByMap[mapId]).length;
    const needed = targetCount - currentCount;

    if (needed > 0) {
        console.log(`Respawn check: Map ${mapId} needs ${needed} enemies (Target: ${targetCount}, Current: ${currentCount}). Spawning...`);
        const newlySpawned = spawnNewEnemies(mapId, needed);

        // Broadcast each newly spawned enemy
        newlySpawned.forEach(enemy => {
            io.to(mapId).emit('enemySpawned', enemy); // Send full enemy data
             console.log(`Broadcasted enemySpawned event for ${enemy.id} (${enemy.type}) to map room ${mapId}.`);
        });
    } else {
        // console.log(`Respawn check: Map ${mapId} is full (Target: ${targetCount}, Current: ${currentCount}).`);
    }
}


// Function to get players on a specific map
let enemyConfig = [];
let levelRange = { min: 1, max: 3 };
// Simplified map dimensions (replace with actual map data later if needed)
const mapCols = 50;
    const mapRows = 50;

    switch (mapId) {
        case 'world':
            spawnCount = 15; // Example spawn count
            levelRange = { min: 1, max: 5 };
            enemyConfig = [
                { type: 'slime', weight: 6 },
                { type: 'skeleton', weight: 3 },
                { type: 'cultist', weight: 2 },
            ];
            break;
        case 'city':
            spawnCount = 0;
            break;
        case 'dungeon':
            spawnCount = 10;
            levelRange = { min: 3, max: 7 };
            enemyConfig = [
                { type: 'slime', weight: 2 },
                { type: 'skeleton', weight: 4 },
                { type: 'cultist', weight: 3 },
                { type: 'demon', weight: 1 },
            ];
            break;
        default:
            console.warn(`No enemy spawn configuration for map ID: ${mapId}`);
            return;
    }

    if (spawnCount === 0 || enemyConfig.length === 0) {
        console.log(`No enemies configured for map '${mapId}'.`);
        return;
    }

    const totalWeight = enemyConfig.reduce((sum, config) => sum + config.weight, 0);
    let attempts = 0;
    const maxAttempts = spawnCount * 10; // Increased attempts

    while (Object.keys(enemiesByMap[mapId]).length < spawnCount && attempts < maxAttempts) {
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
        if (!chosenType) continue;

        // Choose random position (assuming basic grid for now)
        // TODO: Use actual map data for walkable checks later
        const x = Math.floor(Math.random() * mapCols);
        const y = Math.floor(Math.random() * mapRows);

        // Basic check: ensure not spawning on the exact same tile
        const occupied = Object.values(enemiesByMap[mapId]).some(e => e.x === x && e.y === y);
        if (!occupied) { // Add isWalkable check later
            const level = Math.floor(Math.random() * (levelRange.max - levelRange.min + 1)) + levelRange.min;
            const enemy = createServerEnemy(chosenType, x, y, level);
            if (enemy) {
                enemiesByMap[mapId][enemy.id] = enemy;
            }
        }
    }
    console.log(`Spawned ${Object.keys(enemiesByMap[mapId]).length} enemies for map ${mapId}.`);
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
        console.log(`Player ${socket.id} joined with data:`, playerData);
        players[socket.id] = {
            id: socket.id, // Add socket ID to the player data object
            ...playerData // Spread the data sent from the client (name, x, y, sprite, mapId)
        };

        // Send the list of *other* players currently on the same map to the new player
        const otherPlayersOnMap = {};
        for (const playerId in players) {
            // Ensure the player object exists and is not the new player itself
            if (players[playerId] && playerId !== socket.id && players[playerId].mapId === playerData.mapId) {
                // Explicitly include necessary fields, including name
                otherPlayersOnMap[playerId] = {
                    id: players[playerId].id,
                    x: players[playerId].x,
                    y: players[playerId].y,
                    direction: players[playerId].direction,
                    sprite: players[playerId].sprite,
                    name: players[playerId].name, // Ensure name is included
            mapId: players[playerId].mapId
                    // Add other necessary fields if any
                };
            }
        }
        socket.emit('currentPlayers', otherPlayersOnMap);
        console.log(`Sent current players on map ${playerData.mapId} to ${socket.id}:`, Object.keys(otherPlayersOnMap));

        // --- Enemy Handling on Join ---
        const mapId = playerData.mapId;
        // Check if enemies need spawning for this map (e.g., first player enters)
        // A simple check: spawn if the map has no players OR no enemies yet.
        // More robust logic might be needed (e.g., timers, player count thresholds)
        const playersAlreadyOnMap = getPlayersOnMap(mapId);
        if (!enemiesByMap[mapId] || Object.keys(enemiesByMap[mapId]).length === 0) {
             if (Object.keys(playersAlreadyOnMap).length <= 1) { // Only spawn if this is the first player (or map was empty)
                 spawnEnemiesForMap(mapId);
             } else {
                 console.log(`Map ${mapId} already has players, assuming enemies exist or will be spawned by others.`);
             }
        }
        // Send the current enemy list for this map to the new player
        socket.emit('currentEnemies', enemiesByMap[mapId] || {});
        console.log(`Sent current enemies on map ${mapId} to ${socket.id}:`, Object.keys(enemiesByMap[mapId] || {}).length);
        // --- End Enemy Handling ---


        // Notify *other* players on the same map that a new player has joined
        socket.to(playerData.mapId).emit('playerUpdate', players[socket.id]); // Use mapId as room name
        console.log(`Notified map ${playerData.mapId} about new player ${socket.id}`);

        // Join the socket room corresponding to the map ID
        socket.join(playerData.mapId);
        console.log(`Player ${socket.id} joined map room: ${playerData.mapId}`);
    });

    // Handle player movement
    socket.on('playerMove', (moveData) => {
        const player = players[socket.id];
        if (player) {
            // Update player state on the server
            player.x = moveData.x;
            player.y = moveData.y;
            player.direction = moveData.direction; // Update direction based on received data

            // Broadcast updated player data to others in the same map room
            // Use 'playerUpdate' for consistency
            socket.to(player.mapId).emit('playerUpdate', {
                id: socket.id,
                x: player.x,
                y: player.y,
                direction: player.direction, // Send direction string
                name: player.name // Include name so it's available for drawing
                // Include other relevant data if needed
            });
            // console.log(`Player ${socket.id} moved to (${player.x}, ${player.y}) on map ${player.mapId}`); // Optional log
        } else {
            console.warn(`Received move from unknown player: ${socket.id}`);
        }
    });

    // Handle map change (client should tell server when changing maps)
    socket.on('changeMap', (newMapId) => {
        const player = players[socket.id];
        if (player) {
            console.log(`Player ${socket.id} changing map from ${player.mapId} to ${newMapId}`);
            // Leave the old map room
            socket.leave(player.mapId);
            // Notify players in the old map that this player left
            socket.to(player.mapId).emit('playerLeft', socket.id);

            // Update player's mapId
            player.mapId = newMapId;

            // Join the new map room
            socket.join(newMapId);

            // Send the list of players in the new map to the joining player
            const otherPlayersOnNewMap = {};
            for (const playerId in players) {
                // Check if player exists, is not self, and is on the new map
                if (players[playerId] && playerId !== socket.id && players[playerId].mapId === newMapId) {
                     // Explicitly include necessary fields, including name
                    otherPlayersOnNewMap[playerId] = {
                        id: players[playerId].id,
                        x: players[playerId].x,
                        y: players[playerId].y,
                        direction: players[playerId].direction,
                        sprite: players[playerId].sprite,
                        name: players[playerId].name, // Ensure name is included
                        mapId: players[playerId].mapId
                        // Add other necessary fields if any
                    };
                }
            }
            socket.emit('currentPlayers', otherPlayersOnNewMap);
            console.log(`Sent current players on map ${newMapId} to ${socket.id}:`, Object.keys(otherPlayersOnNewMap));

            // --- Enemy Handling on Map Change ---
             // Check if enemies need spawning for the new map
            const playersAlreadyOnNewMap = getPlayersOnMap(newMapId);
             if (!enemiesByMap[newMapId] || Object.keys(enemiesByMap[newMapId]).length === 0) {
                 if (Object.keys(playersAlreadyOnNewMap).length <= 1) { // Spawn if this player is first on the new map
                     spawnEnemiesForMap(newMapId);
                 } else {
                     console.log(`New map ${newMapId} already has players, assuming enemies exist.`);
                 }
             }
             // Send the current enemy list for the new map to the changing player
             socket.emit('currentEnemies', enemiesByMap[newMapId] || {});
             console.log(`Sent current enemies on map ${newMapId} to ${socket.id}:`, Object.keys(enemiesByMap[newMapId] || {}).length);
            // --- End Enemy Handling ---


            // Notify players in the new map that this player has joined
            socket.to(newMapId).emit('playerUpdate', player);
            console.log(`Notified map ${newMapId} about player ${socket.id} joining`);

        } else {
             console.warn(`Received changeMap from unknown player: ${socket.id}`);
        }
    });


    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id}, Reason: ${reason}`);
        const player = players[socket.id];
        if (player) {
            // Notify other players on the same map that this player left
            socket.to(player.mapId).emit('playerLeft', socket.id);
            console.log(`Notified map ${player.mapId} about player ${socket.id} leaving`);
            // Remove player from server state
            delete players[socket.id];
        } else {
            console.warn(`Disconnected player ${socket.id} not found in players list.`);
        }
        console.log("Current players:", Object.keys(players));
    });

    // Handle enemy defeat reported by a client
    socket.on('enemyDefeated', (data) => {
        // Basic validation
        if (!data || typeof data.enemyId !== 'string' || typeof data.mapId !== 'string') {
            console.warn(`Received invalid enemyDefeated data from ${socket.id}:`, data);
            return;
        }

        const { enemyId, mapId } = data;
        console.log(`Received enemyDefeated event for enemy ${enemyId} on map ${mapId} from player ${socket.id}`);

        // Validate if the map and enemy exist in the server state
        if (enemiesByMap[mapId] && enemiesByMap[mapId][enemyId]) {
            // Remove the enemy from the server state
            delete enemiesByMap[mapId][enemyId];
            console.log(`Removed enemy ${enemyId} from map ${mapId} state.`);

            // Broadcast the removal to all players in that map room (including the sender)
            io.to(mapId).emit('enemyRemoved', enemyId);
            console.log(`Broadcasted enemyRemoved event for ${enemyId} to map room ${mapId}.`);

            // TODO: Consider adding a respawn timer/mechanism here later
            // Example: setTimeout(() => respawnEnemy(mapId, enemyType, originalX, originalY), 60000); // Respawn after 60s
        } else {
            console.warn(`Received enemyDefeated for non-existent enemy (${enemyId}) or map (${mapId}). Might have been defeated already. Ignoring.`);
        }
    });

    // Add more event handlers here (e.g., enemy movement, item usage, chat)
});


// --- Start Server ---
server.listen(PORT, () => { // Use the http server to listen
    console.log(`Server listening on port ${PORT}`);
});
