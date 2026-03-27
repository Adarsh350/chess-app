import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ReviewDetailFrame } from '../components/ReviewDetailFrame'
import { ScoreMeter } from '../components/ScoreMeter'
import { reviewReplayPath } from '../lib/routes'
import { useReviewRecord } from '../lib/workspace'

function prettySeverity(severity: string) {
  if (severity === 'blunder') {
    return 'Major swing'
  }

  if (severity === 'mistake') {
    return 'Key mistake'
  }

  if (severity === 'inaccuracy') {
    return 'Small slip'
  }

  if (severity === 'solid') {
    return 'Solid choice'
  }

  return 'Strong choice'
}

function severityTone(severity: string) {
  if (severity === 'blunder') {
    return 'bg-[#fff0ee]'
  }
  if (severity === 'mistake') {
    return 'bg-saffron-soft'
  }
  if (severity === 'inaccuracy') {
    return 'bg-mint-soft/70'
  }
  return 'bg-[#fbfaf6]'
}

export function ReviewInsightsRoute() {
  const { gameId } = useParams()
  const record = useReviewRecord(gameId)

  if (record === undefined) {
    return null
  }

  if (!record?.game || !record.student) {
    return (
      <EmptyState
        eyebrow="Review"
        title="This game is not available locally."
        description="Head back to the review list or import a new PGN to create another game review."
        action={
          <Link className="primary-button" to="/reviews">
            Back to reviews
          </Link>
        }
      />
    )
  }

  const report = record.preferredAnalysis?.report

  return (
    <ReviewDetailFrame
      game={record.game}
      student={record.student}
      analysis={record.preferredAnalysis}
      currentTab="insights"
      actions={
        <Link className="secondary-button" to={reviewReplayPath(record.game.id)}>
          Open replay
        </Link>
      }
    >
      {report ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="workspace-card">
              <p className="section-label">Playing style</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {report.styleFingerprint.archetype}
              </h2>
              <p className="mt-3 text-sm leading-7 text-copy">{report.styleFingerprint.summary}</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {report.styleFingerprint.meters.map((meter) => (
                  <ScoreMeter key={meter.label} meter={meter} />
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <p className="section-label">Phase flow</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                Where the game held together and where it slipped
              </h2>
              <div className="mt-5 grid gap-4">
                {report.phaseScores.map((phase) => (
                  <div key={phase.phase} className="surface-muted">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-heading text-xl font-bold capitalize tracking-[-0.03em] text-ink">
                          {phase.phase}
                        </p>
                        <p className="text-sm leading-7 text-copy">{phase.caption}</p>
                      </div>
                      <div className="font-heading text-2xl font-bold tracking-[-0.04em] text-forest">
                        {phase.score}
                      </div>
                    </div>
                    <div className="mt-4 h-2.5 overflow-hidden rounded-md bg-white">
                      <div
                        className="h-full rounded-md bg-gradient-to-r from-saffron to-forest"
                        style={{ width: `${phase.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="workspace-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="section-label">Critical moments</p>
                <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  The positions worth replaying
                </h2>
              </div>
              <Link className="secondary-button" to={reviewReplayPath(record.game.id)}>
                Open replay
              </Link>
            </div>

            <div className="mt-5 grid gap-4">
              {report.criticalMoments.map((moment) => (
                <Link
                  key={`${moment.ply}-${moment.san}`}
                  to={reviewReplayPath(record.game.id, moment.ply)}
                  className={`rounded-xl border border-line px-4 py-4 transition-colors duration-200 hover:bg-mint-soft/55 ${severityTone(moment.severity)}`}
                >
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-meta">{prettySeverity(moment.severity)}</span>
                    <span className="inline-meta">Move {moment.moveNumber}</span>
                    <span className="inline-meta">{moment.san}</span>
                  </div>
                  <h3 className="mt-3 font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                    {moment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-copy">{moment.explanation}</p>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          eyebrow="Insights"
          title="The insight view needs at least one saved report."
          description="Create or reopen the review summary first, then the style and critical-moment view will appear here."
        />
      )}
    </ReviewDetailFrame>
  )
}
