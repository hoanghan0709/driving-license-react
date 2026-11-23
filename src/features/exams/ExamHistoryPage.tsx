import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StudySearch } from '../learning/StudySearch'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import { learnerRequest, pageSchema } from '../../services/learner-api'
import { LearnerError, Pagination } from '../learning/LearnerLayout'
import { ExamReviewTopics, ExamStatistics } from './ExamStatistics'
import { historySchema, requestExam } from './exams-api'
import type { z } from 'zod'
import './history.css'

const dates = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
const statuses = { DOING: 'Đang làm', COMPLETED: 'Đã nộp', TIMEOUT: 'Hết giờ' }
const examHistorySchema = pageSchema(historySchema)
type HistoryItem = z.infer<typeof historySchema>

type ExamHistoryPageProps = Readonly<{ sessionId: number }>

export function ExamHistoryPage({ sessionId }: ExamHistoryPageProps) {
  const [params, setParams] = useSearchParams()
  const status = historySchema.shape.status.safeParse(params.get('status')).data ?? ''
  const search = params.get('search') ?? ''
  const period = params.get('period') === '30' ? '30' : ''
  const [openedAt] = useState(Date.now)
  const cutoff = period ? openedAt - 30 * 24 * 60 * 60 * 1000 : 0
  const requestedPage = Number(params.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000000 ? requestedPage : 1
  const client = useQueryClient()
  const navigate = useNavigate()
  const history = useQuery({
    queryKey: ['account', sessionId, 'history', page, status],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/exams', examHistorySchema, { signal, params: { page, status } }),
  })
  const retry = useMutation({
    mutationFn: (exam: HistoryItem) => exam.test_id
      ? requestExam(sessionId, '/exams', { method: 'POST', data: { test_id: exam.test_id } })
      : requestExam(sessionId, '/exams/random', { method: 'POST', data: { template_id: exam.template_id, license_type: exam.license_type } }),
    onSuccess: (exam) => {
      client.setQueryData(['account', sessionId, 'exam', String(exam.id)], exam)
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'history'] })
      void navigate(`/exams/${exam.id}`)
    },
  })

  const matches = history.data?.data.filter((exam) => {
    const attempt = search.replace(/^#/, '')
    return (!attempt || String(exam.id).includes(attempt)) && (!cutoff || Date.parse(exam.started_at) >= cutoff)
  })

  function changeFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'status') next.delete('page')
    setParams(next)
  }

  return (
    <div className="study-history">
      <header className="study-page-heading">
        <div>
          <h1>Lịch sử làm bài &amp; Thống kê kết quả</h1>
          <p>Xem kết quả thi thử, tiếp tục bài đang làm và ôn lại câu sai.</p>
        </div>
        <Link className="button-link study-primary-link" to="/exams"><StudyIcon name="arrow" /> Thi thử đề mới</Link>
      </header>
      <ExamStatistics sessionId={sessionId} />
      <section className="study-history-table" aria-labelledby="exam-history-heading">
        <div className="study-history-table-head">
          <h2 id="exam-history-heading"><StudyIcon name="clock" /> Danh sách lượt thi {history.data && <span className="study-chip">{history.data.total} lượt</span>}</h2>
          <div className="study-history-filters">
            <StudySearch label="Tìm theo mã lượt thi" placeholder="Tìm theo mã lượt trên trang" value={search}
              onSearch={(term) => changeFilter('search', term)} maxLength={120} />
            <label className="learner-field">Khoảng thời gian
              <select value={period} onChange={(event) => changeFilter('period', event.target.value)}>
                <option value="">Tất cả thời gian</option><option value="30">30 ngày gần nhất</option>
              </select>
            </label>
            <label className="learner-field" htmlFor="history-status">Trạng thái
              <select id="history-status" value={status} onChange={(event) => changeFilter('status', event.target.value)}>
                <option value="">Tất cả lượt thi</option>
                {Object.entries(statuses).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            </label>
          </div>
        </div>
        {history.isPending && <p role="status">Đang tải lịch sử thi…</p>}
        {history.isError && <LearnerError retry={() => void history.refetch()} />}
        {retry.isError && <LearnerError message="Chưa xác nhận được lượt thi mới. Hãy kiểm tra lịch sử trước khi thử lại." />}
        {(search || period) && history.data && <p className="learner-meta">Mã lượt và thời gian được lọc trên trang đang xem.</p>}
        {matches && (matches.length
          ? <HistoryTable items={matches} waiting={retry.isPending} onRetry={(exam) => retry.mutate(exam)} />
          : <p>Chưa có lượt thi phù hợp trên trang này.</p>)}
        {history.data && <Pagination {...history.data} onPage={(next) => changeFilter('page', String(next))} />}
      </section>
      <ExamReviewTopics sessionId={sessionId} />
    </div>
  )
}

function formatDuration(started: string, finished: string) {
  const seconds = Math.max(0, Math.floor((Date.parse(finished) - Date.parse(started)) / 1000))
  return `${Math.floor(seconds / 60)} phút ${String(seconds % 60).padStart(2, '0')} giây`
}

type HistoryTableProps = Readonly<{ items: HistoryItem[]; waiting: boolean; onRetry: (item: HistoryItem) => void }>

function HistoryTable({ items, waiting, onRetry }: HistoryTableProps) {
  return (
    <div className="study-history-table-scroll">
      <table>
        <thead><tr><th scope="col">Mã lượt</th><th scope="col">Đề thi</th><th scope="col">Ngày giờ thi</th>
          <th scope="col">Thời gian làm</th><th scope="col">Điểm số</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
        <tbody>{items.map((exam) => {
          const doing = exam.status === 'DOING'
          return (
            <tr key={exam.id}>
              <th scope="row"><Link to={`/exams/${exam.id}`}>#{exam.id}</Link></th>
              <td>{exam.template_id ? 'Đề ngẫu nhiên' : 'Đề có sẵn'} <small>Hạng {exam.license_type}</small></td>
              <td><time dateTime={exam.started_at}>{dates.format(new Date(exam.started_at))}</time></td>
              <td>{exam.finished_at ? formatDuration(exam.started_at, exam.finished_at) : '—'}</td>
              <td>{doing ? '—' : <><strong>{exam.score}</strong> điểm<small>Điểm đạt {exam.passing_score}</small></>}</td>
              <td><span className="study-chip" data-tone={doing ? 'blue' : exam.is_passed ? 'green' : 'red'}>
                {doing ? statuses.DOING : exam.is_passed ? 'Đạt' : 'Không đạt'}
              </span>
                {exam.status === 'TIMEOUT' && <small>{statuses.TIMEOUT}</small>}
                {exam.failure_reason === 'critical_question' && <small>Sai hoặc bỏ trống câu điểm liệt</small>}
              </td>
              <td><div className="study-history-row-actions">
                <Link className="button-link" to={`/exams/${exam.id}`}>{doing ? 'Tiếp tục thi' : 'Xem kết quả'}</Link>
                {!doing && (exam.test_id || exam.template_id) && (
                  <button type="button" className="learner-primary" disabled={waiting} onClick={() => onRetry(exam)}>Thi lại</button>
                )}
              </div></td>
            </tr>
          )
        })}</tbody>
      </table>
    </div>
  )
}
