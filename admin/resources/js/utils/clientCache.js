const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

class ClientCache {
    constructor() {
        this.cache = new Map();
        this.expiryTimes = new Map();
    }

    set(key, value, duration = CACHE_DURATION) {
        const expiryTime = Date.now() + duration;
        this.cache.set(key, value);
        this.expiryTimes.set(key, expiryTime);
        return true;
    }

    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const expiryTime = this.expiryTimes.get(key);
        if (Date.now() > expiryTime) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    delete(key) {
        this.cache.delete(key);
        this.expiryTimes.delete(key);
    }

    clear() {
        this.cache.clear();
        this.expiryTimes.clear();
    }

    // Clear expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, expiryTime] of this.expiryTimes.entries()) {
            if (now > expiryTime) {
                this.delete(key);
            }
        }
    }

    // Set multiple items at once
    setMultiple(items, duration = CACHE_DURATION) {
        for (const [key, value] of Object.entries(items)) {
            this.set(key, value, duration);
        }
    }

    // Get multiple items at once
    getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }

    // Check if key exists and is not expired
    has(key) {
        if (!this.cache.has(key)) {
            return false;
        }
        const expiryTime = this.expiryTimes.get(key);
        return Date.now() <= expiryTime;
    }

    // Get all valid keys
    keys() {
        this.cleanup();
        return Array.from(this.cache.keys());
    }

    // Get remaining time for a key
    getTimeToLive(key) {
        if (!this.has(key)) {
            return 0;
        }
        return this.expiryTimes.get(key) - Date.now();
    }
}

const clientCache = new ClientCache();
export default clientCache; 