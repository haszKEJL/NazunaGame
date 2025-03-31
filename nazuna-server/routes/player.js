const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // Import the auth middleware
const User = require('../models/User'); // Import the User model

// --- Save Player Data Route ---
// PUT /api/player/save (Using PUT as it's updating existing resource)
// Requires authentication
router.put('/save', authenticateToken, async (req, res) => {
    const userId = req.user.userId; // Get user ID from the authenticated token payload
    const playerData = req.body; // Get the player data object from the request body

    // Basic validation: Check if playerData exists
    if (!playerData) {
        return res.status(400).json({ message: 'No player data provided in request body' });
    }

    // Define the fields we expect to receive and want to update
    // This prevents accidentally updating other fields like username or password
    const fieldsToUpdate = {
        level: playerData.level,
        xp: playerData.xp,
        xpToNextLevel: playerData.xpToNextLevel,
        statPoints: playerData.statPoints,
        strength: playerData.strength,
        dexterity: playerData.dexterity,
        constitution: playerData.constitution,
        intelligence: playerData.intelligence,
        agility: playerData.agility,
        hp: playerData.hp,
        maxHp: playerData.maxHp,
        gold: playerData.gold,
        equipment: playerData.equipment, // Assuming client sends the equipment object
        inventory: playerData.inventory,  // Assuming client sends the inventory array
        // Add position fields
        lastMapId: playerData.lastMapId,
        lastX: playerData.lastX,
        lastY: playerData.lastY
    };

    // Remove undefined fields to avoid overwriting existing data with undefined
    Object.keys(fieldsToUpdate).forEach(key => {
        if (fieldsToUpdate[key] === undefined) {
            delete fieldsToUpdate[key];
        }
    });

    // Check if there's anything to update
    if (Object.keys(fieldsToUpdate).length === 0) {
         return res.status(400).json({ message: 'No valid player data fields provided for update' });
    }


    try {
        // Find the user by ID and update their data
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: fieldsToUpdate }, // Use $set to update only the specified fields
            { new: true, runValidators: true } // Return the updated document, run schema validators
        );

        if (!updatedUser) {
            // This shouldn't happen if the token is valid, but good practice to check
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`Player data saved for user: ${req.user.username}`);
        res.status(200).json({ message: 'Player data saved successfully' });

    } catch (error) {
        console.error("Save Player Data Error:", error);
        // Handle potential validation errors from Mongoose during update
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error while saving player data' });
    }
});

module.exports = router;
