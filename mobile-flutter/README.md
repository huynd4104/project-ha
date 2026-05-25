# Project HA Mobile Flutter

Flutter mobile app for Project HA.

The app no longer initializes or calls Firebase. It talks to the Spring Boot backend over REST and stores access/refresh tokens with `flutter_secure_storage`.

## Run

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

Useful demo flags:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://localhost:8080 \
  --dart-define=REQUIRE_EMAIL_VERIFICATION=false \
  --dart-define=ALLOW_ALL_LESSONS_FOR_DEMO=true
```

Backend secrets such as database, SMTP and R2 credentials must stay in `backend/.env` or deployment environment variables.
