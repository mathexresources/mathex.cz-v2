/** Logo: název značky širokým černým písmem. */
export function Wordmark({ name }: { name: string }) {
  return <span className="font-display text-[1.375rem] font-black tracking-[-0.03em]">{name}</span>
}
