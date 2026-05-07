# Dockerfile para el servicio de IA de imágenes (FastAPI + BLIP)
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "image_service:app", "--host", "0.0.0.0", "--port", "8001"]
