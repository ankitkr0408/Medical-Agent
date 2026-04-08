#!/bin/bash

# Medical Platform Test Script
# This script performs automated checks on the application

set -e

echo "🏥 Medical Platform - Automated Test Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

# Test 1: Check Node.js version
echo "Test 1: Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    test_result 0 "Node.js version $NODE_VERSION is compatible (>= 18)"
else
    test_result 1 "Node.js version $NODE_VERSION is too old (need >= 18)"
fi
echo ""

# Test 2: Check if package.json exists
echo "Test 2: Checking package.json..."
if [ -f "package.json" ]; then
    test_result 0 "package.json exists"
else
    test_result 1 "package.json not found"
fi
echo ""

# Test 3: Check if node_modules exists
echo "Test 3: Checking dependencies installation..."
if [ -d "node_modules" ]; then
    test_result 0 "node_modules directory exists"
else
    test_result 1 "node_modules not found - run 'npm install'"
fi
echo ""

# Test 4: Check critical dependencies
echo "Test 4: Checking critical packages..."

# Check sharp
if npm list sharp &> /dev/null; then
    test_result 0 "sharp package installed"
else
    test_result 1 "sharp package missing"
fi

# Check @prisma/client
if npm list @prisma/client &> /dev/null; then
    test_result 0 "@prisma/client package installed"
else
    test_result 1 "@prisma/client package missing"
fi

# Check openai
if npm list openai &> /dev/null; then
    test_result 0 "openai package installed"
else
    test_result 1 "openai package missing"
fi

# Check next-auth
if npm list next-auth &> /dev/null; then
    test_result 0 "next-auth package installed"
else
    test_result 1 "next-auth package missing"
fi

# Check jspdf
if npm list jspdf &> /dev/null; then
    test_result 0 "jspdf package installed"
else
    test_result 1 "jspdf package missing"
fi

echo ""

# Test 5: Check environment file
echo "Test 5: Checking environment configuration..."
if [ -f ".env" ]; then
    test_result 0 ".env file exists"
    
    # Check required variables
    if grep -q "DATABASE_URL" .env; then
        test_result 0 "DATABASE_URL is set"
    else
        test_result 1 "DATABASE_URL is missing"
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env; then
        test_result 0 "NEXTAUTH_SECRET is set"
    else
        test_result 1 "NEXTAUTH_SECRET is missing"
    fi
    
    if grep -q "OPENAI_API_KEY" .env; then
        test_result 0 "OPENAI_API_KEY is set"
    else
        test_result 1 "OPENAI_API_KEY is missing"
    fi
else
    test_result 1 ".env file not found - copy from .env.example"
fi
echo ""

# Test 6: Check Prisma setup
echo "Test 6: Checking Prisma configuration..."
if [ -f "prisma/schema.prisma" ]; then
    test_result 0 "Prisma schema exists"
else
    test_result 1 "Prisma schema not found"
fi

if [ -d "node_modules/.prisma" ]; then
    test_result 0 "Prisma client generated"
else
    test_result 1 "Prisma client not generated - run 'npx prisma generate'"
fi
echo ""

# Test 7: Check TypeScript configuration
echo "Test 7: Checking TypeScript configuration..."
if [ -f "tsconfig.json" ]; then
    test_result 0 "tsconfig.json exists"
else
    test_result 1 "tsconfig.json not found"
fi
echo ""

# Test 8: Check Next.js configuration
echo "Test 8: Checking Next.js configuration..."
if [ -f "next.config.mjs" ]; then
    test_result 0 "next.config.mjs exists"
else
    test_result 1 "next.config.mjs not found"
fi
echo ""

# Test 9: Check critical directories
echo "Test 9: Checking project structure..."
directories=("app" "components" "lib" "prisma" "types")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        test_result 0 "$dir/ directory exists"
    else
        test_result 1 "$dir/ directory missing"
    fi
done
echo ""

# Test 10: Check critical files
echo "Test 10: Checking critical files..."
files=(
    "app/layout.tsx"
    "app/page.tsx"
    "app/dashboard/page.tsx"
    "lib/auth.ts"
    "lib/db/prisma.ts"
    "middleware.ts"
)
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        test_result 0 "$file exists"
    else
        test_result 1 "$file missing"
    fi
done
echo ""

# Test 11: Check API routes
echo "Test 11: Checking API routes..."
api_routes=(
    "app/api/auth/[...nextauth]/route.ts"
    "app/api/upload/route.ts"
    "app/api/analyze/route.ts"
    "app/api/reports/route.ts"
)
for route in "${api_routes[@]}"; do
    if [ -f "$route" ]; then
        test_result 0 "$route exists"
    else
        test_result 1 "$route missing"
    fi
done
echo ""

# Test 12: TypeScript compilation check
echo "Test 12: Checking TypeScript compilation..."
if npx tsc --noEmit &> /dev/null; then
    test_result 0 "TypeScript compilation successful"
else
    test_result 1 "TypeScript compilation errors found"
fi
echo ""

# Test 13: ESLint check
echo "Test 13: Running ESLint..."
if npm run lint &> /dev/null; then
    test_result 0 "ESLint passed"
else
    test_result 1 "ESLint found issues"
fi
echo ""

# Summary
echo "==========================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Application is ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
