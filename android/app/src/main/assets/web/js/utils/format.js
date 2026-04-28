// ── Format Utilities ──

export function formatPrice(p) {
    if (!p && p !== 0) return '—';
    if (p < 0.0001) return p.toFixed(8);
    if (p < 0.01)   return p.toFixed(6);
    if (p < 1)      return p.toFixed(5);
    if (p < 100)    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatVolume(v) {
    if (!v && v !== 0) return '$0';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(2) + 'K';
    return '$' + v.toFixed(0);
}

export function formatLargeNumber(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3)  return '$' + (n / 1e3).toFixed(2) + 'K';
    return '$' + n.toFixed(2);
}

export function formatSupply(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9)  return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6)  return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3)  return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
}

export function cleanSymbol(sym) {
    return (sym || '').replace(/USDT$/i, '').replace(/-USDT$/i, '').replace(/-USD$/i, '');
}
