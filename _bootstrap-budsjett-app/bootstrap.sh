#!/usr/bin/env bash
# Bootstrap-skript for å opprette lmfaole/budsjett-app fra denne snapshoten.
# Kjør én gang fra et tomt arbeidskatalog (f.eks. ~/git):
#
#   curl -sSL https://raw.githubusercontent.com/lmfaole/hjem/bootstrap-budsjett-app/_bootstrap-budsjett-app/bootstrap.sh | bash
#
# Eller, etter å ha klonet hjem-bootstrap-branchen, kjør den lokalt:
#
#   bash _bootstrap-budsjett-app/bootstrap.sh

set -euo pipefail

REPO_NAME="budsjett-app"
REPO_OWNER="lmfaole"
TARGET_DIR="${TARGET_DIR:-${HOME}/git/${REPO_NAME}}"
HJEM_REMOTE="https://github.com/${REPO_OWNER}/hjem.git"
BOOTSTRAP_BRANCH="bootstrap-budsjett-app"
BOOTSTRAP_PREFIX="_bootstrap-budsjett-app"

if [ -e "${TARGET_DIR}" ]; then
  echo "FEIL: ${TARGET_DIR} eksisterer allerede. Slett den eller sett TARGET_DIR til en annen sti." >&2
  exit 1
fi

for cmd in git gh; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    echo "FEIL: ${cmd} er ikke installert." >&2
    exit 1
  fi
done

echo "-> Henter snapshot fra hjem (branch ${BOOTSTRAP_BRANCH})"
mkdir -p "$(dirname "${TARGET_DIR}")"
git clone --depth 1 --branch "${BOOTSTRAP_BRANCH}" "${HJEM_REMOTE}" "${TARGET_DIR}.tmp"
mv "${TARGET_DIR}.tmp/${BOOTSTRAP_PREFIX}" "${TARGET_DIR}"
rm -rf "${TARGET_DIR}.tmp"

cd "${TARGET_DIR}"

echo "-> Initialiserer git"
git init -q
git branch -M main
git add .
git commit -q -m "Init budsjett-app — splittet ut fra lmfaole/hjem"

echo "-> Oppretter ${REPO_OWNER}/${REPO_NAME} på GitHub"
gh repo create "${REPO_OWNER}/${REPO_NAME}" --private --description "Personlig budsjett-dashboard på budsjett.lmfaole.party" --source=. --remote=origin --push

cat <<EOF

========================================
Ferdig! Repoet er klart i: ${TARGET_DIR}

Neste steg:
  cd ${TARGET_DIR}
  npm install
  npm run typecheck && npm run test    # 25 tester skal passere
  npm run deploy                        # registrerer budsjett.lmfaole.party på ny worker

Deretter merger du PR #3 i lmfaole/hjem og deployer hjem-workeren.
========================================
EOF
