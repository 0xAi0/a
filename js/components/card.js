// ── Grid Card Component ──

import { state } from '../state.js';
import { EXCHANGE_META } from '../config.js';
import { formatPrice, formatVolume, cleanSymbol } from '../utils/format.js';

export function createGridCard(data, { onRemove, onClick, onPin }) {
    const meta = EXCHANGE_META[state.activeExchange];
    const pos = data.priceChangePercent >= 0;
    const displaySym = cleanSymbol(data.symbol);
    const isPinned = state.pinnedSymbol === data.symbol;

    const card = document.createElement('div');
    card.className = `price-card ${pos ? 'positive' : 'negative'}${isPinned ? ' pinned' : ''}`;
    card.dataset.symbol = data.symbol;

    card.innerHTML = `
        <div class="card-actions">
            <button class="pin-btn${isPinned ? ' active' : ''}" title="${isPinned ? 'Unpin from tab' : 'Pin to tab'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="${isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L12 22"/><path d="M17 7L7 7"/><path d="M15 2L9 2"/><path d="M8 7L5 20"/><path d="M16 7L19 20"/>
                </svg>
            </button>
            <button class="remove-btn" title="Remove" style="position:static;opacity:0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="card-header">
            <div>
                <div class="card-symbol">${displaySym}</div>
                <div class="card-type">${meta.type}</div>
            </div>
            <span class="ex-badge ${meta.cls}">${meta.badge}</span>
        </div>
        <div class="card-price">$${formatPrice(data.lastPrice)}</div>
        <div class="card-footer">
            <span class="change-badge ${pos ? 'up' : 'down'}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    ${pos
                        ? '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'
                        : '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>'
                    }
                </svg>
                ${Math.abs(data.priceChangePercent).toFixed(2)}%
            </span>
            <span class="card-vol">${formatVolume(data.volume)}</span>
        </div>`;

    card.addEventListener('click', e => {
        if (!e.target.closest('.remove-btn') && !e.target.closest('.pin-btn')) onClick(data);
    });

    card.querySelector('.remove-btn').addEventListener('click', e => {
        e.stopPropagation();
        onRemove(data.symbol);
    });

    card.querySelector('.pin-btn').addEventListener('click', e => {
        e.stopPropagation();
        onPin(data.symbol);
    });

    return card;
}

