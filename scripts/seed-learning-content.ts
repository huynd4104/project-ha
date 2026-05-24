import * as admin from 'firebase-admin';

type SeedContext = {
  adminUid: string;
  parentUid: string;
};

export async function seedLearningContent(db: admin.firestore.Firestore, context: SeedContext) {
  const lessons = db.collection('lessons');
  const mathQuestions = db.collection('mathQuestions');
  const dialogues = db.collection('dialogues');
  const flashcards = db.collection('flashcards');
  const spellingActivities = db.collection('spellingActivities');
  const rhymeChallenges = db.collection('rhymeChallenges');

  const mimi = await db.collection('npcs').add({
    name: 'Mèo Mimi',
    description: 'Bạn đồng hành trong các bài chào hỏi và nhận diện từ.',
    imageUrl: 'https://placehold.co/300x300/F7C8A0/3A2D28?text=Mimi',
    defaultDialogue: 'Mimi chào con. Hôm nay mình cùng học nhé!',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const bobo = await db.collection('npcs').add({
    name: 'Gấu Bobo',
    description: 'Bạn gấu hiền lành giúp bé tư duy và đếm số.',
    imageUrl: 'https://placehold.co/300x300/D8B48C/3A2D28?text=Bobo',
    defaultDialogue: 'Bobo cùng con khám phá từng câu đố nhé.',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const nana = await db.collection('npcs').add({
    name: 'Thỏ Nana',
    description: 'Bạn thỏ năng động đồng hành với ghép vần và thẻ học.',
    imageUrl: 'https://placehold.co/300x300/F4B6C2/3A2D28?text=Nana',
    defaultDialogue: 'Nana muốn cùng con ghép âm và vần thật vui.',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

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

  lessonRefs.math.push(
    await makeLesson({ title: 'Đếm số lượng con vật', description: 'Chọn số ứng với số con vật trong hình.', type: 'MATH', orderIndex: 1, npcId: bobo.id }),
    await makeLesson({ title: 'Chọn số đúng', description: 'Nhận diện chữ số qua hoạt động ngắn.', type: 'MATH', orderIndex: 2, npcId: bobo.id }),
    await makeLesson({ title: 'So sánh nhiều/ít', description: 'Làm quen với nhiều hơn và ít hơn.', type: 'MATH', orderIndex: 3, npcId: bobo.id })
  );

  lessonRefs.dialogue.push(
    await makeLesson({ title: 'Chào hỏi đơn giản', description: 'Tập chào hỏi trong tình huống hằng ngày.', type: 'DIALOGUE', orderIndex: 4, npcId: mimi.id }),
    await makeLesson({ title: 'Gọi tên con vật', description: 'Chọn tên con vật quen thuộc.', type: 'DIALOGUE', orderIndex: 5, npcId: mimi.id }),
    await makeLesson({ title: 'Chọn cảm xúc vui/buồn', description: 'Nhận diện cảm xúc cơ bản.', type: 'DIALOGUE', orderIndex: 6, npcId: nana.id })
  );

  lessonRefs.thinking.push(
    await makeLesson({ title: 'Suy luận với đồ vật', description: 'Chọn đáp án hợp lý dựa trên tình huống đơn giản.', type: 'THINKING', orderIndex: 7, npcId: bobo.id }),
    await makeLesson({ title: 'Nguyên nhân và kết quả', description: 'Bé đoán điều sẽ xảy ra tiếp theo.', type: 'THINKING', orderIndex: 8, npcId: bobo.id })
  );

  lessonRefs.spelling.push(
    await makeLesson({ title: 'Ghép chữ đầu', description: 'Nhận diện âm đầu của từ quen thuộc.', type: 'SPELLING', orderIndex: 9, npcId: mimi.id }),
    await makeLesson({ title: 'Sắp chữ thành từ', description: 'Kéo thả chữ để tạo thành từ đúng.', type: 'SPELLING', orderIndex: 10, npcId: mimi.id })
  );

  lessonRefs.rhyme.push(
    await makeLesson({ title: 'Ghép vần vui', description: 'Chọn từ có cùng vần với tiếng mẫu.', type: 'RHYME', orderIndex: 11, npcId: nana.id }),
    await makeLesson({ title: 'Chọn từ cùng vần', description: 'Phân biệt các từ có âm vần giống nhau.', type: 'RHYME', orderIndex: 12, npcId: nana.id })
  );

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

  await flashcards.add({ lessonId: lessonRefs.dialogue[0].id, frontText: 'Xin chào', backText: 'Lời chào thân thiện', imageUrl: '', orderIndex: 1, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await flashcards.add({ lessonId: lessonRefs.dialogue[1].id, frontText: 'Mèo', backText: 'Con vật nhỏ, kêu meo meo', imageUrl: '', orderIndex: 2, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  await flashcards.add({ lessonId: lessonRefs.dialogue[2].id, frontText: 'Vui', backText: 'Cảm xúc vui vẻ', imageUrl: '', orderIndex: 3, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });

  return { adminUid: context.adminUid, parentUid: context.parentUid };
}
