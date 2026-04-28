// ── Lighter Exchange API ──

import { LIGHTER_DEFAULT_MARKETS } from '../config.js';

const LIGHTER_MARKET_MAP_KEY = 'lighterMarketMap';
const LIGHTER_CANDLES_URL = 'https://mainnet.zklighter.elliot.ai/api/v1/candles';

function getStoredMarketMap() {
    try {
        return JSON.parse(localStorage.getItem(LIGHTER_MARKET_MAP_KEY) || '{}');
    } catch {
        return {};
    }
}

function getLighterMarketMap() {
    return {
        ...LIGHTER_DEFAULT_MARKETS,
        ...getStoredMarketMap()
    };
}

function buildCandleUrl(marketId) {
    const end = Date.now();
    const start = end - (4 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
        market_id: String(marketId),
        resolution: '1d',
        start_timestamp: String(start),
        end_timestamp: String(end),
        count_back: '4'
    });
    return `${LIGHTER_CANDLES_URL}?${params.toString()}`;
}

export function upsertLighterMarket(symbol, marketId) {
    const sym = String(symbol || '').trim().toUpperCase();
    const id = Number(marketId);
    if (!sym || !Number.isFinite(id) || id <= 0) return false;
    const next = { ...getStoredMarketMap(), [sym]: id };
    localStorage.setItem(LIGHTER_MARKET_MAP_KEY, JSON.stringify(next));
    return true;
}

export function fetchLighterPairs() {
    return Object.keys(getLighterMarketMap()).sort();
}

export async function fetchLighter() {
    const marketMap = getLighterMarketMap();
    const entries = Object.entries(marketMap);
    if (!entries.length) return { __lighter_error: 'no-market-map' };

    const settled = await Promise.allSettled(
        entries.map(async ([symbol, marketId]) => {
            const r = await fetch(buildCandleUrl(marketId), { headers: { Accept: 'application/json' } });
            if (!r.ok) throw new Error(String(r.status));
            const json = await r.json();
            const candles = json.c || [];
            if (!candles.length) return null;

            const last = candles[candles.length - 1];
            const prev = candles[candles.length - 2] || last;

            const lastClose = Number(last.c);
            const prevClose = Number(prev.c || prev.o || lastClose);
            if (!Number.isFinite(lastClose) || lastClose <= 0) return null;

            const changePct = prevClose ? ((lastClose - prevClose) / prevClose) * 100 : 0;
            return {
                symbol,
                data: {
                    symbol,
                    lastPrice: lastClose,
                    priceChangePercent: changePct,
                    volume: Number(last.V || last.v || 0),
                    high24h: Number(last.h) || null,
                    low24h: Number(last.l) || null
                }
            };
        })
    );

    const out = {};
    let firstError = null;

    settled.forEach((item) => {
        if (item.status === 'fulfilled') {
            if (item.value?.symbol && item.value?.data) {
                out[item.value.symbol] = item.value.data;
            }
            return;
        }
        if (!firstError) firstError = item.reason?.message || 'lighter-error';
    });

    if (!Object.keys(out).length) {
        return { __lighter_error: firstError || 'lighter-empty' };
    }
    return out;
}
