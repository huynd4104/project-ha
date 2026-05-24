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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/children" element={<ChildrenPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/npcs" element={<NPCsPage />} />
        <Route path="/qr-codes" element={<QRCodesPage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/math-questions" element={<MathQuestionsPage />} />
        <Route path="/thinking-questions" element={<MathQuestionsPage />} />
        <Route path="/spelling-questions" element={<MathQuestionsPage />} />
        <Route path="/rhyme-questions" element={<MathQuestionsPage />} />
        <Route path="/dialogues" element={<DialoguesPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/daily-missions" element={<DailyMissionsPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
