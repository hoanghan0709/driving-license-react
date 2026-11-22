import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import roadHero from './road-hero.webp'

const studySteps = [
  {
    tone: 'violet',
    title: 'Ôn lý thuyết',
    description: 'Học theo chủ đề để nắm quy tắc, nhận biết biển báo và hiểu tình huống giao thông.',
    tips: [
      'Xác định hạng bằng lái bạn dự định thi và dùng tài liệu phù hợp với hạng đó.',
      'Sau mỗi chủ đề, tự giải thích vì sao bạn chọn đáp án để kiểm tra mình đã hiểu quy tắc.',
    ],
    icon: 'M12 6v15M3 4h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z',
  },
  {
    tone: 'cyan',
    title: 'Luyện thi thử',
    description: 'Làm trọn một đề trong thời gian quy định để tập phân bổ thời gian.',
    tips: [
      'Chọn đề luyện phù hợp với hạng bằng lái và kiểm tra thời lượng của đề trước khi bắt đầu.',
      'Làm đề liền mạch như khi đi thi. Nếu còn thời gian, rà soát những câu bạn chưa chắc trước khi nộp.',
    ],
    icon: 'M9 2h6m-3 4V2m6.5 5.5L20 6m-8 5v4h3m5-1a8 8 0 1 1-16 0 8 8 0 0 1 16 0z',
  },
  {
    tone: 'pink',
    title: 'Ôn lại câu sai',
    description: 'Xem lại những câu đã trả lời sai để biết phần kiến thức nào cần ôn thêm.',
    tips: [
      'Đọc lời giải và ghi lại lý do bạn chọn nhầm hoặc bỏ sót một chi tiết trong câu hỏi.',
      'Quay lại chủ đề liên quan rồi thử làm lại các câu đó mà không xem đáp án trước.',
    ],
    icon: 'M3 11a9 9 0 1 1 2.6 7.4M3 5v6h6m3-3v4l3 2',
  },
]

export function HomePage({ studyPath }: { studyPath: '/login' | '/dashboard' }) {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash === '#study-roadmap') {
      const roadmap = document.getElementById('study-roadmap')
      roadmap?.focus({ preventScroll: true })
      roadmap?.scrollIntoView()
    }
  }, [hash])

  return (
    <main id="main-content" className="home-main" tabIndex={-1}>
      <section className="home-hero page-width" aria-labelledby="home-heading">
        <div className="home-hero-copy">
          <h1 id="home-heading">
            Ôn thi lý thuyết <span>bằng lái xe</span>
          </h1>
          <p>
            Nắm vững kiến thức giao thông, làm quen với đề thi và củng cố những
            phần bạn còn hay nhầm.
          </p>
          <div className="home-hero-actions">
            <Link className="home-primary-link" to={studyPath}>
              Bắt đầu ôn tập
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 12h15m-6-6 6 6-6 6" />
              </svg>
            </Link>
            <a className="home-roadmap-link" href="#study-roadmap">Xem lộ trình ôn tập</a>
          </div>
        </div>
        <div className="home-hero-art">
          <img className="home-hero-image" src={roadHero} alt="" width="1254" height="1254" fetchPriority="high" />
        </div>
      </section>

      <section id="study-roadmap" tabIndex={-1} className="home-roadmap page-width" aria-labelledby="roadmap-heading">
        <h2 id="roadmap-heading">Lộ trình ôn tập</h2>
        <div className="home-step-grid">
          {studySteps.map((step) => (
            <details className="home-step" data-tone={step.tone} key={step.title}>
              <summary className="home-step-summary">
                <span className="home-step-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.icon} />
                  </svg>
                </span>
                <span className="home-step-title">{step.title}</span>
                <span className="home-step-description">{step.description}</span>
                <span className="home-step-action">
                  <span className="home-step-view">Xem hướng dẫn</span>
                  <span className="home-step-hide">Thu gọn hướng dẫn</span>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <ul className="home-step-tips">
                {step.tips.map((tip) => <li key={tip}>{tip}</li>)}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
