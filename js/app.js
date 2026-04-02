// ── Market Pulse — Main Application ──

import { state } from './state.js';
import { EXCHANGE_META } from './config.js';
import { cleanSymbol, formatPrice } from './utils/format.js';
import { fetchHyperliquid } from './exchanges/hyperliquid.js';
import { fetchLighter } from './exchanges/lighter.js';
import { fetchAsterDex } from './exchanges/asterdex.js';
import { fetchBinance } from './exchanges/binance.js';
import { createGridCard } from './components/card.js';
import { createListRow, renderErrorRow } from './components/listRow.js';
import { showDetailModal, initModals } from './components/modal.js';
import { initBackground } from './background.js';

// ── DOM References ──
const gridEl = document.getElementById('pricesGrid');
const listEl = document.getElementById('pricesList');
const listBody = document.getElementById('pricesListBody');
const loadingEl = document.getElementById('loadingIndicator');

// ── Exchange Fetcher Dispatch ──
async function fetchMarketData() {
    try {
        switch (state.activeExchange) {
            case 'hyperliquid': return await fetchHyperliquid();
            case 'lighter':    return await fetchLighter();
            case 'asterdex':   return await fetchAsterDex();
            case 'binance':    return await fetchBinance();
            default:           return null;
        }
    } catch (e) {
        console.error('Fetch error:', e);
        return null;
    }
}

// ── Error Card for Grid ──
function renderErrorCardGrid(symbol) {
    const displaySym = cleanSymbol(symbol);
    const card = document.createElement('div');
    card.className = 'error-card';
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700;color:var(--red)">${displaySym}</span>
            <button class="remove-btn" style="position:static;opacity:1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <p style="font-size:0.78rem;color:var(--text-muted);margin-top:10px">Not found on this exchange</p>`;
    card.querySelector('.remove-btn').addEventListener('click', () => removeCoin(symbol));
    return card;
}

// ── Lighter API Error Banner ──
function renderLighterError(status) {
    const banner = document.createElement('div');
    banner.className = 'api-error-banner';
    banner.innerHTML = `
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-size:1rem;font-weight:700;color:#a5b4fc">Lighter API unavailable</p>
        <p style="font-size:0.82rem;color:var(--text-muted);max-width:400px">
            The Lighter Exchange API (${status}) is restricted. Open
            <a href="https://app.lighter.xyz" target="_blank" style="color:#818cf8;text-decoration:underline">app.lighter.xyz</a>
            directly to view prices.
        </p>`;
    return banner;
}

// ── Dashboard Update ──
async function updateDashboard() {
    const data = await fetchMarketData();
    if (!data) return;

    state.globalMarketData = data;
    gridEl.innerHTML = '';
    listBody.innerHTML = '';

    // Handle Lighter API error
    if (data.__lighter_error) {
        gridEl.appendChild(renderLighterError(data.__lighter_error));
        updateTimestamp();
        return;
    }

    const callbacks = {
        onRemove: (sym) => removeCoin(sym),
        onClick: (coinData) => showDetailModal(coinData),
        onPin: (sym) => pinCoin(sym)
    };

    state.getSymbols().forEach(sym => {
        const coinData = data[sym];
        if (!coinData) {
            if (state.isGridView) {
                gridEl.appendChild(renderErrorCardGrid(sym));
            } else {
                listBody.appendChild(renderErrorRow(sym));
            }
            return;
        }

        if (state.isGridView) {
            gridEl.appendChild(createGridCard(coinData, callbacks));
        } else {
            listBody.appendChild(createListRow(coinData, callbacks));
        }
    });

    updateTimestamp();
    updateTabTitle(data);
}

function updateTimestamp() {
    document.getElementById('lastRefreshTime').textContent =
        new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ── Pin to Tab ──
function pinCoin(symbol) {
    if (state.pinnedSymbol === symbol) {
        state.setPinnedSymbol(null);
        document.title = 'Market Pulse';
    } else {
        state.setPinnedSymbol(symbol);
    }
    // Re-render to update pin button states
    updateDashboard();
}

function updateTabTitle(data) {
    const pinned = state.pinnedSymbol;
    if (!pinned) {
        document.title = 'Market Pulse';
        return;
    }
    const coinData = data[pinned];
    if (coinData) {
        const sym = cleanSymbol(coinData.symbol);
        const price = formatPrice(coinData.lastPrice);
        const pct = coinData.priceChangePercent;
        const arrow = pct >= 0 ? '▲' : '▼';
        document.title = `$${price} ${arrow}${Math.abs(pct).toFixed(2)}% ${sym}`;
    }
}

// ── Coin Management ──
function addCoin() {
    const inp = document.getElementById('newCoin');
    let val = inp.value.trim().toUpperCase();
    if (!val) return;

    // AsterDex & Binance use USDT suffix
    if ((state.activeExchange === 'asterdex' || state.activeExchange === 'binance') && !val.endsWith('USDT')) {
        val += 'USDT';
    }

    if (state.addSymbol(val)) {
        inp.value = '';
        updateDashboard();
    }
}

function removeCoin(sym) {
    state.removeSymbol(sym);
    updateDashboard();
}

// ── Exchange Switcher ──
function initExchangeSwitcher() {
    const buttons = document.querySelectorAll('.ex-btn');

    // Set initial active state
    buttons.forEach(b => {
        b.classList.toggle('active', b.dataset.ex === state.activeExchange);
    });
    document.getElementById('exchangeLabel').textContent = EXCHANGE_META[state.activeExchange].label;

    // Click handlers
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            state.setExchange(btn.dataset.ex);
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('exchangeLabel').textContent = EXCHANGE_META[state.activeExchange].label;
            updateDashboard();
        });
    });
}

// ── View Toggle ──
function initViewToggle() {
    const gridBtn = document.getElementById('viewGridBtn');
    const listBtn = document.getElementById('viewListBtn');

    function updateView() {
        gridBtn.classList.toggle('active', state.isGridView);
        listBtn.classList.toggle('active', !state.isGridView);
        gridEl.style.display = state.isGridView ? 'grid' : 'none';
        listEl.style.display = state.isGridView ? 'none' : 'block';
    }

    gridBtn.addEventListener('click', () => {
        state.setGridView(true);
        updateView();
        updateDashboard();
    });

    listBtn.addEventListener('click', () => {
        state.setGridView(false);
        updateView();
        updateDashboard();
    });

    updateView();
}

// ── Refresh Loop ──
function startRefresh() {
    if (state.refreshIntervalId) clearInterval(state.refreshIntervalId);
    updateDashboard();
    state.refreshIntervalId = setInterval(updateDashboard, (state.settings.refreshInterval || 10) * 1000);
}

// ── Keyboard shortcuts ──
function initKeyboard() {
    document.getElementById('newCoin').addEventListener('keypress', e => {
        if (e.key === 'Enter') addCoin();
    });

    // Escape to close modals
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        }
    });
}

// ── Initialize ──
function init() {
    initBackground();
    initExchangeSwitcher();
    initViewToggle();
    initModals();
    initKeyboard();

    // Listen for settings changes
    window.addEventListener('settings-changed', startRefresh);

    // Start the refresh loop
    startRefresh();
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
