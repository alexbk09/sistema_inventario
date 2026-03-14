# Sistema de Inventario

Aplicación web de gestión de inventario, ventas y clientes pensada para comercios que venden en USD y BS. Está construida con **Laravel 12**, **Inertia.js + React** y **Tailwind CSS**, e incluye panel administrativo, tienda pública y módulos avanzados como créditos, apartados, multi‑bodega y RMA.

Para una descripción técnica más profunda de modelos, servicios y flujos de negocio revisa la documentación ampliada en [docs/documentacion-sistema-inventario.md](docs/documentacion-sistema-inventario.md).

---

## Características principales

- Catálogo de productos y categorías con múltiples imágenes, códigos de barras y destacados.
- Gestión de inventario con historial de movimientos (entradas, salidas, ajustes).
- Multi‑sucursal / multi‑bodega y transferencias internas de stock.
- Ventas y facturación (USD/BS) con detalle por items y estados de factura.
- Clientes (CRM básico), proveedores y base de usuarios internos con roles y permisos.
- Sistema de **apartados (layaway)** y **créditos** al cliente con control de saldo.
- Módulo de devoluciones y garantías (RMA) vinculado a facturas y productos.
- Tienda pública con carrito, checkout y confirmación de compra.
- Dashboard administrativo con métricas, productos con bajo stock y top productos.
- Conversión dinámica USD → BS usando un servicio de tasas de cambio.
- Integración opcional con un servicio de **IA local** para procesar imágenes de productos.

Rutas públicas y del panel más usadas (ver detalle en [routes/web.php](routes/web.php)):

- `/` – Home con productos destacados y tasa de cambio.
- `/shop` – Tienda pública con listado de productos y filtros.
- `/checkout` / `/confirmacion` – Flujo de compra pública.
- `/dashboard` – Dashboard administrativo (requiere usuario autenticado con rol `admin`).
- `/admin/...` – Gestión de productos, inventario, bodegas, facturas, clientes, proveedores, créditos, apartados, RMA y escáner QR.

---

## Tecnologías

- **Backend:** Laravel 12 (PHP 8.2), MySQL/MariaDB.
- **Frontend:** Inertia.js + React 18, Vite, Tailwind CSS, Headless UI, Lucide Icons.
- **Colas de trabajo:** Laravel Queue con `QUEUE_CONNECTION=database`.
- **Gráficos y UI:** Chart.js + react-chartjs-2, react-hot-toast, react-qr-reader.
- **IA opcional:** FastAPI (Python) para generar captions y tags de imágenes (ver carpeta `tools/`).

---

## Requisitos

- PHP **8.2** (XAMPP, Laragon u otro stack similar).
- Composer.
- Node.js + npm (para Vite y React).
- MySQL/MariaDB en ejecución.
- Python 3.10+ (solo si usarás el servicio de IA local).

En Windows se recomienda usar **Laragon** o **XAMPP**. Los ejemplos de comandos están pensados para **PowerShell**.

---

## Configuración de entorno (.env)

Desde la raíz del proyecto (`c:/xampp/htdocs/sistema_inventario`):

```powershell
copy .env.example .env   # en PowerShell
```

Edita el archivo `.env` y ajusta, como mínimo:

- Base de datos
   - `DB_CONNECTION=mysql`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306` (o el puerto que uses: 3307 en algunos casos de Laragon)
   - `DB_DATABASE=sistema_inventario`
   - `DB_USERNAME=root`
   - `DB_PASSWORD=` (vacío por defecto en Laragon)

- Moneda y tasas (USD → BS)
   - `BS_RATE=` tasa provisional en BS por 1 USD (fallback si la API no responde).
   - `BS_API_URL=` URL del API para tasa BS (cuando se use integración externa).

- Colas y servicio de IA (recomendado para producción / features avanzadas)
   - `QUEUE_CONNECTION=database`
   - `IMAGE_AI_URL=http://127.0.0.1:8001/process` (o la URL donde expongas tu servicio de IA).

Genera la key de la aplicación:

```powershell
php artisan key:generate
```

---

## Instalación y arranque en desarrollo

### 1. Dependencias PHP y Node

```powershell
composer install
npm install
```

### 2. Migraciones, seeds y enlaces de almacenamiento

Primero genera las tablas necesarias (incluyendo colas) y ejecuta los seeders base:

```powershell
# (opcional pero recomendado antes de migrar si vas a usar colas)
php artisan queue:table

php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=DemoSeeder
php artisan storage:link
```

> Nota: si ya habías corrido `php artisan migrate` antes de `php artisan queue:table`, vuelve a ejecutar `php artisan migrate` para aplicar la migración de la cola.

### 3. Servidor Laravel, Vite y cola de trabajos

Tienes dos formas de levantar todo en desarrollo:

#### Opción A – Comandos manuales (varias terminales)

En distintas ventanas de terminal, desde la raíz del proyecto:

```powershell
# 1) Servidor HTTP de Laravel
php artisan serve

# 2) Cola de trabajos (jobs de facturación, IA, etc.)
php artisan queue:work --tries=3 --sleep=3

# 3) Frontend (Vite + React)
npm run dev
```

#### Opción B – Script de desarrollo con Composer

El proyecto define un script `dev` en `composer.json` que usa `concurrently` para lanzar todo junto:

```powershell
composer dev
```

Este comando levanta:
- `php artisan serve`
- `php artisan queue:listen`
- `php artisan pail` (visualización de logs en tiempo real)
- `npm run dev`

Mantén esta terminal abierta mientras desarrollas.

### 4. Compilación para producción

Para generar los assets listos para producción:

```powershell
npm run build
```

---

## Servicio de IA local (opcional)

El servicio que genera descripciones y tags de imágenes de productos está en `tools/image_service.py` y se ejecuta con **FastAPI + Uvicorn**.

1. Crear entorno virtual e instalar dependencias (desde la carpeta `tools`):

```powershell
cd tools
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Iniciar el servicio (mantener esta terminal abierta):

```powershell
.venv\Scripts\python.exe -m uvicorn image_service:app --host 127.0.0.1 --port 8001
```

3. Probar el endpoint (ejemplo con `curl` en PowerShell):

```powershell
curl -X POST "http://127.0.0.1:8001/process" -F "file=@C:\ruta\imagen.jpg" -F "lang=es" -F "verbose=true" -F "tags_from_caption=true" -H "accept: application/json"
```

Asegúrate de que en `.env` esté configurado `IMAGE_AI_URL` apuntando a este endpoint.

Notas:

- Si el worker de Laravel no procesa jobs, revisa que `QUEUE_CONNECTION=database` y que `php artisan queue:work` siga corriendo.
- Si el servicio de Python falla al cargar modelos, revisa la terminal de `uvicorn` por dependencias faltantes (por ejemplo, `sentencepiece`) y vuelve a ejecutar `pip install -r requirements.txt`.

---

## Módulos funcionales (resumen)

Este es un resumen operativo de lo que hace el sistema. Los detalles técnicos (modelos, servicios y flujos) están ampliados en [docs/documentacion-sistema-inventario.md](docs/documentacion-sistema-inventario.md).

- **Productos y categorías**
   - CRUD completo de productos, categorías e imágenes asociadas.
   - Precio base en USD y cálculo automático en BS (`price_bs`) usando la tasa configurada.

- **Inventario y movimientos**
   - Entradas y salidas de stock con motivos, notas y referencia.
   - Servicio `InventoryService` que actualiza stock y registra el historial de movimientos.

- **Multi‑bodega y transferencias**
   - Definición de bodegas/sucursales.
   - Transferencias de stock entre bodegas con sus propios movimientos de inventario.

- **Ventas y facturación**
   - Facturas con items, totales en USD/BS e integración con inventario.
   - Estados de factura (pending, paid, cancelled).

- **Clientes, proveedores y usuarios**
   - Gestión de clientes con historial de compras.
   - Gestión de proveedores para compras y reposición de stock.
   - Usuarios internos con roles y permisos (admin, user, etc.).

- **Créditos y apartados**
   - Cuentas de crédito por cliente con movimientos de cargo y abono.
   - Sistema de apartados (layaway) para reservar productos con pagos parciales.

- **RMA (devoluciones y garantías)**
   - Registro de casos de devolución/garantía asociados a facturas y productos.
   - Control de estado y posibles ajustes de inventario.

- **Tienda pública, carrito y checkout**
   - Home y tienda pública con productos, precios en USD/BS y filtros.
   - Carrito autenticado con endpoints de API para React.
   - Flujo de checkout y página de confirmación.

- **Dashboard y métricas**
   - Ventas del día y del mes.
   - Conteo de facturas por estado, productos con bajo stock, totales de entidades.
   - Filtro por bodega para ver estadísticas por sucursal.

---

## Scripts útiles

Además de los comandos anteriores, el proyecto define en `composer.json` y `package.json` los siguientes scripts de ayuda:

- `composer setup` – instalación inicial (dependencias, `.env`, key, migraciones y build de frontend).
- `composer dev` – entorno de desarrollo completo (servidor Laravel, cola, logs y Vite).
- `composer test` – ejecuta el suite de tests de Laravel.
- `npm run dev` – servidor de desarrollo de Vite + React.
- `npm run build` – build de frontend para producción.

---

## Próximos pasos

1. Seguir las secciones de instalación de este README para levantar el entorno local.
2. Revisar la documentación ampliada en [docs/documentacion-sistema-inventario.md](docs/documentacion-sistema-inventario.md) para entender el dominio y la arquitectura interna.
3. Personalizar textos, logos y estilos en los componentes React según la marca del proyecto.
