export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  role?: 'user' | 'admin';
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  oldPassword?: string;
}
