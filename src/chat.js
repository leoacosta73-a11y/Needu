export function mergeMessages(current, incoming, userId) {
  const rows = new Map();
  for (const m of [...current, ...incoming]) {
    if (m?.id && (m.sender_id === userId || m.recipient_id === userId)) rows.set(m.id, m);
  }
  return [...rows.values()].sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
}
export function unreadMessages(messages,userId,reads) {
  return messages.filter(m=>m.recipient_id===userId && m.created_at > (reads[`${userId}:${m.sender_id}`]||''));
}
