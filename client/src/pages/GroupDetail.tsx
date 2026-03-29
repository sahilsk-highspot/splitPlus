import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, getInitials, timeAgo } from '../lib/utils';
import AddExpenseDialog from '../components/AddExpenseDialog';
import {
    ArrowLeft, Plus, UserPlus, Loader2, Trash2, Receipt, Scale, ArrowRight, X, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

export default function GroupDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentGroup, expenses, balances, settlements, fetchGroup, fetchExpenses, fetchBalances, addMember, deleteExpense } = useGroupStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberEmail, setMemberEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [memberError, setMemberError] = useState('');
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        Promise.all([fetchGroup(id), fetchExpenses(id), fetchBalances(id)]).finally(() =>
            setPageLoading(false)
        );
    }, [id]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setAddingMember(true);
        setMemberError('');
        try {
            await addMember(id, memberEmail);
            setMemberEmail('');
            setShowAddMember(false);
        } catch (err: any) {
            setMemberError(err.response?.data?.message || 'Failed to add member');
        } finally {
            setAddingMember(false);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!id || !confirm('Delete this expense?')) return;
        await deleteExpense(id, expenseId);
        await fetchBalances(id);
    };

    if (pageLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={28} className="animate-spin" style={{ color: 'hsl(var(--brand))' }} />
            </div>
        );
    }
    if (!currentGroup) return (
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <p style={{ color: 'hsl(var(--text-muted))' }}>Group not found.</p>
        </div>
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const myBalance = balances.find((b) => b.user?._id === user?._id)?.amount || 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Back + Header */}
            <div className="mb-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm mb-4 transition-colors hover:opacity-80"
                    style={{ color: 'hsl(var(--text-muted))' }}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{currentGroup.name}</h1>
                        {currentGroup.description && (
                            <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>{currentGroup.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setShowAddMember(true)} className="btn-secondary">
                            <UserPlus size={15} /> Add Member
                        </button>
                        <button onClick={() => setShowAddExpense(true)} className="btn-primary">
                            <Plus size={15} /> Add Expense
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="card p-4">
                    <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--text-muted))' }}>Total Spent</p>
                    <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--text-muted))' }}>Expenses</p>
                    <p className="text-xl font-bold">{expenses.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--text-muted))' }}>Your Balance</p>
                    <div className="flex items-center gap-2">
                        {myBalance > 0 ? (
                            <TrendingUp size={18} style={{ color: 'hsl(var(--green))' }} />
                        ) : myBalance < 0 ? (
                            <TrendingDown size={18} style={{ color: 'hsl(var(--red))' }} />
                        ) : (
                            <Minus size={18} style={{ color: 'hsl(var(--text-muted))' }} />
                        )}
                        <p className="text-xl font-bold" style={{
                            color: myBalance > 0 ? 'hsl(var(--green))' : myBalance < 0 ? 'hsl(var(--red))' : 'hsl(var(--text-muted))'
                        }}>
                            {myBalance >= 0 ? '+' : ''}{formatCurrency(myBalance)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Members row */}
            <div className="card p-4 mb-6">
                <p className="section-label mb-3">Members ({currentGroup.members.length})</p>
                <div className="flex flex-wrap gap-2">
                    {currentGroup.members.map((m) => (
                        <div key={m._id} className="flex items-center gap-2 rounded-full px-3 py-1.5"
                            style={{ background: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--border))' }}>
                            <div className="avatar w-5 h-5 text-[10px]">{getInitials(m.name)}</div>
                            <span className="text-sm font-medium">{m.name}</span>
                            {m._id === user?._id && <span className="text-xs" style={{ color: 'hsl(var(--brand))' }}>you</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'hsl(var(--surface))' }}>
                {(['expenses', 'balances'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                        style={{
                            background: activeTab === tab ? 'hsl(var(--brand))' : 'transparent',
                            color: activeTab === tab ? 'white' : 'hsl(var(--text-muted))',
                        }}>
                        {tab === 'expenses' ? <><Receipt size={14} className="inline mr-1.5" />Expenses</> : <><Scale size={14} className="inline mr-1.5" />Balances</>}
                    </button>
                ))}
            </div>

            {/* Expenses Tab */}
            {activeTab === 'expenses' && (
                <div className="space-y-3">
                    {expenses.length === 0 ? (
                        <div className="card p-12 text-center">
                            <Receipt size={32} className="mx-auto mb-3" style={{ color: 'hsl(var(--text-muted))' }} />
                            <p className="font-medium mb-1">No expenses yet</p>
                            <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>Add the first expense to start tracking</p>
                        </div>
                    ) : expenses.map((exp) => (
                        <div key={exp._id} className="card p-4 transition-all hover:border-brand-500/30"
                            style={{ borderColor: 'hsl(var(--border))' }}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: 'hsl(var(--brand) / 0.12)', color: 'hsl(var(--brand))' }}>
                                        <Receipt size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{exp.description}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                                            Paid by <span style={{ color: 'hsl(var(--text))' }}>{exp.paidBy.name}</span>
                                            {exp.paidBy._id === user?._id ? ' (you)' : ''} · {timeAgo(exp.createdAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="font-bold">{formatCurrency(exp.amount)}</p>
                                        <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                                            {exp.splits.length} people
                                        </p>
                                    </div>
                                    {exp.createdBy?._id === user?._id && (
                                        <button onClick={() => handleDeleteExpense(exp._id)}
                                            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 flex-shrink-0"
                                            style={{ color: 'hsl(var(--text-muted))' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Splits */}
                            <div className="mt-3 pt-3 flex flex-wrap gap-1.5" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                                {exp.splits.map((s) => (
                                    <span key={s.user._id} className="text-xs rounded-full px-2.5 py-1"
                                        style={{ background: 'hsl(var(--surface-2))', color: 'hsl(var(--text-muted))' }}>
                                        {s.user.name}: {formatCurrency(s.share)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Balances Tab */}
            {activeTab === 'balances' && (
                <div className="space-y-4">
                    {/* Net balances */}
                    <div>
                        <p className="section-label mb-3">Net Balances</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {balances.length === 0 ? (
                                <div className="col-span-2 card p-8 text-center">
                                    <Scale size={28} className="mx-auto mb-2" style={{ color: 'hsl(var(--text-muted))' }} />
                                    <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>No balances to show. Add expenses first.</p>
                                </div>
                            ) : balances.map((b) => (
                                <div key={b.user._id} className="card p-4 flex items-center gap-3">
                                    <div className="avatar w-10 h-10 text-sm flex-shrink-0">{getInitials(b.user.name)}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{b.user.name} {b.user._id === user?._id ? '(you)' : ''}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                                            {b.amount > 0 ? 'should receive' : b.amount < 0 ? 'owes money' : 'settled up'}
                                        </p>
                                    </div>
                                    <span className="font-bold text-lg" style={{
                                        color: b.amount > 0 ? 'hsl(var(--green))' : b.amount < 0 ? 'hsl(var(--red))' : 'hsl(var(--text-muted))'
                                    }}>
                                        {b.amount >= 0 ? '+' : ''}{formatCurrency(b.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Settlements */}
                    {settlements.length > 0 && (
                        <div>
                            <p className="section-label mb-3">Suggested Settlements</p>
                            <div className="space-y-2">
                                {settlements.map((s, i) => (
                                    <div key={i} className="card p-4 flex items-center gap-3">
                                        <div className="avatar w-8 h-8 text-xs flex-shrink-0">{getInitials(s.from.name)}</div>
                                        <span className="text-sm font-medium">{s.from.name} {s.from._id === user?._id ? '(you)' : ''}</span>
                                        <div className="flex items-center gap-2 flex-1 justify-center">
                                            <ArrowRight size={14} style={{ color: 'hsl(var(--brand))' }} />
                                            <span className="font-bold" style={{ color: 'hsl(var(--brand))' }}>{formatCurrency(s.amount)}</span>
                                            <ArrowRight size={14} style={{ color: 'hsl(var(--brand))' }} />
                                        </div>
                                        <span className="text-sm font-medium">{s.to.name} {s.to._id === user?._id ? '(you)' : ''}</span>
                                        <div className="avatar w-8 h-8 text-xs flex-shrink-0">{getInitials(s.to.name)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Expense Dialog */}
            {showAddExpense && (
                <AddExpenseDialog
                    groupId={currentGroup._id}
                    members={currentGroup.members}
                    currentUserId={user?._id || ''}
                    onClose={() => { setShowAddExpense(false); if (id) fetchExpenses(id); }}
                />
            )}

            {/* Add Member Modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => e.target === e.currentTarget && setShowAddMember(false)}>
                    <div className="card w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Add Member</h2>
                            <button onClick={() => setShowAddMember(false)} style={{ color: 'hsl(var(--text-muted))' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            {memberError && (
                                <div className="rounded-xl p-3 text-sm"
                                    style={{ background: 'hsl(var(--red) / 0.1)', color: 'hsl(var(--red))', border: '1px solid hsl(var(--red) / 0.3)' }}>
                                    {memberError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Member Email</label>
                                <input type="email" required className="input-field" placeholder="friend@example.com"
                                    value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={addingMember} className="btn-primary flex-1">
                                    {addingMember && <Loader2 size={14} className="animate-spin" />}
                                    {addingMember ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
