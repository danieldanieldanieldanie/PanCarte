import { collection, deleteDoc, doc, getDocs, limit, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebase';
import { materializeCard, parseRecipientNumber, validateDraft } from './validation';
import type { CardDraft, Delivery, UserProfile } from '../types';

export async function ensureUserProfile(user: { uid: string; email: string | null }, displayName: string): Promise<UserProfile> {
  if (!db) throw new Error('Firebase is not configured.');
  const userRef = doc(db, 'users', user.uid);
  const counterRef = doc(db, 'counters', 'global');
  return runTransaction(db, async tx => {
    const existing = await tx.get(userRef);
    if (existing.exists() && typeof existing.data().userNumber === 'number') return existing.data() as UserProfile;
    const counter = await tx.get(counterRef);
    const next = counter.exists() ? Number(counter.data().nextUserNumber ?? 0) : 0;
    const profile: UserProfile = { uid: user.uid, displayName: displayName.trim(), email: user.email, userNumber: next, createdAt: serverTimestamp() };
    tx.set(counterRef, { nextUserNumber: next + 1 }, { merge: true });
    tx.set(userRef, profile, { merge: true });
    return profile;
  });
}

export async function resolveUserByNumber(userNumber: number): Promise<UserProfile> {
  if (!db) throw new Error('Firebase is not configured.');
  const snap = await getDocs(query(collection(db, 'users'), where('userNumber', '==', userNumber), limit(1)));
  if (snap.empty) throw new Error(`No Carte user found for #${userNumber}.`);
  return snap.docs[0].data() as UserProfile;
}

async function uploadSide(uid: string, deliveryId: string, sideName: 'front' | 'back', side: any) {
  if (!side?.imageFile) return side;
  if (!storage) throw new Error('Firebase Storage is not configured.');
  const path = `cards/${uid}/${deliveryId}/${sideName}-${Date.now()}-${side.imageFile.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, side.imageFile, { contentType: side.imageFile.type });
  const imageUrl = await getDownloadURL(fileRef);
  const { imageFile, ...rest } = side;
  return { ...rest, imagePath: path, imageUrl };
}

export async function sendCard(sender: UserProfile, recipientInput: string, draft: CardDraft): Promise<string> {
  const draftError = validateDraft(draft);
  if (draftError) throw new Error(draftError);
  if (!db) throw new Error('Firebase is not configured.');
  const recipientNumber = parseRecipientNumber(recipientInput);
  const recipient = await resolveUserByNumber(recipientNumber);
  const deliveryRef = doc(collection(db, 'deliveries'));
  const card = materializeCard(draft);
  const front = await uploadSide(sender.uid, deliveryRef.id, 'front', card.front);
  const back = card.back ? await uploadSide(sender.uid, deliveryRef.id, 'back', card.back) : undefined;
  await setDoc(deliveryRef, { senderUid: sender.uid, senderDisplayName: sender.displayName, senderNumber: sender.userNumber, recipientUid: recipient.uid, recipientNumber, card: { front, ...(back ? { back } : {}) }, createdAt: serverTimestamp() });
  return deliveryRef.id;
}

export async function removeDelivery(id: string) { if (!db) throw new Error('Firebase is not configured.'); await deleteDoc(doc(db, 'deliveries', id)); }
