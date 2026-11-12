import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
// Client distributions are deliberately offline and start with a clean local workspace.
// This prevents a customer install from connecting to the development Supabase project.
export const clientRelease = import.meta.env.VITE_CLIENT_RELEASE === 'true'

export const supabaseConfigured = !clientRelease && Boolean(supabaseUrl && supabaseKey)
export const supabase = supabaseConfigured && supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
