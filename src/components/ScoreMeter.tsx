import type { StyleMeter } from '../types/coaching'

type ScoreMeterProps = Readonly<{
  meter: StyleMeter
}>

export function ScoreMeter({ meter }: ScoreMeterProps) {
  return (
    <div className="rounded-[1.5rem] border border-line bg-ivory/80 p-4">
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-bold text-ink">{meter.label}</p>
        <span className="font-heading text-2xl font-bold tracking-[-0.04em] text-forest">
          {meter.score}
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-saffron to-forest transition-[width] duration-500"
          style={{ width: `${meter.score}%` }}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-copy">{meter.note}</p>
    </div>
  )
}
