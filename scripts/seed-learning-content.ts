import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

type SeedContext = {
  adminUid: string;
  parentUid: string;
};

// Helper function to parse CSV lines safely
function parseCSV(filePath: string): any[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const results: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentValue = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    // Map to header
    const row: any = {};
    headers.forEach((header, index) => {
      let val = values[index] || '';
      // Clean quotes
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      row[header] = val;
    });
    results.push(row);
  }

  return results;
}

export async function seedLearningContent(db: admin.firestore.Firestore, context: SeedContext) {
  const templateDir = path.resolve(__dirname, '../data template');

  console.log('\x1b[36mSeeding NPCs...\x1b[0m');
  const npcsCsv = parseCSV(path.join(templateDir, 'NPCs.csv'));
  const npcNameMap = new Map<string, string>(); // Maps Name -> Doc ID

  for (const row of npcsCsv) {
    const docRef = await db.collection('npcs').add({
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      animationUrl: row.animationUrl || '',
      defaultDialogue: row.defaultDialogue,
      isActive: row.isActive === 'true' || row.isActive === true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    npcNameMap.set(row.name, docRef.id);
  }

  console.log('\x1b[36mSeeding QR Codes...\x1b[0m');
  const qrCodesCsv = parseCSV(path.join(templateDir, 'QR Codes.csv'));
  for (const row of qrCodesCsv) {
    const npcId = npcNameMap.get(row.npcName);
    if (!npcId) {
      console.warn(`Warning: NPC "${row.npcName}" not found for QR code ${row.code}`);
      continue;
    }
    await db.collection('qrCodes').add({
      label: row.label,
      code: row.code,
      npcId: npcId,
      isActive: row.isActive === 'true' || row.isActive === true,
      maxUses: row.maxUses ? parseInt(row.maxUses, 10) : null,
      usedCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log('\x1b[36mSeeding Badges...\x1b[0m');
  const badgesCsv = parseCSV(path.join(templateDir, 'Badges.csv'));
  for (const row of badgesCsv) {
    await db.collection('badges').add({
      name: row.name,
      description: row.description,
      iconUrl: row.iconUrl || '',
      type: row.type || '',
      conditionType: row.conditionType || '',
      conditionValue: parseInt(row.conditionValue || '0', 10),
      isActive: row.isActive === 'true' || row.isActive === true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log('\x1b[36mSeeding Daily Missions...\x1b[0m');
  const dailyMissionsCsv = parseCSV(path.join(templateDir, 'Daily Missions.csv'));
  for (const row of dailyMissionsCsv) {
    await db.collection('dailyMissions').add({
      title: row.title,
      description: row.description,
      type: row.type,
      targetValue: parseInt(row.targetValue || '0', 10),
      rewardXp: parseInt(row.rewardXp || '0', 10),
      isActive: row.isActive === 'true' || row.isActive === true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  console.log('\x1b[36mSeeding Lessons and learning activities...\x1b[0m');
  
  // To keep lessons working with correct linked NPC IDs, we resolve doc IDs for Mimi, Bobo, Nana
  const boboId = npcNameMap.get('Gấu Bobo') || '';
  const mimiId = npcNameMap.get('Mèo Mimi') || '';
  const nanaId = npcNameMap.get('Thỏ Nana') || '';

  const lessons = db.collection('lessons');
  const mathQuestions = db.collection('mathQuestions');
  const dialogues = db.collection('dialogues');
  const flashcards = db.collection('flashcards');
  const spellingActivities = db.collection('spellingActivities');
  const rhymeChallenges = db.collection('rhymeChallenges');

  const lessonRefs = {
    math: [] as FirebaseFirestore.DocumentReference[],
    thinking: [] as FirebaseFirestore.DocumentReference[],
    spelling: [] as FirebaseFirestore.DocumentReference[],
    rhyme: [] as FirebaseFirestore.DocumentReference[],
    dialogue: [] as FirebaseFirestore.DocumentReference[]
  };

  const makeLesson = async (data: any) => {
    const ref = await lessons.add({
      ...data,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return ref;
  };

  // Seed math lessons
  lessonRefs.math.push(
    await makeLesson({ title: 'Đếm số lượng con vật', description: 'Chọn số ứng với số con vật trong hình.', type: 'MATH', orderIndex: 1, npcId: boboId }),
    await makeLesson({ title: 'Chọn số đúng', description: 'Nhận diện chữ số qua hoạt động ngắn.', type: 'MATH', orderIndex: 2, npcId: boboId }),
    await makeLesson({ title: 'So sánh nhiều/ít', description: 'Làm quen với nhiều hơn và ít hơn.', type: 'MATH', orderIndex: 3, npcId: boboId })
  );

  // Seed dialogue lessons
  lessonRefs.dialogue.push(
    await makeLesson({ title: 'Chào hỏi đơn giản', description: 'Tập chào hỏi trong tình huống hằng ngày.', type: 'DIALOGUE', orderIndex: 4, npcId: mimiId }),
    await makeLesson({ title: 'Gọi tên con vật', description: 'Chọn tên con vật quen thuộc.', type: 'DIALOGUE', orderIndex: 5, npcId: mimiId }),
    await makeLesson({ title: 'Chọn cảm xúc vui/buồn', description: 'Nhận diện cảm xúc cơ bản.', type: 'DIALOGUE', orderIndex: 6, npcId: nanaId })
  );

  // Seed thinking lessons
  lessonRefs.thinking.push(
    await makeLesson({ title: 'Suy luận với đồ vật', description: 'Chọn đáp án hợp lý dựa trên tình huống đơn giản.', type: 'THINKING', orderIndex: 7, npcId: boboId }),
    await makeLesson({ title: 'Nguyên nhân và kết quả', description: 'Bé đoán điều sẽ xảy ra tiếp theo.', type: 'THINKING', orderIndex: 8, npcId: boboId })
  );

  // Seed spelling lessons
  lessonRefs.spelling.push(
    await makeLesson({ title: 'Ghép chữ đầu', description: 'Nhận diện âm đầu của từ quen thuộc.', type: 'SPELLING', orderIndex: 9, npcId: mimiId }),
    await makeLesson({ title: 'Sắp chữ thành từ', description: 'Kéo thả chữ để tạo thành từ đúng.', type: 'SPELLING', orderIndex: 10, npcId: mimiId })
  );

  // Seed rhyme lessons
  lessonRefs.rhyme.push(
    await makeLesson({ title: 'Ghép vần vui', description: 'Chọn từ có cùng vần với tiếng mẫu.', type: 'RHYME', orderIndex: 11, npcId: nanaId }),
    await makeLesson({ title: 'Chọn từ cùng vần', description: 'Phân biệt các từ có âm vần giống nhau.', type: 'RHYME', orderIndex: 12, npcId: nanaId })
  );

  // Seed questions
  const questionBatch = [
    { lessonId: lessonRefs.math[0].id, questionText: 'Có mấy con mèo?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'B', explanation: 'Có 2 con mèo.', orderIndex: 1 },
    { lessonId: lessonRefs.math[0].id, questionText: 'Có mấy con gấu?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'A', explanation: 'Có 1 con gấu.', orderIndex: 2 },
    { lessonId: lessonRefs.math[1].id, questionText: 'Đâu là số 3?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'C', explanation: 'Số 3 là đáp án C.', orderIndex: 1 },
    { lessonId: lessonRefs.math[2].id, questionText: 'Nhóm nào nhiều hơn?', optionA: '1 quả bóng', optionB: '3 quả bóng', optionC: 'Không có', optionD: 'Bằng nhau', correctOption: 'B', explanation: '3 quả bóng nhiều hơn 1 quả.', orderIndex: 1 },
    { lessonId: lessonRefs.thinking[0].id, questionText: 'Bé có 2 quả táo, mẹ cho thêm 1 quả. Bé có tất cả mấy quả?', optionA: '1', optionB: '2', optionC: '3', optionD: '4', correctOption: 'C', explanation: '2 + 1 = 3.', orderIndex: 1 },
    { lessonId: lessonRefs.thinking[0].id, questionText: 'Nếu trời đang mưa, bé nên mang gì để khỏi ướt?', optionA: 'Ô', optionB: 'Kem', optionC: 'Bóng', optionD: 'Vở', correctOption: 'A', explanation: 'Ô giúp che mưa.', orderIndex: 2 },
    { lessonId: lessonRefs.thinking[1].id, questionText: 'Bé đặt cốc nước trên bàn. Khi đẩy nhẹ, cốc có thể làm gì?', optionA: 'Đứng yên mãi', optionB: 'Di chuyển', optionC: 'Bay lên', optionD: 'Biến mất', correctOption: 'B', explanation: 'Cốc có thể di chuyển khi bị đẩy.', orderIndex: 1 },
    { lessonId: lessonRefs.thinking[1].id, questionText: 'Khi xếp đồ chơi, bé nên làm gì trước?', optionA: 'Ném lung tung', optionB: 'Để đúng chỗ', optionC: 'Giấu đi', optionD: 'Bẻ gãy', correctOption: 'B', explanation: 'Để đúng chỗ sẽ gọn gàng hơn.', orderIndex: 2 }
  ];

  await Promise.all(questionBatch.map((row) => mathQuestions.add({ ...row, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })));

  await Promise.all([
    dialogues.add({ lessonId: lessonRefs.dialogue[0].id, title: 'Gặp Mimi', sceneText: 'Mimi gặp bé và nói: Xin chào!', questionText: 'Bé nên nói gì?', optionA: 'Xin chào', optionB: 'Tạm biệt', optionC: 'Con chó', optionD: 'Số 3', correctOption: 'A', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    dialogues.add({ lessonId: lessonRefs.dialogue[1].id, title: 'Nghe tên con vật', sceneText: 'Mimi chỉ vào một bạn mèo.', questionText: 'Đây là con gì?', optionA: 'Gấu', optionB: 'Mèo', optionC: 'Thỏ', optionD: 'Cá', correctOption: 'B', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    dialogues.add({ lessonId: lessonRefs.dialogue[2].id, title: 'Khuôn mặt vui', sceneText: 'Nana cười rất tươi.', questionText: 'Nana đang cảm thấy thế nào?', optionA: 'Buồn', optionB: 'Vui', optionC: 'Mệt', optionD: 'Đói', correctOption: 'B', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })
  ]);

  await Promise.all([
    spellingActivities.add({ lessonId: lessonRefs.spelling[0].id, promptText: 'Kéo các chữ để ghép thành từ MEO', targetWord: 'MEO', letters: ['M', 'E', 'O'], hint: 'Tên một bạn mèo thân thiện.', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    spellingActivities.add({ lessonId: lessonRefs.spelling[0].id, promptText: 'Kéo các chữ để ghép thành từ CA', targetWord: 'CA', letters: ['C', 'A'], hint: 'Một con vật bơi dưới nước.', orderIndex: 2, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    spellingActivities.add({ lessonId: lessonRefs.spelling[1].id, promptText: 'Sắp xếp chữ cái thành từ NHA', targetWord: 'NHA', letters: ['N', 'H', 'A'], hint: 'Âm bắt đầu của từ nhìn thấy nhiều trong sách.', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })
  ]);

  await Promise.all([
    rhymeChallenges.add({ lessonId: lessonRefs.rhyme[0].id, promptWord: 'NA', questionText: 'Từ nào cùng vần với "na"?', promptWordHint: 'Con hãy tìm tiếng có vần na.', optionA: 'Nha', optionB: 'Bé', optionC: 'Mèo', optionD: 'Cá', correctOption: 'A', orderIndex: 1, explanation: 'Na và nha cùng vần na.', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    rhymeChallenges.add({ lessonId: lessonRefs.rhyme[0].id, promptWord: 'ONG', questionText: 'Từ nào cùng vần với "ong"?', promptWordHint: 'Hãy tìm tiếng có vần ong.', optionA: 'Bông', optionB: 'Bé', optionC: 'Mũ', optionD: 'Cá', correctOption: 'A', orderIndex: 2, explanation: 'Bông có vần ong giống ong.', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }),
    rhymeChallenges.add({ lessonId: lessonRefs.rhyme[1].id, promptWord: 'AT', questionText: 'Từ nào cùng vần với "át"?', promptWordHint: 'Chọn từ có âm cuối giống nhau.', optionA: 'Mát', optionB: 'Mèo', optionC: 'Bé', optionD: 'Cá', correctOption: 'A', orderIndex: 1, explanation: 'Mát có vần át.', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() })
  ]);

  // Seed flashcards
  await flashcards.add({ lessonId: lessonRefs.dialogue[0].id, frontText: 'Xin chào', backText: 'Lời chào thân thiện', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f44b.svg', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await flashcards.add({ lessonId: lessonRefs.dialogue[1].id, frontText: 'Mèo', backText: 'Con vật nhỏ, kêu meo meo', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg', orderIndex: 2, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await flashcards.add({ lessonId: lessonRefs.dialogue[2].id, frontText: 'Vui', backText: 'Cảm xúc vui vẻ', imageUrl: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f600.svg', orderIndex: 3, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  console.log('\x1b[32mSeeding of learning content and metadata from templates complete.\x1b[0m');
  return { adminUid: context.adminUid, parentUid: context.parentUid };
}
