/**
 * worlds.js
 * Database of worlds and their zones.
 */
window.DB = window.DB || {};

DB.worlds = [
    {
        id: 'world_green_valley',
        name: "Green Valley",
        description: "A lush, vibrant land filled with life and minor dangers.",
        minLevel: 1,
        colorClass: "text-green-500",
        zones: [
            { id: 0, name: "Whispering Creek", minLevel: 1, bossId: "boss_slime_king", description: "A quiet stream inhabited by slimes." },
            { id: 1, name: "Shadow Thicket", minLevel: 5, bossId: "boss_alpha_wolf", description: "Dense woods where wolves prowl." },
            { id: 2, name: "Ancient Grove", minLevel: 10, bossId: "boss_treant", description: "The heart of the forest." }
        ]
    }
];