import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '../../services/api-client'
import { catalogSchema, learnerRequest } from '../../services/learner-api'
import { profileSchema } from '../auth/auth-api'
import type { Profile } from '../auth/auth-api'

export function LicensePicker({ sessionId, profile }: { sessionId: number; profile: Profile }) {
  const client = useQueryClient()
  const [selected, setSelected] = useState(profile.current_license_type)
  const licenses = useQuery({
    queryKey: ['account', sessionId, 'licenses'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/license-types', catalogSchema, { signal }),
    retry: false,
  })
  const save = useMutation({
    mutationFn: (code: string) => learnerRequest(sessionId, '/me/license', profileSchema,
      { method: 'PUT', data: { license_type: code } }),
    onSuccess: async (updated) => {
      const key = ['account', sessionId, 'profile']
      await client.cancelQueries({ queryKey: key })
      client.setQueryData(key, updated)
      await client.invalidateQueries({ queryKey: ['account', sessionId], predicate: (query) => query.queryKey[2] !== 'profile' })
    },
  })
  const canSave = licenses.data?.data.some(({ code }) => code === selected)
    && selected !== profile.current_license_type && !save.isPending
  const adminHref = (apiClient.defaults.baseURL || '/backend').replace(/\/$/, '') + '/admin/'

  return (
    <>
      <form className="dashboard-license" onSubmit={(event) => {
        event.preventDefault()
        if (canSave) save.mutate(selected)
      }}>
        <label htmlFor="current-license">Đổi hạng bằng đang ôn</label>
        <select id="current-license" value={selected} disabled={save.isPending || !licenses.data} onChange={(event) => {
          setSelected(event.target.value)
          save.reset()
        }}>
          <option value="" disabled>Chọn hạng bằng</option>
          {licenses.data?.data.map(({ code, name }) => <option key={code} value={code}>{name}</option>)}
        </select>
        <button className="account-outline-button" type="submit" disabled={!canSave}>
          {save.isPending ? 'Đang lưu…' : 'Lưu hạng bằng'}
        </button>
        {licenses.isPending && <p role="status">Đang tải danh sách hạng bằng…</p>}
        {licenses.isError && <p role="alert">Chưa tải được hạng bằng. <button type="button" onClick={() => void licenses.refetch()}>Thử tải lại</button></p>}
        {save.isError && <p role="alert">Chưa xác nhận được hạng bằng đã lưu. Bạn có thể thử lại.</p>}
        {save.isSuccess && <p role="status">Đã lưu hạng bằng.</p>}
      </form>
      {profile.role === 'admin' && <a className="dashboard-roadmap" href={adminHref}>Mở trang quản trị</a>}
    </>
  )
}
