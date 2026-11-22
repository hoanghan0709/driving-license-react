import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { healthQueryOptions } from './health-api'

const formSchema = z.object({
  sampleText: z.string().trim()
    .min(1, 'Hãy nhập nội dung thử.')
    .max(80, 'Nội dung thử được nhập tối đa 80 ký tự.'),
})

const panelClass = 'space-y-4 rounded-[var(--panel-radius)] border border-[var(--line)] bg-[var(--panel)] p-[var(--card-padding)]'

function ApiCheck() {
  const { data, isError, isFetching, refetch } = useQuery(healthQueryOptions)
  let status = 'Chưa kiểm tra kết nối.'

  if (isFetching) {
    status = 'Đang kiểm tra kết nối…'
  } else if (isError) {
    status = 'Không nhận được phản hồi hợp lệ từ API. Bạn có thể thử lại.'
  } else if (data) {
    status = 'API đang phản hồi.'
  }

  return (
    <section aria-labelledby="api-heading" className={panelClass}>
      <h2 id="api-heading" className="text-xl font-bold">Kết nối API</h2>
      <p role="status" className="text-[var(--muted)]">{status}</p>
      <button
        type="button"
        className="account-outline-button"
        disabled={isFetching}
        onClick={() => void refetch()}
      >
        Kiểm tra kết nối
      </button>
    </section>
  )
}

function FormCheck() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { sampleText: '' },
  })

  return (
    <section aria-labelledby="form-heading" className={panelClass}>
      <h2 id="form-heading" className="text-xl font-bold">Xác thực biểu mẫu</h2>
      <form noValidate className="space-y-4" onSubmit={handleSubmit(() => setSubmitted(true))}>
        <div className="space-y-2">
          <label htmlFor="sample-text" className="block text-sm font-semibold">Nội dung thử</label>
          <input
            id="sample-text"
            className="min-h-[var(--control-height)] w-full rounded-[var(--control-radius)] border border-[var(--control-line)] bg-[var(--panel)] px-3 py-2 aria-[invalid=true]:border-[var(--danger)]"
            aria-invalid={Boolean(errors.sampleText)}
            aria-describedby={errors.sampleText ? 'sample-text-error' : undefined}
            required
            {...register('sampleText', { onChange: () => setSubmitted(false) })}
          />
          {errors.sampleText && (
            <p id="sample-text-error" role="alert" className="account-error">
              {errors.sampleText.message}
            </p>
          )}
        </div>
        <button type="submit" className="account-button">
          Kiểm tra biểu mẫu
        </button>
        <p role="status" className="text-[var(--muted)]">{submitted && 'Nội dung hợp lệ.'}</p>
      </form>
    </section>
  )
}

export function SystemCheckPage() {
  return (
    <>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Kiểm tra hệ thống</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <ApiCheck />
        <FormCheck />
      </div>
    </>
  )
}
