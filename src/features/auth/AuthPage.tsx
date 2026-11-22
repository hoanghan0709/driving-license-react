import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { httpStatus, isAuthApiUnavailable, login, registerAccount } from './auth-api'
import { startSession } from './auth-session'
import './auth.css'

const passwordSchema = z.string().refine(
  (value) => Array.from(value).length >= 8 && new TextEncoder().encode(value).length <= 72,
  'Nhập mật khẩu từ 8 ký tự và tối đa 72 byte.',
)

const credentialsSchema = z.object({
  email: z.string().trim().max(255, 'Email dài tối đa 255 ký tự.').pipe(z.email('Nhập địa chỉ email hợp lệ.')),
  password: passwordSchema,
})

const nameSchema = z.string().trim().refine((value) => {
  const length = Array.from(value).length
  return length >= 2 && length <= 100
}, 'Nhập họ và tên từ 2 đến 100 ký tự.')

const registrationSchema = credentialsSchema.extend({ name: nameSchema.prefault('') })
const loginSchema = credentialsSchema.extend({ name: z.string().default('') })
type FormInput = z.input<typeof registrationSchema>
type FormFields = z.infer<typeof registrationSchema>

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const creating = mode === 'register'
  const title = creating ? 'Đăng ký' : 'Đăng nhập'
  const navigate = useNavigate()
  const { state } = useLocation()
  const pending = useRef<AbortController | null>(null)
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<FormInput, unknown, FormFields>({
    resolver: zodResolver(creating ? registrationSchema : loginSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  useEffect(() => () => pending.current?.abort(), [])

  async function submit({ name, email, password }: FormFields) {
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller
    clearErrors('root')
    try {
      if (creating) {
        await registerAccount({ name, email, password }, controller.signal)
        if (!controller.signal.aborted) {
          void navigate('/login', { replace: true, state: { registered: true } })
        }
      } else {
        const tokens = await login({ email, password }, controller.signal)
        if (!controller.signal.aborted) startSession(tokens)
      }
    } catch (error) {
      if (controller.signal.aborted) return
      const status = httpStatus(error)
      if (creating && status === 409) {
        setError('email', { message: 'Email này đã được đăng ký.' }, { shouldFocus: true })
      } else if (isAuthApiUnavailable(error)) {
        setError('root', { message: 'Không kết nối được với máy chủ xác thực. Vui lòng thử lại sau.' })
      } else {
        const message = status === 401 && !creating
          ? 'Email hoặc mật khẩu không đúng.'
          : status === 429
            ? 'Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.'
            : creating
              ? 'Chưa thể đăng ký. Vui lòng thử lại.'
              : 'Chưa thể đăng nhập. Vui lòng thử lại.'
        setError('root', { message })
      }
    } finally {
      pending.current = null
    }
  }

  const fields = [
    ...(creating ? [{ name: 'name', label: 'Họ và tên', type: 'text', autoComplete: 'name' } as const] : []),
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { name: 'password', label: 'Mật khẩu', type: 'password', autoComplete: creating ? 'new-password' : 'current-password' },
  ] as const

  return (
    <main id="main-content" className="page-width account-layout" tabIndex={-1}>
      <div className="account-intro">
        <h1>{title}</h1>
        <p>{creating ? 'Tạo tài khoản để theo dõi tiến độ ôn tập.' : 'Xem tiến độ ôn tập của bạn.'}</p>
      </div>
      <div className="account-panel">
        {!creating && state?.registered === true && (
          <p className="account-notice" role="status">Tài khoản đã được tạo. Hãy đăng nhập để tiếp tục.</p>
        )}
        <form className="account-form" noValidate onSubmit={(event) => {
          if (pending.current) event.preventDefault()
          else void handleSubmit(submit)(event)
        }}>
          {fields.map((field) => (
            <div className="account-field" key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                required
                {...register(field.name)}
              />
              {errors[field.name]?.message && (
                <p id={`${field.name}-error`} className="account-error" role="alert">{errors[field.name]?.message}</p>
              )}
            </div>
          ))}
          {errors.root?.message && <p className="account-error" role="alert">{errors.root.message}</p>}
          <button className="account-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? `Đang ${title.toLowerCase()}…` : title}
          </button>
        </form>
        <p className="account-switch">
          <span>{creating ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>
          <Link className="button-link" to={creating ? '/login' : '/register'}>{creating ? 'Đăng nhập' : 'Đăng ký'}</Link>
        </p>
      </div>
    </main>
  )
}
