window.Game = window.Game || {};

Game.shop = {
    buyItem(itemId) {
        const itemData = DB.items.find(i => i.id === itemId);
        if (!itemData) {
            console.error(`Item with id ${itemId} not found in database.`);
            return;
        }

        if (Game.state.player.gold >= itemData.value) {
            Game.state.player.gold -= itemData.value;
            Game.items.givePlayerItem(itemId);
            Game.ui.log(`Purchased <span class="rarity-${itemData.rarity}">${itemData.name}</span> for ${itemData.value} gold.`);
            Game.ui.updateAll();
            this.renderShop(); // Re-render shop to update player gold display
        } else {
            Game.ui.log("Not enough gold.");
        }
    },

    sellItem(inventoryIndex) {
        const itemInstance = Game.state.player.inventory[inventoryIndex];
        if (!itemInstance) return;

        const itemData = DB.items.find(i => i.id === itemInstance.id);
        if (!itemData) return;

        Game.state.player.gold += itemData.value;
        Game.state.player.inventory.splice(inventoryIndex, 1);

        Game.ui.log(`Sold <span class="rarity-${itemData.rarity}">${itemData.name}</span> for ${itemData.value} gold.`);
        Game.ui.updateAll();
        this.renderShop(); // Re-render shop to update lists and gold
    },

    renderShop() {
        const buyList = document.getElementById('shop-buy-list');
        const sellList = document.getElementById('shop-sell-list');
        const shopGold = document.getElementById('shop-player-gold');

        if (!buyList || !sellList || !shopGold) return;

        shopGold.innerText = Game.state.player.gold;

        buyList.innerHTML = DB.items
            .filter(item => item.value > 0)
            .map(item => `
                <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center gap-4">
                    <div class="flex-grow pr-4">
                        <div class="font-bold rarity-${item.rarity}">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.type}</div>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-4">
                        <div class="w-20 text-right font-mono text-sm text-gray-500">${item.value} Gold</div>
                        <div class="w-20">
                            <button class="text-xs game-button !py-1 !px-3 w-full" onclick="Game.shop.buyItem('${item.id}')">Buy</button>
                        </div>
                    </div>
                </div>
            `).join('');

        if (Game.state.player.inventory.length === 0) {
            sellList.innerHTML = `<p class="p-4 text-center text-gray-500 italic">Your backpack is empty.</p>`;
        } else {
            sellList.innerHTML = Game.state.player.inventory.map((itemInstance, index) => {
                const itemData = DB.items.find(i => i.id === itemInstance.id);
                if (!itemData) return '';
                return `
                    <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center gap-4">
                        <div class="flex-grow pr-4">
                            <div class="font-bold rarity-${itemData.rarity}">${itemData.name}</div>
                            <div class="text-xs text-gray-500">${itemData.type}</div>
                        </div>
                        <div class="flex-shrink-0 flex items-center gap-4">
                            <div class="w-20 text-right font-mono text-sm text-gray-500">${itemData.value} Gold</div>
                            <div class="w-20">
                                <button class="text-xs game-button !py-1 !px-3 w-full" onclick="Game.shop.sellItem(${index})">Sell</button>
                            </div>
                        </div>
                    </div>`;
            }).join('');
        }
    }
};