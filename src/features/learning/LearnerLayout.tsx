import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import './learning.css'

export function LearnerLayout() {
  return (
    <main id="main-content" className="page-width learner" tabIndex={-1}>
      <nav className="learner-nav" aria-label="Khu vực ôn tập">
        <NavLink to="/practice" end>Luyện câu hỏi</NavLink>
        <NavLink to="/practice/wrong">Câu cần ôn lại</NavLink>
        <NavLink to="/road-signs">Biển báo</NavLink>
        <NavLink to="/exams" end>Thi thử</NavLink>
        <NavLink to="/exams/history">Lịch sử thi</NavLink>
      </nav>
      <Suspense fallback={<p role="status">Đang tải trang…</p>}><Outlet /></Suspense>
    </main>
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
  return <Link className="button-link" to="/dashboard">Đổi hạng bằng trong bảng điều khiển</Link>
}
