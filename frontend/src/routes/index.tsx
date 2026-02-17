import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>THRIVE Job Search Tracker</h1>
      <p>Welcome to the THRIVE job search tracker.</p>
    </div>
  )
}
