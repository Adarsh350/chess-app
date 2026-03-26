export type PlayerSide = 'white' | 'black'
export type GameOutcome = 'win' | 'draw' | 'loss'
export type MovePhase = 'opening' | 'middlegame' | 'endgame'
export type AnalysisKind = 'instant' | 'deep'
export type MoveClassification = 'strong' | 'solid' | 'inaccuracy' | 'mistake' | 'blunder'

export interface StoredStudent {
  id: string
  name: string
  tagline: string
  focusStatement: string
  goals: string[]
  createdAt: string
  updatedAt: string
  kind: 'seeded' | 'custom'
  archivedAt: string | null
}

export interface StoredGame {
  id: string
  studentId: string
  title: string
  pgn: string
  coachedSide: PlayerSide
  opening: string
  event: string
  site: string
  date: string
  timeControl: string
  result: string
  playerName: string
  opponentName: string
  importedAt: string
}

export interface MaterialSnapshot {
  white: number
  black: number
  difference: number
}

export interface ParsedMove {
  ply: number
  moveNumber: number
  san: string
  lan: string
  color: 'w' | 'b'
  from: string
  to: string
  piece: string
  captured?: string
  promotion?: string
  flags: string
  beforeFen: string
  afterFen: string
  isCapture: boolean
  isCheck: boolean
  isCastle: boolean
  materialBefore: MaterialSnapshot
  materialAfter: MaterialSnapshot
  phase: MovePhase
}

export interface ParsedGame {
  title: string
  eventSummary: string
  headers: Record<string, string>
  moves: ParsedMove[]
  white: string
  black: string
  selectedPlayer: string
  opponent: string
  coachedSide: PlayerSide
  opening: string
  result: string
  outcome: GameOutcome
}

export interface StyleMeter {
  label: string
  score: number
  note: string
}

export interface StyleFingerprint {
  archetype: string
  summary: string
  coachHook: string
  meters: StyleMeter[]
  openingLean: string[]
}

export interface CoachInsight {
  title: string
  detail: string
}

export interface TrainingBlock {
  title: string
  why: string
  drills: string[]
  target: string
}

export interface SessionAgendaItem {
  title: string
  detail: string
}

export interface PhaseScore {
  phase: MovePhase
  score: number
  caption: string
  basis: 'heuristic' | 'engine'
}

export interface CriticalMoment {
  ply: number
  moveNumber: number
  san: string
  title: string
  explanation: string
  severity: MoveClassification
  cpl: number
  phase: MovePhase
  fenAfter: string
  bestMove?: string
  bestLine?: string[]
}

export interface EngineMoveReview {
  ply: number
  moveNumber: number
  san: string
  cpl: number
  classification: MoveClassification
  phase: MovePhase
  beforeEval: number
  afterEval: number
  bestMove: string
  bestLine: string[]
  fenAfter: string
}

export interface EngineReviewSnapshot {
  depth: number
  averageCpl: number
  reviews: EngineMoveReview[]
  criticalMoments: CriticalMoment[]
  phaseScores: PhaseScore[]
  diagnostic: string[]
}

export interface CoachingReport {
  headline: string
  oneLiner: string
  executiveSummary: string
  styleFingerprint: StyleFingerprint
  strengths: CoachInsight[]
  leaks: CoachInsight[]
  trainingPlan: TrainingBlock[]
  sessionAgenda: SessionAgendaItem[]
  followUp: string
  phaseScores: PhaseScore[]
  actionChecklist: string[]
  criticalMoments: CriticalMoment[]
  diagnostic: string[]
  generatedFrom: AnalysisKind
}

export interface PersistedAnalysis {
  id: string
  gameId: string
  studentId: string
  kind: AnalysisKind
  createdAt: string
  report: CoachingReport
  engineReview?: EngineReviewSnapshot
}

export interface ImportGameInput {
  studentId?: string
  studentName: string
  focusStatement: string
  goals: string[]
  coachedSide: PlayerSide
  pgn: string
}

export interface StudentProfileInput {
  name: string
  tagline: string
  focusStatement: string
  goals: string[]
}
