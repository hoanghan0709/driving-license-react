import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { countSchema, idSchema, learnerRequest } from '../../services/learner-api'

export const answerSchema = z.object({
  id: idSchema,
  content: z.string(),
  label: z.string(),
  is_correct: z.boolean().optional(),
})

export const questionSchema = z.object({
  id: idSchema,
  title: z.string(),
  content: z.string(),
  image: z.string(),
  is_critical: z.boolean(),
  category_id: countSchema.optional(),
  explanation: z.string().optional(),
  selected_answer_id: idSchema.optional(),
  is_correct: z.boolean().optional(),
  answers: z.array(answerSchema),
})

export const feedbackSchema = z.object({
  attempt: z.object({ answer_id: idSchema, is_correct: z.boolean() }),
  question: questionSchema,
})

export const categoriesSchema = z.object({
  data: z.array(z.object({ id: idSchema, name: z.string() })).nullable().transform((rows) => rows ?? []),
})

export const signSchema = z.object({
  id: idSchema,
  code: z.string(),
  name: z.string(),
  image: z.string(),
  meaning: z.string(),
  sign_type: z.string().optional(),
  description: z.string(),
  license_type: z.string(),
})

export type Question = z.infer<typeof questionSchema>

export type RoadSign = z.infer<typeof signSchema>

export function useStudyCategories(sessionId: number, type = '') {
  return useQuery({
    queryKey: ['account', sessionId, 'categories', type],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/categories', categoriesSchema, { signal, params: { category_type: type } }),
  })
}
