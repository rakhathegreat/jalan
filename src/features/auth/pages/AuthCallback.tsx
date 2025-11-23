// pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@shared/services/supabase';

export default function AuthCallback() {
  const nav = useNavigate()

  useEffect(() => {
    // Wait until the session is available before redirecting.
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) nav('/main', { replace: true })
      else nav('/login', { replace: true })   // Failed state goes back to login.
    })
  }, [nav])

  return (
    <div className="grid place-content-center h-screen">
      <p>Completing sign-in...</p>
    </div>
  )
}
