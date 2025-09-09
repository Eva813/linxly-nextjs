#!/bin/bash

# Intelligent Claude Code Review Script
# Automatically selects appropriate review prompts based on file paths

review_file() {
    local file="$1"
    
    # Only review JavaScript/TypeScript files
    if [[ ! "$file" =~ \.(js|jsx|ts|tsx)$ ]]; then
        return 0
    fi
    
    echo "🔍 Reviewing: $file"
    
    # Check if Claude CLI is available
    if ! command -v claude &> /dev/null; then
        echo "  ❌ Claude CLI not found"
        echo "  💡 Install Claude Code CLI to enable AI code review"
        return 1
    fi
    
    # Intelligent prompt selection based on file path (Enhanced for Next.js)
    local review_result=0
    if [[ "$file" =~ ^src/app/api/ ]] || [[ "$file" =~ ^pages/api/ ]] || [[ "$file" =~ ^src/server/ ]] || [[ "$file" =~ ^src/middleware ]] || [[ "$file" =~ middleware\.ts$ ]]; then
        # Backend files - use backend prompt
        echo "  📊 Using Backend/API review prompt"
        backend_prompt="You are tasked with reviewing a Node.js backend codebase that uses Firebase/Firestore, with Next.js API routes. Focus on API security, database optimization, error handling, performance, and adherence to Node.js and Firebase conventions. Provide clear, actionable feedback with reasoning."
        if ! claude --print --append-system-prompt "$backend_prompt" "Please review this file for backend best practices, security, and performance:" < "$file"; then
            review_result=1
        fi
    elif [[ "$file" =~ ^src/(app|components|hooks|stores)/ ]] || [[ "$file" =~ ^src/app/.+\.tsx?$ ]] || [[ "$file" =~ ^pages/.+\.tsx?$ ]] || [[ "$file" =~ \.(tsx)$ ]]; then
        # Frontend files - use frontend prompt  
        echo "  🎨 Using Frontend/React review prompt"
        frontend_prompt="You are tasked with reviewing a Next.js/React frontend codebase. Focus on React best practices, Next.js optimization, component design, performance, accessibility, and TypeScript usage. Provide clear, actionable feedback."
        if ! claude --print --append-system-prompt "$frontend_prompt" "Please review this file for frontend best practices, performance, and maintainability:" < "$file"; then
            review_result=1
        fi
    elif [[ "$file" =~ ^src/(shared|types|utils|lib)/ ]]; then
        # Shared files - use brief review
        echo "  🔧 Using general review"
        if ! claude --print "Please review this file for code quality, TypeScript usage, and best practices:" < "$file"; then
            review_result=1
        fi
    else
        # Other files - use brief review
        echo "  📋 Using brief review"
        if ! claude --print "Please review this file for code quality and best practices:" < "$file"; then
            review_result=1
        fi
    fi
    
    if [[ $review_result -eq 0 ]]; then
        echo "  ✅ Review completed for $file"
    else
        echo "  ❌ Review failed for $file"
    fi
    echo ""
    
    return $review_result
}

# Main execution
case "$1" in
    "staged")
        echo "🤖 Running intelligent Claude Code Review on staged files..."
        echo ""
        
        # Get staged files
        staged_files=$(git diff --cached --name-only | head -10)
        if [[ -z "$staged_files" ]]; then
            echo "ℹ️  No staged files found to review."
            exit 0
        fi
        
        echo "📊 Found $(echo "$staged_files" | wc -l) staged files to review"
        echo ""
        
        # Review each file and track failures
        failed_reviews=()
        while IFS= read -r file; do
            if ! review_file "$file"; then
                failed_reviews+=("$file")
            fi
        done <<< "$staged_files"
        
        # Summary
        echo "==============================="
        if [[ ${#failed_reviews[@]} -eq 0 ]]; then
            echo "🎉 All staged files reviewed successfully!"
            exit 0
        else
            echo "❌ Review failed for ${#failed_reviews[@]} file(s):"
            printf '  - %s\n' "${failed_reviews[@]}"
            exit 1
        fi
        ;;
    "all")
        echo "🔍 Running intelligent Claude Code Review on all source files..."
        echo ""
        
        # Find all source files
        if [[ ! -d "src" ]]; then
            echo "❌ src directory not found. Please run this script from the project root."
            exit 1
        fi
        
        source_files=$(find src -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' | head -10)
        if [[ -z "$source_files" ]]; then
            echo "ℹ️  No source files found to review."
            exit 0
        fi
        
        echo "📊 Found $(echo "$source_files" | wc -l) source files to review"
        echo ""
        
        # Review each file and track failures
        failed_reviews=()
        while IFS= read -r file; do
            if ! review_file "$file"; then
                failed_reviews+=("$file")
            fi
        done <<< "$source_files"
        
        # Summary
        echo "==============================="
        if [[ ${#failed_reviews[@]} -eq 0 ]]; then
            echo "🎉 All source files reviewed successfully!"
            exit 0
        else
            echo "❌ Review failed for ${#failed_reviews[@]} file(s):"
            printf '  - %s\n' "${failed_reviews[@]}"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {staged|all}"
        echo ""
        echo "Available commands:"
        echo "  staged - Review staged files with intelligent prompts"
        echo "  all    - Review all source files with intelligent prompts"
        echo ""
        echo "Examples:"
        echo "  $0 staged    # Review only staged files"
        echo "  $0 all       # Review all source files in src/"
        echo ""
        exit 1
        ;;
esac