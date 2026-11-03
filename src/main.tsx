import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.tsx'
import AlreadyOpen from './components/AlreadyOpen.tsx'
import { appTheme } from './config/theme.ts'
import './styles/index.css'
import { singleInstance } from './utils/singleInstance.ts'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const root = createRoot(document.getElementById('root')!)

const render = (page: ReactNode) =>
  root.render(
    <StrictMode>
      <ConfigProvider theme={appTheme} tag={{ variant: 'outlined' }}>
        <AntApp>{page}</AntApp>
      </ConfigProvider>
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
