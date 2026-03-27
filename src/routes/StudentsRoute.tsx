import { Archive, ArrowRight, Eye, EyeOff, RotateCcw, Search, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { archiveStudentProfile, deleteStudentProfile, restoreStudentProfile } from '../lib/db'
import { importPath, studentEditPath, studentOverviewPath, studentProgressPath } from '../lib/routes'
import { formatShortDate, useDemoVisibility, useWorkspaceRecord, visibleStudents } from '../lib/workspace'
import { summarizeStudent } from '../lib/studentSummary'
import type { StoredStudent } from '../types/coaching'

type FilterMode = 'active' | 'archived' | 'all'

export function StudentsRoute() {
  const [searchParams] = useSearchParams()
  const [studentSearch, setStudentSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('active')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const record = useWorkspaceRecord()
  const [showDemo, setShowDemo] = useDemoVisibility()

  const legacyEdit = searchParams.get('edit')
  if (searchParams.get('new') === '1') {
    return <Navigate to="/students/new" replace />
  }
  if (legacyEdit) {
    return <Navigate to={studentEditPath(legacyEdit)} replace />
  }

  if (!record) {
    return null
  }

  const hasSeededStudents = record.students.some((student) => student.kind === 'seeded')
  const visibleRoster = visibleStudents(record.students, showDemo)
  const studentSummaries = new Map(
    visibleRoster.map((student) => {
      const games = record.games.filter((game) => game.studentId === student.id)
      const analyses = record.analyses.filter((analysis) => analysis.studentId === student.id)
      return [
        student.id,
        {
          games,
          summary: summarizeStudent(games, analyses),
          latestActivity: games[0]?.importedAt ?? student.updatedAt,
        },
      ]
    }),
  )

  const filteredStudents = visibleRoster
    .filter((student) => {
      if (filterMode === 'active' && student.archivedAt !== null) {
        return false
      }
      if (filterMode === 'archived' && student.archivedAt === null) {
        return false
      }
      return [student.name, student.tagline, student.focusStatement]
        .join(' ')
        .toLowerCase()
        .includes(studentSearch.trim().toLowerCase())
    })
    .sort((left, right) => {
      if ((left.archivedAt === null) !== (right.archivedAt === null)) {
        return left.archivedAt === null ? -1 : 1
      }
      if (left.kind !== right.kind) {
        return left.kind === 'custom' ? -1 : 1
      }
      return right.updatedAt.localeCompare(left.updatedAt)
    })

  async function handleArchive(student: StoredStudent) {
    const message =
      student.kind === 'seeded'
        ? 'Hide the sample student from the main roster?'
        : `Archive ${student.name}'s profile?`

    if (!window.confirm(message)) {
      return
    }

    try {
      setActionError('')
      await archiveStudentProfile(student.id)
      setNotice(student.kind === 'seeded' ? 'Sample student hidden.' : `${student.name} archived.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'That profile could not be archived.')
    }
  }

  async function handleRestore(student: StoredStudent) {
    try {
      setActionError('')
      await restoreStudentProfile(student.id)
      setNotice(`${student.name} restored to the active roster.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'That profile could not be restored.')
    }
  }

  async function handleDelete(student: StoredStudent) {
    if (
      !window.confirm(
        `Delete ${student.name} and every saved game attached to that profile? This cannot be undone.`,
      )
    ) {
      return
    }

    try {
      setActionError('')
      await deleteStudentProfile(student.id)
      setNotice(`${student.name} was deleted.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'That profile could not be deleted.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Keep every student separate and easy to reopen."
        description="This roster is only for finding, managing, and jumping into the right student. Profile editing lives on its own page, and review work starts from the row actions."
        meta={
          <>
            <span className="inline-meta">{visibleRoster.filter((student) => student.archivedAt === null).length} active</span>
            <span className="inline-meta">{visibleRoster.filter((student) => student.archivedAt !== null).length} archived</span>
          </>
        }
        actions={
          <>
            {hasSeededStudents ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowDemo((value) => !value)}
              >
                {showDemo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showDemo ? 'Hide sample data' : 'Show sample data'}
              </button>
            ) : null}
            <Link className="secondary-button" to="/reviews">
              Reviews
            </Link>
            <Link className="primary-button" to="/students/new">
              New student
            </Link>
          </>
        }
      />

      {(notice || actionError) ? (
        <div className="grid gap-3">
          {notice ? (
            <div className="rounded-xl border border-forest/15 bg-mint-soft px-4 py-3 text-sm font-semibold text-forest">
              {notice}
            </div>
          ) : null}
          {actionError ? (
            <div className="rounded-xl border border-saffron/35 bg-saffron-soft px-4 py-3 text-sm font-semibold text-ink">
              {actionError}
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="toolbar">
        <label className="relative block lg:min-w-[20rem]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-copy/70" />
          <input
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Search students"
            className="w-full rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-forest/30 focus:ring-4 focus:ring-mint-soft/70"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {([
            ['active', 'Active'],
            ['archived', 'Archived'],
            ['all', 'All'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filterMode === value ? 'primary-button' : 'secondary-button'}
              onClick={() => setFilterMode(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {filteredStudents.length ? (
        <section className="table-shell">
          <div className="table-header">
            <span>Student</span>
            <span>Current focus</span>
            <span>Games</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filteredStudents.map((student) => {
            const details = studentSummaries.get(student.id)

            if (!details) {
              return null
            }

            return (
              <div key={student.id} className="table-row">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-meta">{student.kind === 'seeded' ? 'Sample' : 'Student'}</span>
                    <span className="inline-meta">Updated {formatShortDate(details.latestActivity)}</span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {student.name}
                  </h2>
                  <p className="text-sm leading-7 text-copy">{student.tagline}</p>
                </div>

                <div className="space-y-2 text-sm leading-7 text-copy">
                  <p>{student.focusStatement}</p>
                  <p className="font-semibold text-ink">{details.summary.signatureStyle}</p>
                </div>

                <div className="text-sm text-copy lg:self-center">
                  <div className="font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                    {details.games.length}
                  </div>
                  <div>Saved reviews</div>
                </div>

                <div className="space-y-2 text-sm text-copy lg:self-center">
                  <div>{student.archivedAt ? 'Archived' : 'Active'}</div>
                  <div>{details.summary.deepReviewCount} detailed</div>
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
                  <Link className="secondary-button" to={studentOverviewPath(student.id)}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link className="secondary-button" to={importPath(student.id)}>
                    <Upload className="mr-2 h-4 w-4" />
                    New review
                  </Link>
                  <Link className="secondary-button" to={studentEditPath(student.id)}>
                    Edit
                  </Link>
                  <Link className="secondary-button" to={studentProgressPath(student.id)}>
                    Progress
                  </Link>
                  {student.archivedAt ? (
                    <button type="button" className="secondary-button" onClick={() => void handleRestore(student)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </button>
                  ) : (
                    <button type="button" className="secondary-button" onClick={() => void handleArchive(student)}>
                      <Archive className="mr-2 h-4 w-4" />
                      {student.kind === 'seeded' ? 'Hide' : 'Archive'}
                    </button>
                  )}
                  {student.archivedAt && student.kind === 'custom' ? (
                    <button type="button" className="danger-button" onClick={() => void handleDelete(student)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </section>
      ) : (
        <EmptyState
          eyebrow="Students"
          title="No student matches that view."
          description="Adjust the search or filter, or create a new student profile to start a fresh coaching history."
          action={
            <Link className="primary-button" to="/students/new">
              Create student
            </Link>
          }
        />
      )}
    </div>
  )
}
