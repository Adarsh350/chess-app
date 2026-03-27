import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { StudentDetailFrame } from '../components/StudentDetailFrame'
import { reviewReplayPath } from '../lib/routes'
import { preferredAnalysisByGame, reviewPlayerLabelForDisplay, reviewTitleForDisplay, useStudentRecord } from '../lib/workspace'

export function StudentGamesRoute() {
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

  const reportByGame = preferredAnalysisByGame(
    record.games.map((game) => game.id),
    record.analyses,
  )

  return (
    <StudentDetailFrame student={record.student} currentTab="games">
      {record.games.length ? (
        <section className="table-shell">
          <div className="table-header">
            <span>Game</span>
            <span>Opening</span>
            <span>Type</span>
            <span>Date</span>
            <span>Action</span>
          </div>

          {record.games.map((game) => {
            const analysis = reportByGame.get(game.id)
            return (
              <div key={game.id} className="table-row">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-meta">{reviewPlayerLabelForDisplay(game, record.student)}</span>
                    <span className="inline-meta">{game.result}</span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {reviewTitleForDisplay(game, record.student)}
                  </h2>
                  <p className="text-sm leading-7 text-copy">
                    {analysis?.report.oneLiner ?? 'This review is ready to open.'}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-copy/75">
                    {reviewPlayerLabelForDisplay(game, record.student)}
                  </p>
                </div>

                <div className="text-sm leading-7 text-copy">{game.opening}</div>

                <div className="text-sm text-copy lg:self-center">
                  {analysis?.kind === 'deep' ? 'Detailed review' : 'Summary'}
                </div>

                <div className="text-sm text-copy lg:self-center">
                  {new Date(game.importedAt).toLocaleDateString()}
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
          eyebrow="Games"
          title="No saved games yet."
          description="Import the first PGN and the student game history will start here."
        />
      )}
    </StudentDetailFrame>
  )
}
