import type { ReactNode } from 'react'

type EmptyStateProps = Readonly<{
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}>

export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
      <h2 className="mt-3 font-heading text-2xl font-bold tracking-[-0.04em] text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-copy">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
