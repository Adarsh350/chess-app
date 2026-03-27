import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BoardPreview } from '../components/BoardPreview'
import { EmptyState } from '../components/EmptyState'
import { MoveList } from '../components/MoveList'
import { ReviewDetailFrame } from '../components/ReviewDetailFrame'
import { buildDeepReport } from '../lib/chess/report'
import { runDeepEngineReview } from '../lib/chess/engine'
import { saveDeepAnalysis } from '../lib/db'
import { reviewInsightsPath } from '../lib/routes'
import { reviewTitleForDisplay, useReviewRecord } from '../lib/workspace'
import type { PersistedAnalysis } from '../types/coaching'

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

function severityClasses(severity: string) {
  if (severity === 'blunder') {
    return 'border-[#d84d4d]/20 bg-[#fff0ee] text-[#8d2f24]'
  }

  if (severity === 'mistake') {
    return 'border-saffron/25 bg-saffron-soft text-[#8a5a08]'
  }

  if (severity === 'inaccuracy') {
    return 'border-forest/15 bg-mint-soft/70 text-forest'
  }

  return 'border-line bg-ivory/80 text-copy'
}

export function ReviewRoute() {
  const { gameId } = useParams()
  const [queryParams, setQueryParams] = useSearchParams()
  const record = useReviewRecord(gameId)
  const [currentPly, setCurrentPly] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [reviewError, setReviewError] = useState('')
  const loadedGameId = record?.game?.id ?? ''
  const parsedLength = record?.parsed.moves.length ?? 0

  useEffect(() => {
    if (!loadedGameId) {
      return
    }

    const requestedPly = Number(queryParams.get('ply'))
    setCurrentPly(() => {
      if (requestedPly > 0 && requestedPly <= parsedLength) {
        return requestedPly
      }
      return parsedLength || 0
    })
  }, [loadedGameId, parsedLength, queryParams])

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

  const { game, student, preferredAnalysis, parsed } = record
  const report = preferredAnalysis?.report
  const engineReview = preferredAnalysis?.engineReview
  const currentMove = parsed.moves.find((move) => move.ply === currentPly) ?? parsed.moves.at(-1) ?? null
  const selectedEngineMove = engineReview?.reviews.find((move) => move.ply === currentPly)
  const selectedCriticalMoment =
    report?.criticalMoments.find((moment) => moment.ply === currentPly) ??
    report?.criticalMoments[0] ??
    null
  const boardFen = currentMove?.afterFen ?? parsed.moves[0]?.beforeFen ?? ''

  async function handleDeepReview() {
    try {
      setReviewError('')
      setIsReviewing(true)
      setProgress(0)
      setProgressLabel('Preparing the detailed review')

      const snapshot = await runDeepEngineReview(parsed, 10, (nextProgress, label) => {
        setProgress(nextProgress)
        setProgressLabel(label)
      })

      const deepAnalysis: PersistedAnalysis = {
        id: `${game.id}-deep`,
        gameId: game.id,
        studentId: student.id,
        kind: 'deep',
        createdAt: new Date().toISOString(),
        report: buildDeepReport(parsed, snapshot),
        engineReview: snapshot,
      }

      await saveDeepAnalysis(deepAnalysis)
      setProgress(100)
      setProgressLabel('Detailed review saved')
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'The detailed review could not be completed.')
    } finally {
      setIsReviewing(false)
    }
  }

  function selectPly(ply: number) {
    setCurrentPly(ply)
    setQueryParams((current) => {
      const next = new URLSearchParams(current)
      next.set('ply', String(ply))
      return next
    })
  }

  return (
    <ReviewDetailFrame
      game={game}
      student={student}
      analysis={preferredAnalysis}
      currentTab="replay"
      actions={
        <button type="button" className="primary-button" disabled={isReviewing} onClick={() => void handleDeepReview()}>
          <Sparkles className="mr-2 h-4 w-4" />
          {engineReview ? 'Refresh detailed review' : 'Add detailed review'}
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)]">
        <section className="workspace-card space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-label">Replay</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {reviewTitleForDisplay(game, student)} move by move
              </h2>
            </div>
            <Link className="secondary-button" to={reviewInsightsPath(game.id)}>
              Go to insights
            </Link>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <BoardPreview
              fen={boardFen}
              orientation={game.coachedSide}
              highlightedSquares={currentMove ? [currentMove.from, currentMove.to] : []}
            />
            <MoveList moves={parsed.moves} currentPly={currentMove?.ply ?? 0} onSelect={selectPly} />
          </div>
        </section>

        <section className="workspace-card space-y-4">
          <div className="surface-muted">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Review status</p>
            <div className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
              {engineReview ? 'Detailed review ready' : 'Summary ready'}
            </div>
            <p className="mt-2 text-sm leading-7 text-copy">
              {progressLabel ||
                'Replay the game now. If you want move-by-move grading and stronger alternatives, run the detailed review.'}
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-md bg-white">
              <div
                className="h-full rounded-md bg-gradient-to-r from-saffron to-forest transition-[width] duration-300"
                style={{ width: `${isReviewing ? progress : engineReview ? 100 : 42}%` }}
              />
            </div>
            {reviewError ? (
              <div className="mt-4 rounded-xl border border-saffron/35 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
                {reviewError}
              </div>
            ) : null}
          </div>

          {currentMove ? (
            <>
              <div className="surface-muted">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Current move</p>
                <h3 className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  Move {currentMove.moveNumber} {currentMove.san}
                </h3>
                <p className="mt-2 text-sm leading-7 text-copy">
                  {currentMove.isCapture ? 'Capture' : 'Quiet move'} from {currentMove.from} to {currentMove.to} in the {currentMove.phase}.
                  {currentMove.isCheck ? ' The move gives check.' : ''}
                  {currentMove.isCastle ? ' Castling signal picked up.' : ''}
                </p>
              </div>

              {selectedEngineMove ? (
                <div className="surface-muted">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-md border px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] ${severityClasses(selectedEngineMove.classification)}`}>
                      {prettySeverity(selectedEngineMove.classification)}
                    </span>
                    <span className="inline-meta">Swing {selectedEngineMove.cpl}</span>
                    <span className="inline-meta">Best {selectedEngineMove.bestMove}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-copy">
                    {selectedEngineMove.bestLine.length
                      ? `A stronger line to explore is ${selectedEngineMove.bestLine.slice(0, 6).join(' ')}.`
                      : 'This detailed review marks the moment as important even without a suggested line.'}
                  </p>
                </div>
              ) : (
                <div className="surface-muted">
                  <p className="text-sm leading-7 text-copy">
                    Run the detailed review if you want this panel to suggest a stronger move and clearer alternative line.
                  </p>
                </div>
              )}

              {selectedCriticalMoment ? (
                <div className="surface-muted">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Why this position matters</p>
                  <h3 className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {selectedCriticalMoment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-copy">{selectedCriticalMoment.explanation}</p>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="This PGN has no move data to replay."
              description="Import another game if you want to open the replay workspace."
            />
          )}
        </section>
      </div>
    </ReviewDetailFrame>
  )
}
