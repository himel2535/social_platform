import { ApiError } from '@/services/api';

type ErrorContext = 'login' | 'signup' | 'general';

export function normalizeApiError(error: ApiError, context: ErrorContext = 'general'): string {
  if (!error.status) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }

  if (error.status === 401 && context === 'login') {
    return 'Email or password is incorrect.';
  }

  if (error.status === 409) {
    const message = error.message.toLowerCase();
    if (message.includes('email')) {
      return 'An account with this email already exists.';
    }
    if (message.includes('username')) {
      return 'This username is already taken.';
    }
  }

  if (error.status >= 500) {
    return 'Something went wrong. Please try again later.';
  }

  if (error.message) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}
