import { useEffect } from 'react'
import type { Question } from '../learning/learning-api'

type ExamShortcuts = Readonly<{
  question?: Question
  previous?: number
  next?: number
  blocked: boolean
  dialogOpen: () => boolean
  selectQuestion: (id: number) => void
  selectAnswer: (id: number, answer: number) => void
}>

export function useExamShortcuts({ question, previous, next, blocked, dialogOpen, selectQuestion, selectAnswer }: ExamShortcuts) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
        event.repeat || dialogOpen() || !question ||
        (event.target instanceof Element && event.target.closest('input, select, textarea, button, a, [contenteditable]'))) return

      const adjacent = event.key === 'ArrowLeft' ? previous : event.key === 'ArrowRight' ? next : undefined
      if (adjacent !== undefined) {
        event.preventDefault()
        selectQuestion(adjacent)
      } else if (!blocked && /^[1-9]$/.test(event.key)) {
        const answer = question.answers[Number(event.key) - 1]
        if (answer && answer.id !== question.selected_answer_id) {
          event.preventDefault()
          selectAnswer(question.id, answer.id)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, previous, next, blocked, dialogOpen, selectQuestion, selectAnswer])
}
