import AuthCallback from './pages/AuthCallback';
import AdminLogin from './pages/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';

export const authRoutes = [
  { path: '/login', element: <Login /> },
  { path: '/login/admin', element: <AdminLogin /> },
  { path: '/register', element: <Register /> },
  { path: '/auth/callback', element: <AuthCallback /> },
];

export default authRoutes;
