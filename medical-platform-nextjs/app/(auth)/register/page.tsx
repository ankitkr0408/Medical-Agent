'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'doctor',
        specialization: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    specialization: formData.specialization,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Registration failed');
            } else {
                router.push('/login?registered=true');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex gradient-navy relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-20 animate-float" style={{ background: 'radial-gradient(circle, #0EA5E9, transparent)', animationDelay: '1.5s' }} />
                <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10 animate-float" style={{ background: 'radial-gradient(circle, #10B981, transparent)', animationDelay: '3s' }} />
            </div>

            {/* Left panel - branding */}
            <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-16 relative z-10">
                <div className="text-center animate-fade-up">
                    <div className="text-8xl mb-6 animate-float">🧠</div>
                    <h1 className="text-5xl font-black text-white mb-4 leading-tight">
                        Health<span className="text-gradient" style={{ background: 'linear-gradient(135deg,#A78BFA,#38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IQ</span>
                    </h1>
                    <p className="text-slate-300 text-lg max-w-sm leading-relaxed">
                        AI-powered medical intelligence for healthcare professionals and patients.
                    </p>
                    <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto">
                        {[['🔬', 'AI Analysis'], ['👨‍⚕️', 'Specialists'], ['📊', 'Reports'], ['💬', 'Collaboration']].map(([icon, label]) => (
                            <div key={label} className="glass rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">{icon}</div>
                                <div className="text-xs text-slate-300 font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex flex-col justify-center items-center flex-1 p-8 relative z-10">
                <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-up" style={{ animationDelay: '.1s' }}>
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-3 lg:hidden">🧠</div>
                        <h2 className="text-2xl font-bold text-slate-800">Create Your Account</h2>
                        <p className="text-slate-500 text-sm mt-1">Join HealthIQ today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm animate-fade-in">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="input"
                                placeholder="Dr. John Smith"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                placeholder="doctor@hospital.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Role
                            </label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="input"
                            >
                                <option value="doctor">Doctor</option>
                                <option value="radiologist">Radiologist</option>
                                <option value="patient">Patient</option>
                                <option value="researcher">Researcher</option>
                            </select>
                        </div>

                        {formData.role !== 'patient' && (
                            <div>
                                <label htmlFor="specialization" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Specialization
                                </label>
                                <input
                                    id="specialization"
                                    type="text"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    className="input"
                                    placeholder="Radiology, Cardiology, etc."
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-1.5">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
                        >
                            {loading ? <><span className="spinner-sm" /> Creating account...</> : '→ Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-violet-600 font-semibold hover:underline">
                            Sign in here
                        </Link>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <span>🔒</span> HIPAA-compliant · End-to-end encrypted
                    </div>
                </div>
            </div>
        </div>
    );
}
