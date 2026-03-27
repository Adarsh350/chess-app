import type { ReactNode } from 'react'

type PageHeaderProps = Readonly<{
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}>

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        <div className="space-y-3">
          {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold tracking-[-0.05em] text-ink sm:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-sm leading-7 text-copy sm:text-base">
                {description}
              </p>
            ) : null}
            {meta ? <div className="page-meta-row">{meta}</div> : null}
          </div>
        </div>

        {actions ? <div className="page-actions">{actions}</div> : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  )
}
