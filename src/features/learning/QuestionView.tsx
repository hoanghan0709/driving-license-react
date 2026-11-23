import { useId } from 'react'
import type { ReactNode } from 'react'
import { mediaUrl } from '../../services/learner-api'
import type { Question } from './learning-api'

type QuestionViewProps = Readonly<{
  question: Question; selected?: number; onSelect?: (id: number) => void
  disabled?: boolean; reveal?: boolean; number?: number; children?: ReactNode
  showExplanation?: boolean; topic?: string; tools?: ReactNode
}>

export function QuestionView({ question, selected, onSelect, disabled, reveal = false, number, children, showExplanation = true, topic, tools }: QuestionViewProps) {
  const group = useId()
  const image = mediaUrl(question.image)
  return (
    <article className="learner-card">
      <div className="study-question-labels">
        {number !== undefined && <span className="study-chip">Câu {number}</span>}
        {topic && <span className="study-chip">{topic}</span>}
        {question.is_critical && <span className="study-chip" data-tone="red">Câu điểm liệt</span>}
        {tools && <div className="study-question-tools">{tools}</div>}
      </div>
      <h2 className="learner-content">{question.title.trim() || question.content || 'Câu hỏi'}</h2>
      {question.title.trim() && question.content !== question.title && <p className="learner-content">{question.content}</p>}
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
              <span><span className="study-option-letter">{answer.label}</span> {answer.content}
                {correct && <strong> · Đáp án đúng</strong>}
                {reveal && checked && <strong> · {incorrect ? 'Đã chọn sai' : 'Đã chọn'}</strong>}
              </span>
            </Option>
          )
        })}
      </fieldset>
      {reveal && showExplanation && question.explanation && <p className="learner-content study-explanation"><strong>Giải thích</strong><br />{question.explanation}</p>}
      {children && <div className="learner-question-footer">{children}</div>}
    </article>
  )
}
