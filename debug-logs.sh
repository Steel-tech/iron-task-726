#!/bin/bash

# FSW Iron Task Debug Log Viewer
# Usage: ./debug-logs.sh [option]

LOGS_DIR="./logs"
DEBUG_LOG="$LOGS_DIR/debug.log"
ERROR_LOG="$LOGS_DIR/error.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo "FSW Iron Task Debug Log Viewer"
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  -d, --debug      Show debug log (last 20 lines)"
    echo "  -e, --errors     Show error log only"
    echo "  -f, --follow     Follow debug log in real-time"
    echo "  -c, --clear      Clear all log files"
    echo "  -s, --stats      Show log statistics"
    echo "  -t, --tail [n]   Show last n lines (default: 20)"
    echo "  -h, --help       Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 -d           # Show last 20 debug entries"
    echo "  $0 -f           # Follow logs in real-time" 
    echo "  $0 -t 50        # Show last 50 log entries"
    echo "  $0 -e           # Show only errors"
}

show_stats() {
    if [ -f "$DEBUG_LOG" ]; then
        echo -e "${BLUE}=== LOG STATISTICS ===${NC}"
        echo -e "${GREEN}Debug log entries:${NC} $(wc -l < "$DEBUG_LOG")"
        echo -e "${GREEN}Error log entries:${NC} $(wc -l < "$ERROR_LOG" 2>/dev/null || echo "0")"
        echo -e "${GREEN}Debug log size:${NC} $(du -h "$DEBUG_LOG" | cut -f1)"
        echo -e "${GREEN}Error log size:${NC} $(du -h "$ERROR_LOG" 2>/dev/null | cut -f1 || echo "0B")"
        echo ""
        echo -e "${YELLOW}Recent activity (last 5 entries):${NC}"
        tail -5 "$DEBUG_LOG" | jq -r '. | "\(.timestamp) [\(.level)] \(.message)"' 2>/dev/null || tail -5 "$DEBUG_LOG"
    else
        echo -e "${RED}No debug logs found${NC}"
    fi
}

format_log_line() {
    local line="$1"
    echo "$line" | jq -r '. | "\(.timestamp) [\(.level)] \(.message) \(if .error then "- " + .error else "" end)"' 2>/dev/null || echo "$line"
}

show_debug_log() {
    local lines=${1:-20}
    if [ -f "$DEBUG_LOG" ]; then
        echo -e "${BLUE}=== DEBUG LOG (last $lines entries) ===${NC}"
        tail -"$lines" "$DEBUG_LOG" | while IFS= read -r line; do
            format_log_line "$line"
        done
    else
        echo -e "${RED}Debug log not found: $DEBUG_LOG${NC}"
    fi
}

show_error_log() {
    if [ -f "$ERROR_LOG" ]; then
        echo -e "${RED}=== ERROR LOG ===${NC}"
        cat "$ERROR_LOG" | while IFS= read -r line; do
            format_log_line "$line"
        done
    else
        echo -e "${YELLOW}No errors logged yet${NC}"
    fi
}

follow_logs() {
    echo -e "${BLUE}=== FOLLOWING DEBUG LOG (Ctrl+C to stop) ===${NC}"
    if [ -f "$DEBUG_LOG" ]; then
        tail -f "$DEBUG_LOG" | while IFS= read -r line; do
            format_log_line "$line"
        done
    else
        echo -e "${RED}Debug log not found: $DEBUG_LOG${NC}"
    fi
}

clear_logs() {
    read -p "Are you sure you want to clear all log files? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$DEBUG_LOG" "$ERROR_LOG"
        echo -e "${GREEN}Log files cleared${NC}"
    else
        echo "Operation cancelled"
    fi
}

# Parse command line arguments
case "${1:-}" in
    -d|--debug)
        show_debug_log
        ;;
    -e|--errors)
        show_error_log
        ;;
    -f|--follow)
        follow_logs
        ;;
    -c|--clear)
        clear_logs
        ;;
    -s|--stats)
        show_stats
        ;;
    -t|--tail)
        show_debug_log "${2:-20}"
        ;;
    -h|--help)
        show_help
        ;;
    "")
        show_stats
        echo ""
        show_debug_log
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_help
        exit 1
        ;;
esac