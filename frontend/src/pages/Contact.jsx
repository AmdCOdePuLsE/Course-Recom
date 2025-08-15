import axios from 'axios'
import { useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export default function Contact(){
  const [form, setForm] = useState({ name:'', email:'', message:'' })
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    try { await axios.post(`${API}/api/contact`, form); setSent(true); setForm({ name:'', email:'', message:'' }) } catch {}
  }
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-4">Contact</h1>
      {sent && <div className="mb-4 p-3 rounded bg-green-50 text-green-700">Message sent!</div>}
      <form onSubmit={submit} className="space-y-3">
        <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Name" className="w-full px-3 py-2 rounded border" required />
        <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" type="email" className="w-full px-3 py-2 rounded border" required />
        <textarea value={form.message} onChange={e=>setForm({...form, message:e.target.value})} placeholder="Message" rows="5" className="w-full px-3 py-2 rounded border" required />
        <button className="px-5 py-3 rounded bg-primary text-white">Send</button>
      </form>
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>Dept. of Computer Science</p>
        <p>123 University Road, City</p>
        <p>Email: csdept@example.edu</p>
      </div>
    </div>
  )
}
