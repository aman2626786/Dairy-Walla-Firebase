import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import { MOCK_USERS } from './mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, role?: Role) => User | null;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (phone: string, role?: Role) => {
        let user = MOCK_USERS.find(u => u.phone === phone) || null;
        if (!user && role) {
          user = {
            id: `u_${Date.now()}`,
            phone,
            name: `User ${phone.slice(-4)}`,
            role,
          };
        }
        if (user) {
          set({ user, isAuthenticated: true });
        }
        return user;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    { name: 'dairy-setu-auth' }
  )
);
