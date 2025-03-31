// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Add path module

// --- Basic Setup ---
const app = express();
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

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
