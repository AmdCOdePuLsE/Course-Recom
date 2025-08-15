import { useEffect, useState } from 'react'

export default function Counter({ end=1000, duration=1500, label }){
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(end / (duration / 16))
    const id = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(id) }
      else setCount(start)
    }, 16)
    return () => clearInterval(id)
  }, [end, duration])

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-primary">{count.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  )
}
