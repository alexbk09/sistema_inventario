# Plan Tecnico Multimoneda Admin

## Objetivo

Lograr que al activar o desactivar monedas en configuracion, eso impacte de forma consistente en:

- tablas administrativas
- cards y KPIs
- formularios y detalles
- exportaciones CSV, Excel y PDF
- reportes operativos y gerenciales
- historico contable sin perder trazabilidad

## Resultado esperado

- [ ] Activar o desactivar monedas en configuracion debe impactar tablas administrativas, cards, KPIs, detalles y reportes.
- [ ] Las conversiones administrativas deben funcionar para todas las monedas activas visibles en admin.
- [ ] Los documentos historicos no deben alterarse cuando cambien las tasas.
- [ ] Exportaciones y vistas en pantalla deben reflejar el mismo criterio monetario.
- [ ] No deben quedar consultas criticas acopladas solo a USD/VES donde ya exista reemplazo.

## Estado actual verificado

- [x] La configuracion multimoneda ya soporta catalogo dinamico, moneda base, moneda por defecto y banderas de visibilidad en admin.
- [x] La capa administrativa y varios reportes siguen acoplados a montos fijos USD/VES.
- [x] Ya existe una base frontend para mostrar moneda activa, pero aun no hay modelo administrativo dinamico completo.

## Diagnostico actual

- [x] La configuracion ya soporta catalogo dinamico de monedas.
- [x] La persistencia transaccional principal sigue centrada en columnas fijas como total_usd y total_bs.
- [x] Los reportes de ventas y exportaciones siguen pensando en un par fijo de monedas.
- [x] Parte del frontend ya convierte visualmente montos, pero aun no existe un contrato administrativo completo para multiples monedas visibles.

## Principios de implementacion

- [x] Separar moneda de registro y moneda de visualizacion.
- [x] Usar tasa historica del documento para reportes oficiales.
- [x] Permitir conversion a tasa actual solo como vista gerencial opcional.
- [x] Mantener una moneda base canonica para consolidacion administrativa.

## Regla operativa recomendada

- [x] Moneda activa y visible en admin: aparece en tablas, cards, totales y reportes.
- [x] Moneda activa pero no visible en admin: sigue disponible a nivel de sistema, pero no se muestra en backoffice.
- [x] Moneda desactivada: no se usa en operaciones nuevas, pero se conserva el historico.
- [x] Reportes oficiales: usan la tasa historica del documento.
- [x] Vista gerencial opcional: puede mostrar conversion a tasa actual, pero separada y claramente etiquetada.

## Decisiones funcionales a cerrar

- [ ] Confirmar moneda base administrativa oficial.
- [ ] Confirmar si se mostrara tambien una vista gerencial a tasa actual.
- [ ] Confirmar politica final de redondeo por moneda.
- [ ] Confirmar si inventario se valorizara solo en moneda base o tambien en monedas activas visibles.
- [ ] Confirmar si exportaciones PDF con muchas monedas usaran columnas completas o resumen + anexo.

## Arquitectura objetivo

- [ ] Configuracion de monedas como fuente de verdad del catalogo.
- [ ] Servicio de tasas para resolver monedas configuradas y tasas actuales.
- [x] Servicio monetario administrativo central para columnas dinamicas, conversiones y snapshots.
- [ ] Persistencia transaccional extendida para soportar moneda original, base y snapshot historico.
- [ ] Capa de presentacion admin y exportaciones desacoplada de columnas fijas USD/VES.

## Componentes principales

- [x] CurrencySettings como catalogo normalizado.
- [x] CurrencyService como fuente de tasas configuradas.
- [x] AdminMoneyService como servicio base del dominio administrativo multimoneda.
- [ ] Migraciones nuevas para documentos monetarios.
- [ ] Comando de backfill historico.
- [ ] Adaptadores para reportes, dashboard y exportaciones.

## Modelo de datos objetivo

### Estrategia general

- [ ] Mantener temporalmente columnas legacy USD/VES por compatibilidad.
- [ ] Agregar moneda original por documento.
- [ ] Agregar moneda base por documento.
- [ ] Agregar tasa snapshot historica por documento.
- [ ] Agregar origen de tasa snapshot.
- [ ] Agregar estructura JSON de breakdown monetario.

### Campos propuestos en documentos principales

- [ ] currency_code
- [ ] base_currency_code
- [ ] exchange_rate_snapshot
- [ ] exchange_rate_source
- [ ] monetary_totals_json

### Campos propuestos en items

- [ ] unit_currency_code
- [ ] unit_price_original
- [ ] subtotal_original
- [ ] exchange_rate_snapshot
- [ ] monetary_breakdown_json

### Campos propuestos en pagos y movimientos

- [ ] payment_currency_code
- [ ] amount_original
- [ ] amount_base
- [ ] exchange_rate_snapshot
- [ ] exchange_rate_source

### Reglas del modelo historico

- [ ] Todo documento nuevo debe guardar snapshot monetario al momento de creacion.
- [ ] Todo item debe guardar el mismo criterio monetario del documento o su snapshot propio si aplica.
- [ ] Toda conversion oficial posterior debe usar el snapshot historico y no la tasa vigente.
- [ ] Las columnas legacy deben quedar solo como compatibilidad temporal, no como fuente primaria futura.

## Fase 1 - Nucleo monetario

- [x] Definir el contrato tecnico inicial del nucleo monetario admin.
- [x] Crear servicio central para resolver monedas visibles en admin.
- [x] Crear conversion base entre moneda canonica y monedas activas.
- [x] Soportar snapshot historico por documento dentro del servicio.
- [x] Integrar el servicio en el primer reporte prioritario: ventas admin.
- [x] Extender la integracion inicial a dashboard y exportaciones de ventas.
- [ ] Extender la integracion a listados y modulos restantes.

### Alcance tecnico de la Fase 1

- [x] Resolver monedas activas visibles en admin.
- [x] Convertir montos desde la moneda base administrativa.
- [x] Convertir montos usando snapshot historico.
- [x] Exponer estructura reutilizable para totales por moneda visible.
- [ ] Exponer helpers reutilizables para columnas dinamicas de reportes y tablas.

## Fase 2 - Persistencia y compatibilidad

- [x] Diseñar migraciones aditivas para documentos monetarios.
- [x] Agregar campos de moneda original, moneda base y tasa snapshot en tablas base de facturas.
- [x] Agregar estructura JSON para breakdown monetario en tablas base de facturas.
- [x] Crear comando de backfill para historicos.
- [ ] Mantener compatibilidad temporal con columnas USD/VES.

### Alcance tecnico de la Fase 2

- [x] Crear migraciones no destructivas.
- [ ] Agregar indices donde haya consultas administrativas por fecha, moneda o tipo de documento.
- [x] Poblar historicos usando total_usd y total_bs donde sea posible.
- [x] Extender backfill historico a movimientos de credito y ajustes de factura legacy.
- [x] Marcar inconsistencias del backfill para revision manual.
- [ ] Documentar la transicion entre columnas legacy y modelo nuevo.

## Fase 3 - Escritura transaccional

- [x] Refactorizar checkout para guardar moneda original y snapshot.
- [x] Refactorizar facturacion manual.
- [x] Refactorizar apartados.
- [x] Refactorizar RMA.
- [x] Refactorizar pagos y movimientos asociados.

### Alcance tecnico de la Fase 3

- [x] Guardar monto original, monto base y snapshot por documento en checkout y facturacion manual.
- [x] Guardar breakdown monetario por item en checkout y facturacion manual.
- [x] Guardar moneda de pago y tasa usada al cobrar en checkout y pagos manuales base.
- [x] Corregir captura y edicion de pagos y ajustes manuales segun la moneda visible/seleccionada.
- [ ] Mantener columnas USD/VES como derivadas transitorias mientras dure la migracion.
- [ ] Evitar recalculos historicos con tasas vigentes al editar o consultar documentos antiguos.

## Fase 4 - Capa administrativa

- [x] Refactorizar dashboard y KPIs.
- [x] Refactorizar listado de facturas.
- [x] Refactorizar reporte de ventas en pantalla.
- [x] Refactorizar detalle de clientes.
- [x] Refactorizar notificaciones administrativas.

### Alcance tecnico de la Fase 4

- [ ] Reemplazar metricas fijas total_usd y total_bs por metricas por moneda visible.
- [ ] Permitir columnas dinamicas en tablas administrativas.
- [ ] Alinear KPIs con la moneda base y monedas visibles.
- [ ] Refactorizar vistas que hoy convierten solo visualmente sin contrato backend estable.
- [ ] Homogeneizar el criterio monetario entre dashboard, listados y detalle.

## Fase 5 - Reportes y exportaciones

- [ ] Generar columnas dinamicas por monedas visibles en admin.
- [x] Refactorizar CSV de ventas.
- [x] Refactorizar Excel de ventas.
- [x] Refactorizar PDF de ventas.
- [x] Revisar reportes de inventario y valorizacion.

### Alcance tecnico de la Fase 5

- [ ] Generar encabezados dinamicos por monedas activas visibles.
- [ ] Incluir metadata del criterio de conversion en exportaciones.
- [ ] Asegurar consistencia entre vista en pantalla y archivo exportado.
- [ ] Ajustar PDFs para soportar 3 o mas monedas sin perder legibilidad.
- [ ] Revisar reportes de inventario, categoria, productos top y valorizacion.

## Fase 6 - Pruebas y cierre

- [x] Crear primeras pruebas unitarias del nucleo monetario.
- [ ] Agregar pruebas feature de activacion/desactivacion de monedas.
- [ ] Agregar pruebas de documentos historicos.
- [ ] Agregar pruebas de reportes y exportaciones.
- [ ] Retirar acoplamientos criticos USD/VES donde ya exista reemplazo.

### Alcance tecnico de la Fase 6

- [ ] Probar activacion de nuevas monedas visibles en admin.
- [ ] Probar desactivacion de monedas sin romper historico.
- [ ] Probar cambio de tasas sin alterar documentos historicos.
- [ ] Probar consistencia entre dashboard, tablas y exportaciones.
- [ ] Retirar de forma controlada la doble fuente de verdad.

## Modulos impactados

- [ ] Facturas
- [ ] Items de factura
- [ ] Pagos de factura
- [ ] Apartados
- [ ] RMA
- [x] Credito
- [ ] Cuentas por pagar
- [ ] Dashboard admin
- [ ] Reporte de ventas
- [ ] Exportaciones

## Entidades y tablas impactadas

- [ ] invoices
- [ ] invoice_items
- [ ] invoice_payments
- [ ] layaways
- [ ] layaway_items
- [ ] rmas
- [ ] rma_items
- [x] credit_movements
- [x] credit_accounts
- [ ] accounts_payable

## Superficies de codigo prioritarias

- [x] Nucleo monetario administrativo
- [x] Reporte de ventas admin en pantalla
- [x] Dashboard admin
- [x] Listado de facturas
- [x] Exportacion CSV de ventas
- [x] Exportacion Excel de ventas
- [x] Exportacion PDF de ventas
- [x] Indice de clientes
- [x] Detalle de clientes
- [x] Checkout
- [x] Facturacion manual
- [x] Apartados
- [x] RMA
- [x] Reportes de clientes y credito
- [x] Notificaciones administrativas
- [x] Reportes de inventario

## Riesgos a vigilar

- [ ] Mezclar tasa historica y tasa actual en el mismo KPI.
- [ ] Mantener doble fuente de verdad demasiado tiempo.
- [ ] Perder legibilidad en PDF con demasiadas monedas activas.
- [ ] Dejar consultas SQL fijas en USD/VES en flujos criticos.

## Riesgos tecnicos adicionales

- [ ] Degradacion de rendimiento al recalcular demasiadas columnas dinamicas sin estrategia de agregacion.
- [ ] Backfill incompleto en documentos historicos sin suficiente informacion.
- [ ] Divergencia entre frontend y backend si ambos convierten con fuentes distintas.
- [ ] Reglas de redondeo inconsistentes entre checkout, admin y exportaciones.

## Criterios de aceptacion por alto nivel

- [ ] Si admin activa EUR y la marca visible, aparece en dashboard, tablas y reportes.
- [ ] Si admin desactiva VES, deja de aparecer en vistas nuevas pero no se pierde historico.
- [ ] Un documento historico conserva su valor convertido por snapshot aunque cambie la tasa actual.
- [ ] Las exportaciones muestran el mismo conjunto de monedas visibles que la vista administrativa.
- [ ] No quedan sumatorias criticas dependiendo solo de total_usd y total_bs en modulos migrados.

## Pruebas necesarias

- [x] Unit tests del servicio monetario base.
- [ ] Feature tests de activacion y desactivacion de monedas.
- [ ] Feature tests de creacion de documentos en varias monedas.
- [ ] Feature tests de historico con snapshot.
- [ ] Tests de dashboard admin.
- [ ] Tests de reportes de ventas.
- [ ] Tests de exportacion CSV.
- [ ] Tests de exportacion Excel.
- [ ] Tests de exportacion PDF.
- [ ] Smoke test funcional del backoffice.

## Casos de prueba minimos

- [ ] Activar EUR visible en admin y confirmarlo en reporte de ventas.
- [ ] Desactivar VES y confirmar que desaparece de vistas nuevas.
- [ ] Documento historico en VES sigue visible tras desactivacion.
- [ ] Cambio de tasa actual no altera totales historicos.
- [ ] Dashboard y reporte de ventas muestran el mismo set de monedas visibles.

## Orden de implementacion recomendado

- [x] Paso 1: servicio monetario base y pruebas iniciales.
- [x] Paso 2: primera integracion en reporte de ventas admin.
- [x] Paso 3: dashboard admin.
- [x] Paso 4: exportaciones CSV, Excel y PDF.
- [ ] Paso 5: listados prioritarios.
- [x] Paso 5: listados prioritarios.
- [x] Paso 6: primera migracion de snapshot monetario por documento.
- [x] Paso 7: completar apartados y RMA luego de checkout y facturacion manual.
- [ ] Paso 8: limpieza de compatibilidad y retiro progresivo de acoplamientos legacy.

## Estimacion pragmatica

- [ ] Fase 1 y 2: 4 a 6 dias.
- [ ] Fase 3: 4 a 7 dias.
- [ ] Fase 4: 5 a 8 dias.
- [ ] Fase 5: 3 a 5 dias.
- [ ] Fase 6 y cierre: 3 a 5 dias.

## Definicion de listo

- [ ] Activar o desactivar una moneda en settings altera de inmediato las vistas administrativas que ya esten migradas.
- [ ] Los totales se convierten correctamente para todas las monedas visibles soportadas.
- [ ] Los documentos historicos no cambian por nuevas tasas.
- [ ] Los reportes y exportaciones reflejan el mismo modelo monetario.
- [ ] El sistema deja de depender de columnas fijas USD/VES en las superficies criticas migradas.

## Siguiente foco inmediato

- [x] Crear servicio base reutilizable.
- [x] Integrarlo primero en el reporte de ventas admin.
- [x] Extenderlo a dashboard y exportaciones de ventas.
- [x] Llevarlo a listados prioritarios y detalle de clientes.
- [x] Llevarlo al indice de clientes.
- [x] Preparar la primera base de persistencia historica.
- [x] Llevar snapshot monetario real a checkout y facturacion manual.
- [x] Extender la escritura transaccional a apartados y RMA.
- [x] Crear comando de backfill historico para documentos legacy.
- [x] Revisar pagos y movimientos relacionados fuera de invoice_payments.
- [ ] Revisar ahora cuentas por pagar y otras superficies financieras legacy.

## Avance actual

- [x] Documento maestro de seguimiento creado.
- [x] Servicio AdminMoneyService creado.
- [x] Pruebas unitarias iniciales creadas y validadas.
- [x] Primer reporte administrativo integrado al nuevo servicio.
- [x] Dashboard admin integrado al nuevo servicio.
- [x] Exportaciones de ventas integradas al nuevo servicio.
- [x] Listados administrativos prioritarios migrados parcialmente.
- [x] Indice de clientes integrado al nuevo servicio.
- [x] Detalle de cliente integrado al nuevo servicio.
- [x] Primera migracion de persistencia historica preparada.
- [x] Checkout y facturacion manual ya escriben snapshot monetario.
- [x] Apartados y RMA ya escriben snapshot monetario.
- [x] Comando de backfill historico agregado.
- [x] Credito administrativo y reportes de credito integrados al modelo multimoneda admin.
- [x] Credit movements ya guardan snapshot monetario y monto original.
- [x] Pagos y ajustes manuales de factura ya respetan moneda seleccionada y snapshot al persistir.
- [x] Backfill historico extendido a credit_movements e invoice_adjustments.
- [x] El comando de backfill ya genera reporte JSON de inconsistencias para revision manual.
- [x] Notificaciones administrativas ya usan criterio monetario documental en vez de USD fijo.
- [x] Dashboard del cliente ya usa totales documentales/snapshot en resumen e historial.
- [x] Correo de factura ya muestra total e items usando snapshot documental y moneda original.
- [x] Historial de compras en detalle de cliente admin ya usa totales documentales por factura.
- [x] Migraciones monetarias de facturas, apartados, RMA, credito y ajustes ejecutadas en la base actual.
- [x] Reporte de apartados ya usa total documental por snapshot y saldo operativo por moneda visible.
- [x] Backfill monetario historico ejecutado en la base actual con reporte JSON de incidencias generado.
- [x] Reporte de ventas por categoria ya agrega montos desde breakdown monetario historico por moneda visible.
- [x] Ranking de productos ya agrega montos desde breakdown monetario historico por moneda visible.
- [x] Indice de clientes ya suma gasto usando totales documentales por factura.
- [x] Listado y detalle de apartados ya muestran totales documentales y monto pagado por monedas visibles.
- [x] Listado y detalle de RMA ya muestran totales documentales por monedas visibles.
- [x] Creacion de RMA ya muestra facturas relacionadas usando total documental en la moneda visible.
- [x] Dashboard admin ya usa agregados documentales en series de ventas, top clientes y alertas monetarias.
- [x] Facturacion manual ya muestra apartados asociados usando total documental en la moneda visible.
- [x] Modal de facturas ya muestra subtotales de items y total final usando montos documentales cuando existen.
- [x] Resumen del modal de facturas ya no depende de envio fijo legacy y deriva subtotal/impuesto desde items y total documental.
- [x] Reporte global de inventario ya expone valorizacion por monedas visibles desde backend en vez de convertir solo visualmente.
- [x] Reporte de inventario por bodega ya expone valorizacion por monedas visibles desde backend en vez de convertir solo visualmente.
- [x] Exportaciones CSV, Excel y PDF de inventario ya usan columnas dinamicas segun monedas visibles en admin.
- [x] Documentacion formal de transicion legacy a snapshot multimoneda creada.
- [x] Feature test inicial para reporte de inventario y exportacion CSV validando monedas visibles agregado y pasando.
- [x] Indice de productos ya usa backend para KPI de inventario y precio unitario visible por moneda activa.
- [x] Inventario por producto ya usa backend para cards e historial monetario por moneda visible.
- [x] Kardex de inventario ya usa adminCurrencyContext y montos por movimiento calculados en backend.
- [x] Feature test de inventario cubre reporte global, CSV y Kardex con monedas visibles.
- [x] Detalle de apartado ya usa backend para precio unitario visible y subtotales documentales por item.
- [x] Detalle de RMA ya usa backend para precio unitario visible y subtotales documentales por item.
- [x] Formularios de creacion de factura, apartado y RMA ya usan precios visibles respaldados por backend sin alterar el payload operativo en USD.
- [x] Detalle de cliente ya calcula gasto acumulado desde facturas documentales y no desde lifetime_spent_usd legacy.
- [x] Reporte de ventas y PDF/CSV ya usan totales documentales historicos para metricas y montos por factura.
- [x] Exportacion Excel del reporte de ventas ya usa totales documentales historicos y no conversion administrativa directa.
- [x] Dashboard admin corrige fallback visible para respetar la moneda solicitada en tarjetas multimoneda.
- [x] Feature test del reporte de ventas agregado para fijar metricas y filas contra snapshots documentales historicos.
- [ ] Siguiente objetivo: cuentas por pagar y limpieza legacy restante.
