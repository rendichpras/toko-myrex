import type {
  AuthField,
  AuthFormState,
} from "@/lib/auth/validation/credentials"

type Errors = AuthFormState["errors"]

export function clearFieldError(errors: Errors, field: AuthField): Errors {
  if (!errors?.[field]?.length) {
    return errors
  }

  const nextErrors = { ...errors }
  delete nextErrors[field]
  return nextErrors
}

export function hasFieldError(errors: Errors, field: AuthField) {
  return Boolean(errors?.[field]?.length)
}

export function focusFirstInvalidField(form: HTMLFormElement) {
  requestAnimationFrame(() => {
    form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
  })
}
