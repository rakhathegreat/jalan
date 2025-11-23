import { type FormEvent, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';

import Input from '@shared/components/Input';
import Button from '@shared/components/Button';
import { supabase } from '@shared/services/supabase';

import { ArrowLeft } from 'lucide-react';

export default function Register() {
  const nav = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password || password !== confirmPassword) {
      alert('Password confirmation must match.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || undefined },
        emailRedirectTo: `${window.location.origin}/login`
      }
    })
    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Registration successful! Please check your email for verification.')
    nav('/login')
  }

  return (
    <main className="min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-2">

        <section className="hidden items-center justify-center bg-geist-50 p-4 lg:flex">
          <div className="relative flex flex-col justify-center p-10 h-full w-full rounded-xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600">
            {/* <img src={heroImage} alt="" className='w-full h-full object-cover rounded-lg'/> */}

            <div className="absolute top-5 left-5">
              <button
                type="button"
                className="group text-sm inline-flex items-center gap-2 rounded-lg px-4 py-2
                          bg-white/10 text-white
                          border border-white/20
                          backdrop-blur-md shadow-md shadow-black/10
                          transition-all duration-200
                          hover:bg-white/15 hover:border-white/30 hover:cursor-pointer
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                         "
                aria-label="Back to login page"
                onClick={() => nav('/login')}
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                Back to login page
              </button>
            </div>

            <div className='text-white'>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/70">What Are You Waiting For?</p>
                <h2 className="mt-3 text-4xl font-semibold leading-snug">
                  Sign Up Now and 
                </h2>
                <h2 className="text-4xl font-semibold leading-snug">
                  Start Your Discovery.
                </h2>
                <p className="mt-4 text-base text-white/80">
                  Register today and turn every walk into an engaging learning session!
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FORM SIDE */}
        <section className="flex items-center justify-center bg-geist-50 py-8 px-6 sm:px-10">
          <div className="w-full max-w-xl space-y-5 lg:space-y-4">
            <div className="space-y-4 lg:space-y-3 mb-10">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-medium tracking-tight text-brand-800">Create Your Account</h1>
                <p></p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <Input
                id="register-name"
                label="Full name"
                placeholder="Enter your full name"
                value={fullName}
                onValueChange={setFullName}
              />
              <Input
                id="register-email"
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onValueChange={setEmail}
              />
              <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                  id="register-password"
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onValueChange={setPassword}
                />
                <Input
                  id="register-confirm-password"
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                />
              </div>

              <Button type="submit" disabled={loading} size="full" className='text-[16px] font-normal'>
                {loading ? 'Processing...' : 'Sign up'}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                Or
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
                aria-label="Sign up with Google"
              >
                <FcGoogle className="text-2xl" />
                Sign up with Google
              </button>
            </div>

            <div className="flex justify-center lg:hidden">
              <div className="rounded-2xl py-2 text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-700 hover:underline">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BRAND SIDE */}
        {/* <section className="hidden relative lg:flex items-center justify-center overflow-hidden bg-brand-700 px-8 py-12 text-white">
          <img
            src={heroImage}
            alt="Kanopi pohon"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 opacity-95" />
          <div className="relative z-10 w-full max-w-xl space-y-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/70">Grow Together</p>
              <h2 className="mt-3 text-4xl font-semibold leading-snug">
                Help map every tree, capture their stories, and keep cities green.
              </h2>
              <p className="mt-4 text-base text-white/80">
                Every new account means another pair of eyes protecting urban forests through QR Pohon.
              </p>
            </div>

            <div className='flex flex-row gap-4'>
              <QrCode strokeWidth={2} size={23} />
              <Clover strokeWidth={2} size={23} />
              <TreePine strokeWidth={2} size={23} />
            </div>
          </div>
        </section> */}
      </div>
    </main>
  )
}
