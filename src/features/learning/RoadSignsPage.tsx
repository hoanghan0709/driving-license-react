import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { catalogSchema, learnerRequest, mediaUrl, pageSchema } from '../../services/learner-api'
import { DashboardLink, LearnerError, Pagination } from './LearnerLayout'
import { questionSchema, signSchema } from './learning-api'
import { PracticeQuestion } from './PracticePage'

export function RoadSignsPage({ sessionId }: { sessionId: number }) {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const types = useQuery({
    queryKey: ['account', sessionId, 'sign-types'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/road-sign-types', catalogSchema, { signal }),
  })
  const signs = useQuery({
    queryKey: ['account', sessionId, 'signs', page, type, search],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/road-signs', pageSchema(signSchema),
      { signal, params: { page, sign_type: type, search } }),
  })

  return (

    <>
      <h1>Biển báo</h1>
      <DashboardLink />
      <form className="learner-filters" onSubmit={(event) => {
        event.preventDefault()
        setSearch(String(new FormData(event.currentTarget).get('search') ?? '').trim())
        setPage(1)
      }}>
        <label>Tên hoặc mã biển
          <input type="search" name="search" />
        </label>
        <div className="learner-field"><label htmlFor="road-sign-type">Nhóm biển</label>
          <select id="road-sign-type" value={type} disabled={!types.data} onChange={(event) => { setType(event.target.value); setPage(1) }}>
            <option value="">Tất cả nhóm</option>
            {types.data?.data.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
        <button type="submit" className="learner-primary">Tìm kiếm</button>
      </form>
      {types.isError && <LearnerError message="Chưa tải được nhóm biển." retry={() => void types.refetch()} />}
      {signs.isPending && <p role="status">Đang tải biển báo…</p>}
      {signs.isError && <LearnerError retry={() => void signs.refetch()} />}
      {signs.data && (
        <>
          {signs.data.data.length === 0 && <p>Chưa có biển báo phù hợp.</p>}
          <ul className="learner-list learner-sign-grid">
            {signs.data.data.map((sign) => (
              <li className="learner-card" key={sign.id}>
                <h2>
                  <Link to={`/road-signs/${sign.id}`}>
                    {sign.code} · {sign.name}
                  </Link>
                </h2>
                {sign.image && (
                  <img
                    src={mediaUrl(sign.image)}
                    alt={`${sign.code} - ${sign.name}`}
                    className="learner-sign-thumbnail"
                    loading="lazy"
                  />
                )}
                <p className="learner-meta">Hạng {sign.license_type}</p>
                <p>{sign.meaning}</p>
              </li>
            ))}
          </ul>
          <Pagination {...signs.data} onPage={setPage} />
        </>
      )}
    </>
  )
}

export function RoadSignPage({ sessionId }: { sessionId: number }) {
  const { id } = useParams()
  if (!id || !/^[1-9]\d{0,9}$/.test(id) || Number(id) > 4294967295) return <LearnerError message="Mã biển báo không hợp lệ." />
  return <RoadSignDetails key={id} sessionId={sessionId} id={id} />
}

function RoadSignDetails({ sessionId, id }: { sessionId: number; id: string }) {
  const [page, setPage] = useState(1)
  const sign = useQuery({
    queryKey: ['account', sessionId, 'signs', 'detail', id],
    queryFn: ({ signal }) => learnerRequest(sessionId, `/road-signs/${id}`, signSchema, { signal }),
  })
  const questions = useQuery({
    queryKey: ['account', sessionId, 'signs', 'questions', id, page],
    enabled: !!sign.data,
    queryFn: ({ signal }) => learnerRequest(sessionId, `/road-signs/${id}/questions`, pageSchema(questionSchema),
      { signal, params: { page, limit: 5 } }),
  })
  if (sign.isPending) return <p role="status">Đang tải biển báo…</p>
  if (!sign.data) return <LearnerError message="Chưa tải được biển báo trong hạng đang ôn." retry={() => void sign.refetch()} />
  const image = mediaUrl(sign.data.image)
  const results = questions.data

  return (
    <>
      <p><Link className="button-link" to="/road-signs">Về danh sách biển báo</Link></p>
      <h1>{sign.data.code} · {sign.data.name}</h1>
      <div className="learner-card">
        <p className="learner-meta">Hạng {sign.data.license_type}</p>
        {image && <img className="learner-image" src={image} alt={`Biển ${sign.data.code} · ${sign.data.name}`} />}
        <p className="learner-content">{sign.data.meaning}</p>
        {sign.data.description && <p className="learner-content">{sign.data.description}</p>}
      </div>
      <h2>Câu hỏi liên quan</h2>
      {questions.isPending && <p role="status">Đang tải câu hỏi…</p>}
      {questions.isError && <LearnerError retry={() => void questions.refetch()} />}
      {results && (
        <>
          {results.data.length === 0 && <p>Chưa có câu hỏi liên quan.</p>}
          <div className="learner-list">
            {results.data.map((question, index) => (
              <PracticeQuestion key={`${page}-${question.id}`} sessionId={sessionId} question={question}
                number={(results.page - 1) * results.limit + index + 1} />
            ))}
          </div>
          <Pagination {...results} onPage={setPage} />
        </>
      )}
    </>
  )
}
