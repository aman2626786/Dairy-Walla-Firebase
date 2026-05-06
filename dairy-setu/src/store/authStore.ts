import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { User, Role } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  // Supabase auth
  signUp: (email: string, password: string, role: Role, phone: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string, role: Role) => Promise<{ error?: string; user?: User; needsProfile?: boolean }>;
  resendConfirmation: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      loadUser: async () => {
        const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
          return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)),
          ]);
        };

        let sessionUserId: string | null = null;
        try {
          const { data: { session } } = await withTimeout(supabase.auth.getSession());
          if (!session?.user) { set({ user: null, isAuthenticated: false }); return; }
          sessionUserId = session.user.id;

          // Keep session authenticated even if profile fetch is slow/fails
          const existing = get().user;
          if (!existing || existing.id !== session.user.id) {
            const fallbackRole = (localStorage.getItem('dairy-walla-active-role') as Role | null) || 'shopkeeper';
            set({
              user: { id: session.user.id, email: session.user.email || '', name: '', phone: '', role: fallbackRole },
              isAuthenticated: true,
            });
          } else {
            set({ isAuthenticated: true });
          }

          const { data: profile } = await withTimeout(
            supabase.from('profiles').select('*').eq('id', session.user.id).single()
          );

          if (profile) {
            const preferredRole = (localStorage.getItem('dairy-walla-active-role') as Role | null);
            let role: Role = preferredRole || profile.role;
            const { data: dp } = await withTimeout(
              supabase.from('distributor_profiles').select('id').eq('user_id', session.user.id).single()
            );
            const { data: sp } = await withTimeout(
              supabase.from('shopkeeper_profiles').select('id').eq('user_id', session.user.id).single()
            );
            if (preferredRole === 'distributor' && !dp) role = sp ? 'shopkeeper' : profile.role;
            else if (preferredRole === 'shopkeeper' && !sp) role = dp ? 'distributor' : profile.role;
            else if (!preferredRole) role = dp ? 'distributor' : (sp ? 'shopkeeper' : profile.role);
            if (role !== profile.role) {
              await withTimeout(supabase.from('profiles').update({ role }).eq('id', session.user.id));
            }
            localStorage.setItem('dairy-walla-active-role', role);
            set({
              user: { id: profile.id, email: profile.email, name: profile.name || '', phone: profile.phone, role },
              isAuthenticated: true,
            });
          }
        } catch {
          // Avoid auth flip-flop on transient network failures when session exists.
          if (sessionUserId) {
            const current = get().user;
            if (current?.id === sessionUserId) {
              set({ isAuthenticated: true });
            } else {
              const fallbackRole = (localStorage.getItem('dairy-walla-active-role') as Role | null) || 'shopkeeper';
              set({
                user: { id: sessionUserId, email: '', name: '', phone: '', role: fallbackRole },
                isAuthenticated: true,
              });
            }
            return;
          }
          set({ user: null, isAuthenticated: false });
        }
      },

      signUp: async (email, password, role, phone) => {
        set({ loading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, phone, name: '' },
            emailRedirectTo: `${window.location.origin}/confirm`,
          }
        });
        if (error) { set({ loading: false }); return { error: error.message }; }
        if (data.user) {
          set({
            user: { id: data.user.id, email, name: '', phone, role },
            isAuthenticated: false, // email confirm hone tak false
            loading: false,
          });
        }
        set({ loading: false });
        return {};
      },

      signIn: async (email, password, role) => {
        set({ loading: true });
        const normalizedEmail = email.trim().toLowerCase();
        const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
          return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)),
          ]);
        };

        try {
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email: normalizedEmail, password })
          );
          if (error) return { error: error.message };
          if (data.user) {
            const { data: profile } = await withTimeout(
              supabase.from('profiles').select('*').eq('id', data.user.id).single()
            );

            if (profile) {
              const { data: dp } = await withTimeout(
                supabase.from('distributor_profiles').select('id').eq('user_id', data.user.id).single()
              );
              const { data: sp } = await withTimeout(
                supabase.from('shopkeeper_profiles').select('id').eq('user_id', data.user.id).single()
              );

              if (role === 'distributor' && !dp) {
                if (sp) return { error: 'Is account me distributor profile nahi mili. Shopkeeper role select karo.' };
                return { needsProfile: true };
              }
              if (role === 'shopkeeper' && !sp) {
                if (dp) return { error: 'Is account me shopkeeper profile nahi mili. Distributor role select karo.' };
                return { needsProfile: true };
              }

              if (!dp && !sp) return { needsProfile: true };

              if (role !== profile.role) {
                await withTimeout(supabase.from('profiles').update({ role }).eq('id', data.user.id));
              }
              localStorage.setItem('dairy-walla-active-role', role);

              const user: User = {
                id: profile.id,
                email: profile.email,
                name: profile.name || '',
                phone: profile.phone,
                role,
              };
              set({ user, isAuthenticated: true });
              return { user };
            }
            return { needsProfile: true };
          }
          return { error: 'Login failed' };
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Login failed';
          return { error: msg === 'Request timeout' ? 'Login timeout. Internet check karke dobara try karo.' : msg };
        } finally {
          set({ loading: false });
        }
      },

      resendConfirmation: async (email) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: normalizedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/confirm`,
          },
        });
        if (error) return { error: error.message };
        return {};
      },

      signOut: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('dairy-walla-active-role');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: async (updates) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, ...updates };
        set({ user: updated });
        await supabase.from('profiles').update({
          name: updated.name,
          phone: updated.phone,
        }).eq('id', user.id);
      },
    }),
    {
      name: 'dairy-walla-auth',
      partialize: (state) => ({ user: state.user }),
      // isAuthenticated persist nahi karo — har baar Supabase se validate hoga
    }
  )
);
