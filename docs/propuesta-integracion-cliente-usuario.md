# Propuesta de Nueva Arquitectura: Unificación Cliente-Usuario

## 1. Objetivo
Permitir que los clientes se registren como usuarios, autocompleten sus datos en el checkout y accedan a módulos personalizados (historial de compras, productos favoritos, etc.), evitando duplicidad de datos y asegurando escalabilidad.

## 2. Estrategia de Integración

### a) Relación Cliente-Usuario
- Mantener la tabla `customers` con el campo `user_id` nullable.
- Todo usuario con rol "cliente" debe tener un registro en `customers` asociado mediante `user_id`.
- Los clientes anónimos (sin cuenta) pueden seguir existiendo, pero se incentivará el registro.

### b) Registro y Login
- El formulario de registro debe solicitar los datos mínimos necesarios para crear un usuario y su cliente asociado: nombre, email, contraseña, teléfono y dirección.
- Al registrarse, se crea un usuario con el rol "cliente" y automáticamente un registro en `customers` vinculado.
- Al iniciar sesión, si el usuario tiene un `customer`, se autocompletan los datos en el checkout.

### c) Checkout
- Si el usuario está autenticado y tiene `customer`, se usan sus datos para autocompletar.
- Si el usuario NO está autenticado, el checkout lo redirige obligatoriamente a la pantalla de login/registro antes de continuar. Así se garantiza que todos los pedidos tengan usuario y datos completos.

### d) Dashboard de Cliente
- Módulos personalizados: historial de compras, productos más comprados, edición de perfil, etc.
- Acceso solo para usuarios con rol "cliente".

### e) Seguridad y Roles
- Usar Spatie Roles/Permissions para distinguir "cliente" de otros tipos de usuario.
- Validar que solo los clientes accedan a su dashboard y datos.
- El rol "cliente" debe existir en el sistema y ser creado por el seeder de roles.
- Al registrarse desde el frontend, el usuario debe recibir automáticamente el rol "cliente".

## 3. Migración y Refactorización
- Migrar datos de clientes existentes a usuarios cuando corresponda.
- Refactorizar el flujo de checkout para usar la relación `user_id`.

## 4. Testing y Documentación
- Tests unitarios y de integración para registro, login y checkout.
- Documentar endpoints, modelos y flujos en README.

---

**Notas adicionales:**
- El checkout debe forzar login/registro antes de permitir la compra.
- El registro debe validar y guardar los datos necesarios para login y autocompletado.
- El seeder debe crear el rol "cliente" si no existe.
- El registro desde el frontend debe asignar el rol "cliente" automáticamente.

---


## 5. Estado Final de la Integración (28/03/2026)

- Se completó la integración: los clientes ahora se registran como usuarios con rol `cliente` y se crea automáticamente su registro en `customers`.
- El dashboard de cliente está disponible en `/mi-panel` con resumen de compras, historial y productos más comprados.
- La navegación y el menú admin se adaptan dinámicamente según el rol y permisos del usuario.
- Se mejoró el feedback visual de errores en formularios (registro, login, checkout) usando notificaciones.
- Se escribieron y ajustaron tests feature para los nuevos flujos, asegurando la correcta gestión de permisos y roles.
- Toda la documentación y el README han sido actualizados para reflejar la nueva arquitectura y flujos.
