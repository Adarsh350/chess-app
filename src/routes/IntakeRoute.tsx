import { useLiveQuery } from 'dexie-react-hooks'
import { useDeferredValue, useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Search,
  Sparkles,
  UserPlus2,
  Users,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PgnDropZone } from '../components/PgnDropZone'
import { SectionCard } from '../components/SectionCard'
import { demoGames, demoStudent } from '../data/seeds'
import { parseGame } from '../lib/chess/pgn'
import { db, upsertImportedGame } from '../lib/db'
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
  return student.kind === 'seeded' ? 'Sample data' : 'Student profile'
}

export function IntakeRoute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const students = useLiveQuery(() => db.students.orderBy('updatedAt').reverse().toArray(), [])
  const activeStudents = (students ?? []).filter((student) => student.archivedAt === null)
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

    const sampleStudent = activeStudents.find((student) => student.id === demoStudent.id)

    if (sampleStudent) {
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
              Put the right game inside the right student profile.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              Choose an existing student or create a new one on the spot. Each game stays attached to that student, so you can build a clean coaching history over time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="brand-button" onClick={loadDemo}>
                <Sparkles className="mr-2 h-4 w-4" />
                Use Sample Game
              </button>
              <Link className="ghost-button" to="/students">
                <Users className="mr-2 h-4 w-4" />
                Manage Students
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: Users,
                title: 'Choose The Student',
                body: 'Attach the new game to an existing profile so each student keeps a clean review history.',
              },
              {
                icon: UserPlus2,
                title: 'Create A New Profile',
                body: 'If this is someone new, make the profile right here and start their coaching history with the first upload.',
              },
              {
                icon: ClipboardList,
                title: 'Save A Clear Review',
                body: 'The game turns into a summary, key moments, and next steps that live inside that student profile.',
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
          title="Choose the student and add the game"
          description="Start by picking an existing student or creating a new profile. Then add the game and save the review."
        >
          <div className="grid gap-5">
            <div className="grid gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => switchToExistingMode()}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-bold transition',
                    studentMode === 'existing'
                      ? 'bg-forest text-white'
                      : 'bg-white text-ink hover:bg-mint-soft/70',
                  ].join(' ')}
                >
                  Existing student
                </button>
                <button
                  type="button"
                  onClick={switchToNewMode}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-bold transition',
                    studentMode === 'new'
                      ? 'bg-forest text-white'
                      : 'bg-white text-ink hover:bg-mint-soft/70',
                  ].join(' ')}
                >
                  New student
                </button>
              </div>

              {studentMode === 'existing' ? (
                activeStudents.length ? (
                  <div className="grid gap-4">
                    <label className="relative block">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-copy/70" />
                      <input
                        value={studentSearch}
                        onChange={(event) => setStudentSearch(event.target.value)}
                        placeholder="Search students"
                        className="w-full rounded-[1.25rem] border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
                      />
                    </label>

                    <div className="grid gap-3">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setSelectedStudentId(student.id)}
                          className={[
                            'rounded-[1.5rem] border p-4 text-left transition',
                            selectedStudentId === student.id
                              ? 'border-forest bg-mint-soft/80'
                              : 'border-line bg-white hover:border-forest/20 hover:bg-mint-soft/50',
                          ].join(' ')}
                        >
                          <div className="flex flex-wrap gap-3">
                            <span className="metric-chip">{formatStudentType(student)}</span>
                            <span className="metric-chip">{student.goals.length} goals</span>
                          </div>
                          <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                            {student.name}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-copy">{student.tagline}</p>
                        </button>
                      ))}
                    </div>

                    {selectedStudent ? (
                      <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
                          Selected student
                        </p>
                        <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                          {selectedStudent.name}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{selectedStudent.focusStatement}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {selectedStudent.goals.map((goal) => (
                            <span key={goal} className="metric-chip">
                              {goal}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Link className="ghost-button" to={`/students?edit=${selectedStudent.id}`}>
                            Edit Student Profile
                          </Link>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-forest/20 bg-ivory/70 p-6 text-sm leading-7 text-copy">
                    There are no active students yet. Switch to <strong>New student</strong> or create the first profile from the Students page.
                  </div>
                )
              ) : (
                <div className="grid gap-5">
                  <label className="grid gap-2 text-sm font-semibold text-ink">
                    Student name
                    <input
                      value={studentName}
                      onChange={(event) => setStudentName(event.target.value)}
                      placeholder="Student name"
                      className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
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
            </div>

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
          description="This helps you confirm the right player, opening, result, and move count before saving the review."
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
                    Student
                  </p>
                  <div className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {studentMode === 'existing' ? selectedStudent?.name ?? 'Choose a student' : studentName || 'New student'}
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
                    Review saved into the profile
                  </div>
                  <p className="mt-2 text-sm leading-7 text-copy">
                    The app will attach this game to the selected student, then save the summary, key moments, and next steps inside that profile.
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
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-dashed border-forest/20 bg-ivory/70 p-6">
                <p className="text-sm leading-7 text-copy">
                  Paste or drop a PGN to preview the student, opening, result, and move count before saving the review.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-line bg-white p-5 text-sm leading-7 text-copy">
                <CheckCircle2 className="mb-3 h-4 w-4 text-forest" />
                The review will stay inside the student profile you choose here, so each student builds a separate history over time.
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
