import { useId } from 'react'

type Props = {
  label: string
  name: string
  type?: string
  required?: boolean
  error?: string
  hint?: string
  textarea?: boolean
  defaultValue?: string
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
}

export function Field({ label, name, type = 'text', required, error, hint, textarea, defaultValue, autoComplete, inputMode, placeholder }: Props) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    name,
    required,
    defaultValue,
    autoComplete,
    placeholder,
    className: 'input',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {!required && <span className="font-normal text-pencil"> (nepovinné)</span>}
      </label>
      {textarea ? <textarea {...common} rows={5} /> : <input {...common} type={type} inputMode={inputMode} />}
      {hint && (
        <p id={`${id}-hint`} className="field-hint mt-1.5">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function Consent({ error, privacyHref }: { error?: string; privacyHref: string }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="ui flex cursor-pointer gap-3 text-[0.95rem]">
        <input
          id={id}
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-5 w-5 flex-none accent-[var(--color-ink)]"
          aria-invalid={error ? true : undefined}
        />
        <span>
          Souhlasím se zpracováním osobních údajů za účelem odpovědi na můj dotaz.{' '}
          <a href={privacyHref} target="_blank" rel="noopener" className="underline decoration-accent decoration-2">
            Jak s údaji zacházím
          </a>
        </span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  )
}
