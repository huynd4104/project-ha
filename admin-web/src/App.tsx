import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChildrenPage } from "./pages/ChildrenPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DialoguesPage } from "./pages/DialoguesPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { LessonsPage } from "./pages/LessonsPage";
import { LoginPage } from "./pages/LoginPage";
import { MathQuestionsPage } from "./pages/MathQuestionsPage";
import { NPCsPage } from "./pages/NPCsPage";
import { ProgressPage } from "./pages/ProgressPage";
import { QRCodesPage } from "./pages/QRCodesPage";
import { UsersPage } from "./pages/UsersPage";
import { MediaPage } from "./pages/MediaPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { BadgesPage } from "./pages/BadgesPage";
import { DailyMissionsPage } from "./pages/DailyMissionsPage";
import {
  DevelopmentCategoriesPage,
  LearningGoalsPage,
  LearningPathsPage,
  ProgramsPage,
  SkillsPage
} from "./pages/DomainCatalogPages";

// Phase 3 pages
import { TaxonomyPage } from "./pages/TaxonomyPage";
import { ProgramsPageV2 } from "./pages/ProgramsPageV2";
import { LearningPathsPageV2 } from "./pages/LearningPathsPageV2";
import { PathBuilderPage } from "./pages/PathBuilderPage";
import { LessonsPageV2 } from "./pages/LessonsPageV2";
import { ActivityBuilderPage } from "./pages/ActivityBuilderPage";
import { NPCsPageV2 } from "./pages/NPCsPageV2";
import { ActivationCodesPage } from "./pages/ActivationCodesPage";
import { PremiumPage } from "./pages/PremiumPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/premium" element={<PremiumPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/media" element={<MediaPage />} />

        {/* Phase 3: Content Workflow */}
        <Route path="/taxonomy" element={<TaxonomyPage />} />
        <Route path="/programs-v2" element={<ProgramsPageV2 />} />
        <Route path="/learning-paths-v2" element={<LearningPathsPageV2 />} />
        <Route path="/path-builder" element={<PathBuilderPage />} />
        <Route path="/lessons-v2" element={<LessonsPageV2 />} />
        <Route path="/activity-builder" element={<ActivityBuilderPage />} />

        {/* Phase 3: Characters & Unlock */}
        <Route path="/npcs-v2" element={<NPCsPageV2 />} />
        <Route path="/activation-codes" element={<ActivationCodesPage />} />

        {/* Gamification */}
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/daily-missions" element={<DailyMissionsPage />} />
        <Route path="/progress" element={<ProgressPage />} />

        {/* Content library routes (preserved for compatibility) */}
        <Route path="/npcs" element={<NPCsPage />} />
        <Route path="/qr-codes" element={<QRCodesPage />} />
        <Route path="/development-categories" element={<DevelopmentCategoriesPage />} />
        <Route path="/learning-goals" element={<LearningGoalsPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/learning-paths" element={<LearningPathsPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/math-questions" element={<MathQuestionsPage />} />
        <Route path="/thinking-questions" element={<MathQuestionsPage />} />
        <Route path="/spelling-questions" element={<MathQuestionsPage />} />
        <Route path="/rhyme-questions" element={<MathQuestionsPage />} />
        <Route path="/dialogues" element={<DialoguesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />

        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
