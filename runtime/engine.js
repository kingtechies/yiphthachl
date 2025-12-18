/**
 * Yiphthachl Runtime Engine
 * The core runtime that powers Yiphthachl apps in the browser
 */

export class YiphthachlRuntime {
    constructor() {
        this.state = new Map();
        this.screens = new Map();
        this.currentScreen = null;
        this.history = [];
        this.widgets = new Map();
        this.eventListeners = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize the runtime
     */
    init() {
        if (this.isInitialized) return;

        // Find all screens
        document.querySelectorAll('[data-screen]').forEach(screen => {
            const name = screen.dataset.screen;
            this.screens.set(name, screen);
        });

        // Set initial screen
        if (this.screens.size > 0) {
            const firstScreen = this.screens.keys().next().value;
            this.navigateTo(firstScreen, false);
        }

        // Setup global event listeners
        this.setupGlobalListeners();

        this.isInitialized = true;
        console.log('Yiphthachl Runtime initialized');
    }

    /**
     * Register a state variable
     */
    registerState(name, initialValue) {
        this.state.set(name, {
            value: initialValue,
            listeners: []
        });
    }

    /**
     * Get state value
     */
    getState(name) {
        const state = this.state.get(name);
        return state ? state.value : undefined;
    }

    /**
     * Set state value and trigger updates
     */
    setState(name, value) {
        const state = this.state.get(name);
        if (state) {
            const oldValue = state.value;
            state.value = value;

            // Notify listeners
            state.listeners.forEach(listener => {
                listener(value, oldValue);
            });

            // Trigger UI update
            this.updateUI();
        }
    }

    /**
     * Watch for state changes
     */
    watchState(name, callback) {
        const state = this.state.get(name);
        if (state) {
            state.listeners.push(callback);
        }
    }

    /**
     * Navigate to a screen
     */
    navigateTo(screenName, addToHistory = true) {
        // Hide current screen
        if (this.currentScreen) {
            const current = this.screens.get(this.currentScreen);
            if (current) {
                current.classList.remove('yiph-screen-active');
                current.classList.add('yiph-screen-exit');

                setTimeout(() => {
                    current.classList.remove('yiph-screen-exit');
                }, 300);
            }
        }

        // Show new screen
        const target = this.screens.get(screenName);
        if (target) {
            if (addToHistory && this.currentScreen) {
                this.history.push(this.currentScreen);
            }

            target.classList.add('yiph-screen-active', 'yiph-screen-enter');
            this.currentScreen = screenName;

            setTimeout(() => {
                target.classList.remove('yiph-screen-enter');
            }, 300);
        }
    }

    /**
     * Go back to previous screen
     */
    goBack() {
        if (this.history.length > 0) {
            const previous = this.history.pop();
            this.navigateTo(previous, false);
        }
    }

    /**
     * Show a message/alert
     */
    showMessage(message, type = 'info') {
        const snackbar = document.createElement('div');
        snackbar.className = `yiph-snackbar yiph-snackbar-${type}`;
        snackbar.textContent = message;

        document.body.appendChild(snackbar);

        // Trigger animation
        requestAnimationFrame(() => {
            snackbar.classList.add('yiph-snackbar-visible');
        });

        // Auto-hide
        setTimeout(() => {
            snackbar.classList.remove('yiph-snackbar-visible');
            setTimeout(() => snackbar.remove(), 300);
        }, 3000);
    }

    /**
     * Show a dialog
     */
    showDialog(options) {
        const { title, content, actions = [] } = options;

        const overlay = document.createElement('div');
        overlay.className = 'yiph-dialog-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'yiph-dialog';

        dialog.innerHTML = `
            ${title ? `<h3 class="yiph-dialog-title">${title}</h3>` : ''}
            <div class="yiph-dialog-content">${content}</div>
            <div class="yiph-dialog-actions"></div>
        `;

        const actionsContainer = dialog.querySelector('.yiph-dialog-actions');
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'yiph-button';
            button.textContent = action.text;
            button.onclick = () => {
                if (action.handler) action.handler();
                this.closeDialog(overlay);
            };
            actionsContainer.appendChild(button);
        });

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Trigger animation
        requestAnimationFrame(() => {
            overlay.classList.add('yiph-dialog-visible');
        });

        // Close on backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeDialog(overlay);
            }
        });
    }

    /**
     * Close a dialog
     */
    closeDialog(overlay) {
        overlay.classList.remove('yiph-dialog-visible');
        setTimeout(() => overlay.remove(), 300);
    }

    /**
     * Register a widget for updates
     */
    registerWidget(id, widget) {
        this.widgets.set(id, widget);
    }

    /**
     * Update a specific widget
     */
    updateWidget(id, data) {
        const widget = this.widgets.get(id);
        if (widget && widget.update) {
            widget.update(data);
        }
    }

    /**
     * Update the entire UI
     */
    updateUI() {
        // Dispatch a custom event that widgets can listen to
        document.dispatchEvent(new CustomEvent('yiph-update'));
    }

    /**
     * Setup global event listeners
     */
    setupGlobalListeners() {
        // Handle form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('yiph-form')) {
                e.preventDefault();
            }
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close dialogs
            if (e.key === 'Escape') {
                const dialog = document.querySelector('.yiph-dialog-overlay');
                if (dialog) {
                    this.closeDialog(dialog);
                }
            }

            // Ctrl+Z - Go back
            if (e.ctrlKey && e.key === 'z') {
                this.goBack();
            }
        });
    }

    /**
     * Make an HTTP request
     */
    async fetch(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            return { success: true, data, response };
        } catch (error) {
            return { success: false, error };
        }
    }

    /**
     * Store data locally
     */
    store(key, value) {
        try {
            localStorage.setItem(`yiph_${key}`, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Retrieve stored data
     */
    retrieve(key) {
        try {
            const value = localStorage.getItem(`yiph_${key}`);
            return value ? JSON.parse(value) : null;
        } catch {
            return null;
        }
    }

    /**
     * Remove stored data
     */
    remove(key) {
        localStorage.removeItem(`yiph_${key}`);
    }
}

// Create global runtime instance
export const runtime = new YiphthachlRuntime();

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => runtime.init());
    } else {
        runtime.init();
    }
}
