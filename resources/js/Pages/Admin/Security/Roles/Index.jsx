import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx'
import { useI18n } from '@/Hooks/useI18n'

export default function RolesIndex({ roles = [], permissions = [] }) {
  const { t } = useI18n()

  return (
    <AuthenticatedLayout>
      <Head title={t('admin.security.roles.index.page_title', 'Permisos y roles')} />
      <h1 className="text-2xl font-bold mb-4">{t('admin.security.roles.index.title', 'Permisos y roles')}</h1>
      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{role.name}</div>
                <div className="text-xs text-gray-500">
                  {role.permissions?.map(p=>p.name).join(', ') || t('admin.security.roles.values.no_permissions', 'Sin permisos')}
                </div>
              </div>
              <Link href={route('admin.roles.edit', role.id)} className="px-3 py-1 border rounded">{t('admin.security.roles.actions.edit', 'Editar')}</Link>
            </div>
          </div>
        ))}
      </div>
    </AuthenticatedLayout>
  )
}
