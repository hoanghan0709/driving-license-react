const paths = {
  road: 'M8.5 4 4 20m11.5-16L20 20M12 4v3m0 3.5v3m0 3.5v3',
  home: 'm3 10 9-7 9 7v10H3zm6 10v-7h6v7',
  book: 'M12 6v15M3 4h4c2 0 4 1 5 2 1-1 3-2 5-2h4v15h-4c-2 0-4 1-5 2-1-1-3-2-5-2H3z',
  repeat: 'M20 7v5h-5M4 17v-5h5m10-1a7 7 0 0 0-12-4m-2 6a7 7 0 0 0 12 4',
  sign: 'm12 2 10 10-10 10L2 12zm-2 14v-5h6m-3-3 3 3-3 3',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3 2',
  clipboard: 'M9 4H5v17h14V4h-4M9 3h6v4H9zm0 9h6m-6 4h6',
  chart: 'M3 3v18h18M7 15l4-5 4 3 5-6',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2',
  route: 'M5 5h.01M19 19h.01M7 5h7a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h8M3 5a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm14 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0z',
  logout: 'M10 4H4v16h6m4-13 5 5-5 5m-5-5h10',
  flag: 'M5 3v18m0-17c4-3 8 3 14 0v11c-6 3-10-3-14 0',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12 6 6',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  shield: 'm12 2 8 4v6c0 4-4 8-8 10-4-2-8-6-8-10V6zm-3 10 2 2 4-4',
  bulb: 'M9 18h6m-5 3h4M8 15c0-2-3-3-3-7a7 7 0 0 1 14 0c0 4-3 5-3 7',
} as const

export type StudyIconName = keyof typeof paths

type StudyIconProps = Readonly<{ name: StudyIconName; className?: string }>

export function StudyIcon({ name, className }: StudyIconProps) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  )
}
