/**
 * enemies.js
 * Database of all enemies in the game.
 */
window.DB = window.DB || {};

DB.enemies = [
    // Common
    { id: 'enemy_slime', name: "Slime", hp: 30, maxHp: 30, xp: 10, gold: 5, rarity: 'Common' },
    { id: 'enemy_rat', name: "Giant Rat", hp: 25, maxHp: 25, xp: 8, gold: 3, rarity: 'Common' },
    { id: 'enemy_bat', name: "Cave Bat", hp: 20, maxHp: 20, xp: 7, gold: 4, rarity: 'Common' },

    // Uncommon
    { id: 'enemy_wolf', name: "Wolf", hp: 60, maxHp: 60, xp: 25, gold: 12, rarity: 'Uncommon' },
    { id: 'enemy_goblin', name: "Goblin Scout", hp: 50, maxHp: 50, xp: 20, gold: 10, rarity: 'Uncommon' },
    { id: 'enemy_spider', name: "Forest Spider", hp: 70, maxHp: 70, xp: 30, gold: 15, rarity: 'Uncommon' },

    // Rare
    { id: 'enemy_bandit', name: "Bandit", hp: 100, maxHp: 100, xp: 50, gold: 30, rarity: 'Rare' },
    { id: 'enemy_orc', name: "Orc Grunt", hp: 120, maxHp: 120, xp: 65, gold: 40, rarity: 'Rare' },
    { id: 'enemy_golem', name: "Rock Golem", hp: 150, maxHp: 150, xp: 80, gold: 25, rarity: 'Rare' },

    // Bosses
    { 
        id: 'boss_slime_king', name: "King Slime", hp: 300, maxHp: 300, xp: 150, gold: 100, rarity: 'Boss', 
        lootTable: [
            { itemId: 'item_slime_crown', chance: 0.3 }
        ]
    },
    { 
        id: 'boss_alpha_wolf', name: "Alpha Wolf", hp: 500, maxHp: 500, xp: 300, gold: 180, rarity: 'Boss',
        lootTable: [
            { itemId: 'item_wolf_fang_dagger', chance: 0.3 }
        ]
    },
    { 
        id: 'boss_treant', name: "Elder Treant", hp: 800, maxHp: 800, xp: 500, gold: 250, rarity: 'Boss',
        lootTable: [
            { itemId: 'item_living_wood_staff', chance: 0.3 }
        ]
    }
];