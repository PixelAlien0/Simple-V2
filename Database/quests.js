/**
 * quests.js
 * Database of quest templates.
 */
window.DB = window.DB || {};

DB.quests = [
    { 
        id: 'q_hunt_slime', 
        type: 'hunt', 
        targetId: 'enemy_slime', 
        targetName: 'Slime',
        amount: 5, 
        name: "Slime Squasher", 
        description: "Defeat 5 Slimes.", 
        reward: { gold: 25, xp: 50 } 
    },
    { 
        id: 'q_hunt_rat', 
        type: 'hunt', 
        targetId: 'enemy_rat', 
        targetName: 'Giant Rat',
        amount: 3, 
        name: "Pest Control", 
        description: "Exterminate 3 Giant Rats.", 
        reward: { gold: 15, xp: 30 } 
    },
    { 
        id: 'q_collect_wood', 
        type: 'collect', 
        targetId: 'mat_wood', 
        targetName: 'Oak Log',
        amount: 3, 
        name: "Firewood", 
        description: "Gather 3 Oak Logs.", 
        reward: { gold: 20, xp: 20 } 
    },
    { 
        id: 'q_collect_berry', 
        type: 'collect', 
        targetId: 'mat_berry', 
        targetName: 'Wild Berry',
        amount: 5, 
        name: "Berry Picker", 
        description: "Collect 5 Wild Berries.", 
        reward: { gold: 25, xp: 25 } 
    },
    { 
        id: 'q_hunt_wolf', 
        type: 'hunt', 
        targetId: 'enemy_wolf', 
        targetName: 'Wolf',
        amount: 3, 
        name: "Wolf Hunter", 
        description: "Hunt 3 Wolves.", 
        reward: { gold: 60, xp: 100 } 
    },
    { 
        id: 'q_collect_iron', 
        type: 'collect', 
        targetId: 'mat_iron_ore', 
        targetName: 'Iron Ore',
        amount: 2, 
        name: "Heavy Metal", 
        description: "Bring 2 Iron Ore.", 
        reward: { gold: 80, xp: 80 } 
    }
];