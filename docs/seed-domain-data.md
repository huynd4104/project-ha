# Seed Domain Data

Date: 2026-05-24

Phase 2 domain seed data is provided by:

```bash
npm run db:seed-domain
```

The existing full learning seed also calls the domain seed:

```bash
npm run db:seed-learning
```

## What It Seeds

- `developmentCategories`
- `learningGoals`
- `skills`
- 3 sample `programs`
- 3 sample `learningPaths`
- `pathItems` mapped to existing active lessons when possible
- safe Phase 2 default fields on existing active `lessons`

Sample programs:

- Luyện nghe cơ bản
- Giao tiếp hằng ngày
- Nhận biết cảm xúc

## Mapping Behavior

The script looks for active legacy lessons and maps likely matches into paths using lesson type and title hints. If no clear matches exist, it falls back to the first active lessons so the mobile map can exercise the Phase 2 path flow.

The script does not delete legacy collections and does not convert legacy questions/dialogues/flashcards into persisted `activities`. Runtime adapters handle old content for now.

## Operational Notes

- The script uses Firebase Admin through `scripts/firebase-init.ts`.
- It is safe to run repeatedly; taxonomy, programs, paths, and pathItems use stable document IDs with merge writes.
- Existing content authorship remains in legacy admin pages until Phase 3 adds full workflow tooling.
