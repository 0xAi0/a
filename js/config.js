// ── Exchange Configuration ──

export const DEFAULT_SYMBOLS = {
    hyperliquid: ['BTC', 'ETH', 'SOL', 'NEAR', 'AAVE', 'ENA', 'FARTCOIN', 'APT'],
    lighter: ['BTC', 'ETH', 'SOL', 'ARB', 'OP'],
    asterdex: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'NEARUSDT'],
    binance: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LITUSDT', 'AAVEUSDT', 'ENAUSDT', 'LDOUSDT', 'APTUSDT', 'ZAMAUSDT', 'CAKEUSDT']
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
        label: 'Binance Spot',
        badge: 'BN',
        cls: 'bn',
        type: 'Spot',
        color: '#fbbf24'
    }
};
