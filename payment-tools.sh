#!/bin/bash

# EasyMove Man and Van Payment Tools Runner
# A simple script to run payment debugging and diagnostic tools

PRINT_USAGE() {
  echo "Usage: ./payment-tools.sh [command]"
  echo ""
  echo "Available commands:"
  echo "  diagnose    - Run payment diagnostics to check configuration"
  echo "  fix         - Run interactive payment fix tool"
  echo "  prepare     - Prepare for deployment"
  echo "  help        - Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./payment-tools.sh diagnose"
  echo "  ./payment-tools.sh fix"
}

# Make scripts executable if they aren't already
chmod +x payment-diagnostics.js 2>/dev/null
chmod +x payment-fix.js 2>/dev/null

# Process command line arguments
if [ $# -eq 0 ]; then
  PRINT_USAGE
  exit 1
fi

COMMAND=$1

case "$COMMAND" in
  "diagnose")
    echo "Running payment diagnostics..."
    node payment-diagnostics.js
    ;;
  "fix")
    echo "Running payment fix tool..."
    node payment-fix.js
    ;;
  "prepare")
    echo "Preparing for deployment..."
    node payment-fix.js 6
    ;;
  "help")
    PRINT_USAGE
    ;;
  *)
    echo "Unknown command: $COMMAND"
    PRINT_USAGE
    exit 1
    ;;
esac
