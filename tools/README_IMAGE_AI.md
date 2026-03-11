Instrucciones para el procesamiento local de imágenes (gratis)

Resumen
- El proyecto incluye `tools/image_caption.py` que usa el modelo BLIP (Salesforce/blip-image-captioning-base) para generar una descripción (caption) y etiquetas simples desde una imagen.
- El script es open-source y puede ejecutarse localmente sin pagar APIs externas. En CPU funciona, pero puede ser lento.

Requisitos (instalar en tu máquina / servidor)

1. Python 3.8+ instalado y accesible por el comando `python`.
2. Crear un virtualenv (recomendado):

```bash
Instrucciones para el procesamiento local de imágenes (gratis)

Resumen
- El proyecto incluye un servicio y utilidades para generar una `caption` y `tags` por cada imagen de producto usando modelos open-source (BLIP).
- Implementación: jobs Laravel (`ProcessProductImage`) despachan imágenes a un servicio FastAPI que carga BLIP una vez y responde `{caption,tags}`.

Requisitos
- PHP + Laravel (migraciones y cola configuradas).
- Python 3.8+ y pip.

Pasos generales (ordenados) — Ejemplo en Windows

1) Abrir terminal en la raíz del proyecto:

```powershell
cd C:\xampp\htdocs\sistema_inventario
```

2) Ejecutar migraciones para añadir columnas y/o tabla de jobs:

```powershell
php artisan migrate
# Si aún no tienes tabla jobs:
php artisan queue:table
php artisan migrate
```

3) Configurar `.env` (editar con tu editor):

```
QUEUE_CONNECTION=database
IMAGE_AI_URL=http://127.0.0.1:8001/process
```

4) Preparar Python (virtualenv recomendado) e instalar dependencias:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r tools/requirements.txt
# En Windows instala torch CPU si es necesario:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

5) Iniciar el servicio persistente (FastAPI). En una terminal separada:

```powershell
uvicorn tools.image_service:app --host 127.0.0.1 --port 8001 --workers 1
```

6) Iniciar el worker de Laravel para procesar jobs (en otra terminal):

```powershell
php artisan queue:work
```

7) Probar manualmente (crear un registro ProductImage para probar el flujo):

```powershell
php artisan tinker
>>> \App\Models\ProductImage::create(['product_id'=>1,'path'=>'products/ejemplo.jpg']);
```

Verifica que el worker haga la petición al servicio y luego la fila `product_images` tenga `caption`, `tags` y `ai_processed = 1`.

Comandos equivalentes (Linux / macOS)

```bash
cd /path/to/sistema_inventario
php artisan migrate
php artisan queue:table && php artisan migrate   # si hace falta
export QUEUE_CONNECTION=database
export IMAGE_AI_URL=http://127.0.0.1:8001/process
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r tools/requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
uvicorn tools.image_service:app --host 127.0.0.1 --port 8001 --workers 1
php artisan queue:work
```

Procesar imágenes existentes (re-dispatch)
- Si ya tienes imágenes y quieres procesarlas todas:

```bash
php artisan tinker
>>> \App\Models\ProductImage::where('ai_processed', false)->get()->each(function($img){ \App\Jobs\ProcessProductImage::dispatch($img->id); });
```

Notas y recomendaciones
- La primera carga del modelo descarga pesos (~200-400MB). Ten paciencia la primera vez.
- Mantén el servicio `tools/image_service.py` corriendo (supervisor, systemd o Windows service) para rendimiento.
- Ajusta `IMAGE_AI_URL` si expones el servicio en otro host/puerto.
- Si ves timeouts en jobs, aumenta `->timeout()` en `ProcessProductImage` o ajusta worker timeout.

Solución de problemas rápida
- Error: "model not loaded": revisa que `pip install -r tools/requirements.txt` terminó correctamente y revisa logs de `uvicorn`.
- Timeout o fallos HTTP: asegúrate que `uvicorn` escucha en `127.0.0.1:8001` y el firewall/antivirus no bloquea.

¿Quieres que añada también instrucciones para ejecutar el servicio como Docker container o que cree un comando artisan para re-enviar imágenes automáticamente? 
- Ejecuta un worker para procesar imágenes en background:

```bash
php artisan queue:work
```

El `ProductController` ahora despacha jobs que invocan el script `tools/image_caption.py` para generar `caption` y `tags` sin bloquear la petición.

Servicio persistente (recomendado para rendimiento)

- En lugar de ejecutar el script en cada job, puedes ejecutar un servicio persistente que cargue el modelo una sola vez. He incluido `tools/image_service.py` que corre un servidor FastAPI en el puerto `8001` por defecto.
- Instala dependencias (recomendado usar virtualenv):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install --upgrade pip
pip install -r tools/requirements.txt
# instalar torch CPU (si no está en wheels):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

- Ejecuta el servicio:

```bash
uvicorn tools.image_service:app --host 127.0.0.1 --port 8001 --workers 1
```

- Actualiza `.env` si usas una URL distinta:

```
IMAGE_AI_URL=http://127.0.0.1:8001/process
```

- El `Job` `ProcessProductImage` ahora llama al endpoint configurado en `IMAGE_AI_URL` y guarda el resultado.
