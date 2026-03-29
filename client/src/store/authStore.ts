import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            loading: false,

            login: async (email, password) => {
                set({ loading: true });
                const { data } = await api.post('/auth/login', { email, password });
                localStorage.setItem('sp_token', data.token);
                set({ user: data.user, token: data.token, loading: false });
            },

            register: async (name, email, password) => {
                set({ loading: true });
                const { data } = await api.post('/auth/register', { name, email, password });
                localStorage.setItem('sp_token', data.token);
                set({ user: data.user, token: data.token, loading: false });
            },

            logout: () => {
                localStorage.removeItem('sp_token');
                set({ user: null, token: null });
            },

            loadUser: async () => {
                try {
                    const { data } = await api.get('/auth/me');
                    set({ user: data.user });
                } catch {
                    set({ user: null, token: null });
                }
            },
        }),
        { name: 'sp-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
    )
);
