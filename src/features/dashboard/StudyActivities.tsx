import { Link } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'

const activities = [
  { to: '/practice', title: 'Luyện câu hỏi', description: 'Ôn theo chủ đề và xem giải thích sau khi trả lời.', action: 'Vào ôn ngay', icon: 'book', tone: 'blue' },
  { to: '/practice/wrong', title: 'Câu cần ôn lại', description: 'Quay lại những câu chưa làm đúng.', action: 'Xem danh sách', icon: 'repeat', tone: 'amber' },
  { to: '/road-signs', title: 'Biển báo giao thông', description: 'Tra cứu biển báo theo nhóm, tên hoặc mã.', action: 'Tra cứu biển', icon: 'sign', tone: 'green' },
  { to: '/exams', title: 'Thi thử', description: 'Chọn đề có sẵn hoặc tạo lượt thi ngẫu nhiên.', action: 'Làm bài thi', icon: 'clock', tone: 'violet' },
  { to: '/exams/history', title: 'Lịch sử thi', description: 'Xem kết quả và tiếp tục lượt thi đang làm.', action: 'Xem lịch sử', icon: 'clipboard', tone: 'indigo' },
  { to: '/#study-roadmap', title: 'Xem lộ trình ôn tập', description: 'Xem các bước ôn luyện trước khi thi thử.', action: 'Xem lộ trình', icon: 'route', tone: 'teal' },
] as const

export function StudyActivities() {
  return (
    <nav className="dashboard-links" aria-label="Hoạt động ôn tập">
      {activities.map(({ to, title, description, action, icon, tone }) => (
        <Link key={to} className="dashboard-activity" to={to} data-tone={tone} aria-label={title}>
          <span className="study-icon-tile"><StudyIcon name={icon} /></span>
          <strong>{title}</strong>
          <span className="dashboard-activity-description">{description}</span>
          <span className="dashboard-activity-action">{action} <StudyIcon name="arrow" /></span>
        </Link>
      ))}
    </nav>
  )
}
