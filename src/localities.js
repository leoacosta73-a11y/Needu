export const normalizePlace = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim();
export function searchLocalities(rows, query, limit = 20) {
  const tokens = normalizePlace(query).split(' ').filter(Boolean);
  if (!tokens.length) return [];
  const normalized = normalizePlace(query);
  const rank = row => normalizePlace(row.label) === normalized ? 0 : normalizePlace(row.name) === normalized || normalized.startsWith(normalizePlace(row.name) + ' ') ? 1 : normalizePlace(row.name).startsWith(normalized) ? 2 : 3;
  return rows.filter(row => tokens.every(token => normalizePlace(`${row.name} ${row.province} ${row.department}`).includes(token)))
    .sort((a,b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'es') || a.province.localeCompare(b.province, 'es') || a.id.localeCompare(b.id)).slice(0, limit);
}
let catalogPromise;
export function loadLocalities() {
  if (!catalogPromise) catalogPromise = fetch('/localidades-ar.json').then(response => {
    if (!response.ok) throw new Error('No se pudo cargar el catálogo de localidades.');
    return response.json();
  }).then(data => {if (!Array.isArray(data.localities) || !data.localities.length) throw new Error('Catálogo no disponible.'); return data.localities;})
    .catch(error => {catalogPromise = null; throw error;});
  return catalogPromise;
}
