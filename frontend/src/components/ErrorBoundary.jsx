import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props){
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error }
  }
  componentDidCatch(error, info){
    console.error('UI Error:', error, info)
  }
  render(){
    if (this.state.hasError){
      return (
        <div className="p-6 max-w-xl mx-auto text-sm">
          <h1 className="text-xl font-semibold mb-2">Something went wrong.</h1>
          <pre className="whitespace-pre-wrap text-red-600">{String(this.state.error)}</pre>
          <p className="mt-3 text-gray-600 dark:text-gray-400">Try reloading the page. If it persists, check the browser console for details.</p>
        </div>
      )
    }
    return this.props.children
  }
}
