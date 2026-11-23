import { useQuery } from '@tanstack/react-query'
import { getProfile } from './auth-api'
import { withSession } from './auth-session'

export function useStudyProfile(sessionId: number) {
  return useQuery({
    queryKey: ['account', sessionId, 'profile'],
    queryFn: ({ signal }) => withSession(sessionId, (token) => getProfile(token, signal)),
    gcTime: 0,
    retry: false,
  })
}
