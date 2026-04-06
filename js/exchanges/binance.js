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
 * Fetch token info from Binance marketing API
 * Includes: market cap, FDV, circulating supply, total supply, description
 */
export async function fetchBinanceTokenInfo(symbol) {
    // Check cache first
    const cached = state.getCachedTokenInfo(symbol);
    if (cached) return cached;

    const cleanSym = symbol.replace(/USDT$/i, '').replace(/-USDT$/i, '').toUpperCase();

    try {
        // Try the Binance marketing API
        const r = await fetch(
            `https://www.binance.com/bapi/apex/v1/friendly/apex/marketing/web/token-info?symbol=${cleanSym}`
        );

        if (!r.ok) {
            throw new Error(`HTTP ${r.status}`);
        }

        const json = await r.json();

        if (json.success && json.data) {
            const d = json.data;
            const info = {
                name: d.name || cleanSym,
                symbol: d.symbol || cleanSym,
                marketCap: parseFloat(d.marketCap) || null,
                fdv: parseFloat(d.fullyDilutedMarketCap || d.fdv) || null,
                circulatingSupply: parseFloat(d.circulatingSupply) || null,
                totalSupply: parseFloat(d.totalSupply) || null,
                maxSupply: parseFloat(d.maxSupply) || null,
                description: d.description || null,
                website: d.officialWebsite || d.website || null,
                rank: d.rank || null,
                source: 'binance'
            };

            state.cacheTokenInfo(symbol, info);
            return info;
        }
    } catch (e) {
        console.warn(`Binance token info failed for ${cleanSym}:`, e.message);
    }

    // Fallback: CoinGecko /coins endpoint for full market data (FDV, supply, etc.)
    try {
        const cgId = getCoingeckoId(cleanSym.toLowerCase());
        const cgR = await fetch(
            `https://api.coingecko.com/api/v3/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
        );
        
        if (cgR.ok) {
            const coin = await cgR.json();
            const md = coin.market_data || {};
            const info = {
                name: coin.name || cleanSym,
                symbol: (coin.symbol || cleanSym).toUpperCase(),
                marketCap: md.market_cap?.usd || null,
                fdv: md.fully_diluted_valuation?.usd || null,
                circulatingSupply: md.circulating_supply || null,
                totalSupply: md.total_supply || null,
                maxSupply: md.max_supply || null,
                description: null,
                website: coin.links?.homepage?.[0] || null,
                rank: coin.market_cap_rank || null,
                source: 'coingecko'
            };
            state.cacheTokenInfo(symbol, info);
            return info;
        }
    } catch (e2) {
        console.warn('CoinGecko fallback also failed:', e2.message);
    }

    // Return empty info
    const emptyInfo = {
        name: cleanSym,
        symbol: cleanSym,
        marketCap: null,
        fdv: null,
        circulatingSupply: null,
        totalSupply: null,
        maxSupply: null,
        description: null,
        website: null,
        rank: null,
        source: 'none'
    };
    state.cacheTokenInfo(symbol, emptyInfo);
    return emptyInfo;
}

// Simple CoinGecko ID mapping for common tokens
function getCoingeckoId(sym) {
    const map = {
        btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin',
        xrp: 'ripple', ada: 'cardano', avax: 'avalanche-2', dot: 'polkadot',
        near: 'near', aave: 'aave', ena: 'ethena', apt: 'aptos',
        arb: 'arbitrum', op: 'optimism', link: 'chainlink', matic: 'matic-network',
        doge: 'dogecoin', shib: 'shiba-inu', uni: 'uniswap', atom: 'cosmos'
    };
    return map[sym] || sym;
}
