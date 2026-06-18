import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const capturedAt = new Date().toISOString().slice(0, 10);

function text(html) {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(input) {
  let h = 2166136261;
  for (const ch of input) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function calorieFrom(raw) {
  const m = raw.match(/(\d+)\s*kcal/i);
  if (!m) return null;
  return Number(m[1]);
}

function unique(items) {
  const map = new Map();
  for (const item of items) {
    if (!item.name || item.calories == null) continue;
    const key = `${item.chain}:${item.name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...item, duplicateCount: 1 });
      continue;
    }
    const shouldReplace = !existing.priceText && item.priceText;
    map.set(key, shouldReplace
      ? { ...item, duplicateCount: existing.duplicateCount + 1 }
      : { ...existing, duplicateCount: existing.duplicateCount + 1 });
  }
  return [...map.values()].map((item, index) => ({
    ...item,
    id: `${item.chain}-${String(index + 1).padStart(4, '0')}-${slug(item.name + item.calorieText)}`,
  }));
}

function parseSushiro() {
  const html = fs.readFileSync(path.join(root, 'data', 'sushiro.html'), 'utf8');
  const beforeModal = html.split('<div class="modal-container">')[0];
  const categories = [...beforeModal.matchAll(/category-tab__item[^>]*>([^<]+)<\/div>/g)].map((m) => text(m[1]));
  const slides = beforeModal
    .split(/<div class="swiper-slide">\s*<div class="menu-items">/)
    .slice(1);
  const items = [];

  for (let i = 0; i < slides.length; i += 1) {
    const category = categories[i] || 'その他';
    const blocks = slides[i].split(/<div data-target="[^"]+" class="menu-item">/).slice(1);
    for (const block of blocks) {
      const name = text(block.match(/<div class="menu-item__name">([\s\S]*?)<\/div>/)?.[1] || '');
      const priceText = text(block.match(/<div class="menu-item__price">([\s\S]*?)<\/div>/)?.[1] || '');
      const calorieText = text(block.match(/<div class="menu-item__calorie">([\s\S]*?)<\/div>/)?.[1] || '');
      const calories = calorieFrom(calorieText);
      if (!name || calories == null) continue;
      items.push({
        chain: 'sushiro',
        chainLabel: 'スシロー',
        category,
        name,
        priceText,
        calories,
        calorieText,
        perUnit: /あたり/.test(calorieText),
        sourceUrl: 'https://www.akindo-sushiro.co.jp/menu/menu_detail/?s_id=1',
        capturedAt,
      });
    }
  }

  return unique(items);
}

function parseKura() {
  const html = fs.readFileSync(path.join(root, 'data', 'kura.html'), 'utf8');
  const sections = html.split(/<section id="menu\d+" class="menu-section section">/).slice(1);
  const items = [];

  for (const section of sections) {
    const category = text(section.match(/<h3 class="menu-section-heading text-serif">([\s\S]*?)<\/h3>/)?.[1] || 'その他');
    const blocks = section.split(/<div id="menu-[^"]+" class="[\s\S]*?menu-item[\s\S]*?">/).slice(1);
    for (const block of blocks) {
      const name = text(block.match(/<h4 class="menu-name">([\s\S]*?)<\/h4>/)?.[1] || '');
      const summary = block.match(/<ul class="menu-summary">([\s\S]*?)<\/ul>/)?.[1] || '';
      const priceText = text(summary.match(/<p>([^<]*円[^<]*)<\/p>/)?.[1] || '');
      const calorieText = text(summary.match(/<p>([^<]*kcal)<\/p>/)?.[1] || '');
      const calories = calorieFrom(calorieText);
      if (!name || calories == null) continue;
      items.push({
        chain: 'kura',
        chainLabel: 'くら寿司',
        category,
        name,
        priceText,
        calories,
        calorieText,
        perUnit: /あたり/.test(calorieText),
        sourceUrl: 'https://www.kurasushi.co.jp/menu/',
        capturedAt,
      });
    }
  }

  return unique(items);
}

const payload = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  stores: [
    {
      id: 'sushiro',
      name: 'スシロー',
      sourceUrl: 'https://www.akindo-sushiro.co.jp/menu/menu_detail/?s_id=1',
      capturedAt,
    },
    {
      id: 'kura',
      name: 'くら寿司',
      sourceUrl: 'https://www.kurasushi.co.jp/menu/',
      capturedAt,
    },
  ],
  items: [...parseSushiro(), ...parseKura()],
};

fs.writeFileSync(path.join(root, 'data', 'menu-items.json'), `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  path.join(root, 'data', 'menu-items.js'),
  `window.SUSHI_MENU_DATA = ${JSON.stringify(payload, null, 2)};\n`,
);
console.log(`Wrote ${payload.items.length} items`);
for (const store of payload.stores) {
  console.log(`${store.name}: ${payload.items.filter((item) => item.chain === store.id).length}`);
}
