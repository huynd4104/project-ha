Chạy seed bằng `psql`:

```bash
lsof -ti :8080 | xargs kill -9 2>/dev/null
read -s PGPASSWORD
export PGPASSWORD
psql "host=aws-1-ap-northeast-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.xxnoabmvwpzentxzwfkt sslmode=require" \
  -f backend/src/main/resources/db/seed/seed_content_from_data_template.sql
unset PGPASSWORD
```

nganha1522004

```bash
lsof -ti :8080 | xargs kill -9 2>/dev/null

read -s PGPASSWORD
export PGPASSWORD

psql "host=aws-1-ap-northeast-1.pooler.supabase.com port=5432 dbname=postgres user=postgres.xxnoabmvwpzentxzwfkt sslmode=require" \
  -f backend/src/main/resources/db/seed/delete.sql

unset PGPASSWORD
```
