// ── List Row Component ──

import { state } from '../state.js';
import { EXCHANGE_META } from '../config.js';
import { formatPrice, formatVolume, cleanSymbol } from '../utils/format.js';

export function createListRow(data, { onRemove, onClick }) {
    const meta = EXCHANGE_META[state.activeExchange];
    const pos = data.priceChangePercent >= 0;
    const displaySym = cleanSymbol(data.symbol);

    const row = document.createElement('tr');
    row.dataset.symbol = data.symbol;

    row.innerHTML = `
        <td>
            <div class="list-sym">
                <div class="sym-icon">${displaySym.substring(0, 2)}</div>
                <div>
                    <div style="font-weight:700;color:white">${displaySym}</div>
                    <span class="ex-badge ${meta.cls}" style="margin-top:3px;display:inline-block">${meta.badge}</span>
                </div>
            </div>
        </td>
        <td style="font-variant-numeric:tabular-nums;font-weight:600">$${formatPrice(data.lastPrice)}</td>
        <td>
            <span class="change-badge ${pos ? 'up' : 'down'}">
                ${pos ? '▲' : '▼'} ${Math.abs(data.priceChangePercent).toFixed(2)}%
            </span>
        </td>
        <td style="color:var(--text-muted)">${formatVolume(data.volume)}</td>
        <td style="text-align:right">
            <button class="remove-btn" style="position:static;opacity:1" title="Remove">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </td>`;

    row.addEventListener('click', e => {
        if (!e.target.closest('.remove-btn')) onClick(data);
    });

    row.querySelector('.remove-btn').addEventListener('click', e => {
        e.stopPropagation();
        onRemove(data.symbol);
    });

    return row;
}

export function renderErrorRow(symbol) {
    const displaySym = cleanSymbol(symbol);
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="color:var(--red);font-weight:700">${displaySym}</td>
        <td colspan="3" style="color:var(--text-muted)">Not available on this exchange</td>
        <td></td>`;
    return row;
}
