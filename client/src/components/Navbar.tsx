import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getInitials } from '../lib/utils';
import { LogOut, SplitSquareVertical, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 glass border-b" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, hsl(199 89% 48%), hsl(219 89% 58%))' }}>
                        <SplitSquareVertical size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">SplitPlus</span>
                </Link>

                {user && (
                    <nav className="flex items-center gap-2">
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/dashboard'
                                    ? 'bg-brand-500/10 text-brand-400'
                                    : 'hover:bg-surface-2 text-muted'
                                }`}
                            style={{ color: location.pathname === '/dashboard' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}
                        >
                            <LayoutDashboard size={15} />
                            Dashboard
                        </Link>

                        <div className="flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: '1px solid hsl(var(--border))' }}>
                            <div className="avatar w-8 h-8 text-xs flex-shrink-0">
                                {getInitials(user.name)}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>{user.email}</p>
                            </div>
                            <button onClick={handleLogout} className="ml-2 p-2 rounded-lg transition-colors hover:bg-red-500/10"
                                style={{ color: 'hsl(var(--text-muted))' }} title="Log out">
                                <LogOut size={15} />
                            </button>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
