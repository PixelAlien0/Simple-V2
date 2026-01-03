const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User');
const MarketListing = require('./MarketListing');
const fs = require('fs');
const vm = require('vm');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Chat History & Online Users
const chatHistory = [];
const onlineUsers = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'a-long-and-random-secret-for-development'; // In production, use environment variable

// Middleware to parse JSON bodies
app.use(express.json());
// Serve static files from the current directory
app.use(express.static(__dirname));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rpg_core';

// --- Static Data Sync Schemas ---
// These allow us to store items/enemies in MongoDB for viewing in Compass
const AnySchema = new mongoose.Schema({}, { strict: false });
const DbItem = mongoose.model('DbItem', AnySchema);
const DbEnemy = mongoose.model('DbEnemy', AnySchema);
const DbEvent = mongoose.model('DbEvent', AnySchema);
const DbWorld = mongoose.model('DbWorld', AnySchema);
const DbRank = mongoose.model('DbRank', AnySchema);
const DbGacha = mongoose.model('DbGacha', AnySchema);
const DbEffect = mongoose.model('DbEffect', AnySchema);
const DbQuest = mongoose.model('DbQuest', AnySchema);

const syncGameContent = async () => {
    try {
        // Sync Items
        if (DB.items && DB.items.length > 0) {
            await DbItem.deleteMany({}); // Clear old data
            await DbItem.insertMany(DB.items); // Insert current file data
            console.log(`[Sync] ${DB.items.length} items synced to MongoDB.`);
        }

        // Sync Enemies
        if (DB.enemies && DB.enemies.length > 0) {
            await DbEnemy.deleteMany({});
            await DbEnemy.insertMany(DB.enemies);
            console.log(`[Sync] ${DB.enemies.length} enemies synced to MongoDB.`);
        }

        // Sync Events
        if (DB.events && DB.events.length > 0) {
            await DbEvent.deleteMany({});
            await DbEvent.insertMany(DB.events);
            console.log(`[Sync] ${DB.events.length} events synced to MongoDB.`);
        }

        // Sync Worlds
        if (DB.worlds && DB.worlds.length > 0) {
            await DbWorld.deleteMany({});
            await DbWorld.insertMany(DB.worlds);
            console.log(`[Sync] ${DB.worlds.length} worlds synced to MongoDB.`);
        }

        // Sync Ranks
        if (DB.ranks && DB.ranks.length > 0) {
            await DbRank.deleteMany({});
            await DbRank.insertMany(DB.ranks);
            console.log(`[Sync] ${DB.ranks.length} ranks synced to MongoDB.`);
        }

        // Sync Gacha
        if (DB.gacha && DB.gacha.length > 0) {
            await DbGacha.deleteMany({});
            await DbGacha.insertMany(DB.gacha);
            console.log(`[Sync] ${DB.gacha.length} gacha banners synced to MongoDB.`);
        }

        // Sync Effects
        if (DB.effects && DB.effects.length > 0) {
            await DbEffect.deleteMany({});
            await DbEffect.insertMany(DB.effects);
            console.log(`[Sync] ${DB.effects.length} effects synced to MongoDB.`);
        }

        // Sync Quests
        if (DB.quests && DB.quests.length > 0) {
            await DbQuest.deleteMany({});
            await DbQuest.insertMany(DB.quests);
            console.log(`[Sync] ${DB.quests.length} quests synced to MongoDB.`);
        }
    } catch (err) {
        console.error("[Sync] Failed to sync static data:", err.message);
    }
};

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .then(async () => {
        console.log('MongoDB Connected');
        await syncGameContent(); // Run sync on startup
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        console.log('Hint: Ensure MongoDB is installed and running on port 27017.');
    });

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

// --- Game Data Loading ---
const loadGameData = () => {
    const sandbox = { window: {}, DB: {} };
    sandbox.window.DB = sandbox.DB; // Link window.DB to DB so materials/foods scripts work correctly
    vm.createContext(sandbox);
    
    const files = [
        'database/rarities.js',
        'database/mechanics.js',
        'database/difficulties.js',
        'database/worlds.js',
        'database/ranks.js',
        'database/encounters.js',
        'database/enemies.js',
        'database/items.js',
        'database/gacha.js',
        'database/gacha_items.js',
        'database/events.js',
        'database/effects.js',
        'database/materials.js',
        'database/foods.js',
        'database/quests.js'
    ];

    files.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const code = fs.readFileSync(filePath, 'utf8');
            vm.runInContext(code, sandbox);
        }
    });
    return sandbox.DB;
};

const DB = loadGameData();

// Helper: Get Local IP
const getLocalIp = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return null;
};

// Helper: Add Item to Inventory (Handles Stacking)
const addItemToInventory = (player, itemId, quantity = 1) => {
    if (!player.inventory) player.inventory = [];
    const itemData = DB.items.find(i => i.id === itemId);
    if (!itemData) return;

    if (itemData.type === 'Material') {
        const stack = player.inventory.find(i => i.id === itemId && (i.quantity || 1) < 64);
        if (stack) {
            if (!stack.quantity) stack.quantity = 1;
            const space = 64 - stack.quantity;
            const add = Math.min(space, quantity);
            stack.quantity += add;
            quantity -= add;
        }
        
        if (quantity > 0) {
            const newStack = { id: itemId, instanceId: Date.now() + Math.random(), quantity: Math.min(64, quantity) };
            player.inventory.push(newStack);
            quantity -= newStack.quantity;
            if (quantity > 0) addItemToInventory(player, itemId, quantity);
        }
    } else {
        for (let i = 0; i < quantity; i++) {
            const newItem = { id: itemId, instanceId: Date.now() + Math.random(), quantity: 1 };
            if (itemData.maxDurability) newItem.durability = itemData.maxDurability;
            player.inventory.push(newItem);
        }
    }
};

// Helper: Weighted Rarity Roll (Server Side)
const rollRarity = (luck = 0) => {
    const rarityPool = Object.values(DB.rarities).map(r => ({...r}));
    // Apply Luck
    rarityPool.forEach(r => {
        if (r.name !== 'Common') {
            r.weight = Math.floor(r.weight * (1 + (luck * 0.1)));
        }
    });
    const totalWeight = rarityPool.reduce((sum, r) => sum + r.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    for (const r of rarityPool) {
        randomWeight -= r.weight;
        if (randomWeight <= 0) return r.name;
    }
    return 'Common';
};

// Helper: Recalculate Stats (Server Side)
const recalculateStats = (player) => {
    const finalStats = { ...DB.mechanics.BASE_STATS }; // Ensure mechanics has BASE_STATS or use defaults
    if (!finalStats.damageMin) finalStats.damageMin = 5;
    if (!finalStats.damageMax) finalStats.damageMax = 10;
    if (!finalStats.defense) finalStats.defense = 0;
    if (!finalStats.luck) finalStats.luck = 0;

    const bonusStats = { damageMin: 0, damageMax: 0, defense: 0, luck: 0 };

    if (player.equipment) {
        for (const slot in player.equipment) {
            const itemInstance = player.equipment[slot];
            if (itemInstance) {
                if (itemInstance.durability !== undefined && itemInstance.durability <= 0) continue;
                
                const itemData = DB.items.find(i => i.id === itemInstance.id);
                if (itemData && itemData.stats) {
                    for (const stat in itemData.stats) {
                        const val = itemData.stats[stat];
                        if (stat === 'damage') {
                            finalStats.damageMin += val;
                            finalStats.damageMax += val;
                            bonusStats.damageMin += val;
                            bonusStats.damageMax += val;
                        } else {
                            finalStats[stat] = (finalStats[stat] || 0) + val;
                            bonusStats[stat] = (bonusStats[stat] || 0) + val;
                        }
                    }
                }
            }
        }
    }
    player.calculatedStats = finalStats;
    player.bonusStats = bonusStats;
    return player;
};

// Helper: Generate Daily Quests
const generateDailyQuests = (player) => {
    if (!player.quests) player.quests = { active: [], lastGenerated: 0 };
    
    const now = new Date();
    const lastGen = new Date(player.quests.lastGenerated);
    
    // Check if it's a new day (simple check)
    const isNewDay = now.toDateString() !== lastGen.toDateString();

    if (isNewDay || player.quests.active.length === 0) {
        // Pick 3 random quests
        const pool = [...DB.quests];
        const newQuests = [];
        for (let i = 0; i < 3; i++) {
            if (pool.length === 0) break;
            const idx = Math.floor(Math.random() * pool.length);
            const template = pool.splice(idx, 1)[0];
            newQuests.push({ templateId: template.id, progress: 0, isCompleted: false, isClaimed: false });
        }
        player.quests.active = newQuests;
        player.quests.lastGenerated = now.getTime();
    }
    
    return player;
};

// --- API Routes ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.json({ message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });
        
        if (user.isBanned) return res.status(403).json({ error: 'Account is banned.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        // Generate Token
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });

        // Check Quests
        generateDailyQuests(user.gameState);
        await User.findOneAndUpdate({ username: user.username }, { gameState: user.gameState });

        res.json({ 
            message: 'Login successful', 
            token,
            username: user.username, 
            gameState: user.gameState 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Save Game
app.post('/api/save', authenticateToken, async (req, res) => {
    const { gameState } = req.body;
    const username = req.user.username; // Get username from token, not body

    try {
        await User.findOneAndUpdate({ username }, { gameState });
        res.json({ message: 'Saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Save failed' });
    }
});

// Get Game State (Part 3)
app.get('/api/gamestate', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Check Quests
        generateDailyQuests(user.gameState);
        await User.findOneAndUpdate({ username: user.username }, { gameState: user.gameState });

        res.json({ 
            username: user.username, 
            gameState: user.gameState 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Exploration (Part 4)
app.post('/api/explore', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const player = user.gameState;
        // Ensure stats exist
        if (!player.calculatedStats) player.calculatedStats = { luck: 0 };
        
        const worldId = player.currentWorld || 'world_green_valley';
        const zoneIndex = player.currentZone || 0;
        
        const world = DB.worlds.find(w => w.id === worldId);
        const zone = world ? world.zones[zoneIndex] : null;
        
        if (world && player.level < world.minLevel) {
            return res.status(400).json({ error: `Level ${world.minLevel} required.` });
        }
        if (zone && player.level < zone.minLevel) {
            return res.status(400).json({ error: `Level ${zone.minLevel} required for this zone.` });
        }

        const difficultyId = player.difficulty || 'difficulty_normal';
        const difficulty = DB.difficulties.find(d => d.id === difficultyId) || DB.difficulties[1];
        
        // Initialize Mastery
        if (!player.zoneMastery) player.zoneMastery = {};
        const masteryKey = `${worldId}_${zoneIndex}`;
        const currentMastery = player.zoneMastery[masteryKey] || 0;

        // --- Boss Challenge Logic ---
        if (req.body.action === 'boss') {
            if (currentMastery < 100) return res.status(400).json({ error: "Zone not mastered yet." });

            const bossId = zone ? zone.bossId : null;
            const boss = DB.enemies.find(e => e.id === bossId);
            if (!boss) return res.status(400).json({ error: "No boss found for this zone." });

            const enemy = { ...boss };
            enemy.maxHp = Math.floor(enemy.maxHp * difficulty.multipliers.enemyHp);
            enemy.hp = enemy.maxHp;
            enemy.xp = Math.floor(enemy.xp * difficulty.multipliers.exp);

            player.combat = { inCombat: true, enemy: enemy };
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            
            return res.json({ type: 'enemy', data: enemy, isBoss: true });
        }

        const roll = Math.random() * 100;
        
        // 1. Event Encounter (35%) - Increased to make gathering common
        if (roll < 35) {
            // Filter events by type
            const gatheringEvents = DB.events.filter(e => e.type === 'gathering');
            const narrativeEvents = DB.events.filter(e => e.type === 'narrative' || !e.type);

            // Weighted Selection: 80% Gathering, 20% Narrative
            let pool = [];
            if (Math.random() < 0.8 && gatheringEvents.length > 0) {
                pool = gatheringEvents;
            } else {
                pool = narrativeEvents;
            }
            // Fallback
            if (pool.length === 0) pool = DB.events;

            const event = pool[Math.floor(Math.random() * pool.length)];
            player.activeEvent = event.id; // Store active event ID
            
            // Increase Mastery for exploring
            player.zoneMastery[masteryKey] = Math.min(100, currentMastery + 2);

            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            return res.json({ type: 'event', data: event });
        }

        // 2. Enemy Encounter (40%)
        else if (roll < 75) { 
            // Weighted enemy rarity
            const enemyRarity = (() => {
                const pool = Object.values(DB.rarities);
                const total = pool.reduce((a,b) => a + b.weight, 0);
                let r = Math.random() * total;
                for(const p of pool) {
                    r -= p.weight;
                    if(r<=0) return p.name;
                }
                return 'Common';
            })();

            const possibleEnemies = DB.enemies.filter(e => e.rarity === enemyRarity);
            const enemyTemplate = possibleEnemies.length ? possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] : DB.enemies[0];
            
            // Apply Difficulty
            const enemy = { ...enemyTemplate };
            enemy.maxHp = Math.floor(enemy.maxHp * difficulty.multipliers.enemyHp);
            enemy.hp = enemy.maxHp;
            enemy.xp = Math.floor(enemy.xp * difficulty.multipliers.exp);
            
            // Save Combat State
            player.combat = { inCombat: true, enemy: enemy };
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            // Note: Damage calculation happens during combat turns, but we could scale base stats here if needed

            return res.json({ type: 'enemy', data: enemy });
        } 
        // 3. Item Drop (Remaining chance, approx 15-20% depending on difficulty)
        else if (roll < 90 + (5 * difficulty.multipliers.lootChance)) {
            const rarity = rollRarity(player.calculatedStats.luck);
            const possibleItems = DB.items.filter(i => i.rarity === rarity && !i.gachaExclusive);
            const item = possibleItems.length ? possibleItems[Math.floor(Math.random() * possibleItems.length)] : DB.items[0];
            
            addItemToInventory(player, item.id, 1);
            
            // Increase Mastery
            player.zoneMastery[masteryKey] = Math.min(100, currentMastery + 3);

            // Save State
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            
            return res.json({ type: 'item', data: item });
        } 
        // 4. Text Encounter
        else {
            const text = DB.encounters[Math.floor(Math.random() * DB.encounters.length)];
            
            // Increase Mastery
            player.zoneMastery[masteryKey] = Math.min(100, currentMastery + 1);
            
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            return res.json({ type: 'text', data: text });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Exploration failed' });
    }
});

// Exploration: Gather (Mining/Foraging)
app.post('/api/gather', authenticateToken, async (req, res) => {
    try {
        const { type } = req.body; // 'mining' or 'foraging'
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.gathering) player.gathering = {};
        
        const now = Date.now();
        const cooldownTime = 60 * 1000; // 60 seconds cooldown
        const lastGather = player.gathering[type] || 0;

        if (now - lastGather < cooldownTime) {
            const remaining = Math.ceil((cooldownTime - (now - lastGather)) / 1000);
            return res.status(400).json({ error: `Cooldown active: ${remaining}s` });
        }

        let loot = [];
        let message = "";
        let xpGain = 0;

        if (type === 'mining') {
            // Check for Pickaxe in inventory or equipment
            const hasPickaxe = player.inventory.some(i => i.id === 'item_pickaxe') || 
                               Object.values(player.equipment).some(i => i && i.id === 'item_pickaxe');
            
            if (!hasPickaxe) return res.status(400).json({ error: "Requires Iron Pickaxe" });

            // Roll for ores
            const roll = Math.random();
            if (roll < 0.6) {
                loot.push(DB.items.find(i => i.id === 'mat_stone'));
                message = "You mined some Stone.";
                xpGain = 5;
            } else if (roll < 0.9) {
                loot.push(DB.items.find(i => i.id === 'mat_iron_ore'));
                message = "You found Iron Ore!";
                xpGain = 15;
            } else {
                loot.push(DB.items.find(i => i.id === 'mat_gold_ore'));
                message = "Jackpot! Gold Ore!";
                xpGain = 30;
            }
        } else if (type === 'foraging') {
             // Roll for food/wood
            const roll = Math.random();
            if (roll < 0.5) {
                loot.push(DB.items.find(i => i.id === 'mat_berry'));
                message = "You gathered Wild Berries.";
                xpGain = 5;
            } else if (roll < 0.8) {
                loot.push(DB.items.find(i => i.id === 'mat_wood'));
                message = "You gathered some Wood.";
                xpGain = 10;
            } else {
                loot.push(DB.items.find(i => i.id === 'mat_mushroom'));
                message = "You found a Red Mushroom.";
                xpGain = 15;
            }
        } else {
            return res.status(400).json({ error: "Invalid gathering type" });
        }

        // Add loot
        loot.forEach(item => {
            if (item) {
                addItemToInventory(player, item.id, 1);
            }
        });

        player.xp += xpGain;
        player.gathering[type] = now;

        // Level Up Check
        if (player.xp >= player.maxXp) {
             player.level++;
             player.xp -= player.maxXp;
             player.maxXp = Math.floor(player.maxXp * 1.5);
             player.maxHp += 10;
             player.currentHp = player.maxHp;
        }

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message, loot });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exploration: Set Zone
app.post('/api/explore/setZone', authenticateToken, async (req, res) => {
    try {
        const { zoneIndex } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;
        
        const worldId = player.currentWorld || 'world_green_valley';
        const unlocked = (player.unlockedZones && player.unlockedZones[worldId]) || 0;

        if (zoneIndex > unlocked) return res.status(400).json({ error: "Zone locked." });

        player.currentZone = zoneIndex;
        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Entered Zone ${zoneIndex + 1}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Exploration: Event Choice
app.post('/api/explore/choice', authenticateToken, async (req, res) => {
    try {
        const { choiceId } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.activeEvent) return res.status(400).json({ error: "No active event" });

        const event = DB.events.find(e => e.id === player.activeEvent);
        if (!event) {
            player.activeEvent = null;
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            return res.status(400).json({ error: "Invalid event" });
        }

        const choice = event.choices.find(c => c.id === choiceId);
        if (!choice) return res.status(400).json({ error: "Invalid choice" });

        // Check Requirements
        if (choice.req) {
            if (choice.req.type === 'gold') {
                if (player.gold < choice.req.amount) return res.status(400).json({ error: "Not enough gold" });
                player.gold -= choice.req.amount;
            } 
            else if (choice.req.type === 'item') {
                const itemIndex = player.inventory.findIndex(i => i.id === choice.req.id);
                
                // Check if item is equipped if not in inventory
                let isEquipped = false;
                if (itemIndex === -1 && player.equipment) {
                    isEquipped = Object.values(player.equipment).some(item => item && item.id === choice.req.id);
                }

                if (itemIndex === -1 && !isEquipped) {
                    return res.status(400).json({ error: `Missing required item: ${choice.req.name || 'Unknown Item'}` });
                }
                
                if (choice.req.consume) {
                    if (itemIndex !== -1) {
                        const item = player.inventory[itemIndex];
                        if (item.quantity && item.quantity > 1) {
                            item.quantity--;
                        } else {
                            player.inventory.splice(itemIndex, 1);
                        }
                    }
                    // Note: We generally don't consume equipped items in events, but logic could be added here if needed.
                }
            }
            else if (choice.req.type === 'stat') {
                const statVal = (player.calculatedStats && player.calculatedStats[choice.req.stat]) || 0;
                if (statVal < choice.req.amount) return res.status(400).json({ error: `Requires ${choice.req.amount} ${choice.req.stat}` });
            }
        }

        // Determine Outcome
        let effect = choice.effect;
        let isSuccess = true;

        if (effect.chance && Math.random() > effect.chance) {
            isSuccess = false;
            effect = effect.fail || { type: 'text', message: "Nothing happened." };
        }

        let message = effect.message || choice.text;
        let resultData = {};

        // Apply Effect
        switch (effect.type) {
            case 'heal':
                player.currentHp = Math.min(player.maxHp, player.currentHp + effect.amount);
                message = message || `You healed for ${effect.amount} HP.`;
                break;
            case 'damage':
                player.currentHp = Math.max(0, player.currentHp - effect.amount);
                message = message || `You took ${effect.amount} damage.`;
                break;
            case 'gold':
                player.gold += effect.amount;
                message = message || `You found ${effect.amount} Gold.`;
                break;
            case 'xp':
                player.xp += effect.amount;
                message = message || `You gained ${effect.amount} XP.`;
                // Level up logic could go here (simplified)
                if (player.xp >= player.maxXp) {
                    player.level++;
                    player.xp -= player.maxXp;
                    player.maxXp = Math.floor(player.maxXp * 1.5);
                    player.maxHp += 10;
                    player.currentHp = player.maxHp;
                }
                break;
            case 'item':
                const rarity = effect.rarity || 'Common';
                const possibleItems = DB.items.filter(i => i.rarity === rarity && !i.gachaExclusive);
                const item = possibleItems.length ? possibleItems[Math.floor(Math.random() * possibleItems.length)] : DB.items[0];
                addItemToInventory(player, item.id, 1);
                message = message || `You received: ${item.name}`;
                break;
            case 'combat':
                const enemyRarity = effect.enemyRarity || 'Common';
                const possibleEnemies = DB.enemies.filter(e => e.rarity === enemyRarity);
                const enemyTemplate = possibleEnemies.length ? possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] : DB.enemies[0];
                
                const difficulty = DB.difficulties.find(d => d.id === player.difficulty) || DB.difficulties[1];
                const enemy = { ...enemyTemplate };
                enemy.maxHp = Math.floor(enemy.maxHp * difficulty.multipliers.enemyHp);
                enemy.hp = enemy.maxHp;
                
                player.combat = { inCombat: true, enemy: enemy };
                resultData.combat = enemy;
                message = message || `A ${enemy.name} attacks!`;
                break;
        }

        player.activeEvent = null; // Clear event
        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message, resultData });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Part 6: Core Logic Endpoints ---

// Combat: Attack
app.post('/api/combat/attack', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.combat || !player.combat.inCombat || !player.combat.enemy) {
            return res.status(400).json({ error: "Not in combat" });
        }

        const enemy = player.combat.enemy;
        const stats = player.calculatedStats;
        const log = [];

        // Player hits Enemy
        const playerDmg = Math.floor(Math.random() * (stats.damageMax - stats.damageMin + 1)) + stats.damageMin;
        enemy.hp -= playerDmg;
        log.push(`You hit ${enemy.name} for ${playerDmg} damage.`);

        // Weapon Durability
        if (player.equipment && player.equipment.weapon && player.equipment.weapon.durability > 0) {
            player.equipment.weapon.durability--;
            if (player.equipment.weapon.durability <= 0) {
                player.equipment.weapon.durability = 0;
                log.push("Your weapon has broken!");
                recalculateStats(player);
            }
        }

        let victory = false;
        let defeat = false;
        let loot = [];

        if (enemy.hp <= 0) {
            // Victory
            victory = true;
            player.combat = { inCombat: false, enemy: null };
            player.xp += enemy.xp;
            player.gold += enemy.gold;
            log.push(`Victory! Gained ${enemy.xp} XP and ${enemy.gold} Gold.`);

            // Quest Progress (Hunt)
            if (player.quests && player.quests.active) {
                player.quests.active.forEach(q => {
                    const template = DB.quests.find(t => t.id === q.templateId);
                    if (template && template.type === 'hunt' && template.targetId === enemy.id && !q.isCompleted) {
                        q.progress++;
                        if (q.progress >= template.amount) {
                            q.isCompleted = true;
                            log.push(`Quest Complete: ${template.name}!`);
                        }
                    }
                });
            }

            // Mastery Logic
            const currentWorld = player.currentWorld || 'world_green_valley';
            const currentZone = player.currentZone || 0;
            const masteryKey = `${currentWorld}_${currentZone}`;
            
            if (!player.zoneMastery) player.zoneMastery = {};
            
            if (enemy.rarity === 'Boss') {
                player.zoneMastery[masteryKey] = 0; // Reset mastery on boss kill (Prestige/Farmable)
                log.push("Zone Boss Defeated! Mastery Reset for replayability.");
                
                // Unlock Next Zone
                if (!player.unlockedZones) player.unlockedZones = {};
                const currentUnlocked = player.unlockedZones[currentWorld] || 0;
                if (currentZone === currentUnlocked && currentZone < 2) { // Assuming 3 zones (0,1,2)
                    player.unlockedZones[currentWorld] = currentUnlocked + 1;
                    log.push("New Zone Unlocked!");
                }
            } else {
                player.zoneMastery[masteryKey] = Math.min(100, (player.zoneMastery[masteryKey] || 0) + 5);
            }

            // Level Up
            if (player.xp >= player.maxXp) {
                player.level++;
                player.xp -= player.maxXp;
                player.maxXp = Math.floor(player.maxXp * 1.5);
                player.maxHp += 10;
                player.currentHp = player.maxHp;
                log.push(`Level Up! You are now level ${player.level}.`);
            }

            // --- Special Boss Loot ---
            if (enemy.lootTable) {
                enemy.lootTable.forEach(drop => {
                    if (Math.random() < drop.chance) {
                        const itemData = DB.items.find(i => i.id === drop.itemId);
                        if (itemData) {
                            addItemToInventory(player, itemData.id, 1);
                            loot.push(itemData);
                            log.push(`Boss Drop: ${itemData.name}!`);
                        }
                    }
                });
            }
            
            // Standard Loot (Simplified fallback)
            if (loot.length === 0 && Math.random() < 0.3) {
                 // Standard loot logic could go here
                 // For now, boss loot is the main focus
            }
        } else {
            // Enemy hits Player
            const difficulty = DB.difficulties.find(d => d.id === player.difficulty) || DB.difficulties[1];
            let enemyDmg = Math.floor(Math.random() * 8) + 2;
            enemyDmg = Math.floor(enemyDmg * difficulty.multipliers.enemyDmg);
            
            // Defense mitigation (simple)
            const defense = stats.defense || 0;
            enemyDmg = Math.max(1, enemyDmg - Math.floor(defense / 2));

            player.currentHp -= enemyDmg;
            log.push(`${enemy.name} hits you for ${enemyDmg} damage.`);

            if (player.currentHp <= 0) {
                defeat = true;
                player.currentHp = 0;
                player.combat = { inCombat: false, enemy: null };
                log.push("You were defeated.");
            }
        }

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, log, victory, defeat });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Combat: Heal
app.post('/api/combat/heal', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;
        const cost = 5;
        const amount = 20;

        if (player.gold < cost) return res.status(400).json({ error: "Not enough gold" });
        if (player.currentHp >= player.maxHp) return res.status(400).json({ error: "Full health" });

        player.gold -= cost;
        player.currentHp = Math.min(player.maxHp, player.currentHp + amount);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Healed for ${amount} HP.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Combat: Flee
app.post('/api/combat/flee', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.combat || !player.combat.inCombat) return res.status(400).json({ error: "Not in combat" });

        // Flee Chance Calculation
        const luck = player.calculatedStats.luck || 0;
        const enemyLevel = 1; // Simplified, could store enemy level
        const chance = Math.min(90, Math.max(10, 50 + (luck * 2) - (enemyLevel * 5)));
        
        const roll = Math.random() * 100;
        if (roll < chance) {
            player.combat = { inCombat: false, enemy: null };
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            res.json({ player, success: true, message: "You fled safely!" });
        } else {
            // Fail penalty: Take damage
            const dmg = Math.floor(player.maxHp * 0.1);
            player.currentHp = Math.max(1, player.currentHp - dmg);
            await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
            res.json({ player, success: false, message: `Failed to flee! Took ${dmg} damage.` });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory: Equip
app.post('/api/inventory/equip', authenticateToken, async (req, res) => {
    try {
        const { index } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.inventory[index]) return res.status(400).json({ error: "Item not found" });
        
        const itemInstance = player.inventory[index];
        const itemData = DB.items.find(i => i.id === itemInstance.id);
        
        if (!itemData) return res.status(400).json({ error: "Invalid item data" });

        const type = itemData.type.toLowerCase();
        let targetSlot = type;

        // Handle Multiple Tools
        if (type === 'tool') {
            if (!player.equipment.tool1) targetSlot = 'tool1';
            else if (!player.equipment.tool2) targetSlot = 'tool2';
            else targetSlot = 'tool1'; // Default to swapping tool1 if both full
        }

        if (!['weapon', 'armor', 'head', 'legs', 'feet', 'accessory', 'tool'].includes(type)) {
             return res.status(400).json({ error: "Cannot equip this item" });
        }

        // Unequip existing
        if (player.equipment[targetSlot]) {
            player.inventory.push(player.equipment[targetSlot]);
        }

        // Equip new
        player.equipment[targetSlot] = itemInstance;
        player.inventory.splice(index, 1);

        recalculateStats(player);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory: Unequip
app.post('/api/inventory/unequip', authenticateToken, async (req, res) => {
    try {
        const { slot } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.equipment[slot]) return res.status(400).json({ error: "Slot empty" });

        player.inventory.push(player.equipment[slot]);
        player.equipment[slot] = null;

        recalculateStats(player);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory: Use
app.post('/api/inventory/use', authenticateToken, async (req, res) => {
    try {
        const { index } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        const itemInstance = player.inventory[index];
        if (!itemInstance) return res.status(400).json({ error: "Item not found" });

        const itemData = DB.items.find(i => i.id === itemInstance.id);
        if (itemData.type !== 'Consumable') return res.status(400).json({ error: "Not usable" });

        let msg = "";
        if (itemData.effect && itemData.effect.type === 'heal') {
            const amount = itemData.effect.amount;
            player.currentHp = Math.min(player.maxHp, player.currentHp + amount);
            msg = `Used ${itemData.name}, healed ${amount} HP.`;
        }

        player.inventory.splice(index, 1);
        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: msg });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory: Stack
app.post('/api/inventory/stack', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        const newInventory = [];
        const stackables = {};
        const nonStackables = [];

        // Separate stackable materials from other items
        for (const item of player.inventory) {
            const itemData = DB.items.find(i => i.id === item.id);
            if (itemData && itemData.type === 'Material') {
                stackables[item.id] = (stackables[item.id] || 0) + (item.quantity || 1);
            } else {
                nonStackables.push(item);
            }
        }

        // Re-stack materials
        for (const [id, qty] of Object.entries(stackables)) {
            let remaining = qty;
            while (remaining > 0) {
                const count = Math.min(64, remaining);
                newInventory.push({
                    id: id,
                    instanceId: Date.now() + Math.random(),
                    quantity: count
                });
                remaining -= count;
            }
        }

        // Combine
        player.inventory = [...newInventory, ...nonStackables];

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: "Inventory stacked." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inventory: Split
app.post('/api/inventory/split', authenticateToken, async (req, res) => {
    try {
        const { index } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.inventory[index]) return res.status(400).json({ error: "Item not found" });

        const item = player.inventory[index];
        const qty = item.quantity || 1;

        if (qty < 2) return res.status(400).json({ error: "Cannot split single item" });

        const splitAmount = Math.floor(qty / 2);
        const remaining = qty - splitAmount;

        // Update original
        item.quantity = remaining;

        // Create new stack
        const newStack = { ...item, instanceId: Date.now() + Math.random(), quantity: splitAmount };
        player.inventory.push(newStack);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Split stack into ${remaining} and ${splitAmount}.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gacha: Pull
app.post('/api/gacha/pull', authenticateToken, async (req, res) => {
    try {
        const { bannerId, amount } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        const banner = DB.gacha.find(b => b.id === bannerId);
        if (!banner) return res.status(400).json({ error: "Invalid banner" });

        const totalCost = banner.cost * amount;
        if (player.gold < totalCost) return res.status(400).json({ error: "Not enough gold" });

        player.gold -= totalCost;
        if (typeof player.pity === 'undefined') player.pity = 0;

        const PITY_THRESHOLD = 50;
        const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine', 'Celestial'];
        
        // Find highest rarity in this banner
        const bannerRarities = Object.keys(banner.rates);
        let highestRarity = 'Common';
        for (const r of rarityOrder) {
            if (bannerRarities.includes(r)) highestRarity = r;
        }

        const pulledItems = [];

        for (let i = 0; i < amount; i++) {
            player.pity++;
            let rarity = 'Common';

            if (player.pity >= PITY_THRESHOLD) {
                rarity = highestRarity;
            } else {
                const rand = Math.random() * 100;
                let cumulative = 0;
                for (const [r, chance] of Object.entries(banner.rates)) {
                    cumulative += chance;
                    if (rand < cumulative) {
                        rarity = r;
                        break;
                    }
                }
            }

            if (rarity === highestRarity) player.pity = 0;

            // Filter Items
            let pool = DB.items.filter(i => i.rarity === rarity && i.gachaExclusive);
            if (banner.poolType === 'equipment') {
                pool = pool.filter(i => ['Weapon', 'Armor', 'Head', 'Legs', 'Feet', 'Accessory'].includes(i.type));
            }
            
            // Fallback if pool is empty
            if (pool.length === 0) {
                 pool = DB.items.filter(i => i.rarity === 'Common' && i.gachaExclusive);
            }
            
            // Safety fallback
            if (pool.length === 0) {
                 pool = DB.items.filter(i => i.rarity === 'Common');
            }

            const item = pool[Math.floor(Math.random() * pool.length)];
            addItemToInventory(player, item.id, 1);
            pulledItems.push(item);
        }

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, pulledItems, message: `Summoned ${amount} items.` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Shop: Buy
app.post('/api/shop/buy', authenticateToken, async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        const itemData = DB.items.find(i => i.id === itemId);
        if (!itemData) return res.status(400).json({ error: "Item not found" });

        const price = Math.ceil(itemData.value * 1.5);
        if (player.gold < price) return res.status(400).json({ error: "Not enough gold" });

        player.gold -= price;
        
        addItemToInventory(player, itemData.id, 1);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Bought ${itemData.name}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Shop: Sell
app.post('/api/shop/sell', authenticateToken, async (req, res) => {
    try {
        const { index, price } = req.body; // Trusting client price for simplicity, ideally verify on server
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.inventory[index]) return res.status(400).json({ error: "Item not found" });

        const item = player.inventory[index];
        const qty = item.quantity || 1;
        player.gold += price * qty;
        player.inventory.splice(index, 1);

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Sold item for ${price * qty} G` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Quests: Claim Reward
app.post('/api/quests/claim', authenticateToken, async (req, res) => {
    try {
        const { questIndex } = req.body;
        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.quests || !player.quests.active[questIndex]) {
            return res.status(400).json({ error: "Quest not found" });
        }

        const quest = player.quests.active[questIndex];
        if (quest.isClaimed) return res.status(400).json({ error: "Already claimed" });

        const template = DB.quests.find(t => t.id === quest.templateId);
        if (!template) return res.status(400).json({ error: "Invalid quest template" });

        // Verify Completion
        if (template.type === 'hunt') {
            if (!quest.isCompleted) return res.status(400).json({ error: "Quest not complete" });
        } else if (template.type === 'collect') {
            // Check inventory
            const totalCount = player.inventory.reduce((sum, i) => i.id === template.targetId ? sum + (i.quantity || 1) : sum, 0);
            if (totalCount < template.amount) {
                return res.status(400).json({ error: `Need ${template.amount} ${template.targetName}` });
            }
            // Consume items
            let remaining = template.amount;
            for (let i = player.inventory.length - 1; i >= 0; i--) {
                if (player.inventory[i].id === template.targetId) {
                    const item = player.inventory[i];
                    const qty = item.quantity || 1;
                    if (qty > remaining) {
                        item.quantity -= remaining;
                        remaining = 0;
                    } else {
                        remaining -= qty;
                        player.inventory.splice(i, 1);
                    }
                    if (remaining <= 0) break;
                }
            }
            quest.isCompleted = true; // Mark as complete now
        }

        quest.isClaimed = true;
        player.gold += template.reward.gold;
        player.xp += template.reward.xp;

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: `Claimed: ${template.reward.gold} Gold, ${template.reward.xp} XP` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Marketplace Routes ---

// List Item
app.post('/api/market/list', authenticateToken, async (req, res) => {
    try {
        const { index, price } = req.body;
        if (price <= 0) return res.status(400).json({ error: "Invalid price" });

        const user = await User.findOne({ username: req.user.username });
        const player = user.gameState;

        if (!player.inventory[index]) return res.status(400).json({ error: "Item not found" });

        const itemInstance = player.inventory[index];
        
        // Remove from inventory
        player.inventory.splice(index, 1);

        // Create Listing
        const listing = new MarketListing({
            seller: user.username,
            item: itemInstance,
            price: price
        });
        await listing.save();

        await User.findOneAndUpdate({ username: req.user.username }, { gameState: player });
        res.json({ player, message: "Item listed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Listings
app.get('/api/market/listings', async (req, res) => {
    try {
        const listings = await MarketListing.find().sort({ listedAt: -1 }).limit(50);
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch listings" });
    }
});

// Buy Item
app.post('/api/market/buy', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.body;
        const buyer = await User.findOne({ username: req.user.username });
        const listing = await MarketListing.findById(listingId);

        if (!listing) return res.status(404).json({ error: "Listing not found" });
        if (buyer.gameState.gold < listing.price) return res.status(400).json({ error: "Not enough gold" });
        if (listing.seller === buyer.username) return res.status(400).json({ error: "Cannot buy your own item" });

        // Process Transaction
        buyer.gameState.gold -= listing.price;
        addItemToInventory(buyer.gameState, listing.item.id, listing.item.quantity || 1);

        // Update Seller
        const seller = await User.findOne({ username: listing.seller });
        if (seller) {
            seller.gameState.gold += listing.price;
            await User.findOneAndUpdate({ username: listing.seller }, { gameState: seller.gameState });
        }

        await MarketListing.findByIdAndDelete(listingId);
        await User.findOneAndUpdate({ username: buyer.username }, { gameState: buyer.gameState });

        res.json({ player: buyer.gameState, message: "Item purchased" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel Listing
app.post('/api/market/cancel', authenticateToken, async (req, res) => {
    try {
        const { listingId } = req.body;
        const listing = await MarketListing.findOne({ _id: listingId, seller: req.user.username });
        
        if (!listing) return res.status(404).json({ error: "Listing not found" });

        const user = await User.findOne({ username: req.user.username });
        addItemToInventory(user.gameState, listing.item.id, listing.item.quantity || 1);
        
        await MarketListing.findByIdAndDelete(listingId);
        await User.findOneAndUpdate({ username: req.user.username }, { gameState: user.gameState });

        res.json({ player: user.gameState, message: "Listing cancelled" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leaderboard (Part 5)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topPlayers = await User.find({}, 'username gameState.level gameState.rank')
            .sort({ 'gameState.level': -1 })
            .limit(10);
        
        const leaderboard = topPlayers.map(user => ({
            username: user.username,
            level: user.gameState?.level || 1,
            rank: user.gameState?.rank || 'rank_adventurer'
        }));

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Admin: Get Users
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const requestor = await User.findOne({ username: req.user.username });
        if (!requestor || !requestor.isAdmin) {
            console.log(`[Admin] Access denied for: ${req.user.username}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await User.find({}, 'username gameState.level isAdmin isBanned');
        
        // Create a set of online usernames for fast lookup
        const onlineUsernames = new Set();
        for (const session of onlineUsers.values()) {
            onlineUsernames.add(session.username);
        }

        const userList = users.map(u => ({
            id: u._id,
            username: u.username,
            level: u.gameState?.level || 1,
            isAdmin: u.isAdmin || false,
            isBanned: u.isBanned || false,
            status: onlineUsernames.has(u.username) ? 'Online' : 'Offline'
        }));
        res.json({ users: userList });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Action
app.post('/api/admin/action', authenticateToken, async (req, res) => {
    const { action, targetId, reason } = req.body;
    try {
        const requestor = await User.findOne({ username: req.user.username });
        if (!requestor || !requestor.isAdmin) {
            console.log(`[Admin] Action denied for: ${req.user.username}`);
            return res.status(403).json({ error: 'Access denied' });
        }

        const targetUser = await User.findById(targetId);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (action === 'kick' || action === 'ban') {
            if (action === 'ban') {
                targetUser.isBanned = true;
                await targetUser.save();
            }

            const sockets = await io.fetchSockets();
            for (const socket of sockets) {
                const session = onlineUsers.get(socket.id);
                if (session && session.username === targetUser.username) {
                    socket.emit('force:disconnect', { reason: reason || 'No reason provided.' });
                    
                    // Remove from onlineUsers immediately so the UI update reflects it instantly
                    onlineUsers.delete(socket.id);
                    io.emit('chat:online', Array.from(onlineUsers.values()));

                    // Delay disconnect slightly to allow the API response to flush to the client
                    setTimeout(() => socket.disconnect(true), 100);
                }
            }
        } else if (action === 'unban') {
            targetUser.isBanned = false;
            await targetUser.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error("Admin Action Error:", err);
        res.status(500).json({ error: 'Action failed' });
    }
});

// Route for the main game page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Send existing history to new user
    socket.emit('chat:history', chatHistory);
    socket.emit('chat:online', Array.from(onlineUsers.values()));

    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        if (onlineUsers.has(socket.id)) {
            onlineUsers.delete(socket.id);
            io.emit('chat:online', Array.from(onlineUsers.values()));
        }
    });

    socket.on('chat:join', async (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findOne({ username: decoded.username });
            if (!user) return;

            const rankId = user.gameState.rank || 'rank_adventurer';
            const rankData = DB.ranks.find(r => r.id === rankId);
            const role = rankData ? rankData.name : 'Adventurer';

            onlineUsers.set(socket.id, { username: user.username, role });
            io.emit('chat:online', Array.from(onlineUsers.values()));
        } catch (err) {
            console.error("Chat Join Error:", err.message);
            socket.emit('auth:error');
        }
    });

    // Handle Chat Messages
    socket.on('chat:message', async (payload) => {
        try {
            const { text, token } = payload;
            if (!text || !token) return;

            // Verify User
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findOne({ username: decoded.username });
            if (!user) return;

            // Get Rank Title
            const rankId = user.gameState.rank || 'rank_adventurer';
            const rankData = DB.ranks.find(r => r.id === rankId);
            const title = rankData ? rankData.name : '';

            const msg = {
                sender: user.username,
                text: text.substring(0, 200), // Limit length
                type: 'player',
                title: title,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            chatHistory.push(msg);
            if (chatHistory.length > 50) chatHistory.shift();

            io.emit('chat:message', msg);
        } catch (err) {
            console.error("Chat Error:", err.message);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    const localIp = getLocalIp();
    console.log(`Local Access: http://localhost:${PORT}`);
    if (localIp) {
        console.log(`Network Access: http://${localIp}:${PORT}`);
        console.log('Use the "Network Access" URL on your other devices.');
    }
});