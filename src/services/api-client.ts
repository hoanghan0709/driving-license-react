import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/backend',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
