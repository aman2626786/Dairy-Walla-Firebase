﻿import { create } from 'zustand';
import { auth as firebaseAuth } from '../lib/firebase';
import { signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';
import type { User, Role } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (phone: string, _uid: string, role: Role) => Promise<{ error?: string; user?: User; needsProfile?: boolean }>;
  loginWithPin: (phone: string, pin: string, role: Role) => Promise<{ error?: string; user?: User; needsProfile?: boolean }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

let authListenerUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  loadUser: async () => {
    if (authListenerUnsubscribe) {
      authListenerUnsubscribe();
    }
    return new Promise<void>((resolve) => {
      const fetchAndSetUser = async (phone: string, resFn: () => void) => {
        try {
          const preferredRole = (localStorage.getItem('dairy-walla-active-role') as Role | null);
          const res = await axios.post(`${API_URL}/auth/me`, { phone, role: preferredRole });
          if (res.data.needsSetup) {
            set({ isAuthenticated: true });
            resFn();
            return;
          }

          const { profile, dp, sp } = res.data;
          let role: Role = preferredRole || profile.role;

          if (preferredRole === 'distributor' && !dp) role = sp ? 'shopkeeper' : profile.role;
          else if (preferredRole === 'shopkeeper' && !sp) role = dp ? 'distributor' : profile.role;
          
          localStorage.setItem('dairy-walla-active-role', role);
          
          set({
            user: { id: profile.id, email: profile.email, name: profile.name || '', phone: profile.phone, role },
            isAuthenticated: true,
            loading: false
          });
        } catch (error) {
          console.error("Error loading user from API", error);
          set({ user: null, isAuthenticated: false });
        }
        resFn();
      };

      const localPhone = localStorage.getItem('dairy-walla-phone');
      if (localPhone) {
        fetchAndSetUser(localPhone, resolve).catch(() => {
          localStorage.removeItem('dairy-walla-phone');
          resolve();
        });
        return;
      }

      authListenerUnsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (!firebaseUser || !firebaseUser.phoneNumber) {
          set({ user: null, isAuthenticated: false, loading: false });
          resolve();
          return;
        }
        const phone = firebaseUser.phoneNumber.replace('+91', '');
        localStorage.setItem('dairy-walla-phone', phone);
        await fetchAndSetUser(phone, resolve);
      });
    });
  },

  signIn: async (phone, _uid, role) => {
    set({ loading: true });
    try {
      const res = await axios.post(`${API_URL}/auth/me`, { phone, role });
      if (res.data.needsSetup) {
        set({ loading: false });
        return { needsProfile: true };
      }
      
      const { profile, dp, sp } = res.data;
      
      if (role === 'distributor' && !dp) {
        set({ loading: false });
        return { error: 'Is account me distributor profile nahi mili. Shopkeeper try karo.' };
      }
      if (role === 'shopkeeper' && !sp) {
        set({ loading: false });
        return { error: 'Is account me shopkeeper profile nahi mili. Distributor try karo.' };
      }

      localStorage.setItem('dairy-walla-active-role', role);
      localStorage.setItem('dairy-walla-phone', phone);
      const user: User = { id: profile.id, email: profile.email, name: profile.name || '', phone: profile.phone, role };
      
      set({ user, isAuthenticated: true, loading: false });
      return { user };
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        await firebaseSignOut(firebaseAuth);
        localStorage.removeItem('dairy-walla-active-role');
        set({ user: null, isAuthenticated: false, loading: false });
        return { error: e.response.data.error };
      }
      console.error("SignIn API Error:", e); // Log other errors
      set({ loading: false });
      return { error: 'Login failed due to server error' };
    }
  },

  loginWithPin: async (phone, pin, role) => {
    set({ loading: true });
    try {
      const res = await axios.post(`${API_URL}/auth/login-pin`, { phone, pin, role });
      const { profile, dp, sp } = res.data;
      
      if (role === 'distributor' && !dp) {
        set({ loading: false });
        return { error: 'Is account me distributor profile nahi mili. Shopkeeper try karo.' };
      }
      if (role === 'shopkeeper' && !sp) {
        set({ loading: false });
        return { error: 'Is account me shopkeeper profile nahi mili. Distributor try karo.' };
      }

      localStorage.setItem('dairy-walla-active-role', role);
      localStorage.setItem('dairy-walla-phone', phone);
      const user: User = { id: profile.id, email: profile.email, name: profile.name || '', phone: profile.phone, role };
      
      set({ user, isAuthenticated: true, loading: false });
      return { user };
    } catch (e: any) {
      console.error("PIN Login Error:", e);
      set({ loading: false });
      let errMsg = 'Login failed due to server error';
      if (e.response?.status === 404 && !e.response?.data?.error) {
        errMsg = "Backend API update nahi hui hai. Kripya naya code GitHub par push karein.";
      } else if (e.response?.data?.error) {
        errMsg = e.response.data.error;
      } else if (e.message === 'Network Error') {
        errMsg = "Server se connect nahi ho paya. Backend start karein.";
      }
      return { error: errMsg };
    }
  },

  signOut: async () => {
    await firebaseSignOut(firebaseAuth);
    localStorage.removeItem('dairy-walla-active-role');
    localStorage.removeItem('dairy-walla-phone');
    set({ user: null, isAuthenticated: false });
  },

  deleteAccount: async () => {
    set({ loading: true });
    try {
      const fUser = firebaseAuth.currentUser;
      if (fUser) {
        const phone = fUser.phoneNumber?.replace('+91', '');
        if (phone) await axios.delete(`${API_URL}/auth/me/${phone}`);
        await fUser.delete();
      }
      localStorage.removeItem('dairy-walla-active-role');
      localStorage.removeItem('dairy-walla-phone');
      set({ user: null, isAuthenticated: false, loading: false });
      return {};
    } catch (e: any) {
      console.error("Delete Account API Error:", e);
      set({ loading: false });
      if (e.code === 'auth/requires-recent-login') {
        return { error: 'Security ke liye, pehle logout karke dobara login karein, phir account delete karein.' };
      }
      return { error: 'Account delete nahi ho paya.' };
    }
  },

  updateUser: async (updates) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...updates };
    set({ user: updated });

    try {
      await axios.patch(`${API_URL}/auth/user/${user.id}`, updates);
    } catch (e) {
      console.error('Failed to update user in DB', e);
    }
  }
}));
