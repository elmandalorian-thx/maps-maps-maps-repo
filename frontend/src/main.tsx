import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('main.tsx: Starting render')

try {
  const root = document.getElementById('root')
  console.log('main.tsx: root element', root)
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    console.log('main.tsx: render called')
  }
} catch (error) {
  console.error('main.tsx: Error during render', error)
}
