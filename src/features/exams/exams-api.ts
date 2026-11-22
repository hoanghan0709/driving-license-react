import { z } from 'zod'
import { countSchema, dateSchema, idSchema, learnerRequest } from '../../services/learner-api'
import { questionSchema } from '../learning/learning-api'

const namedExam = z.object({ id: idSchema, name: z.string(), license_type: z.string() })
const configSchema = z.object({
  duration_minutes: idSchema,
  passing_score: idSchema,
})
export const testSchema = namedExam.extend(configSchema.shape).extend({
  total_questions: idSchema, description: z.string(),
})
export const templateSchema = namedExam.extend({
  config: configSchema.extend({
    quotas: z.array(z.object({ count: idSchema })),
  }),
})

export const historySchema = z.object({
  id: idSchema,
  license_type: z.string(),
  status: z.enum(['DOING', 'COMPLETED', 'TIMEOUT']),
  started_at: dateSchema,
  score: countSchema,
  passing_score: countSchema,
  is_passed: z.boolean(),
})

const examSchema = historySchema.omit({ license_type: true }).extend({
  expires_at: dateSchema,
  server_time: dateSchema,
  total_questions: countSchema,
  correct_answers: countSchema,
  failure_reason: z.string().optional(),
  exam: z.object({
    name: z.string(),
    license_type: z.string(),
    version: z.string(),
    questions: z.array(questionSchema),
  }),
})

export type ExamView = Awaited<ReturnType<typeof requestExam>>

export async function requestExam(
  session: number,
  path: string,
  options?: Parameters<typeof learnerRequest>[3],
) {
  const exam = await learnerRequest(session, path, examSchema, options)
  return { ...exam, deadline: performance.now() + Date.parse(exam.expires_at) - Date.parse(exam.server_time) }
}
