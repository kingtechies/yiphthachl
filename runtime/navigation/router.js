/**
 * Yiphthachl Navigation System
 * Router and Navigator for screen navigation
 */

class YiphthachlRouter {
    constructor() {
        this.routes = new Map();
        this.history = [];
        this.currentRoute = null;
        this.params = {};
        this.listeners = [];
    }

    /**
     * Register a route
     */
    register(path, component) {
        this.routes.set(path, component);
    }

    /**
     * Navigate to a route
     */
    navigate(path, params = {}, options = {}) {
        const { replace = false, transition = 'slide' } = options;

        if (this.currentRoute && !replace) {
            this.history.push({
                path: this.currentRoute,
                params: this.params
            });
        }

        this.currentRoute = path;
        this.params = params;

        this.notifyListeners({
            type: 'navigate',
            path,
            params,
            transition
        });

        // Update browser history if supported
        if (typeof window !== 'undefined' && window.history) {
            const url = this.buildUrl(path, params);
            if (replace) {
                window.history.replaceState({ path, params }, '', url);
            } else {
                window.history.pushState({ path, params }, '', url);
            }
        }
    }

    /**
     * Go back to previous route
     */
    goBack() {
        if (this.history.length > 0) {
            const previous = this.history.pop();
            this.currentRoute = previous.path;
            this.params = previous.params;

            this.notifyListeners({
                type: 'back',
                path: previous.path,
                params: previous.params,
                transition: 'slideBack'
            });

            if (typeof window !== 'undefined' && window.history) {
                window.history.back();
            }
        }
    }

    /**
     * Check if can go back
     */
    canGoBack() {
        return this.history.length > 0;
    }

    /**
     * Get current route info
     */
    getCurrent() {
        return {
            path: this.currentRoute,
            params: this.params
        };
    }

    /**
     * Build URL from path and params
     */
    buildUrl(path, params = {}) {
        let url = path;

        // Replace path parameters
        Object.keys(params).forEach(key => {
            url = url.replace(`:${key}`, params[key]);
        });

        return url;
    }

    /**
     * Parse URL to get path and params
     */
    parseUrl(url) {
        const [path, queryString] = url.split('?');
        const params = {};

        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                params[key] = decodeURIComponent(value);
            });
        }

        return { path, params };
    }

    /**
     * Add navigation listener
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => listener(event));
    }

    /**
     * Initialize browser history listener
     */
    initBrowserHistory() {
        if (typeof window !== 'undefined') {
            window.addEventListener('popstate', (event) => {
                if (event.state) {
                    this.currentRoute = event.state.path;
                    this.params = event.state.params;
                    this.notifyListeners({
                        type: 'popstate',
                        path: event.state.path,
                        params: event.state.params
                    });
                }
            });
        }
    }
}

/**
 * Navigator widget for managing screen transitions
 */
export class Navigator {
    constructor(options = {}) {
        this.container = null;
        this.screens = new Map();
        this.currentScreen = null;
        this.transitions = options.transitions || {};
    }

    /**
     * Mount the navigator to a container
     */
    mount(container) {
        this.container = container;
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `;
    }

    /**
     * Register a screen
     */
    registerScreen(name, builder) {
        this.screens.set(name, builder);
    }

    /**
     * Push a new screen
     */
    push(screenName, params = {}) {
        const builder = this.screens.get(screenName);
        if (!builder) {
            console.error(`Screen "${screenName}" not found`);
            return;
        }

        const newScreen = builder(params);
        const element = this.wrapScreen(newScreen, 'enter');

        if (this.currentScreen) {
            this.animateScreen(this.currentScreen.element, 'exit');
        }

        this.container.appendChild(element);
        this.currentScreen = { name: screenName, params, element };

        // Trigger enter animation
        requestAnimationFrame(() => {
            element.classList.add('active');
        });
    }

    /**
     * Pop current screen
     */
    pop() {
        if (!this.currentScreen) return;

        this.animateScreen(this.currentScreen.element, 'exit', () => {
            if (this.currentScreen.element.parentNode) {
                this.currentScreen.element.parentNode.removeChild(this.currentScreen.element);
            }
        });
    }

    /**
     * Wrap screen in animation container
     */
    wrapScreen(widget, animation) {
        const wrapper = document.createElement('div');
        wrapper.className = `screen-wrapper screen-${animation}`;
        wrapper.style.cssText = `
            position: absolute;
            inset: 0;
            background: #0f172a;
        `;

        wrapper.appendChild(widget.mount());
        return wrapper;
    }

    /**
     * Animate screen transition
     */
    animateScreen(element, type, callback) {
        element.classList.add(`screen-${type}`);

        element.addEventListener('animationend', () => {
            if (callback) callback();
        }, { once: true });
    }
}

// Create global router instance
export const router = new YiphthachlRouter();

// Helper functions
export function navigateTo(path, params = {}) {
    router.navigate(path, params);
}

export function goBack() {
    router.goBack();
}

export function registerRoute(path, component) {
    router.register(path, component);
}

// Initialize browser history
if (typeof window !== 'undefined') {
    router.initBrowserHistory();
}
