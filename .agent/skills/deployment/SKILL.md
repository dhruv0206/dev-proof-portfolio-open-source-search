---
name: deployment
description: Deploy DevProof to Vercel (frontend) and GCP Cloud Run (backend)
---

# Deployment Skill

## Frontend (Vercel)

### Environment Variables
```
NEXT_PUBLIC_API_URL=https://api.devproof.io
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
```

### Deploy
```bash
cd web-platform
vercel --prod
```

## Backend (GCP Cloud Run)

### Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
EXPOSE 8080
```

### Deploy
```bash
cd ai-engine
gcloud builds submit --tag gcr.io/PROJECT/devproof-api
gcloud run deploy devproof-api \
  --image gcr.io/PROJECT/devproof-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Checklist
- [ ] Environment variables configured
- [ ] CORS set for production domains
- [ ] All tests passing
