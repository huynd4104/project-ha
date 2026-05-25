# Deployment Plan

Backend:

- Deploy Spring Boot to a Java 17 runtime.
- Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, SMTP and R2 variables in the backend environment.
- Run Flyway automatically on startup against Supabase PostgreSQL.

Admin web:

- Build with `npm run build` in `admin-web`.
- Deploy `dist/` to Cloudflare Pages or Vercel.
- Configure `VITE_API_BASE_URL` at build time.

Mobile:

- Build with `flutter build ... --dart-define=API_BASE_URL=<backend-url>`.
- Do not include database, SMTP or R2 secrets in Flutter.

Media:

- Create an R2 bucket and S3-compatible API credentials.
- Configure public delivery through `R2_PUBLIC_BASE_URL` if public media URLs are needed.
