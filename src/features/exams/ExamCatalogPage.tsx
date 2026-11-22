import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { learnerRequest, pageSchema } from '../../services/learner-api'
import { httpStatus } from '../auth/auth-api'
import { DashboardLink, LearnerError, Pagination } from '../learning/LearnerLayout'
import { requestExam, templateSchema, testSchema } from './exams-api'

type ExamKind = 'fixed' | 'random'

export function ExamCatalogPage({ sessionId }: { sessionId: number }) {
  const [kind, setKind] = useState<ExamKind>('fixed')
  return (
    <>
      <h1>Thi thử</h1>
      <DashboardLink />
      <p><Link to="/exams/history?status=DOING">Tiếp tục lượt thi đang làm</Link></p>
      <div className="learner-filters">
        <div className="learner-field"><label htmlFor="exam-kind">Loại đề</label>
          <select id="exam-kind" value={kind} onChange={(event) => setKind(event.target.value === 'random' ? 'random' : 'fixed')}>
            <option value="fixed">Đề có sẵn</option>
            <option value="random">Đề ngẫu nhiên</option>
          </select>
        </div>
      </div>
      <ExamChoices key={kind} sessionId={sessionId} kind={kind} />
    </>
  )
}

function ExamChoices({ sessionId, kind }: { sessionId: number; kind: ExamKind }) {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const client = useQueryClient()
  const random = kind === 'random'
  const choices = useQuery({
    queryKey: ['account', sessionId, 'exam-catalog', kind, page],
    queryFn: async ({ signal }) => {
      const options = { signal, params: { page } }
      if (random) {
        const result = await learnerRequest(sessionId, '/exam-templates', pageSchema(templateSchema), options)
        return { ...result, data: result.data.map((item) => ({
          id: item.id, name: item.name, license_type: item.license_type, description: '',
          duration_minutes: item.config.duration_minutes, passing_score: item.config.passing_score,
          total_questions: item.config.quotas.reduce((total, quota) => total + quota.count, 0),
        })) }
      }
      return learnerRequest(sessionId, '/tests', pageSchema(testSchema), options)
    },
  })
  const start = useMutation({
    mutationFn: (item: { id: number; license_type: string }) => requestExam(sessionId, random ? '/exams/random' : '/exams', {
      method: 'POST',
      data: random ? { template_id: item.id, license_type: item.license_type } : { test_id: item.id },
    }),
    onSuccess: (exam) => {
      client.setQueryData(['account', sessionId, 'exam', String(exam.id)], exam)
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'history'] })
    },
  })

  const results = choices.data
  return (
    <>
      {choices.isPending && <p role="status">Đang tải danh sách đề…</p>}
      {choices.isError && <LearnerError retry={() => void choices.refetch()} />}
      {start.isError && <LearnerError message={httpStatus(start.error) === 400
        ? 'Cấu hình hoặc ngân hàng câu hỏi hiện tại chưa đủ để tạo lượt thi này.'
        : 'Chưa xác nhận được lượt thi. Hãy kiểm tra lịch sử trước khi bắt đầu lượt mới.'} />}
      {results && (
        <>
          {results.data.length === 0 && <p>Chưa có {random ? 'cấu hình đề ngẫu nhiên' : 'đề thi'} được xuất bản trong phạm vi này.</p>}
          <ul className="learner-list">
            {results.data.map((item) => (
              <li className="learner-card" key={item.id}>
                <h2>{item.name}</h2>
                <p className="learner-meta">Hạng {item.license_type} · {item.total_questions} câu · {item.duration_minutes} phút · Điểm đạt {item.passing_score}</p>
                {item.description && <p>{item.description}</p>}
                <button type="button" className="learner-primary" disabled={start.isPending}
                  onClick={() => start.mutate(item, { onSuccess: (exam) => void navigate(`/exams/${exam.id}`) })}>
                  {start.isPending && start.variables?.id === item.id ? 'Đang tạo lượt thi…' : 'Bắt đầu thi'}
                </button>
              </li>
            ))}
          </ul>
          <Pagination {...results} onPage={setPage} />
        </>
      )}
    </>
  )
}
