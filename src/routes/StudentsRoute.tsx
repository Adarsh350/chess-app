import { useLiveQuery } from 'dexie-react-hooks'
import {
  Archive,
  ArrowRight,
  BookOpenCheck,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  UserCog,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MetricCard } from '../components/MetricCard'
import { SectionCard } from '../components/SectionCard'
import {
  archiveStudentProfile,
  createStudentProfile,
  db,
  deleteStudentProfile,
  restoreStudentProfile,
  updateStudentProfile,
} from '../lib/db'
import { summarizeStudent } from '../lib/studentSummary'
import type { StoredStudent, StudentProfileInput } from '../types/coaching'

function blankStudentForm(): StudentProfileInput {
  return {
    name: '',
    tagline: '',
    focusStatement: 'This student wants coaching that builds around their natural style and current practical goals.',
    goals: ['Understand what positions fit my style best', 'Know what to practice before the next lesson'],
  }
}

function formFromStudent(student: StoredStudent): StudentProfileInput {
  return {
    name: student.name,
    tagline: student.tagline,
    focusStatement: student.focusStatement,
    goals: student.goals,
  }
}

function normalizeGoals(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'No activity yet'
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type StudentEditorPanelProps = Readonly<{
  editingStudent: StoredStudent | null
  isCreating: boolean
  onClose: () => void
  onCreated: (studentId: string, message: string) => void
  onUpdated: (studentId: string, message: string) => void
}>

function StudentEditorPanel({
  editingStudent,
  isCreating,
  onClose,
  onCreated,
  onUpdated,
}: StudentEditorPanelProps) {
  const [form, setForm] = useState<StudentProfileInput>(
    editingStudent ? formFromStudent(editingStudent) : blankStudentForm(),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSave() {
    const trimmedName = form.name.trim()
    if (!trimmedName) {
      setFormError('Please add the student name before saving the profile.')
      return
    }

    try {
      setFormError('')
      setIsSaving(true)

      if (editingStudent) {
        const savedStudent = await updateStudentProfile(editingStudent.id, {
          ...form,
          name: trimmedName,
          goals: normalizeGoals(form.goals.join('\n')),
        })
        onUpdated(savedStudent.id, `${savedStudent.name}'s profile was updated.`)
        return
      }

      const savedStudent = await createStudentProfile({
        ...form,
        name: trimmedName,
        goals: normalizeGoals(form.goals.join('\n')),
      })
      onCreated(savedStudent.id, `${savedStudent.name}'s profile is ready.`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The student could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SectionCard
      eyebrow={editingStudent ? 'Edit Student' : isCreating ? 'New Student' : 'Quick Start'}
      title={
        editingStudent
          ? `Update ${editingStudent.name}'s profile`
          : isCreating
            ? 'Create a new student profile'
            : 'Choose what to do next'
      }
      description={
        editingStudent
          ? 'Change the visible profile details, goals, and coaching focus for this student.'
          : isCreating
            ? 'Set up a student once, then keep every future game in the same place.'
            : 'Open a profile to edit it, or create a new student before you upload the next game.'
      }
    >
      {(editingStudent || isCreating) ? (
        <div className="grid gap-5">
          {formError ? (
            <div className="rounded-[1.5rem] border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
              {formError}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-semibold text-ink">
            Student name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Student name"
              className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-ink">
            Short tagline
            <input
              value={form.tagline}
              onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
              placeholder="For example: Weekly coaching for tournament prep"
              className="rounded-[1.25rem] border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-ink">
            Current coaching focus
            <textarea
              value={form.focusStatement}
              onChange={(event) => setForm((current) => ({ ...current, focusStatement: event.target.value }))}
              placeholder="What are you working on with this student right now?"
              className="min-h-28 rounded-[1.5rem] border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-ink">
            Goals
            <textarea
              value={form.goals.join('\n')}
              onChange={(event) =>
                setForm((current) => ({ ...current, goals: normalizeGoals(event.target.value) }))
              }
              placeholder="One goal per line"
              className="min-h-28 rounded-[1.5rem] border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="brand-button"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? 'Saving...' : editingStudent ? 'Save Profile' : 'Create Student'}
            </button>
            <button type="button" className="ghost-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-5 text-sm leading-7 text-copy">
            The simplest workflow is:
            <br />
            1. Create the student once.
            <br />
            2. Upload new games into that student&apos;s profile.
            <br />
            3. Reopen the profile any time to review progress.
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="brand-button" onClick={onClose}>
              Pick A Student To Edit
            </button>
            <Link className="ghost-button" to="/intake">
              <Upload className="mr-2 h-4 w-4" />
              Upload A Game
            </Link>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

export function StudentsRoute() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [studentSearch, setStudentSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')

  const record = useLiveQuery(async () => {
    const [students, games, analyses] = await Promise.all([
      db.students.orderBy('updatedAt').reverse().toArray(),
      db.games.orderBy('importedAt').reverse().toArray(),
      db.analyses.toArray(),
    ])

    return {
      students,
      games,
      analyses,
    }
  }, [])

  if (!record) {
    return null
  }

  const activeStudents = record.students
    .filter((student) => student.archivedAt === null)
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === 'custom' ? -1 : 1
      }
      return right.updatedAt.localeCompare(left.updatedAt)
    })
  const archivedStudents = record.students
    .filter((student) => student.archivedAt !== null)
    .sort((left, right) => (right.archivedAt ?? '').localeCompare(left.archivedAt ?? ''))
  const activeIds = new Set(activeStudents.map((student) => student.id))
  const activeGames = record.games.filter((game) => activeIds.has(game.studentId))
  const activeAnalyses = record.analyses.filter((analysis) => activeIds.has(analysis.studentId))
  const editingStudentId = searchParams.get('edit')
  const isCreating = searchParams.get('new') === '1'
  const editingStudent = record.students.find((student) => student.id === editingStudentId) ?? null
  const filteredActiveStudents = activeStudents.filter((student) =>
    [student.name, student.tagline, student.focusStatement]
      .join(' ')
      .toLowerCase()
      .includes(studentSearch.trim().toLowerCase()),
  )
  const studentSummaries = new Map(
    record.students.map((student) => {
      const games = record.games.filter((game) => game.studentId === student.id)
      const analyses = record.analyses.filter((analysis) => analysis.studentId === student.id)
      return [
        student.id,
        {
          summary: summarizeStudent(games, analyses),
          games,
          latestActivity: games[0]?.importedAt ?? student.updatedAt,
        },
      ]
    }),
  )

  async function handleArchive(student: StoredStudent) {
    const actionLabel =
      student.kind === 'seeded'
        ? 'Hide the sample student from your coach workspace?'
        : `Archive ${student.name}'s profile?`

    if (!window.confirm(actionLabel)) {
      return
    }

    try {
      setActionError('')
      await archiveStudentProfile(student.id)
      if (editingStudentId === student.id) {
        setSearchParams({})
      }
      setNotice(
        student.kind === 'seeded'
          ? 'The sample student is now hidden.'
          : `${student.name}'s profile is archived.`,
      )
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The student could not be archived.')
    }
  }

  async function handleRestore(student: StoredStudent) {
    try {
      setActionError('')
      await restoreStudentProfile(student.id)
      setNotice(`${student.name}'s profile is active again.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The student could not be restored.')
    }
  }

  async function handleDelete(student: StoredStudent) {
    if (
      !window.confirm(
        `Delete ${student.name}'s profile and every saved game attached to it? This cannot be undone.`,
      )
    ) {
      return
    }

    try {
      setActionError('')
      await deleteStudentProfile(student.id)
      if (editingStudentId === student.id) {
        setSearchParams({})
      }
      setNotice(`${student.name}'s profile was deleted.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The student could not be deleted.')
    }
  }

  function openNewStudent() {
    setNotice('')
    setActionError('')
    setSearchParams({ new: '1' })
  }

  function openEditStudent(studentId: string) {
    setNotice('')
    setActionError('')
    setSearchParams({ edit: studentId })
  }

  function closeEditor() {
    setActionError('')
    setSearchParams({})
  }

  return (
    <div className="px-5 py-8 sm:px-7 sm:py-10">
      <section className="soft-panel overflow-hidden p-8 sm:p-10">
        <p className="section-label">Coach Workspace</p>
        <div className="mt-4 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] xl:items-end">
          <div>
            <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-[-0.06em] text-ink sm:text-6xl">
              Manage every student from one place.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-copy sm:text-lg">
              Create profiles, keep each student&apos;s goals separate, and attach new games to the right person without mixing histories together.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" className="brand-button" onClick={openNewStudent}>
                <Plus className="mr-2 h-4 w-4" />
                Create Student
              </button>
              <Link className="ghost-button" to="/intake">
                <Upload className="mr-2 h-4 w-4" />
                Upload A Game
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              {
                icon: Users,
                title: 'Separate Profiles',
                body: 'Every student keeps their own games, goals, and coaching notes.',
              },
              {
                icon: BookOpenCheck,
                title: 'Clean Histories',
                body: 'Recent reviews stay attached to the right student, so you are never mixing game trails.',
              },
              {
                icon: UserCog,
                title: 'Coach Control',
                body: 'Edit profiles, archive old students, and hide the sample data when you no longer need it.',
              },
            ].map((card) => (
              <div key={card.title} className="panel p-5">
                <card.icon className="h-5 w-5 text-forest" />
                <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                  {card.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-copy">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Students"
          value={String(activeStudents.length)}
          description="Profiles currently available for new reviews and lesson planning."
        />
        <MetricCard
          label="Archived Students"
          value={String(archivedStudents.length)}
          description="Older or hidden profiles you can restore whenever you need them."
        />
        <MetricCard
          label="Games Reviewed"
          value={String(activeGames.length)}
          description="Saved games attached to students who are still active in the workspace."
        />
        <MetricCard
          label="Detailed Reviews"
          value={String(activeAnalyses.filter((analysis) => analysis.kind === 'deep').length)}
          description="Closer move-by-move reviews available across active students."
        />
      </div>

      {(notice || actionError) ? (
        <div className="mt-6 grid gap-3">
          {notice ? (
            <div className="rounded-[1.5rem] border border-forest/20 bg-mint-soft px-4 py-3 text-sm font-semibold text-forest">
              {notice}
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-[1.5rem] border border-saffron/40 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
              {actionError}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <SectionCard
          eyebrow="Students"
          title="Your active student list"
          description="Search, open, and manage each student profile from here."
        >
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

            {filteredActiveStudents.length ? (
              filteredActiveStudents.map((student) => {
                const details = studentSummaries.get(student.id)
                if (!details) {
                  return null
                }

                return (
                  <div
                    key={student.id}
                    className="rounded-[1.75rem] border border-line bg-white p-5 shadow-[0_24px_50px_-40px_rgba(18,36,24,0.18)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-3">
                          <span className="metric-chip">
                            {student.kind === 'seeded' ? 'Sample data' : 'Student profile'}
                          </span>
                          <span className="metric-chip">
                            Updated {formatDate(details.latestActivity)}
                          </span>
                        </div>
                        <h3 className="mt-4 font-heading text-3xl font-bold tracking-[-0.05em] text-ink">
                          {student.name}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-copy">{student.tagline}</p>
                        <p className="mt-4 text-sm leading-7 text-copy">{student.focusStatement}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <span className="metric-chip">{details.games.length} games</span>
                          <span className="metric-chip">{details.summary.deepReviewCount} detailed reviews</span>
                          <span className="metric-chip">{details.summary.signatureStyle}</span>
                        </div>
                        {student.goals.length ? (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {student.goals.slice(0, 3).map((goal) => (
                              <span key={goal} className="metric-chip">
                                {goal}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3 lg:max-w-[15rem] lg:justify-end">
                        <Link className="ghost-button" to={`/students/${student.id}`}>
                          Open Profile
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => navigate(`/intake?studentId=${student.id}`)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Add Game
                        </button>
                        <button type="button" className="ghost-button" onClick={() => openEditStudent(student.id)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                        <button type="button" className="ghost-button" onClick={() => void handleArchive(student)}>
                          <Archive className="mr-2 h-4 w-4" />
                          {student.kind === 'seeded' ? 'Hide Sample' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-forest/20 bg-ivory/70 p-6 text-sm leading-7 text-copy">
                No active students match that search yet. Create a student to start a clean coaching profile.
              </div>
            )}
          </div>

          {archivedStudents.length ? (
            <div className="mt-8">
              <p className="section-label">Archived Profiles</p>
              <div className="mt-4 grid gap-4">
                {archivedStudents.map((student) => {
                  const details = studentSummaries.get(student.id)
                  return (
                    <div key={student.id} className="rounded-[1.5rem] border border-line bg-ivory/80 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="metric-chip">
                            Archived {formatDate(student.archivedAt)}
                          </div>
                          <h3 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                            {student.name}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-copy">{student.tagline}</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <span className="metric-chip">{details?.games.length ?? 0} games</span>
                            <span className="metric-chip">{details?.summary.deepReviewCount ?? 0} detailed reviews</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="ghost-button" onClick={() => void handleRestore(student)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Restore
                          </button>
                          {student.kind === 'custom' ? (
                            <button type="button" className="ghost-button" onClick={() => void handleDelete(student)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </SectionCard>

        <StudentEditorPanel
          key={editingStudent?.id ?? (isCreating ? 'new' : 'idle')}
          editingStudent={editingStudent}
          isCreating={isCreating}
          onClose={closeEditor}
          onCreated={(studentId, message) => {
            setNotice(message)
            setActionError('')
            setSearchParams({ edit: studentId })
          }}
          onUpdated={(studentId, message) => {
            setNotice(message)
            setActionError('')
            setSearchParams({ edit: studentId })
          }}
        />
      </div>
    </div>
  )
}
