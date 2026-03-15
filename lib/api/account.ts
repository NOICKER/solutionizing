import { apiFetch } from './client'

/**
 * Deletes the currently authenticated user's account.
 * This will perform a soft or hard delete depending on the backend implementation.
 */
export async function deleteAccount(): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/api/v1/auth/delete-account', {
    method: 'DELETE',
  })
}
