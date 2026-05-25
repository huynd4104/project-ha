# Local Development

Backend:

```bash
cd backend
cp .env.example .env
./gradlew bootRun
```

Use a Supabase PostgreSQL JDBC URL:

```text
DB_URL=jdbc:postgresql://<host>:6543/postgres?sslmode=require
DB_USERNAME=postgres.<project-ref>
DB_PASSWORD=<password>
```

Admin web:

```bash
cd admin-web
cp .env.example .env
npm install
npm run dev
```

Flutter:

```bash
cd mobile-flutter
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

No real secrets should be committed. Keep `.env` files local.
