import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { QuizProvider } from './context/QuizContext';
import { Layout } from './components/layout';
import { PageLoading } from './components/common';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const QuizzesPage = React.lazy(() => import('./pages/quiz/QuizzesPage'));
const QuizDetailsPage = React.lazy(() => import('./pages/quiz/QuizDetailsPage'));
const CreateQuizPage = React.lazy(() => import('./pages/quiz/CreateQuizPage'));
const TakeQuizPage = React.lazy(() => import('./pages/quiz/TakeQuizPage'));
const SubmissionsPage = React.lazy(() => import('./pages/submission/SubmissionsPage'));
const SubmissionDetailsPage = React.lazy(() => import('./pages/submission/SubmissionDetailsPage'));
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage'));
const CompetitionsPage = React.lazy(() => import('./pages/competition/CompetitionsPage'));
const AnnouncementsPage = React.lazy(() => import('./pages/announcement/AnnouncementsPage'));
const MessagesPage = React.lazy(() => import('./pages/message/MessagesPage'));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminAnalyticsPage = React.lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage'));
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));

// Loading fallback component
const SuspenseFallback = () => <PageLoading text="Loading page..." />;

function App() {
  // ...existing code...
  const AuthSuccessPage = React.lazy(() => import('./pages/auth/AuthSuccessPage'));
  return (
    <AuthProvider>
      <QuizProvider>
        <Router>
          <div className="App">
            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  }
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  }
                }
              }}
            />
            <React.Suspense fallback={<SuspenseFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/auth/success" element={<AuthSuccessPage />} />
                {/* Protected routes wrapped in Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="quizzes" element={<ProtectedRoute><QuizzesPage /></ProtectedRoute>} />
                  <Route path="quiz/:id" element={<ProtectedRoute><QuizDetailsPage /></ProtectedRoute>} />
                  <Route path="quiz/create" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><CreateQuizPage /></ProtectedRoute>} />
                  <Route path="quiz/:id/edit" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><CreateQuizPage /></ProtectedRoute>} />
                  <Route path="quiz/:id/take" element={<ProtectedRoute allowedRoles={["student"]}><TakeQuizPage /></ProtectedRoute>} />
                  <Route path="submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
                  <Route path="submission/:id" element={<ProtectedRoute><SubmissionDetailsPage /></ProtectedRoute>} />
                  <Route path="analytics" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><AnalyticsPage /></ProtectedRoute>} />
                  <Route path="competitions" element={<ProtectedRoute><CompetitionsPage /></ProtectedRoute>} />
                  <Route path="announcements" element={<ProtectedRoute allowedRoles={["teacher", "admin"]}><AnnouncementsPage /></ProtectedRoute>} />
                  <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />
                  <Route path="admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalyticsPage /></ProtectedRoute>} />
                  <Route path="admin/quizzes" element={<ProtectedRoute allowedRoles={["admin"]}><QuizzesPage /></ProtectedRoute>} />
                  <Route path="admin/competitions" element={<ProtectedRoute allowedRoles={["admin"]}><CompetitionsPage /></ProtectedRoute>} />
                  <Route path="admin/announcements" element={<ProtectedRoute allowedRoles={["admin"]}><AnnouncementsPage /></ProtectedRoute>} />
                  <Route path="admin/messages" element={<ProtectedRoute allowedRoles={["admin"]}><MessagesPage /></ProtectedRoute>} />
                  <Route path="admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettingsPage /></ProtectedRoute>} />
                  {/* 404 route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </React.Suspense>
          </div>
        </Router>
      </QuizProvider>
    </AuthProvider>
  );
}

export default App;
