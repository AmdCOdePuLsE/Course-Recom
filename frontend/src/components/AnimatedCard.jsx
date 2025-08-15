import { motion } from 'framer-motion'
export default function AnimatedCard({ children }){
  return (
    <motion.div whileHover={{ y:-6 }} className="rounded-xl p-6 border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 shadow-sm">
      {children}
    </motion.div>
  )
}
