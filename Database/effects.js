/**
 * effects.js
 * Database of status effects (buffs, debuffs, DoTs).
 */
window.DB = window.DB || {};

DB.effects = [
    {
        id: 'effect_poison',
        name: 'Poison',
        description: 'Takes damage at the start of each turn.',
        icon: '☠️',
        type: 'dot',
        colorClass: 'text-green-500',
        tickInterval: 1,
        magnitude: 5,
        duration: 3
    },
    {
        id: 'effect_burn',
        name: 'Burn',
        description: 'Takes fire damage and reduces defense.',
        icon: '🔥',
        type: 'dot_debuff',
        colorClass: 'text-orange-500',
        tickInterval: 1,
        magnitude: 8,
        statMod: { defense: -2 },
        duration: 3
    },
    {
        id: 'effect_regen',
        name: 'Regeneration',
        description: 'Restores health over time.',
        icon: '💖',
        type: 'hot',
        colorClass: 'text-pink-500',
        tickInterval: 1,
        magnitude: 10,
        duration: 5
    },
    {
        id: 'effect_stun',
        name: 'Stun',
        description: 'Cannot act.',
        icon: '💫',
        type: 'cc',
        colorClass: 'text-yellow-500',
        duration: 1
    },
    {
        id: 'effect_strength',
        name: 'Strength',
        description: 'Increases damage dealt.',
        icon: '💪',
        type: 'buff',
        colorClass: 'text-red-600',
        statMod: { damage: 5 },
        duration: 4
    },
    {
        id: 'effect_weakness',
        name: 'Weakness',
        description: 'Reduces damage dealt.',
        icon: '📉',
        type: 'debuff',
        colorClass: 'text-gray-500',
        statMod: { damage: -3 },
        duration: 3
    },
    {
        id: 'effect_frozen',
        name: 'Frozen',
        description: 'Cannot act. Taking damage breaks the ice.',
        icon: '❄️',
        type: 'cc',
        colorClass: 'text-blue-400',
        duration: 2
    },
    {
        id: 'effect_bleed',
        name: 'Bleed',
        description: 'Takes physical damage over time.',
        icon: '🩸',
        type: 'dot',
        colorClass: 'text-red-700',
        tickInterval: 1,
        magnitude: 4,
        duration: 4
    }
];