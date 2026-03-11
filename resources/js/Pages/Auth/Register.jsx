import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>

           <main className="flex flex-col pt-16 bg-background">
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="w-full">
                    <div className="max-w-md mx-auto">
                        <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                            <span className="text-3xl">⚡</span>
                        </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Inventario</h1>
                <p className="text-muted-foreground">Crea una nueva cuenta</p>
                </div>

                      <div className="bg-card border border-border rounded-lg p-8 shadow-md">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Error message */}
                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {errorMessage}
                            </div>
                        )}

                        {/* Nombre */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                                Nombre
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Tu nombre completo"
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                />
                            </div>
                            <InputError message={errors.name} className="mt-2" />
                        </div>

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

                        {/* Confirmar Contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </div>

                        {/* Términos */}
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                required
                                className="w-4 h-4 rounded border-border cursor-pointer accent-primary mt-1 flex-shrink-0"
                            />
                            <span className="text-sm text-muted-foreground">
                                Acepto los{' '}
                                <Link href="#" className="text-primary hover:text-primary/80 transition">
                                    términos de servicio
                                </Link>{' '}
                                y la{' '}
                                <Link href="#" className="text-primary hover:text-primary/80 transition">
                                    política de privacidad
                                </Link>
                            </span>
                        </label>

                        {/* Botón registro */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {processing ? 'Registrando...' : 'Registrarse'}
                        </button>

                        {/* Login */}
                        <div className="text-center text-sm text-muted-foreground">
                            ¿Ya tienes cuenta?{' '}
                            <Link href={route('login')} className="text-primary hover:text-primary/80 transition font-medium">
                                Inicia sesión aquí
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
