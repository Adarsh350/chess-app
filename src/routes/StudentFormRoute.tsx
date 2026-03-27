import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { createStudentProfile, updateStudentProfile } from '../lib/db'
import { studentOverviewPath } from '../lib/routes'
import { useStudentRecord } from '../lib/workspace'
import type { StudentProfileInput } from '../types/coaching'

type StudentFormRouteProps = Readonly<{
  mode: 'create' | 'edit'
}>

function blankStudentForm(): StudentProfileInput {
  return {
    name: '',
    tagline: '',
    focusStatement:
      'This student wants coaching that builds around their natural style and current practical goals.',
    goals: ['Understand what positions fit my style best', 'Know what to practice before the next lesson'],
  }
}

function normalizeGoals(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function StudentFormRoute({ mode }: StudentFormRouteProps) {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const record = useStudentRecord(studentId)
  const [form, setForm] = useState<StudentProfileInput>(blankStudentForm())
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (mode !== 'edit' || !record?.student) {
      return
    }

    setForm({
      name: record.student.name,
      tagline: record.student.tagline,
      focusStatement: record.student.focusStatement,
      goals: record.student.goals,
    })
  }, [mode, record?.student])

  if (mode === 'edit' && record === undefined) {
    return null
  }

  if (mode === 'edit' && !record?.student) {
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

  const description =
    mode === 'create'
      ? 'Create the student once, then keep every imported game and review attached to the same profile.'
      : 'Update the student profile details here. Game history and progress stay on their own pages.'

  async function handleSave() {
    const name = form.name.trim()
    if (!name) {
      setFormError('Please add the student name before saving the profile.')
      return
    }

    try {
      setFormError('')
      setIsSaving(true)

      if (mode === 'edit' && record?.student) {
        const updatedStudent = await updateStudentProfile(record.student.id, {
          ...form,
          name,
          goals: normalizeGoals(form.goals.join('\n')),
        })
        navigate(studentOverviewPath(updatedStudent.id))
        return
      }

      const student = await createStudentProfile({
        ...form,
        name,
        goals: normalizeGoals(form.goals.join('\n')),
      })
      navigate(studentOverviewPath(student.id))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The student could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={mode === 'create' ? 'New student' : 'Edit student'}
        title={mode === 'create' ? 'Create a student profile' : `Edit ${record?.student?.name}`}
        description={description}
        meta={
          mode === 'edit' && record?.student ? (
            <>
              <span className="inline-meta">{record.student.kind === 'seeded' ? 'Sample' : 'Student'}</span>
              <span className="inline-meta">{record.student.goals.length} goals</span>
            </>
          ) : undefined
        }
        actions={
          <>
            <Link className="secondary-button" to={mode === 'edit' && record?.student ? studentOverviewPath(record.student.id) : '/students'}>
              Cancel
            </Link>
            <button type="button" className="primary-button" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create student' : 'Save changes'}
            </button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <section className="workspace-card">
          <div className="grid gap-5">
            {formError ? (
              <div className="rounded-xl border border-saffron/35 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
                {formError}
              </div>
            ) : null}

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Student name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Student name"
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Short tagline
              <input
                value={form.tagline}
                onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))}
                placeholder="For example: Weekly coaching for tournament prep"
                className="rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Current coaching focus
              <textarea
                value={form.focusStatement}
                onChange={(event) => setForm((current) => ({ ...current, focusStatement: event.target.value }))}
                placeholder="What are you working on with this student right now?"
                className="min-h-32 rounded-xl border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-ink">
              Goals
              <textarea
                value={form.goals.join('\n')}
                onChange={(event) => setForm((current) => ({ ...current, goals: normalizeGoals(event.target.value) }))}
                placeholder="One goal per line"
                className="min-h-32 rounded-xl border border-line bg-white px-4 py-3 text-sm leading-7 text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
              />
            </label>
          </div>
        </section>

        <aside className="workspace-card">
          <p className="section-label">How to use this page</p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-copy">
            <p>Keep this page focused on profile information only. Imports, saved games, and progress live elsewhere.</p>
            <p>A clean student profile makes it easier to keep game histories separate and reopen the right person quickly during coaching.</p>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              'Use the focus statement to describe what you are coaching right now.',
              'Keep goals short so they are easy to scan before a lesson.',
              'Use the student pages for reviews and progress instead of crowding this form.',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-line bg-[#fbfaf6] px-4 py-3 text-sm font-semibold text-ink">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
