import type { APIRoute } from 'astro'
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server'
import { z } from 'astro/zod'
import { pathFor } from '@/i18n'
import { isLocale, type Locale } from '@/i18n/config'

/** Única ruta que corre en el Worker: todo lo demás es HTML estático. */
export const prerender = false

const Message = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().max(120),
  message: z.string().trim().min(10).max(4000),
})

/** Menos que esto entre que cargó el formulario y el envío no lo escribe una persona. */
const MIN_FILL_MS = 2500

type Outcome = 'ok' | 'invalid' | 'error'
const FRAGMENTS: Record<Outcome, string> = { ok: 'enviado', invalid: 'invalido', error: 'error' }
const STATUS: Record<Outcome, number> = { ok: 200, invalid: 400, error: 502 }

export const POST: APIRoute = async ({ request, url }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json') ?? false
  const form = await request.formData().catch(() => null)
  const rawLocale = form?.get('locale')
  const locale: Locale = typeof rawLocale === 'string' && isLocale(rawLocale) ? rawLocale : 'es'

  // Con JS responde JSON; sin JS vuelve al formulario con un fragmento que el CSS muestra.
  const respond = (outcome: Outcome, status = STATUS[outcome]): Response =>
    wantsJson
      ? Response.json({ ok: outcome === 'ok' }, { status })
      : Response.redirect(new URL(`${pathFor(locale, 'contact')}#${FRAGMENTS[outcome]}`, url), 303)

  // Los POST de otro origen ya los rechaza Astro (`security.checkOrigin`, activo por defecto).
  if (!form) return respond('invalid')

  // Bots: la trampa llena o un envío instantáneo. Se les responde «ok» para no darles pistas.
  const started = Number(form.get('started'))
  const tooFast = Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS
  if (form.get('website') || tooFast) return respond('ok')

  const parsed = Message.safeParse({
    name: form.get('name'),
    email: form.get('email'),
    message: form.get('message'),
  })
  if (!parsed.success) return respond('invalid')

  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    console.error('contact: faltan RESEND_API_KEY, CONTACT_TO_EMAIL o CONTACT_FROM_EMAIL')
    return respond('error', 503)
  }

  const { name, email, message } = parsed.data
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: email,
      subject: `Contacto desde johnmcan.dev: ${name}`,
      text: `${name} <${email}> (${locale})\n\n${message}`,
      html: `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; (${locale})</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    }),
  }).catch(() => null)

  if (!response?.ok) {
    console.error('contact: Resend respondió', response?.status, await response?.text())
    return respond('error')
  }
  return respond('ok')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
