import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from './layouts/AuthLayout'
import { AppLayout } from './layouts/AppLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminProtectedRoute } from './components/AdminProtectedRoute'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage'

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
        element: (
          <PlaceholderPage
            title="Interview Prep"
            description="Analyze job descriptions and generate personalized study roadmaps"
          />
        ),
      },
      {
        path: 'knowledge',
        element: (
          <PlaceholderPage
            title="Knowledge Base"
            description="Visual learning cards and AI-generated study materials"
          />
        ),
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
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
