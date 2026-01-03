/**
 * materials.js
 * Database of crafting materials (Ores, Wood, etc).
 */
window.DB = window.DB || {};
if (!window.DB.items) window.DB.items = [];

const newMaterials = [
    { id: 'mat_iron_ore', name: "Iron Ore", type: "Material", rarity: "Common", value: 5, description: "Raw iron found in rocks." },
    { id: 'mat_gold_ore', name: "Gold Ore", type: "Material", rarity: "Uncommon", value: 15, description: "Shiny raw gold." },
    { id: 'mat_wood', name: "Oak Log", type: "Material", rarity: "Common", value: 2, description: "Basic wood." },
    { id: 'mat_stone', name: "Stone", type: "Material", rarity: "Common", value: 1, description: "Just a rock." }
];

window.DB.items = window.DB.items.concat(newMaterials);