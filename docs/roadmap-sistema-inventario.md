# Roadmap y Checklist – Sistema de Inventario y Facturación

Este documento define un **roadmap funcional** para convertir el sistema en una solución de inventario + facturación muy completa, con foco en estabilidad, estadísticas, reportes, configurabilidad y valor añadido en la tienda.

Las tareas están organizadas por módulos. Usa las casillas como checklist.

---

## 1. Núcleo de negocio (inventario + facturación)

### 1.1. Inventario y movimientos

- [x] Validar y documentar reglas de stock mínimo por producto (alertas).
- [x] Soportar stock negativo configurable (permitir o bloquear según ajuste de configuración global).
- [x] Agregar tipos de movimiento adicionales (ajuste, pérdida, merma, traslado interno detallado).
- [x] Registrar usuario responsable y motivo obligatorio en cada movimiento.
- [x] Permitir adjuntar archivos/comprobantes en movimientos (facturas de proveedor, notas).
- [x] Historial de costo promedio por producto (costo ponderado) para reportes de margen.

### 1.2. Facturación

- [x] Configurar numeración de facturas (prefijo, sufijo, longitud, reinicio por año/sucursal).
- [x] Manejar impuestos configurables (IVA/IGTF u otros) por producto y por factura.
- [x] Soportar diferentes tipos de comprobantes (factura, nota de entrega, proforma/presupuesto).
- [x] Permitir múltiples formas de pago en una factura (mixto: efectivo, tarjeta, transferencia, Zelle, etc.).
- [x] Registrar referencia de pago (número de operación, banco, observaciones).
- [x] Agregar notas internas y notas visibles al cliente en la factura.
- [x] Soportar anulaciones y notas de crédito/debito ligadas a facturas existentes.
- [x] Integrar flujo de facturación con créditos/apartados (venta a crédito, abonos automáticos).

### 1.3. Multi‑bodega / multi‑sucursal

- [x] Permitir configurar si la venta descuenta de una bodega por defecto o seleccionable en cada factura.
- [x] Soportar series de facturación por sucursal.
- [ ] Reportes filtrables por sucursal/bodega en dashboard y sección de reportes.

---

## 2. Módulo de configuración global

Crear un **módulo de configuración** accesible desde el panel admin para que el dueño del sistema pueda modificar datos clave sin tocar código.

- [x] Modelo/tabla `settings` (clave/valor o esquema tipado) para configuraciones globales.
- [x] Pantalla de "Configuración general" en `/admin/settings` con secciones:
- [x] Datos de empresa: nombre comercial, razón social, RIF/NIT, email, teléfonos, WhatsApp.
- [x] Ubicación: dirección física, ciudad, estado/país, URL de Google Maps (para el mapa del inicio).
- [x] Branding: logo principal, logo alternativo, favicon, colores primarios/secundarios.
- [x] Facturación: prefijo de factura, longitud de numeración, impuestos por defecto, formato de fecha.
- [x] Moneda: moneda base (USD), monedas adicionales (BS, otras), fuente de tasa (API/valor fijo).
- [x] Tienda pública: textos del home, banners, destacados por defecto, sección de contacto.
- [x] Seguridad: opciones de contraseña mínima, bloqueo por intentos fallidos, 2FA (futuro).
- [x] QR: url base para generar QR (por ejemplo, enlaces a facturas o productos).
- [x] Permitir que el frontend (home/tienda/footer) consuma estos settings para mostrar logo, nombre, teléfonos, mapa y redes sociales.

---

## 3. Reportes y estadísticas

### 3.1. Reportes de ventas

- [ ] Reporte de ventas por rango de fechas (día, semana, mes, personalizado).
- [ ] Filtros por sucursal/bodega, usuario vendedor, tipo de comprobante y forma de pago.
- [ ] Métricas: total vendido (USD y BS), cantidad de facturas, ticket promedio.
- [ ] Ranking de productos más vendidos.
- [ ] Ventas por categoría.
- [ ] Exportar a PDF y Excel.

### 3.2. Reportes de inventario

- [ ] Reporte de valorización de stock actual (cantidad * costo promedio) por producto y por bodega.
- [ ] Kardex de cada producto (entradas y salidas con saldo).
- [ ] Reporte de productos con bajo stock (por debajo de mínimo) con opción de exportar.
- [ ] Reporte de rotación de productos (días de inventario, productos de baja rotación).

### 3.3. Reportes financieros y de crédito

- [ ] Reporte de cuentas por pagar a proveedores (si se usa AccountsPayable).
- [ ] Reporte de créditos por cliente (saldo actual, límite, morosidad).
- [ ] Historial de movimientos de crédito y pagos.
- [ ] Resumen de apartados activos y vencidos.

### 3.4. Dashboard avanzado

- [ ] Gráficos de ventas por día/mes (Chart.js) con comparación contra período anterior.
- [ ] Gráfico de top productos y top clientes.
- [ ] Indicadores clave (KPI): margen estimado, rotación de stock, % ventas a crédito vs contado.
- [ ] Filtro global por sucursal/bodega en dashboard.

---

## 4. Tienda pública y experiencia de usuario

### 4.1. Catálogo y navegación

- [x] Filtros avanzados en `/shop` (precio, categoría, stock disponible, etiquetas).
- [x] Ordenar por más vendidos, más recientes, precio asc/desc.
- [x] Búsqueda por nombre, SKU, código de barras.
- [ ] Páginas de detalle de producto con galería de imágenes, descripción extendida, productos relacionados.

### 4.2. Carrito y checkout

- [x] Carrito persistente (guardar en base de datos por usuario, no solo en sesión).
- [x] Cálculo de costos adicionales: delivery/envío, recargos o descuentos por método de pago.
- [x] Cupón de descuento (porcentaje o valor fijo) con validación de vigencia y uso.
- [x] Resumen claro en BS y USD con desglose de impuestos.
- [ ] Página de confirmación de pedido con QR para ver factura o hacer seguimiento.

### 4.3. Valor añadido en la tienda

- [ ] Sección de productos recomendados / upselling en carrito y checkout.
- [ ] Productos destacados configurables desde admin (banners o carrusel).
- [ ] Sección de testimonios o reseñas básicas (aunque no completamente abierta).
- [ ] Suscripción a newsletter (captura de email/WhatsApp para marketing futuro).

---

## 5. Multilenguaje y multimoneda

### 5.1. Multilenguaje (es/en como mínimo)

- [ ] Definir sistema de traducciones para textos del frontend (Inertia + React): archivos de traducción por idioma.
- [ ] Permitir seleccionar idioma desde el frontend (selector en navbar o footer).
- [ ] Guardar preferencia de idioma en usuario/sesión.
- [ ] Traducir correos, PDFs y textos del backend usando archivos de idioma Laravel.

### 5.2. Multimoneda

- [ ] Generalizar `CurrencyService` para soportar varias monedas configurables.
- [ ] Permitir cambiar moneda mostrada en la tienda (ej: USD, BS, otra) con conversión en tiempo real.
- [ ] Almacenar precios base en una sola moneda (USD) y registrar la tasa usada por factura.
- [ ] Historial de tasas usadas para cada transacción (evitar reprocesos con tasa actual).
- [ ] Soportar diferentes fuentes de tasa (dolarapi, tasa manual, otras APIs) configurables en settings.

---

## 6. QR y utilidades

- [ ] Módulo para generar códigos QR de:
- [ ] Facturas (link a detalle público o comprobante PDF).
- [ ] Productos (para escanear en tienda/almacén).
- [ ] URLs de contacto/WhatsApp de la empresa.
- [ ] Pantalla admin para ver/descargar QR en lote.
- [ ] Integrar escáner QR en el panel para buscar producto/factura rápidamente.

---

## 7. Notificaciones y comunicación

- [ ] Notificaciones por correo al crear factura/venta importante.
- [ ] Notificaciones internas al admin por bajo stock o vencimiento de apartados.
- [ ] Integración básica con WhatsApp (deep links) desde vista de cliente/factura.
- [ ] Plantillas de correo configurables (logo, colores, textos).

---

## 8. Seguridad, auditoría y permisos

- [ ] Definir roles adicionales (ej: cajero, almacenista, supervisor) además de `admin` y `user`.
- [ ] Matriz de permisos detallada usando spatie/laravel-permission (crear, ver, editar, borrar por módulo).
- [ ] Auditoría básica de acciones críticas (quién creó/editó/eliminó facturas, movimientos, RMA, etc.).
- [ ] Registro de logins/intentros fallidos.
- [ ] Opcional: 2FA para administradores.

---

## 9. Calidad de código, rendimiento y despliegue

- [ ] Tests automatizados para flujos críticos: ventas, movimientos de inventario, créditos, RMA.
- [ ] Seeders de demo bien documentados para pruebas y demos comerciales.
- [ ] Scripts de deploy para producción (migraciones, build, cache:clear, config:cache, queue:restart, etc.).
- [ ] Documentar recomendaciones de hosting (PHP version, base de datos, workers, servicio IA, backup).
- [ ] Mejorar manejo de errores y mensajes al usuario (errores amigables en frontend).

---

## 10. Prioridades sugeridas (MVP → avanzado)

**Fase 1 (Estabilizar núcleo):**
- [ ] Reglas de stock, movimientos, numeración de facturas, impuestos básicos.
- [ ] Módulo de configuración general (datos de empresa, branding, moneda).
- [ ] Reportes básicos de ventas e inventario.

**Fase 2 (Valor de negocio):**
- [ ] Reportes avanzados, dashboard con KPIs, multibodega completo.
- [ ] Créditos, apartados y RMA bien integrados con facturación.
- [ ] Mejoras en tienda, carrito y checkout (cupones, recomendaciones, métodos de pago).

**Fase 3 (Diferenciadores):**
- [ ] Multilenguaje y multimoneda avanzada.
- [ ] IA para imágenes, recomendaciones y análisis de ventas.
- [ ] Notificaciones, auditoría y herramientas de marketing.
