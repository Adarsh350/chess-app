import { useLiveQuery } from 'dexie-react-hooks'
import { useDeferredValue, useEffect, useState, useTransition } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, Search, Sparkles, Users } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { PgnDropZone } from '../components/PgnDropZone'
import { demoGames, demoStudent } from '../data/seeds'
import { parseGame } from '../lib/chess/pgn'
import { db, upsertImportedGame } from '../lib/db'
import { reviewReplayPath, studentEditPath } from '../lib/routes'
import { visibleStudents } from '../lib/workspace'
import type { ParsedGame, PlayerSide, StoredStudent } from '../types/coaching'

function normalizeGoals(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function blankFocusStatement() {
  return 'The student wants clearer game plans and calmer decisions when the position gets sharp.'
}

function blankGoalsText() {
  return 'Understand my biggest strengths\nSee the moments where the game turned\nKnow what to practice before the next lesson'
}

function formatStudentType(student: StoredStudent) {
  return student.kind === 'seeded' ? 'Sample' : 'Student'
}

export function IntakeRoute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const students = useLiveQuery(() => db.students.orderBy('updatedAt').reverse().toArray(), [])
  const allActiveStudents = (students ?? []).filter((student) => student.archivedAt === null)
  const activeStudents = visibleStudents(
    allActiveStudents,
    false,
  )
  const [studentMode, setStudentMode] = useState<'existing' | 'new'>(
    searchParams.get('studentId') ? 'existing' : activeStudents.length ? 'existing' : 'new',
  )
  const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') ?? '')
  const [studentSearch, setStudentSearch] = useState('')
  const [studentName, setStudentName] = useState('')
  const [focusStatement, setFocusStatement] = useState(blankFocusStatement())
  const [goalsText, setGoalsText] = useState(blankGoalsText())
  const [coachedSide, setCoachedSide] = useState<PlayerSide>('white')
  const [pgn, setPgn] = useState('')
  const [submitError, setSubmitError] = useState('')

  const deferredPgn = useDeferredValue(pgn)
  const selectedStudent = activeStudents.find((student) => student.id === selectedStudentId) ?? null
  const filteredStudents = activeStudents.filter((student) =>
    [student.name, student.tagline, student.focusStatement]
      .join(' ')
      .toLowerCase()
      .includes(studentSearch.trim().toLowerCase()),
  )

  useEffect(() => {
    const requestedStudentId = searchParams.get('studentId')
    if (requestedStudentId) {
      const requestedStudent = activeStudents.find((student) => student.id === requestedStudentId)
      if (requestedStudent) {
        setStudentMode('existing')
        setSelectedStudentId(requestedStudent.id)
      }
    } else if (!activeStudents.length) {
      setStudentMode('new')
      setSelectedStudentId('')
    } else if (studentMode === 'existing' && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0]!.id)
    }
  }, [activeStudents, searchParams, selectedStudentId, studentMode])

  useEffect(() => {
    if (studentMode !== 'existing' || !selectedStudent) {
      return
    }

    setStudentName(selectedStudent.name)
    setFocusStatement(selectedStudent.focusStatement)
    setGoalsText(selectedStudent.goals.join('\n'))
    setSubmitError('')
  }, [selectedStudent?.id, selectedStudent?.updatedAt, selectedStudent, studentMode])

  let preview: ParsedGame | null = null
  let previewError = ''

  if (deferredPgn.trim()) {
    try {
      preview = parseGame(
        deferredPgn,
        coachedSide,
        studentMode === 'existing' ? selectedStudent?.name || undefined : studentName.trim() || undefined,
      )
    } catch (error) {
      previewError = error instanceof Error ? error.message : 'The PGN could not be parsed.'
    }
  }

  function switchToExistingMode(studentId?: string) {
    if (!activeStudents.length) {
      return
    }

    setStudentMode('existing')
    setSelectedStudentId(studentId ?? (selectedStudentId || activeStudents[0]!.id))
    setSubmitError('')
  }

  function switchToNewMode() {
    setStudentMode('new')
    setSelectedStudentId('')
    setStudentName('')
    setFocusStatement(blankFocusStatement())
    setGoalsText(blankGoalsText())
    setSubmitError('')
  }

  function loadDemo() {
    const demoGame = demoGames.find((game) => game.id === 'game-grunfeld-pressure') ?? demoGames[0]
    if (!demoGame) {
      return
    }

    const sampleStudent = allActiveStudents.find((student) => student.id === demoStudent.id)

    if (studentMode === 'existing' && selectedStudent) {
      setFocusStatement(selectedStudent.focusStatement)
      setGoalsText(selectedStudent.goals.join('\n'))
    } else if (sampleStudent) {
      switchToExistingMode(sampleStudent.id)
      setFocusStatement(sampleStudent.focusStatement)
      setGoalsText(sampleStudent.goals.join('\n'))
    } else {
      switchToNewMode()
      setStudentName(demoStudent.name)
      setFocusStatement(demoStudent.focusStatement)
      setGoalsText(demoStudent.goals.join('\n'))
    }

    setCoachedSide(demoGame.coachedSide)
    setPgn(demoGame.pgn)
    setSubmitError('')
  }

  async function handleSubmit() {
    if (studentMode === 'existing' && !selectedStudent) {
      setSubmitError('Please choose a student before creating the review.')
      return
    }

    if (studentMode === 'new' && !studentName.trim()) {
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
        studentId: studentMode === 'existing' ? selectedStudent?.id : undefined,
        studentName: studentMode === 'existing' ? selectedStudent?.name ?? '' : studentName,
        focusStatement,
        goals: normalizeGoals(goalsText),
        coachedSide,
        pgn,
      })

      startTransition(() => {
        navigate(reviewReplayPath(result.gameId))
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The game could not be saved.')
    }
  }

  const moveCount = preview ? Math.ceil(preview.moves.length / 2) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Import"
        title="Create one clean review from one clean PGN import."
        description="Choose the student first, confirm the side they played, and preview the parsed game before the review is saved."
        meta={
          <>
            <span className="inline-meta">Step 1: Choose student</span>
            <span className="inline-meta">Step 2: Add PGN</span>
            <span className="inline-meta">Step 3: Create review</span>
          </>
        }
        actions={
          <>
            <button type="button" className="secondary-button" onClick={loadDemo}>
              <Sparkles className="mr-2 h-4 w-4" />
              Load sample
            </button>
            <Link className="secondary-button" to="/students">
              <Users className="mr-2 h-4 w-4" />
              Students
            </Link>
          </>
        }
      />

      <div className="split-pane">
        <section className="workspace-card">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchToExistingMode()}
                  className={studentMode === 'existing' ? 'primary-button' : 'secondary-button'}
                >
                  Existing student
                </button>
                <button
                  type="button"
                  onClick={switchToNewMode}
                  className={studentMode === 'new' ? 'primary-button' : 'secondary-button'}
                >
                  New student
                </button>
              </div>

              {studentMode === 'existing' ? (
                activeStudents.length ? (
                  <div className="space-y-4">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-copy/70" />
                      <input
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search students"
                        className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                      />
                    </label>

                    <div className="grid gap-3">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className={[
                            'rounded-xl border px-4 py-4 text-left transition-colors duration-200',
                            selectedStudentId === student.id
                              ? 'border-forest bg-mint-soft/75'
                              : 'border-line bg-[#fbfaf6] hover:bg-mint-soft/50',
                          ].join(' ')}
                        >
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-meta">{formatStudentType(student)}</span>
                            <span className="inline-meta">{student.goals.length} goals</span>
                          </div>
                          <h3 className="mt-3 font-heading text-xl font-bold tracking-[-0.03em] text-ink">
                            {student.name}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-copy">{student.tagline}</p>
                        </button>
                      ))}
                    </div>

                    {selectedStudent ? (
                      <div className="surface-muted">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">
                          Selected student
                        </p>
                        <h3 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                          {selectedStudent.name}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{selectedStudent.focusStatement}</p>
                        <div className="mt-4">
                          <Link className="secondary-button" to={studentEditPath(selectedStudent.id)}>
                            Edit student profile
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <EmptyState
                    title="There are no active students yet."
                    description="Switch to new student or create the first profile from the student pages."
                    action={
                      <button type="button" className="primary-button" onClick={switchToNewMode}>
                        Switch to new student
                      </button>
                    }
                  />
                )
              ) : (
                <div className="grid gap-5">
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Student name
                    <input
                      value={studentName}
                      onChange={(event) => setStudentName(event.target.value)}
                      placeholder="Student name"
                      className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Current coaching focus
                <textarea
                  value={focusStatement}
                  onChange={(event) => setFocusStatement(event.target.value)}
                  placeholder="For example: planning better in the middlegame, finishing attacks, or playing more calmly under pressure."
                  className="min-h-28 rounded-xl border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Current goals
                <textarea
                  value={goalsText}
                  onChange={(event) => setGoalsText(event.target.value)}
                  placeholder="One goal per line"
                  className="min-h-28 rounded-xl border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                />
              </label>
            </div>

            <fieldset className="grid gap-3 text-sm font-semibold text-ink">
              <legend>Which color did the student play?</legend>
              <div className="flex flex-wrap gap-2">
                {(['white', 'black'] as PlayerSide[]).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setCoachedSide(side)}
                    className={coachedSide === side ? 'primary-button capitalize' : 'secondary-button capitalize'}
                  >
                    {side}
                  </button>
                ))}
              </div>
            </fieldset>

            <PgnDropZone value={pgn} onChange={setPgn} onLoadDemo={loadDemo} />

            {submitError ? (
              <div className="rounded-xl border border-saffron/35 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
                {submitError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" className="primary-button" disabled={isPending} onClick={() => void handleSubmit()}>
                {isPending ? 'Opening review...' : 'Create review'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link className="secondary-button" to="/">
                Cancel
              </Link>
            </div>
          </div>
        </section>

        <section className="workspace-card">
          <p className="section-label">Preview</p>
          <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
            Confirm the parsed game before saving
          </h2>

          {preview ? (
            <div className="mt-5 space-y-4">
              <div className="surface-muted">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-meta">{preview.opening}</span>
                  <span className="inline-meta">{preview.outcome}</span>
                  <span className="inline-meta">{moveCount} moves</span>
                </div>
                <h3 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {preview.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-copy">
                  {preview.eventSummary || 'Offline import ready for review.'}
                </p>
              </div>

              <div className="surface-muted">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">Student</p>
                <p className="mt-2 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {studentMode === 'existing' ? selectedStudent?.name ?? 'Choose a student' : studentName || 'New student'}
                </p>
                <p className="mt-2 text-sm leading-7 text-copy">
                  Reviewing from the {preview.coachedSide} side against {preview.opponent}.
                </p>
              </div>

              <div className="surface-muted">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-copy/80">What happens next</p>
                <p className="mt-2 text-sm leading-7 text-copy">
                  The game will be attached to the chosen student, then opened in the replay workspace with the summary already saved.
                </p>
              </div>
            </div>
          ) : previewError ? (
            <div className="mt-5 rounded-xl border border-saffron/35 bg-saffron-soft p-5">
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
            <div className="mt-5 grid gap-4">
              <EmptyState
                title="Preview will appear after you add a PGN."
                description="Paste or drop a PGN to confirm the opening, player, result, and move count before saving the review."
              />
              <div className="surface-muted">
                <CheckCircle2 className="mb-3 h-4 w-4 text-forest" />
                <p className="text-sm leading-7 text-copy">
                  The review will stay inside the student profile you choose here, so each student builds a separate history over time.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
