import { useEffect, useRef } from 'react'
import { StudyIcon } from '../../components/StudyIcon'

type StudySearchProps = Readonly<{
  label: string
  placeholder: string
  value: string
  onSearch: (term: string) => void
  submitLabel?: string
  shortcut?: boolean
  maxLength?: number
}>

export function StudySearch({ label, placeholder, value, onSearch, submitLabel = 'Tìm', shortcut, maxLength }: StudySearchProps) {
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (input.current) input.current.value = value
  }, [value])

  useEffect(() => {
    if (!shortcut) return
    function focusSearch(event: KeyboardEvent) {
      if (!event.defaultPrevented && (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [shortcut])

  return (
    <form className="study-search" onSubmit={(event) => {
      event.preventDefault()
      onSearch(input.current?.value.trim() ?? '')
    }}>
      <label><StudyIcon name="search" /><span className="sr-only">{label}</span>
        <input ref={input} type="search" defaultValue={value} placeholder={placeholder} maxLength={maxLength}
          aria-keyshortcuts={shortcut ? 'Control+k Meta+k' : undefined} />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}
