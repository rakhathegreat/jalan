import { Navigate, createBrowserRouter } from 'react-router-dom';

import { adminRoutes } from '@features/admin/routes';
import { authRoutes } from '@features/auth/routes';
import { userRoutes } from '@features/user/routes';

export const router = createBrowserRouter([
  ...authRoutes,
  ...userRoutes,
  ...adminRoutes,
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export default router;
