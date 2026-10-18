#!/bin/zsh
# Run this yourself in Terminal. Do not paste your key into chat or the app.
set -e
cd -- "${0:A:h:h}"
if command -v lsof >/dev/null && lsof -tiTCP:5188 -sTCP:LISTEN >/dev/null; then
  printf 'Port 5188 is occupied. Stop only this app’s existing server before starting hosted mode.\n'
  exit 1
fi
read -rs 'GEMINI_API_KEY?Enter GEMINI_API_KEY privately (input is hidden): '
printf '\n'
if [[ -z "$GEMINI_API_KEY" ]]; then
  printf 'No key entered. Nothing was started.\n'
  exit 1
fi
export GEMINI_API_KEY
exec npm run dev
