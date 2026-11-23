import { Suspense } from 'react'
import { Link, matchPath, Outlet, useLocation } from 'react-router'
import { StudyFooter, StudyHeader } from './StudyChrome'
import './study-theme.css'
import './learning.css'

export function LearnerLayout({ sessionId }: Readonly<{ sessionId: number }>) {
  const { pathname } = useLocation()
  return (
    <div className="study-app" data-dashboard={Boolean(matchPath('/dashboard', pathname)) || undefined}>
      <StudyHeader sessionId={sessionId} />
      <main id="main-content" className="learner" tabIndex={-1}>
        <Suspense fallback={<p role="status">Đang tải trang…</p>}><Outlet /></Suspense>
      </main>
      <StudyFooter />
    </div>
  )
}

export function LearnerError({ message = 'Chưa tải được dữ liệu.', retry }: { message?: string; retry?: () => void }) {
  return (
    <div className="learner-error" role="alert">
      <p>{message}</p>
      {retry && <button type="button" onClick={retry}>Thử lại</button>}
    </div>
  )
}

export function Pagination({ page, limit, total, onPage }: {
  page: number; limit: number; total: number; onPage: (page: number) => void
}) {
  const pages = Math.ceil(total / limit)
  if (pages < 2 && page === 1) return null
  return (
    <nav className="learner-actions" aria-label="Phân trang">
      <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)}>Trang trước</button>
      <span>Trang {page} / {Math.max(1, pages)}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>Trang sau</button>
    </nav>
  )
}

export function DashboardLink() {
  return <Link className="button-link" to="/dashboard">Đổi hạng bằng</Link>
}
