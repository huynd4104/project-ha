# Gamification Flow & Architecture

This document details the gamification systems implemented in Project HA, covering Level/XP progression, daily streaks, automated badges earning, and daily missions.

## 1. Level & XP Progression

We implement a simple, predictable level system based on total accumulated XP logs (`xpLogs`):
- `totalXp`: The sum of all `amount` values in `xpLogs` for a given user & child.
- `level`: `Math.floor(totalXp / 100) + 1`
- `xpInCurrentLevel`: `totalXp % 100`
- `xpToNextLevel`: `100`

### XP Award Rules:
1. **First-Time Completion**:
   - Math Lesson Completed: **+20 XP**
   - Dialogue Lesson Completed: **+20 XP**
   - Flashcard Review Completed: **+5 XP**
   - QR Mascot Unlock: **+10 XP**
2. **Review Mode (Anti-Spam)**:
   - Repeating a lesson/review that was already completed awards **0 XP**. This prevents kids from spamming the same activities to farm levels.

---

## 2. Daily Streaks

Streaks represent consecutive days of learning activities (completing a math/dialogue lesson, flashcard review, or unlocking an NPC).

- Calculations use the user's **local timezone date** formatted as `YYYY-MM-DD`.
- **First Activity of the Day**: Checks if the last active date was *yesterday* (`currentStreak + 1`), *today* (no changes), or *earlier* (streak resets to `1`).
- `longestStreak` keeps track of `max(longestStreak, currentStreak)`.

---

## 3. Badges System

Badges are certified accomplishments that children earn when they satisfy specific conditions. Evaluated automatically via `checkAndAwardBadges` after every primary action:

| Badge Condition Type | Logic & Target Collection |
|---|---|
| `COMPLETE_LESSONS` | Unique completed lesson entries in `progress` |
| `STREAK_DAYS` | Current streak value in `streaks` |
| `TOTAL_XP` | Cumulative sum of all `xpLogs` |
| `UNLOCK_NPCS` | Size of `userUnlockedNpcs` |
| `COMPLETE_DAILY_MISSIONS` | Total completed items in `userMissionProgress` |

Earned badges are stored in `userBadges` and can only be awarded **once** per child.

---

## 4. Daily Missions

A rotating list of active daily missions is queried from `dailyMissions` (`isActive == true`). 
- On doing a matching action, a document in `userMissionProgress` is updated or created for `date = today`.
- Once `currentValue >= targetValue`, the mission marks `isCompleted = true`.
- Parents/children can click the **Nhận thưởng (Claim)** button on the Rewards screen, which updates `rewardClaimed = true` and awards the reward XP.
