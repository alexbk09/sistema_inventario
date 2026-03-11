import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx'

export default function RoleEdit({ role, permissions }) {
  const initial = role.permissions?.map((p) => String(p.id)) ?? []
  const { data, setData, put, processing } = useForm({ permission_ids: initial })

  const toggle = (id) => {
    setData((prev) => {
      const current = prev.permission_ids ?? []
      const idStr = String(id)
      const next = current.includes(idStr)
        ? current.filter((x) => x !== idStr)
        : [...current, idStr]

      return {
        ...prev,
        permission_ids: next,
      }
    })
  }

  function submit(e) {
    e.preventDefault()
    put(route('admin.roles.update', role.id))
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Editar ${role.name}`} />
      <form onSubmit={submit} className="space-y-4">
        <h1 className="text-2xl font-bold">Editar permisos: {role.name}</h1>
        <div className="grid md:grid-cols-3 gap-2">
          {permissions.map((perm) => (
            <label key={perm.id} className="flex items-center gap-2 border rounded p-2 bg-white">
              <input
                type="checkbox"
                checked={data.permission_ids.includes(String(perm.id))}
                onChange={() => toggle(perm.id)}
              />
              <span>{perm.name}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Link href={route('admin.roles.index')} className="px-3 py-2 border rounded">Volver</Link>
          <button type="submit" disabled={processing} className="px-3 py-2 bg-indigo-600 text-white rounded">Guardar</button>
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
