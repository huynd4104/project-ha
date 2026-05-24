# Migration to Firebase

## Summary

MVP now uses Firebase directly from `admin-web` and `mobile-flutter`.

- Firebase Authentication replaces `/auth/login`, `/auth/register`, `/auth/me`.
- Cloud Firestore replaces the custom Express REST API and SQLite database.
- Firebase Storage is configured for future media uploads.
- Firebase Hosting is configured for deploying `admin-web`.
- `backend/` is kept as deprecated legacy code for rollback or phase 2.

## Changed Files

- `admin-web/.env.example`
- `admin-web/src/firebase/firebase.ts`
- `admin-web/src/api/authApi.ts`
- `admin-web/src/api/adminApi.ts`
- `admin-web/src/components/ProtectedRoute.tsx`
- `admin-web/src/components/Navbar.tsx`
- `admin-web/src/pages/LoginPage.tsx`
- `admin-web/src/pages/CrudPage.tsx`
- `mobile-flutter` (Flutter app files)
- `firebase/firestore.rules`
- `firebase/storage.rules`
- `firebase/firestore.indexes.json`
- `firebase.json`
- `backend/README.md`
- `backend/DEPRECATED.md`
- `README.md`
- `docs/firebase-setup.md`
- `docs/database-schema.md`
- `docs/seed-guide.md`

## Backend API Replacement Map

| Old backend API | Firebase replacement |
| --- | --- |
| `POST /auth/login` | `signInWithEmailAndPassword` in `authApi.login` |
| `POST /auth/register` | `createUserWithEmailAndPassword` plus `setDoc(users/{uid})` |
| `GET /auth/me` | `auth.currentUser` plus `getDoc(users/{uid})` |
| `GET /admin/dashboard` | Firestore aggregate reads in `adminApi.dashboard` |
| `GET/POST/PUT/DELETE /npcs` | `adminApi` CRUD on `npcs` |
| `GET/POST/PUT/DELETE /qr-codes` | `adminApi` CRUD on `qrCodes` |
| `GET/POST/PUT/DELETE /lessons` | `adminApi` CRUD on `lessons` |
| `GET/POST/PUT/DELETE /math-questions` | `adminApi` CRUD on `mathQuestions` |
| `GET/POST/PUT/DELETE /dialogues` | `adminApi` CRUD on `dialogues` |
| `GET/POST/PUT/DELETE /flashcards` | `adminApi` CRUD on `flashcards` |
| `GET /children`, `POST /children`, `PUT /children/:id` | `childApi` queries and writes `children` by `userId` |
| `GET /lessons` | `lessonApi.list` queries active `lessons` and joins NPC/progress client-side |
| `GET /lessons/:id/questions` | `lessonApi.questions` queries `mathQuestions` by `lessonId` |
| `GET /lessons/:id/dialogues` | `lessonApi.dialogues` queries `dialogues` by `lessonId` |
| `GET /lessons/:id/flashcards` | `lessonApi.flashcards` queries `flashcards` by `lessonId` |
| `POST /lessons/:id/submit-math` | `lessonApi.submitMath` calculates score and writes `progress`, `xpLogs`, `streaks` |
| `POST /lessons/:id/submit-dialogue` | `lessonApi.submitDialogue` calculates score and writes `progress`, `xpLogs`, `streaks` |
| `POST /qr/unlock` | `qrApi.unlock` uses a Firestore transaction on `qrCodes` and `userUnlockedNpcs` |
| `GET /npcs/my-collection` | `npcApi.collection` reads `userUnlockedNpcs` and joins `npcs` |
| `GET /progress/summary` | `progressApi.summary` reads `progress`, `xpLogs`, `streaks`, `userUnlockedNpcs` |

## Run After Migration

Admin web:

```bash
cd admin-web
npm install
cp .env.example .env
npm run dev
```

Mobile app:

```bash
cd mobile-flutter
flutter pub get
flutter run --dart-define=REQUIRE_EMAIL_VERIFICATION=false --dart-define=ALLOW_ALL_LESSONS_FOR_DEMO=true
```

Firebase rules and hosting:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
cd admin-web
npm run build
cd ..
firebase deploy --only hosting
```

## Notes

- API keys in Firebase web/mobile config are project identifiers, but this repo still keeps them out of source and reads them from env files.
- Flashcard learned state is acknowledged locally in MVP. Persisted per-card mastery can be added in phase 2.
- The legacy backend remains in `backend/` for rollback reference.
