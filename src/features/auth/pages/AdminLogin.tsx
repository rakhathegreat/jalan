import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginForm } from '@/components/login-form';
import { getUserRole } from '../utils/getUserRole';

export default function AdminLogin() {
  const nav = useNavigate()

  const redirectAdminOnly = useCallback(async (userId: string) => {
    try {
      const role = await getUserRole(userId)
      if (role !== "admin") {
        throw new Error("Akun ini bukan admin.")
      }

      nav("/admin/dashboard")
    } catch (error) {
      console.error("Failed to fetch role:", error)
      const message = error instanceof Error ? error.message : "Gagal memuat peran admin. Coba lagi."
      throw new Error(message)
    }
  }, [nav])

  return (
    <div className="flex items-center justify-center h-dvh">
      <LoginForm
        onLoginSuccess={redirectAdminOnly}
        onSessionActive={redirectAdminOnly}
        title="Admin login"
        description="Masuk dengan akun admin untuk mengakses dashboard"
        showRegisterLink={false}
      />
    </div>
  )
}
