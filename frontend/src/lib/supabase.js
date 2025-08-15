import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

function makeStub() {
	console.warn('Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env')
	return {
		auth: {
			getSession: async () => ({ data: { session: null }, error: null }),
			onAuthStateChange: (_cb) => ({ data: { subscription: { unsubscribe(){} } } }),
			signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
			signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
			signOut: async () => ({ error: null })
		}
	}
}

export const supabase = (url && key) ? createClient(url, key) : makeStub()
