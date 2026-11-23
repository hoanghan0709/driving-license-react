import { useQuery } from '@tanstack/react-query'
import { StudySearch } from './StudySearch'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { catalogSchema, learnerRequest, mediaUrl, pageSchema } from '../../services/learner-api'
import { StudyIcon } from '../../components/StudyIcon'
import { LearnerError, Pagination } from './LearnerLayout'
import { questionSchema, signSchema } from './learning-api'
import { PracticeQuestion } from './PracticePage'
import { SignCard } from './SignCard'
import { useStudyProfile } from '../auth/useStudyProfile'
import { useSavedSigns } from './useSavedSigns'
import type { SavedSign } from './useSavedSigns'
import './road-signs.css'

type RoadSignsPageProps = Readonly<{ sessionId: number }>

export function RoadSignsPage({ sessionId }: RoadSignsPageProps) {
  const profile = useStudyProfile(sessionId)
  return profile.data
    ? <RoadSignsWithBookmarks key={profile.data.id} sessionId={sessionId} profileId={profile.data.id} license={profile.data.current_license_type} />
    : <RoadSignDirectory sessionId={sessionId} />
}

function RoadSignsWithBookmarks({ sessionId, profileId, license }: Readonly<RoadSignsPageProps & { profileId: number; license: string }>) {
  const saved = useSavedSigns(profileId)
  return <RoadSignDirectory sessionId={sessionId} saved={saved} license={license} />
}

function RoadSignDirectory({ sessionId, saved, license }: Readonly<RoadSignsPageProps & {
  saved?: ReturnType<typeof useSavedSigns>; license?: string
}>) {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [savedOnly, setSavedOnly] = useState(false)
  const types = useQuery({
    queryKey: ['account', sessionId, 'sign-types'],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/road-sign-types', catalogSchema, { signal }),
  })
  const signs = useQuery({
    queryKey: ['account', sessionId, 'signs', page, type, search],
    queryFn: ({ signal }) => learnerRequest(sessionId, '/road-signs', pageSchema(signSchema),
      { signal, params: { page, sign_type: type, search } }),
    enabled: !savedOnly,
  })
  const groups = new Map(types.data?.data.map(({ code, name }) => [code, name]))
  const savedItems = saved?.items.filter((sign) => !license || sign.license_type === license) ?? []

  return (
    <div className="study-sign-directory">
      <header className="study-sign-hero">
        <div><h1>Hệ thống Biển báo Giao thông Đường bộ Việt Nam</h1>
          <p>Tra cứu tên, mã và ý nghĩa biển báo trong ngân hàng đang ôn.</p></div>
        <span className="study-icon-tile"><StudyIcon name="sign" /></span>
      </header>
      <section className="learner-card study-sign-tools" aria-label="Tìm và lọc biển báo">
        {!savedOnly && <StudySearch label="Tên hoặc mã biển" placeholder="Nhập tên biển, mã số hoặc từ khóa"
          value={search} shortcut submitLabel="Tìm kiếm" onSearch={(term) => { setSearch(term); setPage(1) }} />}
        <div className="study-sign-filters">
          {!savedOnly && <div className="study-filter-tabs" role="group" aria-label="Nhóm biển">
            <button type="button" aria-pressed={type === ''} onClick={() => { setType(''); setPage(1) }}>Tất cả nhóm</button>
            {types.data?.data.map(({ code, name }) => (
              <button type="button" key={code} aria-pressed={type === code}
                onClick={() => { setType(code); setPage(1) }}>{name}</button>
            ))}
          </div>}
          {saved && <button type="button" className="study-icon-button" aria-pressed={savedOnly} onClick={() => setSavedOnly(!savedOnly)}>
            <StudyIcon name="flag" /> Đã lưu ({savedItems.length})
          </button>}
        </div>
        {!savedOnly && signs.data && <p className="learner-meta">Hiển thị {signs.data.data.length} / {signs.data.total} biển</p>}
        {saved?.saveError && <p role="alert">Chưa lưu được biển báo trên trình duyệt này.</p>}
        {!savedOnly && types.isError && <LearnerError message="Chưa tải được nhóm biển." retry={() => void types.refetch()} />}
      </section>
      {savedOnly ? <SavedSignList items={savedItems} onRemove={(sign) => saved?.toggle(sign)} /> : <>
        {signs.isPending && <p role="status">Đang tải biển báo…</p>}
        {signs.isError && <LearnerError retry={() => void signs.refetch()} />}
        {signs.data && (
          <div className="study-sign-layout">
            <div>
              {signs.data.data.length === 0 && <p>Chưa có biển báo phù hợp.</p>}
              <ul className="learner-list learner-sign-grid">
                {signs.data.data.map((sign) => (
                  <SignCard key={sign.id} sign={sign} category={groups.get(sign.sign_type ?? '')}
                    marked={saved?.items.some(({ id }) => id === sign.id)} onToggle={saved && (() => saved.toggle(sign))} />
                ))}
              </ul>
              <Pagination {...signs.data} onPage={setPage} />
            </div>
            <aside className="learner-card study-sign-guide">
              <span className="study-icon-tile" data-tone="amber"><StudyIcon name="bulb" /></span>
              <h2>Tra cứu theo nhóm biển</h2>
              <p>Chọn một nhóm để thu hẹp kết quả, hoặc nhập mã biển nếu bạn đã biết.</p>
              <ul>
                {types.data?.data.map(({ code, name }) => (
                  <li key={code}><button type="button" aria-pressed={type === code}
                    onClick={() => { setType(code); setPage(1) }}>{name}</button></li>
                ))}
              </ul>
            </aside>
          </div>
        )}
      </>}
    </div>
  )
}

function SavedSignList({ items, onRemove }: Readonly<{ items: SavedSign[]; onRemove: (sign: SavedSign) => void }>) {
  return (
    <section className="learner-card">
      <h2>Biển báo đã lưu trên thiết bị này</h2>
      {items.length === 0 && <p>Chưa lưu biển báo trong hạng đang ôn.</p>}
      <ul className="study-saved-signs">
        {items.map((sign) => <li key={sign.id}>
          <Link to={`/road-signs/${sign.id}`}>{sign.code} · {sign.name}</Link>
          <button type="button" onClick={() => onRemove(sign)}>Bỏ lưu</button>
        </li>)}
      </ul>
    </section>
  )
}

export function RoadSignPage({ sessionId }: { sessionId: number }) {
  const { id } = useParams()
  if (!id || !/^[1-9]\d{0,9}$/.test(id) || Number(id) > 4294967295) return <LearnerError message="Mã biển báo không hợp lệ." />
  return <RoadSignDetails key={id} sessionId={sessionId} id={id} />
}

function RoadSignDetails({ sessionId, id }: { sessionId: number; id: string }) {
  const [page, setPage] = useState(1)
  const sign = useQuery({
    queryKey: ['account', sessionId, 'signs', 'detail', id],
    queryFn: ({ signal }) => learnerRequest(sessionId, `/road-signs/${id}`, signSchema, { signal }),
  })
  const questions = useQuery({
    queryKey: ['account', sessionId, 'signs', 'questions', id, page],
    enabled: !!sign.data,
    queryFn: ({ signal }) => learnerRequest(sessionId, `/road-signs/${id}/questions`, pageSchema(questionSchema),
      { signal, params: { page, limit: 5 } }),
  })
  if (sign.isPending) return <p role="status">Đang tải biển báo…</p>
  if (!sign.data) return <LearnerError message="Chưa tải được biển báo trong hạng đang ôn." retry={() => void sign.refetch()} />
  const image = mediaUrl(sign.data.image)
  const results = questions.data

  return (
    <>
      <p><Link className="button-link" to="/road-signs">Về danh sách biển báo</Link></p>
      <h1>{sign.data.code} · {sign.data.name}</h1>
      <div className="learner-card">
        <p className="learner-meta">Hạng {sign.data.license_type}</p>
        {image && <img className="learner-image" src={image} alt={`Biển ${sign.data.code} · ${sign.data.name}`} />}
        <p className="learner-content">{sign.data.meaning}</p>
        {sign.data.description && <p className="learner-content">{sign.data.description}</p>}
      </div>
      <h2>Câu hỏi liên quan</h2>
      {questions.isPending && <p role="status">Đang tải câu hỏi…</p>}
      {questions.isError && <LearnerError retry={() => void questions.refetch()} />}
      {results && (
        <>
          {results.data.length === 0 && <p>Chưa có câu hỏi liên quan.</p>}
          <div className="learner-list">
            {results.data.map((question, index) => (
              <PracticeQuestion key={`${page}-${question.id}`} sessionId={sessionId} question={question}
                number={(results.page - 1) * results.limit + index + 1} />
            ))}
          </div>
          <Pagination {...results} onPage={setPage} />
        </>
      )}
    </>
  )
}
