FROM python:3.11-slim

WORKDIR /app

# Copy from project root context with -f ai-engine/Dockerfile
COPY ai-engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai-engine/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
