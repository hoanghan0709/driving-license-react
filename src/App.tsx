import { lazy } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { AuthPage } from './features/auth/AuthPage'
import { useSessionId } from './features/auth/auth-session'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LearnerLayout } from './features/learning/LearnerLayout'
import { HomePage } from './features/home/HomePage'
import { SystemCheckPage } from './features/system-check/SystemCheckPage'

const PracticePage = lazy(() => import('./features/learning/PracticePage').then((module) => ({ default: module.PracticePage })))
const RoadSignsPage = lazy(() => import('./features/learning/RoadSignsPage').then((module) => ({ default: module.RoadSignsPage })))
const RoadSignPage = lazy(() => import('./features/learning/RoadSignsPage').then((module) => ({ default: module.RoadSignPage })))
const ExamCatalogPage = lazy(() => import('./features/exams/ExamCatalogPage').then((module) => ({ default: module.ExamCatalogPage })))
const ExamHistoryPage = lazy(() => import('./features/exams/ExamHistoryPage').then((module) => ({ default: module.ExamHistoryPage })))
const ExamPage = lazy(() => import('./features/exams/ExamPage').then((module) => ({ default: module.ExamPage })))

function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const { pathname } = useLocation()

  return (
    <header className="site-header" id="page-top">
      <a className="site-skip-link" href="#main-content">Đến nội dung chính</a>
      <div className="site-header-content page-width">
        <Link to="/" className="site-brand">
          <span className="site-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round">
              <path d="M8.5 4 4 20m11.5-16L20 20M12 4v3m0 3.5v3m0 3.5v3" />
            </svg>
          </span>
          Ôn thi bằng lái
        </Link>
        <nav className="site-nav" aria-label="Điều hướng chính">
          <NavLink to="/" end>Trang chủ</NavLink>
          {pathname === '/' && <a href="#study-roadmap">Lộ trình ôn tập</a>}
          <NavLink to="/system-check">Kiểm tra hệ thống</NavLink>
        </nav>
        <NavLink to={signedIn ? '/dashboard' : '/login'} className="site-account-link">
          {signedIn ? 'Bảng điều khiển' : 'Đăng nhập'}
        </NavLink>
      </div>
    </header>
  )
}

function NotFoundPage() {
  return (
    <>
      <h1 className="text-4xl font-bold">Không tìm thấy trang</h1>
      <Link className="button-link mt-6" to="/">
        Về trang chủ
      </Link>
    </>
  )
}

function LegacyRoute({ pathname }: { pathname: string }) {
  const { search, hash, state } = useLocation()
  return <Navigate to={{ pathname, search, hash }} state={state} replace />
}

export default function App() {
  const sessionId = useSessionId()

  return (
    <>
      <SiteHeader signedIn={sessionId !== null} />
      <Routes>
        <Route index element={<HomePage studyPath={sessionId === null ? '/login' : '/dashboard'} />} />
        <Route path="login" element={
          sessionId === null ? <AuthPage key="login" mode="login" /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="register" element={
          sessionId === null ? <AuthPage key="register" mode="register" /> : <Navigate to="/dashboard" replace />
        } />
        <Route path="dashboard" element={
          sessionId === null ? <Navigate to="/login" replace /> : <DashboardPage sessionId={sessionId} />
        } />
        <Route element={sessionId === null ? <Navigate to="/login" replace /> : <LearnerLayout key={sessionId} />}>
          <Route path="practice" element={sessionId !== null && <PracticePage key="all" sessionId={sessionId} />} />
          <Route path="practice/wrong" element={sessionId !== null && <PracticePage key="wrong" sessionId={sessionId} wrong />} />
          <Route path="road-signs" element={sessionId !== null && <RoadSignsPage sessionId={sessionId} />} />
          <Route path="road-signs/:id" element={sessionId !== null && <RoadSignPage sessionId={sessionId} />} />
          <Route path="exams" element={sessionId !== null && <ExamCatalogPage sessionId={sessionId} />} />
          <Route path="exams/history" element={sessionId !== null && <ExamHistoryPage sessionId={sessionId} />} />
          <Route path="exams/:id" element={sessionId !== null && <ExamPage sessionId={sessionId} />} />
        </Route>
        <Route path="system-check" element={
          <main id="main-content" tabIndex={-1} className="page-width py-[var(--section-space)]">
            <SystemCheckPage />
          </main>
        } />
        <Route path="dang-nhap" element={<LegacyRoute pathname="/login" />} />
        <Route path="dang-ky" element={<LegacyRoute pathname="/register" />} />
        <Route path="kiem-tra" element={<LegacyRoute pathname="/system-check" />} />
        <Route path="*" element={
          <main id="main-content" tabIndex={-1} className="page-width py-[var(--section-space)]">
            <NotFoundPage />
          </main>
        } />
      </Routes>
    </>
  )
}
