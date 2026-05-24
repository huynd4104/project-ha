# Seed Guide

Firebase Auth users are created in Firebase Console for MVP.

## Demo Users

1. Go to Firebase Console -> Authentication.
2. Enable Email/Password.
3. Create:
   - `admin@demo.com` / `123456`
   - `parent@demo.com` / `123456`
4. Copy each UID.
5. In Firestore, create:
   - `users/{adminUid}` with role `ADMIN`
   - `users/{parentUid}` with role `PARENT`

Example `users/{adminUid}`:

```json
{
  "uid": "adminUid",
  "email": "admin@demo.com",
  "fullName": "Demo Admin",
  "role": "ADMIN",
  "isActive": true
}
```

Example `users/{parentUid}`:

```json
{
  "uid": "parentUid",
  "email": "parent@demo.com",
  "fullName": "Demo Parent",
  "role": "PARENT",
  "isActive": true
}
```

## Sample Content

Create NPCs:

- `Mèo Mimi`
- `Gấu Bobo`
- `Thỏ Nana`

Create QR codes:

- `CAT_001_UNLOCK_MIMI`
- `BEAR_001_UNLOCK_BOBO`
- `RABBIT_001_UNLOCK_NANA`

Each QR code should include:

```json
{
  "code": "CAT_001_UNLOCK_MIMI",
  "npcId": "targetNpcDocumentId",
  "label": "Mở khóa Mèo Mimi",
  "isActive": true,
  "maxUses": null,
  "usedCount": 0
}
```

Create Math lessons:

- `Đếm số lượng con vật`
- `Chọn số đúng`
- `So sánh nhiều/ít`

Create Dialogue lessons:

- `Chào hỏi đơn giản`
- `Gọi tên con vật`
- `Chọn cảm xúc vui/buồn`

Create flashcards:

- `Mèo`
- `Chó`
- `Gấu`
- `Vui`
- `Buồn`
- `Xin chào`
- `Tạm biệt`

## Optional Script

A Firebase Admin SDK seed script can be added later under `scripts/seed-firestore.ts`. Do not commit a service account key. Use `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json` locally if a script is added.
