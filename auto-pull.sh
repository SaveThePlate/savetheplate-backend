#!/bin/bash

# Configuration auto-détectée
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR"

# Charger la configuration personnalisée si elle existe
if [ -f "$REPO_DIR/.autopull.env" ]; then
    source "$REPO_DIR/.autopull.env"
fi

LOG_FILE="$REPO_DIR/auto-pull.log"
BRANCH="${AUTO_PULL_BRANCH:-main}"  # Utilisez la variable d'env ou 'main' par défaut
LOCK_FILE="/tmp/auto-pull-backend-$(basename "$REPO_DIR").lock"
APP_NAME="${PM2_APP_NAME:-savetheplate-backend}"  # Nom de l'app PM2

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Vérifier si un autre processus est en cours
if [ -f "$LOCK_FILE" ]; then
    log "Un autre processus auto-pull est déjà en cours. Abandon."
    exit 1
fi

# Créer le fichier de verrouillage
touch "$LOCK_FILE"

# Nettoyage à la sortie
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

log "========================================="
log "Début de la vérification auto-pull backend"

# Se déplacer dans le répertoire du dépôt
cd "$REPO_DIR" || {
    log "ERREUR : Impossible d'accéder au répertoire $REPO_DIR"
    exit 1
}

# Vérifier que c'est bien un dépôt git
if [ ! -d .git ]; then
    log "ERREUR : $REPO_DIR n'est pas un dépôt git"
    exit 1
fi

# Récupérer les dernières informations du dépôt distant
log "Récupération des informations du dépôt distant..."
git fetch origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Vérifier s'il y a des changements
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/"$BRANCH")

log "Commit local  : $LOCAL"
log "Commit distant: $REMOTE"

if [ "$LOCAL" = "$REMOTE" ]; then
    log "Le dépôt est déjà à jour. Aucune action nécessaire."
    exit 0
fi

log "Nouveaux changements détectés ! Mise à jour en cours..."

# Sauvegarder les modifications locales si nécessaire
if ! git diff-index --quiet HEAD --; then
    log "ATTENTION : Modifications locales détectées. Stash en cours..."
    git stash save "Auto-stash avant pull $(date '+%Y-%m-%d %H:%M:%S')" 2>&1 | tee -a "$LOG_FILE"
fi

# Tirer les changements
log "Pull des changements depuis origin/$BRANCH..."
if git pull origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Pull réussi"
else
    log "✗ ERREUR lors du pull"
    exit 1
fi

# Installer les dépendances si package.json a changé
if git diff --name-only HEAD@{1} HEAD | grep -q "package.json\|package-lock.json"; then
    log "package.json modifié. Installation des dépendances..."
    npm install --legacy-peer-deps 2>&1 | tee -a "$LOG_FILE"
fi

# Générer le client Prisma si le schéma a changé
if git diff --name-only HEAD@{1} HEAD | grep -q "prisma/schema.prisma"; then
    log "Schéma Prisma modifié. Génération du client Prisma..."
    npx prisma generate 2>&1 | tee -a "$LOG_FILE"
    
    log "ATTENTION : Vérifiez si des migrations doivent être exécutées !"
    log "Exécutez manuellement : npx prisma migrate deploy"
fi

# Reconstruire l'application
log "Reconstruction de l'application..."
if npm run build 2>&1 | tee -a "$LOG_FILE"; then
    log "✓ Build réussi"
else
    log "✗ ERREUR lors du build"
    exit 1
fi

# Redémarrer l'application (ajustez selon votre méthode de déploiement)
log "Redémarrage de l'application..."

# Détection automatique du gestionnaire de processus
RESTARTED=0

# Option 1 : PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "$APP_NAME"; then
        log "Redémarrage via PM2 (app: $APP_NAME)..."
        pm2 restart "$APP_NAME" 2>&1 | tee -a "$LOG_FILE" && RESTARTED=1
    fi
fi

# Option 2 : Docker Compose (si fichier docker-compose présent)
if [ $RESTARTED -eq 0 ] && [ -f "$REPO_DIR/../docker-compose.yml" ]; then
    if docker-compose -f "$REPO_DIR/../docker-compose.yml" ps | grep -q backend; then
        log "Redémarrage via Docker Compose..."
        (cd "$REPO_DIR/.." && docker-compose restart backend) 2>&1 | tee -a "$LOG_FILE" && RESTARTED=1
    fi
fi

# Option 3 : Docker standalone
if [ $RESTARTED -eq 0 ] && command -v docker &> /dev/null; then
    CONTAINER_NAME="${DOCKER_CONTAINER_NAME:-savetheplate-backend}"
    if docker ps -q -f name="$CONTAINER_NAME" &> /dev/null; then
        log "Redémarrage du container Docker ($CONTAINER_NAME)..."
        docker restart "$CONTAINER_NAME" 2>&1 | tee -a "$LOG_FILE" && RESTARTED=1
    fi
fi

# Option 4 : systemd
if [ $RESTARTED -eq 0 ] && command -v systemctl &> /dev/null; then
    SERVICE_NAME="${SYSTEMD_SERVICE_NAME:-savetheplate-backend}"
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log "Redémarrage via systemd ($SERVICE_NAME)..."
        sudo systemctl restart "$SERVICE_NAME" 2>&1 | tee -a "$LOG_FILE" && RESTARTED=1
    fi
fi

if [ $RESTARTED -eq 0 ]; then
    log "⚠ ATTENTION : Aucun gestionnaire de processus détecté"
    log "L'application doit être redémarrée manuellement"
fi

log "✓ Mise à jour terminée avec succès"
log "========================================="

exit 0

