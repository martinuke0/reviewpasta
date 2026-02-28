#!/bin/bash

# Test pagination edge cases for ReviewPasta API
# Usage: bash test-pagination.sh

API_URL="http://localhost:8788/api/businesses"
PASSED=0
FAILED=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_test() {
  echo -e "\n${YELLOW}[TEST]${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✓ PASS${NC} $1"
  ((PASSED++))
}

log_fail() {
  echo -e "${RED}✗ FAIL${NC} $1"
  ((FAILED++))
}

# Test 1: Default pagination (no params) - backward compatibility
log_test "Test 1: No pagination params (backward compatibility)"
RESPONSE=$(curl -s "$API_URL")
if echo "$RESPONSE" | jq -e 'type == "array"' > /dev/null 2>&1; then
  log_pass "Returns array without envelope"
else
  log_fail "Should return array, got: $(echo $RESPONSE | jq -r 'type')"
fi

# Test 2: Specific page and limit
log_test "Test 2: Specific page and limit (page=1, limit=5)"
RESPONSE=$(curl -s "$API_URL?page=1&limit=5")
PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page')
LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit')
HAS_DATA=$(echo "$RESPONSE" | jq -e 'has("data")' > /dev/null 2>&1 && echo "true" || echo "false")
HAS_PAGINATION=$(echo "$RESPONSE" | jq -e 'has("pagination")' > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$PAGE" = "1" ] && [ "$LIMIT" = "5" ] && [ "$HAS_DATA" = "true" ] && [ "$HAS_PAGINATION" = "true" ]; then
  log_pass "Returns paginated envelope with correct page=1 and limit=5"
else
  log_fail "Expected page=1, limit=5 with data and pagination, got page=$PAGE, limit=$LIMIT, data=$HAS_DATA, pagination=$HAS_PAGINATION"
fi

# Test 3: page=0 (should default to 1)
log_test "Test 3: page=0 (should default to page=1)"
RESPONSE=$(curl -s "$API_URL?page=0&limit=5")
PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page')
if [ "$PAGE" = "1" ]; then
  log_pass "page=0 correctly defaults to page=1"
else
  log_fail "Expected page=1, got page=$PAGE"
fi

# Test 4: Negative page (should default to 1)
log_test "Test 4: page=-5 (should default to page=1)"
RESPONSE=$(curl -s "$API_URL?page=-5&limit=5")
PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page')
if [ "$PAGE" = "1" ]; then
  log_pass "page=-5 correctly defaults to page=1"
else
  log_fail "Expected page=1, got page=$PAGE"
fi

# Test 5: Limit exceeding max (should cap at 100)
log_test "Test 5: limit=200 (should cap at 100)"
RESPONSE=$(curl -s "$API_URL?page=1&limit=200")
LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit')
if [ "$LIMIT" = "100" ]; then
  log_pass "limit=200 correctly capped at 100"
else
  log_fail "Expected limit=100, got limit=$LIMIT"
fi

# Test 6: Page beyond total pages (should return empty data array)
log_test "Test 6: page=999 (beyond total pages, should return empty array)"
RESPONSE=$(curl -s "$API_URL?page=999&limit=10")
DATA_LENGTH=$(echo "$RESPONSE" | jq -r '.data | length')
HAS_PAGINATION=$(echo "$RESPONSE" | jq -e 'has("pagination")' > /dev/null 2>&1 && echo "true" || echo "false")
if [ "$DATA_LENGTH" = "0" ] && [ "$HAS_PAGINATION" = "true" ]; then
  log_pass "page=999 returns empty data array with pagination metadata"
else
  log_fail "Expected empty data array with pagination, got data length=$DATA_LENGTH, pagination=$HAS_PAGINATION"
fi

# Test 7: Invalid page (non-numeric) should default to 1
log_test "Test 7: page=abc (non-numeric, should default to page=1)"
RESPONSE=$(curl -s "$API_URL?page=abc&limit=5")
PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page')
if [ "$PAGE" = "1" ]; then
  log_pass "page=abc correctly defaults to page=1"
else
  log_fail "Expected page=1, got page=$PAGE"
fi

# Test 8: Invalid limit (non-numeric) should default to 20
log_test "Test 8: limit=xyz (non-numeric, should default to limit=20)"
RESPONSE=$(curl -s "$API_URL?page=1&limit=xyz")
LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit')
if [ "$LIMIT" = "20" ]; then
  log_pass "limit=xyz correctly defaults to limit=20"
else
  log_fail "Expected limit=20, got limit=$LIMIT"
fi

# Test 9: Only page param (limit should default to 20)
log_test "Test 9: Only page param (limit should default to 20)"
RESPONSE=$(curl -s "$API_URL?page=1")
LIMIT=$(echo "$RESPONSE" | jq -r '.pagination.limit')
if [ "$LIMIT" = "20" ]; then
  log_pass "Missing limit correctly defaults to 20"
else
  log_fail "Expected limit=20, got limit=$LIMIT"
fi

# Test 10: Only limit param (page should default to 1)
log_test "Test 10: Only limit param (page should default to 1)"
RESPONSE=$(curl -s "$API_URL?limit=10")
PAGE=$(echo "$RESPONSE" | jq -r '.pagination.page')
if [ "$PAGE" = "1" ]; then
  log_pass "Missing page correctly defaults to 1"
else
  log_fail "Expected page=1, got page=$PAGE"
fi

# Test 11: Verify pagination metadata structure
log_test "Test 11: Pagination metadata structure"
RESPONSE=$(curl -s "$API_URL?page=1&limit=5")
HAS_PAGE=$(echo "$RESPONSE" | jq -e '.pagination | has("page")' > /dev/null 2>&1 && echo "true" || echo "false")
HAS_LIMIT=$(echo "$RESPONSE" | jq -e '.pagination | has("limit")' > /dev/null 2>&1 && echo "true" || echo "false")
HAS_TOTAL=$(echo "$RESPONSE" | jq -e '.pagination | has("total")' > /dev/null 2>&1 && echo "true" || echo "false")
HAS_TOTALPAGES=$(echo "$RESPONSE" | jq -e '.pagination | has("totalPages")' > /dev/null 2>&1 && echo "true" || echo "false")

if [ "$HAS_PAGE" = "true" ] && [ "$HAS_LIMIT" = "true" ] && [ "$HAS_TOTAL" = "true" ] && [ "$HAS_TOTALPAGES" = "true" ]; then
  log_pass "Pagination metadata includes all required fields: page, limit, total, totalPages"
else
  log_fail "Missing pagination fields: page=$HAS_PAGE, limit=$HAS_LIMIT, total=$HAS_TOTAL, totalPages=$HAS_TOTALPAGES"
fi

# Summary
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}SUMMARY${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Some tests failed${NC}"
  exit 1
fi
