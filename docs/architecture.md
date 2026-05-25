# Architecture

Project HA now uses a backend-centered architecture.

- Mobile Flutter and admin web never connect directly to the database, SMTP, R2 or any privileged service.
- Spring Boot exposes REST APIs under `/api/**`, owns authentication, authorization, business rules and media metadata.
- Supabase PostgreSQL stores relational domain data with UUID primary keys and Flyway migrations.
- Cloudflare R2 stores binary media through backend-issued S3-compatible presigned upload URLs.
- Gmail SMTP is used by the backend for email verification and password reset during testing.

Runtime flow:

1. Client logs in through `/api/auth/login`.
2. Backend returns JWT access token and refresh token.
3. Clients attach `Authorization: Bearer <accessToken>`.
4. Backend validates roles `PARENT`, `ADMIN`, `STAFF`.
5. Backend reads/writes PostgreSQL and returns DTO-style JSON.

Secrets live only in backend environment variables.
