# Transicion legacy a snapshot multimoneda

## Objetivo

Definir la convivencia temporal entre columnas legacy en USD/VES y el nuevo contrato monetario basado en snapshot historico para evitar dobles criterios en backoffice, reportes y documentos.

## Estado actual

El sistema ya persiste y consume snapshot monetario en estas superficies:

- facturas
- items de factura
- pagos de factura
- ajustes de factura
- apartados
- RMA
- movimientos de credito
- dashboard admin y cliente
- reportes administrativos de ventas, apartados e inventario visibles
- correo de factura

Las columnas legacy siguen existiendo como compatibilidad operativa y soporte de backfill:

- total_usd
- total_bs
- subtotal_usd
- subtotal_bs
- amount_usd
- amount_bs

## Fuente de verdad por etapa

### 1. Documentos historicos y vistas oficiales

Usar como fuente primaria:

- currency_code
- base_currency_code
- exchange_rate_snapshot
- exchange_rate_source
- monetary_totals_json
- subtotal_original
- amount_original
- monetary_breakdown_json

Regla:

- toda vista administrativa o reporte que represente historico documental debe apoyarse primero en snapshot o document_totals
- si el documento tiene breakdown monetario por item, ese breakdown domina sobre subtotal_usd o total_usd para pintar el historico

### 2. Operaciones vivas sin historico documental

Usar como fuente primaria:

- montos base en USD mientras el modulo no tenga snapshot propio
- AdminMoneyService::buildAdminTotals para convertir a monedas visibles activas

Regla:

- para valorizacion operativa o inventario, la conversion puede ser administrativa actual porque no representa un documento cerrado con snapshot historico

### 3. Compatibilidad temporal

Las columnas legacy pueden seguir existiendo solo para:

- queries antiguas aun no migradas
- backfill de registros legacy
- integraciones internas todavia pendientes de refactor
- soporte de formularios o payloads que aun nombran amount_usd por compatibilidad de API

Regla:

- las columnas legacy no deben ser la fuente primaria de render en superficies ya migradas
- si una vista nueva cae a total_usd o subtotal_usd, debe tratarse como fallback y no como contrato estable

## Criterios de implementacion

### Backend

- toda superficie admin nueva debe exponer adminCurrencyContext cuando la UI renderice varias monedas visibles
- todo historico documental debe exponer document_totals o breakdown monetario equivalente
- toda valorizacion operativa debe exponer admin_totals desde backend, evitando conversion ad hoc solo en frontend
- al editar documentos historicos, se debe recalcular con snapshot del documento y no con tasas vigentes

### Frontend

- preferir montos servidos por backend ya resueltos por moneda visible
- usar conversion visual desde hooks solo como fallback temporal o para formularios operativos
- evitar recomponer KPIs oficiales desde total_usd cuando el backend ya manda document_totals o admin_totals

## Checklist de retiro progresivo

### Ya migrado

- listado de facturas
- modal de factura en subtotales y resumen final
- dashboard admin
- dashboard cliente
- indice y detalle de clientes
- reportes de ventas
- ranking de productos
- reporte de apartados
- listado y detalle de apartados
- listado, detalle y creacion de RMA
- reportes de inventario global y por bodega
- credito y movimientos de credito
- correo de factura

### Pendiente principal

- cuentas por pagar cuando exista superficie activa
- feature tests de activacion y desactivacion de monedas
- smoke test funcional de backoffice con monedas visibles alternas
- limpieza final de fallbacks legacy restantes en vistas administrativas menores
- exportaciones de inventario si se desea el mismo criterio multimoneda visible en archivo

## Riesgos conocidos

- mezclar snapshot documental con conversion actual en el mismo componente
- dejar payloads con nombres legacy y asumir que eso implica criterio legacy de negocio
- mantener demasiado tiempo total_usd como fuente paralela en vistas ya migradas
- exportar inventario en una sola moneda mientras pantalla muestra varias sin documentar la diferencia

## Regla de cierre

Una superficie puede considerarse cerrada solo si cumple estas tres condiciones:

- el backend envia el monto correcto para la moneda o monedas visibles necesarias
- el frontend pinta primero desde ese contrato y no desde columnas legacy
- la validacion minima del slice queda ejecutada despues del cambio
