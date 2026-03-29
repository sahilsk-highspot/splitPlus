import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupStore } from '../store/groupStore';
import { useAuthStore } from '../store/authStore';
import { getInitials } from '../lib/utils';
import { Plus, Users, Wallet, ChevronRight, Loader2, Plane, Home, UtensilsCrossed, MoreHorizontal, X } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    trip: <Plane size={16} />,
    home: <Home size={16} />,
    food: <UtensilsCrossed size={16} />,
    other: <MoreHorizontal size={16} />,
};

export default function Dashboard() {
    const { groups, fetchGroups, createGroup, loading } = useGroupStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', category: 'other' });
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => { fetchGroups(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setFormError('');
        try {
            const group = await createGroup(form);
            setShowCreate(false);
            setForm({ name: '', description: '', category: 'other' });
            navigate(`/groups/${group._id}`);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Your Groups</h1>
                    <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
                        Track shared expenses across {groups.length} group{groups.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                    <Plus size={16} />
                    New Group
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Groups', value: groups.length, icon: <Users size={18} />, color: 'hsl(199 89% 48%)' },
                    { label: 'Active Members', value: [...new Set(groups.flatMap((g) => g.members.map((m) => m._id)))].length, icon: <Users size={18} />, color: 'hsl(142 71% 45%)' },
                    { label: 'Your Name', value: user?.name || '—', icon: <Wallet size={18} />, color: 'hsl(45 93% 58%)' },
                ].map((stat) => (
                    <div key={stat.label} className="card p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-xs font-medium" style={{ color: 'hsl(var(--text-muted))' }}>{stat.label}</p>
                            <p className="text-lg font-bold mt-0.5">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Groups Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={24} className="animate-spin" style={{ color: 'hsl(var(--brand))' }} />
                </div>
            ) : groups.length === 0 ? (
                <div className="card p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'hsl(var(--surface-2))' }}>
                        <Users size={28} style={{ color: 'hsl(var(--text-muted))' }} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No groups yet</h3>
                    <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-muted))' }}>
                        Create your first group to start splitting expenses
                    </p>
                    <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
                        <Plus size={16} /> Create a group
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group) => (
                        <div key={group._id} className="card-hover p-5" onClick={() => navigate(`/groups/${group._id}`)}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: 'hsl(var(--brand) / 0.15)', color: 'hsl(var(--brand))' }}>
                                        {CATEGORY_ICONS[group.category] || <MoreHorizontal size={16} />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{group.name}</h3>
                                        {group.description && (
                                            <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'hsl(var(--text-muted))' }}>
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={16} style={{ color: 'hsl(var(--text-muted))' }} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                    {group.members.slice(0, 4).map((m) => (
                                        <div key={m._id} className="avatar w-7 h-7 text-xs border-2"
                                            style={{ borderColor: 'hsl(var(--surface))' }} title={m.name}>
                                            {getInitials(m.name)}
                                        </div>
                                    ))}
                                    {group.members.length > 4 && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 font-medium"
                                            style={{ borderColor: 'hsl(var(--surface))', background: 'hsl(var(--surface-2))', color: 'hsl(var(--text-muted))' }}>
                                            +{group.members.length - 4}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                                    {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
                    <div className="card w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Create Group</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-surface-2"
                                style={{ color: 'hsl(var(--text-muted))' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {formError && (
                                <div className="rounded-xl p-3 text-sm"
                                    style={{ background: 'hsl(var(--red) / 0.1)', color: 'hsl(var(--red))', border: '1px solid hsl(var(--red) / 0.3)' }}>
                                    {formError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Group Name *</label>
                                <input className="input-field" placeholder="e.g. Goa Trip" required
                                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Description</label>
                                <input className="input-field" placeholder="Optional"
                                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Category</label>
                                <select className="input-field" value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                    <option value="trip">✈️ Trip</option>
                                    <option value="home">🏠 Home</option>
                                    <option value="food">🍴 Food</option>
                                    <option value="other">📌 Other</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={creating} className="btn-primary flex-1">
                                    {creating && <Loader2 size={14} className="animate-spin" />}
                                    {creating ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
