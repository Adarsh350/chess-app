import { Eye, EyeOff, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { reviewReplayPath } from '../lib/routes'
import { formatShortDate, preferredAnalysisByGame, reviewPlayerLabelForDisplay, reviewTitleForDisplay, useDemoVisibility, useWorkspaceRecord, visibleGames, visibleStudents } from '../lib/workspace'

export function ReviewsRoute() {
  const record = useWorkspaceRecord()
  const [showDemo, setShowDemo] = useDemoVisibility()
  const [search, setSearch] = useState('')
  const [studentFilter, setStudentFilter] = useState('all')

  if (!record) {
    return null
  }

  const hasSeededStudents = record.students.some((student) => student.kind === 'seeded')
  const visibleRoster = visibleStudents(record.students, showDemo)
  const activeStudents = visibleRoster.filter((student) => student.archivedAt === null)
  const visibleIds = new Set(visibleRoster.map((student) => student.id))
  const games = visibleGames(record.games, visibleIds).filter((game) =>
    studentFilter === 'all' ? true : game.studentId === studentFilter,
  )
  const matchingGames = games.filter((game) => {
    const student = record.students.find((entry) => entry.id === game.studentId)
    return [
      student ? reviewTitleForDisplay(game, student) : game.title,
      game.opening,
      student ? reviewPlayerLabelForDisplay(game, student) : game.playerName,
      game.opponentName,
      student?.name ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  })
  const reportByGame = preferredAnalysisByGame(
    matchingGames.map((game) => game.id),
    record.analyses,
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reviews"
        title="Open any saved game review without hunting for it."
        description="This page is only for finding saved reviews across the whole workspace. Student management and importing stay on their own pages."
        meta={
          <>
            <span className="inline-meta">{games.length} visible reviews</span>
            <span className="inline-meta">{record.analyses.filter((analysis) => analysis.kind === 'deep' && visibleIds.has(analysis.studentId)).length} detailed</span>
          </>
        }
        actions={
          hasSeededStudents ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowDemo((value) => !value)}
            >
              {showDemo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showDemo ? 'Hide sample data' : 'Show sample data'}
            </button>
          ) : undefined
        }
      />

      <section className="toolbar">
        <label className="relative block lg:min-w-[22rem]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-copy/70" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reviews"
            className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
          />
        </label>

        <select
          value={studentFilter}
          onChange={(event) => setStudentFilter(event.target.value)}
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
        >
          <option value="all">All students</option>
          {activeStudents.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </section>

      {matchingGames.length ? (
        <section className="table-shell">
          <div className="table-header">
            <span>Review</span>
            <span>Student</span>
            <span>Opening</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {matchingGames.map((game) => {
            const student = record.students.find((entry) => entry.id === game.studentId)
            const analysis = reportByGame.get(game.id)

            return (
              <div key={game.id} className="table-row">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-meta">{formatShortDate(game.importedAt)}</span>
                    <span className="inline-meta">{game.result}</span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {student ? reviewTitleForDisplay(game, student) : game.title}
                  </h2>
                  <p className="text-sm leading-7 text-copy">
                    {analysis?.report.oneLiner ?? 'This saved review is ready to open.'}
                  </p>
                </div>

                <div className="space-y-2 text-sm leading-7 text-copy">
                  <div className="font-semibold text-ink">{student?.name ?? 'Student'}</div>
                  <div>{student ? reviewPlayerLabelForDisplay(game, student) : game.playerName}</div>
                </div>

                <div className="text-sm leading-7 text-copy">{game.opening}</div>

                <div className="text-sm text-copy lg:self-center">
                  {analysis?.kind === 'deep' ? 'Detailed review' : 'Summary'}
                </div>

                <div className="lg:self-center">
                  <Link className="secondary-button" to={reviewReplayPath(game.id)}>
                    Open replay
                  </Link>
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <EmptyState
          eyebrow="Reviews"
          title="No review matches that search."
          description="Adjust the student filter or search term, or import a new PGN to create another saved review."
        />
      )}
    </div>
  )
}
