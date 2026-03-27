import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { StoredStudent } from '../types/coaching'
import { importPath, studentEditPath, studentGamesPath, studentOverviewPath, studentProgressPath } from '../lib/routes'
import { PageHeader } from './PageHeader'
import { SubnavTabs } from './SubnavTabs'

type StudentDetailFrameProps = Readonly<{
  student: StoredStudent
  currentTab: 'overview' | 'games' | 'progress'
  children: ReactNode
}>

export function StudentDetailFrame({ student, currentTab, children }: StudentDetailFrameProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={student.name}
        description={student.focusStatement}
        meta={
          <>
            <span className="inline-meta">Profile {student.kind === 'seeded' ? 'sample' : 'active'}</span>
            <span className="inline-meta">{student.tagline}</span>
            <span className="inline-meta">{student.goals.length} goals</span>
          </>
        }
        actions={
          <>
            <Link className="secondary-button" to={studentEditPath(student.id)}>
              Edit student
            </Link>
            <Link className="primary-button" to={importPath(student.id)}>
              Import game
            </Link>
          </>
        }
      >
        <SubnavTabs
          tabs={[
            { to: studentOverviewPath(student.id), label: 'Overview' },
            { to: studentGamesPath(student.id), label: 'Games' },
            { to: studentProgressPath(student.id), label: 'Progress' },
          ]}
        />
      </PageHeader>

      <div className="student-detail-page" data-tab={currentTab}>
        {children}
      </div>
    </div>
  )
}
