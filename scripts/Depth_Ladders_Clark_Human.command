#!/bin/bash
# Double-click launcher — Clark human smoke for Depth/Ladders widget.
set -euo pipefail

REPO="${WHINFELL_TC_ROOT:-$HOME/Desktop/Whinfell_Transmission_Control}"
cd "$REPO"

echo "=== Depth/Ladders — Clark Human Walk-through ==="
echo "repo=$REPO"

node tests/depth_ladders_widget_clark_human.mjs

echo ""
read -r -p "Press Enter to close…" _