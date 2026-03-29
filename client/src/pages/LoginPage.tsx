import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, SplitSquareVertical, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--background))' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
                    style={{ background: 'hsl(199 89% 48%)' }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                        style={{ background: 'linear-gradient(135deg, hsl(199 89% 48%), hsl(219 89% 58%))' }}>
                        <SplitSquareVertical size={24} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="mt-2 text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                        Sign in to your SplitPlus account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="card p-8 space-y-5">
                    {error && (
                        <div className="rounded-xl p-3 text-sm font-medium"
                            style={{ background: 'hsl(var(--red) / 0.1)', color: 'hsl(var(--red))', border: '1px solid hsl(var(--red) / 0.3)' }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Email</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                className="input-field pr-10"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'hsl(var(--text-muted))' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {loading ? 'Signing in...' : 'Sign in'}
                        {!loading && <ArrowRight size={16} />}
                    </button>

                    <p className="text-center text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold" style={{ color: 'hsl(var(--brand))' }}>
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
