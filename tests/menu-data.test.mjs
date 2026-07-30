import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../data/menu-items.js', import.meta.url), 'utf8');
const data = JSON.parse(source.replace(/^window\.SUSHI_MENU_DATA = /, '').replace(/;\s*$/, ''));

test('栗東小柿店とくら寿司西日本向けのデータを収録している', () => {
  const sushiro = data.stores.find((store) => store.id === 'sushiro');
  const kura = data.stores.find((store) => store.id === 'kura');

  assert.equal(sushiro.note, '栗東小柿店');
  assert.match(sushiro.sourceUrl, /s_id=449/);
  assert.equal(kura.note, '全店舗・西日本・九州');
  assert.ok(data.items.some((item) => item.chain === 'sushiro' && item.name === '厳選まぐろ赤身'));
  assert.ok(data.items.some((item) => item.chain === 'kura' && item.name === '熟成まぐろ'));
});

test('各店の初期候補に使う定番商品がすべて存在する', () => {
  const namesByStore = Object.fromEntries(
    ['sushiro', 'kura'].map((chain) => [
      chain,
      new Set(data.items.filter((item) => item.chain === chain).map((item) => item.name)),
    ]),
  );
  const starters = {
    sushiro: ['厳選まぐろ赤身', '生サーモン', 'いか', 'えび', 'たまご', '活〆はまち', '茶碗蒸し'],
    kura: ['熟成まぐろ', 'サーモン', 'いか', 'えび', 'たまご焼き', 'はまち', '特製茶碗蒸し'],
  };

  for (const [chain, names] of Object.entries(starters)) {
    for (const name of names) assert.ok(namesByStore[chain].has(name), `${chain}: ${name}`);
  }
});

test('くら寿司の東日本限定商品を収録しない', () => {
  assert.equal(
    data.items.filter((item) => item.chain === 'kura' && item.area === '東日本').length,
    0,
  );
});

test('商品IDは重複しない', () => {
  const ids = data.items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
