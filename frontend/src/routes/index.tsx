import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">THRIVE Job Search Tracker</CardTitle>
          <CardDescription>
            Welcome to the THRIVE job search tracker.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Your job search companion — track applications, interviews, and more.
          </p>
          <div className="flex gap-2">
            <Badge>Tailwind CSS</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
            <Badge variant="outline">TanStack Start</Badge>
          </div>
          <Button className="w-full">Get Started</Button>
        </CardContent>
      </Card>
    </div>
  )
}
