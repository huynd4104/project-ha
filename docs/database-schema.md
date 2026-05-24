# Firestore Database Schema

Collections used by the MVP:

- `users`
- `children`
- `npcs`
- `qrCodes`
- `userUnlockedNpcs`
- `lessons`
- `mathQuestions`
- `dialogues`
- `flashcards`
- `progress`
- `xpLogs`
- `streaks`

## Models

`users/{uid}`:

```ts
{
  uid: string;
  email: string;
  fullName: string;
  role: "PARENT" | "ADMIN";
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}
```

`children/{id}`:

```ts
{
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  note: string;
  createdAt: any;
  updatedAt: any;
}
```

Content collections:

- `npcs`: name, description, imageUrl, optional animationUrl, defaultDialogue, isActive.
- `qrCodes`: code, npcId, label, isActive, optional maxUses, usedCount.
- `lessons`: title, description, type `MATH`, `DIALOGUE`, `FLASHCARD`, `THINKING`, `SPELLING`, or `RHYME`, orderIndex, optional npcId, isActive.
- `mathQuestions`: lessonId, questionText, options A-D, correctOption, explanation, orderIndex.
- `dialogues`: lessonId, title, sceneText, audioUrl, questionText, options A-D, correctOption, orderIndex.
- `flashcards`: lessonId, frontText, backText, imageUrl, audioUrl, orderIndex.

Activity collections:

- `userUnlockedNpcs`: userId, childId, npcId, optional qrCodeId, unlockedAt.
- `progress`: userId, childId, lessonId, optional activityType, status, score, totalQuestions, correctAnswers, completedAt.
- `xpLogs`: userId, childId, amount, reason, createdAt.
- `streaks`: userId, childId, currentStreak, longestStreak, lastActiveDate, updatedAt.
