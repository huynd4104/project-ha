# Backend Deprecated

REST API cu cho `project_ha`, dùng Express, TypeScript, Prisma và SQLite.

Backend này hiện là legacy/phase 2. MVP mới dùng Firebase trực tiếp từ `admin-web` và `mobile-app`, không dùng Express trong flow chính.

## Chay local

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Server: `http://localhost:4000`

Khuyen nghi Node.js LTS 20/22. Neu dung Node qua moi va Prisma schema engine loi khi migrate, doi ve Node LTS roi chay lai cac lenh tren.

## Demo

- Admin: `admin@demo.com` / `123456`
- Parent: `parent@demo.com` / `123456`
- QR: `CAT_001_UNLOCK_MIMI`, `BEAR_001_UNLOCK_BOBO`, `RABBIT_001_UNLOCK_NANA`

## Endpoint nhanh

- `POST /api/auth/login`
- `GET /api/lessons`
- `POST /api/qr/unlock`
- `POST /api/lessons/:id/submit-math`
- `GET /api/admin/dashboard`
