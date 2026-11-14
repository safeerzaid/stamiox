'use client';

/**
 * Guests can try the Studio without an account (up to GUEST_DESIGN_LIMIT designs).
 * Account-only actions (export, saving to the account, more designs) call `requireLogin`:
 * signed in → true; a guest → the "Log in to continue" prompt opens and it returns false.
 */
export const GUEST_DESIGN_LIMIT = 3;

export type LoginReason = 'export' | 'save' | 'designs' | 'limit';

export const LOGIN_PROMPT_EVENT = 'stamiox:require-login';

export function requireLogin(user: unknown, reason: LoginReason): boolean {
  if (user) return true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOGIN_PROMPT_EVENT, { detail: { reason } }));
  }
  return false;
}
