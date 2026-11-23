import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StudySearch } from './StudySearch'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import { catalogSchema, learnerRequest, pageSchema } from '../../services/learner-api'
import { DashboardLink, LearnerError, Pagination } from './LearnerLayout'
import { QuestionNavigator } from './QuestionNavigator'
import { feedbackSchema, questionSchema, useStudyCategories } from './learning-api'
import type { Question } from './learning-api'
import { QuestionView } from './QuestionView'
import { TopicProgress } from './TopicProgress'
import { usePracticeSound } from './usePracticeSound'
import './practice.css'

const practicePageSchema = pageSchema(questionSchema)

type PracticeQuestionProps = Readonly<{
  sessionId: number; question: Question; number: number
  showExplanation?: boolean; onCorrect?: () => void; onAnswered?: (id: number, correct: boolean) => void
  topic?: string; tools?: ReactNode

}>

export function PracticeQuestion({ sessionId, question, number, showExplanation, onCorrect, onAnswered, topic, tools }: PracticeQuestionProps) {
  const [selected, setSelected] = useState<number>()
  const client = useQueryClient()
  const answer = useMutation({
    mutationFn: (id: number) => learnerRequest(sessionId, `/practice/questions/${question.id}/answer`,
      feedbackSchema, { method: 'POST', data: { answer_id: id } }),
    onSuccess: (feedback) => {
      onAnswered?.(question.id, feedback.attempt.is_correct)
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'progress'] })
      void client.invalidateQueries({ queryKey: ['account', sessionId, 'wrong'], refetchType: 'none' })
    },
  })

  const correct = answer.data?.attempt.is_correct
  useEffect(() => {
    if (!correct || !onCorrect) return
    const timeout = window.setTimeout(onCorrect, 1500)
    return () => window.clearTimeout(timeout)
  }, [correct, onCorrect])

  return (
    <section>
      <QuestionView question={answer.data?.question ?? question} number={number}
        selected={answer.data?.attempt.answer_id ?? selected} onSelect={answer.data ? undefined : setSelected}
        reveal={!!answer.data} showExplanation={showExplanation} disabled={answer.isPending} topic={topic} tools={tools}>
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

type PracticePageProps = Readonly<{ sessionId: number; wrong?: boolean }>

export function PracticePage({ sessionId, wrong = false }: PracticePageProps) {
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [showExplanation, setShowExplanation] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [largeText, setLargeText] = useState(false)
  const [reset, setReset] = useState(0)
  const [marked, setMarked] = useState<ReadonlySet<number>>(() => new Set())
  const sound = usePracticeSound()
  const critical = params.get('critical') === 'true'
  const categories = useStudyCategories(sessionId, type)
  const topicNames = new Map(categories.data?.data.map(({ id, name }) => [id, name]))
  const types = useQuery({
    queryKey: ['account', sessionId, 'category-types'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/category-types', catalogSchema, { signal }),
  })
  const questions = useQuery({
    queryKey: ['account', sessionId, wrong ? 'wrong' : 'practice', page, category, type, search, critical],
    queryFn: ({ signal }) => learnerRequest(sessionId, wrong ? '/practice/wrong-questions' : '/practice/questions',
      practicePageSchema, { signal, params: {
        page, limit: 20, category_id: category, category_type: type, search, is_critical: critical ? true : '',
      } }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const results = questions.data

  function changeTopic(id: number) {
    setType('')
    setCategory(String(id))
    setPage(1)
  }

  const sidebar = <>
    <section className="learner-card study-practice-settings" aria-labelledby="practice-settings">
      <h2 id="practice-settings">Cài đặt luyện thi</h2>
      <label><span>Tự chuyển câu khi trả lời đúng</span>
        <input type="checkbox" role="switch" checked={autoAdvance} onChange={(event) => setAutoAdvance(event.target.checked)} />
      </label>
      <label><span>Hiện giải thích chi tiết</span>
        <input type="checkbox" role="switch" checked={showExplanation} onChange={(event) => setShowExplanation(event.target.checked)} />
      </label>
      {typeof AudioContext !== 'undefined' && <label><span>Âm thanh tín hiệu</span>
        <input type="checkbox" role="switch" checked={sound.enabled} onChange={(event) => void sound.enable(event.target.checked)} />
      </label>}
    </section>
    <TopicProgress sessionId={sessionId} onTopic={changeTopic} />
  </>

  return (
    <div className="study-practice">
      <header className="learner-card study-page-heading">
        <div>
          <h1>{wrong ? 'Câu cần ôn lại' : 'Luyện tập câu hỏi theo chuyên đề'}</h1>
          <p>Chọn chủ đề, làm câu hỏi và đọc giải thích sau khi trả lời.</p>
        </div>
        <StudySearch label="Tìm câu hỏi" placeholder="Tìm từ khóa câu hỏi" value={search} shortcut
          onSearch={(term) => { setSearch(term); setPage(1) }} />
      </header>
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
          <select id="practice-category" value={category} disabled={!categories.data}
            onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
            <option value="">Tất cả chủ đề</option>
            {categories.data?.data.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
        <DashboardLink />
        <Link className="button-link" to={wrong ? '/practice' : '/practice/wrong'}>
          {wrong ? 'Tất cả câu hỏi' : 'Câu cần ôn lại'}
        </Link>
      </div>
      <div className="study-practice-critical" data-tone="red">
        <StudyIcon name="flag" />
        <div><strong>Câu hỏi điểm liệt</strong><p>Lọc các câu được đánh dấu điểm liệt trong ngân hàng đang ôn.</p></div>
        <button type="button" aria-pressed={critical} onClick={() => {
          setPage(1)
          setParams(critical ? {} : { critical: 'true' })
        }}>{critical ? 'Hiện tất cả câu' : 'Chỉ xem câu điểm liệt'}</button>
      </div>
      {types.isError && <LearnerError message="Chưa tải được nhóm chủ đề." retry={() => void types.refetch()} />}
      {categories.isError && <LearnerError message="Chưa tải được chủ đề." retry={() => void categories.refetch()} />}
      {questions.isError && <LearnerError retry={() => void questions.refetch()} />}
      {questions.isPending && <p role="status">Đang tải câu hỏi…</p>}
      {results && results.data.length > 0
        ? <PracticeQuestions key={`${page}-${category}-${type}-${search}-${critical}-${reset}`}
          sessionId={sessionId} results={results} showExplanation={showExplanation} autoAdvance={autoAdvance}
          topicNames={topicNames} largeText={largeText} onTextSize={() => setLargeText(!largeText)}
          onReset={() => { setReset((value) => value + 1); void questions.refetch() }}
          marked={marked} onMark={(id) => setMarked((current) => {
            const next = new Set(current)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
          })} onFeedback={sound.play} sidebar={sidebar} onPage={setPage} />
        : <div className="learner-question-layout study-practice-layout">
          <div>
            {results && <>
              <p>{wrong ? 'Chưa có câu cần ôn lại trong phạm vi này.' : 'Chưa có câu hỏi trong phạm vi này.'}</p>
              <Pagination {...results} onPage={setPage} />
            </>}
          </div>
          <aside className="study-practice-sidebar">{sidebar}</aside>
        </div>}
    </div>
  )
}

type PracticeQuestionsProps = Readonly<{
  sessionId: number
  results: ReturnType<typeof practicePageSchema.parse>
  onPage: (page: number) => void
  showExplanation: boolean
  autoAdvance: boolean
  sidebar: ReactNode
  largeText: boolean
  onTextSize: () => void
  topicNames: ReadonlyMap<number, string>
  marked: ReadonlySet<number>
  onMark: (id: number) => void
  onReset: () => void
  onFeedback: (correct: boolean) => void
}>

function PracticeQuestions({ sessionId, results, onPage, showExplanation, autoAdvance, sidebar,
  largeText, onTextSize, topicNames, marked, onMark, onReset, onFeedback }: PracticeQuestionsProps) {
  const [activeId, setActiveId] = useState<number>()
  const [answered, setAnswered] = useState<ReadonlySet<number>>(() => new Set())
  const activeIndex = Math.max(0, results.data.findIndex(({ id }) => id === activeId))
  const currentId = results.data[activeIndex].id
  const firstNumber = (results.page - 1) * results.limit + 1
  const items = results.data.map((question, index) => ({
    id: question.id, number: firstNumber + index, answered: answered.has(question.id), marked: marked.has(question.id),
  }))
  const previous = results.data[activeIndex - 1]
  const next = results.data[activeIndex + 1]

  return (
    <div className="learner-question-layout study-practice-layout" data-large-text={largeText || undefined}>
      <div>
        <div className="study-practice-position">
          <span className="study-chip">Câu {firstNumber + activeIndex} / {results.total}</span>
          <button type="button" className="study-icon-button" aria-label="Làm mới danh sách câu hỏi" onClick={onReset}><StudyIcon name="repeat" /></button>
        </div>
        {results.data.map((question, index) => (
          <div key={question.id} hidden={question.id !== currentId}>
            <PracticeQuestion sessionId={sessionId} question={question} number={firstNumber + index}
              topic={topicNames.get(question.category_id ?? 0)} showExplanation={showExplanation}
              tools={question.id === currentId && <>
                <button type="button" aria-pressed={largeText} onClick={onTextSize}>Chữ lớn</button>
                <button type="button" className="study-icon-button" aria-pressed={marked.has(question.id)}
                  aria-label="Đánh dấu xem lại" onClick={() => onMark(question.id)}><StudyIcon name="flag" /></button>
              </>}
              onAnswered={(id, correct) => {
                setAnswered((ids) => new Set([...ids, id]))
                onFeedback(correct)
              }}
              onCorrect={autoAdvance && question.id === currentId && next && !answered.has(next.id) ? () => setActiveId(next.id) : undefined} />
          </div>
        ))}
        <div className="learner-actions study-question-actions">
          <button type="button" disabled={!previous} onClick={() => setActiveId(previous?.id)}>Câu trước</button>
          <button type="button" className="learner-primary" disabled={!next} onClick={() => setActiveId(next?.id)}>Câu tiếp theo</button>
        </div>
      </div>
      <div className="study-practice-sidebar">
        <QuestionNavigator items={items} activeId={currentId} onSelect={setActiveId}>
          <Pagination {...results} onPage={onPage} />
        </QuestionNavigator>
        {sidebar}
      </div>
    </div>
  )
}
