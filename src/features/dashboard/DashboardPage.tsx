import { Link } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import { useStudyProfile } from '../auth/useStudyProfile'
import { useStudyProgress } from './dashboard-api'
import { LicensePicker } from './LicensePicker'
import { StudyActivities } from './StudyActivities'
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
  const progress = useStudyProgress(sessionId)

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
      <div className="dashboard-section-heading">
        <div><h2 id="progress-heading"><StudyIcon name="chart" /> Tiến độ ôn tập</h2><p>Thống kê câu hỏi và lượt thi đã làm</p></div>
        <span className="study-chip">{data.license_type ? `Hạng ${data.license_type}` : 'Tất cả hạng bằng lái'}</span>
      </div>
      {data.total_questions > 0 ? (
        <div className="dashboard-progress">
          <div>
            <label htmlFor="study-completion">
              <strong>{numbers.format(data.mastered_questions)}</strong><span>/{numbers.format(data.total_questions)}</span> câu đã đạt
            </label>
            <b>{percentage}</b>
          </div>
          <progress id="study-completion" max={100} value={data.completion_percentage} aria-valuetext={percentage} />
        </div>
      ) : <p className="dashboard-empty">Chưa có câu hỏi được xuất bản trong phạm vi này.</p>}
      <dl className="dashboard-stats">
        <div data-tone="amber"><dt>Câu cần ôn lại</dt><dd>{numbers.format(data.wrong_questions)}</dd></div>
        <div data-tone="blue"><dt>Câu chưa làm</dt><dd>{numbers.format(data.unattempted_questions)}</dd></div>
        <div><dt>Lượt thi đã kết thúc</dt><dd>{numbers.format(data.completed_exams)}</dd></div>
      </dl>
    </>
  )
}

export function DashboardPage({ sessionId }: Readonly<{ sessionId: number }>) {
  const profile = useStudyProfile(sessionId)

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <h1>Bảng điều khiển</h1>
          {profile.data && <p>Chào mừng trở lại, <strong>{profile.data.name}</strong>!</p>}
        </div>
        {profile.data?.current_license_type && (
          <a className="dashboard-current-license" href="#profile-heading">
            <span className="study-icon-tile"><StudyIcon name="clipboard" /></span>
            <span><small>Hạng đang ôn</small><strong>Hạng {profile.data.current_license_type}</strong></span>
          </a>
        )}
      </header>
      {profile.isPending && <p className="dashboard-feedback" role="status">Đang tải hồ sơ…</p>}
      {profile.isError && (
        <RetryNotice message="Chưa tải được hồ sơ." busy={profile.isFetching} onRetry={() => void profile.refetch()} />
      )}
      {profile.data && (
        <div className="dashboard-grid">
          <section className="dashboard-panel dashboard-progress-panel" aria-label="Tiến độ ôn tập">
            <StudyProgress sessionId={sessionId} />
          </section>
          <StudyActivities />
          <aside className="dashboard-aside">
            <section className="dashboard-panel" aria-labelledby="profile-heading">
              <div className="dashboard-section-heading">
                <div><h2 id="profile-heading"><StudyIcon name="user" /> Tài khoản</h2><p>Thông tin cá nhân và cài đặt ôn thi</p></div>
              </div>
              <dl className="dashboard-profile">
                <div><dt>Họ và tên</dt><dd>{profile.data.name}</dd></div>
                <div><dt>Địa chỉ email</dt><dd>{profile.data.email}</dd></div>
                <div><dt>Hạng bằng đang ôn</dt><dd>{profile.data.current_license_type || 'Chưa chọn'}</dd></div>
              </dl>
              <LicensePicker sessionId={sessionId} profile={profile.data} />
            </section>
            <section className="dashboard-tip">
              <StudyIcon name="bulb" />
              <h2>Mẹo ôn thi hiệu quả</h2>
              <p>Ôn lại những câu đã làm sai trước khi bắt đầu lượt thi tiếp theo.</p>
              <Link to="/practice/wrong">Ôn lại câu sai <StudyIcon name="arrow" /></Link>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
