# ClipMind AI — Deployment Guide

Covers GitHub setup and deployment to AWS or Azure. The application is already
container-ready; nothing in the code needs to change to deploy it.

> **Status:** these steps have **not** been executed. Docker is verified locally;
> the cloud steps below are the intended procedure, to be run when you are ready.

---

## Part 1 — Git & GitHub

Neither project is currently under version control. Initialise both.

### 1.1 Verify nothing secret is tracked

Both `.gitignore` files already exclude `.env`, `.env.docker`, `media/`,
`logs/`, `node_modules/`, virtualenvs and build output. Confirm before the
first commit:

```bash
cd clip_mind_AI_Backend
git init
git add -A
git status --short | grep -E "\.env|\.venv|media/|node_modules" || echo "clean — no secrets staged"
```

If anything sensitive appears, add it to `.gitignore` and `git reset` before
committing.

Also remove the stray test video from the repo root:

```bash
rm "Bairan [0oumFBCLw3s].mp4"
```

### 1.2 Backend repository

```bash
cd clip_mind_AI_Backend
git init -b main
git add -A
git commit -m "ClipMind AI backend: RBAC, roles, sharing, analytics, admin module, Docker"
gh repo create clipmind-ai-backend --private --source=. --push
```

### 1.3 Frontend repository

```bash
cd ../clip_mind_AI
git init -b main
git add -A
git commit -m "ClipMind AI frontend: role-based dashboards, learner/educator/admin modules"
gh repo create clipmind-ai-frontend --private --source=. --push
```

### 1.4 Branching for ongoing work

```bash
git checkout -b feature/<name>
# ... work ...
git push -u origin feature/<name>
gh pr create --fill
```

---

## Part 2 — AWS deployment

### 2.1 Sizing and cost

Whisper and the LLM run through the Groq API, so **no GPU instance is needed**.

| Component | Recommendation | Approx. monthly (us-east-1) |
| --- | --- | --- |
| ECS Fargate — web | 0.5 vCPU / 1 GB × 1 | ~$18 |
| ECS Fargate — worker | 1 vCPU / 2 GB × 1 | ~$36 |
| RDS PostgreSQL | `db.t4g.micro`, 20 GB gp3 | ~$15 |
| ElastiCache Redis | `cache.t4g.micro` | ~$12 |
| S3 (media) | 50 GB + requests | ~$2 |
| ALB | 1 load balancer | ~$18 |
| CloudFront + S3 (frontend) | low traffic | ~$2 |
| **Total** | | **≈ $103/month** |

Cheaper alternative for a demo: a single `t3.medium` EC2 running
`docker compose` (~$30/month all-in). Use that for the internship demo; the
ECS layout above is the production shape.

**Cost drivers to watch:** video storage grows without bound — set an S3
lifecycle rule. FFmpeg transcoding is CPU-bound, so keep the worker on its own
task or it will starve API requests.

### 2.2 Push images to ECR

```bash
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

aws ecr create-repository --repository-name clipmind-backend
aws ecr create-repository --repository-name clipmind-frontend

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR

# Fargate runs linux/amd64 — build for it explicitly from an ARM Mac.
cd clip_mind_AI_Backend
docker build --platform linux/amd64 -t $ECR/clipmind-backend:latest .
docker push $ECR/clipmind-backend:latest

cd ../clip_mind_AI
docker build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  -t $ECR/clipmind-frontend:latest .
docker push $ECR/clipmind-frontend:latest
```

> `VITE_API_URL` is baked in at build time. Rebuild the frontend image whenever
> the API hostname changes.

### 2.3 Managed data services

```bash
aws rds create-db-instance \
  --db-instance-identifier clipmind-db \
  --db-instance-class db.t4g.micro \
  --engine postgres --engine-version 16 \
  --allocated-storage 20 --storage-type gp3 \
  --master-username postgres \
  --master-user-password "$(openssl rand -base64 24)" \
  --backup-retention-period 7 --no-publicly-accessible

aws elasticache create-cache-cluster \
  --cache-cluster-id clipmind-redis \
  --engine redis --cache-node-type cache.t4g.micro --num-cache-nodes 1
```

Store the generated password immediately in Secrets Manager — it is not
retrievable afterwards.

### 2.4 Secrets

```bash
aws secretsmanager create-secret --name clipmind/prod --secret-string '{
  "SECRET_KEY":"<64-char random>",
  "DB_PASSWORD":"<rds password>",
  "GROQ_API_KEY":"<key>",
  "GEMINI_API_KEY":"<key>",
  "EMAIL_HOST_PASSWORD":"<app password>"
}'
```

Reference them in the task definition via `secrets[].valueFrom` so they never
appear in plaintext environment variables.

### 2.5 ECS services

Create two services from the same backend image:

| Service | Command | Env |
| --- | --- | --- |
| `clipmind-web` | default (gunicorn) | `RUN_MIGRATIONS=true` |
| `clipmind-worker` | `celery -A config worker --loglevel=info` | `RUN_MIGRATIONS=false` |

Only the web service may migrate. Non-secret environment values:

```
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com
SECURE_SSL_REDIRECT=True
DB_HOST=<rds endpoint>
DB_NAME=clipmind_ai
DB_USER=postgres
REDIS_URL=redis://<elasticache endpoint>:6379/0
REDIS_CACHE_URL=redis://<elasticache endpoint>:6379/1
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
```

Point the ALB target group health check at **`/health/`** (it verifies database
and cache reachability and returns 503 when either is down).

TLS terminates at the ALB. `SECURE_PROXY_SSL_HEADER` is already configured, so
Django will correctly detect HTTPS behind the load balancer.

### 2.6 Media on S3

Container volumes are ephemeral on Fargate. Add S3 storage before real use:

```bash
pip install django-storages boto3     # add to requirements.txt
```

```python
# settings.py
STORAGES["default"] = {"BACKEND": "storages.backends.s3.S3Storage"}
AWS_STORAGE_BUCKET_NAME = config("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = config("AWS_REGION", default="us-east-1")
AWS_QUERYSTRING_AUTH = True          # keep media private (matches signed-URL model)
```

Grant the task role `s3:GetObject`/`PutObject`/`DeleteObject` on that bucket
only. Add a lifecycle rule to expire or transition old media to Glacier.

### 2.7 Frontend

Either run the nginx image as a third ECS service behind the same ALB, or —
cheaper and faster — upload the static build to S3 + CloudFront:

```bash
cd clip_mind_AI
VITE_API_URL=https://api.yourdomain.com npm run build
aws s3 sync dist/ s3://clipmind-frontend --delete
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

Configure CloudFront to return `/index.html` for 403/404 so client-side routes
such as `/shared/<token>` work on a hard refresh.

### 2.8 Rollback

```bash
# Roll back to the previous task definition revision
aws ecs update-service --cluster clipmind --service clipmind-web \
  --task-definition clipmind-web:<previous-revision>
```

**Risks to plan for**

- *Migrations are not automatically reversible.* Take an RDS snapshot before
  deploying a release containing schema changes; rolling the image back does
  not roll the schema back.
- Deploy the worker **after** the web service when a release adds a task
  signature, so the queue never holds messages the worker cannot parse.
- Keep one release of backward compatibility in the API — during a rolling
  deploy both versions serve traffic simultaneously.

---

## Part 3 — Azure deployment

### 3.1 Provision

```bash
az group create --name clipmind-rg --location eastus

az postgres flexible-server create \
  --resource-group clipmind-rg --name clipmind-db \
  --tier Burstable --sku-name Standard_B1ms \
  --storage-size 32 --version 16 \
  --admin-user pgadmin --admin-password "<strong password>"

az redis create \
  --resource-group clipmind-rg --name clipmind-redis \
  --sku Basic --vm-size c0

az acr create --resource-group clipmind-rg --name clipmindacr --sku Basic
```

### 3.2 Build and push

```bash
az acr login --name clipmindacr

cd clip_mind_AI_Backend
docker build --platform linux/amd64 -t clipmindacr.azurecr.io/backend:latest .
docker push clipmindacr.azurecr.io/backend:latest

cd ../clip_mind_AI
docker build --platform linux/amd64 \
  --build-arg VITE_API_URL=https://clipmind-api.azurewebsites.net \
  -t clipmindacr.azurecr.io/frontend:latest .
docker push clipmindacr.azurecr.io/frontend:latest
```

### 3.3 Container Apps

```bash
az containerapp env create --name clipmind-env --resource-group clipmind-rg --location eastus

# Web (public, migrates on boot)
az containerapp create \
  --name clipmind-web --resource-group clipmind-rg --environment clipmind-env \
  --image clipmindacr.azurecr.io/backend:latest \
  --target-port 8000 --ingress external \
  --min-replicas 1 --max-replicas 3 \
  --env-vars DEBUG=False RUN_MIGRATIONS=true DB_HOST=... REDIS_URL=... \
  --secrets secret-key=... groq-key=...

# Worker (internal, never migrates)
az containerapp create \
  --name clipmind-worker --resource-group clipmind-rg --environment clipmind-env \
  --image clipmindacr.azurecr.io/backend:latest \
  --min-replicas 1 --max-replicas 2 \
  --command "celery" --args "-A,config,worker,--loglevel=info" \
  --env-vars RUN_MIGRATIONS=false ...
```

Set the health probe path to `/health/`. Use Azure Blob Storage for media via
`django-storages[azure]`, mirroring the S3 setup above.

### 3.4 Rollback

```bash
az containerapp revision list --name clipmind-web --resource-group clipmind-rg -o table
az containerapp revision activate --revision <previous-revision> \
  --resource-group clipmind-rg
```

Container Apps keeps previous revisions, so rollback is near-instant — but the
same migration caveat applies: snapshot the database first.

---

## Part 4 — Pre-deployment checklist

- [ ] `SECRET_KEY` is a fresh 64-character random value (not the dev default)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS` lists only real hostnames
- [ ] `SECURE_SSL_REDIRECT=True` once TLS is terminating
- [ ] `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` list only your frontend origin
- [ ] AI keys stored in a secrets manager, never in environment plaintext
- [ ] Media on S3 / Blob Storage, not a container volume
- [ ] Database backups and retention enabled
- [ ] Frontend rebuilt with the production `VITE_API_URL`
- [ ] `python manage.py check --deploy` reports no issues
- [ ] Database snapshot taken immediately before a migration-bearing release
