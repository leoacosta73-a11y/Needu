export function distanceKm(a, b) {
  const valid = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
  if (!valid(a) || !valid(b)) return null;
  const radians = value => value * Math.PI / 180;
  const h = Math.sin(radians(b.lat-a.lat)/2)**2 + Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(radians(b.lon-a.lon)/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}

// Only canonical locality IDs are used. Unknown locations never count as nearby.
export function withinRadius(items, localities, origin, radius) {
  if (!radius) return items;
  if (!origin) return [];
  const byId = new Map(localities.map(row => [row.id,row]));
  return items.filter(item => {
    const distance = distanceKm(origin, byId.get(item.locality_id));
    return distance !== null && distance <= Number(radius);
  });
}
