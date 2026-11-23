import { StudyIcon } from '../../components/StudyIcon'
import { useStudyProgress } from '../dashboard/dashboard-api'
import { LearnerError } from './LearnerLayout'
import { useStudyCategories } from './learning-api'
import './topic-progress.css'

const percent = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

type TopicProgressProps = Readonly<{ sessionId: number; onTopic?: (id: number) => void }>

export function TopicProgress({ sessionId, onTopic }: TopicProgressProps) {
  const progress = useStudyProgress(sessionId)
  const categories = useStudyCategories(sessionId)
  const registry = new Map(categories.data?.data.map(({ id, name }) => [id, name]))
  const topics = progress.data?.categories.filter((item) => registry.has(item.category_id)) ?? []

  return (
    <section className="learner-card study-topic-progress" aria-labelledby="topic-progress">
      <h2 id="topic-progress"><StudyIcon name="chart" /> Độ chính xác theo chủ đề</h2>
      {(progress.isPending || categories.isPending) && <p role="status">Đang tải tiến độ theo chủ đề…</p>}
      {progress.isError && <LearnerError message="Chưa tải được tiến độ ôn tập." retry={() => void progress.refetch()} />}
      {categories.isError && <LearnerError message="Chưa tải được chủ đề." retry={() => void categories.refetch()} />}
      {progress.data && categories.data && topics.length === 0 && <p>Chưa có kết quả theo chủ đề để hiển thị.</p>}
      {topics.length > 0 && <ul>
        {topics.map(({ category_id: id, attempts, correct, accuracy }) => (
          <li key={id}>
            <div><strong>{registry.get(id)}</strong><strong>{percent.format(accuracy)}%</strong></div>
            <progress className="study-meter" max={100} value={accuracy} aria-label={registry.get(id)} />
            <div className="learner-meta"><span>{correct}/{attempts} lượt trả lời đúng</span>
              {onTopic && <button type="button" onClick={() => onTopic(id)}>Ôn chủ đề</button>}
            </div>
          </li>
        ))}
      </ul>}
    </section>
  )
}
