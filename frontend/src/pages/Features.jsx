import { motion } from 'framer-motion'

const cards = [
  { icon:'🧠', title: 'Hybrid AI Model', desc: 'Combines ML with rules and interest graphs.' },
  { icon:'🔍', title: 'Explainability & Transparency', desc: 'Reasons surfaced with SHAP/LIME.' },
  { icon:'📈', title: 'Real-Time Performance Monitoring', desc: 'Track and get alerts on changes.' },
  { icon:'📊', title: 'Faculty & Admin Insights', desc: 'Dashboards with trends and exports.' },
  { icon:'⚠️', title: 'At-Risk Student Alert System', desc: 'Identify and act early to support students.' },
]

export default function Features(){
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-6">Features</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(c => (
          <motion.div key={c.title} whileHover={{ scale: 1.02 }} className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-sm">
            <div className="text-2xl">{c.icon}</div>
            <h3 className="font-semibold mt-2">{c.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{c.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
