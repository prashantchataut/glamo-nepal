#!/usr/bin/env bash
#
# GLAMO Nepal — Apply Critical Bug Fixes
#
# Usage:
#   cd /path/to/your/glamo-nepal-repo
#   bash /path/to/extracted/zip/apply-changes.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"

echo "============================================"
echo "  GLAMO Nepal — Applying Critical Fixes"
echo "============================================"
echo "Source:  $SCRIPT_DIR"
echo "Target:  $TARGET_DIR"
echo ""

# Safety check — make sure we're in a glamo-nepal repo
if [ ! -f "package.json" ] || [ ! -d "src" ] || [ ! -d "backend" ]; then
  echo "ERROR: Run this script from the ROOT of your glamo-nepal repo."
  echo "       (Expected to find package.json, src/, and backend/ here)"
  exit 1
fi

echo "→ Copying fixed files..."
# Use rsync if available, otherwise cp -r
if command -v rsync &> /dev/null; then
  rsync -av --exclude='apply-changes.sh' --exclude='README-CHANGES.md' "$SCRIPT_DIR/" "$TARGET_DIR/"
else
  # Fallback: copy each file individually
  find "$SCRIPT_DIR" -type f ! -name 'apply-changes.sh' ! -name 'README-CHANGES.md' | while read -r src_file; do
    rel_path="${src_file#$SCRIPT_DIR/}"
    dest_file="$TARGET_DIR/$rel_path"
    mkdir -p "$(dirname "$dest_file")"
    cp "$src_file" "$dest_file"
    echo "  ✓ $rel_path"
  done
fi

echo ""
echo "→ Removing setup wizard files..."
DELETED=0
for f in \
  "src/app/admin/setup/page.tsx" \
  "src/components/admin/setup/SetupWizardView.tsx"; do
  if [ -f "$TARGET_DIR/$f" ]; then
    rm "$TARGET_DIR/$f"
    echo "  ✓ Deleted: $f"
    DELETED=$((DELETED + 1))
  fi
done
# Remove empty setup directories
rmdir "$TARGET_DIR/src/app/admin/setup" 2>/dev/null && echo "  ✓ Removed empty: src/app/admin/setup/"
rmdir "$TARGET_DIR/src/components/admin/setup" 2>/dev/null && echo "  ✓ Removed empty: src/components/admin/setup/"

echo ""
echo "============================================"
echo "  Done! $DELETED setup-wizard files deleted."
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. bun install        (or npm install)"
echo "  2. bun run typecheck  (should show 0 errors)"
echo "  3. bun run lint       (should show 0 errors)"
echo "  4. git add -A && git commit -m 'Fix critical bugs' && git push"
echo ""
