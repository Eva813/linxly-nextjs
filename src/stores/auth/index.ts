import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('token'),
  login: (token) => {
    localStorage.setItem('token', token);
    set({ isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ isLoggedIn: false });
  },
}));