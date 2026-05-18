// ── Binance API ──
// Uses public Binance API for ticker data and marketing API for token info (mcap, fdv, etc.)

import { state } from '../state.js';

/**
 * Fetch all 24hr ticker data from Binance USDT-M futures
 * Filters out delisted/non-trading symbols using exchangeInfo
 */
export async function fetchBinance() {
    const [tickerRes, infoRes] = await Promise.all([
        fetch('https://fapi.binance.com/fapi/v1/ticker/24hr'),
        fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
    ]);

    const arr = await tickerRes.json();
    const info = await infoRes.json();

    // Build set of active perpetual contracts only.
    const tradingSymbols = new Set();
    (info.symbols || []).forEach(s => {
        if (s.status === 'TRADING' && s.contractType === 'PERPETUAL') {
            tradingSymbols.add(s.symbol);
        }
    });

    const out = {};

    arr.forEach(t => {
        // Skip delisted / non-trading / zero-volume pairs.
        if (!tradingSymbols.has(t.symbol)) return;
        const vol = parseFloat(t.quoteVolume);
        if (vol <= 0) return;

        out[t.symbol] = {
            symbol: t.symbol,
            lastPrice: parseFloat(t.lastPrice),
            priceChangePercent: parseFloat(t.priceChangePercent),
            volume: vol,
            high24h: parseFloat(t.highPrice) || null,
            low24h: parseFloat(t.lowPrice) || null,
            openPrice: parseFloat(t.openPrice) || null,
            weightedAvgPrice: parseFloat(t.weightedAvgPrice) || null,
            trades: parseInt(t.count) || 0
        };
    });

    return out;
}

export async function fetchBinanceFuturesPairs() {
    const infoRes = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
    const info = await infoRes.json();
    return (info.symbols || [])
        .filter(s => (
            s.status === 'TRADING'
            && s.contractType === 'PERPETUAL'
            && s.quoteAsset === 'USDT'
        ))
        .map(s => s.symbol)
        .sort();
}

/**
 * Fetch high/low for a custom period using Binance Klines
 */
export async function fetchBinanceCustomHighLow(symbol, period) {
    try {
        let interval = '1m';
        let limit = 60;
        
        switch (period) {
            case '15m': interval = '1m'; limit = 15; break;
            case '1h': interval = '1m'; limit = 60; break;
            case '4h': interval = '5m'; limit = 48; break;
            case '12h': interval = '15m'; limit = 48; break;
            case '24h': interval = '1h'; limit = 24; break;
        }

        const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
        if (!res.ok) return null;
        
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        
        let high = -Infinity;
        let low = Infinity;
        
        for (const candle of data) {
            const h = parseFloat(candle[2]);
            const l = parseFloat(candle[3]);
            if (h > high) high = h;
            if (l < low) low = l;
        }
        
        return {
            high: high === -Infinity ? null : high,
            low: low === Infinity ? null : low
        };
    } catch (e) {
        console.warn(`Failed to fetch custom high/low for ${symbol}:`, e.message);
        return null;
    }
}



/**
 * Fetch historical low price over a given number of days from Binance Klines
 */
export async function fetchBinanceHistoricalLow(symbol, days) {
    try {
        // max limit is 1000 for interval 1d
        const limit = Math.min(days, 1000);
        const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1d&limit=${limit}`);
        if (!res.ok) return null;
        
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        
        let minLow = Infinity;
        for (const candle of data) {
            const low = parseFloat(candle[3]); // index 3 is low price
            if (low < minLow) minLow = low;
        }
        
        return minLow === Infinity ? null : minLow;
    } catch (e) {
        console.warn(`Failed to fetch historical low for ${symbol}:`, e.message);
        return null;
    }
}
