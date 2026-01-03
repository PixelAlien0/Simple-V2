/**
 * gacha.js
 * Database of gacha banners.
 */
window.DB = window.DB || {};

DB.gacha = [
    {
        id: 'banner_standard',
        name: 'Standard Supply',
        description: 'A standard shipment of supplies. Contains all types of items.',
        cost: 50,
        image: '📦',
        rates: { 'Common': 60, 'Uncommon': 30, 'Rare': 8, 'Epic': 1.5, 'Legendary': 0.5 },
        poolType: 'all'
    },
    {
        id: 'banner_warrior',
        name: 'Warrior\'s Cache',
        description: 'Specialized equipment for combat. Higher chance for Weapons and Armor.',
        cost: 150,
        image: '⚔️',
        rates: { 'Common': 40, 'Uncommon': 40, 'Rare': 15, 'Epic': 4, 'Legendary': 1 },
        poolType: 'equipment'
    },
    {
        id: 'banner_fortune',
        name: 'Fortune\'s Favor',
        description: 'High risk, high reward. Significantly increased Rare chance.',
        cost: 500,
        image: '💎',
        rates: { 'Common': 30, 'Uncommon': 30, 'Rare': 30, 'Epic': 8, 'Legendary': 2 },
        poolType: 'all'
    }
];