import Dexie, { type EntityTable } from 'dexie'
import type { ImportGameInput, PersistedAnalysis, StoredGame, StoredStudent } from '../types/coaching'
import { demoGames, demoStudent } from '../data/seeds'
import { parseGame } from './chess/pgn'
import { buildDeepReport, buildInstantReport } from './chess/report'

class DeepGameDatabase extends Dexie {
  students!: EntityTable<StoredStudent, 'id'>
  games!: EntityTable<StoredGame, 'id'>
  analyses!: EntityTable<PersistedAnalysis, 'id'>

  constructor() {
    super('deepgame-coaching-os')
    this.version(1).stores({
      students: 'id, name, updatedAt',
      games: 'id, studentId, importedAt, coachedSide, opening',
      analyses: 'id, gameId, studentId, kind, createdAt',
    })
  }
}

export const db = new DeepGameDatabase()

function nowIso() {
  return new Date().toISOString()
}

function buildStoredGame(game: { id: string; studentId: string; coachedSide: 'white' | 'black'; pgn: string }): StoredGame {
  const parsed = parseGame(game.pgn, game.coachedSide)
  return {
    id: game.id,
    studentId: game.studentId,
    title: parsed.title,
    pgn: game.pgn,
    coachedSide: parsed.coachedSide,
    opening: parsed.opening,
    event: parsed.headers.Event ?? 'Training game',
    site: parsed.headers.Site ?? 'Offline import',
    date: parsed.headers.Date ?? '',
    timeControl: parsed.headers.TimeControl ?? '',
    result: parsed.result,
    playerName: parsed.selectedPlayer,
    opponentName: parsed.opponent,
    importedAt: nowIso(),
  }
}

function buildInstantAnalysis(game: StoredGame, student: StoredStudent): PersistedAnalysis {
  const parsed = parseGame(game.pgn, game.coachedSide, student.name)
  return {
    id: `${game.id}-instant`,
    gameId: game.id,
    studentId: student.id,
    kind: 'instant',
    createdAt: nowIso(),
    report: buildInstantReport(parsed),
  }
}

export async function ensureSeedData() {
  const timestamp = nowIso()
  const existingStudent = await db.students.get(demoStudent.id)
  const existingGames = await db.games.where('studentId').equals(demoStudent.id).toArray()
  const existingAnalyses = await db.analyses.where('studentId').equals(demoStudent.id).toArray()
  const existingGamesById = new Map(existingGames.map((game) => [game.id, game]))
  const student: StoredStudent = {
    ...demoStudent,
    createdAt: existingStudent?.createdAt ?? timestamp,
    updatedAt: timestamp,
    kind: 'seeded',
  }

  const games = demoGames.map((game) => {
    const existing = existingGamesById.get(game.id)
    return {
      ...buildStoredGame(game),
      importedAt: existing?.importedAt ?? timestamp,
    }
  })
  const analyses = games.map((game) => buildInstantAnalysis(game, student))
  const refreshedDeepAnalyses = existingAnalyses
    .filter((analysis) => analysis.kind === 'deep' && analysis.engineReview)
    .map((analysis) => {
      const game = games.find((entry) => entry.id === analysis.gameId)
      if (!game || !analysis.engineReview) {
        return null
      }

      const parsed = parseGame(game.pgn, game.coachedSide, student.name)
      return {
        ...analysis,
        report: buildDeepReport(parsed, analysis.engineReview),
      } satisfies PersistedAnalysis
    })
    .filter((analysis): analysis is PersistedAnalysis => Boolean(analysis))

  await db.transaction('rw', db.students, db.games, db.analyses, async () => {
    await db.students.put(student)
    await db.games.bulkPut(games)
    await db.analyses.bulkPut(analyses)
    if (refreshedDeepAnalyses.length) {
      await db.analyses.bulkPut(refreshedDeepAnalyses)
    }
  })
}

export async function upsertImportedGame(input: ImportGameInput) {
  const timestamp = nowIso()
  const existingStudent = await db.students
    .filter((student) => student.name.toLowerCase() === input.studentName.trim().toLowerCase())
    .first()

  const student: StoredStudent = existingStudent ?? {
    id: crypto.randomUUID(),
    name: input.studentName.trim(),
    tagline: 'Custom offline coaching student',
    focusStatement: input.focusStatement.trim() || 'A custom imported student profile for DeepGame Coaching OS.',
    goals: input.goals.filter(Boolean),
    createdAt: timestamp,
    updatedAt: timestamp,
    kind: 'custom',
  }

  const parsed = parseGame(input.pgn, input.coachedSide, student.name)
  const game: StoredGame = {
    id: crypto.randomUUID(),
    studentId: student.id,
    title: parsed.title,
    pgn: input.pgn,
    coachedSide: parsed.coachedSide,
    opening: parsed.opening,
    event: parsed.headers.Event ?? 'Imported PGN',
    site: parsed.headers.Site ?? 'Local import',
    date: parsed.headers.Date ?? timestamp.slice(0, 10),
    timeControl: parsed.headers.TimeControl ?? '',
    result: parsed.result,
    playerName: parsed.selectedPlayer,
    opponentName: parsed.opponent,
    importedAt: timestamp,
  }

  const analysis: PersistedAnalysis = {
    id: `${game.id}-instant`,
    gameId: game.id,
    studentId: student.id,
    kind: 'instant',
    createdAt: timestamp,
    report: buildInstantReport(parsed),
  }

  await db.transaction('rw', db.students, db.games, db.analyses, async () => {
    if (existingStudent) {
      await db.students.update(existingStudent.id, {
        updatedAt: timestamp,
        focusStatement: input.focusStatement.trim() || existingStudent.focusStatement,
        goals: input.goals.filter(Boolean).length ? input.goals.filter(Boolean) : existingStudent.goals,
      })
    } else {
      await db.students.add(student)
    }

    await db.games.add(game)
    await db.analyses.put(analysis)
  })

  return {
    studentId: student.id,
    gameId: game.id,
  }
}

export async function saveDeepAnalysis(analysis: PersistedAnalysis) {
  await db.analyses.put(analysis)
}
