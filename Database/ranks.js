/**
 * ranks.js
 * Database of player ranks based on level.
 */
window.DB = window.DB || {};

DB.ranks = [
    { id: 'rank_adventurer', name: 'Adventurer', minLevel: 1, description: 'A novice beginning their journey.' },
    { id: 'rank_veteran', name: 'Veteran', minLevel: 10, description: 'Experienced in the ways of combat.' },
    { id: 'rank_elite', name: 'Elite', minLevel: 25, description: 'A formidable force on the battlefield.' },
    { id: 'rank_champion', name: 'Champion', minLevel: 50, description: 'A hero known across the lands.' },
    { id: 'rank_legend', name: 'Legend', minLevel: 100, description: 'A myth made flesh.' }
];