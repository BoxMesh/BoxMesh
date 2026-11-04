import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Checkbox, Form, Input } from 'antd'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import { Icon } from '../../components/Icon'
import ThemeToggle from '../../components/ThemeToggle'
import { getSession, signIn } from '../../services/authService'
import LoginBackground from './LoginBackground'

interface Fields {
  email: string
  password: string
  remember: boolean
}

export default function LoginPage() {
  const navigate = useNavigate()
  // Set by the route guard: the page the visitor asked for before being sent here.
  const from = (useLocation().state as { from?: Location } | null)?.from
  const target = from ? `${from.pathname}${from.search}${from.hash}` : '/dashboard'
  const login = useMutation({
    mutationFn: ({ email, password, remember }: Fields) => signIn(email, password, remember),
    onSuccess: () => navigate(target, { replace: true }),
  })

  if (getSession()) return <Navigate to={target} replace />

  return (
    <div className="login">
      <LoginBackground />
      <header className="login-top">
        <ThemeToggle labelled />
      </header>

      <main className="login-main">
        <div className="login-brand">
          <span className="login-hub">
            <Icon name="logo" size={28} />
          </span>
          EdgePortal
        </div>
        <div className="login-card">
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in with your work email.</p>
          <Form<Fields>
            layout="vertical"
            size="large"
            requiredMark={false}
            initialValues={{ remember: false }}
            onFinish={(values) => login.mutate(values)}
          >
            {login.isError ? <Alert className="login-error" type="error" showIcon title={login.error.message} /> : null}
            <Form.Item
              name="email"
              label="Email"
              normalize={(value: string) => value.trim()}
              rules={[
                { required: true, message: 'Enter your email.' },
                { type: 'email', message: 'Enter an email address like name@company.com.' },
              ]}
            >
              <Input type="email" autoComplete="username" autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password.' }]}>
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={login.isPending}>
              Sign in
              <Icon name="arrow" />
            </Button>
          </Form>
        </div>
      </main>
    </div>
  )
}
