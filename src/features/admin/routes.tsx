import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import { withPageSuspense } from '@/components/page-loader';

const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Maps = lazy(() => import('./pages/Maps'));
const Analytics = lazy(() => import('./pages/Analytics'));

const adminNavigation = {
  path: '/admin',
  element: withPageSuspense(<AdminLayout />),
  children: [
    { path: 'dashboard', element: withPageSuspense(<Dashboard />) },
    { path: 'data', element: withPageSuspense(<DataManagement />) },
    { path: 'users', element: withPageSuspense(<UserManagement />) },
    { path: 'maps', element: withPageSuspense(<Maps />) },
    { path: 'analytics', element: withPageSuspense(<Analytics />) },
    { index: true, element: <Navigate to="dashboard" replace /> },
  ],
};

export const adminRoutes = [adminNavigation];

export default adminRoutes;
