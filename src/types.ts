export type CardSide = { text: string; imageFile?: File | null; imageUrl?: string; imagePath?: string };
export type CardDraft = { front: CardSide; back?: CardSide; includeBack: boolean };
export type UserProfile = { uid: string; displayName: string; email: string | null; userNumber: number; createdAt?: unknown };
export type DeliveryCard = { front: CardSide; back?: CardSide };
export type Delivery = { id: string; senderUid: string; senderDisplayName: string; senderNumber: number; recipientUid: string; recipientNumber: number; card: DeliveryCard; createdAt?: unknown };
export type Contact = { id?: string; displayName: string; userNumber: number; resolvedUid?: string };
export type ArchiveCard = Delivery & { archivedAt?: unknown };
