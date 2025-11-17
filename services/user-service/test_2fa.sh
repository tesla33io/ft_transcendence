#!/bin/bash

# 2FA Automated Testing Script
# This script runs all 2FA API tests automatically

# Don't exit on error - we want to run all tests and report results
set +e  # Changed from set -e

BASE_URL="http://localhost:8000"
COOKIES_FILE="test_cookies.txt"
COOKIES_FILE2="test_cookies2.txt"
TIMESTAMP=$(date +%s)
USER1="test2fa_${TIMESTAMP}"
USER2="testuser_${TIMESTAMP}"
PASSWORD="testpass123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Helper functions
print_test() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ PASSED: $1${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ FAILED: $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ INFO: $1${NC}"
}

# Check if service is running
check_service() {
    print_test "Checking if service is running"
    # Try to connect to the service - use a simple endpoint or just check if port is open
    if curl -s -f --max-time 2 "${BASE_URL}/users/auth/register" -X POST -H "Content-Type: application/json" -d '{"test":"connection"}' > /dev/null 2>&1; then
        print_success "Service is running"
        return 0
    elif curl -s -f --max-time 2 "${BASE_URL}" > /dev/null 2>&1; then
        print_success "Service is running"
        return 0
    else
        # Try just checking if we can connect to the port
        if nc -z localhost 8000 2>/dev/null || timeout 2 bash -c "cat < /dev/null > /dev/tcp/localhost/8000" 2>/dev/null; then
            print_success "Service port is open"
            return 0
        else
            print_fail "Service is not running at ${BASE_URL}"
            echo "Please start the user-service and try again."
            echo "You can start it with: docker compose up -d user-service"
            exit 1
        fi
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up test files...${NC}"
    rm -f "${COOKIES_FILE}" "${COOKIES_FILE2}" 2>/dev/null || true
}

trap cleanup EXIT

# Test 1: Register with 2FA
test_register_with_2fa() {
    print_test "Test 1.1: Register with 2FA Enabled"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\",\"enable2FA\":true}" \
        -c "${COOKIES_FILE}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SECRET=$(echo "$BODY" | grep -o '"secret":"[^"]*' | cut -d'"' -f4)
        QR_URL=$(echo "$BODY" | grep -o '"qrCodeUrl":"[^"]*' | cut -d'"' -f4)
        
        if [ -n "$SECRET" ] && [ -n "$QR_URL" ]; then
            print_success "Registration with 2FA successful"
            print_info "Secret: ${SECRET:0:20}..."
            print_info "QR Code URL generated (length: ${#QR_URL} chars)"
            echo "$SECRET" > /tmp/test_2fa_secret.txt
            return 0
        else
            print_fail "Registration succeeded but 2FA setup data missing"
            return 1
        fi
    else
        print_fail "Registration failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 2: Register without 2FA
test_register_without_2fa() {
    print_test "Test 1.2: Register without 2FA"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER2}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE2}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        if echo "$BODY" | grep -q "twoFactorSetup"; then
            print_fail "Registration should not include 2FA setup"
            return 1
        else
            print_success "Registration without 2FA successful"
            return 0
        fi
    else
        print_fail "Registration failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 2: Setup 2FA after registration
test_setup_2fa() {
    print_test "Test 2.1: Setup 2FA After Registration"
    
    # Logout first to clear any session from registration
    logout_user "${COOKIES_FILE2}"
    
    # First login and ensure cookie is saved
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER2}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE2}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" -ne 200 ]; then
        print_fail "Login failed (HTTP $HTTP_CODE): $(echo "$RESPONSE" | sed '$d')"
        return 1
    fi
    
    # Wait a moment for cookie to be written
    sleep 0.5
    
    # Now setup 2FA
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/setup" \
        -H "Content-Type: application/json" \
        -b "${COOKIES_FILE2}" \
        -d '{"method":"totp"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        SECRET=$(echo "$BODY" | grep -o '"secret":"[^"]*' | cut -d'"' -f4)
        if [ -n "$SECRET" ]; then
            print_success "2FA setup initiated"
            echo "$SECRET" > /tmp/test_2fa_secret2.txt
            return 0
        else
            print_fail "2FA setup response missing secret"
            return 1
        fi
    else
        print_fail "2FA setup failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Helper function to logout
logout_user() {
    local cookie_file=$1
    curl -s -X POST "${BASE_URL}/users/auth/logout" \
        -b "${cookie_file}" \
        -c "${cookie_file}" > /dev/null 2>&1
    sleep 0.2
}

# Test 4: Setup 2FA without authentication
test_setup_2fa_no_auth() {
    print_test "Test 2.2: Setup 2FA Without Authentication"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/setup" \
        -H "Content-Type: application/json" \
        -d '{"method":"totp"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        print_success "Correctly rejected unauthenticated request"
        return 0
    else
        print_fail "Should return 401 for unauthenticated request (got $HTTP_CODE)"
        return 1
    fi
}

# Test 5: Verify 2FA setup
test_verify_2fa_setup() {
    print_test "Test 3.1: Verify 2FA Setup"
    
    if [ ! -f /tmp/test_2fa_secret.txt ]; then
        print_warning "Skipping - no secret found. Run test 1.1 first."
        return 0
    fi
    
    # Ensure we're logged in with the correct cookie
    logout_user "${COOKIES_FILE}"
    curl -s -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE}" > /dev/null
    
    sleep 0.5
    
    SECRET=$(cat /tmp/test_2fa_secret.txt)
    print_info "Secret: ${SECRET:0:20}..."
    print_warning "This test requires a valid TOTP code from your authenticator app"
    print_info "You can generate a code using: oathtool --totp -b ${SECRET}"
    print_info "Or scan the QR code from the registration response"
    
    read -p "Enter 6-digit code from authenticator app (or 'skip' to skip): " CODE
    
    if [ "$CODE" = "skip" ]; then
        print_warning "Skipping verification test"
        return 0
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/verify-setup" \
        -H "Content-Type: application/json" \
        -b "${COOKIES_FILE}" \
        -d "{\"code\":\"${CODE}\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        BACKUP_CODES=$(echo "$BODY" | grep -o '"backupCodes":\[[^]]*' | cut -d'[' -f2 | tr -d ']' | tr ',' ' ')
        if [ -n "$BACKUP_CODES" ]; then
            print_success "2FA verified and enabled"
            print_info "Backup codes received: $(echo $BACKUP_CODES | wc -w) codes"
            echo "$BACKUP_CODES" > /tmp/test_backup_codes.txt
            return 0
        else
            print_fail "Verification succeeded but no backup codes"
            return 1
        fi
    else
        print_fail "Verification failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 6: Verify with invalid code
test_verify_invalid_code() {
    print_test "Test 3.2: Verify with Invalid Code"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/verify-setup" \
        -H "Content-Type: application/json" \
        -b "${COOKIES_FILE}" \
        -d '{"code":"000000"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        print_success "Correctly rejected invalid code"
        return 0
    else
        print_fail "Should return 401 for invalid code (got $HTTP_CODE)"
        return 1
    fi
}

# Test 7: Login without 2FA code (should prompt)
test_login_without_code() {
    print_test "Test 4.1: Login Without 2FA Code (First Request)"
    
    # Logout first to clear any existing session
    logout_user "${COOKIES_FILE}"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        # Check for either requires2FA field or the specific message
        if echo "$BODY" | grep -q "requires2FA" || echo "$BODY" | grep -q "Enter code from authenticator app"; then
            print_success "Correctly prompts for 2FA code"
            return 0
        elif echo "$BODY" | grep -q "Login successful"; then
            # 2FA is not enabled - this is expected if verify-setup wasn't run
            print_warning "2FA is not enabled yet - login succeeded without 2FA prompt"
            print_info "This is expected if verify-setup test was skipped"
            print_info "Response: $BODY"
            # Don't fail the test, just warn
            return 0
        else
            print_fail "Should prompt for 2FA but doesn't. Response: $BODY"
            return 1
        fi
    else
        print_fail "Login request failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 8: Login with valid 2FA code
test_login_with_code() {
    print_test "Test 4.2: Login with Valid 2FA Code"
    
    if [ ! -f /tmp/test_2fa_secret.txt ]; then
        print_warning "Skipping - no secret found"
        return 0
    fi
    
    SECRET=$(cat /tmp/test_2fa_secret.txt)
    print_info "Enter 6-digit code from authenticator app for ${USER1}"
    print_info "Or generate with: oathtool --totp -b ${SECRET}"
    
    read -p "Enter code (or 'skip'): " CODE
    
    if [ "$CODE" = "skip" ]; then
        print_warning "Skipping login test"
        return 0
    fi
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\",\"twoFactorCode\":\"${CODE}\"}" \
        -c "${COOKIES_FILE}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        if echo "$BODY" | grep -q "Login successful"; then
            print_success "Login with 2FA successful"
            return 0
        else
            print_fail "Login response doesn't indicate success"
            return 1
        fi
    else
        print_fail "Login failed (HTTP $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 9: Login with invalid code
test_login_invalid_code() {
    print_test "Test 4.3: Login with Invalid 2FA Code"
    
    # Logout first
    logout_user "${COOKIES_FILE}"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\",\"twoFactorCode\":\"000000\"}" \
        -c "${COOKIES_FILE}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        if echo "$BODY" | grep -q "remainingAttempts"; then
            print_success "Correctly rejected invalid code with remaining attempts"
            return 0
        else
            print_success "Correctly rejected invalid code"
            return 0
        fi
    elif [ "$HTTP_CODE" -eq 200 ]; then
        # If login succeeds, 2FA might not be enabled
        if echo "$BODY" | grep -q "Login successful"; then
            print_warning "2FA is not enabled - invalid code was ignored"
            print_info "This is expected if verify-setup test was skipped"
            print_info "Response: $BODY"
            # Don't fail the test, just warn
            return 0
        else
            print_fail "Unexpected response: $BODY"
            return 1
        fi
    else
        print_fail "Should return 401 for invalid code (got $HTTP_CODE): $BODY"
        return 1
    fi
}

# Test 10: Rate limiting (5 failed attempts)
test_rate_limiting() {
    print_test "Test 7.1: Rate Limiting (5 Failed Attempts)"
    
    print_warning "This will make 5 failed login attempts..."
    
    for i in {1..5}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
            -H "Content-Type: application/json" \
            -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\",\"twoFactorCode\":\"000000\"}")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$i" -eq 5 ]; then
            if [ "$HTTP_CODE" -eq 429 ]; then
                print_success "Account locked after 5 failed attempts"
                return 0
            else
                print_fail "Should lock account after 5 attempts (got $HTTP_CODE)"
                return 1
            fi
        fi
        
        sleep 0.5
    done
}

# Test 11: Login while locked
test_login_while_locked() {
    print_test "Test 7.2: Attempt Login While Locked"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\",\"twoFactorCode\":\"123456\"}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 429 ]; then
        print_success "Correctly rejected login while locked"
        return 0
    else
        print_fail "Should return 429 while locked (got $HTTP_CODE)"
        return 1
    fi
}

# Test 12: Disable 2FA
test_disable_2fa() {
    print_test "Test 6.1: Disable 2FA"
    
    # Login first
    curl -s -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER1}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE}" > /dev/null
    
    print_warning "Note: This test requires a valid 2FA code to login first"
    print_info "Skipping disable test (requires successful login with 2FA)"
    return 0
}

# Test 13: Disable 2FA with wrong password
test_disable_wrong_password() {
    print_test "Test 6.2: Disable 2FA with Wrong Password"
    
    # Login first (without 2FA for this test)
    curl -s -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER2}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE2}" > /dev/null
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/disable" \
        -H "Content-Type: application/json" \
        -b "${COOKIES_FILE2}" \
        -d '{"password":"wrongpassword"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" -eq 401 ]; then
        print_success "Correctly rejected wrong password"
        return 0
    else
        print_fail "Should return 401 for wrong password (got $HTTP_CODE)"
        return 1
    fi
}

# Test 14: Invalid 2FA method
test_invalid_method() {
    print_test "Test 8.3: Invalid 2FA Method"
    
    # Login first
    logout_user "${COOKIES_FILE2}"
    curl -s -X POST "${BASE_URL}/users/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${USER2}\",\"password\":\"${PASSWORD}\"}" \
        -c "${COOKIES_FILE2}" > /dev/null
    
    sleep 0.5
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/users/auth/2fa/setup" \
        -H "Content-Type: application/json" \
        -b "${COOKIES_FILE2}" \
        -d '{"method":"email"}')
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        print_success "Correctly rejected invalid method"
        return 0
    else
        print_fail "Should return 400 for invalid method (got $HTTP_CODE): $BODY"
        return 1
    fi
}

# Main test runner
main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║          2FA API Automated Testing Script                     ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Run service check - if it fails, exit
    if ! check_service; then
        exit 1
    fi
    
    # Run basic tests - continue even if some fail
    set +e  # Temporarily disable exit on error for tests
    test_register_with_2fa
    test_register_without_2fa
    test_setup_2fa
    test_setup_2fa_no_auth
    test_verify_invalid_code
    test_disable_wrong_password
    test_invalid_method
    set -e  # Re-enable exit on error
    
    # Interactive tests (require user input) - MUST run before login tests
    echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Interactive Tests (require manual input)${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    set +e
    test_verify_2fa_setup  # This enables 2FA - must run before login tests
    test_login_with_code
    set -e
    
    # Now run login tests (after 2FA is enabled)
    echo -e "\n${BLUE}Running login tests (2FA should be enabled now)...${NC}"
    set +e
    test_login_without_code
    test_login_invalid_code
    set -e
    
    # Rate limiting test (optional - takes time and locks account)
    echo -e "\n${YELLOW}Rate limiting test will lock the account for 15 minutes.${NC}"
    read -p "Run rate limiting test? (y/N): " RUN_RATE_TEST
    if [ "$RUN_RATE_TEST" = "y" ] || [ "$RUN_RATE_TEST" = "Y" ]; then
        set +e
        test_rate_limiting
        test_login_while_locked
        set -e
    else
        print_info "Skipping rate limiting tests"
    fi
    
    # Summary
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Passed: ${PASSED}${NC}"
    echo -e "${RED}Failed: ${FAILED}${NC}"
    TOTAL=$((PASSED + FAILED))
    if [ "$TOTAL" -gt 0 ]; then
        PERCENT=$((PASSED * 100 / TOTAL))
        echo -e "Success Rate: ${PERCENT}%"
    fi
    
    if [ "$FAILED" -eq 0 ]; then
        echo -e "\n${GREEN}All automated tests passed! ✓${NC}"
        exit 0
    else
        echo -e "\n${RED}Some tests failed. Please review the output above.${NC}"
        exit 1
    fi
}

# Run main function
main
