#!/bin/bash

# Intelligent Claude Code Review Script
# Automatically selects appropriate review prompts based on file paths

review_file() {
    local file="$1"
    
    if [[ ! "$file" =~ \.(js|jsx|ts|tsx)$ ]]; then
        return 0
    fi
    
    echo "🔍 Reviewing: $file"
    
    # Intelligent prompt selection based on file path
    if [[ "$file" =~ ^src/app/api/ ]] || [[ "$file" =~ ^src/server/ ]] || [[ "$file" =~ ^src/middleware ]] || [[ "$file" =~ middleware\.ts$ ]]; then
        # Backend files - use backend prompt
        echo "  📊 Using Backend/API review prompt"
        if command -v claude &> /dev/null; then
            claude code review "$file" --prompt-file=".claude/commands/backend/code-review.md"
        else
            echo "  ❌ Claude CLI not found"
        fi
    elif [[ "$file" =~ ^src/(app|components|hooks|stores)/ ]] || [[ "$file" =~ \.(tsx)$ ]]; then
        # Frontend files - use frontend prompt  
        echo "  🎨 Using Frontend/React review prompt"
        if command -v claude &> /dev/null; then
            claude code review "$file" --prompt-file=".claude/commands/frontend/code-review.md"
        else
            echo "  ❌ Claude CLI not found"
        fi
    elif [[ "$file" =~ ^src/(shared|types|utils)/ ]]; then
        # Shared files - use brief review
        echo "  🔧 Using general review"
        if command -v claude &> /dev/null; then
            claude code review "$file" --brief
        else
            echo "  ❌ Claude CLI not found"
        fi
    else
        # Other files - use brief review
        echo "  📋 Using brief review"
        if command -v claude &> /dev/null; then
            claude code review "$file" --brief
        else
            echo "  ❌ Claude CLI not found"
        fi
    fi
    
    echo "  ✅ Review completed for $file"
    echo ""
}

# Main execution
case "$1" in
    "staged")
        echo "🤖 Running intelligent Claude Code Review on staged files..."
        git diff --cached --name-only | head -10 | while read -r file; do
            review_file "$file"
        done
        ;;
    "all")
        echo "🔍 Running intelligent Claude Code Review on all source files..."
        find src -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' | head -10 | while read -r file; do
            review_file "$file"
        done
        ;;
    *)
        echo "Usage: $0 {staged|all}"
        echo "  staged - Review staged files with intelligent prompts"
        echo "  all    - Review all source files with intelligent prompts"
        exit 1
        ;;
esac