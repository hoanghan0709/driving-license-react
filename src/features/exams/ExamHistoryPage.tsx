import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { learnerRequest, pageSchema } from '../../services/learner-api'
import { LearnerError, Pagination } from '../learning/LearnerLayout'
import { historySchema } from './exams-api'

const dates = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
const statuses = { DOING: 'Đang làm', COMPLETED: 'Đã nộp', TIMEOUT: 'Hết giờ' }

export function ExamHistoryPage({ sessionId }: { sessionId: number }) {
  const [params, setParams] = useSearchParams()
  const status = historySchema.shape.status.safeParse(params.get('status')).data ?? ''
  const requestedPage = Number(params.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000000 ? requestedPage : 1
  const history = useQuery({
    queryKey: ['account', sessionId, 'history', page, status],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/exams', pageSchema(historySchema), { signal, params: { page, status } }),
  })

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(params)
    next.set('page', String(nextPage))
    setParams(next)
  }

  return (
    <>
      <h1>Lịch sử thi</h1>
      <div className="learner-filters">
        <div className="learner-field"><label htmlFor="history-status">Trạng thái</label>
          <select id="history-status" value={status} onChange={(event) => setParams(event.target.value ? { status: event.target.value } : {})}>
            <option value="">Tất cả lượt thi</option>
            {Object.entries(statuses).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
      </div>
      {history.isPending && <p role="status">Đang tải lịch sử thi…</p>}
      {history.isError && <LearnerError retry={() => void history.refetch()} />}
      {history.data && (
        <>
          {history.data.data.length === 0 && <p>Chưa có lượt thi trong phạm vi này.</p>}
          <ul className="learner-list">
            {history.data.data.map((exam) => (
              <li className="learner-card" key={exam.id}>
                <h2>Lượt thi {exam.id} · Hạng {exam.license_type}</h2>
                <p className="learner-meta">{dates.format(new Date(exam.started_at))} · {statuses[exam.status]}</p>
                {exam.status !== 'DOING' && <p>{exam.is_passed ? 'Đạt' : 'Không đạt'} · {exam.score} điểm · Điểm đạt {exam.passing_score}</p>}
                <Link className="button-link" to={`/exams/${exam.id}`}>{exam.status === 'DOING' ? 'Tiếp tục thi' : 'Xem kết quả'}</Link>
              </li>
            ))}
          </ul>
          <Pagination {...history.data} onPage={changePage} />
        </>
      )}
    </>
  )
}
