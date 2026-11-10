export const categories = ['Todo', 'Hogar', 'Tecnología', 'Clases', 'Bienestar', 'Creatividad', 'Mascotas'];
export function filterPeople(people, {query='', category='Todo', available=false, saved=false, favorites=[], hidden=[]}) {
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return people.filter(p => !hidden.includes(p.id) && (!saved || favorites.includes(p.id)) && (!available || p.available) && (category==='Todo' || p.category===category) && normalize([p.name,p.title,...p.skills,p.area].join(' ')).includes(normalize(query)));
}
export function coarseCell(lat,lon) { return `${Math.round(lat*100)/100},${Math.round(lon*100)/100}`; }
export function validText(value, max=500) { return typeof value==='string' && value.trim().length>0 && value.trim().length<=max; }
