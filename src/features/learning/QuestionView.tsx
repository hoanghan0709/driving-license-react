import { useId } from 'react'
import type { ReactNode } from 'react'
import { mediaUrl } from '../../services/learner-api'
import type { Question } from './learning-api'

export function QuestionView({ question, selected, onSelect, disabled, reveal = false, number, children }: {
  question: Question; selected?: number; onSelect?: (id: number) => void
  disabled?: boolean; reveal?: boolean; number?: number; children?: ReactNode
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
        {question.answers.map((answer) => {
          const checked = selected === answer.id
          const correct = reveal && answer.is_correct === true
          const incorrect = reveal && checked && answer.is_correct === false
          const Option = onSelect ? 'label' : 'div'
          return (
            <Option className="learner-option" key={answer.id}
              data-feedback={correct ? 'correct' : incorrect ? 'incorrect' : undefined}>
              {onSelect && <input type="radio" name={group} checked={checked} onChange={() => onSelect(answer.id)} />}
              <span>{answer.label}. {answer.content}
                {correct && <strong> · Đáp án đúng</strong>}
                {reveal && checked && <strong> · {incorrect ? 'Đã chọn sai' : 'Đã chọn'}</strong>}
              </span>
            </Option>
          )
        })}
      </fieldset>
      {reveal && question.explanation && <p className="learner-content"><strong>Giải thích</strong><br />{question.explanation}</p>}
      {children && <div className="learner-question-footer">{children}</div>}
    </article>
  )
}
