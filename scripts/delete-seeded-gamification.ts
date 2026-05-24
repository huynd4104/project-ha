import { initializeFirebaseAdmin } from './firebase-init';

const SEEDED_DOCS = {
  badges: [
    'badge_first_lesson',
    'badge_streak_3',
    'badge_xp_100',
    'badge_npc_3',
    'badge_lessons_5'
  ],
  dailyMissions: [
    'mission_complete_lesson',
    'mission_review_flashcard',
    'mission_complete_math',
    'mission_complete_dialogue'
  ]
};

const SEEDED_BADGE_NAMES = [
  'Bước đầu tiên',
  'Chăm chỉ 3 ngày',
  '100 XP đầu tiên',
  'Người bạn của NPC',
  'Hoàn thành 5 bài học'
];

async function run() {
  const db = initializeFirebaseAdmin();
  let totalDeleted = 0;

  for (const [collectionName, ids] of Object.entries(SEEDED_DOCS)) {
    const batch = db.batch();
    let deletedInCollection = 0;

    for (const id of ids) {
      const ref = db.collection(collectionName).doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        batch.delete(ref);
        deletedInCollection++;
      }
    }

    if (deletedInCollection > 0) {
      await batch.commit();
    }

    totalDeleted += deletedInCollection;
    console.log(`${collectionName}: deleted ${deletedInCollection} seeded document(s)`);
  }

  const badgeNameSnap = await db.collection('badges').where('name', 'in', SEEDED_BADGE_NAMES).get();
  if (!badgeNameSnap.empty) {
    const batch = db.batch();
    badgeNameSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
  totalDeleted += badgeNameSnap.size;
  console.log(`badges by seeded names: deleted ${badgeNameSnap.size} document(s)`);

  console.log(`Total deleted: ${totalDeleted}`);
}

run().catch((err) => {
  console.error('Failed to delete seeded gamification data:', err);
  process.exit(1);
});
