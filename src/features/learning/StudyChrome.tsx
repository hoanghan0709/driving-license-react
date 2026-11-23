import { Link, matchPath, NavLink, useLocation } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import { endSession } from '../auth/auth-session'
import { useStudyProfile } from '../auth/useStudyProfile'

const navigation = [
  { to: '/dashboard', label: 'Bảng điều khiển', mobile: 'Tổng quan', icon: 'home' },
  { to: '/practice', label: 'Luyện câu hỏi', mobile: 'Luyện thi', icon: 'book' },
  { to: '/exams', label: 'Thi thử', mobile: 'Thi thử', icon: 'clock' },
  { to: '/road-signs', label: 'Biển báo giao thông', mobile: 'Biển báo', icon: 'sign' },
  { to: '/exams/history', label: 'Lịch sử thi', mobile: 'Lịch sử', icon: 'clipboard' },
] as const

function StudyNavigation({ mobile }: Readonly<{ mobile?: boolean }>) {
  const { pathname } = useLocation()
  return (
    <nav className={mobile ? 'study-bottom-nav' : 'study-desktop-nav'} aria-label={mobile ? 'Điều hướng di động' : 'Khu vực ôn tập'}>
      {!mobile && <NavLink to="/" end>Trang chủ</NavLink>}
      {navigation.map(({ to, label, icon, mobile: shortLabel }) => (
        <NavLink key={to} to={to} end={to === '/exams' && Boolean(matchPath('/exams/history', pathname))}>
          {mobile && <StudyIcon name={icon} />}
          {mobile ? shortLabel : label}
        </NavLink>
      ))}
    </nav>
  )
}

export function StudyHeader({ sessionId }: Readonly<{ sessionId: number }>) {
  const { data: profile } = useStudyProfile(sessionId)
  const initials = profile?.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join('')
  return (
    <>
      <header className="study-header">
        <a className="site-skip-link" href="#main-content">Đến nội dung chính</a>
        <div className="study-header-inner">
          <Link className="study-brand" to="/" aria-label="Trang chủ Ôn thi bằng lái">
            <span className="study-brand-icon"><StudyIcon name="road" /></span>
            <span><strong>Ôn thi bằng lái</strong><small>Hệ thống luyện thi trực tuyến</small></span>
          </Link>
          <StudyNavigation />
          {profile && <Link to="/dashboard#profile-heading" className="study-header-profile">
            <span className="study-avatar" aria-hidden="true">{initials || <StudyIcon name="user" />}</span>
            <span><strong>{profile.name}</strong><small>{profile.email}</small></span>
          </Link>}
          <button type="button" className="study-logout" onClick={endSession}>
            <StudyIcon name="logout" /> Đăng xuất
          </button>
        </div>
      </header>
      <StudyNavigation mobile />
    </>
  )
}

export function StudyFooter() {
  return (
    <footer className="study-footer">
      <div className="study-header-inner">
        <span><StudyIcon name="shield" /> Hệ thống ôn thi giấy phép lái xe</span>
        <Link to="/#study-roadmap">Lộ trình ôn tập</Link>
        <Link to="/system-check">Kiểm tra hệ thống</Link>
      </div>
    </footer>
  )
}
