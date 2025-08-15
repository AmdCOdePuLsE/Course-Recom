import { useEffect } from 'react'
export default function ScrollToSection({ id }){
  useEffect(() => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior:'smooth' })
  }, [id])
  return null
}
