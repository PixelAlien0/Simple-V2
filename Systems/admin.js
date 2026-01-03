/**
 * systems/admin.js
 * Admin panel functionality for managing users.
 */
window.Game = window.Game || {};

Game.admin = {
    /**
     * Fetches and renders the list of active users.
     */
    async render() {
        const listContainer = document.getElementById('admin-user-list');
        if (!listContainer) return;

        // Show loading state
        listContainer.innerHTML = `
            <div class="p-8 text-center text-gray-500 animate-pulse">
                Fetching user data...
            </div>
        `;

        try {
            // Request user list from server
            // Note: Ensure your server has a GET /api/admin/users endpoint
            const data = await API.request('/api/admin/users', 'GET');
            
            if (!data || !data.users) {
                listContainer.innerHTML = `
                    <div class="p-8 text-center text-red-500">
                        Failed to load users. You may not have permission.
                    </div>
                `;
                return;
            }

            if (data.users.length === 0) {
                listContainer.innerHTML = `
                    <div class="p-8 text-center text-gray-500">
                        No active users found.
                    </div>
                `;
                return;
            }

            // Render user list
            listContainer.innerHTML = data.users.map(user => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 shadow-inner">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                ${user.username}
                                ${user.isAdmin ? '<span class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>' : ''}
                                ${user.isBanned ? '<span class="text-[10px] bg-gray-800 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Banned</span>' : ''}
                            </div>
                            <div class="text-xs text-gray-500 font-mono">
                                Lvl ${user.level || 1} <span class="mx-1">•</span> ID: ${user.id}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="Game.admin.performAction('kick', '${user.id}', '${user.username}')" 
                            ${user.isAdmin ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700 rounded text-gray-400"' : 
                            'class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400 transition-colors"'}>
                            Kick
                        </button>
                        <button onclick="Game.admin.performAction('ban', '${user.id}', '${user.username}')" 
                            ${user.isAdmin || user.isBanned ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/30 text-red-300 rounded"' : 
                            'class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"'}>
                            Ban
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error("Admin Render Error:", err);
            listContainer.innerHTML = `
                <div class="p-8 text-center text-red-500">
                    <p class="font-bold">Connection Error</p>
                    <p class="text-sm mt-2">Server returned invalid data (likely 404).</p>
                    <p class="text-xs text-gray-400 mt-1">Check GET /api/admin/users endpoint.</p>
                </div>
            `;
        }
    },

    /**
     * Performs an administrative action on a user.
     * @param {string} action - The action to perform (e.g., 'kick', 'ban').
     * @param {string} userId - The ID of the target user.
     * @param {string} username - The username for display purposes.
     */
    async performAction(action, userId, username) {
        if (!confirm(`Are you sure you want to ${action} user "${username}"?`)) {
            return;
        }

        try {
            // Send action request to server
            const result = await API.request('/api/admin/action', 'POST', {
                action: action,
                targetId: userId
            });

            if (result && result.success) {
                if (Game.ui && Game.ui.toast) {
                    Game.ui.toast.show(`User ${username} was ${action}ed.`, 'success');
                }
                // Refresh the list to reflect changes
                this.render();
            }
        } catch (err) {
            console.error(`Admin Action (${action}) Error:`, err);
            if (Game.ui && Game.ui.toast) {
                Game.ui.toast.show(`Failed to ${action} user.`, 'error');
            }
        }
    }
};