import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LockKeyhole, LogIn } from 'lucide-react'
import { logoUrl } from '../assets/brand'
import { supabase, supabaseConfigured } from '../lib/supabase'
import '../styles/auth.css'

/**
 * Shop-only sign-in for cloud-connected deployments.
 * Desktop distributions configured without a cloud stay in local mode.
 * Database authorization must ALSO be enforced using RLS. This UI is
 * not a substitute for the server-side membership policies.
 */
export function WorkspaceAuth({ children }: { children: ReactNode }) {
 const [loading, setLoading] = useState(supabaseConfigured)
 const [session, setSession] = useState<Session | null>(null)
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [busy, setBusy] = useState(false)
 const [error, setError] = useState('')
 const [authorization, setAuthorization] = useState<{ userId: string; allowed: boolean; error: string } | null>(null)

 useEffect(() => {
  if (!supabaseConfigured || !supabase) return
  let active = true
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, current) => {
   if (active) { setAuthorization(null); setSession(current) }
  })
  void supabase.auth.getSession().then(({ data, error: authError }) => {
   if (!active) return
   if (authError) setError(authError.message)
   setSession(data.session)
  }).catch(cause => {
   if (active) setError(cause instanceof Error ? cause.message : 'Unable to check sign-in')
  }).finally(() => { if (active) setLoading(false) })
  return () => { active = false; subscription.unsubscribe() }
 }, [])

 useEffect(() => {
  if (!supabaseConfigured || !supabase || !session?.user.id) return
  const userId = session.user.id
  let active = true
  // Fail closed: the app is accessible only to verified shop members.
  // The RPC is defined by the preparation migration and protected by RLS.
  void supabase.rpc('vt_has_workspace_access').then(({ data, error: accessError }) => {
   if (!active) return
   setAuthorization({
    userId,
    allowed: !accessError && data === true,
    error: accessError ? 'Workspace authorization has not been configured or is unavailable. Contact the shop administrator.' : data === true ? '' : 'This account is not a member of the Vinay Traders workspace.',
   })
  }).catch(() => {
   if (active) setAuthorization({ userId, allowed: false, error: 'Unable to verify workspace membership.' })
  })
  return () => { active = false }
 }, [session?.user.id])

 async function signIn(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (!supabase) return
  setBusy(true)
  setError('')
  try {
   const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
   if (signInError) throw signInError
   setPassword('')
  } catch (cause) {
   setError(cause instanceof Error ? cause.message : 'Unable to sign in')
  } finally {
   setBusy(false)
  }
 }

 if (!supabaseConfigured) return <>{children}</>
 if (loading) return <main className="vt-auth-screen"><div className="vt-auth-card" role="status"><p>Checking secure workspace access…</p></div></main>
 if (session && authorization?.userId !== session.user.id) return <main className="vt-auth-screen"><div className="vt-auth-card" role="status"><p>Verifying shop membership…</p></div></main>
 if (session && authorization?.allowed) return <>{children}</>
 if (session) return <main className="vt-auth-screen"><div className="vt-auth-card">
  <div className="vt-auth-brand"><img src={logoUrl} alt="Vinay Traders"/><div><h1>VINAY TRADERS</h1><p>Hardware & Plumbing Supplies</p></div></div>
  <div className="vt-auth-heading"><LockKeyhole size={24} aria-hidden="true"/><h2>Workspace access restricted</h2></div>
  <p className="vt-auth-error" role="alert">{authorization?.error || 'Your account is not authorized.'}</p>
  <button className="vt-auth-submit" type="button" onClick={() => void supabase?.auth.signOut()}>Sign out</button>
 </div></main>

 return <main className="vt-auth-screen">
  <div className="vt-auth-card">
   <div className="vt-auth-brand">
    <img src={logoUrl} alt="Vinay Traders" />
    <div><h1>VINAY TRADERS</h1><p>Hardware & Plumbing Supplies</p></div>
   </div>
   <div className="vt-auth-heading"><LockKeyhole size={24} aria-hidden="true"/><h2>Shop workspace sign-in</h2></div>
   <p className="vt-auth-description">Sign in with your authorized shop account to access purchases, billing, customers and stock records.</p>
   <form onSubmit={event => void signIn(event)}>
    <label htmlFor="vt-login-email">Email address</label>
    <input id="vt-login-email" name="email" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
    <label htmlFor="vt-login-password">Password</label>
    <input id="vt-login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
    {error && <p className="vt-auth-error" role="alert">{error}</p>}
    <button className="vt-auth-submit" type="submit" disabled={busy}><LogIn size={17} aria-hidden="true"/>{busy ? 'Signing in…' : 'Sign in securely'}</button>
   </form>
   <p className="vt-auth-footnote">Account access is controlled by the shop administrator. Contact your administrator if you need an account.</p>
  </div>
 </main>
}
