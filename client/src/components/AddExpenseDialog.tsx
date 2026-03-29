import React, { useState } from 'react';
import { useGroupStore } from '../store/groupStore';
import { formatCurrency, getInitials } from '../lib/utils';
import { X, Loader2, IndianRupee } from 'lucide-react';

interface Props {
    groupId: string;
    members: { _id: string; name: string; email: string }[];
    currentUserId: string;
    onClose: () => void;
}

export default function AddExpenseDialog({ groupId, members, currentUserId, onClose }: Props) {
    const { addExpense, fetchBalances } = useGroupStore();
    const [form, setForm] = useState({
        description: '',
        amount: '',
        paidBy: currentUserId,
        splitAmong: members.map((m) => m._id),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleSplitMember = (userId: string) => {
        setForm((f) => ({
            ...f,
            splitAmong: f.splitAmong.includes(userId)
                ? f.splitAmong.filter((id) => id !== userId)
                : [...f.splitAmong, userId],
        }));
    };

    const perPersonShare = form.amount && form.splitAmong.length
        ? parseFloat(form.amount) / form.splitAmong.length
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.splitAmong.length === 0) { setError('Select at least one person to split with'); return; }
        setLoading(true);
        setError('');
        try {
            await addExpense(groupId, {
                description: form.description,
                amount: parseFloat(form.amount),
                paidBy: form.paidBy,
                splitAmong: form.splitAmong,
                splitType: 'equal',
            });
            await fetchBalances(groupId);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to add expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold">Add Expense</h2>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>Split equally among selected members</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'hsl(var(--text-muted))' }}>
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="rounded-xl p-3 text-sm"
                            style={{ background: 'hsl(var(--red) / 0.1)', color: 'hsl(var(--red))', border: '1px solid hsl(var(--red) / 0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Description *</label>
                        <input className="input-field" placeholder="e.g. Hotel booking" required
                            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Amount (₹) *</label>
                        <div className="relative">
                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--text-muted))' }} />
                            <input className="input-field pl-8" type="number" min="0.01" step="0.01" placeholder="0.00" required
                                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Paid by</label>
                        <select className="input-field" value={form.paidBy}
                            onChange={(e) => setForm({ ...form, paidBy: e.target.value })}>
                            {members.map((m) => (
                                <option key={m._id} value={m._id}>
                                    {m.name} {m._id === currentUserId ? '(you)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Split among</label>
                        <div className="space-y-2">
                            {members.map((m) => {
                                const checked = form.splitAmong.includes(m._id);
                                return (
                                    <label key={m._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                                        style={{
                                            background: checked ? 'hsl(var(--brand) / 0.08)' : 'hsl(var(--surface-2))',
                                            border: `1px solid ${checked ? 'hsl(var(--brand) / 0.3)' : 'hsl(var(--border))'}`,
                                        }}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleSplitMember(m._id)}
                                            className="accent-brand-500" />
                                        <div className="avatar w-7 h-7 text-xs flex-shrink-0">{getInitials(m.name)}</div>
                                        <span className="text-sm font-medium flex-1">{m.name} {m._id === currentUserId ? '(you)' : ''}</span>
                                        {checked && perPersonShare > 0 && (
                                            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--brand))' }}>
                                                {formatCurrency(perPersonShare)}
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                        {form.splitAmong.length > 0 && parseFloat(form.amount) > 0 && (
                            <p className="text-xs mt-2 text-center" style={{ color: 'hsl(var(--text-muted))' }}>
                                {formatCurrency(perPersonShare)} per person ({form.splitAmong.length} people)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            {loading ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
