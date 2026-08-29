import { LoginData, SignupData } from '@/services/auth.service';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export function validateLogin(data: LoginData): Record<string, string> {
  const errors: Record<string, string> = {};

  const email = data.email.trim();
  const password = data.password;

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
}

export function validateSignup(data: SignupData): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = data.name.trim();
  const username = data.username.trim();
  const email = data.email.trim();
  const password = data.password;

  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (name.length > 100) {
    errors.name = 'Name cannot exceed 100 characters';
  }

  if (!username) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (username.length > 30) {
    errors.username = 'Username cannot exceed 30 characters';
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  }

  if (!email) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters';
  }

  return errors;
}
