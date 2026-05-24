import * as admin from 'firebase-admin';

const now = () => admin.firestore.FieldValue.serverTimestamp();

type DomainLesson = {
  id: string;
  title: string;
  type: string;
  orderIndex: number;
};

const developmentCategories = [
  ['SPEECH_DELAY', 'Chậm nói / khó khăn lời nói', 'Hoạt động nghe, nói và giao tiếp ngắn tại nhà.'],
  ['ATTENTION_DIFFICULTY', 'Khó tập trung', 'Hoạt động ngắn, ít bước, có nhắc lại.'],
  ['COGNITIVE_DELAY', 'Chậm phát triển nhận thức', 'Nhận biết, ghép đôi, đếm và làm theo chỉ dẫn đơn giản.'],
  ['SOCIAL_COMMUNICATION', 'Giao tiếp xã hội', 'Chào hỏi, lựa chọn câu nói và tình huống hằng ngày.'],
  ['EMOTION_RECOGNITION', 'Nhận biết cảm xúc', 'Nhận biết cảm xúc cơ bản qua hình ảnh và tình huống.'],
  ['DAILY_LIFE_SKILL', 'Kỹ năng sinh hoạt', 'Thực hành hoạt động nhỏ trong sinh hoạt hằng ngày.'],
  ['OTHER', 'Khác / chưa xác định', 'Dùng khi phụ huynh chưa chọn nhóm khó khăn cụ thể.'],
];

const learningGoals = [
  ['LISTENING', 'Lắng nghe', 'Nghe chỉ dẫn ngắn và chọn phản hồi phù hợp.'],
  ['SPEAKING', 'Nói', 'Khuyến khích bé nói/tập nhắc lại từ hoặc câu ngắn.'],
  ['OBJECT_RECOGNITION', 'Nhận biết đồ vật', 'Nhận diện con vật, đồ vật, hình ảnh quen thuộc.'],
  ['EMOTION_RECOGNITION', 'Nhận biết cảm xúc', 'Nhận diện vui, buồn, mệt, đói và các cảm xúc cơ bản.'],
  ['DAILY_COMMUNICATION', 'Giao tiếp hằng ngày', 'Chào hỏi và câu nói trong tình huống đời thường.'],
  ['MATCHING', 'Ghép đôi', 'Ghép hình, chữ, đồ vật hoặc lựa chọn tương ứng.'],
  ['COUNTING', 'Đếm số', 'Đếm số lượng nhỏ và nhận biết số.'],
  ['FOLLOW_INSTRUCTION', 'Làm theo hướng dẫn', 'Làm theo một hoặc hai bước hướng dẫn.'],
  ['PARENT_CHILD_ACTIVITY', 'Hoạt động cùng phụ huynh', 'Bài tập ngắn có phụ huynh đồng hành.'],
];

const programs = [
  {
    id: 'program_listening_basic',
    title: 'Luyện nghe cơ bản',
    description: 'Bé nghe chỉ dẫn ngắn, nhận biết hình ảnh và phản hồi bằng lựa chọn đơn giản.',
    targetAgeMin: 2,
    targetAgeMax: 6,
    difficultyCategories: ['SPEECH_DELAY', 'ATTENTION_DIFFICULTY', 'COGNITIVE_DELAY'],
    learningGoals: ['LISTENING', 'OBJECT_RECOGNITION', 'FOLLOW_INSTRUCTION'],
    skillTags: ['LISTENING', 'OBJECT_RECOGNITION', 'FOLLOW_INSTRUCTION'],
    level: 'BEGINNER',
    accessType: 'FREE',
    status: 'PUBLISHED',
  },
  {
    id: 'program_daily_communication',
    title: 'Giao tiếp hằng ngày',
    description: 'Bé luyện lời chào, câu trả lời ngắn và tình huống giao tiếp trong gia đình.',
    targetAgeMin: 2,
    targetAgeMax: 7,
    difficultyCategories: ['SPEECH_DELAY', 'SOCIAL_COMMUNICATION', 'DAILY_LIFE_SKILL'],
    learningGoals: ['SPEAKING', 'DAILY_COMMUNICATION', 'PARENT_CHILD_ACTIVITY'],
    skillTags: ['SPEAKING', 'DAILY_COMMUNICATION', 'PARENT_CHILD_ACTIVITY'],
    level: 'BEGINNER',
    accessType: 'PREMIUM',
    status: 'PUBLISHED',
  },
  {
    id: 'program_emotion_recognition',
    title: 'Nhận biết cảm xúc',
    description: 'Bé làm quen cảm xúc cơ bản qua hình ảnh, câu chuyện và lựa chọn ngắn.',
    targetAgeMin: 3,
    targetAgeMax: 7,
    difficultyCategories: ['EMOTION_RECOGNITION', 'SOCIAL_COMMUNICATION', 'COGNITIVE_DELAY'],
    learningGoals: ['EMOTION_RECOGNITION', 'DAILY_COMMUNICATION', 'MATCHING'],
    skillTags: ['EMOTION_RECOGNITION', 'DAILY_COMMUNICATION', 'MATCHING'],
    level: 'BEGINNER',
    accessType: 'FREE',
    status: 'PUBLISHED',
  },
];

const paths = [
  {
    id: 'path_listening_basic_beginner',
    programId: 'program_listening_basic',
    title: 'Lộ trình nghe và chọn cơ bản',
    description: 'Bắt đầu bằng bài ngắn để bé nghe, nhìn và chọn đáp án quen thuộc.',
    targetProfileRules: {
      primaryDifficulties: ['SPEECH_DELAY', 'ATTENTION_DIFFICULTY', 'COGNITIVE_DELAY'],
      learningGoals: ['LISTENING', 'OBJECT_RECOGNITION', 'FOLLOW_INSTRUCTION'],
    },
    level: 'BEGINNER',
    orderIndex: 1,
    accessType: 'FREE',
    status: 'PUBLISHED',
  },
  {
    id: 'path_daily_communication_beginner',
    programId: 'program_daily_communication',
    title: 'Lộ trình giao tiếp hằng ngày',
    description: 'Luyện chào hỏi, gọi tên và câu trả lời đơn giản với phụ huynh.',
    targetProfileRules: {
      primaryDifficulties: ['SPEECH_DELAY', 'SOCIAL_COMMUNICATION', 'DAILY_LIFE_SKILL'],
      learningGoals: ['SPEAKING', 'DAILY_COMMUNICATION', 'PARENT_CHILD_ACTIVITY'],
    },
    level: 'BEGINNER',
    orderIndex: 2,
    accessType: 'PREMIUM',
    status: 'PUBLISHED',
  },
  {
    id: 'path_emotion_recognition_beginner',
    programId: 'program_emotion_recognition',
    title: 'Lộ trình nhận biết cảm xúc',
    description: 'Nhận biết vui, buồn và cảm xúc cơ bản qua tình huống ngắn.',
    targetProfileRules: {
      primaryDifficulties: ['EMOTION_RECOGNITION', 'SOCIAL_COMMUNICATION'],
      learningGoals: ['EMOTION_RECOGNITION', 'DAILY_COMMUNICATION', 'MATCHING'],
    },
    level: 'BEGINNER',
    orderIndex: 3,
    accessType: 'FREE',
    status: 'PUBLISHED',
  },
];

export async function seedDomainData(db: admin.firestore.Firestore) {
  console.log('\x1b[36mSeeding Phase 2 domain taxonomy...\x1b[0m');
  await seedCatalog(db, 'developmentCategories', developmentCategories);
  await seedCatalog(db, 'learningGoals', learningGoals);
  await seedSkills(db);
  await seedProgramsAndPaths(db);
  const lessons = await enrichLessonsForDomain(db);
  await seedPathItems(db, lessons);
  await seedActivities(db, lessons);
  await seedActivationCodes(db, lessons);
  console.log('\x1b[32mPhase 2 domain seed complete.\x1b[0m');
}

async function seedCatalog(
  db: admin.firestore.Firestore,
  collectionName: string,
  rows: string[][],
) {
  await Promise.all(
    rows.map(([key, label, parentDescription], index) =>
      db.collection(collectionName).doc(key).set({
        key,
        label,
        parentDescription,
        isActive: true,
        orderIndex: index + 1,
        createdAt: now(),
        updatedAt: now(),
      }, { merge: true }),
    ),
  );
}

async function seedSkills(db: admin.firestore.Firestore) {
  await Promise.all(
    learningGoals.map(([key, label, parentDescription], index) =>
      db.collection('skills').doc(key).set({
        key,
        label,
        domain: skillDomain(key),
        parentDescription,
        isActive: true,
        orderIndex: index + 1,
        createdAt: now(),
        updatedAt: now(),
      }, { merge: true }),
    ),
  );
}

async function seedProgramsAndPaths(db: admin.firestore.Firestore) {
  await Promise.all(
    programs.map((program) =>
      db.collection('programs').doc(program.id).set({
        ...program,
        createdAt: now(),
        updatedAt: now(),
      }, { merge: true }),
    ),
  );
  await Promise.all(
    paths.map((path) =>
      db.collection('learningPaths').doc(path.id).set({
        ...path,
        createdAt: now(),
        updatedAt: now(),
      }, { merge: true }),
    ),
  );
}

async function enrichLessonsForDomain(db: admin.firestore.Firestore): Promise<DomainLesson[]> {
  const snap = await db.collection('lessons').where('isActive', '==', true).get();
  const lessons = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: `${data.title ?? ''}`,
      type: `${data.type ?? data.lessonType ?? 'MATH'}`.toUpperCase(),
      orderIndex: Number(data.orderIndex ?? 0),
    };
  }).sort((a, b) => a.orderIndex - b.orderIndex);

  await Promise.all(
    snap.docs.map((doc, index) => {
      const data = doc.data();
      const meta = lessonMeta(`${data.type ?? data.lessonType ?? 'MATH'}`.toUpperCase(), `${data.title ?? ''}`);
      const accessType = index < 2 ? 'PREMIUM' : 'FREE';
      return doc.ref.set({
        lessonType: `${data.lessonType ?? data.type ?? 'MATH'}`.toUpperCase(),
        level: data.level ?? 'BEGINNER',
        skillTags: data.skillTags ?? meta.skillTags,
        difficultyCategories: data.difficultyCategories ?? meta.difficultyCategories,
        learningGoals: data.learningGoals ?? meta.learningGoals,
        estimatedMinutes: data.estimatedMinutes ?? 3,
        accessType,
        publishStatus: data.publishStatus ?? 'PUBLISHED',
        updatedAt: now(),
      }, { merge: true });
    }),
  );

  return lessons;
}

async function seedPathItems(db: admin.firestore.Firestore, lessons: DomainLesson[]) {
  const listening = selectLessons(lessons, ['DIALOGUE', 'MATH', 'THINKING'], ['gọi tên', 'đếm', 'chọn số', 'chào']);
  const communication = selectLessons(lessons, ['DIALOGUE', 'SPELLING', 'THINKING'], ['chào', 'gọi tên', 'suy luận']);
  const emotion = selectLessons(lessons, ['DIALOGUE', 'THINKING'], ['cảm xúc', 'vui', 'buồn']);
  await upsertPathItems(db, 'path_listening_basic_beginner', listening.length ? listening : lessons.slice(0, 4));
  await upsertPathItems(db, 'path_daily_communication_beginner', communication.length ? communication : lessons.slice(0, 4));
  await upsertPathItems(db, 'path_emotion_recognition_beginner', emotion.length ? emotion : lessons.slice(0, 3));
}

async function upsertPathItems(
  db: admin.firestore.Firestore,
  pathId: string,
  lessons: DomainLesson[],
) {
  await Promise.all(
    lessons.map((lesson, index) => {
      const previous = index > 0 ? lessons[index - 1].id : null;
      return db.collection('pathItems').doc(`${pathId}_${lesson.id}`).set({
        pathId,
        lessonId: lesson.id,
        sequence: index + 1,
        unlockRule: index === 0 ? 'ALWAYS_OPEN' : 'PREVIOUS_COMPLETED',
        prerequisiteLessonIds: previous ? [previous] : [],
        requiredCompletion: true,
        createdAt: now(),
        updatedAt: now(),
      }, { merge: true });
    }),
  );
}

function selectLessons(lessons: DomainLesson[], types: string[], titleHints: string[]) {
  const lowerHints = titleHints.map((hint) => hint.toLowerCase());
  const selected = lessons.filter((lesson) =>
    types.includes(lesson.type) &&
    lowerHints.some((hint) => lesson.title.toLowerCase().includes(hint)),
  );
  return selected.slice(0, 5);
}

function lessonMeta(type: string, title: string) {
  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes('cảm xúc')) {
    return {
      skillTags: ['EMOTION_RECOGNITION', 'DAILY_COMMUNICATION'],
      difficultyCategories: ['EMOTION_RECOGNITION', 'SOCIAL_COMMUNICATION'],
      learningGoals: ['EMOTION_RECOGNITION', 'DAILY_COMMUNICATION'],
    };
  }
  if (type === 'DIALOGUE') {
    return {
      skillTags: ['LISTENING', 'DAILY_COMMUNICATION', 'SPEAKING'],
      difficultyCategories: ['SPEECH_DELAY', 'SOCIAL_COMMUNICATION'],
      learningGoals: ['LISTENING', 'SPEAKING', 'DAILY_COMMUNICATION'],
    };
  }
  if (type === 'SPELLING' || type === 'RHYME') {
    return {
      skillTags: ['SPEAKING', 'MATCHING'],
      difficultyCategories: ['SPEECH_DELAY', 'COGNITIVE_DELAY'],
      learningGoals: ['SPEAKING', 'MATCHING'],
    };
  }
  return {
    skillTags: ['COUNTING', 'FOLLOW_INSTRUCTION', 'MATCHING'],
    difficultyCategories: ['COGNITIVE_DELAY', 'ATTENTION_DIFFICULTY'],
    learningGoals: ['COUNTING', 'FOLLOW_INSTRUCTION', 'MATCHING'],
  };
}

function skillDomain(key: string) {
  if (['LISTENING', 'SPEAKING', 'DAILY_COMMUNICATION'].includes(key)) {
    return 'COMMUNICATION';
  }
  if (['OBJECT_RECOGNITION', 'MATCHING', 'COUNTING', 'FOLLOW_INSTRUCTION'].includes(key)) {
    return 'COGNITIVE';
  }
  if (key === 'EMOTION_RECOGNITION') return 'SOCIAL_EMOTIONAL';
  return 'PARENT_GUIDED';
}

async function seedActivities(db: admin.firestore.Firestore, lessons: DomainLesson[]) {
  console.log('\x1b[36mSeeding sample activities (Phase 3)...\x1b[0m');
  const activitiesCol = db.collection('activities');
  
  for (const lesson of lessons) {
    const lessonId = lesson.id;
    const type = lesson.type;
    
    if (type === 'MATH') {
      await activitiesCol.doc(`act_${lessonId}_1`).set({
        lessonId,
        activityType: 'MULTIPLE_CHOICE',
        orderIndex: 1,
        prompt: `Bé hãy chọn kết quả đúng cho bài học: ${lesson.title}`,
        instruction: 'Nhấn vào đáp án đúng',
        options: [
          { text: '1 con vật', isCorrect: false },
          { text: '2 con vật', isCorrect: true },
          { text: '3 con vật', isCorrect: false }
        ],
        feedback: { correct: 'Đúng rồi! Bé giỏi quá!', wrong: 'Chưa chính xác, thử lại nhé!' },
        isActive: true,
        accessType: 'FREE',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

      await activitiesCol.doc(`act_${lessonId}_2`).set({
        lessonId,
        activityType: 'LOOK_AND_CHOOSE_WORD',
        orderIndex: 2,
        prompt: 'Nhìn hình và chọn từ số đúng.',
        imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f31f.svg',
        options: [
          { text: 'MỘT', isCorrect: false },
          { text: 'HAI', isCorrect: true }
        ],
        feedback: { correct: 'Giỏi quá!', wrong: 'Thử lại nào!' },
        isActive: true,
        accessType: 'PREMIUM',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

    } else if (type === 'DIALOGUE') {
      await activitiesCol.doc(`act_${lessonId}_1`).set({
        lessonId,
        activityType: 'VOICE_ANSWER',
        orderIndex: 1,
        prompt: 'Con hãy tập nói lời chào nhé!',
        ttsPromptText: 'Bé hãy nói lời chào nhé!',
        acceptedAnswers: ['xin chào', 'chào cô', 'hello'],
        almostAnswers: ['chào', 'chao'],
        retryLimit: 2,
        feedback: { correct: 'Tuyệt vời! Mimi đã nghe thấy rồi!', almost: 'Gần đúng rồi, nói to lên con nhé!', wrong: 'Nói lại lần nữa nào!' },
        isActive: true,
        accessType: 'PREMIUM',
        voicePremiumRequired: true,
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

      await activitiesCol.doc(`act_${lessonId}_2`).set({
        lessonId,
        activityType: 'DAILY_LIFE_SCENARIO',
        orderIndex: 2,
        prompt: 'Khi Mimi hỏi "Con ăn cơm chưa?", con trả lời thế nào?',
        options: [
          { text: 'Dạ con ăn rồi', isCorrect: true },
          { text: 'Không trả lời', isCorrect: false }
        ],
        feedback: { correct: 'Lễ phép lắm!', wrong: 'Hãy nhớ trả lời lễ phép nhé!' },
        isActive: true,
        accessType: 'FREE',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

    } else if (type === 'FLASHCARD') {
      await activitiesCol.doc(`act_${lessonId}_1`).set({
        lessonId,
        activityType: 'LISTEN_AND_CHOOSE_IMAGE',
        orderIndex: 1,
        prompt: 'Nghe Mimi phát âm và chọn thẻ hình đúng.',
        audioUrl: 'https://example.com/audio/apple.mp3',
        options: [
          { text: 'Quả táo', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f34e.svg', isCorrect: true },
          { text: 'Quả chuối', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f34c.svg', isCorrect: false }
        ],
        feedback: { correct: 'Chính xác!', wrong: 'Thử lại nhé!' },
        isActive: true,
        accessType: 'FREE',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

    } else if (lesson.title.includes('cảm xúc')) {
      await activitiesCol.doc(`act_${lessonId}_1`).set({
        lessonId,
        activityType: 'EMOTION_RECOGNITION',
        orderIndex: 1,
        prompt: 'Bé hãy nhìn khuôn mặt dưới đây và đoán cảm xúc.',
        imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f600.svg',
        options: [
          { text: 'Vui vẻ', isCorrect: true },
          { text: 'Buồn bã', isCorrect: false },
          { text: 'Tức giận', isCorrect: false }
        ],
        feedback: { correct: 'Chuẩn luôn!', wrong: 'Nhìn kỹ lại biểu cảm xem sao.' },
        isActive: true,
        accessType: 'FREE',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });

    } else {
      await activitiesCol.doc(`act_${lessonId}_1`).set({
        lessonId,
        activityType: 'PARENT_MARK_RESULT',
        orderIndex: 1,
        prompt: 'Hoạt động đồng hành cùng phụ huynh.',
        parentInstruction: `Phụ huynh hãy hướng dẫn bé thực hiện bài học "${lesson.title}" và đánh giá kết quả của bé.`,
        isActive: true,
        accessType: 'FREE',
        createdAt: now(),
        updatedAt: now()
      }, { merge: true });
    }
  }
}

async function seedActivationCodes(db: admin.firestore.Firestore, lessons: DomainLesson[]) {
  console.log('\x1b[36mSeeding activation codes (Phase 3.5)...\x1b[0m');
  const codesCol = db.collection('activationCodes');
  
  await codesCol.doc('code_toy_1').set({
    code: 'HA-TOY100',
    activationType: 'PHYSICAL_TOY',
    targetId: null,
    label: 'Đồ chơi thông minh HA-100',
    active: true,
    maxUses: 10,
    usedCount: 0,
    perUserLimit: 1,
    expiresAt: null,
    source: 'QR',
    createdAt: now(),
    updatedAt: now()
  }, { merge: true });

  const npcSnap = await db.collection('npcs').get();
  for (const doc of npcSnap.docs) {
    const npc = doc.data();
    const cleanName = npc.name.toLowerCase();
    let prefix = 'MIMI';
    if (cleanName.includes('bobo')) prefix = 'BOBO';
    if (cleanName.includes('nana')) prefix = 'NANA';

    // Set Nana as PREMIUM Mascot, others as FREE
    const accessType = cleanName.includes('nana') ? 'PREMIUM' : 'FREE';
    await doc.ref.update({
      accessType,
      updatedAt: now(),
    });
    
    await codesCol.doc(`code_npc_${doc.id}`).set({
      code: `HA-NPC-${prefix}`,
      activationType: 'NPC',
      targetId: doc.id,
      label: `Kích hoạt Mascot ${npc.name}`,
      active: true,
      maxUses: 100,
      usedCount: 0,
      perUserLimit: 1,
      expiresAt: null,
      source: 'QR',
      createdAt: now(),
      updatedAt: now()
    }, { merge: true });
  }

  if (lessons.length > 0) {
    await codesCol.doc('code_lesson_1').set({
      code: 'HA-LESSON-01',
      activationType: 'LESSON',
      targetId: lessons[0].id,
      label: `Kích hoạt Bài học: ${lessons[0].title} (Prepared)`,
      active: true,
      maxUses: 50,
      usedCount: 0,
      perUserLimit: 1,
      expiresAt: null,
      source: 'QR',
      createdAt: now(),
      updatedAt: now()
    }, { merge: true });
  }
}
