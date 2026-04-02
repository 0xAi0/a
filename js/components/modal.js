// ── Modal Component ──
// Enhanced detail modal: 24h high/low range, market cap, FDV, calculator

import { state } from '../state.js';
import { EXCHANGE_META } from '../config.js';
import { formatPrice, formatVolume, formatLargeNumber, formatSupply, cleanSymbol } from '../utils/format.js';
import { fetchBinanceTokenInfo } from '../exchanges/binance.js';

let currentModalData = null;

/**
 * Show the token detail modal
 */
export function showDetailModal(data) {
    currentModalData = data;
    const modal = document.getElementById('detailModal');
    const displaySym = cleanSymbol(data.symbol);
    const meta = EXCHANGE_META[state.activeExchange];
    const pos = data.priceChangePercent >= 0;

    // Header
    document.getElementById('detailTitle').innerHTML = `
        <span class="ex-badge ${meta.cls}" style="font-size:0.7rem">${meta.badge}</span>
        ${displaySym}
    `;

    // Price row
    document.getElementById('detailPriceValue').textContent = `$${formatPrice(data.lastPrice)}`;
    const changeEl = document.getElementById('detailChangeValue');
    changeEl.textContent = `${pos ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`;
    changeEl.className = `detail-change ${pos ? 'up' : 'down'}`;

    // 24h Range
    renderRange(data);

    // Market data — show loading state
    setMarketDataLoading();

    // Calculator
    setupCalculator(data);

    // Open modal
    modal.classList.add('open');

    // Fetch token info asynchronously
    loadTokenInfo(displaySym);
}

function renderRange(data) {
    const high = data.high24h;
    const low = data.low24h;
    const current = data.lastPrice;

    const highEl = document.getElementById('rangeHighValue');
    const lowEl = document.getElementById('rangeLowValue');
    const barFill = document.getElementById('rangeBarFill');
    const barMarker = document.getElementById('rangeBarMarker');
    const rangeSection = document.getElementById('rangeSection');

    if (high && low && high !== low) {
        rangeSection.style.display = 'block';
        highEl.textContent = `$${formatPrice(high)}`;
        lowEl.textContent = `$${formatPrice(low)}`;

        // Calculate position (0% = low, 100% = high)
        const pct = Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
        barFill.style.width = '100%';
        barMarker.style.left = `${pct}%`;
    } else {
        rangeSection.style.display = 'none';
    }
}

function setMarketDataLoading() {
    const fields = ['mcapValue', 'fdvValue', 'circSupplyValue', 'totalSupplyValue', 'volumeValue', 'tradesValue'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '...';
            el.className = 'data-card-value loading';
        }
    });
}

async function loadTokenInfo(symbol) {
    try {
        const info = await fetchBinanceTokenInfo(symbol);

        // Update market data cards
        setDataValue('mcapValue', info.marketCap ? formatLargeNumber(info.marketCap) : '—');
        setDataValue('fdvValue', info.fdv ? formatLargeNumber(info.fdv) : '—');
        setDataValue('circSupplyValue', info.circulatingSupply ? formatSupply(info.circulatingSupply) : '—');
        setDataValue('totalSupplyValue', info.totalSupply ? formatSupply(info.totalSupply) : '—');

        // Volume from current data
        if (currentModalData) {
            setDataValue('volumeValue', formatVolume(currentModalData.volume));
            setDataValue('tradesValue', currentModalData.trades ? currentModalData.trades.toLocaleString() : '—');
        }
    } catch (e) {
        console.warn('Failed to load token info:', e);
        const fields = ['mcapValue', 'fdvValue', 'circSupplyValue', 'totalSupplyValue'];
        fields.forEach(id => setDataValue(id, '—'));
    }
}

function setDataValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
        el.className = 'data-card-value';
    }
}

function setupCalculator(data) {
    const input = document.getElementById('percentageInput');
    const targetEl = document.getElementById('targetPrice');
    const diffEl = document.getElementById('priceDiff');

    input.value = '';
    targetEl.textContent = '—';
    diffEl.textContent = '—';
    diffEl.style.color = '';

    input.oninput = () => {
        const pct = parseFloat(input.value) || 0;
        const tgt = data.lastPrice * (1 + pct / 100);
        const dif = tgt - data.lastPrice;
        targetEl.textContent = `$${formatPrice(tgt)}`;
        diffEl.textContent = `${dif >= 0 ? '+' : ''}$${formatPrice(Math.abs(dif))}`;
        diffEl.style.color = dif >= 0 ? 'var(--green)' : 'var(--red)';
    };
}

/**
 * Initialize modal event listeners
 */
export function initModals() {
    // Detail modal close
    const detailModal = document.getElementById('detailModal');
    document.getElementById('closeDetail').addEventListener('click', () => {
        detailModal.classList.remove('open');
        currentModalData = null;
    });
    detailModal.addEventListener('click', e => {
        if (e.target === detailModal) {
            detailModal.classList.remove('open');
            currentModalData = null;
        }
    });

    // Settings modal
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = () => settingsModal.classList.remove('open');

    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('refreshInterval').value = state.settings.refreshInterval || 10;
        settingsModal.classList.add('open');
    });
    document.getElementById('closeSettings').addEventListener('click', closeSettings);
    document.getElementById('cancelSettings').addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', e => {
        if (e.target === settingsModal) closeSettings();
    });
    document.getElementById('saveSettings').addEventListener('click', () => {
        state.settings.refreshInterval = parseInt(document.getElementById('refreshInterval').value) || 10;
        state.saveSettings();
        closeSettings();
        // Dispatch custom event for app.js to restart refresh
        window.dispatchEvent(new CustomEvent('settings-changed'));
    });
}
