#!/usr/bin/env bash
# Prompt Regression Gates — pre-commit / pre-deploy hook
#
# Usage :
#   - Pre-commit : copier dans .husky/pre-commit ou appeler depuis un hook existant
#   - Pre-deploy Replit : ajouter `"prebuild": "bash scripts/prompt-gates-pre-commit.sh"`
#     dans package.json (tourne automatiquement avant `next build`)
#
# Gates vérifiées :
#   - Catégorie A (vocabulaire interdit) — BLOQUANT
#   - Catégorie B (structure prompts) — BLOQUANT
#   - Catégorie C (room type override v55 P0-A) — BLOQUANT
#   - Catégorie D (input_fidelity v56) — BLOQUANT
#   - Catégorie E (snapshots 284 combinaisons) — REQUIS
#   - Catégorie F (schéma STYLE_VARIANTS) — BLOQUANT
#   - Catégorie G (sync StylePicker ≡ resolver) — BLOQUANT
#   - Catégorie H (cross-handler propagation) — BLOQUANT
#   - Catégorie I (override vs builder coherence, v59 #234) — BLOQUANT
#   - Catégorie J (action verbs strength, v59 #233) — BLOQUANT
#   - Catégorie K (full room_type coverage, v59) — BLOQUANT
#   - Catégorie L (TEMPORARY vs PERMANENT split, v59 #235) — BLOQUANT
#   - Catégorie M (wall art positive coverage, v59 #235) — BLOQUANT
#   - Catégorie N (narrow-room geometry gate, v59 #234) — BLOQUANT
#   - Catégorie O (inventory/CLEANUP alignment, v59 #233) — BLOQUANT
#   - Catégorie P (PROMPT_VERSION bump) — REQUIS
#
# Si une gate échoue, le script exit ≠ 0 → le hook refuse le commit / le build
# Replit échoue et le déploiement est bloqué.
#
# Durée attendue : < 5s (aucun appel API, tests purement string-based + snapshots).

set -euo pipefail

# Couleur (ignorée si non-tty)
if [ -t 1 ]; then
  BOLD=$(tput bold)
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  RESET=$(tput sgr0)
else
  BOLD=""
  RED=""
  GREEN=""
  YELLOW=""
  RESET=""
fi

echo "${BOLD}▶ Prompt Regression Gates — verification${RESET}"
echo ""

# Détection du répertoire racine du projet (supporte appel depuis sous-dossiers)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Les 6 fichiers de gates à lancer (v59 : ajout prompt-regression-v59-gates)
GATES_FILES=(
  "tests/unit/prompt-content-gates.test.ts"
  "tests/unit/prompt-structure-gates.test.ts"
  "tests/unit/prompt-room-type-gates.test.ts"
  "tests/unit/prompt-snapshot-gates.test.ts"
  "tests/unit/prompt-cross-handler-gates.test.ts"
  "tests/unit/prompt-regression-v59-gates.test.ts"
)

# Vérifie que chaque fichier existe avant de lancer
for file in "${GATES_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "${RED}✗ Gate file missing: $file${RESET}"
    echo "${YELLOW}  Skip-hook : ce fichier devrait exister. Vérifier l'intégrité du repo.${RESET}"
    exit 2
  fi
done

# Lance vitest run sur les 5 fichiers gates uniquement
# --reporter=default pour output lisible en CI
if npx vitest run "${GATES_FILES[@]}" --reporter=default; then
  echo ""
  echo "${GREEN}${BOLD}✓ All prompt regression gates passed${RESET}"
  exit 0
else
  exit_code=$?
  echo ""
  echo "${RED}${BOLD}✗ Prompt regression gates FAILED${RESET}"
  echo "${YELLOW}  Un bug de régression sur les prompts a été détecté.${RESET}"
  echo "${YELLOW}  Ne PAS committer — corriger d'abord le code ou les snapshots.${RESET}"
  echo "${YELLOW}  Si la modification est intentionnelle (changement de prompt) :${RESET}"
  echo "${YELLOW}    npx vitest run tests/unit/prompt-snapshot-gates.test.ts -u${RESET}"
  echo "${YELLOW}  puis review humain obligatoire du diff avant commit.${RESET}"
  exit "$exit_code"
fi
