import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { httpStatus } from '../auth/auth-api'
import { LearnerError } from '../learning/LearnerLayout'
import { QuestionNavigator } from '../learning/QuestionNavigator'
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
      <Link className="button-link mb-3.5" to="/exams/history">Về lịch sử thi</Link>
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
  const [activeId, setActiveId] = useState<number>()
  const submitDialog = useRef<HTMLDialogElement>(null)
  const questions = exam.exam.questions
  const index = Math.max(0, questions.findIndex((item) => item.id === activeId))
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

  useEffect(() => {
    if (saveError || syncError) submitDialog.current?.close()
  }, [saveError, syncError])

  return (
    <>
      <div className="learner-exam-status">
        <span>Thời gian còn lại <time className="learner-time" dateTime={`PT${seconds}S`}>{time}</time></span>
        <span role="status">Đã lưu {answered}/{exam.total_questions} câu</span>
      </div>
      {expired && <p role="status">Đang xác nhận trạng thái hết giờ với máy chủ.</p>}
      {syncError && <LearnerError message="Chưa đồng bộ được trạng thái lượt thi." retry={() => void onSync()} />}
      {saveError && <LearnerError message="Chưa xác nhận được thay đổi. Hãy đồng bộ để xem dữ liệu đã lưu." retry={() => void onSync()} />}
      {question && (
        <div className="learner-question-layout">
          <QuestionNavigator items={questions.map((item, position) => ({
            id: item.id, number: position + 1, answered: item.selected_answer_id !== undefined,
          }))} activeId={question.id} onSelect={setActiveId}>
            <div className="learner-question-footer learner-exam-submit">
              <button type="button" className="learner-primary" disabled={blocked || saveError || syncError}
                onClick={() => submitDialog.current?.showModal()}>Nộp bài</button>
            </div>
          </QuestionNavigator>
          <div>
            <QuestionView question={question} number={index + 1} selected={question.selected_answer_id}
              disabled={blocked} onSelect={(answer) => onUpdate({ question: question.id, answer })}>
              <button type="button" disabled={blocked || question.selected_answer_id === undefined}
                onClick={() => onUpdate({ question: question.id, answer: 0 })}>Bỏ chọn đáp án</button>
            </QuestionView>

            <div className="learner-actions">
              <button type="button" disabled={index === 0} onClick={() => setActiveId(questions[index - 1].id)}>Câu trước</button>
              <button type="button" disabled={index >= questions.length - 1} onClick={() => setActiveId(questions[index + 1].id)}>Câu sau</button>
            </div>
            {saving && <p role="status">Đang gửi thay đổi…</p>}
          </div>
        </div>
      )}
      <dialog ref={submitDialog} className="learner-confirm" aria-labelledby="submit-heading"
        aria-describedby="submit-summary" onCancel={(event) => { if (saving) event.preventDefault() }}>
        <h2 id="submit-heading">Xác nhận nộp bài</h2>
        <p id="submit-summary">Còn {exam.total_questions - answered} câu chưa trả lời.</p>
        {saving && <p role="status">Đang nộp bài…</p>}
        {expired && !saving && <p role="status">Đang xác nhận trạng thái hết giờ với máy chủ.</p>}
        <div className="learner-confirm-actions">
          <button type="button" disabled={saving} onClick={() => submitDialog.current?.close()}>Quay lại làm bài</button>
          <button type="button" className="learner-primary" disabled={blocked || saveError || syncError}
            onClick={() => onUpdate('submit')}>Nộp bài ngay</button>
        </div>
      </dialog>
    </>
  )
}

function ExamResult({ exam }: { exam: ExamView }) {
  const [wrongOnly, setWrongOnly] = useState(false)
  const [activeId, setActiveId] = useState<number>()
  const items = exam.exam.questions
    .map((question, index) => ({ question, id: question.id, number: index + 1 }))
    .filter(({ question }) => !wrongOnly || !question.is_correct)
  const active = items.find((item) => item.id === activeId) ?? items[0]
  return (
    <>
      <section className="learner-card" aria-labelledby="result-heading">
        <h2 id="result-heading">Kết quả · {exam.is_passed ? 'Đạt' : 'Không đạt'}</h2>
        <p>{exam.status === 'TIMEOUT' ? 'Lượt thi đã hết giờ.' : 'Lượt thi đã được nộp.'}</p>
        <p>{exam.score} điểm · Điểm đạt {exam.passing_score} · {exam.correct_answers}/{exam.total_questions} câu đúng</p>
        {exam.failure_reason && reasons[exam.failure_reason] && <p>{reasons[exam.failure_reason]}</p>}
      </section>

      <div className="learner-actions">

        <button type="button" aria-pressed={wrongOnly} onClick={() => setWrongOnly(!wrongOnly)}>Chỉ xem câu sai hoặc bỏ trống</button>
        <p style={{ textAlign: 'center' }}
          className="examplePage"
          data-result={
            active.question.selected_answer_id === undefined
              ? 'blank'
              : active.question.is_correct ? 'correct' : 'incorrect'
          }
        >
          <strong style={{ margin: '0 8px' }}>BẠN ĐÃ:</strong>
          <strong>
            {active.question.selected_answer_id === undefined
              ? 'Bỏ trống'
              : active.question.is_correct ? 'Đúng'.toUpperCase() : 'Sai'.toUpperCase()}
          </strong>
        </p>
      </div>
      {active ? (

        <div className="learner-question-layout">
          <QuestionNavigator items={items} activeId={active.id} onSelect={setActiveId} />
          <QuestionView question={active.question} number={active.number} selected={active.question.selected_answer_id} reveal>
          </QuestionView>
        </div>
      ) : wrongOnly && <p>Không có câu sai hoặc bỏ trống.</p>}
    </>
  )
}
