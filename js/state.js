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
        const pinnedSymbols = JSON.parse(localStorage.getItem('pinnedSymbols') || '{}');
        const legacyPinned = localStorage.getItem('pinnedSymbol');
        if (legacyPinned && !pinnedSymbols.binance) {
            pinnedSymbols.binance = legacyPinned;
            localStorage.removeItem('pinnedSymbol');
        }
        this.pinnedSymbols = pinnedSymbols;
        this.availablePairs = {};
    }

    setPinnedSymbol(symbol) {
        if (symbol) {
            this.pinnedSymbols[this.activeExchange] = symbol;
        } else {
            delete this.pinnedSymbols[this.activeExchange];
        }
        localStorage.setItem('pinnedSymbols', JSON.stringify(this.pinnedSymbols));
    }

    getPinnedSymbol() {
        return this.pinnedSymbols[this.activeExchange] || null;
    }

    setAvailablePairs(exchange, pairs) {
        this.availablePairs[exchange] = Array.isArray(pairs) ? pairs : [];
    }

    getAvailablePairs(exchange = this.activeExchange) {
        return this.availablePairs[exchange] || [];
    }

    pinSymbolToTop(symbol) {
        const syms = this.symbolSets[this.activeExchange] || [];
        const idx = syms.indexOf(symbol);
        if (idx <= 0) return;
        syms.splice(idx, 1);
        syms.unshift(symbol);
        this.saveSymbols();
    }

    clearPinnedIfRemoved(symbol) {
        if (this.getPinnedSymbol() === symbol) {
            this.setPinnedSymbol(null);
        }
    }

    getSymbols() {
        const symbols = [...(this.symbolSets[this.activeExchange] || [])];
        const pinned = this.getPinnedSymbol();
        if (!pinned) return symbols;
        const idx = symbols.indexOf(pinned);
        if (idx > 0) {
            symbols.splice(idx, 1);
            symbols.unshift(pinned);
        }
        return symbols;
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
        this.clearPinnedIfRemoved(symbol);
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
