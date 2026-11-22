import { z } from 'zod'
import { idSchema } from '../../services/learner-api'

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
  description: z.string(),
  license_type: z.string(),
})

export type Question = z.infer<typeof questionSchema>
