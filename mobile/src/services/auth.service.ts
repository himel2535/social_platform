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

type BackendAuthData = {
  token: string;
  user: User;
};

type BackendMeData = {
  user: User;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<BackendSuccess<BackendAuthData>>('/auth/signup', {
      name: data.name.trim(),
      username: data.username.trim(),
      email: data.email.trim(),
      password: data.password,
    });

    return response.data.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<BackendSuccess<BackendAuthData>>('/auth/login', {
      email: data.email.trim(),
      password: data.password,
    });

    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<BackendSuccess<BackendMeData>>('/auth/me');
    return response.data.data.user;
  },
};
