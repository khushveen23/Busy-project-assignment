'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Library, Lock, Mail, User, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'MEMBER' | 'LIBRARIAN'>('MEMBER')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isRegister) {
      // Registration flow
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to register account.')
          setLoading(false)
          return
        }

        setSuccess('Account created successfully! Signing in...')

        // Auto sign-in after registration
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        setLoading(false)

        if (signInResult?.error) {
          setError('Account created, but sign-in failed. Please sign in manually.')
          setIsRegister(false)
        } else {
          router.push('/dashboard')
          router.refresh()
        }
      } catch {
        setError('An unexpected error occurred during registration.')
        setLoading(false)
      }
    } else {
      // Sign in flow
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      setLoading(false)

      if (result?.error) {
        setError('Invalid email or password.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
  }

  function toggleMode(registerMode: boolean) {
    setIsRegister(registerMode)
    setError('')
    setSuccess('')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 ring-1 ring-primary/30 mb-4">
            <Library className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Asset Lending</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRegister ? 'Create a new account to borrow or manage equipment' : 'Sign in to access library assets & loans'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl mb-6 border border-border/50">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !isRegister
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                isRegister
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {isRegister && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 text-sm"
                    required={isRegister}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-sm"
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <label htmlFor="role" className="text-xs font-medium">Account Role</label>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'MEMBER' | 'LIBRARIAN')}
                >
                  <option value="MEMBER">Member (Request & Borrow Items)</option>
                  <option value="LIBRARIAN">Librarian (Manage Catalogue, Issue Loans & Custodianship)</option>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              {loading
                ? (isRegister ? 'Creating Account…' : 'Signing in…')
                : (isRegister ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium mb-2.5">Quick Demo Login</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { role: 'Librarian', email: 'librarian@library.dev', pass: 'librarian123' },
                  { role: 'Member', email: 'member@library.dev', pass: 'member123' },
                ].map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => { setEmail(cred.email); setPassword(cred.pass) }}
                    className="text-left p-2 rounded-lg bg-muted/40 hover:bg-muted text-xs transition-colors border border-border/40"
                  >
                    <div className="font-semibold text-foreground">{cred.role}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{cred.email}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
