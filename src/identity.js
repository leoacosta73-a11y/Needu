const realName = value => typeof value === 'string' && value.trim() && value.trim() !== 'Tu nombre';
export function identityProfile(user, saved = {}, defaults = {}) {
  const metadata = user?.user_metadata || {};
  const name = realName(saved.name) ? saved.name.trim() :
    [metadata.full_name, metadata.name, defaults.name].find(realName)?.trim() || 'Tu nombre';
  return {...defaults, ...saved, name,
    initials: name === 'Tu nombre' ? 'YO' : name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()};
}
export function googlePhoto(user) {
  const value = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com')) ? url.href : null; }
  catch { return null; }
}
