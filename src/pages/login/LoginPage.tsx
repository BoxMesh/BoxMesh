import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Divider, Form, Input } from 'antd'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import { Icon } from '../../components/Icon'
import { useThemeSwitch } from '../../hooks/useThemeMode'
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
  const { switchProps } = useThemeSwitch()
  const login = useMutation({
    mutationFn: ({ email, password }: Fields) => logIn(email, password),
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
      <main className="login-main">
        <div className="login-card">
          <h1 className="login-brand">
            {/* The mark itself is the theme switch, so the page keeps "BoxMesh" as its heading text. */}
            <button className="login-hub" {...switchProps}>
              <Icon name="logo" size={22} />
            </button>
            BoxMesh
          </h1>
          <Form<Fields>
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => login.mutate(values)}
          >
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
              <Input type="email" autoComplete="username" autoFocus prefix={<Icon name="mail" />} />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password.' }]}>
              <Input.Password autoComplete="current-password" prefix={<Icon name="lock" />} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={login.isPending}>
              Sign in
              <Icon name="arrow" />
            </Button>
            <Divider plain>or</Divider>
            <Button block onClick={exploreDemo}>
              Explore the demo
            </Button>
          </Form>
        </div>
      </main>
    </div>
  )
}
