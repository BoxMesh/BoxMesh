import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { App, Button, Form, Input, Modal } from 'antd'
import { t } from '../i18n'
import { getSession, updateAccount } from '../services/authService'
import { RoleName } from '../pages/users/Access'
import { MAX_NAME, MIN_PASSWORD } from '../utils/account'

interface Values {
  name: string
  currentPassword?: string
  password?: string
  confirm?: string
}

/** The signed-in person edits their own name and password; the Admin is not involved. */
export default function AccountModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { message } = App.useApp()
  const [form] = Form.useForm<Values>()

  const save = useMutation({
    mutationFn: updateAccount,
    onSuccess: () => {
      onSaved()
      onClose()
      message.success(t('Your account was updated.'))
    },
    onError: (error) => {
      // The server answers 400 with the reason; a wrong current password belongs under its own field.
      const reason = isAxiosError(error) ? String(error.response?.data?.error ?? '') : ''
      if (reason.includes('current password')) {
        form.setFields([{ name: 'currentPassword', errors: [t('The current password is wrong.')] }])
      } else {
        message.error(error.message)
      }
    },
  })

  const submit = ({ name, currentPassword, password }: Values) => {
    const newName = name.trim()
    const changeName = newName !== getSession()?.name
    if (!changeName && !password) return onClose()
    save.mutate({
      ...(changeName ? { name: newName } : {}),
      ...(password ? { currentPassword, password } : {}),
    })
  }

  const session = getSession()

  return (
    <Modal title={t('My account')} open={open} onCancel={onClose} width={560} destroyOnHidden footer={null} afterOpenChange={(shown) => shown && form.resetFields()}>
      <Form form={form} className="dialog-form" layout="vertical" requiredMark={false} initialValues={{ name: session?.name }} onFinish={submit}>
        <section className="form-section">
          <h3>{t('Profile')}</h3>
          <p className="section-hint">{t('Your email and role are set by the Admin.')}</p>
          <div className="kv">
            <Form.Item label={t('Email')}>
              <Input value={session?.email} disabled />
            </Form.Item>
            <Form.Item label={t('Role')}>
              <Input value={session ? RoleName({ role: session.role }) : ''} disabled />
            </Form.Item>
          </div>
          <Form.Item
            name="name"
            label={t('Name')}
            rules={[
              { required: true, whitespace: true, message: t('Enter your name.') },
              { max: MAX_NAME, message: t('Keep the name to {max} characters or fewer.', { max: MAX_NAME }) },
            ]}
          >
            <Input autoComplete="name" />
          </Form.Item>
        </section>

        <section className="form-section">
          <h3>{t('Password')}</h3>
          <p className="section-hint">{t('Leave these empty to keep your current password.')}</p>
          <Form.Item
            name="currentPassword"
            label={t('Current password')}
            dependencies={['password']}
            rules={[({ getFieldValue }) => ({ required: Boolean(getFieldValue('password')), message: t('Enter your current password.') })]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <div className="kv">
            <Form.Item
              name="password"
              label={t('New password')}
              rules={[{ min: MIN_PASSWORD, message: t('The password needs at least {min} characters.', { min: MIN_PASSWORD }) }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirm"
              label={t('Confirm new password')}
              dependencies={['password']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, value?: string) =>
                    (value ?? '') === (getFieldValue('password') ?? '') ? Promise.resolve() : Promise.reject(new Error(t('The passwords do not match.'))),
                }),
              ]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
          </div>
        </section>

        <div className="dialog-footer">
          <span className="dialog-buttons">
            <Button onClick={onClose}>{t('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={save.isPending}>
              {t('Save changes')}
            </Button>
          </span>
        </div>
      </Form>
    </Modal>
  )
}
