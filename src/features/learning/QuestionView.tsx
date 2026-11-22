import { useId } from 'react'
import { mediaUrl } from '../../services/learner-api'
import type { Question } from './learning-api'

export function QuestionView({ question, selected, onSelect, disabled, reveal = false, number }: {
  question: Question; selected?: number; onSelect?: (id: number) => void
  disabled?: boolean; reveal?: boolean; number?: number
}) {
  const group = useId()
  const image = mediaUrl(question.image)
  return (
    <article className="learner-card">
      <h2>{number !== undefined && `Câu ${number}. `}{question.title || 'Câu hỏi'}</h2>
      {question.content !== question.title && <p className="learner-content">{question.content}</p>}
      {question.is_critical && <p className="learner-meta">Câu điểm liệt</p>}
      {image && <img className="learner-image" src={image} alt="Hình minh họa câu hỏi" />}
      <fieldset className="learner-options" disabled={disabled}>
        <legend>{reveal ? 'Đáp án và lựa chọn' : 'Chọn đáp án'}</legend>
        {question.answers.map((answer) => (
          <label className="learner-option" key={answer.id}>
            {onSelect && <input type="radio" name={group} checked={selected === answer.id} onChange={() => onSelect(answer.id)} />}
            <span>{answer.label}. {answer.content}
              {reveal && answer.is_correct && <strong> · Đáp án đúng</strong>}
              {reveal && selected === answer.id && <strong> · Đã chọn</strong>}
            </span>
          </label>
        ))}
      </fieldset>
      {reveal && question.explanation && <p className="learner-content"><strong>Giải thích</strong><br />{question.explanation}</p>}
    </article>
  )
}
