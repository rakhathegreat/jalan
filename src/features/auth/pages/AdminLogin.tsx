import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import {  useNavigate } from 'react-router-dom';

import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import { supabase } from '@shared/services/supabase';

import heroImage from '@assets/Register/2.jpg';
import { Clover, QrCode, TreePine } from 'lucide-react';

export default function AdminLogin() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const redirectByRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Failed to fetch role:", error.message)
      nav("/main") // fallback
      return
    }

    if (data?.role === "admin") {
      nav("/admin/dashboard")
    } else {
      nav("/main")
    }
  }, [nav])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    if (data?.user) {
      await redirectByRole(data.user.id)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        redirectByRole(session.user.id)
      }
    })
  }, [redirectByRole])

  return (
    <main className="min-h-screen bg-brand-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* FORM SIDE */}
        <section className="flex items-center justify-center bg-geist-50 px-6 py-12 sm:px-10 lg:px-14">
          <div className="w-full max-w-md space-y-5 lg:space-y-4">
            <div className="space-y-4 lg:space-y-3">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-medium tracking-tight text-brand-800">Admin Dashboard</h1>
                <p className="text-base text-gray-600">
                  Sign in to have access to the admin dashboard.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <Input
                id="admin-email"
                label="Admin Email"
                type="email"
                placeholder="admin@qrpohon.id"
                value={email}
                onValueChange={setEmail}
              />
              <div className="flex flex-col gap-3">
                <Input
                  id="admin-password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onValueChange={setPassword}
                />
              </div>

              <Button type="submit" disabled={loading} size="full" className="text-[16px] font-normal active:scale-[0.98]">
                {loading ? 'Processing...' : 'Sign in'}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                or
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={async () =>
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/auth/callback` }
                  })
                }
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white py-3 text-[16px] font-normal text-gray-900 hover:border-brand-200 hover:bg-brand-50 hover:cursor-pointer"
                aria-label="Sign in with Google (Admin)"
              >
                <FcGoogle className="text-2xl" />
                Sign in with Google
              </button>
            </div>
          </div>
        </section>

        {/* BRAND SIDE */}
        <section className="hidden relative lg:flex items-center justify-center overflow-hidden bg-brand-700 px-8 py-12 text-white">
          <img
            src={heroImage}
            alt="Tree canopy"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 opacity-95" />
          <div className="relative z-10 w-full max-w-xl space-y-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/70">Admin Monitoring</p>
              <h2 className="mt-3 text-4xl font-semibold leading-snug">
                Validate field reports, track growth trends, and ensure every tree is accounted for.
              </h2>
              <p className="mt-4 text-base text-white/80">
                The admin dashboard unifies QR scans, maintenance tasks, and tree health status—everything you need in one view.
              </p>
            </div>

            <div className="flex flex-row gap-4">
              <QrCode strokeWidth={2} size={23} />
              <Clover strokeWidth={2} size={23} />
              <TreePine strokeWidth={2} size={23} />
            </div>
          </div>
        </section>
      </div>
    </main>

  )
}
