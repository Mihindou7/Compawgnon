#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Compawgnon — Initialisation du serveur Hetzner (Ubuntu 24.04)
# À exécuter UNE SEULE FOIS en root sur le serveur fraîchement créé :
#   curl -fsSL https://raw.githubusercontent.com/TON_USER/compawgnon/main/deploy/setup-server.sh | bash
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="git@github.com:TON_USER/compawgnon.git"   # Remplacer par ton dépôt
DEPLOY_DIR="/opt/compawgnon"
JWT_DIR="/opt/compawgnon/jwt"

# ── 1. Mise à jour du système ─────────────────────────────────────────────────
echo ">>> Mise à jour des paquets..."
apt-get update -q && apt-get upgrade -y -q

# ── 2. Installation de Docker ─────────────────────────────────────────────────
echo ">>> Installation de Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

# ── 3. Firewall (UFW) ────────────────────────────────────────────────────────
echo ">>> Configuration du pare-feu..."
apt-get install -y -q ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3
ufw --force enable

# ── 4. Clonage du dépôt ──────────────────────────────────────────────────────
echo ">>> Clonage du dépôt dans $DEPLOY_DIR..."
if [ ! -d "$DEPLOY_DIR/.git" ]; then
  git clone "$REPO_URL" "$DEPLOY_DIR"
else
  echo "    Dépôt déjà cloné, skip."
fi

# ── 5. Génération des clés JWT RSA ───────────────────────────────────────────
echo ">>> Génération des clés JWT..."
mkdir -p "$JWT_DIR"
chmod 750 "$JWT_DIR"

if [ ! -f "$JWT_DIR/private.pem" ]; then
  # Demander la passphrase (sera stockée dans .env)
  read -rsp "Entrer la JWT_PASSPHRASE (même valeur que dans .env) : " JWT_PASSPHRASE
  echo ""
  openssl genpkey -algorithm RSA -out "$JWT_DIR/private.pem" \
    -aes256 -pass pass:"$JWT_PASSPHRASE" -pkeyopt rsa_keygen_bits:4096
  openssl pkey -in "$JWT_DIR/private.pem" -out "$JWT_DIR/public.pem" \
    -pubout -pass pass:"$JWT_PASSPHRASE"
  chmod 640 "$JWT_DIR/private.pem"
  chmod 644 "$JWT_DIR/public.pem"
  echo "    Clés JWT générées dans $JWT_DIR"
else
  echo "    Clés JWT déjà présentes, skip."
fi

# ── 6. Fichier .env ───────────────────────────────────────────────────────────
echo ">>> Configuration du fichier .env..."
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  cp "$DEPLOY_DIR/.env.prod.example" "$DEPLOY_DIR/.env"
  echo ""
  echo "╔══════════════════════════════════════════════════════════════════╗"
  echo "║  IMPORTANT : édite $DEPLOY_DIR/.env avant de lancer les         ║"
  echo "║  conteneurs. Remplace toutes les valeurs CHANGE_ME et TON_*.    ║"
  echo "╚══════════════════════════════════════════════════════════════════╝"
  echo ""
  read -rp "Appuie sur Entrée une fois le .env rempli..."
else
  echo "    .env déjà présent, skip."
fi

# ── 7. Premier démarrage ─────────────────────────────────────────────────────
echo ">>> Démarrage des conteneurs (premier build — peut prendre 5-10 min)..."
cd "$DEPLOY_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "✓ Setup terminé !"
echo "  Site accessible sur : https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
echo "  Logs : docker compose -f docker-compose.prod.yml logs -f"
