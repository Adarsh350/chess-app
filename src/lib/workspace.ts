import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import type { PersistedAnalysis, StoredGame, StoredStudent } from '../types/coaching'
import { parseGame } from './chess/pgn'
import { db } from './db'

const DEMO_VISIBILITY_KEY = 'deepgame-show-demo-data'

export function preferredAnalysisByGame(gameIds: string[], analyses: PersistedAnalysis[]) {
  const map = new Map<string, PersistedAnalysis>()

  for (const gameId of gameIds) {
    const options = analyses.filter((analysis) => analysis.gameId === gameId)
    const preferred = options.find((analysis) => analysis.kind === 'deep') ?? options[0]
    if (preferred) {
      map.set(gameId, preferred)
    }
  }

  return map
}

export function formatShortDate(value?: string | null) {
  if (!value) {
    return 'No activity yet'
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function useDemoVisibility() {
  const [showDemo, setShowDemo] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(DEMO_VISIBILITY_KEY) === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(DEMO_VISIBILITY_KEY, String(showDemo))
  }, [showDemo])

  return [showDemo, setShowDemo] as const
}

export function visibleStudents(students: StoredStudent[], showDemo: boolean) {
  return showDemo ? students : students.filter((student) => student.kind !== 'seeded')
}

export function visibleGames(games: StoredGame[], visibleStudentIds: Set<string>) {
  return games.filter((game) => visibleStudentIds.has(game.studentId))
}

export function reviewTitleForDisplay(game: StoredGame, student: StoredStudent) {
  if (student.kind === 'custom' && student.name.trim() && game.playerName.trim() !== student.name.trim()) {
    return `${student.name} vs ${game.opponentName}`
  }

  return game.title
}

export function reviewPlayerLabelForDisplay(game: StoredGame, student: StoredStudent) {
  if (student.kind === 'custom' && student.name.trim() && game.playerName.trim() !== student.name.trim()) {
    return `${student.name} (PGN: ${game.playerName})`
  }

  return game.playerName
}

export function useWorkspaceRecord() {
  return useLiveQuery(async () => {
    const [students, games, analyses] = await Promise.all([
      db.students.orderBy('updatedAt').reverse().toArray(),
      db.games.orderBy('importedAt').reverse().toArray(),
      db.analyses.toArray(),
    ])

    return {
      students,
      games,
      analyses,
    }
  }, [])
}

export function useStudentRecord(studentId?: string) {
  return useLiveQuery(async () => {
    if (!studentId) {
      return null
    }

    const student = await db.students.get(studentId)
    if (!student) {
      return null
    }

    const games = await db.games.where('studentId').equals(student.id).sortBy('importedAt')
    const analyses = await db.analyses.where('studentId').equals(student.id).toArray()

    return {
      student,
      games: games.reverse(),
      analyses,
    }
  }, [studentId])
}

export function useReviewRecord(gameId?: string) {
  return useLiveQuery(async () => {
    if (!gameId) {
      return null
    }

    const game = await db.games.get(gameId)
    if (!game) {
      return null
    }

    const student = await db.students.get(game.studentId)
    if (!student) {
      return null
    }

    const analyses = await db.analyses.where('gameId').equals(game.id).toArray()
    const parsed = parseGame(game.pgn, game.coachedSide, student.name)
    const preferredAnalysis =
      analyses.find((analysis) => analysis.kind === 'deep') ??
      analyses.find((analysis) => analysis.kind === 'instant') ??
      null

    return {
      game,
      student,
      analyses,
      parsed,
      preferredAnalysis,
    }
  }, [gameId])
}
