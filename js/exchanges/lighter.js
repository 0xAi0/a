// ── Lighter Exchange API ──

export async function fetchLighter() {
    const DIRECT = 'https://mainnet.zklighter.elliot.ai/api/v1/orderbooks?blockchain_index=0';
    const r = await fetch(DIRECT, { headers: { 'Accept': 'application/json' } });

    if (!r.ok) {
        return { __lighter_error: r.status };
    }

    const json = await r.json();
    const out = {};
    const books = json.order_books || json.orderBooks || json.result || [];

    books.forEach(b => {
        const sym = (b.base_asset || b.baseAsset || b.symbol || '').toUpperCase()
            .replace('USDT', '').replace('-USDT', '').replace('-USD', '');
        const price = parseFloat(b.mark_price || b.markPrice || b.last_price || b.price || 0);
        const prev = parseFloat(b.index_price || b.indexPrice || b.prev_price || price);
        const changePct = prev ? ((price - prev) / prev) * 100 : 0;
        const vol = parseFloat(b.volume_24h || b.volume || b.volume_base_24h || 0);

        if (sym && price) {
            out[sym] = {
                symbol: sym,
                lastPrice: price,
                priceChangePercent: changePct,
                volume: vol,
                high24h: null,
                low24h: null
            };
        }
    });

    return out;
}
