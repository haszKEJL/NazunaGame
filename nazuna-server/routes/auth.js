const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// --- Registration Route ---
// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }
    if (password.length < 6) {
         return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new user (password hashing is handled by the pre-save hook in User.js)
        const newUser = new User({
            username: username, // Will be lowercased by schema
            password: password
        });

        await newUser.save();

        // Don't send password back, even hashed
        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        console.error("Registration Error:", error);
        // Handle potential validation errors from Mongoose
        if (error.name === 'ValidationError') {
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// --- Login Route ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        // Find user by username (case-insensitive due to schema lowercase: true)
        // Explicitly select the password field which is excluded by default
        const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' }); // User not found
        }

        // Compare entered password with stored hashed password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' }); // Password doesn't match
        }

        // --- Generate JWT ---
        const payload = {
            userId: user._id,
            username: user.username
            // Add other relevant info if needed, but keep payload small
        };

        const secret = process.env.JWT_SECRET;
        const options = {
            expiresIn: '1h' // Token expires in 1 hour (adjust as needed)
        };

        jwt.sign(payload, secret, options, (err, token) => {
            if (err) {
                console.error("JWT Signing Error:", err);
                return res.status(500).json({ message: 'Error generating token' });
            }

            // Prepare user data for response (remove password)
            const userResponseData = user.toObject(); // Convert Mongoose doc to plain object
            delete userResponseData.password; // Ensure password is not sent

            // Send token and full user data back to client
            res.status(200).json({
                message: 'Login successful',
                token: token,
                user: userResponseData // Send the full user object with player data
            });
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- Get Current User Data Route ---
// GET /api/auth/me
// Requires authentication
const authenticateToken = require('../middleware/authMiddleware'); // Import middleware

router.get('/me', authenticateToken, async (req, res) => {
    try {
        // The authenticateToken middleware already verified the token and attached user payload (userId) to req.user
        const userId = req.user.userId;

        // Fetch the user data from the database, excluding the password
        const user = await User.findById(userId).select('-password'); // Exclude password explicitly

        if (!user) {
            // This should technically not happen if the token was valid and verified
            // but the user was somehow deleted between token issuance and this request.
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the user data back
        res.status(200).json(user);

    } catch (error) {
        console.error("Get Current User Error:", error);
        res.status(500).json({ message: 'Server error while fetching user data' });
    }
});


module.exports = router;
