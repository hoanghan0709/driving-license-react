import { useEffect, useRef, useState } from 'react'

export function usePracticeSound() {
  const [enabled, setEnabled] = useState(false)
  const context = useRef<AudioContext | undefined>(undefined)

  useEffect(() => () => {
    void context.current?.close().catch(() => undefined)
    context.current = undefined
  }, [])

  async function enable(next: boolean) {
    if (!next) {
      setEnabled(false)
      return
    }
    try {
      context.current ??= new AudioContext()
      await context.current.resume()
      setEnabled(context.current.state === 'running')
    } catch {
      setEnabled(false)
    }
  }

  function play(correct: boolean) {
    const audio = context.current
    if (!enabled || audio?.state !== 'running') return
    const note = audio.createOscillator()
    const envelope = audio.createGain()
    const now = audio.currentTime
    note.frequency.value = correct ? 660 : 330
    envelope.gain.setValueAtTime(.07, now)
    envelope.gain.exponentialRampToValueAtTime(.001, now + .18)
    note.connect(envelope).connect(audio.destination)
    note.start(now)
    note.stop(now + .18)
  }

  return { enabled, enable, play }
}
