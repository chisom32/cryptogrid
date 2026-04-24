// ===========================
//  CRYPTOGRID — app.js
//  Free CoinGecko API (no key needed)
// ===========================

const API = 'https://api.coingecko.com/api/v3';

let allCoins = [];
let displayedCoins = [];
let page = 1;
let currentSort = 'rank';
let searchQuery = '';

// ===========================
//  FORMAT HELPERS
// ===========================
function formatPrice(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(4);
  if (n >= 0.01) return '$' + n.toFixed(5);
  return '$' + n.toFixed(8);
}

function formatLarge(n) {
  if (!n) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  return '$' + n.toLocaleString();
}

function formatSupply(n, symbol) {
  if (!n) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B ' + symbol.toUpperCase();
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M ' + symbol.toUpperCase();
  return n.toLocaleString() + ' ' + symbol.toUpperCase();
}

function formatChange(n) {
  if (n === null || n === undefined) return { text: '—', cls: '' };
  const up = n >= 0;
  const arrow = up ? '▲' : '▼';
  return {
    text: `${arrow} ${Math.abs(n).toFixed(2)}%`,
    cls: up ? 'up' : 'down'
  };
}

function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ===========================
//  SKELETON LOADER
// ===========================
function showSkeletons(count = 20) {
  const tbody = document.getElementById('tokenTableBody');
  tbody.innerHTML = '';
  for (let i = 0; i < count; i++) {
    tbody.innerHTML += `
      <tr class="skeleton-row">
        <td><div class="skeleton-cell" style="width:24px;margin:auto;"></div></td>
        <td><div class="skeleton-cell" style="width:140px;"></div></td>
        <td><div class="skeleton-cell" style="width:90px;"></div></td>
        <td><div class="skeleton-cell" style="width:70px;"></div></td>
        <td><div class="skeleton-cell" style="width:100px;"></div></td>
        <td><div class="skeleton-cell" style="width:100px;"></div></td>
        <td><div class="skeleton-cell" style="width:120px;margin-left:auto;"></div></td>
      </tr>`;
  }
}

// ===========================
//  FETCH GLOBAL MARKET DATA
// ===========================
async function fetchGlobalData() {
  try {
    const res = await fetch(`${API}/global`);
    const { data } = await res.json();

    const mcap = formatLarge(data.total_market_cap?.usd);
    const vol = formatLarge(data.total_volume?.usd);
    const btcDom = data.market_cap_percentage?.btc?.toFixed(1) + '%';

    document.getElementById('tickerMcap').textContent = `MCAP ${mcap}`;
    document.getElementById('tickerVol').textContent = `VOL ${vol}`;
    document.getElementById('tickerBtcDom').textContent = `BTC DOM ${btcDom}`;
  } catch (e) {
    console.error('Global fetch error:', e);
  }
}

// ===========================
//  FETCH TOP COINS
// ===========================
async function fetchCoins(pageNum = 1) {
  try {
    const res = await fetch(
      `${API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${pageNum}&sparkline=false&price_change_percentage=24h`
    );
    return await res.json();
  } catch (e) {
    console.error('Fetch coins error:', e);
    return [];
  }
}

// ===========================
//  UPDATE STAT CARDS
// ===========================
function updateStatCards(coins) {
  const ids = ['bitcoin', 'ethereum', 'binancecoin', 'solana'];
  const elMap = {
    bitcoin:     { price: 'btcPrice', change: 'btcChange' },
    ethereum:    { price: 'ethPrice', change: 'ethChange' },
    binancecoin: { price: 'bnbPrice', change: 'bnbChange' },
    solana:      { price: 'solPrice', change: 'solChange' },
  };

  ids.forEach(id => {
    const coin = coins.find(c => c.id === id);
    if (!coin) return;
    const { price, change } = elMap[id];
    document.getElementById(price).textContent = formatPrice(coin.current_price);
    const ch = formatChange(coin.price_change_percentage_24h);
    const el = document.getElementById(change);
    el.textContent = ch.text;
    el.className = 'stat-change ' + ch.cls;
  });
}

// ===========================
//  RENDER TABLE ROWS
// ===========================
function renderRows(coins) {
  const tbody = document.getElementById('tokenTableBody');
  tbody.innerHTML = '';

  if (!coins.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);font-family:var(--font-mono);">No tokens found.</td></tr>`;
    return;
  }

  coins.forEach((coin, i) => {
    const ch = formatChange(coin.price_change_percentage_24h);
    const delay = Math.min(i * 0.03, 0.6);
    const row = document.createElement('tr');
    row.style.animationDelay = `${delay}s`;
    row.innerHTML = `
      <td class="td-rank">${coin.market_cap_rank || '—'}</td>
      <td>
        <div class="token-name-cell">
          <img class="token-icon" src="${coin.image}" alt="${coin.name}" loading="lazy" />
          <div>
            <div class="token-name">${coin.name}</div>
            <div class="token-symbol">${coin.symbol.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td class="td-price">${formatPrice(coin.current_price)}</td>
      <td class="td-change ${ch.cls}">
        <span class="change-badge ${ch.cls}">${ch.text}</span>
      </td>
      <td class="td-mcap">${formatLarge(coin.market_cap)}</td>
      <td class="td-vol">${formatLarge(coin.total_volume)}</td>
      <td class="td-supply">${formatSupply(coin.circulating_supply, coin.symbol)}</td>
    `;
    tbody.appendChild(row);
  });
}

// ===========================
//  SORT & FILTER
// ===========================
function getSortedFiltered() {
  let coins = [...allCoins];

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    coins = coins.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (currentSort) {
    case 'price':
      coins.sort((a, b) => b.current_price - a.current_price);
      break;
    case 'change':
      coins.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      break;
    case 'mcap':
      coins.sort((a, b) => b.market_cap - a.market_cap);
      break;
    default: // rank
      coins.sort((a, b) => a.market_cap_rank - b.market_cap_rank);
  }

  return coins;
}

function applyDisplay() {
  displayedCoins = getSortedFiltered();
  renderRows(displayedCoins);
}

// ===========================
//  LOAD MORE
// ===========================
async function loadMore() {
  page++;
  const btn = document.getElementById('loadMoreBtn');
  btn.textContent = 'Loading...';
  btn.disabled = true;

  const newCoins = await fetchCoins(page);
  allCoins = [...allCoins, ...newCoins];
  applyDisplay();

  btn.textContent = 'Load More';
  btn.disabled = false;
}

// ===========================
//  REFRESH
// ===========================
async function refresh() {
  const btn = document.getElementById('refreshBtn');
  btn.classList.add('spinning');

  page = 1;
  showSkeletons();
  const coins = await fetchCoins(1);
  allCoins = coins;
  updateStatCards(coins);
  applyDisplay();
  fetchGlobalData();

  document.getElementById('lastUpdated').textContent = 'Updated ' + timeNow();
  btn.classList.remove('spinning');
}

// ===========================
//  SEARCH
// ===========================
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  applyDisplay();
});

// ===========================
//  SORT TABS
// ===========================
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSort = tab.dataset.sort;
    applyDisplay();
  });
});

// ===========================
//  LOAD MORE BUTTON
// ===========================
document.getElementById('loadMoreBtn').addEventListener('click', loadMore);

// ===========================
//  REFRESH BUTTON
// ===========================
document.getElementById('refreshBtn').addEventListener('click', refresh);

// ===========================
//  AUTO REFRESH every 60s
// ===========================
setInterval(async () => {
  const coins = await fetchCoins(1);
  if (coins.length) {
    // Update only page 1 data silently
    allCoins = [...coins, ...allCoins.slice(50)];
    updateStatCards(coins);
    applyDisplay();
    document.getElementById('lastUpdated').textContent = 'Updated ' + timeNow();
  }
}, 60000);

// ===========================
//  INIT
// ===========================
async function init() {
  showSkeletons();
  fetchGlobalData();

  const coins = await fetchCoins(1);
  allCoins = coins;
  updateStatCards(coins);
  applyDisplay();

  document.getElementById('lastUpdated').textContent = 'Updated ' + timeNow();
}

init();