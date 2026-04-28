// ── AsterDex API ──

export async function fetchAsterDex() {
    const r = await fetch('https://fapi.asterdex.com/fapi/v1/ticker/24hr');
    const arr = await r.json();
    const out = {};

    arr.forEach(t => {
        out[t.symbol] = {
            symbol: t.symbol,
            lastPrice: parseFloat(t.lastPrice),
            priceChangePercent: parseFloat(t.priceChangePercent),
            volume: parseFloat(t.quoteVolume),
            high24h: parseFloat(t.highPrice) || null,
            low24h: parseFloat(t.lowPrice) || null
        };
    });

    return out;
}
