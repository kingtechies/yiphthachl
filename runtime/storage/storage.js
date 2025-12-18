/**
 * Yiphthachl Storage
 * Local storage and persistence utilities
 */

class YiphthachlStorage {
    constructor(prefix = 'yiph_') {
        this.prefix = prefix;
    }

    /**
     * Get prefixed key
     */
    getKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Store a value
     */
    set(key, value) {
        try {
            const serialized = JSON.stringify({
                value,
                timestamp: Date.now()
            });
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }

    /**
     * Get a value
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return defaultValue;

            const { value, timestamp } = JSON.parse(item);
            return value;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }

    /**
     * Remove a value
     */
    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }

    /**
     * Check if key exists
     */
    has(key) {
        return localStorage.getItem(this.getKey(key)) !== null;
    }

    /**
     * Get all keys
     */
    keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keys.push(key.slice(this.prefix.length));
            }
        }
        return keys;
    }

    /**
     * Clear all stored values
     */
    clear() {
        const keys = this.keys();
        keys.forEach(key => this.remove(key));
    }

    /**
     * Store with expiration
     */
    setWithExpiry(key, value, ttlMs) {
        try {
            const serialized = JSON.stringify({
                value,
                timestamp: Date.now(),
                expiry: Date.now() + ttlMs
            });
            localStorage.setItem(this.getKey(key), serialized);
            return true;
        } catch (error) {
            console.error('Storage setWithExpiry error:', error);
            return false;
        }
    }

    /**
     * Get with expiration check
     */
    getWithExpiry(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            if (!item) return defaultValue;

            const { value, expiry } = JSON.parse(item);

            if (expiry && Date.now() > expiry) {
                this.remove(key);
                return defaultValue;
            }

            return value;
        } catch (error) {
            console.error('Storage getWithExpiry error:', error);
            return defaultValue;
        }
    }
}

// Session storage wrapper
class YiphthachlSessionStorage {
    constructor(prefix = 'yiph_') {
        this.prefix = prefix;
    }

    getKey(key) {
        return `${this.prefix}${key}`;
    }

    set(key, value) {
        try {
            sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Session storage set error:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Session storage get error:', error);
            return defaultValue;
        }
    }

    remove(key) {
        sessionStorage.removeItem(this.getKey(key));
    }

    clear() {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
}

// Create global instances
export const storage = new YiphthachlStorage();
export const sessionStore = new YiphthachlSessionStorage();

// Convenience functions
export function store(key, value) {
    return storage.set(key, value);
}

export function retrieve(key, defaultValue = null) {
    return storage.get(key, defaultValue);
}

export function forget(key) {
    return storage.remove(key);
}

/**
 * Reactive storage that notifies on changes
 */
export class ReactiveStorage {
    constructor(key, defaultValue = null) {
        this.key = key;
        this.listeners = [];
        this._value = storage.get(key, defaultValue);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        const oldValue = this._value;
        this._value = newValue;
        storage.set(this.key, newValue);
        this.listeners.forEach(listener => listener(newValue, oldValue));
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export function reactiveStorage(key, defaultValue) {
    return new ReactiveStorage(key, defaultValue);
}
