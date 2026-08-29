import api from './api';

export type User = {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type SignupData = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export const authService = {
  async signup(_data: SignupData): Promise<AuthResponse> {
    throw new Error('Not implemented — Phase 6');
  },

  async login(_data: LoginData): Promise<AuthResponse> {
    throw new Error('Not implemented — Phase 6');
  },

  async getMe(): Promise<User> {
    throw new Error('Not implemented — Phase 6');
  },
};
