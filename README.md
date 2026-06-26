# Carte / Pancarte Web

A quiet, private postcard app built with React, TypeScript, Vite, Firebase Authentication, Firestore, Firebase Storage, and local IndexedDB archiving.

## Product shape

Carte is not a feed. Users write one discrete card to one known person by Carte number. Cards may have a front side and an optional back side; each side can include text and/or a photo. The UI is paper-like, warm, sparse, and responsive for mobile Safari.

## Firebase setup

1. Create a Firebase project.
2. Enable **Authentication** with Email/Password.
3. Enable **Firestore** in production mode.
4. Enable **Storage**.
5. Register a Web App and copy its config into `.env.local`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Deploy the included `firestore.rules` and `storage.rules` with the Firebase CLI.

## Run locally

```bash
npm install
npm run dev
npm test
npm run build
```

## Data model

- `users/{uid}`: `uid`, `displayName`, `email`, `userNumber`, `createdAt`.
- `counters/global`: `nextUserNumber`. User creation uses a Firestore transaction so user `0` is first and existing users keep their number.
- `deliveries/{deliveryId}`: transient in-transit metadata and card content, readable by sender/recipient, deletable by recipient.
- `contacts/{uid}/items/{contactId}`: private saved recipients.
- Photos live in Storage under `cards/{senderUid}/{deliveryId}/...`.

## Archive tradeoff

The recipient archive is implemented with IndexedDB through `idb`. This mimics a private local postcard box: saved cards are not a public feed and are not synced to Firestore. The tradeoff is that archives are per-browser/device. This was chosen to preserve the transit-layer model for Firebase and reduce permanent cloud social data. The Archive screen includes **Export PDF**, which opens a print-ready postcard document so the browser can save it as a PDF.

A Firestore private archive collection (`archives/{uid}/cards/{cardId}`) is documented in security rules as a future sync option.

## Delivery reliability

Sending resolves the recipient by Carte number, uploads photos first, creates the delivery document only after card content is ready, and only clears the local draft after `sendCard` succeeds. Failures show an error and keep the draft intact.

## Security rules

Rules limit profile/contact writes to owners, delivery reads to sender/recipient, delivery deletes to recipients, and Storage uploads to authenticated image uploads under the sender's UID. Firestore cannot fully enforce globally sequential counters from client rules; production deployments should keep the transaction code and may move allocation to a Cloud Function for stronger administrative control.

## Notifications

Browser push notifications are not fully implemented yet. The app can add Firebase Cloud Messaging with a service worker and notification permission prompt after the core delivery model is deployed.

## Deploy

```bash
npm run build
firebase deploy
```

For Firebase Hosting, set the public directory to `dist` and configure single-page app rewrites to `index.html`.
