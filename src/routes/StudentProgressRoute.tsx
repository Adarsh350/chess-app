import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { ScoreMeter } from '../components/ScoreMeter'
import { StudentDetailFrame } from '../components/StudentDetailFrame'
import { useStudentRecord } from '../lib/workspace'
import { summarizeStudent } from '../lib/studentSummary'

export function StudentProgressRoute() {
  const { studentId } = useParams()
  const record = useStudentRecord(studentId)

  if (record === undefined) {
    return null
  }

  if (!record?.student) {
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

  const summary = summarizeStudent(record.games, record.analyses)

  return (
    <StudentDetailFrame student={record.student} currentTab="progress">
      {summary.averageMeters.length ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="workspace-card">
              <p className="section-label">Playing style</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                {summary.signatureStyle}
              </h2>
              <p className="mt-3 text-sm leading-7 text-copy">
                These signals are averaged across the saved reports so the trend is easy to explain to a student or parent.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {summary.averageMeters.map((meter) => (
                  <ScoreMeter key={meter.label} meter={meter} />
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <p className="section-label">Openings</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                The positions showing up most
              </h2>
              <div className="mt-5 grid gap-3">
                {summary.openings.map((opening) => (
                  <div key={opening} className="rounded-xl border border-line bg-[#fbfaf6] px-4 py-3 text-sm font-semibold text-ink">
                    {opening}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section className="workspace-card">
              <p className="section-label">Repeated strengths</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                What the student is already doing well
              </h2>
              <div className="mt-5 grid gap-3">
                {summary.repeatStrengths.map((item) => (
                  <div key={item} className="rounded-xl border border-line bg-mint-soft/50 px-4 py-4 text-sm font-semibold text-ink">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="workspace-card">
              <p className="section-label">Repeated targets</p>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
                What to keep coaching next
              </h2>
              <div className="mt-5 grid gap-3">
                {summary.repeatLeaks.map((item) => (
                  <div key={item} className="rounded-xl border border-line bg-saffron-soft/55 px-4 py-4 text-sm font-semibold text-ink">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : (
        <EmptyState
          eyebrow="Progress"
          title="Progress signals will appear after the first saved report."
          description="Once this student has at least one report, the style meters, recurring strengths, and training targets will show up here."
        />
      )}
    </StudentDetailFrame>
  )
}
