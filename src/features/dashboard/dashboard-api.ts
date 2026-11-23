import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { countSchema, dateSchema, idSchema, learnerRequest } from '../../services/learner-api'

const count = countSchema
const progressSchema = z.object({
  license_type: z.string(),
  total_questions: count,
  mastered_questions: count,
  wrong_questions: count,
  unattempted_questions: count,
  completion_percentage: z.number().min(0).max(100),
  completed_exams: count,
  passed_exams: count,
  pass_rate: z.number().min(0).max(100),
  categories: z.array(z.object({
    category_id: count,
    attempts: count,
    correct: count,
    accuracy: z.number().min(0).max(100),
  })),
  recent_exams: z.array(z.object({
    id: idSchema,
    finished_at: dateSchema.nullable(),
    score: count,
    total: count,
    passed: z.boolean(),
  })),
})

export function useStudyProgress(sessionId: number) {
  return useQuery({
    queryKey: ['account', sessionId, 'progress'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/progress', progressSchema, { signal }),
    gcTime: 0,
    retry: false,
  })
}
