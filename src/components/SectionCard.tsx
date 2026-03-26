import type { ReactNode } from 'react'

type SectionCardProps = Readonly<{
  eyebrow: string
  title: string
  description?: string
  id?: string
  className?: string
  children: ReactNode
}>

export function SectionCard({ eyebrow, title, description, id, className, children }: SectionCardProps) {
  return (
    <section id={id} className={['panel scroll-mt-32 p-6 sm:p-7', className].filter(Boolean).join(' ')}>
      <p className="section-label">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-copy">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  )
}
