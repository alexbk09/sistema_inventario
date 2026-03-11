import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Show({ user }) {
  return (
    <AuthenticatedLayout>
      <Head title={`Usuario: ${user.name}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{user.name}</h1>
            <p className="text-muted-foreground">Información detallada del usuario.</p>
          </div>
          <Link
            href={route('admin.users.index')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Usuarios
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Datos básicos</h2>
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Nombre:</span> {user.name}</p>
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Email:</span> {user.email}</p>
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Tipo:</span> {user.type || '-'}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Creado: {user.created_at ? new Date(user.created_at).toLocaleString('es-VE') : '-'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Roles asignados</h2>
            </div>
            {(!user.roles || user.roles.length === 0) ? (
              <p className="text-sm text-muted-foreground">Este usuario no tiene roles asignados.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role.id}
                    className="px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              La gestión de permisos y roles detallados se realiza desde el módulo de Roles.
            </p>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
