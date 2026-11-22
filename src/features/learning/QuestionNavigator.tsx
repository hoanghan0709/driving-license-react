import type { ReactNode } from 'react'

type QuestionItem = { id: number; number: number; answered?: boolean }

export function QuestionNavigator({ items, activeId, onSelect, disabled, children }: {
  items: QuestionItem[]
  activeId: number
  onSelect: (id: number) => void
  disabled?: boolean
  children?: ReactNode
}) {
  return (
    <aside className="learner-question-sidebar">
      <h2>Danh sách câu hỏi</h2>
      <nav aria-label="Danh sách câu hỏi">
        <ol className="learner-question-grid">
          {items.map(({ id, number, answered }) => (
            <li key={id}>
              <button type="button" aria-current={id === activeId ? 'true' : undefined}
                aria-label={`Câu ${number}${answered ? ' · Đã trả lời' : ''}`}
                data-answered={answered || undefined} disabled={disabled} onClick={() => onSelect(id)}>
                {number}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {children}
    </aside>
  )
}
