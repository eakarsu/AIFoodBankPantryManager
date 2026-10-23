'use strict';

// Feature pack wave 1A — pure helpers (no DB / no network) so they can be
// unit-tested without infrastructure. Routes in routes/featurePack.js wire
// these helpers to the database and the AI provider.

const INVENTORY_COLUMNS = ['id', 'name', 'category', 'quantity', 'unit', 'status', 'expiration_date'];

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase();
}

// Search/filter over the main record list (inventory). Pure + deterministic.
function filterInventory(records, filters = {}) {
  const list = Array.isArray(records) ? records : [];
  const search = normalizeSearch(filters.search);
  const category = normalizeSearch(filters.category);
  const status = normalizeSearch(filters.status);
  return list.filter((row) => {
    if (category && normalizeSearch(row.category) !== category) return false;
    if (status && normalizeSearch(row.status) !== status) return false;
    if (search) {
      const haystack = [row.name, row.category, row.status, row.barcode]
        .map((v) => normalizeSearch(v)).join(' ');
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// CSV export of main records. Preserves false/0 (only null/undefined -> empty).
function toCsv(records, columns = INVENTORY_COLUMNS) {
  const list = Array.isArray(records) ? records : [];
  const header = columns.join(',');
  const lines = list.map((row) => columns.map((col) => csvEscape(row[col])).join(','));
  return [header, ...lines].join('\n');
}

function toJsonExport(records) {
  return { exported_at: new Date().toISOString(), count: (records || []).length, data: records || [] };
}

// Render an AI result object as readable labelled sections.
// Preserves false / 0 / empty-string values instead of dropping them.
function renderAiSections(result) {
  if (!result || typeof result !== 'object') return [];
  return Object.entries(result)
    .filter(([key]) => key !== 'source' && key !== 'label')
    .map(([key, value]) => {
      let display;
      if (value === null || value === undefined) display = '';
      else if (Array.isArray(value)) display = value.length ? value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('; ') : '(none)';
      else if (typeof value === 'object') display = JSON.stringify(value);
      else display = String(value); // keeps "false" and "0"
      return { label: key, value: display };
    });
}

function hasAiKey(env = process.env) {
  return Boolean(env.OPENROUTER_API_KEY || env.OPENAI_API_KEY);
}

// Deterministic fallback over the app's own inventory records.
// Clearly labelled — never presented as a real AI success.
function buildFallback(feature, records) {
  const list = Array.isArray(records) ? records : [];
  const base = { source: 'fallback', aiGenerated: false, label: 'Deterministic fallback (no AI provider configured)' };
  if (feature === 'restock-recommendation') {
    const low = list.filter((r) => Number(r.quantity || 0) <= Number(r.min_stock_level || 0));
    return { ...base, feature, total_items: list.length, low_stock_count: low.length, needs_restock: low.length > 0, recommendations: low.map((r) => `Restock ${r.name} (qty ${r.quantity ?? 0}, min ${r.min_stock_level ?? 0})`) };
  }
  if (feature === 'expiry-alert-draft') {
    const now = Date.now();
    const soon = list.filter((r) => r.expiration_date && Date.parse(r.expiration_date) - now < 14 * 86400000);
    return { ...base, feature, total_items: list.length, expiring_soon_count: soon.length, has_expiring: soon.length > 0, draft: soon.length ? `Alert: ${soon.length} item(s) expire within 14 days: ${soon.map((r) => r.name).join(', ')}.` : 'No items expire within 14 days.' };
  }
  // distribution-summary (default)
  const byCategory = {};
  for (const r of list) byCategory[r.category || 'uncategorized'] = (byCategory[r.category || 'uncategorized'] || 0) + Number(r.quantity || 0);
  return { ...base, feature: 'distribution-summary', total_items: list.length, total_quantity: list.reduce((s, r) => s + Number(r.quantity || 0), 0), in_stock: list.filter((r) => Number(r.quantity || 0) > 0).length, out_of_stock: list.filter((r) => Number(r.quantity || 0) === 0).length, by_category: byCategory };
}

module.exports = { INVENTORY_COLUMNS, filterInventory, toCsv, toJsonExport, renderAiSections, hasAiKey, buildFallback };
