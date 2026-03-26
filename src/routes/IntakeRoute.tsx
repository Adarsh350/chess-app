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
    'This student is strongest when the position is active and practical. The coaching goal is to tighten the decision filter without flattening the style.',
  )
  const [goalsText, setGoalsText] = useState(
    'Map my playing style clearly\nBuild a weekly training plan around my real strengths\nReduce the moments where the position slips for no reason',
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
      setSubmitError('Add the student name before generating the report.')
      return
    }

    if (!pgn.trim()) {
      setSubmitError('Import a PGN before continuing.')
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
      setSubmitError(error instanceof Error ? error.message : 'The import could not be saved locally.')
    }
  }

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">PGN Intake</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(19rem,0.9fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Turn one uploaded game into a real coaching report.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              This flow stays fully offline. The PGN is parsed in-browser, the instant report is saved to IndexedDB, and you can add a local Stockfish deep review later from the game workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="brand-button" onClick={loadDemo}>
                <Sparkles className="mr-2 h-4 w-4" />
                Load Signature Demo
              </button>
              <Link className="ghost-button" to="/">
                Back To Dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: UserRound,
                title: 'Student Context',
                body: 'Capture the player name, goals, and coaching frame so every report sounds intentional instead of generic.',
              },
              {
                icon: ClipboardList,
                title: 'Offline Parsing',
                body: 'Headers, result, opening, and move structure are extracted locally from the PGN the moment it lands here.',
              },
              {
                icon: CheckCircle2,
                title: 'Coach-Ready Output',
                body: 'The saved report immediately feeds the review workspace, training plan, and later student profile history.',
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
          eyebrow="Import Flow"
          title="Add the student context and the game"
          description="The intake stays lightweight on purpose. We capture enough context to make the report sound like DeepGame coaching, not like an engine dump."
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
                <legend className="mb-1">Coached side</legend>
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
              Focus statement
              <textarea
                value={focusStatement}
                onChange={(event) => setFocusStatement(event.target.value)}
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
                {isPending ? 'Opening report...' : 'Create Local Report'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link className="ghost-button" to="/">
                Cancel
              </Link>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Live Preview"
          title="What the app can already see from this PGN"
          description="This is the confidence check before saving. If the headers or side selection are wrong, fix them here and the rest of the flow stays clean."
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
                  <span className="metric-chip">{preview.moves.length} plies</span>
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
                    Output path
                  </p>
                  <div className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    Instant Report First
                  </div>
                  <p className="mt-2 text-sm leading-7 text-copy">
                    The app will save a full heuristic report now, then let you add a deeper Stockfish-backed pass from the review page.
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
                    PGN preview needs a fix
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-copy">{previewError}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-forest/20 bg-ivory/70 p-6">
              <p className="text-sm leading-7 text-copy">
                Paste or drop a PGN to see the opening, player names, result, and move count before saving the report.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
