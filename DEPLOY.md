# Guía de despliegue — UTEC Gym

## Arquitectura

```
┌────────────────┐    ┌───────────────┐    ┌──────────────┐
│  App Alumno    │    │  Recepción    │    │  Backend     │
│  (Expo / RN)   │───▶│  (Vercel)     │───▶│  (EC2/ECS)   │
│  Celular       │    │  PC/iPad      │    │  FastAPI     │
└────────────────┘    └───────────────┘    └──────┬───────┘
                                                   │
                                            ┌──────▼───────┐
                                            │  PostgreSQL  │
                                            │  (AWS RDS)   │
                                            └──────────────┘
```

## 1. Base de datos — AWS RDS PostgreSQL

```bash
# Crear instancia RDS (free tier)
aws rds create-db-instance \
  --db-instance-identifier utec-gym-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16 \
  --master-username postgres \
  --master-user-password TU_PASSWORD_SEGURO \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 7 \
  --storage-type gp3
```

Esperar a que esté "available" y copiar el endpoint:
```bash
aws rds describe-db-instances --db-instance-identifier utec-gym-db \
  --query 'DBInstances[0].Endpoint.Address' --output text
```

## 2. Backend — EC2

```bash
# En la instancia EC2 (Amazon Linux 2023 / Ubuntu)
sudo yum install -y python3.12 python3.12-pip git  # o apt

git clone <tu-repo> /opt/utec-gym
cd /opt/utec-gym/backend
pip install -r requirements.txt

# Crear .env
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:TU_PASSWORD@<rds-endpoint>:5432/utec_gym
SECRET_KEY=<generar-con-openssl-rand-hex-32>
QR_SECRET_KEY=<generar-con-openssl-rand-hex-32>
APP_ENV=production
CORS_ORIGINS=https://utec-gym-reception.vercel.app,https://tu-dominio.com
EOF

# Correr migraciones
alembic upgrade head

# Iniciar con gunicorn + uvicorn workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

Para producción usar **systemd** o **Docker + ECS Fargate**.

## 3. Recepción web — Vercel

```bash
cd reception

# Crear .env.production
echo "VITE_API_URL=https://api.tu-dominio.com" > .env.production

# Deploy
npx vercel --prod
```

Variables de entorno en Vercel Dashboard:
- `VITE_API_URL` = URL pública del backend

## 4. App móvil — EAS Build

```bash
cd frontend

# Configurar la URL del backend
echo "EXPO_PUBLIC_API_URL=https://api.tu-dominio.com" > .env.production

# Build para Android
eas build --platform android --profile production

# Build para iOS
eas build --platform ios --profile production
```

## 5. Migraciones futuras

```bash
# Crear nueva migración tras cambiar modelos
cd backend
alembic revision --autogenerate -m "descripcion del cambio"

# Aplicar en producción
alembic upgrade head
```

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `SECRET_KEY` | JWT signing key (mínimo 32 chars) |
| `QR_SECRET_KEY` | QR JWT signing key (mínimo 32 chars) |
| `APP_ENV` | `development` o `production` |
| `CORS_ORIGINS` | Origins permitidos, separados por coma |
| `GYM_AUTO_KILL_MINUTES` | Timeout auto-kill (default: 120) |
| `USED_TOKEN_CLEANUP_INTERVAL_MINUTES` | Frecuencia de limpieza de JTI usados (default: 60) |
| `RATE_LIMIT_LOGIN` | slowapi string (default: `10/minute`) |
| `RATE_LIMIT_REGISTER` | slowapi string (default: `5/minute`) |
| `RATE_LIMIT_CHECKIN` | slowapi string (default: `60/minute`) |
| `RATE_LIMIT_REFRESH` | slowapi string (default: `30/minute`) |

## 6. Checklist pre-producción

- [ ] `APP_ENV=production` — el arranque falla si `SECRET_KEY` / `QR_SECRET_KEY` tienen valores de dev.
- [ ] Claves generadas con `openssl rand -hex 32` (una distinta para cada).
- [ ] `CORS_ORIGINS` con dominios reales; el regex dev se ignora en prod.
- [ ] RDS con `--backup-retention-period 7` y Multi-AZ si es crítico.
- [ ] Security group RDS sólo abre 5432 al SG del EC2/ECS (nunca público).
- [ ] HTTPS terminado en ALB o CloudFront; backend detrás de proxy.
- [ ] `/health` y `/ready` conectados al target group del LB.
- [ ] Scheduler corriendo: `auto_kill` y `cleanup_used_tokens` (ver logs al arrancar).
- [ ] Rate limits validados (10 logins / minuto por IP por default).
- [ ] Geofence del `GymConfig` seteado (`geofence_lat`, `geofence_lng`, `geofence_radius_m`).
- [ ] Dockerfile corre como usuario `app` (no root) y tiene HEALTHCHECK activo.
- [ ] `.env` NO commitado; usar Secrets Manager / SSM Parameter Store.

## 7. Demo / Seed masivo

```bash
cd backend
python scripts/seed_demo.py
# Crea: 15 facultades, 120 alumnos, 4 staff, ~4700 sesiones (90 días), 12-18 activas.
# Credenciales demo (password: Utec2024!):
#   recepcion@utec.pe      — admin_staff
#   entrenador1@utec.pe    — trainer
#   a20200001@utec.edu.pe  — student
```

## 8. Arranque local (dev)

```bash
# 1. Secrets
cp .env.example .env
# (editá SECRET_KEY y QR_SECRET_KEY con openssl rand -hex 32)

# 2. Docker compose levanta db + api
docker compose up -d

# 3. Seed demo
docker compose exec api python scripts/seed_demo.py

# 4. Reception web
cd reception && npm install && npm run dev   # http://localhost:3000

# 5. Mobile (Expo)
cd frontend && npm install && npm start
```
