import { z } from 'zod'
import { getAuthenticated } from '../auth/auth-api'

const count = z.number().int().nonnegative()
const progressSchema = z.object({
  license_type: z.string(),
  total_questions: count,
  mastered_questions: count,
  wrong_questions: count,
  unattempted_questions: count,
  completion_percentage: z.number().min(0).max(100),
  completed_exams: count,
})

export function getProgress(accessToken: string, signal?: AbortSignal) {
  return getAuthenticated('/api/v1/progress', progressSchema, accessToken, signal)
}
