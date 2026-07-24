// API client for KSP CrimeIntel backend
import axios from 'axios'

const BASE = '/api'

const api = axios.create({ baseURL: BASE, timeout: 60000 })

// Attach auth token
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ksp_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auth
export const login  = (username, password) => {
  const form = new FormData()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const getMe  = ()   => api.get('/auth/me')

// Chat
export const sendChat = (message, context = []) =>
  api.post('/chat', { message, context })

// Dashboard
export const getKPIs     = () => api.get('/dashboard/kpis')
export const getOverview = () => api.get('/dashboard/overview')

// Analytics
export const getHotspots   = (params) => api.get('/analytics/hotspots', { params })
export const getTrends     = (params) => api.get('/analytics/trends',   { params })
export const getCompare    = (params) => api.get('/analytics/compare',  { params })
export const getPredict    = (params) => api.get('/analytics/predict',  { params })
export const getNetwork    = (params) => api.get('/analytics/network',  { params })
export const getSocio      = ()       => api.get('/analytics/socio')
export const getVictim     = (params) => api.get('/analytics/victim-profile', { params })
export const getMonthly    = (params) => api.get('/analytics/monthly',  { params })
export const getConviction = (params) => api.get('/analytics/conviction', { params })
export const getBreakdown  = (params) => api.get('/analytics/breakdown', { params })
export const getOffenders  = (params) => api.get('/analytics/offenders', { params })
export const getAlerts     = (params) => api.get('/analytics/alerts', { params })
export const getAudit      = (params) => api.get('/analytics/audit', { params })
export const getSimilarity = (id)     => api.get(`/fir/${id}/similar`)
export const getFIR        = (params) => api.get('/fir', { params })

// Meta
export const getDistricts   = () => api.get('/meta/districts')
export const getCrimeGroups = () => api.get('/meta/crime-groups')

export default api
