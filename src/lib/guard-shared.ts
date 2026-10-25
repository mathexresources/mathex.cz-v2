/** Čisté pomocné funkce pro formuláře – bez závislosti na Next.js, použitelné i v Payload endpointech. */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export const clean = (v: FormDataEntryValue | null, max = 500) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max)
