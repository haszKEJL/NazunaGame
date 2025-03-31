const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false // Do not return password by default when querying users
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

    // --- Player Game Data ---
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    xpToNextLevel: { type: Number, default: 100 }, // Example starting value
    statPoints: { type: Number, default: 0 },
    strength: { type: Number, default: 5 },
    dexterity: { type: Number, default: 5 },
    constitution: { type: Number, default: 5 },
    intelligence: { type: Number, default: 5 },
    agility: { type: Number, default: 5 },
    hp: { type: Number, default: 50 }, // Current HP, might reset to maxHp on load
    maxHp: { type: Number, default: 50 },
    gold: { type: Number, default: 10 },
    // Equipment: Store the equipped item objects directly or just their IDs/names if using a separate Item collection
    equipment: {
        weapon: { type: Object, default: null }, // Store the full item object for simplicity now
        armor: { type: Object, default: null }
        // Add other slots like helmet, shield later
    },
    // Inventory: Store an array of item objects
    inventory: { type: [Object], default: [] }, // Array of item objects { name, quantity, type, etc. }

    // --- Player Position ---
    lastMapId: { type: String, default: 'world' }, // Default starting map
    lastX: { type: Number, default: 32 }, // Default starting X (Tile 1 * 32)
    lastY: { type: Number, default: 32 }  // Default starting Y (Tile 1 * 32)

    // Note: Derived stats like attack/defense are not stored, they will be calculated on the client.
});

// --- Password Hashing Middleware ---
// Hash password before saving a new user
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
        // Hash the password using the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware/handler
    }
});

// --- Password Comparison Method ---
// Method to compare entered password with the hashed password in the database
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);
