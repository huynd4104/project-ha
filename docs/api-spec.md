# API Spec

Base URL for local development: `http://localhost:8080`.

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/send-verification-code`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/me`
- `PUT /api/me`

Mobile:

- `GET /api/children`
- `POST /api/children`
- `PUT /api/children/{id}`
- `PUT /api/children/{id}/current-path`
- `GET /api/children/{childId}/learning-plan`
- `GET /api/children/{childId}/progress`
- `GET /api/children/{childId}/summary`
- `GET /api/lessons/{lessonId}`
- `GET /api/lessons/{lessonId}/activities`
- `GET /api/lessons/{lessonId}/math-questions`
- `GET /api/lessons/{lessonId}/dialogues`
- `GET /api/lessons/{lessonId}/flashcards`
- `POST /api/children/{childId}/lessons/{lessonId}/attempts`
- `POST /api/children/{childId}/lessons/{lessonId}/complete`
- `GET /api/children/{childId}/xp`
- `GET /api/children/{childId}/streak`
- `GET /api/children/{childId}/daily-missions`
- `POST /api/children/{childId}/daily-missions/{missionId}/claim`
- `GET /api/npcs`
- `GET /api/npcs/{id}`
- `GET /api/children/{childId}/npcs/unlocked`
- `POST /api/activation/redeem`
- `GET /api/me/subscription`
- `POST /api/me/subscription/demo-upgrade`
- `POST /api/voice/answer`

Media:

- `POST /api/media/presign-upload`
- `POST /api/media/complete-upload`
- `GET /api/media/{id}`
- `DELETE /api/media/{id}`

Admin:

- `GET /api/admin/{resource}`
- `POST /api/admin/{resource}`
- `GET /api/admin/{resource}/{id}`
- `PUT /api/admin/{resource}/{id}`
- `DELETE /api/admin/{resource}/{id}`

Supported admin resources: `users`, `children`, `programs`, `learning-paths`, `path-items`, `lessons`, `activities`, `media-files`, `npcs`, `daily-missions`, `audit-logs`.
