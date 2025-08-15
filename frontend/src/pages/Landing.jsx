import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Counter from '../components/Counter'
import AnimatedGradient from '../components/AnimatedGradient'
import AnimatedCard from '../components/AnimatedCard'

export default function Landing(){
  return (
    <div>
      <section className="relative overflow-hidden">
        <AnimatedGradient />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <motion.h1
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight"
          >
            SKILL-SYNC – AI-Powered Course Recommendations & Academic Insights
          </motion.h1>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
            Personalize learning paths, predict performance, and support students with actionable analytics.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/recommendations" className="px-5 py-3 rounded bg-primary text-white hover:bg-primary-dark">Get Recommendations</Link>
            <Link to="/syllabus" className="px-5 py-3 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">View Syllabus</Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-4">
            <Counter end={12500} label="Students Helped" />
            <Counter end={48200} label="Courses Recommended" />
            <Counter end={3100} label="Alerts Sent" />
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          {[
            { title:'Hybrid AI Model', desc:'Combines performance and interests for tailored suggestions.' },
            { title:'Explainability', desc:'Transparent reasons powered by SHAP/LIME.' },
            { title:'Real-Time Monitoring', desc:'Track progress, risks, and outcomes.' },
          ].map((c) => (
            <AnimatedCard key={c.title}>
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{c.desc}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Login or create an account to access personalized recommendations and analytics.</p>
          <Link to="/login" className="px-5 py-3 rounded bg-primary text-white hover:bg-primary-dark">Login & Get Started</Link>
        </div>
      </section>
    </div>
  )
}
