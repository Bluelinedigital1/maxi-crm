import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

// Fallback hardcoded users
const MOCK_USERS: AuthUser[] = [
  { id: 'u1', name: 'André Cardoso', email: 'admin@maxxi.com', role: 'ADMIN', isActive: true },
  { id: 'u2', name: 'Juliana Silva', email: 'vendedor@maxxi.com', role: 'SELLER', isActive: true },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const cleanedEmail = email.toLowerCase().trim();
          const matched = MOCK_USERS.find((u) => u.email === cleanedEmail);
          if (matched) {
            Cookies.set('accessToken', 'mock-token-' + matched.id, { expires: 7 });
            set({ user: matched, isAuthenticated: true });
          } else {
            throw new Error('E-mail ou senha incorretos. Dica: use vendedor@maxxi.com ou admin@maxxi.com');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        Cookies.remove('accessToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'maxi-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
