'use client';
import type { ClientFormDraft } from '../application/client-form-store';

export type ClientFormErrors = Partial<Record<keyof ClientFormDraft, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_MIN = 7;
const PHONE_DIGITS_MAX = 15;
const NAME_MAX = 100;

export function validateClientForm(draft: ClientFormDraft): ClientFormErrors {
  const errors: ClientFormErrors = {};

  const first = draft.firstName.trim();
  if (first.length === 0) {
    errors.firstName = 'First name is required';
  } else if (first.length > NAME_MAX) {
    errors.firstName = `First name must be at most ${NAME_MAX} characters`;
  }

  const last = draft.lastName.trim();
  if (last.length === 0) {
    errors.lastName = 'Last name is required';
  } else if (last.length > NAME_MAX) {
    errors.lastName = `Last name must be at most ${NAME_MAX} characters`;
  }

  const email = draft.email.trim();
  if (email.length > 0 && !EMAIL_REGEX.test(email)) {
    errors.email = 'Invalid email format';
  }

  const phoneDigits = draft.phone.replace(/\D/g, '');
  if (phoneDigits.length > 0) {
    if (phoneDigits.length < PHONE_DIGITS_MIN || phoneDigits.length > PHONE_DIGITS_MAX) {
      errors.phone = `Phone must contain between ${PHONE_DIGITS_MIN} and ${PHONE_DIGITS_MAX} digits`;
    }
  }

  return errors;
}
