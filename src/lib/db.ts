import Dexie, { type EntityTable } from 'dexie'
import type {
  ImportGameInput,
  PersistedAnalysis,
  StoredGame,
  StoredStudent,
  StudentProfileInput,
} from '../types/coaching'
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

    this.version(2)
      .stores({
        students: 'id, name, updatedAt, archivedAt, kind',
        games: 'id, studentId, importedAt, coachedSide, opening',
        analyses: 'id, gameId, studentId, kind, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('students')
          .toCollection()
          .modify((student: StoredStudent & { archivedAt?: string | null }) => {
            if (student.archivedAt === undefined) {
              student.archivedAt = null
            }
          })
      })
  }
}

export const db = new DeepGameDatabase()

function nowIso() {
  return new Date().toISOString()
}

function normalizeStudentName(name: string) {
  return name.trim().toLowerCase()
}

function sanitizeGoals(goals: string[]) {
  return goals.map((goal) => goal.trim()).filter(Boolean)
}

function fallbackTagline(name: string) {
  return `${name}'s coaching profile`
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

function buildStoredStudent(input: StudentProfileInput, existing?: StoredStudent): StoredStudent {
  const timestamp = nowIso()
  const goals = sanitizeGoals(input.goals)

  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    tagline: input.tagline.trim() || fallbackTagline(input.name.trim()),
    focusStatement:
      input.focusStatement.trim() || 'This student profile keeps the coaching goals and game history in one place.',
    goals,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    kind: existing?.kind ?? 'custom',
    archivedAt: existing?.archivedAt ?? null,
  }
}

async function findStudentByName(name: string) {
  const normalized = normalizeStudentName(name)
  return db.students
    .filter(
      (student) => normalizeStudentName(student.name) === normalized && student.archivedAt === null,
    )
    .first()
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
    archivedAt: existingStudent?.archivedAt ?? null,
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

export async function createStudentProfile(input: StudentProfileInput) {
  const existingStudent = await findStudentByName(input.name)
  if (existingStudent) {
    throw new Error('A student with that name already exists. Open the student or choose a different name.')
  }

  const student = buildStoredStudent(input)
  await db.students.add(student)
  return student
}

export async function updateStudentProfile(studentId: string, input: StudentProfileInput) {
  const existingStudent = await db.students.get(studentId)
  if (!existingStudent) {
    throw new Error('That student could not be found.')
  }

  const normalizedName = normalizeStudentName(input.name)
  const conflictingStudent = await db.students
    .filter(
      (student) =>
        student.id !== studentId &&
        student.archivedAt === null &&
        normalizeStudentName(student.name) === normalizedName,
    )
    .first()

  if (conflictingStudent) {
    throw new Error('Another active student already uses that name.')
  }

  const updatedStudent = buildStoredStudent(input, existingStudent)
  await db.students.put(updatedStudent)
  return updatedStudent
}

export async function archiveStudentProfile(studentId: string) {
  const student = await db.students.get(studentId)
  if (!student) {
    throw new Error('That student could not be found.')
  }

  await db.students.update(studentId, {
    archivedAt: nowIso(),
    updatedAt: nowIso(),
  })
}

export async function restoreStudentProfile(studentId: string) {
  const student = await db.students.get(studentId)
  if (!student) {
    throw new Error('That student could not be found.')
  }

  const conflict = await db.students
    .filter(
      (entry) =>
        entry.id !== studentId &&
        entry.archivedAt === null &&
        normalizeStudentName(entry.name) === normalizeStudentName(student.name),
    )
    .first()

  if (conflict) {
    throw new Error('A different active student already uses this name. Rename that profile first.')
  }

  await db.students.update(studentId, {
    archivedAt: null,
    updatedAt: nowIso(),
  })
}

export async function deleteStudentProfile(studentId: string) {
  const student = await db.students.get(studentId)
  if (!student) {
    throw new Error('That student could not be found.')
  }

  if (student.kind === 'seeded') {
    throw new Error('The sample student cannot be permanently deleted. Hide it instead.')
  }

  const games = await db.games.where('studentId').equals(studentId).toArray()
  const gameIds = games.map((game) => game.id)

  await db.transaction('rw', db.students, db.games, db.analyses, async () => {
    if (gameIds.length) {
      await db.analyses.where('gameId').anyOf(gameIds).delete()
    }
    await db.games.where('studentId').equals(studentId).delete()
    await db.students.delete(studentId)
  })
}

export async function upsertImportedGame(input: ImportGameInput) {
  const timestamp = nowIso()
  const existingStudent =
    (input.studentId ? await db.students.get(input.studentId) : null) ??
    (input.studentName.trim() ? await findStudentByName(input.studentName) : null)

  if (input.studentId && !existingStudent) {
    throw new Error('The selected student could not be found. Refresh the page and try again.')
  }

  if (existingStudent?.archivedAt) {
    throw new Error('That student is archived. Restore the profile before adding new games.')
  }

  const student =
    existingStudent ??
    buildStoredStudent({
      name: input.studentName,
      tagline: fallbackTagline(input.studentName.trim()),
      focusStatement: input.focusStatement,
      goals: input.goals,
    })

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
        name: student.name,
        tagline: student.tagline,
        updatedAt: timestamp,
        focusStatement: input.focusStatement.trim() || existingStudent.focusStatement,
        goals: sanitizeGoals(input.goals).length ? sanitizeGoals(input.goals) : existingStudent.goals,
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
