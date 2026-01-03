/**
 * difficulties.js
 * Database of game difficulties.
 */
window.DB = window.DB || {};

DB.difficulties = [
    {
        id: 'difficulty_easy',
        name: 'Easy',
        description: 'For those who want a relaxed experience.',
        multipliers: { exp: 0.8, enemyHp: 0.7, enemyDmg: 0.7, lootChance: 0.8, rareLootChance: 0.5 }
    },
    {
        id: 'difficulty_normal',
        name: 'Normal',
        description: 'The standard adventure.',
        multipliers: { exp: 1.0, enemyHp: 1.0, enemyDmg: 1.0, lootChance: 1.0, rareLootChance: 1.0 }
    },
    {
        id: 'difficulty_hard',
        name: 'Hard',
        description: 'A challenge for seasoned veterans.',
        multipliers: { exp: 1.5, enemyHp: 1.5, enemyDmg: 1.5, lootChance: 1.2, rareLootChance: 2.0 }
    }
];