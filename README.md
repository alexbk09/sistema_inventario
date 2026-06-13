# Sistema de Inventario

Plataforma web integral para comercios que necesitan controlar inventario, ventas, clientes, facturacion, creditos, apartados, garantias, multiples bodegas y operacion administrativa desde un solo sistema.

El proyecto combina una tienda publica con checkout, un backoffice con reportes y exportaciones, y una capa de configuracion avanzada para branding, moneda, seguridad, pagos y parametros operativos. Esta documentacion esta pensada para tres usos:

- presentar el sistema en GitHub de forma profesional
- facilitar instalacion y puesta en marcha
- dejar explicito el alcance funcional y tecnico del producto si se desea comercializar

Para documentacion tecnica complementaria revisa [docs/documentacion-sistema-inventario.md](docs/documentacion-sistema-inventario.md), [docs/plan-tecnico-multimoneda-admin.md](docs/plan-tecnico-multimoneda-admin.md) y [docs/transicion-legacy-multimoneda.md](docs/transicion-legacy-multimoneda.md).

## 1. Resumen ejecutivo

Este sistema permite operar un negocio con catalogo, stock, ventas, clientes y reportes en una sola aplicacion. Incluye:

- panel administrativo con control por roles y permisos
- tienda publica con carrito y checkout autenticado
- facturacion manual y ventas desde tienda
- inventario con entradas, salidas, kardex, valorizacion y rotacion
- multi bodega con transferencias internas
- CRM basico de clientes
- creditos y apartados
- RMA para devoluciones y garantias
- notificaciones administrativas y auditoria
- exportaciones CSV, Excel y PDF
- configuracion multimoneda con visibilidad por admin y snapshot historico en documentos
- integracion opcional con PayPal, Stripe e IA local para imagenes

## 2. Propuesta de valor

El sistema esta orientado a negocios que necesitan trazabilidad operativa y capacidad de crecimiento sin depender de hojas de calculo o herramientas separadas.

### Beneficios de negocio

- centraliza ventas, inventario, clientes y postventa
- reduce errores de stock y de facturacion manual
- permite operar con multiples bodegas y distintos perfiles internos
- ofrece reportes exportables para gerencia y administracion
- soporta multimoneda con criterio historico para no distorsionar documentos viejos
- deja base tecnica suficiente para personalizacion por cliente final

### Casos de uso ideales

- tiendas retail y distribuidores pequenos o medianos
- negocios con ventas fisicas y catalogo online
- operaciones con pago contado, credito y apartados
- empresas que necesitan exportar reportes administrativos y comerciales

## 3. Arquitectura y stack tecnologico

### Backend

- PHP 8.2
- Laravel 12
- Eloquent ORM
- Laravel Queue con conexion database
- Spatie Permission para roles y permisos
- Maatwebsite Excel para exportaciones XLSX
- DomPDF para exportaciones PDF
- Simple QR Code para codigos QR

### Frontend

- Inertia.js 2
- React 18
- Vite 7
- Tailwind CSS 3
- Headless UI
- Chart.js y react-chartjs-2
- react-hot-toast
- lucide-react

### Integraciones opcionales

- PayPal
- Stripe
- FastAPI + Python para procesamiento local de imagenes

### Base de datos y despliegue

- MySQL 8 en Docker
- compatible con MySQL o MariaDB en entornos locales tipo XAMPP o Laragon
- nginx + php-fpm en stack Docker

## 4. Idiomas y capacidades transversales

El sistema ya cuenta con base de internacionalizacion y dispone de archivos de idioma para:

- espanol
- ingles
- frances
- italiano
- portugues

Ademas incluye estas capacidades transversales:

- autenticacion y verificacion de correo
- control de acceso por roles y permisos
- auditoria de acciones internas
- notificaciones administrativas persistentes
- exportaciones administrativas
- configuracion centralizada desde backoffice
- compatibilidad con multimoneda administrativa

## 5. Alcance funcional completo del sistema

Esta seccion resume lo que el sistema hace actualmente a nivel funcional y operativo.

### 5.1. Sitio publico y experiencia de compra

- Home con productos destacados
- Tienda publica con listado de productos
- Vista individual de producto
- Carrito autenticado
- Checkout autenticado
- Confirmacion de compra
- Seguimiento publico de pedido o factura
- Newsletter
- Cambio de idioma

### 5.2. Autenticacion, usuarios y roles

- registro de usuarios
- inicio y cierre de sesion
- recuperacion de contrasena
- verificacion de correo
- perfil de usuario
- roles internos como admin, supervisor, cashier y warehouse
- rol cliente con acceso a panel propio
- permisos granulares por modulo

### 5.3. Dashboard administrativo

El dashboard central del backoffice muestra indicadores operativos y comerciales, incluyendo:

- ventas del dia y del mes
- ticket promedio
- margen estimado
- ventas contado versus credito
- stock total y productos con bajo inventario
- resumen por estados de factura
- alertas de apartados vencidos
- resumen de creditos
- filtros por bodega cuando aplica

### 5.4. Configuracion general del sistema

Desde el modulo de ajustes se pueden administrar:

- datos generales de la empresa
- datos de ubicacion
- branding, logo y colores
- parametros de facturacion
- configuracion de monedas
- textos de tienda publica
- parametros de inventario
- reglas de bodega por defecto
- reglas basicas de seguridad
- enlaces QR
- textos de correo
- metodos de pago y cuentas bancarias

### 5.5. Configuracion multimoneda

El sistema ya soporta un modelo administrativo multimoneda con estas caracteristicas:

- moneda base configurable
- moneda de visualizacion por defecto
- catalogo dinamico de monedas soportadas
- monedas activas o inactivas
- visibilidad separada para tienda y admin
- monedas habilitadas o no para checkout
- tasa manual o automatica por moneda
- sincronizacion de tasas desde configuracion
- snapshots historicos para documentos transaccionales
- reportes y exportaciones alineados con monedas visibles en admin

Esto permite que la operacion administrativa use varias monedas visibles sin alterar documentos historicos cuando cambian las tasas.

### 5.6. Productos y categorias

- CRUD de productos
- CRUD de categorias
- imagen principal y galeria de imagenes
- SKU y codigo de barras
- productos destacados
- importacion masiva de productos
- relacion producto-categoria
- soporte para precio base y visualizacion multimoneda

### 5.7. Inventario

- historial de movimientos por producto
- entradas de inventario
- salidas de inventario
- resumen de entradas y salidas
- costo unitario y valorizacion
- notas y referencias por movimiento
- integracion con proveedores y bodegas
- kardex administrativo
- reporte global de inventario
- reporte de inventario por bodega
- reporte de rotacion
- exportaciones CSV, Excel y PDF

### 5.8. Bodegas y transferencias

- gestion de bodegas o sucursales
- transferencia de stock entre bodegas
- detalle y seguimiento de transferencias
- soporte para estadisticas por bodega

### 5.9. Proveedores

- CRUD de proveedores
- asociacion de movimientos de inventario a proveedor
- base lista para procesos de abastecimiento y conciliacion operativa

### 5.10. Clientes y CRM basico

- listado de clientes
- creacion manual de clientes
- detalle de cliente
- historial de compras
- gasto acumulado del cliente
- informacion de contacto e identificacion
- vinculacion con creditos, apartados y facturas

### 5.11. Panel del cliente

Cada cliente autenticado puede acceder a su propia area en /mi-panel con:

- resumen de compras
- historial de compras
- productos mas comprados
- actualizacion de perfil

### 5.12. Facturacion y ventas administrativas

- listado de facturas
- creacion manual de facturas
- actualizacion de facturas
- items de factura
- estados de factura
- contacto asociado a factura
- integracion con inventario
- soporte para snapshots monetarios historicos
- QR y seguimiento publico de pedido/factura

### 5.13. Tienda, checkout y pagos

El flujo de compra soporta:

- carrito autenticado
- checkout con validaciones de stock
- descuentos por cupon cuando corresponde
- pago manual con referencia
- integracion con PayPal
- integracion con Stripe
- registro de transacciones de pasarela
- confirmacion final de compra

### 5.14. Creditos

- cuentas de credito por cliente
- detalle de cuenta
- movimientos de credito
- cargos y abonos
- saldo y limite
- reportes de credito
- reporte de movimientos de credito

### 5.15. Apartados

- listado de apartados
- creacion de apartados
- detalle de apartado
- actualizacion de apartado
- items y totales
- pagos acumulados
- reporte administrativo de apartados

### 5.16. RMA, devoluciones y garantias

- listado de casos RMA
- creacion de casos
- detalle de RMA
- actualizacion de estado o notas
- items relacionados
- soporte de criterio monetario documental en vistas administrativas

### 5.17. Reportes gerenciales y operativos

El sistema incluye superficies de reporteria para:

- ventas
- top de productos vendidos
- ventas por categoria
- inventario global
- inventario por bodega
- kardex
- rotacion de inventario
- creditos
- movimientos de credito
- apartados

### 5.18. Exportaciones

Se incluyen exportaciones administrativas para diferentes modulos:

- CSV
- Excel
- PDF

Actualmente las exportaciones mas completas y consolidadas estan en reportes de ventas e inventario, alineadas con el criterio monetario administrativo vigente.

### 5.19. Notificaciones administrativas

- centro de notificaciones en backoffice
- marcado individual y masivo como leido
- eliminacion de notificaciones
- preferencias por canal
- soporte para silencios por tipo de alerta

### 5.20. Auditoria

- registro de acciones administrativas
- trazabilidad para cambios relevantes
- consultas desde modulo de auditoria

### 5.21. QR y utilidades publicas

- QR para facturas
- QR para productos
- QR para canal de WhatsApp

### 5.22. Procesamiento opcional de imagenes con IA

El repositorio incluye una integracion opcional basada en Python para:

- generar captions de imagenes
- generar tags simples
- procesar imagenes en background con colas

En Docker esta deshabilitada por defecto para simplificar el arranque del sistema.

### 5.23. Base de dominio adicional

El codigo tambien incluye entidades como AccountsPayable para evolucion futura del producto. A la fecha, la superficie administrativa visible y consolidada se centra en los modulos listados arriba; por tanto, si se va a comercializar, conviene presentar cuentas por pagar como base preparada o fase posterior, no como flujo totalmente cerrado del backoffice actual.

## 6. Estructura del proyecto

Las carpetas mas relevantes del repositorio son:

- [app](app): modelos, controladores, servicios, jobs y logica de dominio
- [bootstrap](bootstrap): arranque de Laravel
- [config](config): configuraciones del framework y del negocio
- [database](database): migraciones, factories y seeders
- [docs](docs): documentacion funcional y tecnica
- [docker](docker): configuracion de nginx, php-fpm y supervisor
- [public](public): punto de entrada web y assets publicados
- [resources](resources): vistas, componentes React, traducciones y estilos
- [routes](routes): rutas web, auth y consola
- [storage](storage): logs, cache, archivos y framework storage
- [tests](tests): pruebas unitarias y feature
- [tools](tools): scripts auxiliares y servicio IA en Python

## 7. Requisitos para instalacion

### Opcion local

- PHP 8.2
- Composer
- Node.js y npm
- MySQL o MariaDB
- extensiones PHP requeridas por Laravel

### Opcion Docker

- Docker Desktop
- Docker Compose

### Opcion IA local

- Python 3.8 o superior
- pip
- entorno virtual recomendado

## 8. Instalacion local paso a paso

Los ejemplos siguientes estan pensados para Windows y PowerShell.

### 8.1. Clonar e instalar dependencias

```powershell
git clone <url-del-repositorio>
cd C:\xampp\htdocs\sistema_inventario
composer install
npm install
```

### 8.2. Crear archivo de entorno

```powershell
Copy-Item .env.example .env
php artisan key:generate
```

### 8.3. Configurar base de datos

La plantilla .env.example viene simple para desarrollo. Para una instalacion real local suele convenir MySQL o MariaDB. Ajusta al menos:

```env
APP_NAME="Sistema de Inventario"
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sistema_inventario
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database

DEMO_ADMIN_NAME="Administrador"
DEMO_ADMIN_EMAIL="admin@example.com"
DEMO_ADMIN_PASSWORD="admin12345"
DEMO_CLIENT_NAME="Cliente Demo"
DEMO_CLIENT_EMAIL="cliente@example.com"
DEMO_CLIENT_PASSWORD="cliente12345"
```

### 8.4. Migraciones, seeders y storage

```powershell
php artisan queue:table
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=DemoSeeder
php artisan storage:link
```

Si necesitas catalogos iniciales adicionales puedes ejecutar tambien los seeders disponibles en [database/seeders](database/seeders).

### 8.5. Levantar entorno de desarrollo

Opcion con varias terminales:

```powershell
php artisan serve
php artisan queue:work --tries=3 --sleep=3
npm run dev
```

Opcion unificada con Composer:

```powershell
composer dev
```

### 8.6. Build de frontend para produccion

```powershell
npm run build
```

## 9. Instalacion con Docker

El proyecto incluye un stack Docker listo con:

- app Laravel + php-fpm + Vite + Supervisor
- MySQL 8
- nginx

### 9.1. Levantar contenedores

```powershell
docker-compose up --build
```

O usando el helper del repositorio:

```powershell
.\tools\docker-up.ps1
```

### 9.2. Accesos y puertos principales

- aplicacion HTTP: http://localhost:8080
- Vite: http://localhost:5173
- MySQL del contenedor: localhost:3307

### 9.3. Notas de Docker

- el contenedor app usa APP_AUTO_SEED=false por defecto
- las migraciones se aplican durante el arranque del contenedor
- la IA de imagenes esta deshabilitada por defecto en docker-compose.yml

## 10. Acceso inicial y configuracion como administrador

### 10.1. Credenciales demo por defecto

Si ejecutaste DemoSeeder con los valores por defecto de .env:

- admin: admin@example.com
- clave admin: admin12345
- cliente demo: cliente@example.com
- clave cliente demo: cliente12345

Estas credenciales se controlan desde [config/demo.php](config/demo.php) y las variables DEMO_ADMIN_* y DEMO_CLIENT_* del entorno.

### 10.2. Primer inicio recomendado del admin

Despues de entrar al sistema como administrador, revisa esta lista:

1. Configurar datos de empresa, correo, telefono y marca.
2. Ajustar prefijo y longitud de facturas.
3. Revisar impuestos e IGTF si aplica.
4. Configurar monedas activas, visibles y habilitadas para checkout.
5. Crear o validar bodegas.
6. Configurar reglas de inventario como stock minimo y stock negativo.
7. Configurar cuentas bancarias y metodos de pago.
8. Revisar URL base para QR y seguimiento de documentos.
9. Crear usuarios internos y asignar roles o permisos.
10. Cargar catalogo inicial de productos y categorias.

### 10.3. Que puede configurar el admin desde ajustes

El modulo de ajustes centraliza:

- informacion fiscal y comercial de la empresa
- ubicacion y contacto
- branding del sistema
- facturacion
- tienda publica
- multimoneda
- inventario
- seguridad basica
- QR
- correos transaccionales
- metodos de pago manuales, PayPal y Stripe

## 11. Operacion diaria sugerida

Un flujo comun de uso administrativo seria:

1. Configurar monedas, bodega por defecto, bancos y branding.
2. Crear categorias, productos, proveedores y bodegas.
3. Registrar inventario inicial o entradas por producto.
4. Operar ventas desde tienda o facturacion manual.
5. Controlar salidas de stock y transferencias.
6. Gestionar clientes, creditos, apartados y RMA.
7. Consultar dashboard y reportes.
8. Exportar informacion administrativa cuando sea necesario.

## 12. Scripts y comandos utiles

### Composer

- composer setup
- composer dev
- composer test

### Node

- npm run dev
- npm run build

### Laravel

- php artisan migrate
- php artisan db:seed --class=DemoSeeder
- php artisan queue:work
- php artisan storage:link

### Sincronizacion de tasas de moneda (Cron Job)

El sistema incluye sincronizacion automatica de tasas de cambio desde APIs externas. Para que funcione en produccion, debes configurar el cron de Laravel:

**1. Configurar el cron en Linux/Mac:**

```bash
# Abrir crontab
sudo crontab -e

# Agregar esta linea para ejecutar el scheduler cada minuto
* * * * * cd /ruta/a/tu/proyecto && php artisan schedule:run >> /dev/null 2>&1
```

**2. En Windows (XAMPP/Laragon local):**

Las tasas se actualizan automaticamente al visitar el panel de administracion (via middleware). Para forzar sincronizacion manual:

```powershell
# Ver estado actual de tasas
php artisan currency:status

# Forzar sincronizacion
php artisan currency:sync-configured-rates
```

**3. Comandos disponibles:**

```powershell
# Verificar estado de tasas
php artisan currency:status

# Sincronizar tasas configuradas
php artisan currency:sync-configured-rates

# Rellenar snapshots historicos en documentos antiguos
php artisan currency:backfill-document-snapshots
```

**4. Configuracion desde el Admin:**

- Ve a **Configuracion → Operaciones → Monedas**
- Activa **"Actualizar tasas automaticamente"**
- Ajusta el intervalo en minutos (por defecto: 60 minutos)
- Configura cada moneda en modo "Auto" (API) o "Manual" (tasa fija)

### Smoke y validacion

- powershell -ExecutionPolicy Bypass -File .\tools\run-backoffice-smoke.ps1
- powershell -ExecutionPolicy Bypass -File .\tools\run-backoffice-smoke.ps1 -Cleanup

## 13. Pruebas y calidad

El proyecto ya incluye pruebas unitarias y feature en [tests](tests), incluyendo validaciones sobre:

- autenticacion y perfil
- checkout
- dashboard del cliente
- multimoneda administrativa
- reportes de inventario
- reporte de ventas documental

Para ejecutar la suite principal:

```powershell
php artisan test
```

O mediante Composer:

```powershell
composer test
```

## 14. Servicio opcional de IA para imagenes

Si deseas activar el procesamiento local de imagenes:

1. Configura en .env:

```env
QUEUE_CONNECTION=database
IMAGE_AI_URL=http://127.0.0.1:8001/process
```

2. Instala dependencias Python:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r tools\requirements.txt
```

3. Levanta el servicio:

```powershell
uvicorn tools.image_service:app --host 127.0.0.1 --port 8001 --workers 1
```

4. Levanta el worker de Laravel:

```powershell
php artisan queue:work
```

Mas detalle en [tools/README_IMAGE_AI.md](tools/README_IMAGE_AI.md).

## 15. Consideraciones para comercializacion

Si el objetivo es vender o licenciar este sistema, el alcance que ya puede presentarse de forma explicita es:

- plataforma web full stack para operacion comercial
- tienda publica y backoffice en una sola base
- inventario, ventas, clientes y postventa integrados
- soporte para exportaciones administrativas
- multi bodega
- control de usuarios, roles y auditoria
- configuracion operativa y visual desde admin
- base multimoneda con criterio historico documental
- integraciones opcionales de pago e IA

### Lo que conviene aclarar comercialmente

- el sistema es altamente personalizable por rubro y marca
- algunas entidades del dominio ya existen como base de crecimiento aunque su flujo visible pueda requerir cierre adicional segun el cliente
- la capa multimoneda principal ya esta implementada en ventas, inventario, dashboard y reportes clave, con deuda residual de limpieza legacy en superficies menores

## 16. Documentacion complementaria

- [docs/documentacion-sistema-inventario.md](docs/documentacion-sistema-inventario.md): documentacion tecnica ampliada
- [docs/plan-tecnico-multimoneda-admin.md](docs/plan-tecnico-multimoneda-admin.md): seguimiento del trabajo multimoneda en admin
- [docs/transicion-legacy-multimoneda.md](docs/transicion-legacy-multimoneda.md): estrategia de convivencia y migracion monetaria
- [docs/validacion-funcional-backoffice.md](docs/validacion-funcional-backoffice.md): validacion funcional del backoffice

## 17. Estado actual del producto

El sistema ya es una base robusta y funcional para operacion real. El core de negocio principal esta cubierto: catalogo, inventario, ventas, clientes, dashboard, reportes, exportaciones, creditos, apartados, RMA y configuracion administrativa.

Como en cualquier producto vivo, todavia existen frentes de evolucion y afinacion, especialmente en cierre total de algunas superficies financieras complementarias y en limpieza final de compatibilidades legacy del modelo monetario. Eso no invalida el valor actual del sistema; simplemente conviene presentarlo con precision tecnica y comercial.
