import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Divider, Form, Input } from 'antd'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'
import { getSession, logIn, requestPasswordReset } from '../../services/authService'
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
  const [form] = Form.useForm<Fields>()
  // "Forgot password?" turns the same form into the reset request: the email the visitor typed stays put.
  const [resetting, setResetting] = useState(false)
  const login = useMutation({
    mutationFn: ({ email, password }: Fields) => logIn(email, password),
    // The demo fleet has its own hostnames, so a deep link from before the demo would not resolve in it.
    onSuccess: () => navigate(isDemo() ? '/dashboard' : target, { replace: true }),
  })
  const reset = useMutation({ mutationFn: requestPasswordReset })
  const pending = resetting ? reset : login

  const switchTo = (next: boolean) => {
    setResetting(next)
    login.reset()
    reset.reset()
    form.focusField('email')
  }

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
          {/* Keyed so the new heading fades in instead of the text just snapping. */}
          <header className="login-head" key={String(resetting)}>
            <h1>{resetting ? 'Reset password' : 'Sign in'}</h1>
            <p>
              {resetting
                ? 'Enter your email and we’ll send you a link to reset your password.'
                : 'Manage all your devices in one place.'}
            </p>
          </header>

          <Form<Fields>
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => (resetting ? reset.mutate(values.email) : login.mutate(values))}
          >
            {/* Safe to show: logIn() and requestPasswordReset() write these sentences themselves. */}
            {pending.isError ? <Alert className="login-error" type="error" showIcon title={pending.error.message} /> : null}
            {resetting && reset.isSuccess ? (
              <Alert
                className="login-error"
                type="success"
                showIcon
                title="Check your inbox"
                description={`If an account exists for ${reset.variables}, a reset link is on its way.`}
              />
            ) : null}
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
            {/* inert: the folded field is out of the tab order and hidden from screen readers. */}
            <div className={`login-fold${resetting ? ' is-folded' : ''}`} inert={resetting}>
              <div className="login-field">
                <div className="login-label">
                  {/* A real label: the field has no antd label of its own, because the link shares its line. */}
                  <label htmlFor="login-password">Password</label>
                  <Button type="link" size="small" onClick={() => switchTo(true)}>
                    Forgot password?
                  </Button>
                </div>
                <Form.Item name="password" rules={resetting ? [] : [{ required: true, message: 'Enter your password.' }]}>
                  <Input.Password id="login-password" autoComplete="current-password" placeholder="••••••••" />
                </Form.Item>
              </div>
            </div>
            <Button type="primary" htmlType="submit" block loading={pending.isPending}>
              {resetting
                ? reset.isPending
                  ? 'Sending…'
                  : reset.isSuccess
                    ? 'Send again'
                    : 'Send reset link'
                : login.isPending
                  ? 'Signing in…'
                  : 'Sign in'}
            </Button>
            <div className={`login-fold${resetting ? '' : ' is-folded'}`} inert={!resetting}>
              <div>
                <Button type="link" block onClick={() => switchTo(false)}>
                  Back to sign in
                </Button>
              </div>
            </div>
          </Form>

          {/* The canvas's secondary slot (company SSO there); BoxMesh has no SSO, so the demo takes it. */}
          <div className={`login-fold${resetting ? ' is-folded' : ''}`} inert={resetting}>
            <div className="login-alt">
              <Divider plain>or</Divider>
              <Button block onClick={exploreDemo}>
                Explore the demo
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
