import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

const api = axios.create({
  baseURL: configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8000' : ''),
})

api.interceptors.request.use((config) => {
  if (import.meta.env.PROD && !configuredApiUrl) {
    return Promise.reject(new Error('Backend API URL is not configured. Set VITE_API_URL in Vercel and redeploy.'))
  }
  const token = localStorage.getItem('bhusutra_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
