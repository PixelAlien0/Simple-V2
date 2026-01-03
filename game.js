/**
 * Optimized Game Engine
 * Handles State, UI, and Logic
 */

var Game = {
    state: {
        player: {
            level: 1,
            currentHp: 100,
            maxHp: 100,
            xp: 0,
            maxXp: 100,
            gold: 0,
            currentWorld: 'world_green_valley', // Default world
            currentZone: 0,
            unlockedZones: {},
            rank: 'rank_adventurer', // Default rank
            difficulty: 'difficulty_normal', // Default difficulty
            baseStats: {
                damageMin: 5,
                damageMax: 10,
                defense: 0,
                luck: 0
            },
            calculatedStats: {}, // Will be populated by recalculateStats()
            bonusStats: {}, // Will store the added bonus values
            equipment: {
                head: null,
                weapon: null,
                armor: null,
                legs: null,
                feet: null,
                accessory: null,
                tool1: null,
                tool2: null
            },
            inventory: [], // Will now store { id, instanceId, quantity }
            pity: 0,
            zoneMastery: {},
            quests: { active: [], lastGenerated: 0 },
            gathering: { mining: 0, foraging: 0 }
        },
        combat: {
            inCombat: false,
            enemy: null
        },
        settings: {
            theme: 'light'
        }
    },
    token: null,
    currentUser: null,

    // --- Core Functions ---
    init() {
        this.network.init();
        this.auth.init();
        console.log("Game Engine Initialized (Auth Phase)");
    },

    start() {
        // this.load(); // Disabled local load, state is now loaded during login

        // Grant Admin permissions to specific user
        if (this.currentUser === 'GGGGG') {
            this.state.player.role = 'admin';
            this.state.player.title = 'Admin';
        }

        this.items.recalculateStats();
        this.ranks.updateRank();
        this.ui.init();
        this.settings.initDifficulty();
        this.settings.updateThemeUI();
        this.ui.updateAll();
        this.chat.init();

        // Start Gathering Timer Loop
        if (this.gatheringTimer) clearInterval(this.gatheringTimer);
        this.gatheringTimer = setInterval(() => this.explore.updateGatheringTimers(), 1000);
        
        // UI Transition
        const authPage = document.getElementById('auth-page');
        const gameLayout = document.getElementById('game-layout');
        
        if(authPage) {
            authPage.style.opacity = '0';
            setTimeout(() => {
                authPage.classList.add('hidden');
                if(gameLayout) {
                    gameLayout.classList.remove('hidden');
                    void gameLayout.offsetWidth; // Trigger reflow
                    gameLayout.classList.remove('opacity-0');
                }
            }, 500);
        }

        console.log("Game Started");
    },

    async save() {
        if (!this.currentUser) return;
        
        // Visual feedback for save
        const btn = document.getElementById('btn-save-game');
        if(btn) {
            const originalText = btn.innerText;
            btn.innerText = "Saved!";
            btn.classList.add("bg-green-500", "text-white", "border-transparent");
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove("bg-green-500", "text-white", "border-transparent");
            }, 1500);
        }

        try {
            await fetch('/api/save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ 
                    gameState: this.state.player 
                })
            });
        } catch(e) {
            console.error("Save failed", e);
        }
    },

    // --- Auth Module ---
    auth: {
        init() {
            // Auto-login check
            const token = localStorage.getItem('optimizedRPG_token');
            if (token) {
                // Verify token and load state
                fetch('/api/gamestate', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Invalid token');
                })
                .then(data => {
                    Game.token = token;
                    Game.currentUser = data.username;
                    if (data.gameState && Object.keys(data.gameState).length > 0) {
                        Game.state.player = { ...Game.state.player, ...data.gameState };
                    }
                    Game.start();
                })
                .catch(() => {
                    localStorage.removeItem('optimizedRPG_token');
                });
            }

            // Initialize Parallax for Auth Page
            document.addEventListener('mousemove', (e) => {
                const text = document.getElementById('auth-parallax-text');
                if (text) {
                    const x = (window.innerWidth / 2 - e.pageX) / 40;
                    const y = (window.innerHeight / 2 - e.pageY) / 40;
                    text.style.transform = `translate(${x}px, ${y}px)`;
                }
            });
        },

        toggleForm(form) {
            const loginForm = document.getElementById('login-form');
            const regForm = document.getElementById('register-form');
            
            if (form === 'register') {
                loginForm.classList.add('hidden');
                regForm.classList.remove('hidden');
                regForm.classList.add('animate-fade-in-up');
            } else {
                regForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                loginForm.classList.add('animate-fade-in-up');
            }
        },

        async loginSubmit() {
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value.trim();
            const remember = document.getElementById('login-remember').checked;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                });
                
                const data = await response.json();

                if (response.ok) {
                    if (remember) {
                        localStorage.setItem('optimizedRPG_token', data.token);
                    } else {
                        localStorage.removeItem('optimizedRPG_token');
                    }

                    Game.token = data.token;
                    Game.currentUser = u;
                    // Load game state from server
                    if (data.gameState && Object.keys(data.gameState).length > 0) {
                        // Merge server state into default player state
                        Game.state.player = { ...Game.state.player, ...data.gameState };
                    }
                    Game.start();
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                const btn = document.querySelector('#login-form button');
                const originalText = btn.innerText;
                btn.classList.add('bg-red-500', 'text-white');
                btn.innerText = err.message || "Login Failed";
                setTimeout(() => {
                    btn.classList.remove('bg-red-500', 'text-white');
                    btn.innerText = originalText;
                }, 1500);
            }
        },

        async registerSubmit() {
            const u = document.getElementById('reg-username').value.trim();
            const p = document.getElementById('reg-password').value.trim();

            if (!u || !p) return;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Account created! Please login.");
                    this.toggleForm('login');
                } else {
                    throw new Error(data.error);
                }
            } catch (err) {
                alert(err.message || "Registration Failed");
            }
        },

        logout() {
            localStorage.removeItem('optimizedRPG_token');
            location.reload();
        }
    },

    // --- Network Module ---
    network: {
        socket: null,
        init() {
            if (typeof io !== 'undefined') {
                this.socket = io();
                this.socket.on('connect', () => {
                    console.log('Connected to server with ID:', this.socket.id);
                    if (Game.token) {
                        this.socket.emit('chat:join', Game.token);
                    }
                });

                this.socket.on('force:disconnect', (data) => {
                    alert(`You have been disconnected by an admin.\nReason: ${data.reason}`);
                    Game.auth.logout();
                });

                this.socket.on('auth:error', () => {
                    Game.auth.logout();
                });

                this.socket.on('disconnect', (reason) => {
                    // 'io server disconnect' means the server forcibly disconnected the socket (kick/ban)
                    if (reason === 'io server disconnect') {
                        alert('You have been disconnected from the server.');
                        Game.auth.logout();
                    }
                });
            }
        }
    },

    // --- Logic Modules ---
    settings: {
        toggleTheme() {
            const current = Game.state.settings.theme;
            const newTheme = current === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        setTheme(themeName) {
            Game.state.settings.theme = themeName;
            const html = document.documentElement;
            if (themeName === 'dark') {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
            Game.save();
            this.updateThemeUI();

            // Update Auth Page Icon
            const authIcon = document.getElementById('auth-theme-icon');
            if (authIcon) {
                authIcon.innerText = themeName === 'dark' ? '☀️' : '🌙';
            }
        },

        updateThemeUI() {
            const lightBtn = document.getElementById('btn-theme-light');
            const darkBtn = document.getElementById('btn-theme-dark');
            if (lightBtn && darkBtn) {
                const isDark = Game.state.settings.theme === 'dark' || (Game.state.settings.theme === undefined && document.documentElement.classList.contains('dark'));
                
                lightBtn.className = `flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${!isDark ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`;
                darkBtn.className = `flex-1 p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${isDark ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`;
            }
        },
        
        initDifficulty() {
            const select = document.getElementById('settings-difficulty-select');
            if (!select) return;
            
            select.innerHTML = DB.difficulties.map(diff => 
                `<option value="${diff.id}" ${Game.state.player.difficulty === diff.id ? 'selected' : ''}>${diff.name}</option>`
            ).join('');
            
            this.updateDifficultyDescription(Game.state.player.difficulty);
        },

        changeDifficulty(diffId) {
            Game.state.player.difficulty = diffId;
            Game.ui.log(`Difficulty changed to ${DB.difficulties.find(d => d.id === diffId).name}.`);
            Game.save();
            this.updateDifficultyDescription(diffId);
        },

        updateDifficultyDescription(diffId) {
            const descEl = document.getElementById('settings-difficulty-description');
            if (!descEl) return;

            const diff = DB.difficulties.find(d => d.id === diffId);
            if (!diff) return;

            const m = diff.multipliers;
            const formatPct = (val) => {
                const pct = Math.round((val - 1) * 100);
                return pct > 0 ? `+${pct}%` : `${pct}%`;
            };

            let benefits = [];
            let downsides = [];

            // XP
            if (m.exp > 1) benefits.push(`XP Gain: <span class="text-green-600 dark:text-green-400 font-bold">${formatPct(m.exp)}</span>`);
            else if (m.exp < 1) downsides.push(`XP Gain: <span class="text-red-600 dark:text-red-400 font-bold">${formatPct(m.exp)}</span>`);

            // Loot Chance
            if (m.lootChance > 1) benefits.push(`Loot Chance: <span class="text-green-600 dark:text-green-400 font-bold">${formatPct(m.lootChance)}</span>`);
            else if (m.lootChance < 1) downsides.push(`Loot Chance: <span class="text-red-600 dark:text-red-400 font-bold">${formatPct(m.lootChance)}</span>`);

            // Enemy HP (Lower is better)
            if (m.enemyHp < 1) benefits.push(`Enemy HP: <span class="text-green-600 dark:text-green-400 font-bold">${formatPct(m.enemyHp)}</span>`);
            else if (m.enemyHp > 1) downsides.push(`Enemy HP: <span class="text-red-600 dark:text-red-400 font-bold">${formatPct(m.enemyHp)}</span>`);

            // Enemy Damage (Lower is better)
            if (m.enemyDmg < 1) benefits.push(`Enemy Dmg: <span class="text-green-600 dark:text-green-400 font-bold">${formatPct(m.enemyDmg)}</span>`);
            else if (m.enemyDmg > 1) downsides.push(`Enemy Dmg: <span class="text-red-600 dark:text-red-400 font-bold">${formatPct(m.enemyDmg)}</span>`);

            let html = `<div class="mt-3 p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm">`;
            
            if (benefits.length > 0) html += `<div class="mb-2"><span class="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest">Benefits</span><div class="grid grid-cols-2 gap-2 mt-1 text-gray-700 dark:text-gray-300">${benefits.map(b => `<div>• ${b}</div>`).join('')}</div></div>`;
            if (downsides.length > 0) html += `<div><span class="font-bold text-gray-900 dark:text-white uppercase text-[10px] tracking-widest">Downsides</span><div class="grid grid-cols-2 gap-2 mt-1 text-gray-700 dark:text-gray-300">${downsides.map(d => `<div>• ${d}</div>`).join('')}</div></div>`;
            if (benefits.length === 0 && downsides.length === 0) html += `<div class="text-gray-500 italic">Standard game experience. Balanced for all players.</div>`;

            html += `</div>`;
            descEl.innerHTML = html;
        }
    },

    ranks: {
        updateRank() {
            const level = Game.state.player.level;
            let currentRank = DB.ranks[0]; // Default

            // Find the highest rank the player qualifies for
            for (let i = DB.ranks.length - 1; i >= 0; i--) {
                if (level >= DB.ranks[i].minLevel) {
                    currentRank = DB.ranks[i];
                    break;
                }
            }

            if (Game.state.player.rank !== currentRank.id) {
                Game.state.player.rank = currentRank.id;
                // Could add a notification here
            }
        }
    },

    items: {
        givePlayerItem(itemId, source = 'found') { // source can be 'found', 'dropped', 'bought'
            const itemData = DB.items.find(i => i.id === itemId);
            if (!itemData) return null;
        
            // Stacking Logic
            let added = false;
            if (itemData.type === 'Material') {
                const stack = Game.state.player.inventory.find(i => i.id === itemId && (i.quantity || 1) < 64);
                if (stack) {
                    if (!stack.quantity) stack.quantity = 1;
                    if (stack.quantity < 64) {
                        stack.quantity++;
                        added = true;
                    }
                }
            }

            if (!added) {
                const newItemInstance = { id: itemData.id, instanceId: Date.now() + Math.random(), quantity: 1 };
                if (itemData.maxDurability) newItemInstance.durability = itemData.maxDurability;
                Game.state.player.inventory.push(newItemInstance);
            }

            // Centralized toast notification
            let actionText = 'Acquired';
            let icon = '📦';
            let toastType = 'item';

            if (source === 'found') {
                actionText = 'Discovered';
                icon = '✨';
            } else if (source === 'dropped') {
                actionText = 'Loot Dropped';
                icon = '🎒';
            } else if (source === 'bought') {
                actionText = 'Purchased';
                icon = '🛍️';
            } else if (source === 'gacha') {
                actionText = 'Summoned';
                icon = '🌟';
                toastType = 'gacha';
            }
            
            const toastMessage = `
                <div class="flex items-center gap-4">
                    <div class="text-3xl filter drop-shadow-sm">${icon}</div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">${actionText}</span>
                        <span class="font-black text-lg leading-none rarity-${itemData.rarity}">${itemData.name}</span>
                    </div>
                </div>`;
            
            if (Game.ui.toast) {
                Game.ui.toast.show(toastMessage, toastType, itemData.rarity);
            }

            return itemData; // return data for logging
        },

        async useItem(inventoryIndex) {
            const result = await API.inventory.use(inventoryIndex);
            if (result) {
                Game.state.player = result.player;
                Game.ui.log(result.message);
                Game.ui.updateAll();
            }
        },
    
        async equipItem(inventoryIndex) {
            const result = await API.inventory.equip(inventoryIndex);
            if (result) {
                Game.state.player = result.player;
                Game.ui.log("Equipped item.");
                Game.ui.updateAll();
            }
        },
    
        async unequipItem(slot) {
            const result = await API.inventory.unequip(slot);
            if (result) {
                Game.state.player = result.player;
                Game.ui.log("Unequipped item.");
                Game.ui.updateAll();
            }
        },
    
        recalculateStats() {
            const player = Game.state.player;
            // Start with a fresh copy of base stats
            const finalStats = JSON.parse(JSON.stringify(player.baseStats));
            const bonusStats = { damageMin: 0, damageMax: 0, defense: 0, luck: 0 };
    
            // Add stats from equipment
            for (const slot in player.equipment) {
                const equippedInstance = player.equipment[slot];
                if (equippedInstance) {
                    // Check durability - if 0, item provides no stats
                    if (equippedInstance.durability !== undefined && equippedInstance.durability <= 0) {
                        continue;
                    }
                    const itemData = DB.items.find(i => i.id === equippedInstance.id);
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
            player.calculatedStats = finalStats;
            player.bonusStats = bonusStats;
        },

        async stackInventory() {
            const result = await API.inventory.stack();
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                Game.ui.updateAll();
            }
        },

        async splitItem(index) {
            const result = await API.inventory.split(index);
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                Game.ui.updateAll();
            }
        },

        repairItem(location, indexOrSlot) {
            const player = Game.state.player;
            let itemInstance = location === 'inventory' ? player.inventory[indexOrSlot] : player.equipment[indexOrSlot];
            
            if (!itemInstance) return;
            const itemData = DB.items.find(i => i.id === itemInstance.id);
            if (!itemData || !itemData.maxDurability) return;

            const missing = itemData.maxDurability - itemInstance.durability;
            if (missing <= 0) return;

            // Cost formula: 50% of item value to repair from 0 to 100%
            const cost = Math.max(1, Math.ceil(missing * (itemData.value / itemData.maxDurability) * 0.5));

            if (player.gold >= cost) {
                player.gold -= cost;
                itemInstance.durability = itemData.maxDurability;
                Game.ui.log(`Repaired ${itemData.name} for ${cost} G.`);
                Game.items.recalculateStats();
                Game.ui.updateAll();
            } else {
                Game.ui.log(`Not enough gold! Need ${cost} G.`);
            }
        },

        rollItem(difficulty) {
            // Weighted rarity selection with Luck factor
            const luck = Game.state.player.calculatedStats.luck || 0;
            
            // Clone rarities to modify weights locally based on luck
            const rarityPool = Object.values(DB.rarities).map(r => ({...r}));

            // Apply Luck: Increase weight of non-common items (e.g., 10 Luck = +100% weight for rares)
            rarityPool.forEach(r => {
                if (r.name !== 'Common') {
                    r.weight = Math.floor(r.weight * (1 + (luck * 0.1)));
                }
            });

            const totalWeight = rarityPool.reduce((sum, rarity) => sum + rarity.weight, 0);
            let randomWeight = Math.random() * totalWeight;
            let chosenRarity = "Common"; // Default

            for (const rarity of rarityPool) {
                randomWeight -= rarity.weight;
                if (randomWeight <= 0) {
                    chosenRarity = rarity.name;
                    break;
                }
            }

            const possibleItems = DB.items.filter(item => item.rarity === chosenRarity && !item.gachaExclusive);
            if (possibleItems.length === 0) {
                // Fallback to common if no items of chosen rarity exist
                const commonItems = DB.items.filter(item => item.rarity === "Common" && !item.gachaExclusive);
                if (commonItems.length > 0) {
                    return commonItems[Math.floor(Math.random() * commonItems.length)];
                }
                return null; // No items at all?
            }

            return possibleItems[Math.floor(Math.random() * possibleItems.length)];
        }
    },
    explore: {
        isCooldown: false,
        activeTab: 'adventure',
        async performAction() {
            if (Game.state.combat.inCombat) {
                Game.ui.log("You are busy with an enemy!");
                return;
            }

            if (this.isCooldown) return;

            // Trigger Cooldown
            this.isCooldown = true;
            const btn = document.getElementById('btn-explore');
            if (btn) {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                setTimeout(() => {
                    this.isCooldown = false;
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }, 1000);
            }

            try {
                // Check if we are challenging boss
                const btn = document.getElementById('btn-explore');
                let action = null;
                if (btn && btn.textContent.includes("CHALLENGE BOSS")) {
                    action = 'boss';
                }

                const result = await API.request('/api/explore', 'POST', { action });
                if (!result) return;

                // Update player state if returned (some endpoints might return it)
                // For explore, we mostly get encounter data

                if (result.type === 'enemy') {
                    Game.combat.startCombat(result.data);
                } else if (result.type === 'event') {
                    this.renderEvent(result.data);
                } else if (result.type === 'item') {
                    // Server already added to DB, update local state
                    Game.items.givePlayerItem(result.data.id, 'found');

                    const itemData = result.data;
                    Game.ui.log(`You stumble upon something! You found <span class="rarity-${itemData.rarity}">${itemData.name}</span>.`);
                    
                    // Show Toast
                    const toastMessage = `<div class="flex items-center gap-4"><div class="text-3xl filter drop-shadow-sm">✨</div><div class="flex flex-col"><span class="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">Discovered</span><span class="font-black text-lg leading-none rarity-${itemData.rarity}">${itemData.name}</span></div></div>`;
                    if (Game.ui.toast) Game.ui.toast.show(toastMessage, 'item', itemData.rarity);
                    
                    Game.ui.updateAll();
                } else if (result.type === 'text') {
                    Game.ui.log(result.data);
                }

            } catch (e) {
                console.error(e);
                Game.ui.log("Connection error.");
            }
        },

        renderEvent(event) {
            // Create modal HTML
            const modal = document.createElement('div');
            modal.id = 'event-modal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    <h3 class="text-2xl font-black uppercase tracking-tighter mb-4 text-gray-900 dark:text-white">${event.title}</h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">${event.description}</p>
                    <div class="flex flex-col gap-3">
                        ${event.choices.map(c => {
                            let reqHtml = '';
                            if (c.req) {
                                if (c.req.type === 'gold') reqHtml = `<div class="text-xs text-yellow-600 dark:text-yellow-500 mt-1 font-mono font-bold">Requires: ${c.req.amount} Gold</div>`;
                                else if (c.req.type === 'item') reqHtml = `<div class="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono font-bold">Requires: ${c.req.name}</div>`;
                                else if (c.req.type === 'stat') reqHtml = `<div class="text-xs text-purple-600 dark:text-purple-400 mt-1 font-mono font-bold">Requires: ${c.req.amount} ${c.req.stat.charAt(0).toUpperCase() + c.req.stat.slice(1)}</div>`;
                            }
                            
                            return `
                            <button onclick="Game.explore.selectChoice('${c.id}')" class="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
                                <div class="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${c.text}</div>
                                ${reqHtml}
                            </button>
                        `}).join('')}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        async selectChoice(choiceId) {
            const modal = document.getElementById('event-modal');
            if (modal) modal.remove();

            try {
                const result = await API.request('/api/explore/choice', 'POST', { choiceId });
                if (result) {
                    Game.state.player = result.player;
                    Game.ui.log(result.message);
                    
                    if (result.resultData && result.resultData.combat) {
                        Game.combat.startCombat(result.resultData.combat);
                    }

                    Game.ui.updateAll();
                }
            } catch (e) {
                console.error(e);
                Game.ui.log("Event error.");
            }
        }
        ,
        async setZone(index) {
            const result = await API.request('/api/explore/setZone', 'POST', { zoneIndex: index });
            if (result) {
                Game.state.player = result.player;
                Game.ui.log(result.message);
                Game.ui.updateAll();
            }
        },

        switchTab(tab) {
            this.activeTab = tab;
            const advPanel = document.getElementById('explore-adventure-panel');
            const gathPanel = document.getElementById('explore-gathering-panel');
            const advBtn = document.getElementById('tab-btn-adventure');
            const gathBtn = document.getElementById('tab-btn-gathering');

            const activeClasses = ['bg-white', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white', 'shadow-sm'];
            const inactiveClasses = ['text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-200'];

            if (tab === 'adventure') {
                advPanel.classList.remove('hidden');
                gathPanel.classList.add('hidden');
                
                advBtn.classList.add(...activeClasses);
                advBtn.classList.remove(...inactiveClasses);
                
                gathBtn.classList.remove(...activeClasses);
                gathBtn.classList.add(...inactiveClasses);
            } else {
                advPanel.classList.add('hidden');
                gathPanel.classList.remove('hidden');

                gathBtn.classList.add(...activeClasses);
                gathBtn.classList.remove(...inactiveClasses);
                
                advBtn.classList.remove(...activeClasses);
                advBtn.classList.add(...inactiveClasses);
            }
            this.updateGatheringTimers();
        },

        async gather(type) {
            const result = await API.request('/api/gather', 'POST', { type });
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                if (result.loot && result.loot.length > 0) {
                    result.loot.forEach(item => {
                        Game.ui.toast.show(`+1 ${item.name}`, "item", item.rarity);
                    });
                }
                Game.ui.updateAll();
                this.updateGatheringTimers();
            }
        },

        updateGatheringTimers() {
            if (this.activeTab !== 'gathering') return;
            const now = Date.now();
            ['mining', 'foraging'].forEach(type => {
                const last = (Game.state.player.gathering && Game.state.player.gathering[type]) || 0;
                const diff = 60000 - (now - last);
                const btn = document.getElementById(`btn-gather-${type}`);
                const timer = document.getElementById(`timer-${type}`);
                
                if (diff > 0) {
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                    if (timer) timer.innerText = `Cooldown: ${Math.ceil(diff / 1000)}s`;
                } else {
                    if (btn) {
                        btn.disabled = false;
                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                    if (timer) timer.innerText = "Ready";
                }
            });
        }
    },

    combat: {
        findEnemy() {
            if (Game.state.combat.inCombat) return;

            // Weighted rarity selection
            const totalWeight = Object.values(DB.rarities).reduce((sum, rarity) => sum + rarity.weight, 0);
            let randomWeight = Math.random() * totalWeight;
            let chosenRarity = "Common"; // Default

            for (const rarity of Object.values(DB.rarities)) {
                randomWeight -= rarity.weight;
                if (randomWeight <= 0) {
                    chosenRarity = rarity.name;
                    break;
                }
            }

            const possibleEnemies = DB.enemies.filter(enemy => enemy.rarity === chosenRarity);
            if (possibleEnemies.length === 0) {
                Game.ui.log("The wilds are eerily quiet...");
                return;
            }

            const enemyTemplate = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
            const difficulty = DB.difficulties.find(d => d.id === Game.state.player.difficulty) || DB.difficulties[1];

            Game.state.combat.enemy = { ...enemyTemplate }; // Clone
            
            // Apply Difficulty Multipliers
            Game.state.combat.enemy.maxHp = Math.floor(Game.state.combat.enemy.maxHp * difficulty.multipliers.enemyHp);
            Game.state.combat.enemy.hp = Game.state.combat.enemy.maxHp;
            Game.state.combat.enemy.xp = Math.floor(Game.state.combat.enemy.xp * difficulty.multipliers.exp);

            Game.state.combat.inCombat = true;

            Game.ui.log(`You encountered a <span class="rarity-${enemyTemplate.rarity}">${enemyTemplate.name}</span>!`);
            Game.ui.updateCombat();
        },

        startCombat(enemyData) {
            if (Game.state.combat.inCombat) return;
            
            Game.state.combat.enemy = enemyData;
            Game.state.combat.inCombat = true;
            Game.ui.log(`You encountered a <span class="rarity-${enemyData.rarity}">${enemyData.name}</span>!`);
            Game.ui.updateCombat();
        },

        async attack() {
            if (!Game.state.combat.inCombat) return;

            const result = await API.combat.attack();
            if (!result) return;

            Game.state.player = result.player;
            
            // Log messages from server
            if (result.log) {
                result.log.forEach(msg => Game.ui.log(msg));
            }

            if (result.victory) {
                Game.state.combat.inCombat = false;
                Game.state.combat.enemy = null;
            } else if (result.defeat) {
                Game.state.combat.inCombat = false;
                Game.state.combat.enemy = null;
            } else {
                // Update local enemy HP for display
                // Note: Server doesn't return full enemy object usually, but we can infer or server can return it
                // For now, let's assume we just update player and logs. 
                // To update enemy HP bar correctly, we might need enemy state back.
                // Let's assume the server updates the player.combat.enemy object in the returned player state?
                // Yes, in server.js we updated player.combat.enemy.hp
                if (result.player.combat && result.player.combat.enemy) {
                    Game.state.combat.enemy = result.player.combat.enemy;
                }
            }

            // Visual Flash
            document.getElementById('explore-enemy-stats').classList.add('animate-damage-flash');
            setTimeout(() => document.getElementById('explore-enemy-stats').classList.remove('animate-damage-flash'), 400);

            Game.ui.updateAll();
        },

        async heal() {
            const result = await API.combat.heal();
            if (!result) return;

            Game.state.player = result.player;
            Game.ui.log(result.message);
            
            // Visual Flash
            document.getElementById('explore-player-stats').classList.add('animate-heal-flash');
            setTimeout(() => document.getElementById('explore-player-stats').classList.remove('animate-heal-flash'), 400);
            
            Game.ui.updateAll();
        },

        async flee() {
            const result = await API.request('/api/combat/flee', 'POST', {});
            if (result) {
                Game.state.player = result.player;
                Game.ui.log(result.message);
                if (result.success) {
                    Game.state.combat.inCombat = false;
                    Game.state.combat.enemy = null;
                }
                Game.ui.updateAll();
            }
        },

        winCombat() {
            const enemy = Game.state.combat.enemy;
            Game.state.combat.inCombat = false;
            Game.state.combat.enemy = null;

            Game.state.player.xp += enemy.xp;
            Game.state.player.gold += enemy.gold;

            Game.ui.log(`Victory! Gained ${enemy.xp} XP and ${enemy.gold} Gold.`);
            
            // Level Up Check
            if (Game.state.player.xp >= Game.state.player.maxXp) {
                Game.state.player.level++;
                Game.state.player.xp -= Game.state.player.maxXp;
                Game.state.player.maxXp = Math.floor(Game.state.player.maxXp * DB.mechanics.XP_LEVEL_MULTIPLIER);
                Game.state.player.maxHp += DB.mechanics.HP_GAIN_PER_LEVEL;
                Game.state.player.currentHp = Game.state.player.maxHp;
                Game.ranks.updateRank(); // Check for rank up
                Game.ui.log(`<strong class="text-yellow-400">Level Up! You are now level ${Game.state.player.level}.</strong>`);
            }

            // --- Enemy Specific Loot Drops ---
            if (enemy.loot && enemy.loot.length > 0) {
                let itemsDropped = [];
                const difficulty = DB.difficulties.find(d => d.id === Game.state.player.difficulty) || DB.difficulties[1];
                const luck = Game.state.player.calculatedStats.luck || 0;
                const luckModifier = 1 + (luck * 0.05); // 5% chance increase per luck point

                enemy.loot.forEach(drop => {
                    const finalChance = Math.min(1, drop.chance * difficulty.multipliers.lootChance * luckModifier);
                    if (Math.random() < finalChance) {
                        // Determine quantity
                        const quantity = Array.isArray(drop.quantity) 
                            ? Math.floor(Math.random() * (drop.quantity[1] - drop.quantity[0] + 1)) + drop.quantity[0]
                            : (drop.quantity || 1);
                        
                        for (let i = 0; i < quantity; i++) {
                            const itemData = Game.items.givePlayerItem(drop.itemId, 'dropped');
                            if (itemData) {
                                itemsDropped.push(itemData);
                            }
                        }
                    }
                });
                if (itemsDropped.length > 0) {
                    Game.ui.log(`The enemy dropped: ${itemsDropped.map(i => `<span class="rarity-${i.rarity}">${i.name}</span>`).join(', ')}.`);
                }
            }
        },

        loseCombat() {
            Game.state.combat.inCombat = false;
            Game.state.combat.enemy = null;
            Game.ui.log(`<span class="text-red-500">You were defeated. Rest to recover.</span>`);
            Game.state.player.currentHp = 1; // Mercy
        }
    },

    shop: {
        renderShop() {
            const player = Game.state.player;
            const goldEl = document.getElementById('shop-player-gold');
            if(goldEl) goldEl.innerText = player.gold;

            // Buy List
            const buyList = document.getElementById('shop-buy-list');
            if(buyList) {
                // Filter: Only show Common items (Starting items) and exclude Materials
                buyList.innerHTML = DB.items.filter(item => !item.gachaExclusive && item.rarity === 'Common' && item.type !== 'Material').map(item => {
                    const price = Math.ceil(item.value * 1.5); // Markup
                    const canAfford = player.gold >= price;
                    return `
                        <div class="group flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-300">
                            <div class="flex flex-col gap-1 mb-4 sm:mb-0">
                                <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">${item.type}</span>
                                <span class="text-xl font-black tracking-tight text-gray-900 dark:text-white rarity-${item.rarity}">${item.name}</span>
                                ${item.stats ? 
                                    `<div class="text-xs text-gray-500 font-mono mt-1 flex items-center gap-3">
                                        ${Object.entries(item.stats).map(([k,v]) => 
                                            `<span>${k.substring(0,3).toUpperCase()} <span class="text-gray-900 dark:text-gray-300 font-bold">+${v}</span></span>`
                                        ).join('<span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>')}
                                    </div>` 
                                    : ''}
                            </div>
                            <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                <div class="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-tighter">
                                    ${price}<span class="text-xs text-gray-400 ml-1 font-sans font-normal">G</span>
                                </div>
                                <button class="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-20 disabled:cursor-not-allowed" 
                                    onclick="Game.shop.buyItem('${item.id}', ${price})" ${canAfford ? '' : 'disabled'}>
                                    Purchase
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Sell List
            const sellList = document.getElementById('shop-sell-list');
            if(sellList) {
                if (player.inventory.length === 0) {
                    sellList.innerHTML = `
                        <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                            <span class="text-4xl mb-2">🎒</span>
                            <span class="text-xs font-bold uppercase tracking-widest">Inventory Empty</span>
                        </div>`;
                } else {
                    sellList.innerHTML = player.inventory.map((itemInstance, index) => {
                        const item = DB.items.find(i => i.id === itemInstance.id);
                        if (!item) return '';
                        const qty = itemInstance.quantity || 1;
                        const sellPrice = item.value * qty;
                        const qtyText = qty > 1 ? ` x${qty}` : '';
                        return `
                            <div class="group flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-300">
                                <div class="flex flex-col gap-1 mb-4 sm:mb-0">
                                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">${item.type}</span>
                                    <span class="text-xl font-black tracking-tight text-gray-900 dark:text-white rarity-${item.rarity}">${item.name}${qtyText}</span>
                                </div>
                                <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                    <div class="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-tighter">
                                        ${sellPrice}<span class="text-xs text-gray-400 ml-1 font-sans font-normal">G</span>
                                    </div>
                                    <button class="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-500 transition-colors" 
                                        onclick="Game.shop.sellItem(${index}, ${sellPrice})">
                                        Sell
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        },

        async buyItem(itemId, price) {
            const result = await API.shop.buy(itemId);
            if (result) {
                Game.state.player = result.player;
                Game.ui.log(result.message);
                Game.ui.updateAll();
                this.renderShop();
            }
        },

        async sellItem(inventoryIndex, price) {
            const result = await API.shop.sell(inventoryIndex, price);
            if (result) {
                Game.state.player = result.player;
                Game.ui.log(result.message);
                Game.ui.updateAll();
                this.renderShop();
            }
        }
    },

    gacha: {
        renderGacha() {
            const container = document.getElementById('gacha-banners');
            if (!container) return;

            const goldEl = document.getElementById('gacha-player-gold');
            if (goldEl) goldEl.innerText = Game.state.player.gold;

            container.innerHTML = DB.gacha.map(banner => {
                const canAfford = Game.state.player.gold >= banner.cost;
                const canAfford10 = Game.state.player.gold >= (banner.cost * 10);
                return `
                    <div class="group flex flex-col p-8 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-8 opacity-5 text-9xl grayscale group-hover:grayscale-0 transition-all duration-500 select-none pointer-events-none">
                            ${banner.image}
                        </div>
                        <div class="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <div class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Summon Banner</div>
                                <h3 class="text-3xl font-black tracking-tighter text-gray-900 dark:text-white mb-2">${banner.name}</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">${banner.description}</p>
                                
                                <div class="flex gap-4 mb-6">
                                    ${Object.entries(banner.rates).map(([rarity, rate]) => `
                                        <div class="flex flex-col">
                                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${rarity}</span>
                                            <span class="font-mono font-bold rarity-${rarity}">${rate}%</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="flex items-center justify-between mt-4">
                                <div>
                                    <div class="font-mono text-2xl font-bold text-gray-900 dark:text-white tracking-tighter">
                                        ${banner.cost}<span class="text-xs text-gray-400 ml-1 font-sans font-normal">G</span>
                                    </div>
                                    <div class="text-[10px] font-bold uppercase tracking-wider text-purple-500 mt-1">Pity: ${Game.state.player.pity || 0} / 50</div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold uppercase tracking-[0.15em] hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
                                        onclick="Game.gacha.pull('${banner.id}', 1)" ${canAfford ? '' : 'disabled'}>
                                        Summon
                                    </button>
                                    <button class="px-4 py-3 bg-purple-600 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg" 
                                        onclick="Game.gacha.pull('${banner.id}', 10)" ${canAfford10 ? '' : 'disabled'}>
                                        10x
                                    </button>
                                    <button class="px-3 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-none" onclick="Game.gacha.viewPool('${banner.id}')" title="View Pool">
                                        ℹ️
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        async pull(bannerId, amount = 1) {
            const result = await API.gacha.pull(bannerId, amount);
            if (result) {
                Game.state.player = result.player;
                Game.ui.updateAll();
                this.renderGacha();
                this.showResults(result.pulledItems);
            }
        },

        viewPool(bannerId) {
            const banner = DB.gacha.find(b => b.id === bannerId);
            if (!banner) return;

            const rarities = Object.keys(banner.rates);
            let pool = DB.items.filter(i => {
                if (!rarities.includes(i.rarity)) return false;
                if (banner.poolType === 'equipment') {
                    return ['Weapon', 'Armor', 'Head', 'Legs', 'Feet', 'Accessory'].includes(i.type);
                }
                return true;
            });

            // Sort by Rarity then Name
            const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine', 'Celestial'];
            pool.sort((a, b) => {
                return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity) || a.name.localeCompare(b.name);
            });

            this.showResults(pool, true);
        },

        showResults(items, isPreview = false) {
            const modal = document.getElementById('gacha-result-modal');
            const grid = document.getElementById('gacha-result-grid');
            const content = document.getElementById('gacha-modal-content');
            
            if (!modal || !grid) return;

            grid.innerHTML = items.map((item, index) => {
                let icon = '📦';
                if (item.type === 'Weapon') icon = '⚔️';
                if (item.type === 'Armor') icon = '🛡️';
                if (item.type === 'Accessory') icon = '💍';
                if (item.type === 'Consumable') icon = '🧪';

                // Check for high rarity to add special effects
                const isHighRarity = ['Rare', 'Epic', 'Legendary', 'Mythic', 'Divine', 'Celestial'].includes(item.rarity);
                const glowClass = isHighRarity ? 'shadow-[0_0_15px_rgba(255,215,0,0.3)] dark:shadow-[0_0_15px_rgba(255,215,0,0.15)] border-yellow-400/30' : 'border-gray-100 dark:border-gray-700';
                
                // Reduce animation delay for large lists (preview)
                const delay = isPreview ? Math.min(index * 30, 1000) : index * 100;

                return `
                <div class="relative group flex flex-col items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border ${glowClass} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 opacity-0 animate-fade-in-up min-h-[160px]" style="animation-delay: ${delay}ms; animation-fill-mode: forwards;">
                    ${isHighRarity ? `<div class="absolute inset-0 bg-gradient-to-br from-yellow-100/20 to-transparent dark:from-yellow-900/20 rounded-xl pointer-events-none"></div>` : ''}
                    <div class="relative z-10 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">${item.type}</div>
                    <div class="relative z-10 text-5xl mb-3 filter drop-shadow-sm transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">${icon}</div>
                    <div class="relative z-10 w-full text-center">
                        <div class="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 rarity-${item.rarity}">${item.rarity}</div>
                        <div class="font-black text-sm leading-tight rarity-${item.rarity}">${item.name}</div>
                    </div>
                </div>
            `}).join('');

            modal.classList.remove('hidden');
            // Trigger reflow
            void modal.offsetWidth;
            modal.classList.remove('opacity-0');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        },

        closeResults() {
            const modal = document.getElementById('gacha-result-modal');
            const content = document.getElementById('gacha-modal-content');
            if (!modal) return;

            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    },

    chat: {
        messages: [],
        typingTimeout: null,
        onlineUsers: [],
        
        init() {
            if (this.messages.length === 0) {
                this.addMessage('System', 'Connection established. Welcome to the local channel.', 'system');
            }
            
            // Socket Listeners
            if (Game.network.socket) {
                Game.network.socket.off('chat:message');
                Game.network.socket.off('chat:history');
                Game.network.socket.off('chat:online');

                Game.network.socket.on('chat:history', (history) => {
                    this.messages = history;
                    this.renderChat();
                });

                Game.network.socket.on('chat:message', (msg) => {
                    this.messages.push(msg);
                    if (this.messages.length > 50) this.messages.shift();
                    this.renderChat();
                });

                Game.network.socket.on('chat:online', (users) => {
                    this.onlineUsers = users.map(u => ({
                        name: u.username,
                        role: u.role,
                        status: 'online',
                        isSelf: u.username === Game.currentUser
                    }));
                    this.renderUserList();
                });

                if (Game.token) {
                    Game.network.socket.emit('chat:join', Game.token);
                }
            }
        },

        renderChat() {
            const log = document.getElementById('chat-log');
            if (!log) return;

            const currentUser = Game.currentUser || 'Player';

            log.innerHTML = this.messages.map(msg => {
                let alignClass = 'self-start';
                let bubbleClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-xl rounded-br-xl rounded-bl-xl';
                let senderClass = 'text-gray-500 dark:text-gray-400';

                if (msg.type === 'system') {
                    alignClass = 'self-center my-2';
                    bubbleClass = 'bg-gray-200 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs py-1 px-4 rounded-full border border-gray-300 dark:border-gray-700';
                    return `<div class="${alignClass} ${bubbleClass} font-mono font-bold tracking-wide">${msg.text}</div>`;
                }

                if (msg.sender === currentUser) {
                    alignClass = 'self-end';
                    bubbleClass = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tl-xl rounded-bl-xl rounded-br-xl shadow-md';
                    senderClass = 'text-right text-gray-400 dark:text-gray-500';
                } else {
                    // Other players (if multiplayer existed)
                    bubbleClass += ' shadow-sm border border-gray-100 dark:border-gray-700';
                }
                
                // Title Logic
                let titleHtml = '';
                if (msg.title) {
                    titleHtml = `<span class="text-[8px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 px-1 rounded mx-1">${msg.title}</span>`;
                }

                return `
                    <div class="flex flex-col ${alignClass} max-w-[80%] animate-fade-in-up group">
                        <div class="flex items-center mb-1 px-1 ${msg.sender === currentUser ? 'flex-row-reverse' : ''}">
                            <span class="text-[10px] font-bold uppercase tracking-widest ${senderClass}">${msg.sender}</span>
                            ${titleHtml}
                            <span class="text-[9px] font-mono text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mx-2">${msg.time}</span>
                        </div>
                        <div class="px-4 py-2 ${bubbleClass} text-sm font-medium break-words leading-relaxed">${msg.text}</div>
                    </div>
                `;
            }).join('');
            
            log.scrollTop = log.scrollHeight;
            this.renderUserList();
        },

        handleTyping() {
            const indicator = document.getElementById('chat-typing-indicator');
            if (!indicator) return;

            indicator.innerText = "You are typing...";
            indicator.classList.remove('opacity-0');

            if (this.typingTimeout) clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                indicator.classList.add('opacity-0');
            }, 1000);
        },

        sendMessage() {
            const input = document.getElementById('chat-input');
            if (!input) return;
            
            const text = input.value.trim();
            if (!text) return;

            if (Game.network.socket) {
                Game.network.socket.emit('chat:message', { text, token: Game.token });
            }
            
            input.value = '';

            // Clear typing indicator immediately
            const indicator = document.getElementById('chat-typing-indicator');
            if (indicator) indicator.classList.add('opacity-0');
        },

        addMessage(sender, text, type = 'general', title = null) {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.messages.push({ sender, text, type, time, title });
            if (this.messages.length > 50) this.messages.shift();
            
            if (!document.getElementById('chat-page').classList.contains('hidden-page')) {
                this.renderChat();
            }
        },

        clearChat() {
            this.messages = [];
            this.renderChat();
        },

        renderUserList() {
            const list = document.getElementById('chat-user-list');
            const count = document.getElementById('chat-online-count');
            if (!list || !count) return;

            // Update self name if changed
            const currentUser = Game.currentUser || 'Player';
            const selfUser = this.onlineUsers.find(u => u.isSelf);
            if (selfUser) selfUser.name = currentUser;

            count.innerText = this.onlineUsers.length;

            list.innerHTML = this.onlineUsers.map(user => `
                <div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-default group">
                    <div class="relative">
                        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                            ${user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white dark:border-gray-900 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}"></div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold ${user.isSelf ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}">${user.name}</span>
                        <span class="text-[10px] text-gray-400 uppercase tracking-wider">${user.role}</span>
                    </div>
                </div>
            `).join('');
        }
    },

    marketplace: {
        async render() {
            // Update Gold Display
            const goldEl = document.getElementById('market-player-gold');
            if (goldEl) goldEl.innerText = Game.state.player.gold;

            // Render Sell List immediately
            this.renderSellList();

            const container = document.getElementById('market-listings');
            if (!container) return;

            container.innerHTML = '<div class="text-center text-gray-500 animate-pulse font-mono">Loading market data...</div>';

            try {
                const listings = await API.market.getListings();
                if (!listings) {
                    container.innerHTML = '<div class="text-center text-red-500 font-mono">Failed to load market.</div>';
                    return;
                }

                // Sort listings by price (cheapest first)
                listings.sort((a, b) => a.price - b.price);

                if (listings.length === 0) {
                    container.innerHTML = `
                        <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 py-12 col-span-full">
                            <span class="text-4xl mb-2">🏪</span>
                            <span class="text-xs font-bold uppercase tracking-widest">Market Empty</span>
                        </div>`;
                } else {
                    container.innerHTML = listings.map(listing => {
                        const item = listing.item;
                        const itemData = DB.items.find(i => i.id === item.id) || item;
                        const isSelf = listing.seller === Game.currentUser;

                        return `
                        <div class="group flex flex-col p-4 border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 shadow-sm">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Seller: ${listing.seller}</span>
                                ${isSelf ? '<span class="text-[10px] font-bold uppercase tracking-widest text-blue-500">You</span>' : ''}
                            </div>
                            
                            <div class="mb-3">
                                <span class="text-lg font-black tracking-tight text-gray-900 dark:text-white rarity-${itemData.rarity}">${itemData.name}</span>
                                ${itemData.stats ? 
                                    `<div class="text-xs text-gray-500 font-mono mt-1 flex flex-wrap gap-2">
                                        ${Object.entries(itemData.stats).map(([k,v]) => 
                                            `<span>${k.substring(0,3).toUpperCase()} <span class="text-gray-900 dark:text-gray-300 font-bold">+${v}</span></span>`
                                        ).join('')}
                                    </div>` 
                                    : ''}
                            </div>

                            <div class="mt-auto flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
                                <div class="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-tighter">
                                    ${listing.price}<span class="text-xs text-gray-400 ml-1 font-sans font-normal">G</span>
                                </div>
                                ${isSelf ? 
                                    `<button class="px-4 py-1 border border-red-200 dark:border-red-900 text-red-500 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                                        onclick="Game.marketplace.cancel('${listing._id}')">
                                        Cancel
                                    </button>` :
                                    `<button class="px-4 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors" 
                                        onclick="Game.marketplace.buy('${listing._id}', ${listing.price})">
                                        Buy
                                    </button>`
                                }
                            </div>
                        </div>`;
                    }).join('');
                }
            } catch (e) {
                console.error(e);
                container.innerHTML = '<div class="text-center text-red-500 font-mono">Error loading market.</div>';
            }
        },

        renderSellList() {
            const select = document.getElementById('market-sell-select');
            if (!select) return;

            const player = Game.state.player;
            
            // Reset options
            select.innerHTML = '<option value="">Select an item...</option>';

            if (player.inventory.length === 0) return;

            player.inventory.forEach((itemInstance, index) => {
                const item = DB.items.find(i => i.id === itemInstance.id);
                if (!item) return;
                
                const option = document.createElement('option');
                option.value = index;
                const qty = itemInstance.quantity || 1;
                option.text = `${item.name}${qty > 1 ? ` x${qty}` : ''} (Val: ${item.value * qty}G)`;
                select.appendChild(option);
            });
        },

        async listItem() {
            const select = document.getElementById('market-sell-select');
            const priceInput = document.getElementById('market-sell-price');
            
            if (!select || !priceInput) return;
            
            const index = select.value;
            const price = parseInt(priceInput.value);
            
            if (index === "" || index === null) {
                Game.ui.toast.show("Please select an item", "error");
                return;
            }
            
            if (!price || price <= 0) {
                Game.ui.toast.show("Invalid price", "error");
                return;
            }

            const result = await API.market.list(index, price);
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                Game.ui.updateAll();
                
                // Reset form
                select.value = "";
                priceInput.value = "";
                
                this.render(); // Refresh market
            }
        },

        async buy(listingId, price) {
            if (Game.state.player.gold < price) {
                Game.ui.toast.show("Not enough gold", "error");
                return;
            }

            const result = await API.market.buy(listingId);
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                Game.ui.updateAll();
                this.render();
            }
        },

        async cancel(listingId) {
            const result = await API.market.cancel(listingId);
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "info");
                Game.ui.updateAll();
                this.render();
            }
        }
    },

    admin: {
        async render() {
            const list = document.getElementById('admin-user-list');
            if (!list) return;
            
            list.innerHTML = '<div class="text-center p-8 text-gray-400 animate-pulse">Loading user data...</div>';

            try {
                // Attempt to fetch users from API, fallback to chat users for UI demo if API not ready
                const response = await API.request('/api/admin/users', 'GET');
                let users = response ? response.users : null;
                
                if (!users || !Array.isArray(users)) {
                    users = Game.chat.onlineUsers.map(u => ({ 
                        username: u.name, 
                        status: 'Online', 
                        role: u.role 
                    }));
                }

                if (users.length === 0) {
                    list.innerHTML = '<div class="text-center p-8 text-gray-500 italic">No active users found.</div>';
                    return;
                }

                list.innerHTML = users.map(u => `
                    <div class="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-lg">
                                ${u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div class="font-bold text-gray-900 dark:text-white text-lg">${u.username}</div>
                                <div class="text-xs text-gray-500 uppercase tracking-wider font-bold flex items-center gap-2">
                                    <span class="${u.role === 'admin' ? 'text-red-500' : 'text-blue-500'}">${u.role || 'Player'}</span>
                                    <span>•</span>
                                    <span class="${u.status === 'Online' ? 'text-green-500' : 'text-gray-400'}">${u.status || 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onclick="Game.admin.kick('${u.id}', '${u.username}')" class="px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-600 border border-yellow-200 hover:bg-yellow-50 dark:border-yellow-900/30 dark:hover:bg-yellow-900/20 rounded transition-colors shadow-sm">Kick</button>
                            ${u.isBanned ? 
                                `<button onclick="Game.admin.unban('${u.id}', '${u.username}')" class="px-4 py-2 text-xs font-bold uppercase tracking-widest text-green-600 border border-green-200 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20 rounded transition-colors shadow-sm">Unban</button>` : 
                                `<button onclick="Game.admin.ban('${u.id}', '${u.username}')" class="px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 rounded transition-colors shadow-sm">Ban</button>`
                            }
                        </div>
                    </div>
                `).join('');

            } catch (e) {
                console.error(e);
                list.innerHTML = '<div class="text-center p-8 text-red-500">Failed to load user list.</div>';
            }
        },

        async kick(userId, username) {
            const reason = prompt(`Enter reason for kicking ${username}:`);
            if (reason === null) return; // Cancelled

            const result = await API.request('/api/admin/action', 'POST', { action: 'kick', targetId: userId, reason });
            if (result && result.success) {
                Game.ui.toast.show(`Kicked ${username}`, 'success');
                this.render();
            } else {
                Game.ui.toast.show(result?.error || 'Failed to kick user', 'error');
            }
        },

        async ban(userId, username) {
            const reason = prompt(`Enter reason for BANNING ${username}:`);
            if (reason === null) return;

            if (!confirm(`Are you sure you want to BAN ${username}?`)) return;
            
            const result = await API.request('/api/admin/action', 'POST', { action: 'ban', targetId: userId, reason });
            if (result && result.success) {
                Game.ui.toast.show(`Banned ${username}`, 'success');
                this.render();
            } else {
                Game.ui.toast.show(result?.error || 'Failed to ban user', 'error');
            }
        },

        async unban(userId, username) {
            if (!confirm(`Are you sure you want to UNBAN ${username}?`)) return;
            
            const result = await API.request('/api/admin/action', 'POST', { action: 'unban', targetId: userId });
            if (result && result.success) {
                Game.ui.toast.show(`Unbanned ${username}`, 'success');
                this.render();
            } else {
                Game.ui.toast.show(result?.error || 'Failed to unban user', 'error');
            }
        }
    },

    quests: {
        renderQuests() {
            const container = document.getElementById('quests-list');
            if (!container) return;

            const quests = Game.state.player.quests.active || [];
            
            if (quests.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-500 italic">No active quests. Check back tomorrow!</div>';
                return;
            }

            container.innerHTML = quests.map((q, index) => {
                const template = DB.quests.find(t => t.id === q.templateId);
                if (!template) return '';

                let progressText = '';
                let btnState = 'disabled';
                let btnText = 'In Progress';
                let btnClass = 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed';

                if (template.type === 'hunt') {
                    progressText = `${q.progress} / ${template.amount}`;
                    if (q.isCompleted) {
                        btnState = '';
                        btnText = 'Claim Reward';
                        btnClass = 'bg-green-600 text-white hover:bg-green-700 shadow-lg animate-pulse';
                    }
                } else if (template.type === 'collect') {
                    // Calculate current amount in inventory
                    const currentAmount = Game.state.player.inventory.reduce((sum, i) => i.id === template.targetId ? sum + (i.quantity || 1) : sum, 0);
                    progressText = `${currentAmount} / ${template.amount}`;
                    if (currentAmount >= template.amount) {
                        btnState = '';
                        btnText = 'Deliver Items';
                        btnClass = 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg';
                    }
                }

                if (q.isClaimed) {
                    btnText = 'Completed';
                    btnClass = 'bg-transparent text-green-500 border border-green-500 opacity-50';
                    btnState = 'disabled';
                    progressText = 'Done';
                }

                return `
                <div class="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">${template.type}</span>
                            <h3 class="text-lg font-black text-gray-900 dark:text-white">${template.name}</h3>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${template.description}</p>
                        <div class="flex gap-4 text-xs font-mono text-gray-500">
                            <span>Reward: <span class="text-yellow-600 font-bold">${template.reward.gold}G</span></span>
                            <span>XP: <span class="text-purple-600 font-bold">${template.reward.xp}</span></span>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-2 min-w-[120px]">
                        <div class="text-2xl font-black font-mono text-gray-300 dark:text-gray-700">${progressText}</div>
                        <button onclick="Game.quests.claim(${index})" ${btnState} class="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${btnClass}">
                            ${btnText}
                        </button>
                    </div>
                </div>`;
            }).join('');
        },

        async claim(index) {
            const result = await API.request('/api/quests/claim', 'POST', { questIndex: index });
            if (result) {
                Game.state.player = result.player;
                Game.ui.toast.show(result.message, "success");
                Game.ui.updateAll();
                this.renderQuests();
            }
        }
    },

    // --- UI Controller ---
    ui: {
        inventoryFilter: 'all',
        toast: {
            show(message, type = 'info', rarity = null) { // type can be 'success', 'error', 'info', 'item', 'gacha'
                let container = document.getElementById('toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'toast-container';
                    container.className = 'fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none';
                    document.body.appendChild(container);
                }
        
                const toast = document.createElement('div');
                
                // Base styles for a sleek card look
                let baseClasses = "pointer-events-auto relative w-80 p-4 rounded-xl shadow-2xl backdrop-blur-md border transform transition-all duration-500 ease-out translate-x-10 opacity-0 flex items-center";
                let themeClasses = "";

                if (type === 'item' || type === 'gacha') {
                    // Glassmorphism style for items
                    themeClasses = "bg-white/90 dark:bg-gray-900/95 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white";
                    
                    if (type === 'gacha') {
                        themeClasses += " border-purple-500/50 shadow-purple-500/20";
                    } else if (rarity && ['Rare', 'Epic', 'Legendary', 'Mythic', 'Divine', 'Celestial'].includes(rarity)) {
                        // Subtle glow for high rarity
                        themeClasses += " shadow-lg";
                    }
                } else if (type === 'success') {
                    themeClasses = "bg-green-500 text-white border-green-600 shadow-green-500/30";
                } else if (type === 'error') {
                    themeClasses = "bg-red-500 text-white border-red-600 shadow-red-500/30";
                } else {
                    // Info / Default
                    themeClasses = "bg-blue-600 text-white border-blue-700 shadow-blue-500/30";
                }
        
                toast.className = `${baseClasses} ${themeClasses}`;
                
                // Handle message content
                if (!message.includes('<div')) {
                    toast.innerHTML = `<div class="font-bold text-sm">${message}</div>`;
                } else {
                    toast.innerHTML = message;
                }
        
                container.appendChild(toast);
        
                // Animate in
                requestAnimationFrame(() => {
                    toast.classList.remove('opacity-0', 'translate-x-10');
                    toast.classList.add('opacity-100', 'translate-x-0');
                });
        
                // Animate out and remove
                setTimeout(() => {
                    toast.classList.remove('opacity-100', 'translate-x-0');
                    toast.classList.add('opacity-0', 'translate-x-10');
                    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
                }, 4000); // 4 seconds visible
            }
        },
        init() {
            // Set initial theme
            if (Game.state.settings.theme === 'light') document.documentElement.classList.remove('dark');
        },

        switchPage(pageId) {
            document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden-page'));
            document.getElementById(pageId === 'dashboard' ? 'game-dashboard-page' : pageId + '-page').classList.remove('hidden-page');
            if (pageId === 'worlds') this.renderWorlds();
            if (pageId === 'ranks') this.renderRanks();
            if (pageId === 'shop') Game.shop.renderShop();
            if (pageId === 'gacha') Game.gacha.renderGacha();
            if (pageId === 'settings') Game.settings.initDifficulty();
            if (pageId === 'quests') Game.quests.renderQuests();
            if (pageId === 'chat') Game.chat.renderChat();
            if (pageId === 'leaderboard') this.renderLeaderboard();
            if (pageId === 'marketplace') Game.marketplace.render();
            if (pageId === 'admin') Game.admin.render();
            if (pageId === 'marketplace') {
                if (Game.marketplace) {
                    Game.marketplace.render();
                } else {
                    console.error("Marketplace module is missing or failed to initialize.");
                    this.toast.show("Marketplace unavailable", "error");
                }
            }

        },

        updateAll() {
            const p = Game.state.player;
            
            // Dashboard
            document.getElementById('dash-hp').innerText = `${p.currentHp} / ${p.maxHp}`;
            document.getElementById('dash-xp').innerText = `${p.xp} / ${p.maxXp}`;
            document.getElementById('dash-gold').innerText = p.gold;
            document.getElementById('dash-level').innerText = p.level;
            document.getElementById('xp-progress-bar').style.width = `${(p.xp / p.maxXp) * 100}%`;
            
            const rankData = DB.ranks.find(r => r.id === p.rank) || DB.ranks[0];
            document.getElementById('dash-rank').innerText = rankData.name;
            document.getElementById('explore-world-name').innerText = DB.worlds.find(w => w.id === p.currentWorld)?.name || 'Unknown';
            
            // --- Zone Selector UI ---
            const worldData = DB.worlds.find(w => w.id === p.currentWorld);
            const currentZoneIndex = p.currentZone || 0;
            const unlockedIndex = (p.unlockedZones && p.unlockedZones[p.currentWorld]) || 0;
            
            let zoneSelector = document.getElementById('explore-zone-selector');
            if (!zoneSelector) {
                const header = document.querySelector('#explore-page header');
                zoneSelector = document.createElement('div');
                zoneSelector.id = 'explore-zone-selector';
                zoneSelector.className = "flex gap-2 mt-2 justify-center";
                header.appendChild(zoneSelector);
            }
            
            if (worldData && worldData.zones) {
                zoneSelector.innerHTML = worldData.zones.map((zone, idx) => {
                    const isUnlocked = idx <= unlockedIndex;
                    const isActive = idx === currentZoneIndex;
                    const style = isActive ? "bg-blue-600 text-white" : (isUnlocked ? "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300" : "bg-gray-100 dark:bg-gray-900 text-gray-300 dark:text-gray-700 cursor-not-allowed");
                    return `<button onclick="${isUnlocked ? `Game.explore.setZone(${idx})` : ''}" class="px-3 py-1 text-xs font-bold uppercase rounded ${style}">${zone.name}</button>`;
                }).join('');
            }

            // --- Zone Mastery UI ---
            const currentWorld = p.currentWorld || 'world_green_valley';
            const masteryKey = `${currentWorld}_${currentZoneIndex}`;
            const mastery = (p.zoneMastery && p.zoneMastery[masteryKey]) ? p.zoneMastery[masteryKey] : 0;
            
            // Inject Mastery Bar if not present
            let masteryContainer = document.getElementById('explore-mastery-container');
            if (!masteryContainer) {
                const header = document.querySelector('#explore-page header');
                if (header) {
                    masteryContainer = document.createElement('div');
                    masteryContainer.id = 'explore-mastery-container';
                    masteryContainer.className = "w-full max-w-md mt-4";
                    header.appendChild(masteryContainer);
                }
            }
            if (masteryContainer) {
                masteryContainer.innerHTML = `
                    <div class="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                        <span>Zone Mastery</span>
                        <span>${mastery}%</span>
                    </div>
                    <div class="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500" style="width: ${mastery}%"></div>
                    </div>
                `;
            }

            // Update Explore Button for Boss
            const btnExplore = document.getElementById('btn-explore');
            if (btnExplore && !Game.state.combat.inCombat) {
                if (mastery >= 100) {
                    btnExplore.innerHTML = '<span class="text-xl block mb-1">☠️</span> CHALLENGE BOSS';
                    btnExplore.className = "col-span-2 game-button bg-red-600 hover:bg-red-700 text-white py-4 text-sm shadow-md animate-pulse";
                } else {
                    btnExplore.innerHTML = '<span class="text-xl block mb-1">🧭</span> Explore';
                    btnExplore.className = "col-span-2 game-button bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 py-4 text-sm shadow-md";
                }
            }
            
            const stats = p.calculatedStats;
            const bonus = p.bonusStats || {};
            const fmtBonus = (val) => val > 0 ? `<span class="text-green-500 text-sm ml-2 font-bold">(+${val})</span>` : '';

            document.getElementById('dash-damage').innerHTML = `${stats.damageMin} - ${stats.damageMax} ${fmtBonus(bonus.damageMax)}`;
            document.getElementById('dash-defense').innerHTML = `${stats.defense} ${fmtBonus(bonus.defense)}`;
            
            const luckEl = document.getElementById('dash-luck');
            if(luckEl) luckEl.innerHTML = `${stats.luck} ${fmtBonus(bonus.luck)}`;

            // Combat Stats
            document.getElementById('combat-hp').innerText = `${p.currentHp} / ${p.maxHp}`;
            const hpBar = document.getElementById('combat-hp-bar');
            if(hpBar) hpBar.style.width = `${(p.currentHp / p.maxHp) * 100}%`;

            document.getElementById('combat-damage').innerText = `${stats.damageMin} - ${stats.damageMax}`;
            document.getElementById('combat-defense').innerText = stats.defense;
            
            const xpEl = document.getElementById('combat-xp-text');
            if(xpEl) xpEl.innerText = `${p.xp} / ${p.maxXp}`;
            
            const xpBar = document.getElementById('combat-xp-bar');
            if(xpBar) xpBar.style.width = `${(p.xp / p.maxXp) * 100}%`;

            const lvlEl = document.getElementById('combat-level');
            if(lvlEl) lvlEl.innerText = p.level;

            // Admin Panel Visibility Check
            const adminBtn = document.getElementById('btn-admin-panel');
            if (adminBtn) {
                // Check if player has 'Admin' title or role
                if (p.title === 'Admin' || p.role === 'admin') {
                    adminBtn.classList.remove('hidden');
                }
            }

            this.updateCombat();
            this.renderInventory();
            this.renderEquipment();
        },

        updateCombat() {
            const combat = Game.state.combat;
            const enemyStats = document.getElementById('explore-enemy-stats');
            const btnExplore = document.getElementById('btn-explore');
            const btnAttack = document.getElementById('btn-attack');
            const btnFlee = document.getElementById('btn-flee');

            if (combat.inCombat && combat.enemy) {
                enemyStats.classList.remove('opacity-50');
                document.getElementById('enemy-name').innerHTML = `<span class="rarity-${combat.enemy.rarity}">${combat.enemy.name}</span>`;
                document.getElementById('enemy-hp').innerText = `${combat.enemy.hp} / ${combat.enemy.maxHp}`;
                const enemyHpBar = document.getElementById('enemy-hp-bar');
                if(enemyHpBar) enemyHpBar.style.width = `${(combat.enemy.hp / combat.enemy.maxHp) * 100}%`;
                
                btnExplore.disabled = true;
                btnAttack.disabled = false;
                if(btnFlee) btnFlee.disabled = false;
            } else {
                enemyStats.classList.add('opacity-50');
                document.getElementById('enemy-name').innerText = "None";
                document.getElementById('enemy-hp').innerText = "0";
                const enemyHpBar = document.getElementById('enemy-hp-bar');
                if(enemyHpBar) enemyHpBar.style.width = `0%`;

                btnExplore.disabled = false;
                btnAttack.disabled = true;
                if(btnFlee) btnFlee.disabled = true;
            }
        },

        log(msg) {
            const dialog = document.getElementById('explore-dialog');
            dialog.innerHTML = `<p>${msg}</p>` + dialog.innerHTML;
            if (dialog.children.length > 5) dialog.lastChild.remove();
        },

        renderEquipment() {
            const slotsContainer = document.getElementById('equipment-slots');
            if (!slotsContainer) return; // Guard against being on the wrong page
            const equipment = Game.state.player.equipment;
            let html = '';
        
            const slotOrder = ['head', 'weapon', 'armor', 'legs', 'feet', 'accessory', 'tool1', 'tool2'];
        
            for (const slot of slotOrder) {
                const itemInstance = equipment[slot];
                let itemData = null;
                if (itemInstance) {
                    itemData = DB.items.find(i => i.id === itemInstance.id);
                }

                // Durability UI
                let durabilityHtml = '';
                let repairBtn = '';
                if (itemInstance && itemData && itemData.maxDurability) {
                    const isBroken = itemInstance.durability <= 0;
                    const durPercent = (itemInstance.durability / itemData.maxDurability) * 100;
                    const durColor = isBroken ? 'text-red-500' : (durPercent < 30 ? 'text-yellow-500' : 'text-gray-400');
                    
                    durabilityHtml = `<div class="text-[10px] font-mono mt-1 ${durColor}">${isBroken ? 'BROKEN' : `DUR: ${itemInstance.durability}/${itemData.maxDurability}`}</div>`;

                    if (itemInstance.durability < itemData.maxDurability) {
                        const cost = Math.max(1, Math.ceil((itemData.maxDurability - itemInstance.durability) * (itemData.value / itemData.maxDurability) * 0.5));
                        repairBtn = `<button class="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400 hover:text-blue-600 transition-colors mr-3" onclick="Game.items.repairItem('equipment', '${slot}')">Repair (${cost}G)</button>`;
                    }
                }
                
                html += `
                    <div class="group relative p-6 min-h-[10rem] flex flex-col justify-between border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300">
                        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">${slot}</span>
                `;
                if (itemData) {
                    html += `
                        <div class="flex flex-col gap-1 my-2">
                            <div class="text-2xl font-black tracking-tight text-gray-900 dark:text-white rarity-${itemData.rarity} leading-none">${itemData.name}</div>
                            ${durabilityHtml}
                            ${itemData.stats ? 
                                `<div class="text-xs text-gray-500 font-mono mt-2 flex flex-wrap gap-2">
                                    ${Object.entries(itemData.stats).map(([k,v]) => 
                                        `<span>${k.substring(0,3).toUpperCase()} <span class="text-gray-900 dark:text-gray-300 font-bold">+${v}</span></span>`
                                    ).join('<span class="text-gray-300 dark:text-gray-700">/</span>')}
                                </div>` 
                                : ''}
                        </div>
                        <div class="flex justify-end">
                            ${repairBtn}
                            <button class="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400 hover:text-red-600 transition-colors" onclick="Game.items.unequipItem('${slot}')">Unequip</button>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="flex-grow flex items-center justify-center opacity-10">
                            <span class="text-3xl font-thin text-gray-400 dark:text-gray-600 tracking-widest">EMPTY</span>
                        </div>
                        <div></div>`;
                }
                html += `</div>`;
            }
            slotsContainer.innerHTML = html;
        },

        renderWorlds() {
            const list = document.getElementById('worlds-list');
            if (!list) return;
            
            list.innerHTML = DB.worlds.map(world => {
                const isLocked = Game.state.player.level < world.minLevel;
                const isCurrent = Game.state.player.currentWorld === world.id;
                
                return `
                <div class="p-6 rounded-none border ${isCurrent ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'} flex flex-col justify-between relative group transition-all hover:border-gray-400 dark:hover:border-gray-600">
                    ${isCurrent ? '<div class="absolute top-2 right-2 text-xs font-bold uppercase tracking-widest text-blue-500">Current</div>' : ''}
                    <div>
                        <h3 class="text-2xl font-black uppercase tracking-tighter ${world.colorClass} mb-2">${world.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${world.description}</p>
                        <div class="text-xs font-bold uppercase tracking-widest text-gray-400">Min Level: ${world.minLevel}</div>
                    </div>
                    <button 
                        onclick="Game.ui.selectWorld('${world.id}')" 
                        class="mt-6 game-button text-xs !py-1 !px-3 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}" 
                        ${isLocked ? 'disabled' : ''}>
                        ${isLocked ? 'Locked' : (isCurrent ? 'Exploring' : 'Travel')}
                    </button>
                </div>`;
            }).join('');
        },

        selectWorld(worldId) {
            Game.state.player.currentWorld = worldId;
            this.switchPage('explore');
            this.updateAll();
            this.log(`Traveled to ${DB.worlds.find(w => w.id === worldId).name}.`);
        },

        renderRanks() {
            const list = document.getElementById('ranks-list');
            if (!list) return;

            list.innerHTML = DB.ranks.map(rank => {
                const isCurrent = Game.state.player.rank === rank.id;
                const isUnlocked = Game.state.player.level >= rank.minLevel;

                return `
                <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${isCurrent ? 'bg-gray-50 dark:bg-gray-800/50' : ''}">
                    <div>
                        <div class="text-lg font-bold ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}">${rank.name}</div>
                        <div class="text-xs text-gray-500">${rank.description}</div>
                    </div>
                    <div class="text-xs font-mono font-bold ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}">Lvl ${rank.minLevel}+</div>
                </div>`;
            }).join('');
        },

        async renderLeaderboard() {
            const list = document.getElementById('leaderboard-list');
            if (!list) return;

            list.innerHTML = '<div class="text-center text-gray-500 animate-pulse font-mono">Loading data...</div>';

            try {
                const response = await fetch('/api/leaderboard');
                const data = await response.json();

                if (!response.ok) throw new Error('Failed to load');

                list.innerHTML = data.map((player, index) => {
                    const rankData = DB.ranks.find(r => r.id === player.rank) || DB.ranks[0];
                    const isSelf = player.username === Game.currentUser;
                    
                    let medal = '';
                    if (index === 0) medal = '🥇';
                    else if (index === 1) medal = '🥈';
                    else if (index === 2) medal = '🥉';
                    else medal = `<span class="font-mono text-gray-400 font-bold">#${index + 1}</span>`;

                    return `
                    <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between ${isSelf ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'bg-white dark:bg-gray-900'} transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div class="flex items-center gap-6">
                            <div class="w-8 text-center text-2xl">${medal}</div>
                            <div>
                                <div class="text-lg font-bold ${isSelf ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}">${player.username}</div>
                                <div class="text-[10px] text-gray-500 uppercase tracking-widest font-bold">${rankData.name}</div>
                            </div>
                        </div>
                        <div class="text-2xl font-black font-mono text-gray-900 dark:text-white">Lvl ${player.level}</div>
                    </div>`;
                }).join('');

            } catch (e) {
                list.innerHTML = '<div class="text-center text-red-500 font-mono">Failed to load leaderboard.</div>';
            }
        },

        showItemComparison(event, index) {
            const player = Game.state.player;
            const itemInstance = player.inventory[index];
            if (!itemInstance) return;
            
            const itemData = DB.items.find(i => i.id === itemInstance.id);
            if (!itemData || !itemData.stats) return;

            // Determine slot
            let slot = null;
            if (['Weapon', 'Armor', 'Accessory', 'Head', 'Legs', 'Feet'].includes(itemData.type)) {
                slot = itemData.type.toLowerCase();
            }
            if (!slot) return;

            const equippedInstance = player.equipment[slot];
            let equippedData = null;
            if (equippedInstance) {
                equippedData = DB.items.find(i => i.id === equippedInstance.id);
            }

            // Create tooltip if not exists
            let tooltip = document.getElementById('comparison-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'comparison-tooltip';
                tooltip.className = 'fixed z-[60] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 shadow-2xl pointer-events-none min-w-[200px]';
                document.body.appendChild(tooltip);
            }

            // Build Content
            let html = `
                <div class="mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comparing</div>
                    <div class="font-black text-gray-900 dark:text-white text-sm">${itemData.name}</div>
                    <div class="text-[10px] text-gray-500">vs ${equippedData ? equippedData.name : 'Empty'}</div>
                </div>
                <div class="space-y-1">
            `;

            for (const [stat, value] of Object.entries(itemData.stats)) {
                const oldValue = (equippedData && equippedData.stats) ? (equippedData.stats[stat] || 0) : 0;
                const diff = value - oldValue;
                let diffHtml = '';
                
                if (diff > 0) diffHtml = `<span class="text-green-500 font-bold ml-2">(+${diff})</span>`;
                else if (diff < 0) diffHtml = `<span class="text-red-500 font-bold ml-2">(${diff})</span>`;
                else diffHtml = `<span class="text-gray-400 ml-2">(-)</span>`;

                html += `
                    <div class="flex justify-between text-xs font-mono">
                        <span class="uppercase text-gray-500">${stat}</span>
                        <span><span class="text-gray-900 dark:text-white">${value}</span> ${diffHtml}</span>
                    </div>
                `;
            }
            html += `</div>`;

            tooltip.innerHTML = html;
            tooltip.style.display = 'block';

            // Position
            const rect = event.currentTarget.getBoundingClientRect();
            let top = rect.top;
            let left = rect.right + 10;

            // Check if off screen
            if (left + 220 > window.innerWidth) {
                left = rect.left - 230;
            }
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        },

        hideItemComparison() {
            const tooltip = document.getElementById('comparison-tooltip');
            if (tooltip) tooltip.style.display = 'none';
        },

        setInventoryFilter(filter) {
            this.inventoryFilter = filter;
            this.renderInventory();
        },

        renderInventory() {
            this.hideItemComparison(); // Fix: Hide tooltip when re-rendering
            const list = document.getElementById('inventory-list');
            if (!list) return; // Guard clause
            
            // Update Filter Buttons
            const filters = [
                { id: 'all', label: 'All', icon: '🎒' },
                { id: 'weapon', label: 'Weapons', icon: '⚔️' },
                { id: 'armor', label: 'Armor', icon: '🛡️' },
                { id: 'consumable', label: 'Consumables', icon: '🧪' },
                { id: 'material', label: 'Materials', icon: '🪵' }
            ];

            const filterContainer = document.getElementById('inventory-filter-controls');
            if (filterContainer) {
                filterContainer.className = "flex flex-wrap gap-2 mb-4 items-center";
                const filterButtons = filters.map(f => {
                    const isActive = this.inventoryFilter === f.id;
                    const activeClass = "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md";
                    const inactiveClass = "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-200";
                    
                    return `
                    <button onclick="Game.ui.setInventoryFilter('${f.id}')" 
                        class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md border transition-all duration-200 flex items-center gap-2 ${isActive ? activeClass : inactiveClass}">
                        <span class="text-sm">${f.icon}</span>
                        <span>${f.label}</span>
                    </button>
                    `;
                }).join('');

                const stackButton = `
                    <button onclick="Game.items.stackInventory()" 
                        class="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md border border-gray-200 hover:border-gray-400 hover:text-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800 dark:hover:border-gray-600 dark:hover:text-gray-200 transition-all duration-200 flex items-center gap-2 ml-auto">
                        <span class="text-sm">📚</span>
                        <span>Stack</span>
                    </button>
                `;

                filterContainer.innerHTML = filterButtons + stackButton;
            }

            if (Game.state.player.inventory.length === 0) {
                list.innerHTML = `
                    <div class="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 py-12">
                        <span class="text-4xl mb-2">🎒</span>
                        <span class="text-xs font-bold uppercase tracking-widest">Backpack Empty</span>
                    </div>`;
                return;
            }
            
            list.innerHTML = Game.state.player.inventory.map((itemInstance, index) => {
                const itemData = DB.items.find(dbItem => dbItem.id === itemInstance.id);
                if (!itemData) return '';

                const qty = itemInstance.quantity || 1;
                const qtyDisplay = qty > 1 ? `<span class="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-20 shadow-sm">x${qty}</span>` : '';

                // Filter Logic
                if (this.inventoryFilter !== 'all') {
                    if (this.inventoryFilter === 'weapon' && itemData.type !== 'Weapon') return '';
                    if (this.inventoryFilter === 'armor' && !['Armor', 'Head', 'Legs', 'Feet', 'Accessory'].includes(itemData.type)) return '';
                    if (this.inventoryFilter === 'consumable' && itemData.type !== 'Consumable') return '';
                    if (this.inventoryFilter === 'material' && itemData.type !== 'Material') return '';
                }
        
                const btnClass = "px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] hover:border-gray-900 hover:text-gray-900 dark:hover:border-white dark:hover:text-white transition-colors";

                let actionButton = '';
                let repairButton = '';
                let splitButton = '';
                let durabilityHtml = '';

                if (itemData.type === 'Consumable') {
                    actionButton = `<button class="${btnClass}" onclick="Game.items.useItem(${index})">Use</button>`;
                } else if (['Weapon', 'Armor', 'Accessory', 'Head', 'Legs', 'Feet', 'Tool'].includes(itemData.type)) {
                    actionButton = `<button class="${btnClass}" onclick="Game.items.equipItem(${index})">Equip</button>`;
                    
                    // Durability Logic for Inventory
                    if (itemData.maxDurability) {
                        // Handle legacy items without durability
                        if (itemInstance.durability === undefined) itemInstance.durability = itemData.maxDurability;
                        
                        const isBroken = itemInstance.durability <= 0;
                        durabilityHtml = `<span class="text-[10px] font-mono ml-2 ${isBroken ? 'text-red-500 font-bold' : 'text-gray-400'}">${isBroken ? 'BROKEN' : `DUR: ${itemInstance.durability}/${itemData.maxDurability}`}</span>`;

                        if (itemInstance.durability < itemData.maxDurability) {
                            const cost = Math.max(1, Math.ceil((itemData.maxDurability - itemInstance.durability) * (itemData.value / itemData.maxDurability) * 0.5));
                            repairButton = `<button class="mr-2 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400 hover:text-blue-600 transition-colors" onclick="Game.items.repairItem('inventory', ${index})">Repair (${cost}G)</button>`;
                        }
                    }
                }

                if (qty > 1) {
                    splitButton = `<button class="mr-2 text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400 hover:text-purple-600 transition-colors" onclick="Game.items.splitItem(${index})">Split</button>`;
                }
        
                return `
                    <div onmouseenter="Game.ui.showItemComparison(event, ${index})" onmouseleave="Game.ui.hideItemComparison()" class="relative group flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-300">
                        ${qtyDisplay}
                        <div class="flex flex-col gap-1 mb-4 sm:mb-0">
                            <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">${itemData.type}</span>
                            <div class="flex items-center">
                                <span class="text-xl font-black tracking-tight text-gray-900 dark:text-white rarity-${itemData.rarity}">${itemData.name}</span>
                                ${durabilityHtml}
                            </div>
                            ${itemData.stats ? 
                                `<div class="text-xs text-gray-500 font-mono mt-1 flex items-center gap-3">
                                    ${Object.entries(itemData.stats).map(([k,v]) => 
                                        `<span>${k.substring(0,3).toUpperCase()} <span class="text-gray-900 dark:text-gray-300 font-bold">+${v}</span></span>`
                                    ).join('<span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>')}
                                </div>` 
                                : ''}
                        </div>
                        <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                            <div class="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-tighter">
                                ${itemData.value}<span class="text-xs text-gray-400 ml-1 font-sans font-normal">G</span>
                            </div>
                            ${repairButton}
                            ${splitButton}
                            ${actionButton}
                        </div>
                    </div>`;
            }).join('');
        }
    }
};

// Start the game
window.onload = () => Game.init();