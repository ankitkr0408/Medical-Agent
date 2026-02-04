'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

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
                    const errorMessages = err.response.data.detail
                        .map((e: any) => `${e.loc.join('.')}: ${e.msg}`)
                        .join(', ');
                    setError(errorMessages);
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
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-cyan-50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-teal-200/20 rounded-full blur-2xl"></div>

            <div className="container mx-auto flex items-center justify-center p-4 lg:p-8 relative z-10 w-full">
                <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Panel - Cyan Gradient */}
                    <div className="lg:w-2/5 bg-gradient-to-br from-cyan-400 to-teal-500 p-8 lg:p-12 text-white relative overflow-hidden">
                        {/* Back Button */}
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-white/90 hover:text-white mb-12 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-medium">Back</span>
                        </button>

                        {/* Decorative circles */}
                        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>

                        {/* Content */}
                        <div className="relative z-10">
                            <h1 className="text-3xl lg:text-4xl font-bold mb-12">
                                Expert advice from<br />top doctors
                            </h1>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/95 font-medium">Expert advice from top doctors</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/95 font-medium">Available 24/7 on any device</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white/95 font-medium">Private questions answered within 24 hrs</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="lg:w-3/5 p-8 lg:p-12">
                        {/* User Type Tabs */}
                        <div className="flex gap-4 mb-8">
                            <button
                                onClick={() => setUserType('patient')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${userType === 'patient'
                                    ? 'bg-cyan-50 text-cyan-600 font-medium'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userType === 'patient' ? 'bg-cyan-500' : 'bg-gray-200'
                                    }`}>
                                    <span className="text-white text-sm">👤</span>
                                </div>
                                Patient
                            </button>
                            <button
                                onClick={() => setUserType('doctor')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${userType === 'doctor'
                                    ? 'bg-cyan-50 text-cyan-600 font-medium'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userType === 'doctor' ? 'bg-cyan-500' : 'bg-gray-200'
                                    }`}>
                                    <span className="text-white text-sm">👨‍⚕️</span>
                                </div>
                                Doctor
                            </button>
                        </div>

                        {/* Welcome Text */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h2>
                            <p className="text-gray-500">Log in to your account and we'll get you in to see our doctors</p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-400"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        👁️
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-6 rounded-lg font-medium hover:from-teal-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign in'
                                )}
                            </button>

                            {/* Sign Up Link */}
                            <p className="text-center text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    href="/auth/register"
                                    className="text-cyan-600 hover:text-cyan-700 font-medium underline"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
