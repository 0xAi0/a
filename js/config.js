// ── Exchange Configuration ──

export const DEFAULT_SYMBOLS = {
    hyperliquid: ['BTC', 'ETH', 'SOL', 'NEAR', 'AAVE', 'ENA', 'FARTCOIN', 'APT'],
    lighter: ['BTC'],
    asterdex: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'NEARUSDT'],
    binance: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LITUSDT', 'AAVEUSDT', 'ENAUSDT', 'LDOUSDT', 'APTUSDT', 'ZAMAUSDT', 'CAKEUSDT']
};

// Extend this map as you discover additional market IDs.
export const LIGHTER_DEFAULT_MARKETS = {
    BTC: 120
};

export const EXCHANGE_META = {
    hyperliquid: {
        label: 'Hyperliquid Perpetuals',
        badge: 'HL',
        cls: 'hl',
        type: 'Perpetual',
        color: '#22d3ee'
    },
    lighter: {
        label: 'Lighter Exchange',
        badge: 'LT',
        cls: 'lt',
        type: 'Perp',
        color: '#818cf8'
    },
    asterdex: {
        label: 'AsterDex Futures',
        badge: 'AD',
        cls: 'ad',
        type: 'Futures',
        color: '#34d399'
    },
    binance: {
        label: 'Binance Futures',
        badge: 'BN',
        cls: 'bn',
        type: 'Perpetual',
        color: '#fbbf24'
    }
};
