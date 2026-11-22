import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { httpStatus } from '../auth/auth-api'
import { LearnerError } from '../learning/LearnerLayout'
import { QuestionView } from '../learning/QuestionView'
import { requestExam } from './exams-api'
import type { ExamView } from './exams-api'

const reasons: Record<string, string> = {
  critical_question: 'Sai hoặc bỏ trống câu điểm liệt.',
  insufficient_score: 'Điểm bài thi thấp hơn điểm đạt.',
}

export function ExamPage({ sessionId }: { sessionId: number }) {
  const { id } = useParams()
  if (!id || !/^[1-9]\d{0,9}$/.test(id) || Number(id) > 4294967295) return <LearnerError message="Mã lượt thi không hợp lệ." />
  return <ExamAttempt key={id} sessionId={sessionId} id={id} />
}

function ExamAttempt({ sessionId, id }: { sessionId: number; id: string }) {
  const client = useQueryClient()
  const path = `/exams/${id}`
  const key = ['account', sessionId, 'exam', id]
  const exam = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => requestExam(sessionId, path, { signal }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const update = useMutation({
    mutationFn: async (action: { question: number; answer: number } | 'submit') => {
      await client.cancelQueries({ queryKey: key })
      if (action === 'submit') return requestExam(sessionId, path + '/submit', { method: 'POST' })
      return requestExam(sessionId, `${path}/answers/${action.question}`, { method: 'PUT', data: { answer_id: action.answer } })
    },
    onSuccess: (result) => {
      client.setQueryData(key, result)
      if (result.status !== 'DOING') refreshResults()
    },
    onError: async (error) => {
      if (httpStatus(error) === 409) await sync()
    },
  })

  function refreshResults() {
    void client.invalidateQueries({ queryKey: ['account', sessionId, 'history'] })
    void client.invalidateQueries({ queryKey: ['account', sessionId, 'progress'] })
    void client.invalidateQueries({ queryKey: ['account', sessionId, 'wrong'] })
  }

  async function sync() {
    const result = await exam.refetch({ cancelRefetch: false })
    if (result.isSuccess) {
      update.reset()
      if (result.data.status !== 'DOING') refreshResults()
    }
  }

  return (
    <>
      <p><Link to="/exams/history">Về lịch sử thi</Link></p>
      {exam.isPending && <p role="status">Đang tải lượt thi…</p>}
      {!exam.data && exam.isError && <LearnerError message="Chưa tải được lượt thi của bạn." retry={() => void sync()} />}
      {exam.data && (
        <>
          <h1>{exam.data.exam.name}</h1>
          <p className="learner-meta">Hạng {exam.data.exam.license_type} · Phiên bản {exam.data.exam.version}</p>
          {exam.data.status === 'DOING'
            ? <ActiveExam exam={exam.data} onUpdate={update.mutate} saving={update.isPending}
              saveError={update.isError} syncing={exam.isFetching} syncError={exam.isError} onSync={sync} />
            : <ExamResult exam={exam.data} />}
        </>
      )}
    </>
  )
}

function ActiveExam({ exam, onUpdate, saving, saveError, syncing, syncError, onSync }: {
  exam: ExamView; onUpdate: (action: { question: number; answer: number } | 'submit') => void
  saving: boolean; saveError: boolean; syncing: boolean; syncError: boolean; onSync: () => Promise<void>
}) {
  const [now, setNow] = useState(() => performance.now())
  const [index, setIndex] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const questions = exam.exam.questions
  const question = questions[index]
  const answered = questions.filter((item) => item.selected_answer_id !== undefined).length
  const seconds = Math.max(0, Math.ceil((exam.deadline - now) / 1000))
  const expired = seconds === 0
  const blocked = saving || syncing || expired
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

  useEffect(() => {
    const timer = window.setInterval(() => setNow(performance.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!expired || saving || syncing || syncError) return
    const timer = window.setTimeout(() => void onSync(), 300)
    return () => window.clearTimeout(timer)
  }, [expired, onSync, saving, syncError, syncing])

  return (
    <>
      <div className="learner-exam-status">
        <span>Thời gian còn lại <time className="learner-time" dateTime={`PT${seconds}S`}>{time}</time></span>
        <span role="status">Đã lưu {answered}/{exam.total_questions} câu</span>
      </div>
      {saving && <p role="status">Đang gửi thay đổi…</p>}
      {expired && <p role="status">Đang xác nhận trạng thái hết giờ với máy chủ.</p>}
      {syncError && <LearnerError message="Chưa đồng bộ được trạng thái lượt thi." retry={() => void onSync()} />}
      {saveError && <LearnerError message="Chưa xác nhận được thay đổi. Hãy đồng bộ để xem dữ liệu đã lưu." retry={() => void onSync()} />}
      {question && (
        <>
          <QuestionView question={question} number={index + 1} selected={question.selected_answer_id}
            disabled={blocked || confirm} onSelect={(answer) => onUpdate({ question: question.id, answer })} />
          <div className="learner-actions">
            <button type="button" disabled={blocked || confirm || question.selected_answer_id === undefined}
              onClick={() => onUpdate({ question: question.id, answer: 0 })}>Bỏ chọn đáp án</button>
          </div>
          <div className="learner-actions">
            <button type="button" disabled={index === 0 || confirm} onClick={() => setIndex(index - 1)}>Câu trước</button>
            <div className="learner-field"><label htmlFor="exam-question">Chuyển đến câu</label>
              <select id="exam-question" value={index} disabled={confirm} onChange={(event) => setIndex(Number(event.target.value))}>
                {questions.map((item, position) => <option key={item.id} value={position}>
                  Câu {position + 1}{item.selected_answer_id !== undefined ? ' · Đã lưu' : ''}
                </option>)}
              </select>
            </div>
            <button type="button" disabled={index >= questions.length - 1 || confirm} onClick={() => setIndex(index + 1)}>Câu sau</button>
          </div>
        </>
      )}
      {confirm ? (
        <section className="learner-confirm" aria-labelledby="submit-heading">
          <h2 id="submit-heading">Xác nhận nộp bài</h2>
          <p>Còn {exam.total_questions - answered} câu chưa trả lời.</p>
          <div className="learner-actions">
            <button type="button" className="learner-primary" disabled={blocked || saveError || syncError} onClick={() => onUpdate('submit')}>Nộp bài ngay</button>
            <button type="button" disabled={saving} onClick={() => setConfirm(false)}>Quay lại làm bài</button>
          </div>
        </section>
      ) : <button type="button" className="learner-primary" disabled={blocked || saveError || syncError} onClick={() => setConfirm(true)}>Nộp bài</button>}
    </>
  )
}

function ExamResult({ exam }: { exam: ExamView }) {
  const [wrongOnly, setWrongOnly] = useState(false)
  return (
    <>
      <section className="learner-card" aria-labelledby="result-heading">
        <h2 id="result-heading">Kết quả · {exam.is_passed ? 'Đạt' : 'Không đạt'}</h2>
        <p>{exam.status === 'TIMEOUT' ? 'Lượt thi đã hết giờ.' : 'Lượt thi đã được nộp.'}</p>
        <p>{exam.score} điểm · Điểm đạt {exam.passing_score} · {exam.correct_answers}/{exam.total_questions} câu đúng</p>
        {exam.failure_reason && reasons[exam.failure_reason] && <p>{reasons[exam.failure_reason]}</p>}
      </section>
      <button type="button" aria-pressed={wrongOnly} onClick={() => setWrongOnly(!wrongOnly)}>Chỉ xem câu sai hoặc bỏ trống</button>
      <div className="learner-list">
        {exam.exam.questions.map((question, index) => (
          wrongOnly && question.is_correct ? null : (
            <section key={question.id}>
              <QuestionView question={question} number={index + 1} selected={question.selected_answer_id} reveal />
              <p><strong>{question.selected_answer_id === undefined ? 'Bỏ trống' : question.is_correct ? 'Đúng' : 'Sai'}</strong></p>
            </section>
          )
        ))}
        {wrongOnly && exam.exam.questions.every((question) => question.is_correct) && <p>Không có câu sai hoặc bỏ trống.</p>}
      </div>
    </>
  )
}
