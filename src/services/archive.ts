import { openDB } from 'idb';
import type { ArchiveCard, Delivery } from '../types';

const DB = 'pancarte-archive';
const STORE = 'cards';
const memoryArchive = new Map<string, ArchiveCard[]>();

async function database() {
  return openDB(DB, 1, { upgrade(db) { if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); } });
}

export async function archiveDelivery(uid: string, delivery: Delivery): Promise<ArchiveCard> {
  const archived: ArchiveCard = { ...delivery, archivedAt: Date.now() };
  if (typeof indexedDB === 'undefined') {
    const list = memoryArchive.get(uid) ?? [];
    memoryArchive.set(uid, [archived, ...list]);
    return archived;
  }
  const db = await database();
  await db.put(STORE, { ...archived, ownerUid: uid });
  return archived;
}

export async function listArchive(uid: string): Promise<ArchiveCard[]> {
  if (typeof indexedDB === 'undefined') return memoryArchive.get(uid) ?? [];
  const db = await database();
  const all = await db.getAll(STORE) as (ArchiveCard & { ownerUid: string })[];
  return all.filter(c => c.ownerUid === uid).sort((a, b) => Number(b.archivedAt ?? 0) - Number(a.archivedAt ?? 0));
}

export async function deleteArchiveCard(uid: string, id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    memoryArchive.set(uid, (memoryArchive.get(uid) ?? []).filter(c => c.id !== id));
    return;
  }
  const db = await database();
  const existing = await db.get(STORE, id) as { ownerUid?: string } | undefined;
  if (existing?.ownerUid === uid) await db.delete(STORE, id);
}

export function buildPrintableHtml(card: ArchiveCard): string {
  const side = (label: string, s?: { text?: string; imageUrl?: string }) => `<section class="card"><h2>${label}</h2>${s?.imageUrl ? `<img src="${s.imageUrl}"/>` : ''}<p>${s?.text ?? ''}</p></section>`;
  return `<!doctype html><title>Carte ${card.id}</title><style>body{font-family:serif;background:#f7f1e7;padding:32px}.card{background:#fffaf0;border:1px solid #d8cdbb;border-radius:18px;padding:28px;margin:0 0 20px;min-height:280px;box-shadow:0 12px 30px #0001}img{max-width:100%;border-radius:12px}p{white-space:pre-wrap;font-size:20px}</style><h1>Carte from ${card.senderDisplayName} #${card.senderNumber}</h1>${side('Front', card.card.front)}${side('Back', card.card.back)}<script>window.print()</script>`;
}
