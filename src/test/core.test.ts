import { describe, expect, it } from 'vitest';
import { archiveDelivery, deleteArchiveCard, listArchive } from '../services/archive';
import { allocateSequentialNumber, materializeCard, parseRecipientNumber, validateDisplayName, validateDraft } from '../services/validation';
import type { CardDraft, Delivery } from '../types';

describe('profile validation', () => {
  it('requires a reasonable display name', () => {
    expect(validateDisplayName('A')).toMatch(/at least/);
    expect(validateDisplayName('Ada')).toBeNull();
  });
});

describe('sequential allocation helper', () => {
  it('assigns current counter and increments next value', () => {
    expect(allocateSequentialNumber(0)).toEqual({ assigned: 0, next: 1 });
    expect(allocateSequentialNumber(41)).toEqual({ assigned: 41, next: 42 });
  });
});

describe('recipient parsing', () => {
  it('accepts digit-only non-negative numbers', () => {
    expect(parseRecipientNumber(' 007 ')).toBe(7);
    expect(() => parseRecipientNumber('-1')).toThrow();
    expect(() => parseRecipientNumber('12a')).toThrow();
  });
});

describe('draft send failure behavior', () => {
  it('validates empty drafts before callers clear local state', () => {
    const draft: CardDraft = { includeBack: true, front: { text: '' }, back: { text: '' } };
    expect(validateDraft(draft)).toMatch(/Write text/);
    expect(draft.front.text).toBe('');
  });
});

describe('card composition', () => {
  it('keeps front and optional back as postcard sides', () => {
    const draft: CardDraft = { includeBack: true, front: { text: 'front' }, back: { text: 'back' } };
    expect(materializeCard(draft)).toEqual({ front: { text: 'front' }, back: { text: 'back' } });
  });
});

describe('archive move/delete', () => {
  it('archives then deletes a received card', async () => {
    const delivery: Delivery = { id: 'd1', senderUid: 's', senderDisplayName: 'Sender', senderNumber: 1, recipientUid: 'r', recipientNumber: 2, card: { front: { text: 'hello' } } };
    await archiveDelivery('r', delivery);
    expect((await listArchive('r')).map(c => c.id)).toContain('d1');
    await deleteArchiveCard('r', 'd1');
    expect((await listArchive('r')).map(c => c.id)).not.toContain('d1');
  });
});
