import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Gauge, Printer, Radar, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BoardPreview } from '../components/BoardPreview'
import { MetricCard } from '../components/MetricCard'
import { MoveList } from '../components/MoveList'
import { ScoreMeter } from '../components/ScoreMeter'
import { SectionCard } from '../components/SectionCard'
import { buildDeepReport } from '../lib/chess/report'
import { runDeepEngineReview } from '../lib/chess/engine'
import { parseGame } from '../lib/chess/pgn'
import { db, saveDeepAnalysis } from '../lib/db'
import { downloadMarkdownReport } from '../lib/reportExport'
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
  const record = useLiveQuery(async () => {
    if (!gameId) {
      return null
    }

    const game = await db.games.get(gameId)
    if (!game) {
      return null
    }

    const student = await db.students.get(game.studentId)
    const analyses = await db.analyses.where('gameId').equals(game.id).toArray()
    return {
      game,
      student,
      analyses,
    }
  }, [gameId])

  const [currentPly, setCurrentPly] = useState(0)
  const [isReviewing, setIsReviewing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [reviewError, setReviewError] = useState('')
  const parsed =
    record?.game && record.student ? parseGame(record.game.pgn, record.game.coachedSide, record.student.name) : null
  const loadedGameId = record?.game?.id ?? ''
  const parsedLength = parsed?.moves.length ?? 0

  useEffect(() => {
    if (!loadedGameId) {
      return
    }

    setCurrentPly((existing) => {
      if (parsedLength === 0) {
        return 0
      }
      return existing > 0 && existing <= parsedLength ? existing : parsedLength
    })
  }, [loadedGameId, parsedLength])

  if (record === undefined) {
    return null
  }

  if (!record?.game || !record.student) {
    return (
      <div className="px-5 py-8 sm:px-7 sm:py-10">
        <div className="panel p-8">
          <p className="section-label">Game Review</p>
          <h1 className="mt-4 font-heading text-4xl font-bold tracking-[-0.06em] text-ink">
            This game is not available locally.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-copy">
            Head back home or upload a new PGN to create another game review.
          </p>
          <div className="mt-6">
            <Link className="brand-button" to="/">
              Back Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!parsed) {
    return null
  }

  const { game, student, analyses } = record
  const parsedGame = parsed
  const preferredAnalysis =
    analyses.find((analysis) => analysis.kind === 'deep') ??
    analyses.find((analysis) => analysis.kind === 'instant') ??
    null
  const report = preferredAnalysis?.report
  const engineReview = preferredAnalysis?.engineReview
  const currentMove = parsedGame.moves.find((move) => move.ply === currentPly) ?? parsedGame.moves.at(-1) ?? null
  const selectedEngineMove = engineReview?.reviews.find((move) => move.ply === currentPly)
  const selectedCriticalMoment =
    report?.criticalMoments.find((moment) => moment.ply === currentPly) ??
    report?.criticalMoments[0] ??
    null
  const boardFen = currentMove?.afterFen ?? parsedGame.moves[0]?.beforeFen ?? ''

  async function handleDeepReview() {
    try {
      setReviewError('')
      setIsReviewing(true)
      setProgress(0)
      setProgressLabel('Preparing the detailed review')

      const snapshot = await runDeepEngineReview(parsedGame, 10, (nextProgress, label) => {
        setProgress(nextProgress)
        setProgressLabel(label)
      })

      const deepAnalysis: PersistedAnalysis = {
        id: `${game.id}-deep`,
        gameId: game.id,
        studentId: student.id,
        kind: 'deep',
        createdAt: new Date().toISOString(),
        report: buildDeepReport(parsedGame, snapshot),
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

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Game Review</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] xl:items-end">
          <div>
            <div className="metric-chip">{game.opening}</div>
            <h1 className="mt-5 max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              {report?.headline ?? game.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              {report?.executiveSummary ??
                'The game summary is ready. Add a more detailed review whenever you want a closer look at the biggest turning points.'}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                className="brand-button"
                disabled={isReviewing}
                onClick={() => void handleDeepReview()}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {engineReview ? 'Refresh Detailed Review' : 'Add Detailed Review'}
              </button>
              <button
                type="button"
                className="ghost-button"
                disabled={!report}
                onClick={() => report && downloadMarkdownReport(student, game, report)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </button>
              <button type="button" className="ghost-button" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </button>
              <Link className="ghost-button" to={`/students/${student.id}`}>
                See Student Progress
              </Link>
            </div>
          </div>

          <div className="panel p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
              Review status
            </p>
            <div className="mt-4 font-heading text-3xl font-bold tracking-[-0.05em] text-ink">
              {engineReview ? 'Detailed review ready' : 'Game summary ready'}
            </div>
            <p className="mt-2 text-sm leading-7 text-copy">
              {progressLabel || 'You can read the summary now and add a more detailed pass whenever you want a closer breakdown of the key moments.'}
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-saffron to-forest transition-[width] duration-300"
                style={{ width: `${isReviewing ? progress : engineReview ? 100 : 42}%` }}
              />
            </div>
            {reviewError ? (
              <div className="mt-4 rounded-[1.25rem] border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
                {reviewError}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Student"
          value={parsedGame.selectedPlayer}
          description={`Against ${parsedGame.opponent}, from the ${parsedGame.coachedSide} side.`}
        />
        <MetricCard
          label="Result"
          value={parsedGame.outcome}
          description="Shown from the student's side of the board."
        />
        <MetricCard
          label="Report Type"
          value={report?.generatedFrom === 'deep' ? 'Detailed' : 'Summary'}
          description="Start with the clear summary, then add a deeper review if you want a closer look."
        />
        <MetricCard
          label="Key Moments"
          value={String(report?.criticalMoments.length ?? 0)}
          description="The positions most worth replaying and learning from."
        />
      </div>

      <div className="print-hidden mt-6 flex gap-3 overflow-x-auto pb-1">
        {[
          ['#review-board', 'Board'],
          ['#review-fingerprint', 'Playing style'],
          ['#review-moments', 'Key moments'],
          ['#review-training', 'Practice plan'],
          ['#review-session', 'Lesson notes'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="metric-chip whitespace-nowrap">
            <Radar className="h-3.5 w-3.5" />
            {label}
          </a>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <SectionCard
          id="review-board"
          eyebrow="Replay The Game"
          title={`${game.title} move by move`}
          description={parsedGame.eventSummary || 'Replay the game, then jump straight to the moments that mattered most.'}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <BoardPreview
              fen={boardFen}
              orientation={game.coachedSide}
              highlightedSquares={currentMove ? [currentMove.from, currentMove.to] : []}
            />
            <MoveList moves={parsedGame.moves} currentPly={currentMove?.ply ?? 0} onSelect={setCurrentPly} />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Current Position"
          title={currentMove ? `Move ${currentMove.moveNumber} ${currentMove.san}` : 'Start position'}
          description="Use this panel to understand why the current position matters."
        >
          {currentMove ? (
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                  Move details
                </p>
                <p className="mt-4 text-sm leading-7 text-copy">
                  {currentMove.isCapture ? 'Capture' : 'Quiet move'} from {currentMove.from} to {currentMove.to} in the {currentMove.phase}.
                  {currentMove.isCheck ? ' The move gives check.' : ''}
                  {currentMove.isCastle ? ' Castling signal picked up.' : ''}
                </p>
              </div>

              {selectedEngineMove ? (
                <div className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Detailed review note
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${severityClasses(selectedEngineMove.classification)}`}>
                      {prettySeverity(selectedEngineMove.classification)}
                    </span>
                    <span className="metric-chip">Swing {selectedEngineMove.cpl}</span>
                    <span className="metric-chip">Better move {selectedEngineMove.bestMove}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-copy">
                    {selectedEngineMove.bestLine.length
                      ? `A stronger line to explore is ${selectedEngineMove.bestLine.slice(0, 6).join(' ')}.`
                      : 'This deeper review marks the moment as important even without a suggested line.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Helpful note
                  </p>
                  <p className="mt-4 text-sm leading-7 text-copy">
                    Add a detailed review if you want this panel to suggest a stronger move and show a clearer alternative line.
                  </p>
                </div>
              )}

              {selectedCriticalMoment ? (
                <div className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Why this position matters
                  </p>
                  <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {selectedCriticalMoment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-copy">{selectedCriticalMoment.explanation}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-copy">This PGN has no move data to review.</p>
          )}
        </SectionCard>
      </div>

      {report ? (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SectionCard
              id="review-fingerprint"
              eyebrow="Playing Style"
              title={report.styleFingerprint.archetype}
              description={report.styleFingerprint.summary}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {report.styleFingerprint.meters.map((meter) => (
                  <ScoreMeter key={meter.label} meter={meter} />
                ))}
              </div>
              <div className="mt-6 rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                  Why this matters
                </p>
                <p className="mt-3 text-sm leading-7 text-copy">{report.styleFingerprint.coachHook}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {report.styleFingerprint.openingLean.map((item) => (
                    <span key={item} className="metric-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Game Flow"
              title="Where the game felt strongest and where it got harder"
              description="This turns the review into a quick view of where the student looked comfortable and where the position started to slip."
            >
              <div className="grid gap-4">
                {report.phaseScores.map((phase) => (
                  <div key={phase.phase} className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-heading text-2xl font-bold tracking-[-0.04em] capitalize text-ink">
                          {phase.phase}
                        </p>
                        <p className="text-sm leading-7 text-copy">{phase.caption}</p>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                        <Gauge className="h-4 w-4 text-forest" />
                        <span className="font-heading text-2xl font-bold text-forest">{phase.score}</span>
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-saffron to-forest"
                        style={{ width: `${phase.score}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-copy/70">
                      Built from {phase.basis === 'engine' ? 'the detailed review' : 'the game summary'}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SectionCard
              eyebrow="Strengths And Targets"
              title="What to keep and what to improve"
              description="This is the heart of the review: what is already working, and what should get the next block of attention."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-line bg-mint-soft/70 p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Doing well
                  </p>
                  <div className="mt-4 grid gap-4">
                    {report.strengths.map((item) => (
                      <div key={item.title} className="rounded-[1.25rem] bg-white p-4">
                        <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-saffron-soft/70 p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Working on next
                  </p>
                  <div className="mt-4 grid gap-4">
                    {report.leaks.map((item) => (
                      <div key={item.title} className="rounded-[1.25rem] bg-white p-4">
                        <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              id="review-moments"
              eyebrow="Key Moments"
              title="The positions worth replaying"
              description="These are the moments most worth revisiting in the next lesson or practice session."
            >
              <div className="grid gap-4">
                {report.criticalMoments.map((moment) => (
                  <button
                    key={`${moment.ply}-${moment.san}`}
                    type="button"
                    onClick={() => setCurrentPly(moment.ply)}
                    className="rounded-[1.5rem] border border-line bg-white p-5 text-left transition hover:border-forest/20 hover:bg-mint-soft/60"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${severityClasses(moment.severity)}`}>
                        {prettySeverity(moment.severity)}
                      </span>
                      <span className="metric-chip">Move {moment.moveNumber}</span>
                      <span className="metric-chip">{moment.san}</span>
                    </div>
                    <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                      {moment.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{moment.explanation}</p>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <SectionCard
              id="review-training"
              eyebrow="Practice Plan"
              title="Turn this game into next week's work"
              description="Each block is there to make the student stronger without flattening their natural style."
            >
              <div className="grid gap-4">
                {report.trainingPlan.map((block) => (
                  <div key={block.title} className="rounded-[1.5rem] border border-line bg-white p-5">
                    <h3 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                      {block.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-copy">{block.why}</p>
                    <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                      Practice ideas
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm leading-7 text-copy">
                      {block.drills.map((drill) => (
                        <li key={drill} className="rounded-2xl bg-ivory px-4 py-3">
                          {drill}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm font-semibold text-forest">Target: {block.target}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              id="review-session"
              eyebrow="Lesson Notes"
              title="A simple outline for the next lesson"
              description="Use this as a clear handoff between this game, the next lesson, and the week's follow-up."
            >
              <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                <div className="grid gap-4">
                  {report.sessionAgenda.map((item) => (
                    <div key={item.title} className="rounded-[1.25rem] bg-white p-4">
                      <h3 className="font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-copy">{item.detail}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Follow-up note
                  </p>
                  <p className="mt-3 text-sm leading-7 text-copy">{report.followUp}</p>
                </div>
                <div className="mt-5 rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Checklist
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm leading-7 text-copy">
                    {report.actionChecklist.map((item) => (
                      <li key={item} className="rounded-2xl bg-ivory px-4 py-3">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>
        </>
      ) : null}

      <div className="print-hidden mt-6">
        <Link className="ghost-button" to="/">
          Back Home
        </Link>
      </div>
    </div>
  )
}
