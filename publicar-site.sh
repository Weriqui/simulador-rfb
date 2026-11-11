#!/usr/bin/env bash
# Atualiza o site (GitHub Pages, branch gh-pages) com o conteúdo atual de simulador-basico/.
# Uso (Git Bash, Linux ou macOS):  ./publicar-site.sh
# O GitHub publica sozinho cada envio ao branch gh-pages (cerca de 1 minuto depois).
set -euo pipefail
cd "$(dirname "$0")"

node testes/verificar-motores.js            # não publica se os motores divergirem das ferramentas oficiais
versao=$(git rev-parse --short HEAD)
git fetch -q origin gh-pages
tmp=$(mktemp -d)
trap 'git worktree remove --force "$tmp" >/dev/null 2>&1 || true' EXIT
git worktree add -q -B gh-pages "$tmp" origin/gh-pages

cd "$tmp"
git rm -rq --ignore-unmatch .
cp -r "$OLDPWD"/simulador-basico/. .        # páginas, scripts, estilo.css e fontes/
touch .nojekyll
git add -A
if git diff --cached --quiet; then
    echo "O site já está igual a simulador-basico/ ($versao). Nada a publicar."
else
    git commit -q -m "Site: simulador-basico/ da versão $versao"
    git push -q origin gh-pages
    echo "Publicado ($versao). Em cerca de 1 minuto: https://weriqui.github.io/simulador-rfb/"
fi
