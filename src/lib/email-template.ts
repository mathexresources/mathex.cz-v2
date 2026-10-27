const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type EmailRow = { label: string; value: string }

/** Jednoduchý, čitelný HTML e-mail, který funguje i v Outlooku. */
export function renderEmail(opts: {
  brand: string
  heading: string
  intro: string
  rows?: EmailRow[]
  action?: { label: string; url: string }
  footer?: string
}): { html: string; text: string } {
  const rows = (opts.rows ?? [])
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#4A5670;vertical-align:top;white-space:nowrap">${esc(
          r.label,
        )}</td><td style="padding:6px 0;color:#10302B">${esc(r.value).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')

  const html = `<!doctype html><html lang="cs"><body style="margin:0;background:#ECEEE6;font-family:Arial,Helvetica,sans-serif;color:#10302B">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ECEEE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #D5DAE3">
<tr><td style="padding:20px 28px;border-bottom:4px solid #6B3FA6;font-family:Arial,sans-serif;font-weight:700;font-size:18px">${esc(opts.brand)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:22px;line-height:1.3">${esc(opts.heading)}</h1>
<p style="margin:0 0 20px;font-size:16px;line-height:1.6">${esc(opts.intro).replace(/\n/g, '<br>')}</p>
${rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5;margin-bottom:20px">${rows}</table>` : ''}
${
  opts.action
    ? `<a href="${esc(opts.action.url)}" style="display:inline-block;background:#10302B;color:#ffffff;text-decoration:none;padding:12px 20px;font-family:Arial,sans-serif;font-size:15px;border-radius:3px">${esc(opts.action.label)}</a>`
    : ''
}
</td></tr>
${opts.footer ? `<tr><td style="padding:16px 28px;border-top:1px solid #D5DAE3;color:#4A5670;font-size:13px;line-height:1.5">${esc(opts.footer).replace(/\n/g, '<br>')}</td></tr>` : ''}
</table></td></tr></table></body></html>`

  const text = [
    opts.heading,
    '',
    opts.intro,
    '',
    ...(opts.rows ?? []).filter((r) => r.value).map((r) => `${r.label}: ${r.value}`),
    opts.action ? `\n${opts.action.label}: ${opts.action.url}` : '',
    opts.footer ? `\n--\n${opts.footer}` : '',
  ].join('\n')

  return { html, text }
}
