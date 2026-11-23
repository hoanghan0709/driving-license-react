import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import type { StudyIconName } from '../../components/StudyIcon'
import { learnerRequest, pageSchema } from '../../services/learner-api'
import { useStudyProgress } from '../dashboard/dashboard-api'
import { LearnerError } from '../learning/LearnerLayout'
import { TopicProgress } from '../learning/TopicProgress'
import { questionSchema } from '../learning/learning-api'

const numbers = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

type StatisticCardProps = Readonly<{ label: string; value: string; detail: string; icon: StudyIconName; tone: string }>

function StatisticCard({ label, value, detail, icon, tone }: StatisticCardProps) {
  return (
    <div className="learner-card study-statistic" data-tone={tone}>
      <div><dt>{label}</dt><span className="study-icon-tile"><StudyIcon name={icon} /></span></div>
      <dd>{value}</dd>
      <p>{detail}</p>
    </div>
  )
}

type ExamStatisticsProps = Readonly<{ sessionId: number }>

export function ExamStatistics({ sessionId }: ExamStatisticsProps) {
  const progress = useStudyProgress(sessionId)
  const data = progress.data
  if (progress.isPending) return <p role="status">Đang tải thống kê…</p>
  if (!data) return <LearnerError message="Chưa tải được thống kê lượt thi." retry={() => void progress.refetch()} />
  const scored = data.recent_exams.filter(({ total }) => total > 0)
  const mean = scored.length
    ? scored.reduce((sum, { score, total }) => sum + score / total, 0) * 100 / scored.length
    : undefined
  return (
    <section className="study-history-overview" aria-label="Thống kê lượt thi">
      <p className="learner-meta">{data.license_type ? `Thống kê hạng ${data.license_type}` : 'Thống kê mọi hạng bằng lái'}</p>
      <dl className="study-statistics">
        <StatisticCard label="Lượt thi đã kết thúc" value={numbers.format(data.completed_exams)}
          detail="Gồm lượt đã nộp và hết giờ" icon="clipboard" tone="blue" />
        <StatisticCard label="Tỷ lệ đạt" value={data.completed_exams ? `${numbers.format(data.pass_rate)}%` : '—'}
          detail={`${data.passed_exams} đạt / ${data.completed_exams - data.passed_exams} không đạt`} icon="shield" tone="green" />
        <StatisticCard label="Điểm trung bình" value={mean === undefined ? '—' : `${numbers.format(mean)}%`}
          detail={scored.length ? `Theo tỷ lệ điểm của ${scored.length} lượt gần nhất` : 'Chưa có lượt thi để tính'} icon="chart" tone="indigo" />
        <StatisticCard label="Câu cần ôn lại" value={numbers.format(data.wrong_questions)}
          detail="Theo kết quả gần nhất của từng câu" icon="flag" tone="red" />
      </dl>
    </section>
  )
}

const wrongQuestionsSchema = pageSchema(questionSchema)

export function ExamReviewTopics({ sessionId }: ExamStatisticsProps) {
  const wrongQuestions = useQuery({
    queryKey: ['account', sessionId, 'wrong', 'overview'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/practice/wrong-questions', wrongQuestionsSchema,
      { signal, params: { page: 1, limit: 5 } }),
  })
  const items = wrongQuestions.data?.data
  return (
    <div className="study-history-insights">
      <TopicProgress sessionId={sessionId} />
      <section className="learner-card study-history-review">
        <span className="study-icon-tile" data-tone="red"><StudyIcon name="repeat" /></span>
        <h2>Câu cần ôn lại</h2>
        <p>Các câu sai hoặc bỏ trống ở lần làm gần nhất.</p>
        {wrongQuestions.isPending && <p role="status">Đang tải câu cần ôn lại…</p>}
        {wrongQuestions.isError && <LearnerError message="Chưa tải được câu cần ôn lại." retry={() => void wrongQuestions.refetch()} />}
        {items && (items.length === 0 ? <p>Chưa có câu cần ôn lại trong hạng đang ôn.</p> : <ul className="study-review-questions">
          {items.map((item) => <li key={item.id}>
            {item.is_critical && <span className="study-chip" data-tone="red">Điểm liệt</span>}
            <strong>{item.title || item.content}</strong>
          </li>)}
        </ul>)}
        <Link className="button-link study-primary-link" to="/practice/wrong">Luyện lại câu sai <StudyIcon name="arrow" /></Link>
        <Link className="button-link" to="/practice/wrong?critical=true">Ôn lại câu điểm liệt đã sai</Link>
      </section>
    </div>
  )
}
