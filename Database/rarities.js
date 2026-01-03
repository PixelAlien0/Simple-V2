/**
 * rarities.js
 * Defines the different item and enemy rarities in the game.
 */
window.DB = window.DB || {};

DB.rarities = {
    "Common": {
        name: "Common",
        colorClass: "rarity-Common", // Corresponds to CSS class
        weight: 100 // Higher weight = more common
    },
    "Uncommon": {
        name: "Uncommon",
        colorClass: "rarity-Uncommon",
        weight: 50
    },
    "Rare": {
        name: "Rare",
        colorClass: "rarity-Rare",
        weight: 20
    },
    "Epic": {
        name: "Epic",
        colorClass: "rarity-Epic", // Needs CSS support or will default
        weight: 5
    },
    "Legendary": {
        name: "Legendary",
        colorClass: "rarity-Legendary", // Needs CSS support or will default
        weight: 1
    },
    "Boss": {
        name: "Boss",
        colorClass: "rarity-Boss",
        weight: 0 // Cannot be rolled randomly
    }
};