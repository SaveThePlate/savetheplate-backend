#!/bin/bash
# Script de déploiement automatique pour le backend
# Usage: ./deploy.sh [message de commit]

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Déploiement automatique du Backend${NC}"
echo ""

# Vérifier que nous sommes dans un repo git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Erreur: Ce n'est pas un dépôt git${NC}"
    exit 1
fi

# Obtenir le message de commit
COMMIT_MSG="${1:-Auto deploy backend: $(date '+%Y-%m-%d %H:%M:%S')}"

# Vérifier s'il y a des changements
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Aucun changement à commiter${NC}"
else
    echo -e "${BLUE}📝 Ajout des changements...${NC}"
    git add .
    
    echo -e "${BLUE}💾 Commit des changements...${NC}"
    git commit -m "$COMMIT_MSG"
fi

# Obtenir la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}🌿 Branche actuelle: ${CURRENT_BRANCH}${NC}"

# Push vers le dépôt distant
echo -e "${BLUE}📤 Push vers le dépôt distant...${NC}"
if git push origin "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✅ Push réussi!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Le déploiement automatique du backend va se déclencher via GitHub Actions${NC}"
    echo -e "${BLUE}💡 Vous pouvez suivre le déploiement sur:${NC}"
    echo -e "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
else
    echo -e "${RED}❌ Erreur lors du push${NC}"
    exit 1
fi

