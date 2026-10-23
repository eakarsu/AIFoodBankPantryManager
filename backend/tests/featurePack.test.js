'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { filterInventory, toCsv, renderAiSections, buildFallback, hasAiKey } = require('../domain/featurePack');

const rows = [
  { id: 1, name: 'Rice', category: 'grain', quantity: 0, status: 'available', min_stock_level: 5 },
  { id: 2, name: 'Beans', category: 'protein', quantity: 10, status: 'available', min_stock_level: 2 },
];

test('search/filter narrows inventory by text, category and status', () => {
  assert.equal(filterInventory(rows, { search: 'ric' }).length, 1);
  assert.equal(filterInventory(rows, { category: 'protein' })[0].name, 'Beans');
  assert.equal(filterInventory(rows, { status: 'missing' }).length, 0);
});

test('CSV export preserves 0 and escapes commas', () => {
  const csv = toCsv(rows);
  assert.match(csv, /Rice,grain,0/);
  assert.equal(toCsv([{ id: 1, name: 'A,B', category: 'x', quantity: 1 }]).split('\n')[1], '1,"A,B",x,1,,,');
});

test('fallback AI is labelled and preserves false/0', () => {
  const r = buildFallback('restock-recommendation', rows);
  assert.equal(r.source, 'fallback');
  assert.equal(r.aiGenerated, false);
  assert.equal(r.low_stock_count, 1);
  const sections = renderAiSections({ ok: false, count: 0, note: '' });
  assert.deepEqual(sections.map((s) => s.value), ['false', '0', '']);
  assert.equal(hasAiKey({}), false);
  assert.equal(hasAiKey({ OPENAI_API_KEY: 'x' }), true);
});
