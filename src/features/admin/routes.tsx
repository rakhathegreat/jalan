import { Navigate } from 'react-router-dom';

import AdminLayout from './components/AdminLayout';
import AddTree from './pages/AddTree';
import AddClassification from './pages/AddClassification';
import Analytics from './pages/Analytics';
import AntiCheat from './pages/AntiCheat';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import EditTree from './pages/EditTree';
import Maps from './pages/Maps';
import Moderation from './pages/Moderation';
import UserManagement from './pages/UserManagement';

const adminNavigation = {
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'users', element: <UserManagement /> },
    { path: 'maps', element: <Maps /> },
    { path: 'anti-cheat', element: <AntiCheat /> },
    { path: 'moderation', element: <Moderation /> },
    { path: 'analytics', element: <Analytics /> },
    { path: 'audit-log', element: <AuditLog /> },
    { path: 'add', element: <AddTree /> },
    { path: 'classification/add', element: <AddClassification /> },
    { path: 'edit/:id', element: <EditTree /> },
    { index: true, element: <Navigate to="dashboard" replace /> },
  ],
};

export const adminRoutes = [adminNavigation];

export default adminRoutes;
