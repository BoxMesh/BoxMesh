import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Divider, Form, Input } from 'antd'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import { useNotSupported } from '../../hooks/useNotSupported'
import { getSession, logIn } from '../../services/authService'
import { isDemo, startDemo } from '../../services/demo'
import LoginBackground from './LoginBackground'

interface Fields {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  // Set by the route guard: the page the visitor asked for before being sent here.
  const from = (useLocation().state as { from?: Location } | null)?.from
  const target = from ? `${from.pathname}${from.search}${from.hash}` : '/dashboard'
  const notSupported = useNotSupported()
  const login = useMutation({
    mutationFn: ({ email, password }: Fields) => logIn(email, password),
    // The demo fleet has its own hostnames, so a deep link from before the demo would not resolve in it.
    onSuccess: () => navigate(isDemo() ? '/dashboard' : target, { replace: true }),
  })

  // startDemo swaps the HTTP adapter, and that adapter answers /log-in itself, so the demo signs in
  // through the same mutation as a real visitor: no panel is reached and the password is ignored.
  const exploreDemo = () => {
    startDemo()
    login.mutate({ email: 'ops@company.com', password: 'demo' })
  }

  if (getSession()) return <Navigate to={target} replace />

  return (
    <div className="login">
      <LoginBackground />
      <div className="login-toggle">
        <ThemeToggle />
      </div>
      <main className="login-main">
        <Logo size={40} />
        <div className="login-card">
          <header className="login-head">
            <h1>Sign in</h1>
            <p>Manage all your devices in one place.</p>
          </header>

          <Form<Fields> layout="vertical" requiredMark={false} onFinish={(values) => login.mutate(values)}>
            {/* Safe to show: logIn() writes this sentence itself, so it is never axios's transport text. */}
            {login.isError ? <Alert className="login-error" type="error" showIcon title={login.error.message} /> : null}
            <Form.Item
              name="email"
              label="Email"
              normalize={(value: string) => value.trim()}
              rules={[
                { required: true, message: 'Enter your email.' },
                { type: 'email', message: 'Enter a valid email.' },
              ]}
            >
              <Input type="email" autoComplete="username" autoFocus placeholder="you@company.com" />
            </Form.Item>
            <div className="login-field">
              <div className="login-label">
                {/* A real label: the field has no antd label of its own, because the link shares its line. */}
                <label htmlFor="login-password">Password</label>
                <Button type="link" size="small" onClick={() => notSupported('Password reset')}>
                  Forgot password?
                </Button>
              </div>
              <Form.Item name="password" rules={[{ required: true, message: 'Enter your password.' }]}>
                <Input.Password id="login-password" autoComplete="current-password" placeholder="••••••••" />
              </Form.Item>
            </div>
            <Button type="primary" htmlType="submit" block loading={login.isPending}>
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>

          <Divider plain>or</Divider>

          {/* The canvas's secondary slot (company SSO there); BoxMesh has no SSO, so the demo takes it. */}
          <Button block onClick={exploreDemo}>
            Explore the demo
          </Button>
        </div>
      </main>
    </div>
  )
}
