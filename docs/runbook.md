# Runbook

## Backend

Khuyen nghi Node.js LTS 20/22 de Prisma migrate on dinh.

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Admin Web

```bash
cd admin-web
npm install
npm run dev
```

## Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

Luu y legacy: neu chay backend Express cu tren thiet bi that, `localhost` tro ve chinh thiet bi. MVP hien tai dung Firebase, khong can sua IP backend.

## Demo Accounts

- Admin: `admin@demo.com` / `123456`
- Parent: `parent@demo.com` / `123456`

## Demo QR

- `CAT_001_UNLOCK_MIMI`
- `BEAR_001_UNLOCK_BOBO`
- `RABBIT_001_UNLOCK_NANA`
