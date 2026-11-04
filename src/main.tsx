import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp } from 'antd'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import AlreadyOpen from './components/AlreadyOpen.tsx'
import ThemeProvider from './components/ThemeProvider.tsx'
import './styles/index.css'
import { install as installDemo, isDemo } from './services/demo.ts'
import { singleInstance } from './utils/singleInstance.ts'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

// Before the first render, so the first query already talks to the demo fleet instead of the network.
if (isDemo()) installDemo()

const root = createRoot(document.getElementById('root')!)

const render = (page: ReactNode) =>
  root.render(
    <StrictMode>
      <ThemeProvider>
        <AntApp>{page}</AntApp>
      </ThemeProvider>
    </StrictMode>,
  )

singleInstance(
  () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>,
    ),
  () => render(<AlreadyOpen />),
)
