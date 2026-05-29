# Database Reset and Seeding Guide

This document provides instructions on how to reset the database (local PostgreSQL or Supabase) and import seed/sample data.

> [!NOTE]
> Upon startup, the backend automatically initializes a default administrator account if it does not exist:
> - **Email**: `admin@projectha.local`
> - **Password**: `Admin@123456`

> [!WARNING]
> These actions will erase all current user profiles, children's progress, and runtime data. Only use these commands if you explicitly intend to reset the database environment.

---

## 1. Local PostgreSQL Reset

To perform a clean reset of your local PostgreSQL database, execute the following steps:

1. **Terminate Backend App**: Make sure the backend spring application is stopped.
2. **Drop and Create Database**:
   Using `psql` or your preferred SQL client (e.g., DBeaver, pgAdmin), run:
   ```sql
   DROP DATABASE IF EXISTS project_ha;
   CREATE DATABASE project_ha;
   ```
   *Alternatively, if you only want to clear the public schema:*
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```

3. **Run Flyway Baseline Migration**:
   Start the Spring Boot backend or run the Gradle build task to trigger Flyway migrations. This will construct the unified schema in the database:
   ```bash
   cd backend
   ./gradlew bootRun
   ```

4. **Import Sample Seed Data**:
   Import the sample content seed file using `psql`:
   ```bash
   psql "postgresql://postgres:<password>@localhost:5432/project_ha" -f backend/src/main/resources/db/seed/seed_content_from_data_template.sql
   ```

---

## 2. Supabase Reset

To reset a Supabase project database:

1. Go to your **Supabase Dashboard** -> **Project Settings** -> **Database**.
2. Click **Reset Database** (this will re-run initial migrations, or you can drop all tables in the SQL Editor).
3. Deploy the backend to target the Supabase database. Upon startup, Flyway will automatically run `V1__baseline_schema.sql` to initialize all tables.
4. Open the SQL Editor on the Supabase dashboard or use `psql` locally to run the seed script:
   ```bash
   psql "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres" -f backend/src/main/resources/db/seed/seed_content_from_data_template.sql
   ```

---

## 3. Database Cleaning (Optional)

If you wish to wipe the seed content and custom runtime logs but keep your admin users intact, you can run the `delete.sql` script:
```bash
psql "postgresql://postgres:<password>@localhost:5432/project_ha" -f backend/src/main/resources/db/seed/delete.sql
```
