const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Optional: if you need to attach the full user object

const authenticateToken = (req, res, next) => {
    // Get token from the Authorization header (Bearer TOKEN)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token after 'Bearer '

    if (token == null) {
        return res.sendStatus(401); // If no token, unauthorized
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not defined in environment variables!");
        return res.sendStatus(500); // Internal server error if secret is missing
    }

    jwt.verify(token, secret, (err, userPayload) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            // Differentiate between expired token and invalid token
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired' });
            }
            return res.sendStatus(403); // Forbidden if token is invalid for other reasons
        }

        // Token is valid, attach payload to request object
        // The payload contains { userId, username } as defined in auth.js
        req.user = userPayload;
        console.log(`Authenticated user: ${req.user.username} (ID: ${req.user.userId})`); // Log authenticated user

        // Optional: Fetch the full user from DB if needed downstream
        // User.findById(userPayload.userId).then(userDoc => {
        //     if (!userDoc) return res.sendStatus(404); // User not found
        //     req.dbUser = userDoc; // Attach full Mongoose user document
        //     next();
        // }).catch(dbErr => {
        //     console.error("Error fetching user during auth:", dbErr);
        //     res.sendStatus(500);
        // });

        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = authenticateToken;
