import { useDeferredValue, useState, useTransition } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PgnDropZone } from '../components/PgnDropZone'
import { SectionCard } from '../components/SectionCard'
import { demoGames, demoStudent } from '../data/seeds'
import { parseGame } from '../lib/chess/pgn'
import { upsertImportedGame } from '../lib/db'
import type { ParsedGame, PlayerSide } from '../types/coaching'

function normalizeGoals(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function IntakeRoute() {
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  const [studentName, setStudentName] = useState('')
  const [focusStatement, setFocusStatement] = useState(
    'The student wants clearer game plans and calmer decisions when the position gets sharp.',
  )
  const [goalsText, setGoalsText] = useState(
    'Understand my biggest strengths\nSee the moments where the game turned\nKnow what to practice before the next lesson',
  )
  const [coachedSide, setCoachedSide] = useState<PlayerSide>('white')
  const [pgn, setPgn] = useState('')
  const [submitError, setSubmitError] = useState('')

  const deferredPgn = useDeferredValue(pgn)
  let preview: ParsedGame | null = null
  let previewError = ''

  if (deferredPgn.trim()) {
    try {
      preview = parseGame(deferredPgn, coachedSide, studentName.trim() || undefined)
    } catch (error) {
      previewError = error instanceof Error ? error.message : 'The PGN could not be parsed.'
    }
  }

  function loadDemo() {
    const demoGame = demoGames.find((game) => game.id === 'game-grunfeld-pressure') ?? demoGames[0]
    if (!demoGame) {
      return
    }

    setStudentName(demoStudent.name)
    setFocusStatement(demoStudent.focusStatement)
    setGoalsText(demoStudent.goals.join('\n'))
    setCoachedSide(demoGame.coachedSide)
    setPgn(demoGame.pgn)
    setSubmitError('')
  }

  async function handleSubmit() {
    if (!studentName.trim()) {
      setSubmitError('Please add the student name before creating the review.')
      return
    }

    if (!pgn.trim()) {
      setSubmitError('Please add a PGN before continuing.')
      return
    }

    try {
      setSubmitError('')
      const result = await upsertImportedGame({
        studentName,
        focusStatement,
        goals: normalizeGoals(goalsText),
        coachedSide,
        pgn,
      })

      startTransition(() => {
        navigate(`/review/${result.gameId}`)
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The game could not be saved.')
    }
  }

  const moveCount = preview ? Math.ceil(preview.moves.length / 2) : 0

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Upload A Game</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Upload one game and get a clear coaching summary.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              Students and parents can use this page to turn one saved game into something useful: what went well, where the game turned, and what to practice next.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="brand-button" onClick={loadDemo}>
                <Sparkles className="mr-2 h-4 w-4" />
                Use Sample Game
              </button>
              <Link className="ghost-button" to="/">
                Back Home
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: UserRound,
                title: 'Simple To Fill In',
                body: 'Add the student name, say what they want help with, and paste the game. That is enough to get started.',
              },
              {
                icon: ClipboardList,
                title: 'Clear Game Summary',
                body: 'The app pulls out the opening, result, and key moments so the review is easy to understand.',
              },
              {
                icon: CheckCircle2,
                title: 'Useful Next Steps',
                body: 'Each saved review leads straight into practice ideas and a progress trail you can come back to later.',
              },
            ].map((item) => (
              <div key={item.title} className="panel p-5">
                <item.icon className="h-5 w-5 text-forest" />
                <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-copy">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <SectionCard
          eyebrow="Game Details"
          title="Add the student and the game"
          description="Keep this lightweight. Add the student's name, say what they want help with, and paste the PGN."
        >
          <div className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Student name
                <input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  placeholder="Samaritan963"
                  className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                />
              </label>

              <fieldset className="grid gap-2 text-sm font-semibold text-ink">
                <legend className="mb-1">Which color did the student play?</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(['white', 'black'] as PlayerSide[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setCoachedSide(side)}
                      className={[
                        'rounded-[1.25rem] border px-4 py-3 text-sm font-bold capitalize transition',
                        coachedSide === side
                          ? 'border-forest bg-forest text-white'
                          : 'border-line bg-white text-ink hover:border-forest/20 hover:bg-mint-soft/60',
                      ].join(' ')}
                    >
                      {side}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              What should we focus on right now?
              <textarea
                value={focusStatement}
                onChange={(event) => setFocusStatement(event.target.value)}
                placeholder="For example: planning better in the middlegame, finishing attacks, or playing more calmly under pressure."
                className="min-h-28 rounded-[1.5rem] border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Current goals
              <textarea
                value={goalsText}
                onChange={(event) => setGoalsText(event.target.value)}
                placeholder="One goal per line"
                className="min-h-28 rounded-[1.5rem] border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>

            <PgnDropZone value={pgn} onChange={setPgn} onLoadDemo={loadDemo} />

            {submitError ? (
              <div className="rounded-[1.5rem] border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" className="brand-button" disabled={isPending} onClick={() => void handleSubmit()}>
                {isPending ? 'Opening review...' : 'Create Game Review'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link className="ghost-button" to="/">
                Cancel
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Preview"
          title="What we found in this game"
          description="This helps you confirm the right player, opening, and result before saving the review."
        >
          {preview ? (
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                  Parsed game
                </p>
                <h3 className="mt-4 font-heading text-3xl font-bold tracking-[-0.05em] text-ink">
                  {preview.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-copy">{preview.eventSummary || 'Offline import ready for review.'}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="metric-chip">{preview.opening}</span>
                  <span className="metric-chip">{preview.outcome}</span>
                  <span className="metric-chip">{moveCount} moves</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    Coached player
                  </p>
                  <div className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {preview.selectedPlayer}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-copy">
                    Reviewing from the {preview.coachedSide} side against {preview.opponent}.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-line bg-white p-5">
                  <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                    What happens next
                  </p>
                  <div className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    Clear review first
                  </div>
                  <p className="mt-2 text-sm leading-7 text-copy">
                    The app will save a game summary, key turning points, and a practice plan you can use for the next lesson or week of training.
                  </p>
                </div>
              </div>
            </div>
          ) : previewError ? (
            <div className="rounded-[1.5rem] border border-saffron/40 bg-saffron-soft p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-saffron" />
                <div>
                  <h3 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    This PGN needs a quick fix
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-copy">{previewError}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-forest/20 bg-ivory/70 p-6">
              <p className="text-sm leading-7 text-copy">
                Paste or drop a PGN to preview the student name, opening, result, and move count before saving the review.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
