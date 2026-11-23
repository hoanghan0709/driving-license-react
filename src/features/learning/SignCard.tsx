import { Link } from 'react-router'
import { StudyIcon } from '../../components/StudyIcon'
import { mediaUrl } from '../../services/learner-api'
import type { RoadSign } from './learning-api'

type SignCardProps = Readonly<{ sign: RoadSign; category?: string; marked?: boolean; onToggle?: () => void }>

const signTones: Record<string, string> = {
  PROHIBITION: 'red',
  WARNING: 'amber',
  MANDATORY: 'blue',
  INFORMATION: 'indigo',
  SUPPLEMENTARY: 'teal',
}

export function SignCard({ sign, category, marked, onToggle }: SignCardProps) {
  const image = mediaUrl(sign.image)
  return (
    <li className="learner-card study-sign-card">
      <div className="study-sign-card-head">
        <span className="study-chip" data-tone={signTones[sign.sign_type ?? '']}>{category || `Hạng ${sign.license_type}`}</span>
        {onToggle && <button type="button" className="study-icon-button" aria-pressed={marked}
          aria-label={`${marked ? 'Bỏ lưu' : 'Lưu'} biển ${sign.code}`} onClick={onToggle}><StudyIcon name="flag" /></button>}
      </div>
      {image && <Link className="study-sign-image-link" to={`/road-signs/${sign.id}`} aria-label={`Xem biển ${sign.code}`}>
        <img src={image} alt={`${sign.code} - ${sign.name}`} className="learner-sign-thumbnail" loading="lazy" />
      </Link>}
      <div className="study-sign-title">
        <span>{sign.code}</span><h2><Link to={`/road-signs/${sign.id}`}>{sign.name}</Link></h2>
      </div>
      <p>{sign.meaning}</p>
      <Link className="button-link" to={`/road-signs/${sign.id}`}>Xem chi tiết <StudyIcon name="arrow" /></Link>
    </li>
  )
}
