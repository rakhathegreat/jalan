import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import { withPageSuspense } from '@/components/page-loader';

const ReportHistory = lazy(() => import('./pages/ReportHistory'));
const NewReport = lazy(() => import('./pages/NewReport'));

const historyRedirect = <Navigate to="/reports/history" replace />;

export const userRoutes = [
  { path: '/reports/history', element: withPageSuspense(<ReportHistory />) },
  { path: '/main', element: historyRedirect },
  { path: '/profile', element: historyRedirect },
  { path: '/reports/new', element: withPageSuspense(<NewReport />) },
  { path: '/detail/:id', element: historyRedirect },
  { path: '/scan', element: historyRedirect },
  { path: '/scan/history', element: historyRedirect },
];

export default userRoutes;
