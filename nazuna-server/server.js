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
            if (playerId !== socket.id && players[playerId].mapId === playerData.mapId) {
                otherPlayersOnMap[playerId] = players[playerId];
            }
        }
        socket.emit('currentPlayers', otherPlayersOnMap);
        console.log(`Sent current players on map ${playerData.mapId} to ${socket.id}:`, Object.keys(otherPlayersOnMap));

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
            player.sprite = moveData.sprite; // Update sprite direction

            // Broadcast updated player data to others in the same map room
            // Use 'playerUpdate' for consistency
            socket.to(player.mapId).emit('playerUpdate', {
                id: socket.id,
                x: player.x,
                y: player.y,
                sprite: player.sprite,
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
                    otherPlayersOnNewMap[playerId] = players[playerId];
                }
            }
            socket.emit('currentPlayers', otherPlayersOnNewMap);
            console.log(`Sent current players on map ${newMapId} to ${socket.id}:`, Object.keys(otherPlayersOnNewMap));


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

    // Add more event handlers here (e.g., combat actions, item usage, chat)
});


// --- Start Server ---
server.listen(PORT, () => { // Use the http server to listen
    console.log(`Server listening on port ${PORT}`);
});
