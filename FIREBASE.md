# NoteFlow — Firebase Integration Guide

## Firebase Project
- **Project ID**: `onlinenotes-9035d`
- **Console**: https://console.firebase.google.com/project/onlinenotes-9035d

---

## Firebase Services Used

| Service | Purpose |
|---|---|
| **Firebase Auth** | User registration, login, Google sign-in, password reset |
| **Firestore** | Primary database — folders, documents, comments, notifications, permissions |
| **Firebase Storage** | Avatar photos, document file attachments |
| **Firebase Analytics** | Usage analytics (browser only) |
| **Firebase Hosting** | Optional — host the built frontend |

---

## Firestore Collections

```
users/{uid}
  - email, username, avatarUrl, isEmailVerified, createdAt, updatedAt

folders/{folderId}
  - name, ownerId, parentFolderId, color, icon
  - isStarred, isTrashed, trashedAt, createdAt, updatedAt

documents/{documentId}
  - title, content, folderId, ownerId
  - isStarred, isTrashed, wordCount, lastOpenedAt, createdAt, updatedAt

  /versions/{versionId}
    - title, content, wordCount, versionNumber, createdBy, createdAt

  /comments/{commentId}
    - authorId, authorName, content, parentCommentId
    - isResolved, resolvedBy, resolvedAt, createdAt, updatedAt

documentPermissions/{documentId_userId}
  - documentId, userId, permission (VIEWER|COMMENTER|EDITOR), grantedBy, createdAt

folderPermissions/{folderId_userId}
  - folderId, userId, permission, grantedBy, createdAt

notifications/{notificationId}
  - recipientId, senderId, type, message, resourceType, resourceId, isRead, createdAt

activityLogs/{logId}
  - userId, action, resourceType, resourceId, resourceName, metadata, createdAt

invitations/{invitationId}
  - inviterId, inviterName, inviteeEmail, resourceType, resourceId
  - permission, token, status (PENDING|ACCEPTED|REJECTED|EXPIRED), expiresAt, createdAt
```

---

## Firebase Setup Steps

### 1. Enable Firebase Services (Firebase Console)

```
1. Authentication → Sign-in methods → Enable:
   ✓ Email/Password
   ✓ Google

2. Firestore Database → Create database in Production mode

3. Storage → Get started in Production mode
```

### 2. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:indexes
```

### 3. Deploy Frontend to Firebase Hosting (optional)

```bash
cd frontend
npm run build

cd ..
firebase deploy --only hosting
```

---

## Local Development

```bash
# Frontend (Firebase connects automatically via firebase.ts config)
cd frontend
npm install
npm run dev
```

No environment variables needed — the Firebase config is embedded in `src/lib/firebase.ts`.

---

## Key Files

| File | Description |
|---|---|
| `frontend/src/lib/firebase.ts` | Firebase app init, exports: db, auth, storage |
| `frontend/src/lib/firebaseAuth.ts` | Auth methods (login, register, Google, password reset) |
| `frontend/src/lib/firebaseDb.ts` | All Firestore CRUD operations |
| `frontend/src/lib/firebaseStorage.ts` | File upload/download (avatars, attachments) |
| `frontend/src/hooks/useFirestore.ts` | React hooks for reactive Firestore data |
| `frontend/src/contexts/AuthContext.tsx` | Auth state powered by Firebase Auth |
| `firestore.rules` | Firestore security rules |
| `storage.rules` | Firebase Storage security rules |
| `firestore.indexes.json` | Composite indexes for compound queries |
| `firebase.json` | Firebase CLI configuration |
| `.firebaserc` | Firebase project alias |
