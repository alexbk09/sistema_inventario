# Sistema Inventario (Laravel + Inertia React + Tailwind)

## Requisitos
- PHP 8.2 (XAMPP/Laragon)
- Composer
- Node.js + npm
- MySQL/MariaDB (Laragon) activo

## Configuración
1. Variables en `.env`:
   - `DB_CONNECTION=mysql`
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=3306` (o 3307 según Laragon)
   - `DB_DATABASE=sistema_inventario`
   - `DB_USERNAME=root`
   - `DB_PASSWORD=` (vacío por defecto en Laragon)
   - `BS_RATE=` tasa provisional para convertir USD→BS
   - `BS_API_URL=` URL del API para tasa BS (futuro)

2. Migraciones y seeders:
```bash
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=DemoSeeder
```

### Comandos para levantar todo el sistema (Windows PowerShell)

Sigue estos pasos desde la raíz del proyecto (`c:/xampp/htdocs/sistema_inventario`).

- Instalar dependencias PHP y Node:
```powershell
composer install
copy .env.example .env            # PowerShell (o use 'cp' en WSL)
php artisan key:generate
npm install
```

- Configurar base de datos y migrar/seedear:
```powershell
php artisan migrate --force
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=DemoSeeder
php artisan storage:link
```

- Iniciar frontend en modo desarrollo (mantenerlo abierto):
```powershell
npm run dev
# o para producción
npm run build
```

- Variables importantes en `.env` para la IA local (añádelas si no existen):
```text
IMAGE_AI_URL=http://127.0.0.1:8001/process
QUEUE_CONNECTION=database
```

- Instalar y ejecutar la cola (worker) en segundo terminal:
```powershell
# ejecutar migraciones de la cola si no lo has hecho
php artisan queue:table
php artisan migrate
# ejecutar worker (desarrollo)
php artisan queue:work --tries=3 --sleep=3
```

### Servicio IA local (Python + FastAPI)

El servicio que genera `caption` y `tags` corre en `tools/image_service.py`.

1. Crear virtualenv e instalar dependencias (desde `tools`):
```powershell
cd tools
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Iniciar el servicio (mantenerlo abierto):
```powershell
.venv\Scripts\python.exe -m uvicorn image_service:app --host 127.0.0.1 --port 8001
```

3. Probar el endpoint con `curl` (ejemplo):
```powershell
curl -X POST "http://127.0.0.1:8001/process" -F "file=@C:\ruta\imagen.jpg" -F "lang=es" -F "verbose=true" -F "tags_from_caption=true" -H "accept: application/json"
```

Notas:
- Si el frontend o el worker no procesan jobs, confirma que `QUEUE_CONNECTION=database` y que `php artisan queue:work` está en ejecución.
- Si el servicio Python falla al cargar modelos, revisa la salida de `uvicorn` por dependencias faltantes (p.ej. `sentencepiece`). Instala con `pip install -r requirements.txt`.
- Para producción considera ejecutar el worker y `uvicorn` bajo un supervisor (systemd, Supervisor, PM2, etc.)

3. Compilar frontend:
```bash
npm install
npm run dev
# o
npm run build
```

## Rutas principales
- Inicio: `/` (Home con carrusel, destacados, contacto)
- Tienda: `/shop` (listado de productos y carrito)
- Dashboard Admin: `/dashboard` (requiere rol `admin`)
- Escáner QR: `/admin/qr` (requiere rol `admin`)

## Roles/Permisos
- `admin`: gestión completa (productos, inventario, facturas, proveedores, clientes).
- `user`: puede ver productos y facturas.

## Moneda
- Precios base en USD (`price_usd`).
- BS se calcula vía `price_bs` usando `config/currency.php` y `BS_RATE`.
- Servicio: `App\Services\CurrencyService` (listo para futura API).

## Próximos módulos
- Carrito, facturación y pagos.
- Proveedores y cuentas por pagar.
- Gráficos con Chart.js (ventas, top productos).
- Escáner QR para entradas/salidas.
- Alertas con `react-hot-toast`.
<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
