type MetricCardProps = Readonly<{
  label: string
  value: string
  description: string
}>

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-copy/80">
        {label}
      </p>
      <div className="mt-3 font-heading text-4xl font-bold tracking-[-0.06em] text-ink">
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-copy">{description}</p>
    </div>
  )
}
