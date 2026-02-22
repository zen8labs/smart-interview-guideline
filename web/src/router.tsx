import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { AssessmentPage } from './pages/AssessmentPage'
import { PreparationFlowLayout } from './layouts/PreparationFlowLayout'
import { PreparationsListPage } from './pages/PreparationsListPage'
import { PreparationJdAnalysisPage } from './pages/PreparationJdAnalysisPage'
import { PreparationMemoryScanPage } from './pages/PreparationMemoryScanPage'
import { PreparationRoadmapPage } from './pages/PreparationRoadmapPage'
import { PreparationSelfCheckPage } from './pages/PreparationSelfCheckPage'
import { ContributePage } from './pages/ContributePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'
import { AdminContributionsPage } from './pages/admin/AdminContributionsPage'
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
        element: <Navigate to="/preparations" replace />,
      },
      {
        path: 'interviews/new',
        element: <Navigate to="/preparations" replace />,
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
            element: <Navigate to="jd" replace />,
          },
          {
            path: 'jd',
            element: <PreparationJdAnalysisPage />,
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
        path: 'contribute',
        element: <ContributePage />,
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
        element: <SettingsPage />,
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
        path: 'contributions',
        element: <AdminContributionsPage />,
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
