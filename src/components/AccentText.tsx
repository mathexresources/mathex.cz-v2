/** Text, ve kterém se část mezi *hvězdičkami* zobrazí oranžově (nastavuje se v administraci). */
export function AccentText({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-tape">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}

/** Stejný text bez hvězdiček – pro titulky, popisy a obrázky ke sdílení. */
export const plainText = (text: string) => text.replace(/\*([^*]+)\*/g, '$1')
