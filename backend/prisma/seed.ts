import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  await prisma.userUnlockedNpc.deleteMany();
  await prisma.userProgress.deleteMany();
  await prisma.xPLog.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.flashcard.deleteMany();
  await prisma.dialogue.deleteMany();
  await prisma.mathQuestion.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.nPC.deleteMany();
  await prisma.childProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("123456");
  const admin = await prisma.user.create({
    data: { email: "admin@demo.com", fullName: "Quản trị demo", passwordHash, role: "ADMIN" }
  });
  const parent = await prisma.user.create({
    data: { email: "parent@demo.com", fullName: "Nguyễn Văn A", passwordHash, role: "PARENT" }
  });
  const child = await prisma.childProfile.create({
    data: {
      userId: parent.id,
      name: "Bé An",
      age: 4,
      gender: "Nam",
      note: "Cần hỗ trợ giao tiếp và hoạt động học/chơi ngắn."
    }
  });

  const mimi = await prisma.nPC.create({
    data: {
      name: "Mèo Mimi",
      description: "Người bạn đồng hành trong các bài chào hỏi và gọi tên con vật.",
      imageUrl: "https://placehold.co/300x300/F7C8A0/3A2D28?text=Mimi",
      defaultDialogue: "Mimi chào con. Hôm nay mình cùng học nhé!"
    }
  });
  const bobo = await prisma.nPC.create({
    data: {
      name: "Gấu Bobo",
      description: "Bạn gấu hiền lành giúp trẻ làm quen với toán cơ bản.",
      imageUrl: "https://placehold.co/300x300/D8B48C/3A2D28?text=Bobo",
      defaultDialogue: "Bobo cùng con đếm từng món đồ nhé."
    }
  });
  const nana = await prisma.nPC.create({
    data: {
      name: "Thỏ Nana",
      description: "Bạn thỏ năng động đồng hành với thẻ học cảm xúc.",
      imageUrl: "https://placehold.co/300x300/F4B6C2/3A2D28?text=Nana",
      defaultDialogue: "Nana muốn biết hôm nay con cảm thấy thế nào."
    }
  });

  await prisma.qRCode.createMany({
    data: [
      { code: "CAT_001_UNLOCK_MIMI", label: "Mở khóa Mèo Mimi", npcId: mimi.id },
      { code: "BEAR_001_UNLOCK_BOBO", label: "Mở khóa Gấu Bobo", npcId: bobo.id },
      { code: "RABBIT_001_UNLOCK_NANA", label: "Mở khóa Thỏ Nana", npcId: nana.id }
    ]
  });

  const mathLessons = await Promise.all([
    prisma.lesson.create({ data: { title: "Đếm số lượng con vật", description: "Chọn số ứng với số con vật trong hình.", type: "MATH", orderIndex: 1, npcId: bobo.id } }),
    prisma.lesson.create({ data: { title: "Chọn số đúng", description: "Nhận diện chữ số qua hoạt động ngắn.", type: "MATH", orderIndex: 2, npcId: bobo.id } }),
    prisma.lesson.create({ data: { title: "So sánh nhiều/ít", description: "Làm quen với nhiều hơn và ít hơn.", type: "MATH", orderIndex: 3, npcId: bobo.id } })
  ]);
  const dialogueLessons = await Promise.all([
    prisma.lesson.create({ data: { title: "Chào hỏi đơn giản", description: "Tập chào hỏi trong tình huống hằng ngày.", type: "DIALOGUE", orderIndex: 4, npcId: mimi.id } }),
    prisma.lesson.create({ data: { title: "Gọi tên con vật", description: "Chọn tên con vật quen thuộc.", type: "DIALOGUE", orderIndex: 5, npcId: mimi.id } }),
    prisma.lesson.create({ data: { title: "Chọn cảm xúc vui/buồn", description: "Nhận diện cảm xúc cơ bản.", type: "DIALOGUE", orderIndex: 6, npcId: nana.id } })
  ]);

  const thinkingLessons = await Promise.all([
    prisma.lesson.create({ data: { title: "Suy luận với đồ vật", description: "Chọn đáp án hợp lý dựa trên tình huống đơn giản.", type: "THINKING", orderIndex: 7, npcId: bobo.id } }),
  ]);

  const spellingLessons = await Promise.all([
    prisma.lesson.create({ data: { title: "Ghép chữ đầu", description: "Nhận diện âm đầu của từ quen thuộc.", type: "SPELLING", orderIndex: 8, npcId: mimi.id } }),
  ]);

  const rhymeLessons = await Promise.all([
    prisma.lesson.create({ data: { title: "Ghép vần vui", description: "Chọn từ có cùng vần với tiếng mẫu.", type: "RHYME", orderIndex: 9, npcId: nana.id } }),
  ]);

  await prisma.mathQuestion.createMany({
    data: [
      { lessonId: mathLessons[0].id, questionText: "Có mấy con mèo?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "B", explanation: "Có 2 con mèo.", orderIndex: 1 },
      { lessonId: mathLessons[0].id, questionText: "Có mấy con gấu?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "A", explanation: "Có 1 con gấu.", orderIndex: 2 },
      { lessonId: mathLessons[1].id, questionText: "Đâu là số 3?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "C", orderIndex: 1 },
      { lessonId: mathLessons[2].id, questionText: "Nhóm nào nhiều hơn?", optionA: "1 quả bóng", optionB: "3 quả bóng", optionC: "Không có", optionD: "Bằng nhau", correctOption: "B", orderIndex: 1 }
    ]
  });

  await prisma.dialogue.createMany({
    data: [
      { lessonId: dialogueLessons[0].id, title: "Gặp Mimi", sceneText: "Mimi gặp bé và nói: Xin chào!", questionText: "Bé nên nói gì?", optionA: "Xin chào", optionB: "Tạm biệt", optionC: "Con chó", optionD: "Số 3", correctOption: "A", orderIndex: 1 },
      { lessonId: dialogueLessons[1].id, title: "Nghe tên con vật", sceneText: "Mimi chỉ vào một bạn mèo.", questionText: "Đây là con gì?", optionA: "Gấu", optionB: "Mèo", optionC: "Thỏ", optionD: "Cá", correctOption: "B", orderIndex: 1 },
      { lessonId: dialogueLessons[2].id, title: "Khuôn mặt vui", sceneText: "Nana cười rất tươi.", questionText: "Nana đang cảm thấy thế nào?", optionA: "Buồn", optionB: "Vui", optionC: "Mệt", optionD: "Đói", correctOption: "B", orderIndex: 1 }
    ]
  });

  await prisma.mathQuestion.createMany({
    data: [
      { lessonId: thinkingLessons[0].id, questionText: "Bé có 2 quả táo, mẹ cho thêm 1 quả. Bé có tất cả mấy quả?", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "C", explanation: "2 + 1 = 3.", orderIndex: 1 },
      { lessonId: thinkingLessons[0].id, questionText: "Nếu trời đang mưa, bé nên mang gì để khỏi ướt?", optionA: "Ô", optionB: "Kem", optionC: "Bóng", optionD: "Vở", correctOption: "A", explanation: "Ô giúp che mưa nên bé không bị ướt.", orderIndex: 2 },
      { lessonId: spellingLessons[0].id, questionText: "Từ nào bắt đầu bằng âm M?", optionA: "Mèo", optionB: "Táo", optionC: "Bé", optionD: "Cá", correctOption: "A", explanation: "Mèo bắt đầu bằng âm M.", orderIndex: 1 },
      { lessonId: spellingLessons[0].id, questionText: "Chữ cái nào đứng đầu trong từ 'Sao'?", optionA: "S", optionB: "T", optionC: "M", optionD: "N", correctOption: "A", explanation: "Từ 'Sao' bắt đầu bằng chữ S.", orderIndex: 2 },
      { lessonId: rhymeLessons[0].id, questionText: "Từ nào cùng vần với 'na'?", optionA: "Nha", optionB: "Bé", optionC: "Mèo", optionD: "Cá", correctOption: "A", explanation: "'Na' và 'nha' cùng vần na.", orderIndex: 1 },
      { lessonId: rhymeLessons[0].id, questionText: "Từ nào cùng vần với 'ong'?", optionA: "Bông", optionB: "Bé", optionC: "Mũ", optionD: "Cá", correctOption: "A", explanation: "'Bông' có vần ong giống 'ong'.", orderIndex: 2 }
    ]
  });

  const flashcards = ["Mèo", "Chó", "Gấu", "Vui", "Buồn", "Xin chào", "Tạm biệt"];
  await prisma.flashcard.createMany({
    data: flashcards.map((word, index) => ({
      lessonId: dialogueLessons[index % dialogueLessons.length].id,
      frontText: word,
      backText: `Nghĩa/hành động: ${word}`,
      imageUrl: `https://placehold.co/300x220/FFF3D6/3A2D28?text=${encodeURIComponent(word)}`,
      orderIndex: index + 1
    }))
  });

  await prisma.userUnlockedNpc.create({ data: { userId: parent.id, childId: child.id, npcId: mimi.id } });
  await prisma.xPLog.create({ data: { userId: parent.id, childId: child.id, amount: 20, reason: "Dữ liệu demo" } });
  await prisma.streak.create({ data: { userId: parent.id, childId: child.id, currentStreak: 1, longestStreak: 1, lastActiveDate: new Date() } });

  console.log({ admin: admin.email, parent: parent.email, child: child.name });
}

main().finally(async () => prisma.$disconnect());
