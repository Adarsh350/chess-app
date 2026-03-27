import { ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { StudentDetailFrame } from '../components/StudentDetailFrame'
import { importPath, reviewReplayPath, studentGamesPath, studentProgressPath } from '../lib/routes'
import { reviewTitleForDisplay, useStudentRecord } from '../lib/workspace'
import { summarizeStudent } from '../lib/studentSummary'

export function StudentRoute() {
  const { studentId } = useParams()
  const record = useStudentRecord(studentId)

  if (record === undefined) {
    return null
  }

  if (!record?.student) {
    return (
      <EmptyState
        eyebrow="Student"
        title="That student profile is not available."
        description="Go back to the roster and open a different student, or create a new one."
        action={
          <Link className="primary-button" to="/students">
            Back to students
          </Link>
        }
      />
    )
  }

  const { student, games, analyses } = record
  const summary = summarizeStudent(games, analyses)
  const latestGame = games[0] ?? null

  return (
    <StudentDetailFrame student={student} currentTab="overview">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="workspace-card">
          <p className="section-label">Current focus</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
            What this student is working on now
          </h2>
          <p className="mt-4 text-sm leading-7 text-copy">{student.focusStatement}</p>

          <div className="mt-6 grid gap-3">
            {student.goals.map((goal) => (
              <div key={goal} className="rounded-xl border border-line bg-[#fbfaf6] px-4 py-3 text-sm font-semibold text-ink">
                {goal}
              </div>
            ))}
          </div>
        </section>

        <section className="workspace-card">
          <p className="section-label">Quick summary</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
            Coaching snapshot
          </h2>

          <div className="mt-5 grid gap-3">
            <div className="surface-muted">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Style read</p>
              <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {summary.signatureStyle}
              </p>
            </div>
            <div className="surface-muted">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Games saved</p>
              <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {games.length}
              </p>
            </div>
            <div className="surface-muted">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Detailed reviews</p>
              <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {summary.deepReviewCount}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="workspace-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Latest review</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {latestGame ? reviewTitleForDisplay(latestGame, student) : 'No review saved yet'}
              </h2>
            </div>
            {latestGame ? (
              <Link className="secondary-button" to={reviewReplayPath(latestGame.id)}>
                Open replay
              </Link>
            ) : null}
          </div>

          {latestGame ? (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-meta">{latestGame.opening}</span>
                <span className="inline-meta">{latestGame.result}</span>
              </div>
              <p className="text-sm leading-7 text-copy">
                Open the replay workspace to continue from this student&apos;s most recent game.
              </p>
            </div>
          ) : (
            <EmptyState
              title="This student has no saved games yet."
              description="Import the first PGN and the replay workspace will start building from there."
              action={
                <Link className="primary-button" to={importPath(student.id)}>
                  Import first game
                </Link>
              }
            />
          )}
        </section>

        <section className="workspace-card">
          <p className="section-label">What to open next</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
            Move into games or progress
          </h2>

          <div className="mt-5 grid gap-3">
            <Link
              className="flex items-center justify-between rounded-xl border border-line bg-[#fbfaf6] px-4 py-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-mint-soft/55"
              to={studentGamesPath(student.id)}
            >
              Review the full game history
              <ArrowRight className="h-4 w-4 text-forest" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-xl border border-line bg-[#fbfaf6] px-4 py-4 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-mint-soft/55"
              to={studentProgressPath(student.id)}
            >
              See style and progress signals
              <ArrowRight className="h-4 w-4 text-forest" />
            </Link>
          </div>
        </section>
      </div>
    </StudentDetailFrame>
  )
}
