import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function useAuth(){
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub = () => {}
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session || null)
      setLoading(false)
      const sub = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
      unsub = () => sub.data.subscription.unsubscribe()
    })()
    return () => unsub()
  }, [])

  const user = session?.user || null
  return { session, user, loading }
}
