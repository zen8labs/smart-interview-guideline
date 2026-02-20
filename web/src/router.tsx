import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { NewJourneyPage } from './pages/NewJourneyPage'
import { AssessmentPage } from './pages/AssessmentPage'
import { PreparationFlowLayout } from './layouts/PreparationFlowLayout'
import { PreparationsListPage } from './pages/PreparationsListPage'
import { PreparationMemoryScanPage } from './pages/PreparationMemoryScanPage'
import { PreparationRoadmapPage } from './pages/PreparationRoadmapPage'
import { PreparationSelfCheckPage } from './pages/PreparationSelfCheckPage'
import { RoadmapPage } from './pages/RoadmapPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'
import QuestionsListPage from './pages/admin/questions/QuestionsListPage'
import QuestionFormPage from './pages/admin/questions/QuestionFormPage'
import QuestionDetailPage from './pages/admin/questions/QuestionDetailPage'

export const router = createBrowserRouter([
  // Public auth routes - centered layout, no sidebar
  {
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Protected app routes - sidebar + header layout
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'interviews',
        element: <NewJourneyPage />,
      },
      {
        path: 'interviews/new',
        element: <NewJourneyPage />,
      },
      {
        path: 'assessment',
        element: <AssessmentPage />,
      },
      {
        path: 'preparations',
        element: <PreparationsListPage />,
      },
      {
        path: 'preparations/:preparationId',
        element: <PreparationFlowLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="memory-scan" replace />,
          },
          {
            path: 'memory-scan',
            element: <PreparationMemoryScanPage />,
          },
          {
            path: 'roadmap',
            element: <PreparationRoadmapPage />,
          },
          {
            path: 'self-check',
            element: <PreparationSelfCheckPage />,
          },
        ],
      },
      {
        path: 'knowledge',
        element: <RoadmapPage />,
      },
      {
        path: 'community',
        element: (
          <PlaceholderPage
            title="Community"
            description="Real interview questions from the community, anonymized and verified"
          />
        ),
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: (
          <PlaceholderPage
            title="Settings"
            description="Configure your account preferences and notifications"
          />
        ),
      },
    ],
  },

  // Admin routes - separate layout and authentication
  {
    path: 'admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: 'admin',
    element: (
      <AdminProtectedRoute>
        <AdminLayout />
      </AdminProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/users" replace />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'users/:userId',
        element: <AdminUserDetailPage />,
      },
      {
        path: 'questions',
        element: <QuestionsListPage />,
      },
      {
        path: 'questions/create',
        element: <QuestionFormPage />,
      },
      {
        path: 'questions/:id',
        element: <QuestionDetailPage />,
      },
      {
        path: 'questions/:id/edit',
        element: <QuestionFormPage />,
      },
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
