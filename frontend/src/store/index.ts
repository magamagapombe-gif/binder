import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User { id: string; phone: string; is_verified: boolean; }
interface Profile { user_id: string; name: string; age: number; gender: string; bio: string; photos: string[]; country: string; }

interface Store {
  token: string | null;
  user: User | null;
  profile: Profile | null;
  wsRef: WebSocket | null;
  setAuth: (token: string, user: User) => void;
  setProfile: (p: Profile) => void;
  setWs: (ws: WebSocket | null) => void;
  logout: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      profile: null,
      wsRef: null,
      setAuth: (token, user) => { localStorage.setItem('binder_token', token); set({ token, user }); },
      setProfile: (profile) => set({ profile }),
      setWs: (wsRef) => set({ wsRef }),
      logout: () => { localStorage.removeItem('binder_token'); set({ token: null, user: null, profile: null }); },
    }),
    { name: 'binder-store', partialize: (s) => ({ token: s.token, user: s.user, profile: s.profile }) }
  )
);
