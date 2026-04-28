// ── Hyperliquid API ──

export async function fetchHyperliquid() {
    const r = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
    });
    const [meta, ctxs] = await r.json();
    const out = {};

    meta.universe.forEach((coin, i) => {
        const ctx = ctxs[i];
        const prev = parseFloat(ctx.prevDayPx);
        const mark = parseFloat(ctx.markPx);
        const dayVlm = parseFloat(ctx.dayNtlVlm);

        out[coin.name] = {
            symbol: coin.name,
            lastPrice: mark,
            priceChangePercent: prev ? ((mark - prev) / prev) * 100 : 0,
            volume: dayVlm,
            high24h: null,
            low24h: null
        };
    });

    return out;
}
