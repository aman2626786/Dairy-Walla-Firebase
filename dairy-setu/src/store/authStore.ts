import { create } from 'zustand';
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

const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms)),
  ]);
};

const mapAuthErrorMessage = (error: unknown): string => {
  const fallback = 'Login failed. Dobara try karo.';
  const status = typeof error === 'object' && error && 'status' in error
    ? Number((error as { status?: number }).status)
    : undefined;
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code || '')
    : '';
  const raw = error instanceof Error ? error.message : String(error ?? fallback);
  const msg = raw.toLowerCase();

  if (status === 429 || msg.includes('too many requests') || msg.includes('rate limit') || code.includes('rate_limit')) {
    return 'Bahut zyada login attempts ho gaye. 1 minute baad dobara try karo.';
  }
  if (msg.includes('request timeout')) {
    return 'Login request timeout. Network slow hai, 20-30 second baad dobara try karo.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network error')) {
    return 'Network issue aa raha hai. Internet check karke dobara try karo.';
  }
  return raw || fallback;
};

export const useAuthStore = create<AuthState>((set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      loadUser: async () => {
        let sessionUserId: string | null = null;
        try {
          const { data: { session } } = await withTimeout(supabase.auth.getSession(), 10000);
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
            supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
            10000
          );

          if (profile) {
            const preferredRole = (localStorage.getItem('dairy-walla-active-role') as Role | null);
            let role: Role = preferredRole || profile.role;
            const [{ data: dp }, { data: sp }] = await Promise.all([
              withTimeout(
                supabase.from('distributor_profiles').select('id').eq('user_id', session.user.id).maybeSingle(),
                10000
              ),
              withTimeout(
                supabase.from('shopkeeper_profiles').select('id').eq('user_id', session.user.id).maybeSingle(),
                10000
              ),
            ]);
            if (preferredRole === 'distributor' && !dp) role = sp ? 'shopkeeper' : profile.role;
            else if (preferredRole === 'shopkeeper' && !sp) role = dp ? 'distributor' : profile.role;
            else if (!preferredRole) role = dp ? 'distributor' : (sp ? 'shopkeeper' : profile.role);
            if (role !== profile.role) {
              void supabase.from('profiles').update({ role }).eq('id', session.user.id);
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
          // Email confirmation pending state ko auth user ke roop me persist nahi karna.
          set({ user: null, isAuthenticated: false, loading: false });
        }
        set({ loading: false });
        return {};
      },

      signIn: async (email, password, role) => {
        set({ loading: true });
        const normalizedEmail = email.trim().toLowerCase();

        try {
          const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
            20000
          );
          if (error) return { error: mapAuthErrorMessage(error) };
          if (data.user) {
            const [{ data: profile, error: profileError }, { data: dp, error: dpError }, { data: sp, error: spError }] = await Promise.all([
              withTimeout(
                supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
                12000
              ),
              withTimeout(
                supabase.from('distributor_profiles').select('id').eq('user_id', data.user.id).maybeSingle(),
                12000
              ),
              withTimeout(
                supabase.from('shopkeeper_profiles').select('id').eq('user_id', data.user.id).maybeSingle(),
                12000
              ),
            ]);
            if (profileError) throw profileError;
            if (dpError) throw dpError;
            if (spError) throw spError;

            if (profile) {
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
                void supabase.from('profiles').update({ role }).eq('id', data.user.id);
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
          return { error: mapAuthErrorMessage(e) };
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
        await supabase.auth.signOut({ scope: 'local' });
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
    }));
