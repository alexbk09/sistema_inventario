import React from 'react'

export default function ConfirmDialog({
  isOpen,
  title = 'Confirmar',
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="px-5 py-4 flex gap-2 justify-end border-t border-border">
            <button
              type="button"
              className="px-3 py-2 border border-border rounded hover:bg-muted disabled:opacity-50"
              onClick={onCancel}
              disabled={busy}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              onClick={onConfirm}
              disabled={busy}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
