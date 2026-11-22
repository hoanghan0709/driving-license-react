import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getProfile } from '../auth/auth-api'
import { endSession, withSession } from '../auth/auth-session'
import { getProgress } from './dashboard-api'
import { LicensePicker } from './LicensePicker'
import './dashboard.css'

const numbers = new Intl.NumberFormat('vi-VN')
const percentages = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 })

function RetryNotice({ message, busy, onRetry }: { message: string; busy: boolean; onRetry: () => void }) {
  return (
    <div className="dashboard-feedback">
      <p role="alert">{message}</p>
      <button type="button" className="account-outline-button" disabled={busy} onClick={onRetry}>
        {busy ? 'Đang thử lại…' : 'Thử lại'}
      </button>
    </div>
  )
}

function StudyProgress({ sessionId }: { sessionId: number }) {
  const progress = useQuery({
    queryKey: ['account', sessionId, 'progress'],
    queryFn: ({ signal }) => withSession(sessionId, (token) => getProgress(token, signal)),
    gcTime: 0,
    retry: false,
  })

  if (progress.isPending) return <p role="status">Đang tải tiến độ ôn tập…</p>
  if (!progress.data) {
    return <RetryNotice message="Chưa tải được tiến độ ôn tập." busy={progress.isFetching} onRetry={() => void progress.refetch()} />
  }

  const data = progress.data
  const percentage = percentages.format(data.completion_percentage / 100)
  return (
    <>
      {progress.isError && (
        <RetryNotice message="Chưa cập nhật được tiến độ ôn tập." busy={progress.isFetching} onRetry={() => void progress.refetch()} />
      )}
      <p className="dashboard-scope">{data.license_type ? `Hạng ${data.license_type}` : 'Tất cả hạng bằng lái'}</p>
      {data.total_questions > 0 ? (
        <div className="dashboard-progress">
          <div>
            <label htmlFor="study-completion">
              <strong>{numbers.format(data.mastered_questions)}/{numbers.format(data.total_questions)}</strong> câu đã đạt
            </label>
            <span>{percentage}</span>
          </div>
          <progress id="study-completion" max={100} value={data.completion_percentage} aria-valuetext={percentage} />
        </div>
      ) : <p className="dashboard-empty">Chưa có câu hỏi được xuất bản trong phạm vi này.</p>}
      <dl className="dashboard-stats">
        <div><dt>Câu cần ôn lại</dt><dd>{numbers.format(data.wrong_questions)}</dd></div>
        <div><dt>Câu chưa làm</dt><dd>{numbers.format(data.unattempted_questions)}</dd></div>
        <div><dt>Lượt thi đã kết thúc</dt><dd>{numbers.format(data.completed_exams)}</dd></div>
      </dl>
    </>
  )
}

export function DashboardPage({ sessionId }: { sessionId: number }) {
  const profile = useQuery({
    queryKey: ['account', sessionId, 'profile'],
    queryFn: ({ signal }) => withSession(sessionId, (token) => getProfile(token, signal)),
    gcTime: 0,
    retry: false,
  })

  return (
    <main id="main-content" className="page-width dashboard" tabIndex={-1}>
      <header className="dashboard-heading">
        <div>
          <h1>Bảng điều khiển</h1>
          {profile.data && <p>Chào {profile.data.name}!</p>}
        </div>
        <button className="account-outline-button" type="button" onClick={endSession}>Đăng xuất</button>
      </header>
      {profile.isPending && <p className="dashboard-feedback" role="status">Đang tải hồ sơ…</p>}
      {profile.isError && (
        <RetryNotice message="Chưa tải được hồ sơ." busy={profile.isFetching} onRetry={() => void profile.refetch()} />
      )}
      {profile.data && (
        <div className="dashboard-grid">
          <section aria-labelledby="progress-heading">
            <h2 id="progress-heading">Tiến độ ôn tập</h2>
            <StudyProgress sessionId={sessionId} />
            <nav className="dashboard-links" aria-label="Hoạt động ôn tập">
              <Link className="button-link" to="/practice">Luyện câu hỏi</Link>
              <Link className="button-link" to="/practice/wrong">Câu cần ôn lại</Link>
              <Link className="button-link" to="/road-signs">Biển báo</Link>
              <Link className="button-link" to="/exams">Thi thử</Link>
              <Link className="button-link" to="/exams/history">Lịch sử thi</Link>
              <Link className="button-link" to="/#study-roadmap">Xem lộ trình ôn tập</Link>
            </nav>
          </section>
          <section aria-labelledby="profile-heading">
            <h2 id="profile-heading">Tài khoản</h2>
            <dl className="dashboard-profile">
              <div><dt>Họ và tên</dt><dd>{profile.data.name}</dd></div>
              <div><dt>Email</dt><dd>{profile.data.email}</dd></div>
              <div><dt>Hạng bằng đang ôn</dt><dd>{profile.data.current_license_type || 'Chưa chọn'}</dd></div>
            </dl>
            <LicensePicker sessionId={sessionId} profile={profile.data} />
          </section>
        </div>
      )}
    </main>
  )
}
