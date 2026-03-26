import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, BookOpenCheck, Plus, Upload, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MetricCard } from '../components/MetricCard'
import { SectionCard } from '../components/SectionCard'
import { db } from '../lib/db'
import { summarizeStudent } from '../lib/studentSummary'
import type { PersistedAnalysis } from '../types/coaching'

function preferredAnalysisByGame(gameIds: string[], analyses: PersistedAnalysis[]) {
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

function formatRelativeDay(value?: string | null) {
  if (!value) {
    return 'No activity yet'
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DashboardRoute() {
  const record = useLiveQuery(async () => {
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

  if (!record) {
    return null
  }

  const activeStudents = record.students
    .filter((student) => student.archivedAt === null)
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'custom' ? -1 : 1
      }
      return right.updatedAt.localeCompare(left.updatedAt)
    })
  const activeIds = new Set(activeStudents.map((student) => student.id))
  const activeGames = record.games.filter((game) => activeIds.has(game.studentId))
  const activeAnalyses = record.analyses.filter((analysis) => activeIds.has(analysis.studentId))
  const reportByGame = preferredAnalysisByGame(
    activeGames.map((game) => game.id),
    activeAnalyses,
  )
  const studentSummaries = new Map(
    activeStudents.map((student) => {
      const games = activeGames.filter((game) => game.studentId === student.id)
      const analyses = activeAnalyses.filter((analysis) => analysis.studentId === student.id)
      return [
        student.id,
        {
          summary: summarizeStudent(games, analyses),
          games,
          latestActivity: games[0]?.importedAt ?? student.updatedAt,
        },
      ]
    }),
  )
  const latestReview = activeGames[0]
  const latestReviewAnalysis = latestReview ? reportByGame.get(latestReview.id) : null

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Coach Home</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Run your coaching from one clean workspace.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              Keep every student separate, upload new games into the right profile, and reopen any review when you need the next lesson plan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button" to="/students?new=1">
                <Plus className="mr-2 h-4 w-4" />
                Create Student
              </Link>
              <Link className="ghost-button" to="/intake">
                <Upload className="mr-2 h-4 w-4" />
                Upload A Game
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: Users,
                title: 'Student Profiles',
                body: 'Each student keeps their own goals, games, and review trail.',
              },
              {
                icon: Upload,
                title: 'Easy Intake',
                body: 'Choose the student first, then save the new game into that profile.',
              },
              {
                icon: BookOpenCheck,
                title: 'Reusable Reviews',
                body: 'Open older reports any time when you want to compare progress or prep the next lesson.',
              },
            ].map((card) => (
              <div key={card.title} className="panel p-5">
                <card.icon className="h-5 w-5 text-forest" />
                <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-copy">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Students"
          value={String(activeStudents.length)}
          description="Profiles currently open for coaching and new game uploads."
        />
        <MetricCard
          label="Games Reviewed"
          value={String(activeGames.length)}
          description="Saved games attached to active students in the workspace."
        />
        <MetricCard
          label="Detailed Reviews"
          value={String(activeAnalyses.filter((analysis) => analysis.kind === 'deep').length)}
          description="Closer move-by-move reviews available across your active students."
        />
        <MetricCard
          label="Latest Review"
          value={latestReview ? formatRelativeDay(latestReview.importedAt) : 'None yet'}
          description="The most recent saved game currently in the workspace."
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <SectionCard
          eyebrow="Students"
          title="Your active student list"
          description="Open a profile, upload another game, or jump straight into student management."
        >
          {activeStudents.length ? (
            <div className="grid gap-4">
              {activeStudents.map((student) => {
                const details = studentSummaries.get(student.id)
                if (!details) {
                  return null
                }

                return (
                  <div
                    key={student.id}
                    className="rounded-[1.5rem] border border-line bg-white p-5 transition hover:border-forest/20 hover:bg-mint-soft/60"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-3">
                          <span className="metric-chip">
                            {student.kind === 'seeded' ? 'Sample data' : 'Student profile'}
                          </span>
                          <span className="metric-chip">{details.games.length} games</span>
                          <span className="metric-chip">{details.summary.signatureStyle}</span>
                        </div>
                        <h3 className="mt-4 font-heading text-3xl font-bold tracking-[-0.05em] text-ink">
                          {student.name}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{student.tagline}</p>
                        <p className="mt-4 text-sm leading-7 text-copy">{student.focusStatement}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link className="ghost-button" to={`/students/${student.id}`}>
                          Open Profile
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        <Link className="ghost-button" to={`/intake?studentId=${student.id}`}>
                          <Upload className="mr-2 h-4 w-4" />
                          Add Game
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-forest/20 bg-ivory/70 p-6 text-sm leading-7 text-copy">
              There are no active students yet. Create the first student profile, then upload a game to start building that coaching history.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Recent Reviews"
          title="The last saved games"
          description="Open the newest reviews quickly when you are getting ready for a lesson."
        >
          {activeGames.length ? (
            <div className="grid gap-4">
              {activeGames.slice(0, 6).map((game) => {
                const student = activeStudents.find((entry) => entry.id === game.studentId)
                const analysis = reportByGame.get(game.id)

                return (
                  <Link
                    key={game.id}
                    to={`/review/${game.id}`}
                    className="rounded-[1.5rem] border border-line bg-white p-5 transition hover:border-forest/20 hover:bg-mint-soft/60"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-3">
                          <span className="metric-chip">{student?.name ?? 'Student'}</span>
                          <span className="metric-chip">{game.opening}</span>
                        </div>
                        <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                          {game.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">
                          {analysis?.report.oneLiner ?? 'This game review is ready to open.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-ivory px-4 py-3 text-sm font-semibold text-forest">
                        {analysis?.kind === 'deep' ? 'Detailed review' : 'Game summary'}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-forest/20 bg-ivory/70 p-6 text-sm leading-7 text-copy">
              Once you upload a game, the newest reviews will show up here for quick coach access.
            </div>
          )}

          <div className="mt-6">
            <Link className="ghost-button" to="/students">
              Manage All Students
            </Link>
          </div>
        </SectionCard>
      </div>

      {latestReview && latestReviewAnalysis ? (
        <SectionCard
          eyebrow="Latest Review"
          title={`${latestReview.playerName} vs ${latestReview.opponentName}`}
          description="This is the last saved review in the workspace. Open it when you want to continue from the newest game."
          className="mt-6"
        >
          <div className="rounded-[1.5rem] border border-line bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-3">
                  <span className="metric-chip">{latestReview.opening}</span>
                  <span className="metric-chip">{latestReviewAnalysis.kind === 'deep' ? 'Detailed review' : 'Game summary'}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-copy">{latestReviewAnalysis.report.executiveSummary}</p>
              </div>

              <Link className="brand-button" to={`/review/${latestReview.id}`}>
                Open Latest Review
              </Link>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  )
}
