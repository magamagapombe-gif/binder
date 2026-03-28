import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { disconnectWs } from '@/hooks/useWebSocket';

interface User { id: string; phone: string; is_verified: boolean; }
interface Profile {
  user_id: string; name: string; age: number; gender: string;
  bio: string; photos: string[]; country: string;
  interested_in: string; min_age_pref: number; max_age_pref: number;
}

interface Store {
  token: string | null;
  user: User | null;
  profile: Profile | null;
  setAuth: (token: string, user: User) => void;
  setProfile: (p: Profile) => void;
  logout: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profile: null,
      setAuth: (token, user) => {
        localStorage.setItem('binder_token', token);
        set({ token, user });
      },
      setProfile: (profile) => set({ profile }),
      logout: () => {
        localStorage.removeItem('binder_token');
        disconnectWs(); // cleanly close the shared WS on logout
        set({ token: null, user: null, profile: null });
      },
    }),
    {
      name: 'binder-store',
      partialize: (s) => ({ token: s.token, user: s.user, profile: s.profile }),
    }
  )
);
