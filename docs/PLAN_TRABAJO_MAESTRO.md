# 🚀 PLAN DE TRABAJO MAESTRO — Sistema Inventario Premium
> Objetivo: Transformar el sistema en un producto SaaS de clase enterprise, moderno, veloz y vendible.
> Stack: Laravel 10+ · PHP 8.2 · Inertia.js · React 18 · Tailwind CSS · MySQL

---

## 📋 ESTADO INICIAL DEL SISTEMA

El sistema ya cuenta con:
- ✅ 15+ módulos funcionales (productos, inventario, ventas, CRM, RMA, créditos, apartados, bodegas, reportes)
- ✅ Multi-moneda USD/BS con API en tiempo real
- ✅ Roles y permisos (admin, supervisor, cashier, warehouse, cliente)
- ✅ Pasarelas de pago Stripe + PayPal
- ✅ i18n (ES/EN/FR)
- ✅ Notificaciones internas con severidad
- ✅ Dashboard con charts (Chart.js)
- ✅ QR Scanner integrado
- ✅ Servicio IA local para imágenes (FastAPI)
- ✅ Tienda pública + carrito + checkout

---

## 🎯 VISIÓN DEL PRODUCTO FINAL

Un sistema de gestión empresarial (ERP-lite) moderno, con UX de nivel SaaS 2025, que compita con:
- **Shopify** (tienda pública, UX)
- **QuickBooks** (contabilidad, reportes)
- **Odoo** (módulos integrados)
- **Notion/Linear** (UX limpia y rápida)

**Propuesta de valor única**: Sistema multimoneda nativo para mercados latinoamericanos con IA integrada, cero configuración y UI premium lista para producción.

---

## 🗺️ FASES Y MÓDULOS DE TRABAJO

### FASE 1 — FUNDAMENTOS UX/UI (SEMANA 1-2)
> Impacto: Alto. Todo lo demás se construye sobre esta base.

#### 1.1 Design System & Layout Global
- [x] **Sidebar Navigation Admin** — Sidebar vertical colapsable con iconos Lucide, grupos de menú, mini-mode, dark mode toggle y language switcher compacto.
- [x] **Design Tokens CSS** — Variables CSS con oklch color space, dark mode consistente, tokens de sidebar (`--sidebar`, `--sidebar-border`, etc.) en `app.css`.
- [x] **Componentes base modernos** — StatsCard con sparklines, badges de estado con dot, tablas con render functions, hover states.
- [x] **Page Header Component** — `PageHeader.jsx` reutilizable con breadcrumbs, título, descripción, icono y slot de acciones.
- [x] **Empty States** — `EmptyState.jsx` con presets (products/invoices/customers/providers) usado en todas las tablas admin.
- [x] **Loading Skeletons** — `TableSkeleton.jsx` + `CardSkeleton` + `StatsSkeleton` — skeleton screens en tablas y cards.

#### 1.2 Navegación Pública (Guest Layout)
- [x] **Nav mejorado** — Sticky con blur backdrop (`backdrop-blur-md`) al scroll, mega-menu de categorías (dropdown), búsqueda expandible con foco automático y redirección a tienda. `nav_categories` compartidas vía `HandleInertiaRequests`.
- [x] **Mobile first** — Drawer animado `max-h` con grid de categorías 2 columnas, búsqueda inline, cierre automático al navegar.
- [x] **Breadcrumbs dinámicos** — `Breadcrumb.jsx` en Shop/Index y Product/Show. Ruta dinámica: Inicio → Tienda → Categoría → Producto.

---

### FASE 2 — DASHBOARD ADMIN (SEMANA 2-3)
> El dashboard es la primera impresión. Debe deslumbrar.

#### 2.1 Dashboard Redesign
- [x] **KPI Cards premium** — `StatsCard.jsx` con sparklines inline, tendencia (+/-%), color semántico, iconos Lucide.
- [x] **Resumen de actividad reciente** — Feed de últimas facturas y RMAs con estado, cliente y monto. Renderizado en Dashboard.
- [x] **Mapa de calor de ventas por hora/día** — `SalesHeatmap.jsx` CSS puro 7×24, tooltips, leyenda color, totales fila/columna, peak day/hour, últimos 90 días.
- [x] **Widget de moneda en tiempo real** — `CurrencyWidget.jsx` con countdown 5min, barra de progreso, fetch a `/currency/rate`, trend indicator (TrendingUp/Down), dark mode.
- [x] **Alertas accionables** — 3 cards semánticas: Stock bajo (amber), Apartados vencidos (rose), Créditos al límite (violet) con badge de conteo, botón `ExternalLink` en hover y barra de progreso para créditos.
- [x] **Modo oscuro** — Toggle dark/light mode persistente en sidebar con localStorage.
- [ ] **Dashboard personalizable** — Widgets reordenables (drag & drop básico con localStorage).

---

### FASE 3 — MÓDULO PRODUCTOS (SEMANA 3-4)
> El catálogo es el núcleo del negocio.

#### 3.1 Listado de Productos
- [x] **Vista Grid/Lista toggle** — `ProductGrid.jsx` con imagen, stock badge, precio y acciones en hover overlay.
- [x] **Filtros avanzados** — Filtros por categoría, stock status (in stock/low/out), búsqueda con debounce.
- [x] **Búsqueda en tiempo real** — Debounce 350ms, filtros por URL con `withQueryString`.
- [x] **Bulk actions** — Checkboxes en tabla lista, barra flotante con conteo, eliminar masivo con ConfirmDialog. Backend `bulkDestroy` ruta `POST /admin/products/bulk-destroy`.
- [ ] **Columnas configurables** — El usuario elige qué columnas ver y en qué orden.
- [x] **Stock status visual** — Badge semántico: Verde/Amarillo/Rojo con dot indicator.

#### 3.2 Formulario Crear/Editar Producto
- [x] **Wizard por pasos** — Info básica → Precios → Stock → Imágenes → Categorías → Confirmar.
- [x] **Preview de imagen en vivo** — Zona drag & drop con `URL.createObjectURL`, previews en grid, badge “Principal” en primera imagen, eliminar individual con hover.
- [x] **Generador SKU automático** — Botón “Auto” 🪨4 genera SKU desde nombre (4 chars) + categoría (3 chars) + número aleatorio.
- [x] **Selector de categoría en modal** — `category_id` en el formulario con `select`, persiste en create/edit y se envía al backend.
- [ ] **Campo de variantes** — Tallas, colores, etc. (estructura base).
- [ ] **Precio en múltiples monedas** — Ver precio USD/BS en tiempo real al escribir.
- [x] **Tags/etiquetas libres** — Para búsqueda y filtrado avanzado.
- [ ] **IA Caption** — Botón para generar descripción automática desde la imagen (integración existente).

#### 3.3 Inventario por Producto
- [x] **Timeline de movimientos** — Historial con badges `ArrowUpCircle`/`ArrowDownCircle`, filtros por bodega/tipo/fecha, sticky header, EmptyState.
- [ ] **Mini-gráfico de stock** — Evolución del stock en los últimos 90 días.
- [x] **Ajuste rápido de stock** — Modal inline sin navegar a otra página.

---

### FASE 4 — MÓDULO VENTAS / FACTURAS (SEMANA 4-5)
> El módulo más crítico operativamente.

#### 4.1 Listado de Facturas
- [x] **Kanban por estado** — `Kanban.jsx` con columnas dinámicas según `invoice_statuses`, cards con número, cliente, monto, ítems, fecha. Colores semánticos por estado (amber/emerald/blue/teal/red).
- [x] **Timeline de factura** — Historial de cambios de estado con usuario y timestamp.
- [x] **Filtros rápidos** — Chips de filtro por estado (pending/paid/shipped/delivered/cancelled) con KPIs: total, pendientes, pagadas, ingresos.
- [x] **PageHeader + StatsCards** — Módulo de facturas modernizado con header, KPIs y búsqueda inline.
- [x] **Export multi-formato** — PDF, Excel, CSV desde el listado filtrado.

#### 4.2 Creación de Factura (POS Mode)
- [x] **POS Interface** — `Pos.jsx` con layout dividido: grid de productos (24 ítems, imagen, stock, precio) + carrito lateral con cantidades, +/-, eliminar, total dinámico. Atajos F1 (buscar), F2 (pagar), Esc (cerrar).
- [x] **Búsqueda por SKU/código de barras/nombre** — Input con autofocus, debounce implícito por render, búsqueda instantánea en productos cargados.
- [x] **Múltiples métodos de pago** — Modal de pago con selector Efectivo/Tarjeta, cliente opcional, notas, validación y submit vía `useForm`.
- [x] **Descuentos por línea y por total** — Campo de descuento (% o monto fijo) por ítem y global.
- [ ] **Impresión de recibo** — Template de recibo térmico (80mm) y factura completa A4.
- [ ] **Factura recurrente** — Plantillas de factura para clientes frecuentes.

#### 4.3 Vista de Factura Individual
- [x] **Vista detalle** — `Show.jsx` con header, datos de cliente, tabla de ítems con imágenes, sección de pagos, botón descargar PDF.
- [x] **PDF premium** — Desglose de subtotal, IVA, envío, descuento, tasa de cambio aplicada. QR pendiente.
- [x] **Envío por email** — Botón para reenviar factura al cliente directamente.
- [x] **Notas internas** — Campo de notas privadas por factura (no visibles en PDF).

---

### FASE 5 — MÓDULO CLIENTES / CRM (SEMANA 5-6)
> Convertir el listado básico en un CRM funcional.

#### 5.1 Listado de Clientes
- [x] **KPIs del módulo** — StatsCards: total clientes, con compras, con puntos de fidelidad, ingresos totales.
- [x] **Tabla mejorada** — Avatar con inicial, email con link mailto, puntos con icono estrella, compras con badge.
- [x] **PageHeader + búsqueda inline** — Módulo de clientes modernizado con header y toolbar.
- [x] **Segmentación automática** — Backend calcula `segment` por cliente (VIP ≥5 facturas, Nuevo=sin facturas, En riesgo=>90d sin comprar). Chips de filtro en Index con conteos. Badge en tabla.
- [ ] **Mapa de clientes** — Heatmap geográfico básico si tienen ciudad/dirección.
- [ ] **Score de cliente** — Índice calculado basado en frecuencia de compra, monto y puntualidad de pagos.

#### 5.2 Ficha de Cliente
- [x] **Vista 360°** — Header con avatar iniciales, 4 KPI cards (total gastado, facturas, ticket promedio, puntos), contacto, producto favorito, cuenta de crédito con barra de uso, historial tipo timeline.
- [x] **Estadísticas del cliente** — Total comprado, ticket promedio, producto favorito, días desde última compra.
- [x] **Notas y seguimiento** — Sistema de notas internas con mención de usuario y fecha.
- [x] **Gestión de crédito inline** — Ver y ajustar límite de crédito desde la ficha sin navegar.

---

### FASE 6 — MÓDULO INVENTARIO & BODEGAS (SEMANA 6-7)

#### 6.0 Proveedores
- [x] **PageHeader + StatsCards** — Módulo de proveedores modernizado con KPIs (total, con email, con teléfono) y toolbar.

#### 6.0b Categorías
- [x] **PageHeader + StatsCards** — Módulo de categorías modernizado: KPIs (total, con productos, con descripción), slug con badge `<code>`, icono `Tag`.

#### 6.1 Mapa de Stock
- [x] **Vista por bodega** — Tabla comparativa de stock por bodega para cada producto.
- [x] **Alertas de reorden** — Configurar punto de reorden por producto y recibir alerta.
- [x] **Kardex mejorado** — Tabla kardex con saldo acumulado, exportable a Excel.

#### 6.2 Transferencias entre Bodegas
- [x] **Flujo de aprobación** — Estado: Borrador → Enviado → En tránsito → Recibido → Cancelado.
- [x] **QR de transferencia** — Generar QR por transferencia para escaneo al recibir.

---

### FASE 7 — MÓDULO REPORTES (SEMANA 7-8)
> Reportes que justifican el precio del sistema.

#### 7.1 Reportes Avanzados
- [ ] **Builder de reportes** — Interfaz drag & drop para crear reportes personalizados.
- [x] **Reporte de rentabilidad** — Margen bruto por producto, categoría y período.
- [x] **Reporte de flujo de caja** — Ingresos vs egresos por período con gráfico.
- [x] **Reporte de antigüedad de inventario** — Productos sin movimiento por X días.
- [x] **Dashboard de reportes** — Página central con todos los reportes disponibles como cards.
- [ ] **Programar reportes** — Envío automático por email en frecuencia configurable.

---

### FASE 8 — TIENDA PÚBLICA (SEMANA 8-9)
> La cara pública del negocio. Debe ser una tienda moderna.

#### 8.1 Home
- [x] **Hero dinámico** — Carousel de banners con CTA configurables desde el admin.
- [x] **Sección de categorías** — Grid visual de categorías con imagen.
- [x] **Productos destacados** — Carrusel horizontal con scroll.
- [x] **Contador de oferta** — Countdown timer para ofertas temporales.
- [x] **Social proof** — Sección de testimonios o "últimas ventas".

#### 8.2 Tienda
- [x] **Filtrado avanzado con URL** — Filtros reflejados en la URL para compartir/bookmarks.
- [x] **Vista rápida (Quick View)** — Modal con detalles del producto sin salir de la lista.
- [x] **Comparar productos** — Seleccionar hasta 3 productos para comparar specs.
- [x] **Lista de deseos (Wishlist)** — Guardar productos para después.
- [x] **Reviews y ratings** — Sistema de calificaciones de productos por clientes.

#### 8.3 Checkout
- [ ] **Checkout multi-paso** — Carrito → Datos → Pago → Confirmación con progress bar.
- [ ] **Guardado de dirección** — Múltiples direcciones por cliente.
- [ ] **Cupones de descuento** — Sistema de cupones con % o monto fijo y fecha de expiración.
- [ ] **Resumen sticky** — El resumen del pedido se mantiene visible al hacer scroll.

---

### FASE 9 — MÓDULO RMA & GARANTÍAS (SEMANA 9)

- [ ] **Pipeline visual** — Kanban de casos RMA por estado.
- [ ] **SLA tracking** — Tiempo transcurrido desde apertura, alerta si supera X días.
- [ ] **Portal del cliente** — El cliente puede ver el estado de su RMA desde su panel.
- [ ] **Decisiones y notas** — Registro de decisiones con adjuntos (fotos del producto dañado).

---

### FASE 10 — MÓDULO APARTADOS & CRÉDITOS (SEMANA 9-10)

- [ ] **Dashboard de créditos** — Visión global: créditos activos, vencidos, por vencer.
- [ ] **Tabla de amortización** — Vista de pagos programados vs realizados.
- [ ] **Alertas de cobro** — Notificación automática cuando un crédito está por vencer.
- [ ] **Comprobante de pago** — PDF de recibo de pago de crédito/apartado.

---

### FASE 11 — CONFIGURACIÓN & SETTINGS (SEMANA 10)

- [ ] **Onboarding wizard** — Flujo de 5 pasos para configurar el sistema desde cero (primera vez).
- [ ] **Personalización de marca** — Upload de logo, colores primarios, favicon desde el admin.
- [ ] **Configuración de plantillas de email** — Editor visual de emails transaccionales.
- [ ] **Backup y exportación** — Exportar toda la base de datos desde el panel.
- [ ] **API Keys management** — Página para gestionar tokens de API para integraciones externas.
- [ ] **Logs de sistema** — Visor de logs de Laravel en tiempo real (protegido por permiso).

---

### FASE 12 — PERFORMANCE & CALIDAD (SEMANA 10-11)

#### 12.1 Backend Performance
- [x] **Query optimization** — N+1 corregido con Eager Loading explícito en InvoiceController, CustomerController; `items.product:id,name,sku,image_url` con select.
- [x] **Caching estratégico** — `Cache::remember('nav_categories', 600)` en HandleInertiaRequests; summary queries con `selectRaw` en Invoice y Customer controllers.
- [ ] **Pagination en todas las listas** — Asegurar que ninguna lista carga >100 registros sin paginar.
- [ ] **Response time** — Goal: < 200ms para páginas admin, < 300ms para tienda.

#### 12.2 Frontend Performance
- [ ] **Code splitting** — Lazy imports de páginas pesadas (Settings, Reports).
- [ ] **Image optimization** — WebP conversion, lazy loading, blur placeholders.
- [ ] **Bundle size audit** — Revisar dependencias no usadas.
- [ ] **Memo y useCallback** — Aplicar en componentes pesados del dashboard.

#### 12.3 Accesibilidad
- [ ] **WCAG 2.1 AA** — Contraste de colores, focus visible, labels en formularios, aria-attributes.
- [ ] **Keyboard navigation** — Todos los modales y dropdowns navegables por teclado.

---

### FASE 13 — NUEVAS FUNCIONALIDADES "WOW" (SEMANA 11-12)
> Features que ningún competidor tiene en este segmento.

- [ ] **POS Completo** — Modo pantalla completa para caja registradora con atajo de teclado.
- [ ] **Lector de código de barras por cámara** — Usar la cámara del dispositivo para escanear productos.
- [ ] **Exportación a WhatsApp** — Generar link de catálogo compartible por WhatsApp.
- [ ] **Presupuestos/Cotizaciones** — Módulo de presupuestos que se convierten en facturas.
- [ ] **Multi-idioma en tienda pública** — El cliente puede cambiar idioma (ya existe backend).
- [ ] **Modo demo** — Usuario demo con datos precargados para presentar el sistema a clientes.
- [ ] **Tour guiado (onboarding)** — Overlay de introducción para nuevos usuarios con pasos.
- [ ] **Notificaciones push** — Web push notifications para alertas críticas de stock.
- [ ] **Módulo de gastos/egresos** — Registro de gastos operativos para P&L básico.
- [ ] **Integración contable básica** — Exportar asientos contables en formato estándar.

---

### FASE 14 — DOCUMENTACIÓN & PRESENTACIÓN (SEMANA 12)
> La documentación como producto de venta.

- [ ] **README premium** — README.md con badges, screenshots, instalación rápida, arquitectura.
- [ ] **Documentación de API** — Swagger/OpenAPI auto-generado desde los endpoints.
- [ ] **Video demo** — Script para demo de 3 minutos cubriendo todos los módulos clave.
- [ ] **Changelog** — CHANGELOG.md con versionado semántico.
- [ ] **Manual de usuario** — PDF interactivo por rol (admin, cajero, almacenero, cliente).
- [ ] **Guía de instalación** — Docker compose listo para producción.
- [ ] **Landing page de venta** — Página de marketing con features, pricing, screenshots.

---

## 📊 PRIORIZACIÓN POR IMPACTO/ESFUERZO

| Prioridad | Módulo | Impacto | Esfuerzo | Sprint |
|-----------|--------|---------|----------|--------|
| 🔴 CRÍTICO | Sidebar Admin + Design System | Muy Alto | Medio | 1 |
| 🔴 CRÍTICO | Dashboard redesign con KPIs | Muy Alto | Medio | 1 |
| 🔴 CRÍTICO | POS Interface para facturas | Muy Alto | Alto | 2 |
| 🟠 ALTO | Listado productos (Grid + filtros) | Alto | Medio | 2 |
| 🟠 ALTO | Ficha cliente 360° | Alto | Medio | 3 |
| 🟠 ALTO | Tienda pública modernización | Alto | Alto | 4 |
| 🟡 MEDIO | Reportes avanzados | Medio | Alto | 5 |
| 🟡 MEDIO | RMA Pipeline Kanban | Medio | Bajo | 5 |
| 🟡 MEDIO | Performance optimization | Alto | Medio | 6 |
| 🟢 DESEABLE | Presupuestos/Cotizaciones | Medio | Medio | 7 |
| 🟢 DESEABLE | Notificaciones push | Bajo | Medio | 7 |
| 🟢 DESEABLE | Tour guiado onboarding | Medio | Bajo | 8 |

---

## 🏗️ REGLAS DE TRABAJO

1. **Módulo por módulo** — Se completa un módulo antes de pasar al siguiente.
2. **Mobile first** — Cada mejora debe verse perfecta en móvil primero.
3. **No romper funcionalidad existente** — Tests antes y después de cada cambio.
4. **Consistencia visual** — Usar solo componentes del design system, no inventar nuevos styles.
5. **Commits atómicos** — Un commit por feature/fix con mensaje descriptivo.
6. **Performance siempre** — No agregar una feature si degrada el tiempo de carga.
7. **Accesibilidad** — Todo componente nuevo debe tener aria-labels.

---

## 🔧 COMANDOS ÚTILES

```bash
# Frontend dev
npm run dev

# Build producción
npm run build

# Tests PHP
php artisan test

# Limpiar cache
php artisan cache:clear && php artisan config:clear && php artisan view:clear

# Migraciones
php artisan migrate

# Seeder de demo
php artisan db:seed --class=DemoSeeder

# Queue worker
php artisan queue:work --tries=3

# Servicio IA
cd tools && .venv\Scripts\python.exe -m uvicorn image_service:app --host 127.0.0.1 --port 8001
```

---

## 📈 MÉTRICAS DE ÉXITO

- **Time to First Byte (TTFB)**: < 200ms
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cobertura de tests**: > 70%
- **Errores JS en producción**: 0
- **Accesibilidad score (Lighthouse)**: > 90
- **Performance score (Lighthouse)**: > 85
- **Módulos sin empty states**: 0
- **Módulos sin paginación**: 0

---

## 📅 REGISTRO DE PROGRESO

| Fecha | Módulo | Cambio | Estado |
|-------|--------|--------|--------|
| Jun 2026 | - | Plan creado | ✅ |
| Jun 2026 | Layout | AdminSidebar colapsable + dark mode toggle + language switcher | ✅ |
| Jun 2026 | Layout | AuthenticatedLayout con spacer sidebar + fix mobile padding | ✅ |
| Jun 2026 | Design System | CSS variables dark mode mejoradas, tokens sidebar, scrollbar-thin | ✅ |
| Jun 2026 | Componentes | PageHeader, StatsCard con sparklines — reutilizables en todos los módulos | ✅ |
| Jun 2026 | Dashboard | Refactor con PageHeader + StatsCard + KPIs multimoneda | ✅ |
| Jun 2026 | Productos | Grid/Lista toggle, ProductGrid, filtros stock+categoría, backend actualizado | ✅ |
| Jun 2026 | Facturas | PageHeader + KPIs + filtros chips por estado + InvoiceController summary | ✅ |
| Jun 2026 | Clientes | PageHeader + KPIs + avatar tabla + CustomerController summary | ✅ |
| Jun 2026 | Proveedores | PageHeader + KPIs + tabla mejorada + ProviderController summary | ✅ |
| Jun 2026 | Componentes | EmptyState.jsx (presets) + TableSkeleton + CardSkeleton + StatsSkeleton | ✅ |
| Jun 2026 | AdminTable | Skeleton loading, EmptyState, acciones hover con opacity-0/100 | ✅ |
| Jun 2026 | Dashboard | Feed actividad reciente (facturas + RMAs) con estado, cliente y monto | ✅ |
| Jun 2026 | Inventario | Inventory.jsx: PageHeader + StatsCard (stock/entradas/salidas) + tabla mejorada con badges + EmptyState | ✅ |
| Jun 2026 | Categorías | Category/Index.jsx: PageHeader + StatsCard + tabla moderna + CategoryController summary | ✅ |
| Jun 2026 | Dashboard | Alertas accionables: stock bajo + apartados vencidos + créditos al límite con progress bar | ✅ |
| Jun 2026 | Nav pública | Sticky blur backdrop, mega-menu categorías, búsqueda expandible, drawer móvil animado | ✅ |
| Jun 2026 | Performance | Cache nav_categories (10min), N+1 eager loading, summary queries consolidadas con selectRaw | ✅ |
| Jun 2026 | ProductModal | Drag & drop preview real, auto-SKU generator, selector categoría, layout 3-col precio/stock/min | ✅ |
| Jun 2026 | POS Interface | `Pos.jsx` — layout dividido productos/carrito, F1/F2 shortcuts, modal pago efectivo/tarjeta, badge "POS" en sidebar | ✅ |
| Jun 2026 | Kanban Facturas | `Kanban.jsx` — vista pipeline por estado, columnas dinámicas, cards con drag preview, toggle Lista/Kanban | ✅ |
| Jun 2026 | Vista Factura | `Show.jsx` — detalle de factura con cliente, ítems, pagos, botón PDF (corregido a `<a>` para descarga directa) | ✅ |
| Jul 2026 | CRM Cliente | Notas internas (CustomerNote migration+model+controller+routes) — tab en Show.jsx con CRUD+pin+tipo | ✅ |
| Jul 2026 | Facturas | Timeline de historial en Show.jsx — AuditLog → InvoiceTimeline con línea vertical, iconos, transiciones de estado | ✅ |
| Jul 2026 | CRM Cliente | Crédito inline en Show.jsx — CreditInlineEditor con edición de límite y estado + ruta PATCH updateLimit | ✅ |
| Jul 2026 | Facturas | Export multi-formato: InvoicesExport + InvoiceExportController — dropdown Excel/CSV/PDF con filtros activos | ✅ |
| Jul 2026 | Productos | Ajuste rápido de stock — botón ⚡ en tabla, modal inline Entrada/Salida con cantidad y nota | ✅ |
| Jul 2026 | POS | Descuentos por línea y global (% o fijo) — migración discount_usd, cálculo backend store, UI carrito con desglose | ✅ |
| Jul 2026 | Vista Factura | Notas internas editables inline (InternalNotesCard + PATCH updateInternalNotes) + Envío por email (sendEmail con Mailable InvoiceCreated) | ✅ |
| Jul 2026 | Inventario 6.1 | Vista por bodega mejorada: modo matriz (toggle lista/matriz) con stock comparativo por bodega, colores semánticos por nivel de stock | ✅ |
| Jul 2026 | Inventario 6.1 | Alertas de reorden: ProductWizard mejorado con validación visual de stock vs mínimo, indicador de alerta cuando stock < min_stock | ✅ |
| Jul 2026 | Inventario 6.1 | Kardex mejorado: columna saldo acumulado (running balance), exportación a Excel (CSV con BOM UTF-8), botón de exportación en UI | ✅ |
| Jul 2026 | Inventario 6.2 | Transferencias: flujo de aprobación completo (draft → sent → in_transit → received → cancelled), validación de transiciones, timestamps sent_at/received_at | ✅ |
| Jul 2026 | Inventario 6.2 | Transferencias: QR code generado automáticamente al crear (URL de la transferencia), campo qr_code en modelo y migración | ✅ |
| Jul 2026 | Reportes 7.1.2 | Reporte de rentabilidad: ProfitabilityReportController con agrupación por producto/categoría, cálculo de margen bruto, conversión multi-moneda | ✅ |
| Jul 2026 | Reportes 7.1.2 | Vista rentabilidad: tabla con ingresos, costos, margen bruto, % margen con colores semánticos (≥30% verde, 15-30% amarillo, <15% rojo) | ✅ |
| Jul 2026 | Reportes 7.1.3 | Reporte flujo de caja: CashFlowReportController con ingresos (facturas pagadas) vs egresos (compras inventario), agrupación diario/semanal/mensual | ✅ |
| Jul 2026 | Reportes 7.1.3 | Vista flujo de caja: gráfico Chart.js línea con ingresos y flujo neto, tabla con períodos, colores semánticos (ingresos verde, egresos rojo, neto azul/rojo) | ✅ |
| Jul 2026 | Reportes 7.1.4 | Reporte antigüedad inventario: InventoryAgeReportController identifica productos sin venta X días, cálculo valor inventario obsoleto | ✅ |
| Jul 2026 | Reportes 7.1.4 | Vista antigüedad: tabla con días sin venta, estado (crítico ≥180d, advertencia 90-180d, ok <90d), colores semánticos | ✅ |
| Jul 2026 | Reportes 7.1.5 | Dashboard de reportes: ReportsDashboardController con cards agrupados por categoría (Ventas, Inventario, Finanzas) | ✅ |
| Jul 2026 | Reportes 7.1.5 | Vista dashboard: grid de cards con iconos, descripciones, hover effects, navegación a cada reporte | ✅ |
| Jul 2026 | Tienda 8.1.1 | Home: Hero dinámico con carousel de banners (Banner model + migration), navegación automática, dots, flechas | ✅ |
| Jul 2026 | Tienda 8.1.2 | Home: Sección categorías con grid visual, links a tienda por slug, hover effects | ✅ |
| Jul 2026 | Tienda 8.1.3 | Home: Productos destacados grid 4 columnas, botón carrito, link a tienda | ✅ |
| Jul 2026 | Tienda 8.1.4 | Home: Contador de oferta countdown timer (7 días), días/horas/min/seg, CTA a tienda | ✅ |
| Jul 2026 | Tienda 8.1.5 | Home: Social proof section con 3 cards (envíos rápidos, calidad, soporte 24/7) | ✅ |
| Jul 2026 | Tienda 8.2.1 | ShopController mejorado: filtros search, category, min/max price, sort, in_stock, URL params | ✅ |
| Jul 2026 | Tienda 8.2.1 | Shop/Index.jsx: applyFilters con URLSearchParams, navegación con filtros en URL | ✅ |
| Jul 2026 | Tienda 8.2.2 | QuickView modal: imagen, precio, stock, rating, descripción, selector cantidad, botón agregar | ✅ |
| Jul 2026 | Tienda 8.2.2 | Shop/Index.jsx: integración QuickView con estado, handler handleQuickView, onQuickView en ProductCard | ✅ |
| Jul 2026 | Tienda 8.2.3 | ProductCompare modal: tabla comparativa hasta 3 productos, features (precio, stock, categoría, SKU) | ✅ |
| Jul 2026 | Tienda 8.2.3 | Shop/Index.jsx: estado compareProducts, handleAddToCompare, botón comparar en header, onCompare en ProductCard | ✅ |
| Jul 2026 | Tienda 8.2.4 | Wishlist: migration + model Wishlist, WishlistController (index/store/destroy), rutas auth | ✅ |
| Jul 2026 | Tienda 8.2.4 | Wishlist/Index.jsx: grid productos, separación disponibles/agotados, botón agregar todos al carrito | ✅ |
| Jul 2026 | Tienda 8.2.5 | Reviews: migration + model Review, ReviewController (index/store/update/destroy), rutas | ✅ |
| Jul 2026 | Tienda 8.2.5 | Reviews/Index.jsx: rating summary, distribución por estrellas, formulario reseña, lista reviews | ✅ |

> *Este archivo se actualiza a medida que se completan los módulos.*

---

## 🎨 GUÍA DE ESTILO VISUAL

### Paleta de colores base
```css
/* Primary: Indigo/Blue moderno */
--primary: 239 68% 54%;         /* #4F46E5 */
--primary-foreground: 0 0% 100%;

/* Accent: Emerald para éxito */
--accent: 158 64% 40%;          /* #10B981 */

/* Warning: Amber */
--warning: 38 92% 50%;          /* #F59E0B */

/* Danger: Red */
--destructive: 0 84% 60%;       /* #EF4444 */

/* Neutrales */
--background: 220 14% 96%;      /* #F1F5F9 */
--foreground: 222 47% 11%;      /* #0F172A */
--muted: 220 13% 91%;           /* #E2E8F0 */
--border: 220 13% 86%;          /* #CBD5E1 */
```

### Tipografía
- Headings: `font-bold`, `tracking-tight`
- Body: `text-sm`, `text-muted-foreground` para labels
- Monospace: `font-mono text-xs` para SKUs, IDs, código

### Espaciado
- Container max-width: `max-w-7xl`
- Gap estándar: `gap-4` (cards), `gap-6` (sections)
- Padding de card: `p-4` (sm), `p-6` (md)
- Radius estándar: `rounded-xl` (cards), `rounded-lg` (buttons), `rounded-md` (inputs)

### Sombras
- Card: `shadow-sm border border-border` (sin shadow fuerte)
- Modal: `shadow-2xl`
- Dropdown: `shadow-lg ring-1 ring-black/5`

---

*Última actualización: Jun 2026 | Versión: 1.0.0*
