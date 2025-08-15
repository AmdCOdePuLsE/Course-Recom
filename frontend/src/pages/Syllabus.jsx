import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import syllabus from '../data/syllabus.json'
import DownloadPDF from '../components/DownloadPDF'

export default function Syllabus(){
  const [q, setQ] = useState('')
  const semesters = useMemo(() => Object.keys(syllabus.semesters || {}), [])

  const filtered = useMemo(() => {
    if (!q) return syllabus
    const query = q.toLowerCase()
    const res = { semesters: {} }
    semesters.forEach(sem => {
      const groups = syllabus.semesters[sem]
      const out = {}
      Object.keys(groups).forEach(g => {
        out[g] = (groups[g]||[]).filter(s => (s.name+ s.code).toLowerCase().includes(query))
      })
      res.semesters[sem] = out
    })
    return res
  }, [q, semesters])

  const Accordion = ({ title, children }) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <button onClick={()=>setOpen(!open)} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800">
          <span className="font-semibold">{title}</span>
          <span>{open? '−' : '+'}</span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{height:0}} animate={{height:'auto'}} exit={{height:0}} className="px-4">
              <div className="py-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div id="syllabus-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Syllabus</h1>
        <div className="flex gap-2 items-center">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by subject name or code" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900" />
          <DownloadPDF htmlId="syllabus-root" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {semesters.map(sem => (
          <Accordion key={sem} title={`Semester ${sem}`}>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(filtered.semesters[sem] || {}).map(([group, subjects]) => (
                <div key={group} className="rounded border border-gray-200 dark:border-gray-800 p-3">
                  <h3 className="font-semibold mb-2">{group}</h3>
                  <ul className="space-y-1 text-sm">
                    {(subjects||[]).map(s => (
                      <li key={s.code} className="flex justify-between">
                        <span>{s.name}</span>
                        <span className="text-gray-500">{s.code}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Accordion>
        ))}
      </div>
    </div>
  )
}
