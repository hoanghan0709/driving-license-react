import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { apiClient } from '../../services/api-client'

const healthSchema = z.object({ status: z.literal('ok') })

export const healthQueryOptions = queryOptions({
  queryKey: ['backend-health'],
  queryFn: async ({ signal }) => {
    const { data } = await apiClient.get<unknown>('/health', { signal })
    return healthSchema.parse(data)
  },
  enabled: false,
  retry: false,
  networkMode: 'always',
})
