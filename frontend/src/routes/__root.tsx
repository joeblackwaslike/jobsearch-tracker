/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'THRIVE Job Search Tracker',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('thrive-theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
