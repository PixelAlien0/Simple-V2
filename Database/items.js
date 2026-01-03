/**
 * items.js
 * Database of all items in the game.
 */
window.DB = window.DB || {};

DB.items = [
    // Common
    { id: 'item_stick', name: "Sturdy Stick", type: "Weapon", rarity: "Common", value: 5, stats: { damage: 2, luck: 1 }, maxDurability: 20 },
    { id: 'item_rags', name: "Tattered Rags", type: "Armor", rarity: "Common", value: 3, stats: { defense: 1, luck: 1 }, maxDurability: 15 },
    { id: 'item_apple', name: "Bruised Apple", type: "Consumable", rarity: "Common", value: 2, effect: { type: 'heal', amount: 10 } },
    // New Common (5)
    { id: 'item_rock', name: "Heavy Rock", type: "Weapon", rarity: "Common", value: 4, stats: { damage: 3 }, maxDurability: 15 },
    { id: 'item_sandals', name: "Worn Sandals", type: "Feet", rarity: "Common", value: 5, stats: { defense: 1, luck: 2 }, maxDurability: 20 },
    { id: 'item_bandana', name: "Cloth Bandana", type: "Head", rarity: "Common", value: 4, stats: { defense: 1, luck: 1 }, maxDurability: 15 },
    { id: 'item_pants', name: "Torn Trousers", type: "Legs", rarity: "Common", value: 4, stats: { defense: 1 }, maxDurability: 20 },
    { id: 'item_bread', name: "Stale Bread", type: "Consumable", rarity: "Common", value: 3, effect: { type: 'heal', amount: 15 } },

    // Uncommon
    { id: 'item_shortsword', name: "Shortsword", type: "Weapon", rarity: "Uncommon", value: 25, stats: { damage: 6, defense: 1 }, maxDurability: 50 },
    { id: 'item_leather_vest', name: "Leather Vest", type: "Armor", rarity: "Uncommon", value: 20, stats: { defense: 4, luck: 2 }, maxDurability: 40 },
    { id: 'item_minor_potion', name: "Minor Healing Potion", type: "Consumable", rarity: "Uncommon", value: 15, effect: { type: 'heal', amount: 25 } },
    // New Uncommon (5)
    { id: 'item_iron_mace', name: "Iron Mace", type: "Weapon", rarity: "Uncommon", value: 30, stats: { damage: 8 }, maxDurability: 60 },
    { id: 'item_leather_boots', name: "Leather Boots", type: "Feet", rarity: "Uncommon", value: 18, stats: { defense: 2, luck: 3 }, maxDurability: 35 },
    { id: 'item_leather_cap', name: "Leather Cap", type: "Head", rarity: "Uncommon", value: 15, stats: { defense: 2, luck: 1 }, maxDurability: 30 },
    { id: 'item_leather_pants', name: "Leather Pants", type: "Legs", rarity: "Uncommon", value: 18, stats: { defense: 3 }, maxDurability: 40 },
    { id: 'item_copper_ring', name: "Copper Ring", type: "Accessory", rarity: "Uncommon", value: 40, stats: { luck: 4, defense: 1 }, maxDurability: 100 },

    // Rare
    { id: 'item_longsword', name: "Steel Longsword", type: "Weapon", rarity: "Rare", value: 100, stats: { damage: 14, defense: 2 }, maxDurability: 100 },
    { id: 'item_chainmail', name: "Chainmail Tunic", type: "Armor", rarity: "Rare", value: 80, stats: { defense: 10, damage: 1 }, maxDurability: 80 },
    { id: 'item_luck_charm', name: "Lucky Charm", type: "Accessory", rarity: "Rare", value: 150, stats: { luck: 8, defense: 2 }, maxDurability: 50 },
    // New Rare (5)
    { id: 'item_steel_axe', name: "Steel Axe", type: "Weapon", rarity: "Rare", value: 110, stats: { damage: 16 }, maxDurability: 90 },
    { id: 'item_plate_boots', name: "Steel Boots", type: "Feet", rarity: "Rare", value: 70, stats: { defense: 6, damage: 1 }, maxDurability: 80 },
    { id: 'item_plate_helm', name: "Steel Helm", type: "Head", rarity: "Rare", value: 75, stats: { defense: 6, luck: 1 }, maxDurability: 80 },
    { id: 'item_plate_legs', name: "Steel Greaves", type: "Legs", rarity: "Rare", value: 85, stats: { defense: 7 }, maxDurability: 90 },
    { id: 'item_major_potion', name: "Major Healing Potion", type: "Consumable", rarity: "Rare", value: 50, effect: { type: 'heal', amount: 75 } },

    // Epic (New Rarity - 3 Items)
    { id: 'item_obsidian_blade', name: "Obsidian Blade", type: "Weapon", rarity: "Epic", value: 500, stats: { damage: 25, luck: 5 }, maxDurability: 150 },
    { id: 'item_dragon_vest', name: "Dragonscale Vest", type: "Armor", rarity: "Epic", value: 450, stats: { defense: 20, damage: 3 }, maxDurability: 140 },
    { id: 'item_ancient_ring', name: "Ancient Ring", type: "Accessory", rarity: "Epic", value: 600, stats: { damage: 5, defense: 5, luck: 5 }, maxDurability: 200 },

    // Legendary (New Rarity - 3 Items)
    { id: 'item_excalibur', name: "Excalibur", type: "Weapon", rarity: "Legendary", value: 2000, stats: { damage: 50, defense: 10, luck: 10 }, maxDurability: 300 },
    { id: 'item_celestial_robe', name: "Celestial Robes", type: "Armor", rarity: "Legendary", value: 1800, stats: { defense: 40, luck: 20 }, maxDurability: 250 },
    { id: 'item_soul_gem', name: "Soul Gem", type: "Accessory", rarity: "Legendary", value: 2500, stats: { luck: 30, damage: 10, defense: 10 }, maxDurability: 500 },

    // Gacha Exclusives
    { id: 'item_void_blade', name: "Void Blade", type: "Weapon", rarity: "Rare", value: 500, stats: { damage: 20, luck: 5 }, maxDurability: 150, gachaExclusive: true },
    { id: 'item_aegis_plate', name: "Aegis Plate", type: "Armor", rarity: "Rare", value: 450, stats: { defense: 18, damage: 2 }, maxDurability: 120, gachaExclusive: true },
    { id: 'item_golden_apple', name: "Golden Apple", type: "Consumable", rarity: "Rare", value: 300, effect: { type: 'heal', amount: 100 }, gachaExclusive: true }
    ,
    // Tools & Gathering
    { id: 'item_pickaxe', name: "Iron Pickaxe", type: "Tool", rarity: "Common", value: 50, description: "Essential for mining ore." },
    { id: 'item_gloves', name: "Leather Gloves", type: "Tool", rarity: "Common", value: 30, description: "Protect hands from thorns and toxins." },
    { id: 'item_key', name: "Iron Key", type: "Consumable", rarity: "Uncommon", value: 25, description: "Opens a standard lock." },

    // Boss Unique Drops
    { id: 'item_slime_crown', name: "Slime Crown", type: "Head", rarity: "Rare", value: 200, stats: { defense: 5, luck: 5 }, maxDurability: 50, description: "Sticky but regal." },
    { id: 'item_wolf_fang_dagger', name: "Wolf Fang", type: "Weapon", rarity: "Rare", value: 250, stats: { damage: 18, luck: 3 }, maxDurability: 80, description: "Carved from a giant fang." },
    { id: 'item_living_wood_staff', name: "Living Staff", type: "Weapon", rarity: "Epic", value: 600, stats: { damage: 22, defense: 5, luck: 8 }, maxDurability: 120, description: "It still grows leaves." }
];