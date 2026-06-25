# fast-cache-ttl
An optimized, zero-dependency in-memory key-value cache engine for Node.js featuring precise TTL (Time-To-Live) expiration and an automated Least Recently Used (LRU) memory eviction policy

# fast-cache-ttl

A lightning-fast, zero-dependency in-memory data store for Node.js workflows. This utility provides an optimized layer for transient data caching, utilizing an explicit Map-based Least Recently Used (LRU) tracking algorithm combined with active background maintenance sweeping for Time-To-Live (TTL) record structures.

## Core Features

* **Dual Eviction Strategy:** Uses an active Time-To-Live expiration paradigm paired with an autonomous LRU capacity-boundary backup strategy.
* **Non-Blocking Maintenance Sweep:** Uses unreferenced interval sweep timers to clean stale memory footprints periodically without blocking primary event loops.
* **On-Demand Metrics Analytics:** Real-time diagnostics provide precise visibility into hits, misses, and structural evictions.

## Usage Blueprint

```javascript
const FastCacheTTL = require('./cacheEngine');

// Initialize with a max allocation constraint of 3 elements for testing
const cache = new FastCacheTTL({ maxSize: 3, defaultTtl: 5000 });

// Set key data
cache.set("session_user_01", { role: "admin", verified: true });
cache.set("session_user_02", { role: "moderator", verified: true });
cache.set("session_user_03", { role: "guest", verified: false });

// This 4th item triggers an LRU eviction cascade, dropping "session_user_01" automatically
cache.set("session_user_04", { role: "dev", verified: true });

console.log(cache.get("session_user_01")); // Returns: null (Evicted cleanly)
console.log(cache.get("session_user_02")); // Returns: { role: "moderator", verified: true }
console.log(cache.getDiagnostics());
