import test from 'node:test';
import assert from 'node:assert/strict';

import {
  changeUsage,
  compareUsage,
  emptyUsage,
  preferenceKey,
  sanitizeUsage,
  usageCount,
} from '../preferences.mjs';

const tuna = { chain: 'sushiro', name: 'まぐろ' };
const salmon = { chain: 'sushiro', name: 'サーモン' };

test('同じ商品名は空白や文字幅が変わっても同じ記録になる', () => {
  assert.equal(
    preferenceKey({ chain: 'kura', name: 'えび　チーズ' }),
    preferenceKey({ chain: 'kura', name: 'えび チーズ' }),
  );
});

test('追加と取り消しを選択回数へ反映する', () => {
  const usage = emptyUsage();
  changeUsage(usage, tuna, 1);
  changeUsage(usage, tuna, 1);
  changeUsage(usage, tuna, -1);
  assert.equal(usageCount(usage, tuna), 1);

  changeUsage(usage, tuna, -1);
  assert.equal(usageCount(usage, tuna), 0);
  assert.deepEqual(usage.counts, {});
});

test('よく選ぶ商品を先に並べる', () => {
  const usage = emptyUsage();
  changeUsage(usage, salmon, 3);
  changeUsage(usage, tuna, 1);
  assert.ok(compareUsage(usage, salmon, tuna) < 0);
});

test('壊れた保存値やゼロ以下の回数を読み捨てる', () => {
  const key = preferenceKey(tuna);
  const usage = sanitizeUsage({ counts: { [key]: 4, bad: -2, text: '3' } });
  assert.deepEqual(usage.counts, { [key]: 4 });
});
