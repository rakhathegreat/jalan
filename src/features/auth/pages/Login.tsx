import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginForm } from '@/components/login-form';
import { getUserRole } from '../utils/getUserRole';

export default function Login() {
  const nav = useNavigate()

  const redirectByRole = useCallback(async (userId: string) => {
    try {
      const role = await getUserRole(userId)

      if (role === "admin") {
        nav("/admin/dashboard")
      } else {
        nav("/reports/history")
      }
    } catch (error) {
      console.error("Failed to fetch role:", error)
      nav("/reports/history")
    }
  }, [nav])

  return (
    <div className="flex items-center justify-center h-dvh">
      <LoginForm
        onLoginSuccess={redirectByRole}
        onSessionActive={redirectByRole}
      />
    </div>
  )
}
