import { useMutation } from '@tanstack/react-query'
import { Alert, Button, Checkbox, Divider, Form, Input } from 'antd'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import { Icon } from '../../components/Icon'
import { useThemeSwitch } from '../../hooks/useThemeMode'
import { getSession, signIn, signInDemo } from '../../services/authService'
import { startDemo } from '../../services/demo'
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
  const { switchProps } = useThemeSwitch()
  const login = useMutation({
    mutationFn: ({ email, password, remember }: Fields) => signIn(email, password, remember),
    onSuccess: () => navigate(target, { replace: true }),
  })

  // No request and no password: the demo swaps the HTTP layer for a sample fleet held in this tab.
  const exploreDemo = () => {
    startDemo()
    signInDemo()
    navigate('/dashboard', { replace: true })
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
            initialValues={{ remember: false }}
            onFinish={(values) => login.mutate(values)}
          >
            {/* Safe to show: signIn() writes this sentence itself, so it is never axios's transport text. */}
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
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Remember me</Checkbox>
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
