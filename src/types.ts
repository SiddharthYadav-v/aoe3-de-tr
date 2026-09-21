export type Region =
  | 'European'
  | 'Native American'
  | 'Asian'
  | 'African'
  | 'Federal'

export interface DeckPreset {
  id: string
  title: string
  description: string
  imagePath: string | null
}

export interface CivilizationProfile {
  playstyle: string
  economy: string
  military: string
  keyMechanics: string[]
  boomingVideoId: string | null
  decks: DeckPreset[]
}

export interface Civilization {
  id: string
  name: string
  shortName: string
  region: Region
  accent: string
  flagPath: string
  summary: string
  strengths: string[]
  profile: CivilizationProfile
}

export interface MatchupGuide {
  id?: string
  civilizationId: string
  opponentId: string
  overview: string
  gamePlan: string
  opening: string
  keyUnits: string
  timings: string
  threats: string
  notes: string
  updatedAt: string
}

export type GuideField = Exclude<
  keyof MatchupGuide,
  'id' | 'civilizationId' | 'opponentId' | 'updatedAt'
>
