import { ArrowRight, Clock3, Eye, EyeOff, Plus, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { importPath, reviewReplayPath, studentOverviewPath } from '../lib/routes'
import { formatShortDate, preferredAnalysisByGame, reviewPlayerLabelForDisplay, reviewTitleForDisplay, useDemoVisibility, useWorkspaceRecord, visibleGames, visibleStudents } from '../lib/workspace'

export function DashboardRoute() {
  const record = useWorkspaceRecord()
  const [showDemo, setShowDemo] = useDemoVisibility()

  if (!record) {
    return null
  }

  const hasSeededStudents = record.students.some((student) => student.kind === 'seeded')
  const activeStudents = visibleStudents(
    record.students.filter((student) => student.archivedAt === null),
    showDemo,
  )
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'custom' ? -1 : 1
      }
      return right.updatedAt.localeCompare(left.updatedAt)
    })
  const activeIds = new Set(activeStudents.map((student) => student.id))
  const games = visibleGames(record.games, activeIds)
  const analyses = record.analyses.filter((analysis) => activeIds.has(analysis.studentId))
  const reportByGame = preferredAnalysisByGame(
    games.map((game) => game.id),
    analyses,
  )
  const latestReview = games[0] ?? null
  const latestReviewStudent = latestReview
    ? activeStudents.find((student) => student.id === latestReview.studentId) ?? null
    : null
  const nextStudent = [...activeStudents].sort((left, right) => {
    const leftLatest = games.find((game) => game.studentId === left.id)?.importedAt ?? left.updatedAt
    const rightLatest = games.find((game) => game.studentId === right.id)?.importedAt ?? right.updatedAt
    return leftLatest.localeCompare(rightLatest)
  })[0] ?? null
  const recentActivity = games.slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Today"
        title="Run the next coaching move, not a dashboard."
        description="Pick up the most recent review, open the next student who needs attention, or import the next PGN without digging through crowded pages."
        meta={
          <>
            <span className="inline-meta">{activeStudents.length} active students</span>
            <span className="inline-meta">{games.length} saved reviews</span>
          </>
        }
        actions={
          <>
            {hasSeededStudents ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowDemo((value) => !value)}
              >
                {showDemo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showDemo ? 'Hide sample data' : 'Show sample data'}
              </button>
            ) : null}
            <Link className="secondary-button" to="/students/new">
              <Plus className="mr-2 h-4 w-4" />
              New student
            </Link>
            <Link className="primary-button" to={importPath()}>
              <Upload className="mr-2 h-4 w-4" />
              Import PGN
            </Link>
          </>
        }
      />

      {!activeStudents.length ? (
        <EmptyState
          eyebrow="Coach setup"
          title="There are no active students yet."
          description="Create the first student profile, then import a PGN to start a clean review trail. Sample games stay tucked behind the import page unless you choose to show them."
          action={
            <Link className="primary-button" to="/students/new">
              Create first student
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <section className="workspace-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Resume review</p>
                  <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {latestReview && latestReviewStudent
                      ? reviewTitleForDisplay(latestReview, latestReviewStudent)
                      : 'No saved review yet'}
                  </h2>
                </div>
                {latestReview ? (
                  <Link className="primary-button" to={reviewReplayPath(latestReview.id)}>
                    Open replay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ) : null}
              </div>

              {latestReview ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                  <div className="surface-muted">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-meta">
                        {latestReviewStudent
                          ? reviewPlayerLabelForDisplay(latestReview, latestReviewStudent)
                          : latestReview.playerName}
                      </span>
                      <span className="inline-meta">{latestReview.opening}</span>
                      <span className="inline-meta">{formatShortDate(latestReview.importedAt)}</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-copy">
                      {reportByGame.get(latestReview.id)?.report.oneLiner ??
                        'The saved summary is ready to reopen.'}
                    </p>
                  </div>
                  <div className="surface-muted">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">
                      Report status
                    </p>
                    <div className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                      {reportByGame.get(latestReview.id)?.kind === 'deep'
                        ? 'Detailed review ready'
                        : 'Summary ready'}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-copy">
                      Open replay first, then continue into the insight and plan tabs from the same review.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-copy">
                  Import the first PGN and the replay workspace will show up here.
                </p>
              )}
            </section>

            <section className="workspace-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="section-label">Next student</p>
                  <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {nextStudent?.name ?? 'No student selected'}
                  </h2>
                </div>
                {nextStudent ? (
                  <Link className="secondary-button" to={studentOverviewPath(nextStudent.id)}>
                    Open profile
                  </Link>
                ) : null}
              </div>

              {nextStudent ? (
                <div className="mt-5 space-y-4">
                  <div className="surface-muted">
                    <p className="text-sm leading-7 text-copy">{nextStudent.focusStatement}</p>
                  </div>

                  <div className="grid gap-3">
                    {nextStudent.goals.slice(0, 3).map((goal) => (
                      <div key={goal} className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                        {goal}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-copy">
                    <Clock3 className="h-4 w-4 text-forest" />
                    Last activity {formatShortDate(games.find((game) => game.studentId === nextStudent.id)?.importedAt ?? nextStudent.updatedAt)}
                  </div>
                </div>
              ) : null}
            </section>
          </div>

          <section className="table-shell">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-label">Recent activity</p>
                <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  The latest saved reviews
                </h2>
              </div>
              <Link className="secondary-button" to="/reviews">
                See all reviews
              </Link>
            </div>

            {recentActivity.length ? (
              <div className="stack-list px-5 py-4">
                {recentActivity.map((game) => {
                  const student = activeStudents.find((entry) => entry.id === game.studentId)
                  const analysis = reportByGame.get(game.id)
                  return (
                    <Link
                      key={game.id}
                      to={reviewReplayPath(game.id)}
                      className="flex flex-col gap-3 rounded-xl border border-line bg-[#fbfaf6] px-4 py-4 transition-colors duration-200 hover:bg-mint-soft/55 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-meta">{student?.name ?? 'Student'}</span>
                          <span className="inline-meta">{game.opening}</span>
                        </div>
                        <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                          {student ? reviewTitleForDisplay(game, student) : game.title}
                        </h3>
                        <p className="text-sm leading-7 text-copy">
                          {analysis?.report.oneLiner ?? 'This review is ready to open.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-copy lg:items-end">
                        <span className="inline-meta">
                          {analysis?.kind === 'deep' ? 'Detailed review' : 'Summary'}
                        </span>
                        <span>{formatShortDate(game.importedAt)}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="px-5 py-5">
                <EmptyState
                  title="No review activity yet."
                  description="Import a PGN and the latest reviews will show up here so you can jump back into the work quickly."
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
