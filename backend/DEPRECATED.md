# Backend Deprecated

This Express + Prisma backend is kept as legacy reference code for rollback and phase 2.

The MVP flow now uses Firebase directly from `admin-web` and `mobile-flutter`:

- Firebase Authentication for login/register.
- Cloud Firestore for app data.
- Firebase Storage for optional media.
- Firebase Hosting for `admin-web`.

Do not add new MVP features here unless the project intentionally moves back to a custom backend or adds phase-2 server-side features.
