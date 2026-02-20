'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, CheckCircle2, Clock, MessageCircle, Stethoscope, Sparkles, X } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await authAPI.login(formData);
            setAuth(response.user, response.access_token);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.data?.detail) {
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else if (Array.isArray(err.response.data.detail)) {
                    setError(err.response.data.detail[0].msg);
                } else {
                    setError('Login failed. Please check your credentials.');
                }
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex items-center justify-center p-4">
            <div className="animated-bg"></div>

            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-5xl relative z-10 flex flex-col lg:flex-row gap-0 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                {/* Left Panel - Hero Info */}
                <div className="lg:w-5/12 bg-gradient-to-br from-[#0a0f1e] to-[#121a2e] p-10 flex flex-col justify-between border-r border-white/5">
                    <div>
                        <div className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity cursor-pointer" onClick={() => router.push('/')}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg">
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                Medical Agent
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
                            Access your<br />
                            <span className="text-cyan-400">Personal Health AI</span>
                        </h1>

                        <div className="space-y-6 mt-8">
                            {[
                                { icon: <Sparkles className="w-5 h-5" />, title: 'AI-Powered Analysis', desc: 'Instant insights from medical images.' },
                                { icon: <MessageCircle className="w-5 h-5" />, title: 'Expert Consultations', desc: 'Virtual multidisciplinary team review.' },
                                { icon: <Lock className="w-5 h-5" />, title: 'Secure & Private', desc: 'Your medical data is fully encrypted.' },
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

                    <div className="mt-12 pt-8 border-t border-white/5">
                        <p className="text-xs text-gray-500 italic">
                            "AI-assisted medical observations for educational purposes."
                        </p>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="lg:w-7/12 bg-[#030712]/40 backdrop-blur-xl p-10 sm:p-14">
                    <div className="max-w-md mx-auto">
                        <div className="mb-10 text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-400">Login to access your medical dashboard and reports.</p>
                        </div>

                        {/* User Type Switcher */}
                        <div className="flex p-1.5 bg-white/5 rounded-2xl mb-8">
                            <button
                                onClick={() => setUserType('patient')}
                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${userType === 'patient' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Patient
                            </button>
                            <button
                                onClick={() => setUserType('doctor')}
                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${userType === 'doctor' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Professional
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                icon={<Mail className="w-4 h-4" />}
                                className="bg-white/5 border-white/10"
                            />

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-text-secondary">Password</label>
                                    <Link href="#" className="text-xs text-cyan-400 hover:text-cyan-300">Forgot password?</Link>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    icon={<Lock className="w-4 h-4" />}
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
                                    <X className="w-5 h-5 text-red-400 shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={isLoading}
                                className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl overflow-hidden relative group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Sign In <ArrowLeft className="w-4 h-4 rotate-180" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                            </Button>

                            <p className="text-center text-sm text-gray-500 pt-4">
                                Don't have an account?{' '}
                                <Link href="/auth/register" className="text-cyan-400 font-bold hover:underline">
                                    Create Free Account
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
