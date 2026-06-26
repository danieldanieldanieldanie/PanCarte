import type { CardDraft } from '../types';

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Display name must be at least 2 characters.';
  if (trimmed.length > 40) return 'Display name must be 40 characters or fewer.';
  return null;
}

export function parseRecipientNumber(input: string): number {
  const normalized = input.trim();
  if (!/^\d+$/.test(normalized)) throw new Error('Enter a Carte number using digits only.');
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error('Enter a valid non-negative Carte number.');
  return parsed;
}

export function sideHasContent(side?: { text?: string; imageFile?: File | null; imageUrl?: string | null }): boolean {
  return Boolean(side && (side.text?.trim() || side.imageFile || side.imageUrl));
}

export function validateDraft(draft: CardDraft): string | null {
  if (!sideHasContent(draft.front) && !(draft.includeBack && sideHasContent(draft.back))) return 'Write text or add a photo before sending.';
  return null;
}

export function materializeCard(draft: CardDraft) {
  return { front: { ...draft.front }, ...(draft.includeBack && sideHasContent(draft.back) ? { back: { ...draft.back! } } : {}) };
}

export function allocateSequentialNumber(currentNext: number): { assigned: number; next: number } {
  if (!Number.isSafeInteger(currentNext) || currentNext < 0) throw new Error('Invalid counter state.');
  return { assigned: currentNext, next: currentNext + 1 };
}
