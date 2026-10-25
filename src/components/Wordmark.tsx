/** Pracovní logo: název značky a žlutá ryska jako značka na metru. */
export function Wordmark({ name }: { name: string }) {
  return (
    <span className="ui inline-flex items-baseline gap-1.5 text-[1.375rem] font-bold tracking-[-0.03em]">
      <span aria-hidden="true" className="inline-block h-[0.7em] w-[0.28em] translate-y-[0.05em] bg-tape" />
      {name}
    </span>
  )
}
