/**
 * @file cacheEngine.js
 * @description High-performance in-memory key-value storage engine with 
 * Time-To-Live (TTL) expiration tracking and Least Recently Used (LRU) capacity eviction.
 * @version 1.0.0
 */

class FastCacheTTL {
    /**
     * @param {Object} options Configuration options for the cache instance
     * @param {number} options.maxSize Maximum number of keys allowed before eviction triggers
     * @param {number} options.defaultTtl Default time-to-live for elements in milliseconds
     */
    constructor(options = {}) {
        this.maxSize = options.maxSize || 500;
        this.defaultTtl = options.defaultTtl || 300000; // Default: 5 minutes
        
        this.store = new Map();
        this.timeline = new Map(); // Tracks last accessed times for LRU eviction
        
        this.metrics = {
            hits: 0,
            misses: 0,
            evictions: 0,
            expiredCount: 0
        };

        // Initialize automated sweep loop for dead records
        this._startMaintenanceSweep(60000); 
    }

    /**
     * Inserts or updates an entry within the cache layer
     * @param {string} key Unique identifier lookup key
     * @param {*} value Structural data payload
     * @param {number} [ttl] Custom expiration window override in milliseconds
     */
    set(key, value, ttl = this.defaultTtl) {
        if (!key || typeof key !== 'string') {
            throw new TypeError("Cache key identifier must be a valid non-empty string.");
        }

        // If capacity threshold exceeded, execute an LRU eviction cascade
        if (this.store.size >= this.maxSize && !this.store.has(key)) {
            this._evictLeastRecentlyUsed();
        }

        const expiresAt = Date.now() + ttl;
        
        this.store.set(key, {
            payload: value,
            expiresAt: expiresAt
        });

        this._updateTimelineAccess(key);
        return true;
    }

    /**
     * Retrieves an operational data payload if valid and unexpired
     * @param {string} key Unique identifier lookup key
     * @returns {*|null} Returns cached item or null if miss/expired
     */
    get(key) {
        if (!this.store.has(key)) {
            this.metrics.misses++;
            return null;
        }

        const record = this.store.get(key);
        
        // Lazy-evaluation check for expiration
        if (Date.now() > record.expiresAt) {
            this.metrics.expiredCount++;
            this.delete(key);
            this.metrics.misses++;
            return null;
        }

        this.metrics.hits++;
        this._updateTimelineAccess(key);
        return record.payload;
    }

    /**
     * Deletes an explicit pointer target from the cache map matrices
     * @param {string} key Unique identifier lookup key
     */
    delete(key) {
        if (this.store.has(key)) {
            this.store.delete(key);
            this.timeline.delete(key);
            return true;
        }
        return false;
    }

    /**
     * flushes all runtime instances and memory configurations cleanly
     */
    clear() {
        this.store.clear();
        this.timeline.clear();
        console.log("[Cache] Memory blocks successfully flushed and re-initialized.");
    }

    /**
     * Returns operational diagnostics for active process auditing
     */
    getDiagnostics() {
        return {
            currentSize: this.store.size,
            allocatedCapacityPercent: ((this.store.size / this.maxSize) * 100).toFixed(2) + '%',
            performance: this.metrics
        };
    }

    // ==========================================
    // INTERNAL SUBSYSTEM PRIVATE METHODS
    // ==========================================

    _updateTimelineAccess(key) {
        this.timeline.delete(key); // Remove existing reference placement
        this.timeline.set(key, Date.now()); // Re-insert at tail end of iteration layout
    }

    _evictLeastRecentlyUsed() {
        // The first key in a Map iterator represents the oldest entry inserted/updated
        const lruKey = this.timeline.keys().next().value;
        if (lruKey) {
            this.delete(lruKey);
            this.metrics.evictions++;
            console.log(`[Cache-Eviction] Capacity limit reached (${this.maxSize}). Evicted target: ${lruKey}`);
        }
    }

    _startMaintenanceSweep(intervalMs) {
        this.sweepTimer = setInterval(() => {
            const now = Date.now();
            let sweptCount = 0;

            for (const [key, record] of this.store.entries()) {
                if (now > record.expiresAt) {
                    this.delete(key);
                    sweptCount++;
                }
            }

            if (sweptCount > 0) {
                this.metrics.expiredCount += sweptCount;
                console.log(`[Cache-Sweep] Automated daemon sweep completed. Pruned ${sweptCount} expired nodes.`);
            }
        }, intervalMs);

        // Prevent blockages on process termination hooks
        if (this.sweepTimer.unref) {
            this.sweepTimer.unref();
        }
    }
}

module.exports = FastCacheTTL;
