const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    gameState: {
        type: Object,
        default: {
            level: 1,
            xp: 0,
            maxXp: 100,
            gold: 0,
            currentHp: 100,
            maxHp: 100,
            inventory: [],
            equipment: {},
            currentWorld: 'world_green_valley',
            currentZone: 0,
            unlockedZones: { 'world_green_valley': 0 },
            rank: 'rank_adventurer'
        }
    }
});

module.exports = mongoose.model('User', userSchema);