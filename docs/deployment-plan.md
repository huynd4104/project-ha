# Deployment Plan

## Backend

- Use `backend/Dockerfile` for Render, Railway, or a Docker-based VPS deploy.
- The app reads the listen port from `PORT`, so platform-provided ports work without extra code changes.
- Keep the backend root directory as `backend` when deploying from a monorepo.

Recommended runtime env vars:

- `PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_MINUTES`
- `JWT_REFRESH_TOKEN_DAYS`
- `CORS_ORIGINS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `R2_REGION`
- `GEMINI_API_KEY`

Deployment notes:

- Render: create a Web Service from the `backend` directory, use the Dockerfile, and set the env vars in the dashboard.
- Railway: create a service from the `backend` directory or point Railway to `backend/Dockerfile`, then add the same env vars.
- VPS: either run the Docker image or build the jar and launch it with `java -jar`; put Nginx or a reverse proxy in front if needed.
- Health check: `GET /api/health`.

Example VPS flow:

```bash
cd backend
./gradlew build
java -jar build/libs/*.jar
```

## Admin Web

- Build command: `npm run build`.
- Output directory: `dist`.
- Deploy the `dist/` folder to Cloudflare Pages.
- Set `VITE_API_BASE_URL` in the Cloudflare Pages build environment, because Vite reads it at build time.
- If you use a custom domain, set the same value in preview and production so the bundle points at the correct backend.

## Mobile Flutter

- The mobile app already reads the backend base URL from `String.fromEnvironment('API_BASE_URL')`.
- Build Android or iOS with `--dart-define=API_BASE_URL=<backend-url>`.

Examples:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com
flutter build ios --release --dart-define=API_BASE_URL=https://api.example.com
```

- Do not pass database, SMTP, R2, or JWT secrets to Flutter.

## Supabase

- Use Supabase PostgreSQL for `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
- Keep `sslmode=require` on the connection string.
- Flyway runs automatically on backend startup, so schema migrations should live in `backend/src/main/resources/db/migration`.
- For production, use the pooler or the recommended Supabase connection endpoint for your environment.

## Gmail SMTP

- Use a Gmail app password, not your normal Gmail password.
- Set `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587`.
- Set `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM` for the sender identity.
- If email sending is disabled for a demo environment, leave the credentials empty only if the feature path will not be used.

## R2

- Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`, and `R2_REGION`.
- `R2_PUBLIC_BASE_URL` should be the public bucket URL or a custom domain if you want returned media links to be reachable.
- The backend generates presigned upload URLs and also uses the public base URL when completing uploads.

Example R2 bucket CORS policy:

```json
[
	{
		"AllowedOrigins": ["http://localhost:5173", "https://your-admin.pages.dev"],
		"AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
		"AllowedHeaders": ["*"],
		"ExposeHeaders": ["ETag"],
		"MaxAgeSeconds": 3600
	}
]
```

## CORS

- Set `CORS_ORIGINS` to a comma-separated list of admin web origins.
- Include local dev origins plus the deployed Cloudflare Pages or custom-domain origin.
- Example: `http://localhost:5173,https://your-admin.pages.dev,https://admin.example.com`.

## Validation

- Backend build: `cd backend && ./gradlew build`
- Admin web build: `cd admin-web && npm run build`
- Mobile build: `flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com`
