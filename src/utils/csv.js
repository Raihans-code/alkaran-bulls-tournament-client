/** Minimal RFC-4180-ish CSV parser (quotes, commas, newlines in quotes). */
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

/** CSV with a header row -> [{name, basePrice, category, phone}] */
export function csvToPlayers(text) {
  const [head, ...rows] = parseCSV(text);
  if (!head) return [];
  const idx = (...names) => head.findIndex((h) => names.includes(h.trim().toLowerCase().replace(/[\s_]/g, '')));
  const iName = idx('name', 'player', 'playername');
  const iBase = idx('base', 'baseprice', 'price');
  const iCat = idx('category', 'role');
  const iPhone = idx('phone', 'contact', 'phone/id', 'id');
  if (iName < 0) throw new Error('CSV needs a "Name" column');
  return rows.map((r) => ({
    name: (r[iName] || '').trim(),
    basePrice: iBase >= 0 ? Number(r[iBase]) || 100 : 100,
    category: iCat >= 0 ? (r[iCat] || 'General').trim() : 'General',
    phone: iPhone >= 0 ? (r[iPhone] || '').trim() || null : null,
  })).filter((p) => p.name.length >= 2);
}
