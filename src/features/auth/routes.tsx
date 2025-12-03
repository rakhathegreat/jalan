import { lazy } from 'react';

import { withPageSuspense } from '@/components/page-loader';

const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

export const authRoutes = [
  { path: '/login', element: withPageSuspense(<Login />) },
  { path: '/login/admin', element: withPageSuspense(<AdminLogin />) },
  { path: '/register', element: withPageSuspense(<Register />) },
  { path: '/auth/callback', element: withPageSuspense(<AuthCallback />) },
];

export default authRoutes;
