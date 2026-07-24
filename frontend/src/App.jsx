import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import LoginPage     from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ChatPage      from './pages/ChatPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import NetworkPage   from './pages/NetworkPage.jsx'
import OffenderPage  from './pages/OffenderPage.jsx'
import CaseExplorerPage from './pages/CaseExplorerPage.jsx'
import AlertsPage    from './pages/AlertsPage.jsx'
import AuditPage     from './pages/AuditPage.jsx'
import RegisterFIRPage from './pages/RegisterFIRPage.jsx'
import AdminPage     from './pages/AdminPage.jsx'
import Sidebar       from './components/Sidebar.jsx'
import Header        from './components/Header.jsx'

function ProtectedLayout({ children, title }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="spinner spinner-md" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Header title={title} />
        <div className="page-body">
          {children}
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/chat" replace /> : <LoginPage />} />
      <Route path="/"         element={<Navigate to="/chat" replace />} />
      <Route path="/dashboard" element={
        <ProtectedLayout title="Dashboard">
          <DashboardPage />
        </ProtectedLayout>
      } />
      <Route path="/chat" element={
        <ProtectedLayout title="Crime Intelligence Chat">
          <ChatPage />
        </ProtectedLayout>
      } />
      <Route path="/analytics" element={
        <ProtectedLayout title="Deep Analytics">
          <AnalyticsPage />
        </ProtectedLayout>
      } />
      <Route path="/network" element={
        <ProtectedLayout title="Criminal Network Explorer">
          <NetworkPage />
        </ProtectedLayout>
      } />
      <Route path="/offenders" element={
        <ProtectedLayout title="Offender Profiling">
          <OffenderPage />
        </ProtectedLayout>
      } />
      <Route path="/cases" element={
        <ProtectedLayout title="Case Explorer">
          <CaseExplorerPage />
        </ProtectedLayout>
      } />
      <Route path="/audit" element={
        <ProtectedLayout title="Query Audit Log">
          <AuditPage />
        </ProtectedLayout>
      } />
      <Route path="/admin" element={
        <ProtectedLayout title="System Administration">
          <AdminPage />
        </ProtectedLayout>
      } />
      <Route path="/register" element={
        <ProtectedLayout title="New FIR Entry">
          <RegisterFIRPage />
        </ProtectedLayout>
      } />
      <Route path="/alerts" element={
        <ProtectedLayout title="Early Warning Alerts">
          <AlertsPage />
        </ProtectedLayout>
      } />

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
