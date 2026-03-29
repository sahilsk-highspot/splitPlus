import { create } from 'zustand';
import api from '../lib/api';

interface Member {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Group {
    _id: string;
    name: string;
    description?: string;
    category: string;
    members: Member[];
    createdBy: Member;
    createdAt: string;
}

interface Split {
    user: Member;
    share: number;
}

interface Expense {
    _id: string;
    description: string;
    amount: number;
    paidBy: Member;
    splits: Split[];
    splitType: string;
    createdBy?: Member;
    createdAt: string;
}

interface Balance {
    user: Member;
    amount: number;
}

interface Settlement {
    from: Member;
    to: Member;
    amount: number;
}

interface GroupState {
    groups: Group[];
    currentGroup: Group | null;
    expenses: Expense[];
    balances: Balance[];
    settlements: Settlement[];
    loading: boolean;
    fetchGroups: () => Promise<void>;
    fetchGroup: (id: string) => Promise<void>;
    createGroup: (data: { name: string; description?: string; category?: string }) => Promise<Group>;
    addMember: (groupId: string, email: string) => Promise<void>;
    fetchExpenses: (groupId: string) => Promise<void>;
    addExpense: (groupId: string, data: object) => Promise<void>;
    deleteExpense: (groupId: string, expenseId: string) => Promise<void>;
    fetchBalances: (groupId: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set) => ({
    groups: [],
    currentGroup: null,
    expenses: [],
    balances: [],
    settlements: [],
    loading: false,

    fetchGroups: async () => {
        set({ loading: true });
        const { data } = await api.get('/groups');
        set({ groups: data, loading: false });
    },

    fetchGroup: async (id) => {
        set({ loading: true });
        const { data } = await api.get(`/groups/${id}`);
        set({ currentGroup: data, loading: false });
    },

    createGroup: async (payload) => {
        const { data } = await api.post('/groups', payload);
        set((s) => ({ groups: [data, ...s.groups] }));
        return data;
    },

    addMember: async (groupId, email) => {
        const { data } = await api.post(`/groups/${groupId}/members`, { email });
        set({ currentGroup: data });
    },

    fetchExpenses: async (groupId) => {
        set({ loading: true });
        const { data } = await api.get(`/groups/${groupId}/expenses`);
        set({ expenses: data, loading: false });
    },

    addExpense: async (groupId, payload) => {
        const { data } = await api.post(`/groups/${groupId}/expenses`, payload);
        set((s) => ({ expenses: [data, ...s.expenses] }));
    },

    deleteExpense: async (groupId, expenseId) => {
        await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
        set((s) => ({ expenses: s.expenses.filter((e) => e._id !== expenseId) }));
    },

    fetchBalances: async (groupId) => {
        const { data } = await api.get(`/groups/${groupId}/balances`);
        set({ balances: data.balances, settlements: data.settlements });
    },
}));
