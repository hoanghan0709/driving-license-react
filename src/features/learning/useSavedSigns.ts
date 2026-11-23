import { useState } from 'react'
import { z } from 'zod'
import { signSchema } from './learning-api'

const savedSignSchema = signSchema.pick({ id: true, code: true, name: true, license_type: true })
const savedSignsSchema = z.array(savedSignSchema)
export type SavedSign = z.infer<typeof savedSignSchema>

export function useSavedSigns(profileId: number) {
  const key = `study-saved-signs:${profileId}`
  const [items, setItems] = useState<SavedSign[]>(() => {
    try {
      return savedSignsSchema.safeParse(JSON.parse(localStorage.getItem(key) ?? '[]')).data ?? []
    } catch {
      return []
    }
  })
  const [saveError, setSaveError] = useState(false)

  function toggle(sign: SavedSign) {
    const next = items.some(({ id }) => id === sign.id)
      ? items.filter(({ id }) => id !== sign.id)
      : [...items, savedSignSchema.parse(sign)]
    try {
      localStorage.setItem(key, JSON.stringify(next))
      setItems(next)
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }

  return { items, toggle, saveError }
}
