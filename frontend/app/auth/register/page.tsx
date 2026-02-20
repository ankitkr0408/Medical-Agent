'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowLeft, CheckCircle2, MessageCircle, Stethoscope, Sparkles, X, ShieldCheck } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

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

        setIsLoading(true);

        try {
            const response = await authAPI.register({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
            });
            setAuth(response.user, response.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else if (Array.isArray(err.response.data.detail)) {
                    setError(err.response.data.detail[0].msg);
                } else {
                    setError('Registration failed. Please check your information.');
                }
            } else {
                setError(err.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center p-4">
            <div className="animated-bg"></div>

            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-5xl relative z-10 flex flex-col lg:flex-row gap-0 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Left Panel - Hero Info */}
                <div className="lg:w-5/12 bg-gradient-to-br from-[#0a0f1e] to-[#121a2e] p-10 flex flex-col justify-between border-r border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity cursor-pointer" onClick={() => router.push('/')}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                Medical Agent
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
                            Start your journey with<br />
                            <span className="text-cyan-400">Better Healthcare AI</span>
                        </h1>

                        <div className="space-y-6 mt-6">
                            {[
                                { icon: <CheckCircle2 className="w-5 h-5" />, title: 'Join 500+ Patients', desc: 'Trusting AI for preliminary image review.' },
                                { icon: <ShieldCheck className="w-5 h-5" />, title: 'Hipaa Aware Design', desc: 'Security built into every component.' },
                                { icon: <Sparkles className="w-5 h-5" />, title: 'Instant Account', desc: 'Free forever for basic analysis.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Register Form */}
                <div className="lg:w-7/12 bg-[#030712]/40 backdrop-blur-xl p-8 sm:p-12">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                            <p className="text-gray-400">Start analyzing your medical reports today.</p>
                        </div>

                        {/* User Type Switcher */}
                        <div className="flex p-1 bg-white/5 rounded-2xl mb-8">
                            <button
                                onClick={() => setUserType('patient')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${userType === 'patient' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Patient
                            </button>
                            <button
                                onClick={() => setUserType('doctor')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${userType === 'doctor' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Professional
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Full Name"
                                type="text"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                icon={<User className="w-4 h-4" />}
                                className="bg-white/5 border-white/10 h-12"
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                icon={<Mail className="w-4 h-4" />}
                                className="bg-white/5 border-white/10 h-12"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    icon={<Lock className="w-4 h-4" />}
                                    className="bg-white/5 border-white/10 h-12"
                                />
                                <Input
                                    label="Confirm"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    icon={<Lock className="w-4 h-4" />}
                                    className="bg-white/5 border-white/10 h-12"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 my-4">
                                    <X className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isLoading}
                                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl overflow-hidden relative group"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        Join Now <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                                </Button>
                            </div>

                            <p className="text-center text-sm text-gray-500 pt-4">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-cyan-400 font-bold hover:underline transition-all">
                                    Sign In
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
