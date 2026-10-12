#!/usr/bin/env bash
# Fails if any commit in the given range (or a single message file) credits an AI
# assistant as author or co-author. Usage:
#   scripts/check-attribution.sh <message-file>        # from the commit-msg hook
#   scripts/check-attribution.sh <base>..<head>         # in CI
set -euo pipefail

PATTERN='(co-authored-by:.*(claude|anthropic|copilot|chatgpt|openai))|(noreply@anthropic\.com)|(generated with \[?claude)|(claude-session:)'

if [[ -f "${1:-}" ]]; then
	if grep -Eiq "$PATTERN" "$1"; then
		echo "✗ Commit message contains AI attribution. Remove it and commit again:" >&2
		grep -Ein "$PATTERN" "$1" >&2
		exit 1
	fi
	exit 0
fi

range="${1:-HEAD}"
bad=0
while read -r sha; do
	[[ -z "$sha" ]] && continue
	body="$(git log -1 --format='%an <%ae>%n%cn <%ce>%n%B' "$sha")"
	if grep -Eiq "$PATTERN|^(claude|.*anthropic).* <" <<<"$body"; then
		echo "✗ $(git log -1 --format='%h %s' "$sha")" >&2
		grep -Ein "$PATTERN|^(claude|.*anthropic).* <" <<<"$body" | sed 's/^/    /' >&2
		bad=1
	fi
done < <(git rev-list "$range")

if [[ $bad -eq 1 ]]; then
	echo "AI attribution found in the commits above. Reword them before merging." >&2
	exit 1
fi
echo "✓ No AI attribution in $range"
