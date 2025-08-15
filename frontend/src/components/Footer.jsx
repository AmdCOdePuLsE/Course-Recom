export default function Footer(){
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} SKILL-SYNC. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Twitter</a>
          <a href="#" className="hover:text-primary">LinkedIn</a>
          <a href="#" className="hover:text-primary">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
