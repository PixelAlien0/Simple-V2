/**
 * API Layer
 * Handles communication with the server
 */
const API = {
    async request(endpoint, method = 'POST', body = null) {
        const token = Game.token;
        if (!token) {
            console.error("No token found");
            return null;
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(endpoint, options);
            const data = await response.json();
            
            if (!response.ok) {
                Game.ui.toast.show(data.error || "Server Error", "error");
                return null;
            }
            
            return data;
        } catch (err) {
            console.error("API Error:", err);
            Game.ui.toast.show("Connection Failed", "error");
            return null;
        }
    },

    combat: {
        attack: () => API.request('/api/combat/attack'),
        heal: () => API.request('/api/combat/heal')
    },

    inventory: {
        equip: (index) => API.request('/api/inventory/equip', 'POST', { index }),
        unequip: (slot) => API.request('/api/inventory/unequip', 'POST', { slot }),
        use: (index) => API.request('/api/inventory/use', 'POST', { index }),
        stack: () => API.request('/api/inventory/stack', 'POST'),
        split: (index) => API.request('/api/inventory/split', 'POST', { index }),
        // Repair logic is complex, keeping local for now or add later
    },

    shop: {
        buy: (itemId) => API.request('/api/shop/buy', 'POST', { itemId }),
        sell: (index, price) => API.request('/api/shop/sell', 'POST', { index, price })
    },
    
    explore: {
        action: () => API.request('/api/explore')
    },

    market: {
        getListings: () => API.request('/api/market/listings', 'GET'),
        list: (index, price) => API.request('/api/market/list', 'POST', { index, price }),
        buy: (listingId) => API.request('/api/market/buy', 'POST', { listingId }),
        cancel: (listingId) => API.request('/api/market/cancel', 'POST', { listingId })
    },

    gacha: {
        pull: (bannerId, amount) => API.request('/api/gacha/pull', 'POST', { bannerId, amount })
    }
};