import {
  changeUsage,
  compareUsage,
  emptyUsage,
  sanitizeUsage,
  usageCount,
} from './preferences.mjs';

const data = window.SUSHI_MENU_DATA || { stores: [], items: [] };

const storeLabels = {
  sushiro: 'スシロー',
  kura: 'くら寿司',
};

const quickWords = ['まぐろ', 'サーモン', 'いか', 'えび', 'たまご', 'はまち', '茶碗蒸し'];
const starterNames = {
  sushiro: ['厳選まぐろ赤身', '生サーモン', 'いか', 'えび', 'たまご', '活〆はまち', '茶碗蒸し'],
  kura: ['熟成まぐろ', 'サーモン', 'いか', 'えび', 'たまご焼き', 'はまち', '特製茶碗蒸し'],
};
const stateKey = 'sushi-kcal-state-v1';
const usageKey = 'sushi-kcal-usage-v1';

let state = loadState();
let usage = loadUsage();
let toastTimer = 0;

const nodes = {
  appKicker: document.getElementById('appKicker'),
  appTitle: document.getElementById('appTitle'),
  clearButton: document.getElementById('clearButton'),
  changeStoreButton: document.getElementById('changeStoreButton'),
  versionSelect: document.getElementById('versionSelect'),
  calculatorView: document.getElementById('calculatorView'),
  versionButtons: [...document.querySelectorAll('.version-button')],
  searchInput: document.getElementById('searchInput'),
  voiceClearButton: document.getElementById('voiceClearButton'),
  quickChips: document.getElementById('quickChips'),
  resultsTitle: document.getElementById('resultsTitle'),
  dataFreshness: document.getElementById('dataFreshness'),
  resultsList: document.getElementById('resultsList'),
  cartList: document.getElementById('cartList'),
  plateStack: document.getElementById('plateStack'),
  plateComment: document.getElementById('plateComment'),
  copyName: document.getElementById('copyName'),
  copyCalories: document.getElementById('copyCalories'),
  copyNameButton: document.getElementById('copyNameButton'),
  copyCaloriesButton: document.getElementById('copyCaloriesButton'),
  copySummaryButton: document.getElementById('copySummaryButton'),
  toast: document.getElementById('toast'),
};

const itemById = new Map(data.items.map((item) => [item.id, item]));
pruneMissingCartItems();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey) || '{}');
    const savedStore = saved.store === 'sushiro' || saved.store === 'kura' ? saved.store : null;
    return {
      store: savedStore,
      carts: {
        sushiro: Array.isArray(saved.carts?.sushiro) ? saved.carts.sushiro : [],
        kura: Array.isArray(saved.carts?.kura) ? saved.carts.kura : [],
      },
    };
  } catch {
    return { store: null, carts: { sushiro: [], kura: [] } };
  }
}

function saveState() {
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function loadUsage() {
  try {
    return sanitizeUsage(JSON.parse(localStorage.getItem(usageKey) || '{}'));
  } catch {
    return emptyUsage();
  }
}

function saveUsage() {
  localStorage.setItem(usageKey, JSON.stringify(usage));
}

function pruneMissingCartItems() {
  let changed = false;
  for (const store of ['sushiro', 'kura']) {
    const current = state.carts[store];
    const valid = current.filter((entry) => itemById.get(entry.id)?.chain === store);
    if (valid.length !== current.length) {
      state.carts[store] = valid;
      changed = true;
    }
  }
  if (changed) saveState();
}

function toHiragana(input) {
  return input.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

function normalize(input) {
  return toHiragana(input)
    .toLowerCase()
    .replace(/[ 　・\s]+/g, '')
    .replace(/[（）()【】\[\]「」『』]/g, '');
}

function addReadings(name) {
  const readings = [];
  const table = [
    [/鮪|まぐろ|マグロ/, 'まぐろ'],
    [/海老|えび|エビ|蝦/, 'えび'],
    [/烏賊|いか|イカ/, 'いか'],
    [/蛸|たこ|タコ/, 'たこ'],
    [/鯛|たい|タイ/, 'たい'],
    [/鯵|あじ|アジ/, 'あじ'],
    [/鰯|いわし|イワシ/, 'いわし'],
    [/鯖|さば|サバ/, 'さば'],
    [/鰤|ぶり|ブリ/, 'ぶり'],
    [/鰻|うなぎ|ウナギ/, 'うなぎ'],
    [/穴子|あなご|アナゴ/, 'あなご'],
    [/玉子|たまご|タマゴ/, 'たまご'],
  ];
  for (const [pattern, reading] of table) {
    if (pattern.test(name)) readings.push(reading);
  }
  return `${name} ${readings.join(' ')}`;
}

function searchable(item) {
  return normalize(`${addReadings(item.name)} ${item.category} ${item.chainLabel}`);
}

function currentCart() {
  if (!state.store) return [];
  return state.carts[state.store];
}

function cartCount(store = state.store) {
  if (!store) return 0;
  return state.carts[store].reduce((sum, entry) => sum + entry.qty, 0);
}

function cartTotal() {
  return currentCart().reduce((sum, entry) => {
    const item = itemById.get(entry.id);
    return item ? sum + item.calories * entry.qty : sum;
  }, 0);
}

function setStore(store) {
  state.store = store;
  saveState();
  render();
  nodes.searchInput.focus({ preventScroll: true });
}

function chooseAnotherStore() {
  state.store = null;
  nodes.searchInput.value = '';
  saveState();
  render();
}

function addItem(id) {
  const cart = currentCart();
  const item = itemById.get(id);
  if (!item) return;
  const found = cart.find((entry) => entry.id === id);
  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });
  changeUsage(usage, item, 1);
  saveState();
  saveUsage();
  render();
  showToast('皿に追加しました');
}

function updateQty(id, delta) {
  const cart = currentCart();
  const found = cart.find((entry) => entry.id === id);
  if (!found) return;
  const item = itemById.get(id);
  if (!item) return;
  found.qty += delta;
  changeUsage(usage, item, delta);
  if (found.qty <= 0) {
    state.carts[state.store] = cart.filter((entry) => entry.id !== id);
  }
  saveState();
  saveUsage();
  render();
}

function clearCurrentCart() {
  if (!state.store) return;
  if (currentCart().length === 0) {
    nodes.searchInput.value = '';
    render();
    return;
  }
  if (!confirm(`${storeLabels[state.store]}の皿を空にしますか？\nよく食べる順の記録は残ります。`)) return;
  state.carts[state.store] = [];
  saveState();
  render();
}

function getResults() {
  if (!state.store) return [];
  const query = normalize(nodes.searchInput.value);
  const items = data.items.filter((item) => item.chain === state.store);
  const starters = starterNames[state.store];
  const filtered = query
    ? items.filter((item) => searchable(item).includes(query))
    : items.filter((item) => (
      usageCount(usage, item) > 0
      || starters.includes(item.name)
    ));

  return filtered
    .sort((a, b) => {
      const preferenceOrder = compareUsage(usage, a, b);
      if (preferenceOrder !== 0) return preferenceOrder;
      if (!query) {
        const aStarterIndex = starters.indexOf(a.name);
        const bStarterIndex = starters.indexOf(b.name);
        const starterOrder = (
          (aStarterIndex === -1 ? Number.MAX_SAFE_INTEGER : aStarterIndex)
          - (bStarterIndex === -1 ? Number.MAX_SAFE_INTEGER : bStarterIndex)
        );
        if (starterOrder !== 0) return starterOrder;
      }
      if (a.perUnit !== b.perUnit) return a.perUnit ? 1 : -1;
      if (a.category !== b.category) return a.category.localeCompare(b.category, 'ja');
      return a.name.localeCompare(b.name, 'ja');
    })
    .slice(0, query ? 40 : 24);
}

function renderMode() {
  const hasStore = Boolean(state.store);
  document.body.classList.toggle('welcome-screen', !hasStore);
  nodes.versionSelect.hidden = hasStore;
  nodes.calculatorView.hidden = !hasStore;
  document.querySelector('.total-bar').hidden = !hasStore;
  nodes.clearButton.hidden = !hasStore;
  nodes.changeStoreButton.hidden = !hasStore;
  nodes.appTitle.textContent = hasStore ? storeLabels[state.store] : 'いらっしゃいませ!';
  nodes.appKicker.textContent = hasStore ? 'MealTrackerに店名とkcalだけ転記' : 'すしkcal';
}

function renderChips() {
  nodes.quickChips.replaceChildren(
    ...quickWords.map((word) => {
      const button = document.createElement('button');
      button.className = 'chip';
      button.type = 'button';
      button.textContent = word;
      button.addEventListener('click', () => {
        nodes.searchInput.value = word;
        render();
      });
      return button;
    }),
  );
}

function renderResults() {
  if (!state.store) return;
  const results = getResults();
  const query = nodes.searchInput.value.trim();
  const hasHistory = results.some((item) => usageCount(usage, item) > 0);
  nodes.resultsTitle.textContent = query
    ? `候補 ${results.length}件`
    : hasHistory ? 'よく食べる候補' : 'よく使いそうな候補';
  const store = data.stores.find((entry) => entry.id === state.store);
  nodes.dataFreshness.textContent = store ? `${store.capturedAt} 取得` : '';

  if (results.length === 0) {
    nodes.resultsList.innerHTML = '<p class="empty">候補が見つかりません。表記を短くして試してください。</p>';
    return;
  }

  nodes.resultsList.replaceChildren(
    ...results.map((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'result-item';
      button.addEventListener('click', () => addItem(item.id));
      const count = usageCount(usage, item);
      const unitNote = item.perUnit
        ? '単位に注意'
        : count > 0 ? `${count}回選択` : item.category;
      button.innerHTML = `
        <span>
          <span class="name-line">${escapeHtml(item.name)}</span>
          <span class="meta-line ${item.perUnit ? 'per-unit' : ''}">${escapeHtml(unitNote)}</span>
        </span>
        <span class="kcal-pill">${item.calories} kcal</span>
      `;
      return button;
    }),
  );
}

function renderCart() {
  if (!state.store) return;
  const cart = currentCart();
  const total = cartTotal();
  nodes.copyName.textContent = storeLabels[state.store];
  nodes.copyCalories.textContent = `${Math.round(total)} kcal`;
  nodes.plateComment.textContent = plateComment(cartCount(), total);

  const visiblePlateCount = Math.min(cartCount(), 18);
  const plates = Array.from({ length: visiblePlateCount }, (_, index) => {
    const plate = document.createElement('span');
    plate.className = `plate plate-tone-${(index % 5) + 1}`;
    plate.style.setProperty('--i', index);
    plate.style.setProperty('--col', visiblePlateCount === 1 ? 2 : index % 6);
    plate.style.setProperty('--row', visiblePlateCount === 1 ? 1 : Math.floor(index / 6));
    plate.style.setProperty('--tilt', `${((index % 5) - 2) * 1.4}deg`);
    return plate;
  });
  nodes.plateStack.replaceChildren(...plates);

  if (cart.length === 0) {
    nodes.cartList.innerHTML = '<p class="empty">候補をタップすると、ここに皿が積み上がります。</p>';
    return;
  }

  nodes.cartList.replaceChildren(
    ...cart.map((entry) => {
      const item = itemById.get(entry.id);
      const row = document.createElement('article');
      row.className = 'cart-item';
      if (!item) return row;
      row.innerHTML = `
        <div>
          <span class="name-line">${escapeHtml(item.name)}</span>
          <span class="meta-line">${item.calories} kcal × ${entry.qty} = ${item.calories * entry.qty} kcal</span>
        </div>
        <div class="qty-row">
          <button type="button" aria-label="${escapeAttr(item.name)}を減らす">-</button>
          <span>${entry.qty}</span>
          <button type="button" aria-label="${escapeAttr(item.name)}を増やす">+</button>
        </div>
      `;
      const [minus, plus] = row.querySelectorAll('button');
      minus.addEventListener('click', () => updateQty(entry.id, -1));
      plus.addEventListener('click', () => updateQty(entry.id, 1));
      return row;
    }),
  );
}

function plateComment(count, total) {
  if (count === 0) return 'まだ皿は空です';
  if (total < 500) return `${count}皿。まだ軽めです`;
  if (total < 900) return `${count}皿。ちょうど寿司気分`;
  if (total < 1300) return `${count}皿。今日はしっかり寿司`;
  return `${count}皿。寿司祭りです`;
}

async function copyText(text, label) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.focus();
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    showToast(`${label}をコピーしました`);
  } catch {
    showToast('コピーできませんでした');
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  nodes.toast.textContent = message;
  nodes.toast.classList.add('show');
  toastTimer = setTimeout(() => nodes.toast.classList.remove('show'), 1500);
}

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(input) {
  return escapeHtml(input).replace(/`/g, '&#096;');
}

function render() {
  renderMode();
  if (!state.store) return;
  renderResults();
  renderCart();
}

nodes.versionButtons.forEach((button) => {
  button.addEventListener('click', () => setStore(button.dataset.store));
});

nodes.changeStoreButton?.addEventListener('click', chooseAnotherStore);
nodes.searchInput.addEventListener('input', render);
nodes.voiceClearButton.addEventListener('click', () => {
  nodes.searchInput.value = '';
  render();
  nodes.searchInput.focus({ preventScroll: true });
});
nodes.clearButton.addEventListener('click', clearCurrentCart);
nodes.copyNameButton.addEventListener('click', () => copyText(storeLabels[state.store], '店名'));
nodes.copyCaloriesButton.addEventListener('click', () => copyText(String(Math.round(cartTotal())), 'カロリー'));
nodes.copySummaryButton.addEventListener('click', () => {
  copyText(`${storeLabels[state.store]} ${Math.round(cartTotal())}kcal`, 'まとめ');
});

renderChips();
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
