import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  user: { uid: string; email?: string } | null;
  login: (token: string) => void;
  logout: () => void;
  setUser: (user: { uid: string; email?: string } | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  user: null,
  login: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ isLoggedIn: true });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ isLoggedIn: false, user: null });
  },
  setUser: (user) => {
    set({ user });
  },
}));