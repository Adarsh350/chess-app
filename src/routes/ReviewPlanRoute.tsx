import { Download, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ReviewDetailFrame } from '../components/ReviewDetailFrame'
import { downloadMarkdownReport } from '../lib/reportExport'
import { reviewReplayPath } from '../lib/routes'
import { useReviewRecord } from '../lib/workspace'

export function ReviewPlanRoute() {
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
      currentTab="plan"
      actions={
        report ? (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => downloadMarkdownReport(record.student, record.game, report)}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </button>
            <button type="button" className="primary-button" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </button>
          </>
        ) : (
          <Link className="secondary-button" to={reviewReplayPath(record.game.id)}>
            Open replay
          </Link>
        )
      }
    >
      {report ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="workspace-card">
              <p className="section-label">Strengths</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                What to keep building on
              </h2>
              <div className="mt-5 grid gap-3">
                {report.strengths.map((item) => (
                  <div key={item.title} className="rounded-xl border border-line bg-mint-soft/45 px-4 py-4">
                    <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <p className="section-label">Targets</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                What to coach next
              </h2>
              <div className="mt-5 grid gap-3">
                {report.leaks.map((item) => (
                  <div key={item.title} className="rounded-xl border border-line bg-saffron-soft/55 px-4 py-4">
                    <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="workspace-card">
              <p className="section-label">Practice plan</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                Turn this game into the next block of work
              </h2>
              <div className="mt-5 grid gap-4">
                {report.trainingPlan.map((block) => (
                  <div key={block.title} className="surface-muted">
                    <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{block.why}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Drills</p>
                    <ul className="mt-3 grid gap-2">
                      {block.drills.map((drill) => (
                        <li key={drill} className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                          {drill}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-forest">Target: {block.target}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <p className="section-label">Lesson plan</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                The next session outline
              </h2>
              <div className="mt-5 grid gap-4">
                {report.sessionAgenda.map((item) => (
                  <div key={item.title} className="surface-muted">
                    <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                  </div>
                ))}
                <div className="surface-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Follow-up</p>
                  <p className="mt-3 text-sm leading-7 text-copy">{report.followUp}</p>
                </div>
                <div className="surface-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Checklist</p>
                  <ul className="mt-3 grid gap-2">
                    {report.actionChecklist.map((item) => (
                      <li key={item} className="rounded-lg border border-line bg-white px-4 py-3 text-sm font-semibold text-ink">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <EmptyState
          eyebrow="Plan"
          title="The planning view needs at least one saved report."
          description="Open the replay first so the game summary exists, then come back here for the training and lesson plan."
        />
      )}
    </ReviewDetailFrame>
  )
}
