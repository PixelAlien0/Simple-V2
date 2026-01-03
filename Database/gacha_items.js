/**
 * gacha_items.js
 * Items exclusive to the Gacha system.
 */
window.DB = window.DB || {};
if (!window.DB.items) window.DB.items = [];

const gachaItems = [
    // Common
    {
        id: 'gacha_sword_training',
        name: "Otherworldly Training Sword",
        type: "Weapon",
        rarity: "Common",
        value: 50,
        stats: { damage: 18 },
        gachaExclusive: true,
        maxDurability: 60
    },
    {
        id: 'gacha_vest_novice',
        name: "Summoner's Vest",
        type: "Armor",
        rarity: "Common",
        value: 50,
        stats: { defense: 12, luck: 1 },
        gachaExclusive: true,
        maxDurability: 60
    },
    // Rare
    {
        id: 'gacha_potion_elixir',
        name: "Celestial Elixir",
        type: "Consumable",
        rarity: "Rare",
        value: 500,
        effect: { type: 'heal', amount: 500 },
        gachaExclusive: true
    },
    // Epic
    {
        id: 'gacha_shield_aegis',
        name: "Aegis Shield",
        type: "Armor",
        rarity: "Epic",
        value: 2500,
        stats: { defense: 85, damage: 15 },
        gachaExclusive: true,
        maxDurability: 150
    },
    {
        id: 'gacha_boots_hermes',
        name: "Boots of Hermes",
        type: "Feet",
        rarity: "Epic",
        value: 3000,
        stats: { defense: 25, luck: 20 },
        gachaExclusive: true,
        maxDurability: 120
    },
    // Legendary
    {
        id: 'gacha_blade_eternity',
        name: "Blade of Eternity",
        type: "Weapon",
        rarity: "Legendary",
        value: 5000,
        stats: { damage: 160, luck: 15 },
        gachaExclusive: true,
        maxDurability: 200
    },
    {
        id: 'gacha_helm_domination',
        name: "Helm of Domination",
        type: "Head",
        rarity: "Legendary",
        value: 6000,
        stats: { defense: 70, damage: 45 },
        gachaExclusive: true,
        maxDurability: 180
    }
];

window.DB.items.push(...gachaItems);