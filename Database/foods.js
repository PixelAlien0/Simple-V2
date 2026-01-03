/**
 * foods.js
 * Database of raw food ingredients.
 */
window.DB = window.DB || {};
if (!window.DB.items) window.DB.items = [];

const newFoods = [
    { id: 'mat_berry', name: "Wild Berry", type: "Material", rarity: "Common", value: 2, description: "A sweet forest treat." },
    { id: 'mat_mushroom', name: "Red Mushroom", type: "Material", rarity: "Common", value: 3, description: "Looks edible." },
    { id: 'mat_fish', name: "Raw Trout", type: "Material", rarity: "Common", value: 5, description: "Slippery." }
];

window.DB.items = window.DB.items.concat(newFoods);