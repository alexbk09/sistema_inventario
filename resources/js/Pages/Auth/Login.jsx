import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
            <main className="flex flex-col pt-16 bg-background">
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                            <span className="text-3xl">⚡</span>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Inventario</h1>
                        <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-8 shadow-md">
                                        <form onSubmit={submit} className="space-y-6">
                                            {/* Email */}
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                                    Email
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={data.email}
                                                        onChange={(e) => setData('email', e.target.value)}
                                                        placeholder="tu@email.com"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                                    />
                                                </div>
                                                <InputError message={errors.email} className="mt-2" />
                                            </div>

                                            {/* Contraseña */}
                                            <div>
                                                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                                    Contraseña
                                                </label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                                    <input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={data.password}
                                                        onChange={(e) => setData('password', e.target.value)}
                                                        placeholder="••••••••"
                                                        required
                                                        className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
                                                    >
                                                        {showPassword ? (
                                                            <EyeOff className="w-5 h-5" />
                                                        ) : (
                                                            <Eye className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <InputError message={errors.password} className="mt-2" />
                                            </div>

                                            {/* Recordar contraseña */}
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-border cursor-pointer accent-primary"
                                                        checked={data.remember}
                                                        onChange={(e) => setData('remember', e.target.checked)}
                                                    />
                                                    <span className="text-sm text-foreground">Recuérdame</span>
                                                </label>
                                                {canResetPassword && (
                                                    <Link href={route('password.request')} className="text-sm text-primary hover:text-primary/80 transition">
                                                        ¿Olvidaste tu contraseña?
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Botón login */}
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                            >
                                                {processing ? 'Iniciando sesión...' : 'Iniciar sesión'}
                                            </button>

                                            {/* Registro */}
                                            <div className="text-center text-sm text-muted-foreground">
                                                ¿No tienes cuenta?{' '}
                                                <Link href={route('register')} className="text-primary hover:text-primary/80 transition font-medium">
                                                    Regístrate aquí
                                                </Link>
                                            </div>
                                        </form>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </GuestLayout>
    );
}
