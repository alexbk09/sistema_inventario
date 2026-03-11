import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx'

export default function RolesIndex({ roles = [], permissions = [] }) {
  return (
    <AuthenticatedLayout>
      <Head title="Permisos y Roles" />
      <h1 className="text-2xl font-bold mb-4">Permisos y Roles</h1>
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{role.name}</div>
                <div className="text-xs text-gray-500">
                  {role.permissions?.map(p=>p.name).join(', ') || 'Sin permisos'}
                </div>
              </div>
              <Link href={route('admin.roles.edit', role.id)} className="px-3 py-1 border rounded">Editar</Link>
            </div>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  )
}
