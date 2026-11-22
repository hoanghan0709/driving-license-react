import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { catalogSchema, learnerRequest, pageSchema } from '../../services/learner-api'
import { DashboardLink, LearnerError, Pagination } from './LearnerLayout'
import { QuestionNavigator } from './QuestionNavigator'
import { categoriesSchema, feedbackSchema, questionSchema } from './learning-api'
import type { Question } from './learning-api'
import { QuestionView } from './QuestionView'

const practicePageSchema = pageSchema(questionSchema)

export function PracticeQuestion({ sessionId, question, number }: { sessionId: number; question: Question; number: number }) {
  const [selected, setSelected] = useState<number>()
  const client = useQueryClient()
  const answer = useMutation({
    mutationFn: (id: number) => learnerRequest(sessionId, `/practice/questions/${question.id}/answer`,
      feedbackSchema, { method: 'POST', data: { answer_id: id } }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'progress'] })
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'wrong'], refetchType: 'none' })
    },
  })

  return (
    <section>
      <QuestionView question={answer.data?.question ?? question} number={number}
        selected={answer.data?.attempt.answer_id ?? selected} onSelect={answer.data ? undefined : setSelected}
        reveal={!!answer.data} disabled={answer.isPending}>
        {answer.data ? (
          <p role="status"><strong>{answer.data.attempt.is_correct ? 'Trả lời đúng' : 'Trả lời sai'}</strong></p>
        ) : (
          <button className="learner-primary" type="button" disabled={selected === undefined || answer.isPending}
            onClick={() => { if (selected !== undefined) answer.mutate(selected) }}>
            {answer.isPending ? 'Đang gửi…' : 'Kiểm tra đáp án'}
          </button>
        )}
        {answer.isError && <LearnerError message="Chưa xác nhận được câu trả lời. Bạn có thể gửi lại." />}
      </QuestionView>
    </section>
  )
}

export function PracticePage({ sessionId, wrong = false }: { sessionId: number; wrong?: boolean }) {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const categories = useQuery({
    queryKey: ['account', sessionId, 'categories', type],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/categories', categoriesSchema, { signal, params: { category_type: type } }),
  })
  const types = useQuery({
    queryKey: ['account', sessionId, 'category-types'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/category-types', catalogSchema, { signal }),
  })
  const questions = useQuery({
    queryKey: ['account', sessionId, wrong ? 'wrong' : 'practice', page, category, type],
    queryFn: ({ signal }) => learnerRequest(sessionId, wrong ? '/practice/wrong-questions' : '/practice/questions',
      practicePageSchema, { signal, params: { page, limit: 20, category_id: category, category_type: type } }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const results = questions.data

  return (
    <>
      <h1>{wrong ? 'Câu cần ôn lại' : 'Luyện câu hỏi'}</h1>
      <DashboardLink />
      <div className="learner-filters">
        <div className="learner-field"><label htmlFor="practice-type">Nhóm chủ đề</label>
          <select id="practice-type" value={type} disabled={!types.data} onChange={(event) => {
            setType(event.target.value)
            setCategory('')
            setPage(1)
          }}>
            <option value="">Tất cả nhóm</option>
            {types.data?.data.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
        <div className="learner-field"><label htmlFor="practice-category">Chủ đề</label>
          <select id="practice-category" value={category} disabled={!categories.data} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
            <option value="">Tất cả chủ đề</option>
            {categories.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>
      {types.isError && <LearnerError message="Chưa tải được nhóm chủ đề." retry={() => void types.refetch()} />}
      {categories.isError && <LearnerError message="Chưa tải được chủ đề." retry={() => void categories.refetch()} />}
      {questions.isPending && <p role="status">Đang tải câu hỏi…</p>}
      {questions.isError && <LearnerError retry={() => void questions.refetch()} />}
      {results && (results.data.length > 0
        ? <PracticeQuestions key={`${page}-${category}-${type}`} sessionId={sessionId} results={results} onPage={setPage} />
        : <>
          <p>{wrong ? 'Chưa có câu cần ôn lại trong phạm vi này.' : 'Chưa có câu hỏi trong phạm vi này.'}</p>
          <Pagination {...results} onPage={setPage} />
        </>)}
    </>
  )
}

function PracticeQuestions({ sessionId, results, onPage }: {
  sessionId: number
  results: ReturnType<typeof practicePageSchema.parse>
  onPage: (page: number) => void
}) {
  const [activeId, setActiveId] = useState<number>()
  const currentId = results.data.find((question) => question.id === activeId)?.id ?? results.data[0].id
  const firstNumber = (results.page - 1) * results.limit + 1
  const items = results.data.map((question, index) => ({ id: question.id, number: firstNumber + index }))

  return (
    <div className="learner-question-layout">
      <QuestionNavigator items={items} activeId={currentId} onSelect={setActiveId}>
        <Pagination {...results} onPage={onPage} />
      </QuestionNavigator>
      <div>
        {results.data.map((question, index) => (
          <div key={question.id} hidden={question.id !== currentId}>
            <PracticeQuestion sessionId={sessionId} question={question} number={firstNumber + index} />
          </div>
        ))}
      </div>
    </div>
  )
}
