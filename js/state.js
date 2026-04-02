// ── Centralized State Management ──

import { DEFAULT_SYMBOLS } from './config.js';

class AppState {
    constructor() {
        this.activeExchange = localStorage.getItem('activeExchange') || 'binance';
        this.symbolSets = JSON.parse(localStorage.getItem('symbolSets')) || { ...DEFAULT_SYMBOLS };
        this.isGridView = JSON.parse(localStorage.getItem('isGridView')) ?? true;
        this.settings = JSON.parse(localStorage.getItem('settings')) || { refreshInterval: 10 };
        this.globalMarketData = {};
        this.refreshIntervalId = null;
        this.tokenInfoCache = {};
        this.pinnedSymbol = localStorage.getItem('pinnedSymbol') || null;
    }

    setPinnedSymbol(symbol) {
        this.pinnedSymbol = symbol;
        if (symbol) {
            localStorage.setItem('pinnedSymbol', symbol);
        } else {
            localStorage.removeItem('pinnedSymbol');
        }
    }

    getSymbols() {
        return this.symbolSets[this.activeExchange] || [];
    }

    setExchange(exchange) {
        this.activeExchange = exchange;
        localStorage.setItem('activeExchange', exchange);
        // Ensure symbol list exists
        if (!this.symbolSets[exchange]) {
            this.symbolSets[exchange] = DEFAULT_SYMBOLS[exchange] || [];
        }
    }

    addSymbol(symbol) {
        const syms = this.symbolSets[this.activeExchange];
        if (symbol && !syms.includes(symbol)) {
            syms.unshift(symbol);
            this.saveSymbols();
            return true;
        }
        return false;
    }

    removeSymbol(symbol) {
        this.symbolSets[this.activeExchange] = this.symbolSets[this.activeExchange].filter(s => s !== symbol);
        this.saveSymbols();
    }

    saveSymbols() {
        localStorage.setItem('symbolSets', JSON.stringify(this.symbolSets));
    }

    setGridView(val) {
        this.isGridView = val;
        localStorage.setItem('isGridView', JSON.stringify(val));
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    cacheTokenInfo(symbol, data) {
        this.tokenInfoCache[symbol.toUpperCase()] = {
            data,
            timestamp: Date.now()
        };
    }

    getCachedTokenInfo(symbol) {
        const cached = this.tokenInfoCache[symbol.toUpperCase()];
        // Cache for 5 minutes
        if (cached && (Date.now() - cached.timestamp) < 300000) {
            return cached.data;
        }
        return null;
    }
}

// Singleton
export const state = new AppState();
