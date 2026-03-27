import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PersistedAnalysis, StoredGame, StoredStudent } from '../types/coaching'
import { reviewInsightsPath, reviewPlanPath, reviewReplayPath, studentOverviewPath } from '../lib/routes'
import { reviewPlayerLabelForDisplay } from '../lib/workspace'
import { PageHeader } from './PageHeader'
import { SubnavTabs } from './SubnavTabs'

type ReviewDetailFrameProps = Readonly<{
  game: StoredGame
  student: StoredStudent
  analysis: PersistedAnalysis | null
  currentTab: 'replay' | 'insights' | 'plan'
  actions?: ReactNode
  children: ReactNode
}>

export function ReviewDetailFrame({
  game,
  student,
  analysis,
  currentTab,
  actions,
  children,
}: ReviewDetailFrameProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review"
        title={analysis?.report.headline ?? game.title}
        description={
          analysis?.report.executiveSummary ??
          'Open the replay, then move into the insight and training tabs as the review gets deeper.'
        }
        meta={
          <>
            <span className="inline-meta">{student.name}</span>
            <span className="inline-meta">{game.opening}</span>
            <span className="inline-meta">{reviewPlayerLabelForDisplay(game, student)}</span>
            <span className="inline-meta">
              {analysis?.kind === 'deep' ? 'Detailed review' : 'Game summary'}
            </span>
          </>
        }
        actions={
          <>
            <Link className="secondary-button" to={studentOverviewPath(student.id)}>
              Student profile
            </Link>
            {actions}
          </>
        }
      >
        <SubnavTabs
          tabs={[
            { to: reviewReplayPath(game.id), label: 'Replay' },
            { to: reviewInsightsPath(game.id), label: 'Insights' },
            { to: reviewPlanPath(game.id), label: 'Plan' },
          ]}
        />
      </PageHeader>

      <div className="review-detail-page" data-tab={currentTab}>
        {children}
      </div>
    </div>
  )
}
