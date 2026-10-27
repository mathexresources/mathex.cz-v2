import { Rosette } from './Guilloche'

/** Logo: gilošovaná rozeta a název značky širokým písmem. */
export function Wordmark({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-[1.25rem] font-extrabold tracking-[-0.01em]">
      <Rosette className="h-[1.35em] w-[1.35em] text-accent" />
      {name}
    </span>
  )
}
