# Matriz rapida de validacion funcional del backoffice

Fecha de referencia: 2026-05-07

## Objetivo

Verificar que los filtros y acciones principales del backoffice hagan roundtrip al backend por Inertia/Laravel y no sean solo estado local de la interfaz.

## Criterio de aceptacion

- El control modifica la URL con query params coherentes.
- La pagina responde con una nueva vista del servidor.
- Los contadores o resumenes visibles reflejan el estado filtrado cuando aplica.
- No deben aparecer 409 de Inertia en paginas frescas tras la recarga inicial.

## Casos validados

| Modulo | Control | Datos de prueba | Resultado esperado |
| --- | --- | --- | --- |
| Sucursales | Alta rapida | `Sucursal QA Temporal` / `QA01` / `QA-` / `8` | El registro seeded reaparece en tabla y el contador de sucursales sube a `1` |
| Reporte de ventas | Cliente | Cliente Demo | URL con `customer_id=1` y `Filtros activos = 1` |
| Reporte de ventas | Estado | `paid` | URL con `status=paid` y `Filtros activos = 1` |
| Reporte de ventas | Tipo de documento | `invoice` | URL con `document_type=invoice` y `Filtros activos = 1` |
| Reporte de ventas | Vendedor | Administrador | URL con `seller_id=1` y `Filtros activos = 1` |
| Reporte de ventas | Rango de fechas | `2026-05-01` a `2026-05-07` | URL con `date_from` y `date_to`; `Filtros activos = 2` |
| Reporte de ventas | Sucursal | `Sucursal QA Temporal (QA01)` | URL con `warehouse_id=1` y retorno de factura `QA-VENTA-001` |
| Reporte de ventas | Metodo de pago | `cash` | URL con `payment_method=cash` y retorno de factura `QA-VENTA-001` |
| Reporte de inventario | Global / busqueda | `SKU-0006` | URL con `search=SKU-0006` y retorno de `Producto 6` |
| Reporte de inventario | Global / categoria | `Electrónica` | URL con `category_id=2` y respuesta coherente del servidor |
| Reporte de inventario | Global / stock bajo | Activado | URL con `low_stock_only=1` y respuesta coherente del servidor |
| Reporte de inventario | Por producto y bodega / sucursal | `Sucursal QA Temporal (QA01)` | URL con `warehouse_id=1` |
| Reporte de inventario | Por producto y bodega / busqueda | `SKU-0006` | URL con `search=SKU-0006` |
| Reporte de inventario | Kardex / producto | `Producto 6 (SKU-0006)` | URL con `product_id=6` |
| Reporte de inventario | Kardex / sucursal | `Sucursal QA Temporal (QA01)` | URL con `warehouse_id=1` |
| Reporte de inventario | Kardex / rango de fechas | `2026-05-01` a `2026-05-07` | URL con `date_from` y `date_to` |
| Reporte de inventario | Rotacion / sucursal | `Sucursal QA Temporal (QA01)` | URL con `warehouse_id=1` |
| Reporte de inventario | Rotacion / busqueda | `SKU-0006` | URL con `search=SKU-0006` |
| Reporte de inventario | Rotacion / solo lentos | Activado | URL con `only_slow=1` |
| Reporte de inventario | Rotacion / rango de fechas | `2026-05-01` a `2026-05-07` | URL con `date_from` y `date_to` |
| Reporte de creditos | Resumen / cliente | `Cliente Credito QA` | URL con `customer_id` del fixture seeded y `Filtros activos = 1` |
| Reporte de creditos | Resumen / estado | `active` | URL con `status=active` y retorno de la cuenta seeded |
| Reporte de creditos | Resumen / busqueda | `credito` | URL con `search=credito` |
| Reporte de creditos | Resumen / solo vencidos | Activado | URL con `overdue_only=1` |
| Reporte de creditos | Movimientos / cliente | `Cliente Credito QA` | URL con `customer_id` del fixture seeded |
| Reporte de creditos | Movimientos / cuenta | Cuenta seeded del cliente credito | URL con `account_id` |
| Reporte de creditos | Movimientos / tipo | `charge` | URL con `type=charge` |
| Reporte de creditos | Movimientos / estado | `pending` | URL con `status=pending` |
| Reporte de creditos | Movimientos / rango de fechas | `2026-05-01` a `2026-05-07` | URL con `date_from` y `date_to` |
| Reporte de apartados | Cliente | Cliente Demo | URL con `customer_id=1` y retorno de fixtures `QA-LAY-*` |
| Reporte de apartados | Estado | `expired` | URL con `status=expired` y retorno de `QA-LAY-002` |
| Reporte de apartados | Rango de fechas | `2026-05-01` a `2026-05-07` | URL con `date_from` y `date_to`; metrica `Filtros = 2` |
| Reporte de apartados | Solo vencidos | Activado | URL con `only_expired=1` y retorno de `QA-LAY-001` |
| Devoluciones | Busqueda | `QA-RMA` | URL con `search=QA-RMA` y retorno de fixtures seeded |
| Devoluciones | Estado | `approved` | URL con `status=approved` y retorno de `QA-RMA-002` |
| Sucursales | Filtros | No aplica | La pantalla no expone filtros; la validacion correcta es alta rapida y persistencia en tabla |

## Flujo recomendado para QA

0. Regenerar fixtures con `powershell -ExecutionPolicy Bypass -File ./tools/run-backoffice-smoke.ps1`.
1. Abrir la pagina objetivo desde una sesion autenticada fresca.
2. Aplicar un solo filtro por vez.
3. Confirmar que la URL cambia con el query param correspondiente.
4. Confirmar que los contadores del hero o contexto cambian cuando ese modulo los expone.
5. Limpiar filtros y repetir con el siguiente control.
6. En sucursales, crear una sede de prueba y verificar que aparezca en la tabla y conserve prefijo/longitud.

## Notas

- En local, el versionado de assets de Inertia queda desactivado para `local` y `testing` para evitar 409 por mismatch al reconstruir assets con pestañas abiertas.
- Los fixtures smoke ahora se regeneran con `BackofficeSmokeSeeder` y reemplazan los datos QA creados manualmente.
- El set reproducible incluye: sucursal `QA01`, factura de ventas `QA-VENTA-001`, pago `cash`, cliente `Cliente Credito QA`, cuenta activa y movimientos `charge`/`payment`, apartados `QA-LAY-*` y devoluciones `QA-RMA-*`.
- Limpieza inversa: `powershell -ExecutionPolicy Bypass -File ./tools/run-backoffice-smoke.ps1 -Cleanup`.
- Tareas de VS Code disponibles en el panel `Tasks`: `Backoffice Smoke: Build + Seed Fixtures` y `Backoffice Smoke: Cleanup Fixtures`.