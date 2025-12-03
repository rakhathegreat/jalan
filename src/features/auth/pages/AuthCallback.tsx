// pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@shared/services/supabase';
import { getUserRole } from '../utils/getUserRole';

export default function AuthCallback() {
  const nav = useNavigate()

  useEffect(() => {
    // Wait until the session is available before redirecting.
    const redirectAfterOAuth = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) {
        nav('/login', { replace: true })   // Failed state goes back to login.
        return
      }

      try {
        const role = await getUserRole(data.user.id)
        if (role === 'admin') nav('/admin/dashboard', { replace: true })
        else nav('/reports/history', { replace: true })
      } catch (roleError) {
        console.error('Failed to fetch role:', roleError)
        nav('/reports/history', { replace: true })
      }
    }

    redirectAfterOAuth()
  }, [nav])

  return (
    <div className="grid place-content-center h-screen">
      <p>Completing sign-in...</p>
    </div>
  )
}
