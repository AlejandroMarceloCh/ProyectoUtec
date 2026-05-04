#!/usr/bin/env bash
# Deploy v8 a AWS — one-shot. Asume que la AWS Academy lab está prendida.
#
# Pre-requisitos:
# - SSH key en ~/.ssh/utec-gym.pem
# - IP elástica del EC2: 34.231.58.28 (verificar si cambió cuando reinicies la lab)
# - Backend cambios y scanner dist YA listos en local (este repo)
#
# Uso:
#   bash deploy_v8.sh
#
# Si la IP del EC2 cambió, edita EC2_IP abajo y reintenta.

set -e

EC2_IP="${EC2_IP:-34.231.58.28}"
KEY="${KEY:-$HOME/.ssh/utec-gym.pem}"
EC2="ec2-user@${EC2_IP}"
BACKEND_DIR="$HOME/Desktop/PROYECTOS_2026/ProyectoUtec/backend"
SCANNER_DIR="$HOME/Desktop/PROYECTOS_2026/ProyectoUtec/scanner"

# ---------- 0) Health check ----------
echo "── 0/8 Verificar EC2 alcanzable ──"
if ! nc -z -w 5 "$EC2_IP" 22 2>/dev/null; then
  echo "ERROR: SSH a $EC2_IP timeout. ¿Está prendida la lab? ¿IP cambió?"
  echo "Si cambió: EC2_IP=NUEVA_IP bash deploy_v8.sh"
  exit 1
fi
echo "   SSH OK"

# ---------- 1) Limpiar AppleDouble localmente ----------
echo "── 1/8 Purgar AppleDouble (._foo.py) — crashean alembic ──"
find "$BACKEND_DIR" -name "._*" -delete 2>/dev/null || true
find "$SCANNER_DIR/dist" -name "._*" -delete 2>/dev/null || true
echo "   OK"

# ---------- 2) Bundle backend + scanner ----------
echo "── 2/8 Crear bundles ──"
tar -czf /tmp/utec-v8-backend.tgz \
  -C "$BACKEND_DIR" \
    app/api/v1/qr.py \
    app/api/v1/sessions.py \
    app/api/v1/users.py \
    app/api/v1/auth.py \
    app/api/v1/routines.py \
    app/schemas/session.py \
    app/schemas/auth.py \
    app/core/security.py \
    app/core/scheduler.py \
    app/models/qr_code.py \
    app/models/user.py \
    app/models/user_metrics.py \
    app/models/__init__.py \
    alembic/versions/c3d4e5f6a7b8_qr_codes_table.py \
    alembic/versions/d4e5f6a7b8c9_user_schedule_prefs.py \
    requirements.txt \
    scripts/seed_demo_v8.py \
    tests/test_sessions.py \
    tests/test_security.py \
    tests/test_analytics.py \
    tests/test_routines_recommended.py
tar -czf /tmp/utec-v8-scanner.tgz -C "$SCANNER_DIR/dist" .
echo "   backend: $(ls -lh /tmp/utec-v8-backend.tgz | awk '{print $5}')"
echo "   scanner: $(ls -lh /tmp/utec-v8-scanner.tgz | awk '{print $5}')"

# ---------- 3) SCP ----------
echo "── 3/8 SCP a EC2 ──"
scp -i "$KEY" -o StrictHostKeyChecking=no \
  /tmp/utec-v8-backend.tgz /tmp/utec-v8-scanner.tgz \
  "$EC2:/tmp/" >/dev/null
echo "   OK"

# ---------- 4) Tag rollback + extract + rebuild ----------
echo "── 4/8 Tag rollback + extract + rebuild imagen ──"
ssh -i "$KEY" "$EC2" '
  set -e
  echo "  Tag imagen actual..."
  docker tag utec-gym-api utec-gym-api:rollback-pre-v8 2>/dev/null || true

  echo "  Backup migration anterior..."
  cp -r ~/ProyectoUtec/backend/alembic/versions /tmp/versions-backup-$(date +%s)

  echo "  Extract bundle..."
  cd ~/ProyectoUtec/backend
  tar -xzf /tmp/utec-v8-backend.tgz
  find . -name "._*" -delete 2>/dev/null || true

  echo "  Rebuild imagen utec-gym-api..."
  docker build -t utec-gym-api . 2>&1 | tail -3
'

# ---------- 5) Recrear container ----------
echo "── 5/8 Recrear container con env preservado ──"
ssh -i "$KEY" "$EC2" '
  set -e
  ENVS=$(docker inspect api --format "{{range .Config.Env}}-e \"{{.}}\" {{end}}")
  docker stop api && docker rm api
  bash -c "docker run -d --name api -p 8000:8000 $ENVS --restart unless-stopped utec-gym-api"
  sleep 6
  docker ps --format "{{.Names}} {{.Status}}" | grep api
'

# ---------- 6) Migration alembic ----------
echo "── 6/8 alembic upgrade head ──"
ssh -i "$KEY" "$EC2" '
  docker exec api alembic upgrade head 2>&1 | tail -5
  echo "  Verificar tabla user_metrics:"
  docker exec api python -c "
from app.db.session import SessionLocal
from sqlalchemy import inspect
db = SessionLocal()
ins = inspect(db.bind)
print(\"  user_metrics existe:\", \"user_metrics\" in ins.get_table_names())
print(\"  qr_codes existe:\", \"qr_codes\" in ins.get_table_names())
print(\"  used_tokens NO existe:\", \"used_tokens\" not in ins.get_table_names())
"
'

# ---------- 7) Inyectar seed demo ----------
echo "── 7/8 Inyectar 30 alumnos demo (idempotente) ──"
ssh -i "$KEY" "$EC2" 'docker exec api python scripts/seed_demo_v8.py'

# ---------- 8) Atomic swap del scanner ----------
echo "── 8/8 Atomic swap del scanner web ──"
ssh -i "$KEY" "$EC2" '
  set -e
  mkdir -p /tmp/scanner-new && rm -rf /tmp/scanner-new/*
  tar -xzf /tmp/utec-v8-scanner.tgz -C /tmp/scanner-new
  sudo mv /var/www/scanner /var/www/scanner-pre-v8-$(date +%s)
  sudo mv /tmp/scanner-new /var/www/scanner
  sudo chown -R root:root /var/www/scanner
'

# ---------- Smoke test final ----------
echo
echo "── ✓ Deploy completo. Smoke test: ──"
sleep 3
TOKEN=$(curl -s -X POST https://utec-gym.duckdns.org/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a20240101@utec.edu.pe","password":"Utec2024!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
echo "  GET /qr/generate:"
curl -s -H "Authorization: Bearer $TOKEN" https://utec-gym.duckdns.org/api/v1/qr/generate | head -c 200
echo
echo "  GET /routines/recommended (debe responder con plan):"
curl -s -H "Authorization: Bearer $TOKEN" https://utec-gym.duckdns.org/api/v1/routines/recommended \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"  dias={d.get('dias_semana')} enfoque={d.get('enfoque')} minutes={d.get('minutes_per_session')} dias_en_rutina={len(d.get('rutina',{}))}\")"
echo
echo "  GET /users/me (preferencias persistidas):"
curl -s -H "Authorization: Bearer $TOKEN" https://utec-gym.duckdns.org/api/v1/users/me \
  | python3 -m json.tool

echo
echo "═══════════════════════════════════════════════"
echo "  DEPLOY v8 OK"
echo "  Scanner: https://utec-gym.duckdns.org/scanner/"
echo "  Recepción: https://utec-gym.duckdns.org/recepcion/"
echo "  Login alumno demo: a20240101@utec.edu.pe / Utec2024!"
echo "  Login scanner: entrenador1@utec.pe / Utec2024!"
echo "  Login recepción: recepcion@utec.pe / Utec2024!"
echo "═══════════════════════════════════════════════"
echo
echo "Si algo falla, rollback con:"
echo "  ssh -i ~/.ssh/utec-gym.pem $EC2 'docker stop api && docker rm api && \\"
echo "    docker tag utec-gym-api:rollback-pre-v8 utec-gym-api && \\"
echo "    docker run -d --name api -p 8000:8000 \\\$ENVS utec-gym-api'"
