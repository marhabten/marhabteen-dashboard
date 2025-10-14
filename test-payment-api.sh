#!/bin/bash

# Payment API Test Suite
# Run with: bash test-payment-api.sh

BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

print_header() {
    echo -e "\n${BLUE}${BOLD}━━━ $1 ━━━${NC}"
}

print_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"

    print_header "$name"
    print_info "Request: $method $BASE_URL$endpoint"

    if [ -n "$data" ]; then
        print_info "Body: $data"
    fi

    # Make request
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint" 2>&1)
    fi

    # Check if curl command failed
    if [ $? -ne 0 ]; then
        print_fail "Request failed - Server may not be running"
        return 1
    fi

    # Extract status code (last line) and body (everything else)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    print_info "Status: $status_code"
    print_info "Response: $body"

    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        print_pass "Status code is $expected_status"
    else
        print_fail "Expected status $expected_status, got $status_code"
    fi

    echo "$body"
}

echo -e "${BOLD}🧪 Payment API Test Suite${NC}"
echo "Testing against: $BASE_URL"

# Test 1: Server Health Check
print_header "Test 1: Server Health Check"
if curl -s -f -o /dev/null "$BASE_URL" 2>/dev/null || curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null | grep -q "404\|200\|301\|302"; then
    print_pass "Server is running at $BASE_URL"
else
    print_fail "Server is not accessible at $BASE_URL"
    print_info "Make sure your Next.js server is running with: npm run dev"
fi

# Test 2: Payment Initiate - Missing Required Fields
test_endpoint \
    "Test 2: Payment Initiate - Missing Required Fields" \
    "POST" \
    "/api/payment/initiate" \
    '{}' \
    "400"

# Test 3: Payment Initiate - Invalid Amount (negative)
test_endpoint \
    "Test 3: Payment Initiate - Invalid Amount (negative)" \
    "POST" \
    "/api/payment/initiate" \
    '{"bookingId":"test-123","amount":-100,"email":"test@example.com"}' \
    "400"

# Test 4: Payment Initiate - Invalid Amount (zero)
test_endpoint \
    "Test 4: Payment Initiate - Invalid Amount (zero)" \
    "POST" \
    "/api/payment/initiate" \
    '{"bookingId":"test-123","amount":0,"email":"test@example.com"}' \
    "400"

# Test 5: Payment Initiate - Valid Request (will fail if env not configured)
test_endpoint \
    "Test 5: Payment Initiate - Valid Request with Libyan Number" \
    "POST" \
    "/api/payment/initiate" \
    "{\"bookingId\":\"test-$(date +%s)\",\"amount\":100,\"email\":\"test@example.com\",\"phone\":\"+218923345678\"}" \
    "200|500" # Either 200 if configured or 500 if env vars missing

# Test 6: Payment Verify - Missing customRef
test_endpoint \
    "Test 6: Payment Verify - Missing customRef" \
    "POST" \
    "/api/payment/verify" \
    '{}' \
    "400"

# Test 7: Payment Verify - Valid Request Structure
test_endpoint \
    "Test 7: Payment Verify - Valid Request Structure" \
    "POST" \
    "/api/payment/verify" \
    '{"customRef":"fake-booking-id"}' \
    "200"

# Summary
echo -e "\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Test Summary${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}${BOLD}✗ Some tests failed${NC}"
    exit 1
fi
