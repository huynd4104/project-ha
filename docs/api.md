# Legacy API Documentation

This document describes the deprecated Express backend kept in `backend/`.
The MVP now uses Firebase SDK directly from `admin-web` and `mobile-app`.

Base URL: `http://localhost:4000/api`

Tat ca endpoint tru `auth/register` va `auth/login` can header:

```http
Authorization: Bearer <token>
```

## Auth

- `POST /auth/register`: tao tai khoan phu huynh.
- `POST /auth/login`: dang nhap admin hoac parent.
- `GET /auth/me`: thong tin user hien tai.

## Child Profiles

- `GET /children`
- `POST /children`
- `GET /children/:id`
- `PUT /children/:id`
- `DELETE /children/:id`

Parent chi thay ho so con cua minh. Admin thay tat ca.

## NPC va QR

- `GET /npcs`
- `GET /npcs/my-collection`
- `POST /npcs`, `PUT /npcs/:id`, `DELETE /npcs/:id`: admin.
- `POST /qr/unlock`: body `{ "code": "CAT_001_UNLOCK_MIMI", "childId": "optional" }`
- `GET/POST/PUT/DELETE /qr-codes`: admin.

## Lessons

- `GET /lessons`
- `GET /lessons/:id`
- `GET /lessons/:id/questions`
- `GET /lessons/:id/dialogues`
- `GET /lessons/:id/flashcards`
- `POST/PUT/DELETE /lessons`: admin.

## Submissions

- `POST /lessons/:id/submit-math`
- `POST /lessons/:id/submit-dialogue`

Moi lan submit se cham diem, luu progress, cong XP va cap nhat streak.

## Admin

- `GET /admin/dashboard`
- `GET /admin/progress`
- `GET/POST/PUT/DELETE /math-questions`
- `GET/POST/PUT/DELETE /dialogues`
- `GET/POST/PUT/DELETE /flashcards`
