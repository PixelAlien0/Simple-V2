/**
 * events.js
 * Database of choice-based exploration events.
 */
window.DB = window.DB || {};

DB.events = [
    {
        id: 'evt_shrine',
        type: 'narrative',
        title: "Mysterious Shrine",
        description: "You find an ancient shrine glowing with faint blue light. An offering bowl sits empty.",
        choices: [
            { id: 'pray', text: "Pray for health", effect: { type: 'heal', amount: 50, chance: 0.8, fail: { type: 'damage', amount: 10, message: "The shrine rejects you!" } } },
            { id: 'loot', text: "Steal the offerings", effect: { type: 'gold', amount: 50, chance: 0.5, fail: { type: 'combat', enemyRarity: 'Uncommon', message: "A guardian spirit attacks!" } } },
            { id: 'leave', text: "Leave it alone", effect: { type: 'text', message: "You walk away respectfully." } }
        ]
    },
    {
        id: 'evt_wagon',
        type: 'narrative',
        title: "Abandoned Wagon",
        description: "A broken wagon lies on the side of the road. It looks like it was attacked recently.",
        choices: [
            { id: 'search', text: "Search for supplies", effect: { type: 'item', rarity: 'Common', chance: 0.7, fail: { type: 'combat', enemyRarity: 'Common', message: "A goblin jumps out from the wreckage!" } } },
            { id: 'salvage', text: "Salvage parts", effect: { type: 'gold', amount: 20, chance: 1.0 } },
            { id: 'ignore', text: "Keep moving", effect: { type: 'text', message: "Not your problem." } }
        ]
    },
    {
        id: 'evt_merchant',
        type: 'narrative',
        title: "Shady Merchant",
        description: "A hooded figure approaches you, offering a 'Mystery Box' for 50 Gold.",
        choices: [
            { id: 'buy', text: "Buy Box (50G)", req: { type: 'gold', amount: 50 }, effect: { type: 'item', rarity: 'Rare', chance: 0.4, fail: { type: 'item', rarity: 'Common', message: "It was just junk..." } } },
            { id: 'rob', text: "Try to rob him", effect: { type: 'gold', amount: 100, chance: 0.3, fail: { type: 'combat', enemyRarity: 'Rare', message: "The merchant is a retired assassin!" } } },
            { id: 'decline', text: "Decline", effect: { type: 'text', message: "You wave him away." } }
        ]
    },
    {
        id: 'evt_traveler',
        type: 'narrative',
        title: "Injured Traveler",
        description: "A fellow adventurer is leaning against a tree, bleeding from a wound.",
        choices: [
            { id: 'help', text: "Give Potion (Cost 20G)", req: { type: 'gold', amount: 20 }, effect: { type: 'xp', amount: 100, chance: 1.0, message: "He thanks you profusely and shares his map knowledge." } },
            { id: 'rob', text: "Take his gear", effect: { type: 'gold', amount: 40, chance: 0.8, fail: { type: 'damage', amount: 20, message: "He fights back desperately!" } } },
            { id: 'ignore', text: "Walk past", effect: { type: 'text', message: "Survival of the fittest." } }
        ]
    },
    {
        id: 'evt_berry',
        type: 'narrative',
        title: "Glowing Berry Bush",
        description: "You spot a bush with strange, pulsating purple berries.",
        choices: [
            { id: 'eat', text: "Eat a berry", effect: { type: 'heal', amount: 100, chance: 0.5, fail: { type: 'damage', amount: 15, message: "It's poisonous!" } } },
            { id: 'harvest', text: "Harvest carefully", effect: { type: 'item', rarity: 'Uncommon', chance: 0.7, fail: { type: 'text', message: "The berries squish in your hands." } } },
            { id: 'ignore', text: "Too risky", effect: { type: 'text', message: "Better safe than sorry." } }
        ]
    },
    {
        id: 'evt_monolith',
        type: 'narrative',
        title: "Ancient Monolith",
        description: "A stone slab covered in indecipherable runes stands before you.",
        choices: [
            { id: 'touch', text: "Touch the runes", effect: { type: 'xp', amount: 200, chance: 0.4, fail: { type: 'damage', amount: 30, message: "Arcane energy shocks you!" } } },
            { id: 'study', text: "Study from afar", effect: { type: 'xp', amount: 50, chance: 1.0 } },
            { id: 'destroy', text: "Smash it", effect: { type: 'combat', enemyRarity: 'Rare', message: "You awoke something ancient!" } }
        ]
    },
    {
        id: 'evt_gambler',
        type: 'narrative',
        title: "Goblin Gambler",
        description: "A goblin isn't attacking; he's shuffling cards. 'Double or nothing?' he grins.",
        choices: [
            { id: 'bet_small', text: "Bet 20 Gold", req: { type: 'gold', amount: 20 }, effect: { type: 'gold', amount: 40, chance: 0.5, fail: { type: 'text', message: "You lost the hand." } } },
            { id: 'bet_big', text: "Bet 100 Gold", req: { type: 'gold', amount: 100 }, effect: { type: 'gold', amount: 200, chance: 0.4, fail: { type: 'text', message: "You lost the hand." } } },
            { id: 'fight', text: "Just fight him", effect: { type: 'combat', enemyRarity: 'Uncommon', message: "He flips the table!" } }
        ]
    },
    {
        id: 'evt_chest',
        type: 'narrative',
        title: "Cursed Chest",
        description: "A treasure chest sits in the open, wrapped in ominous black chains.",
        choices: [
            { id: 'open', text: "Break the chains", effect: { type: 'item', rarity: 'Epic', chance: 0.3, fail: { type: 'combat', enemyRarity: 'Rare', message: "The chest was a mimic!" } } },
            { id: 'dispel', text: "Cleanse it", effect: { type: 'item', rarity: 'Rare', chance: 0.6, fail: { type: 'damage', amount: 25, message: "The curse backfires." } } },
            { id: 'leave', text: "Walk away", effect: { type: 'text', message: "Not worth the curse." } }
        ]
    },
    {
        id: 'evt_fountain',
        type: 'narrative',
        title: "Fountain of Youth",
        description: "Crystal clear water flows from a marble statue. You feel younger just looking at it.",
        choices: [
            { id: 'drink', text: "Drink deeply", effect: { type: 'heal', amount: 999, chance: 0.8, fail: { type: 'damage', amount: 50, message: "The water turns to acid in your mouth!" } } },
            { id: 'bottle', text: "Fill a bottle", effect: { type: 'item', rarity: 'Rare', chance: 1.0 } },
            { id: 'coin', text: "Toss a coin", req: { type: 'gold', amount: 1 }, effect: { type: 'xp', amount: 50, chance: 1.0, message: "You feel lucky." } }
        ]
    },
    {
        id: 'evt_wolf',
        type: 'narrative',
        title: "Stray Wolf Pup",
        description: "A wolf pup is caught in a hunter's trap. It whimpers softly.",
        choices: [
            { id: 'free', text: "Free the pup", effect: { type: 'item', rarity: 'Uncommon', chance: 0.7, message: "The pup leads you to a buried stash.", fail: { type: 'damage', amount: 10, message: "It bit you in panic and ran." } } },
            { id: 'feed', text: "Feed it meat", effect: { type: 'xp', amount: 150, chance: 1.0, message: "You made a friend (for now)." } },
            { id: 'leave', text: "Nature is cruel", effect: { type: 'text', message: "You leave it to its fate." } }
        ]
    },
    {
        id: 'evt_mining',
        type: 'gathering',
        title: "Vein of Gold",
        description: "A shimmering vein of gold runs through the rock face here.",
        choices: [
            { 
                id: 'mine', 
                text: "Mine it", 
                req: { type: 'item', id: 'item_pickaxe', name: 'Iron Pickaxe' }, 
                effect: { type: 'gold', amount: 75, chance: 1.0, message: "You chip away the gold!" } 
            },
            { id: 'leave', text: "Leave it", effect: { type: 'text', message: "You lack the tools to mine this." } }
        ]
    },
    {
        id: 'evt_foraging',
        type: 'gathering',
        title: "Rare Herb",
        description: "A rare, thorny medicinal herb grows in the shade.",
        choices: [
            { id: 'harvest', text: "Harvest safely", req: { type: 'item', id: 'item_gloves', name: 'Leather Gloves' }, effect: { type: 'item', rarity: 'Uncommon', chance: 1.0, message: "You safely harvested the herb." } },
            { id: 'grab', text: "Grab it barehanded", effect: { type: 'damage', amount: 15, chance: 0.0, fail: { type: 'damage', amount: 15, message: "The thorns cut your hands deeply!" } } }
        ]
    },
    {
        id: 'evt_chest_locked',
        type: 'gathering',
        title: "Locked Chest",
        description: "A sturdy chest with a heavy iron lock.",
        choices: [
            { id: 'key', text: "Use Iron Key", req: { type: 'item', id: 'item_key', name: 'Iron Key', consume: true }, effect: { type: 'item', rarity: 'Rare', chance: 1.0, message: "The lock clicks open." } },
            { id: 'pick', text: "Pick Lock", req: { type: 'stat', stat: 'luck', amount: 5 }, effect: { type: 'item', rarity: 'Uncommon', chance: 0.6, fail: { type: 'text', message: "You failed to pick the lock." } } },
            { id: 'leave', text: "Leave it", effect: { type: 'text', message: "It remains locked." } }
        ]
    }
    ,
    {
        id: 'evt_whispering_cave',
        type: 'narrative',
        title: "Whispering Cave",
        description: "A dark cave entrance emanates unsettling whispers. The air is cold.",
        choices: [
            { id: 'enter', text: "Follow the whispers", effect: { type: 'combat', enemyRarity: 'Uncommon', message: "The whispers were a lure! A cave horror attacks!" } },
            { id: 'listen', text: "Try to understand the whispers", req: { type: 'stat', stat: 'luck', amount: 10 }, effect: { type: 'xp', amount: 250, message: "You decipher a fragment of ancient lore, gaining insight." } },
            { id: 'flee', text: "Flee in terror", effect: { type: 'text', message: "You wisely decide not to mess with haunted caves." } }
        ]
    },
    {
        id: 'evt_sleeping_giant',
        type: 'narrative',
        title: "Sleeping Giant",
        description: "A colossal giant slumbers, blocking the path. His snores shake the ground.",
        choices: [
            { id: 'sneak', text: "Attempt to sneak past", effect: { type: 'xp', amount: 100, chance: 0.6, fail: { type: 'combat', enemyRarity: 'Epic', message: "You stepped on a twig! The giant awakens, enraged!" } } },
            { id: 'steal', text: "Rummage through his pouch", effect: { type: 'item', rarity: 'Rare', chance: 0.4, fail: { type: 'damage', amount: 50, message: "The giant swats you away like a fly." } } },
            { id: 'wait', text: "Wait for him to move", effect: { type: 'text', message: "You wait for an hour. He doesn't budge. You find another path." } }
        ]
    },
    {
        id: 'evt_fairy_ring',
        type: 'narrative',
        title: "Fairy Ring",
        description: "A perfect circle of vibrant mushrooms grows in a clearing. It feels magical.",
        choices: [
            { id: 'step_in', text: "Step into the circle", effect: { type: 'heal', amount: 150, chance: 0.5, fail: { type: 'damage', amount: 40, message: "The fairies are mischievous and drain your energy!" } } },
            { id: 'eat_shroom', text: "Eat a mushroom", effect: { type: 'xp', amount: 300, chance: 0.3, fail: { type: 'damage', amount: 25, message: "You feel terribly sick." } } },
            { id: 'observe', text: "Observe from a distance", effect: { type: 'xp', amount: 20, message: "You appreciate the magical sight." } }
        ]
    },
    {
        id: 'evt_lost_child',
        type: 'narrative',
        title: "Lost Child",
        description: "You find a child crying alone in the woods.",
        choices: [
            { id: 'help', text: "Help them find their way home", effect: { type: 'xp', amount: 200, message: "You guide the child back to a nearby village. The grateful parents reward you." } },
            { id: 'give_food', text: "Give them some food", req: { type: 'item', id: 'food_bread', name: 'Bread', consume: true }, effect: { type: 'xp', amount: 50, message: "The child thanks you and seems a bit safer now." } },
            { id: 'ignore', text: "Ignore them", effect: { type: 'text', message: "You have your own problems to worry about." } }
        ]
    },
    {
        id: 'evt_broken_bridge',
        type: 'narrative',
        title: "Broken Bridge",
        description: "A wide chasm is spanned by a dangerously rotten bridge.",
        choices: [
            { id: 'cross', text: "Cross carefully", effect: { type: 'text', message: "You make it across, your heart pounding.", chance: 0.7, fail: { type: 'damage', amount: 35, message: "A plank snaps! You fall but manage to climb out, bruised." } } },
            { id: 'repair', text: "Repair with wood", req: { type: 'item', id: 'mat_wood', name: 'Wood', consume: true }, effect: { type: 'xp', amount: 75, message: "You reinforce the bridge, making it safe to cross." } },
            { id: 'find_way', text: "Find another way", effect: { type: 'text', message: "You spend an hour finding a safe crossing downstream." } }
        ]
    },
    {
        id: 'evt_alchemist_hut',
        type: 'narrative',
        title: "Alchemist's Hut",
        description: "You find an abandoned hut filled with strange potions and books.",
        choices: [
            { id: 'drink', text: "Drink a bubbling green potion", effect: { type: 'heal', amount: 200, chance: 0.5, fail: { type: 'damage', amount: 50, message: "It was poison!" } } },
            { id: 'read', text: "Read the alchemist's journal", effect: { type: 'xp', amount: 150, message: "You learn a few secrets about potion-making." } },
            { id: 'steal', text: "Steal ingredients", effect: { type: 'item', rarity: 'Uncommon', chance: 1.0 } }
        ]
    },
    {
        id: 'evt_talking_tree',
        type: 'narrative',
        title: "Talking Tree",
        description: "A wizened, ancient tree turns its bark-like face to you. 'Well, hello there,' it rumbles.",
        choices: [
            { id: 'listen', text: "Listen to its story", effect: { type: 'xp', amount: 250, message: "The tree tells you a tale from a forgotten age." } },
            { id: 'ask_gift', text: "Ask for a gift", effect: { type: 'item', id: 'mat_wood', chance: 0.8, fail: { type: 'text', message: "'The nerve!' The tree falls silent." } } },
            { id: 'chop', text: "Chop it for wood", req: { type: 'item', id: 'item_axe', name: 'Iron Axe' }, effect: { type: 'combat', enemyRarity: 'Epic', message: "The tree animates into a furious Treant!" } }
        ]
    },
    {
        id: 'evt_rival',
        type: 'narrative',
        title: "Rival Adventurer",
        description: "A cocky adventurer blocks your path. 'This territory is mine! Prove your worth or leave!'",
        choices: [
            { id: 'duel', text: "Duel them!", effect: { type: 'combat', enemyRarity: 'Rare', message: "You accept the challenge!" } },
            { id: 'wager', text: "Wager 100G on the duel", req: { type: 'gold', amount: 100 }, effect: { type: 'gold', amount: 200, chance: 0.5, fail: { type: 'combat', enemyRarity: 'Rare', message: "You lost the bet! Now fight for your life!" } } },
            { id: 'intimidate', text: "Intimidate them", req: { type: 'stat', stat: 'defense', amount: 20 }, effect: { type: 'text', message: "They see your gear and back down nervously." } }
        ]
    },
    {
        id: 'evt_meteorite',
        type: 'narrative',
        title: "Fallen Star",
        description: "A small, smoking crater contains a pulsating, otherworldly metal.",
        choices: [
            { id: 'touch', text: "Touch the meteorite", effect: { type: 'damage', amount: 40, message: "It's burning hot and radiates strange energy!" } },
            { id: 'mine', text: "Mine it with a pickaxe", req: { type: 'item', id: 'item_pickaxe', name: 'Iron Pickaxe' }, effect: { type: 'item', id: 'mat_starmetal', chance: 1.0 } },
            { id: 'observe', text: "Observe from a safe distance", effect: { type: 'xp', amount: 60, message: "You note its properties without getting too close." } }
        ]
    },
    {
        id: 'evt_fishing_spot',
        type: 'gathering',
        title: "Quiet Fishing Spot",
        description: "A tranquil pond seems teeming with fish.",
        choices: [
            { id: 'fish_rod', text: "Use a Fishing Rod", req: { type: 'item', id: 'item_fishing_rod', name: 'Fishing Rod' }, effect: { type: 'item', id: 'food_fish', chance: 0.8, fail: { type: 'text', message: "The fish aren't biting." } } },
            { id: 'fish_hands', text: "Try to catch one by hand", effect: { type: 'item', id: 'food_fish', chance: 0.1, fail: { type: 'text', message: "They're too fast!" } } },
            { id: 'skip_stone', text: "Skip a stone", effect: { type: 'text', message: "Plip... plip... plip. That was relaxing." } }
        ]
    },
    {
        id: 'evt_spider_grove',
        type: 'gathering',
        title: "Spider-Infested Grove",
        description: "Thick, sticky webs cover everything here. You can see valuable silk.",
        choices: [
            { id: 'burn', text: "Burn the webs (Requires Torch)", req: { type: 'item', id: 'item_torch', name: 'Torch', consume: true }, effect: { type: 'item', id: 'mat_silk', chance: 1.0, message: "The webs burn away, leaving pristine silk." } },
            { id: 'cut', text: "Cut through with a weapon", effect: { type: 'item', id: 'mat_silk', chance: 0.5, fail: { type: 'combat', enemyRarity: 'Uncommon', message: "A giant spider descends to protect its web!" } } },
            { id: 'avoid', text: "Avoid this place", effect: { type: 'text', message: "You're not a fan of spiders." } }
        ]
    },
    {
        id: 'evt_sunken_ruins',
        type: 'gathering',
        title: "Sunken Ruins",
        description: "The top of an old tower juts out from a murky lake. There might be treasure below.",
        choices: [
            { id: 'dive', text: "Dive for treasure", effect: { type: 'item', rarity: 'Rare', chance: 0.3, fail: { type: 'damage', amount: 20, message: "You ran out of air and hit your head." } } },
            { id: 'fish', text: "Fish near the ruins", req: { type: 'item', id: 'item_fishing_rod', name: 'Fishing Rod' }, effect: { type: 'item', id: 'item_old_boot', chance: 0.5, fail: { type: 'text', message: "Nothing seems to be biting." } } },
            { id: 'leave', text: "Too dangerous", effect: { type: 'text', message: "The water looks cold and unwelcoming." } }
        ]
    },
    {
        id: 'evt_crystal_cave',
        type: 'gathering',
        title: "Crystal Cave",
        description: "A cave whose walls are lined with faintly glowing, fist-sized crystals.",
        choices: [
            { id: 'mine', text: "Mine a crystal", req: { type: 'item', id: 'item_pickaxe', name: 'Iron Pickaxe' }, effect: { type: 'item', id: 'mat_crystal', chance: 1.0 } },
            { id: 'absorb', text: "Absorb the energy", effect: { type: 'heal', amount: 50, chance: 0.7, fail: { type: 'damage', amount: 10, message: "The energy is unstable and hurts you." } } },
            { id: 'leave', text: "Leave the cave", effect: { type: 'text', message: "You leave the beautiful cave untouched." } }
        ]
    },
    {
        id: 'evt_battlefield',
        type: 'narrative',
        title: "Ancient Battlefield",
        description: "You walk across a field littered with rusted swords and broken shields from a long-forgotten battle.",
        choices: [
            { id: 'scavenge', text: "Scavenge for usable gear", effect: { type: 'item', rarity: 'Common', chance: 0.4, fail: { type: 'combat', enemyRarity: 'Uncommon', message: "The spirit of a fallen soldier rises to defend this ground!" } } },
            { id: 'respects', text: "Pay respects to the fallen", effect: { type: 'xp', amount: 100, message: "A brief moment of silence for the dead." } },
            { id: 'search_bodies', text: "Search the bodies for gold", effect: { type: 'gold', amount: 30, chance: 0.6, fail: { type: 'text', message: "You find nothing but dust and bones." } } }
        ]
    },
    {
        id: 'evt_troll_bridge',
        type: 'narrative',
        title: "Toll Bridge",
        description: "A grumpy troll blocks a sturdy-looking bridge. 'Toll! 25 gold to cross!' he grunts.",
        choices: [
            { id: 'pay', text: "Pay the 25G toll", req: { type: 'gold', amount: 25 }, effect: { type: 'text', message: "The troll lets you pass with a grumble." } },
            { id: 'riddle', text: "Answer a riddle instead", effect: { type: 'xp', amount: 150, chance: 0.5, message: "You answer correctly! The troll is impressed and lets you pass.", fail: { type: 'text', message: "'Wrong!' The troll forces you to take the long way around." } } },
            { id: 'fight', text: "Fight the troll", effect: { type: 'combat', enemyRarity: 'Rare', message: "The troll cracks his knuckles and readies his club." } }
        ]
    },
    {
        id: 'evt_bard',
        type: 'narrative',
        title: "Traveling Bard",
        description: "A cheerful bard with a lute offers to play you a song for a few coins.",
        choices: [
            { id: 'pay', text: "Pay 10G for a song", req: { type: 'gold', amount: 10 }, effect: { type: 'xp', amount: 50, message: "The song is inspiring and lifts your spirits." } },
            { id: 'request', text: "Request a tale of heroes", effect: { type: 'xp', amount: 75, message: "The bard tells a grand story of a legendary warrior." } },
            { id: 'ignore', text: "Ignore him", effect: { type: 'text', message: "You're not in the mood for music." } }
        ]
    },
    {
        id: 'evt_cursed_idol',
        type: 'narrative',
        title: "Cursed Idol",
        description: "A small, grotesque idol sits on a pedestal. It seems to watch you.",
        choices: [
            { id: 'take', text: "Take the idol", effect: { type: 'item', id: 'item_cursed_idol', chance: 1.0, message: "You pocket the idol. You feel a chill run down your spine." } },
            { id: 'destroy', text: "Destroy it", effect: { type: 'combat', enemyRarity: 'Rare', message: "As the idol shatters, a vengeful spirit emerges!" } },
            { id: 'pray', text: "Pray to it", effect: { type: 'gold', amount: 100, chance: 0.1, fail: { type: 'damage', amount: 30, message: "The idol demands a blood sacrifice... from you!" } } }
        ]
    },
    {
        id: 'evt_apiary',
        type: 'gathering',
        title: "Wild Apiary",
        description: "A huge beehive hangs from a thick branch, buzzing loudly. It's dripping with honey.",
        choices: [
            { id: 'harvest', text: "Try to harvest honey", effect: { type: 'item', id: 'food_honey', chance: 0.4, fail: { type: 'damage', amount: 20, message: "The bees swarm and sting you relentlessly!" } } },
            { id: 'smoke', text: "Smoke them out (Requires Torch)", req: { type: 'item', id: 'item_torch', name: 'Torch', consume: true }, effect: { type: 'item', id: 'food_honey', chance: 0.9, fail: { type: 'text', message: "The smoke wasn't enough and they got angry." } } },
            { id: 'leave', text: "Leave them bee", effect: { type: 'text', message: "You decide not to risk the stings." } }
        ]
    },
    {
        id: 'evt_hermit',
        type: 'narrative',
        title: "Hermit's Cave",
        description: "You stumble upon a small, clean cave. An old hermit sits inside, offering you a cup of tea.",
        choices: [
            { id: 'accept', text: "Accept the tea", effect: { type: 'heal', amount: 75, message: "The tea is warm and rejuvenating." } },
            { id: 'ask', text: "Ask for wisdom", effect: { type: 'xp', amount: 120, message: "The hermit shares a cryptic but insightful piece of advice." } },
            { id: 'decline', text: "Decline and leave", effect: { type: 'text', message: "You politely decline and continue on your journey." } }
        ]
    }
];