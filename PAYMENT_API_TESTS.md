# Payment API Test Results

## Test Summary

**Server Status:** ✅ Running at http://localhost:3000

### Test Results

| Test # | Test Name | Status | Details |
|--------|-----------|--------|---------|
| 1 | Server Health Check | ✅ PASS | Server is accessible |
| 2 | Payment Initiate - Missing Fields | ✅ PASS | Correctly returns 400 with error message |
| 3 | Payment Initiate - Negative Amount | ✅ PASS | Correctly validates and rejects negative amounts |
| 4 | Payment Initiate - Zero Amount | ✅ PASS | Correctly validates and rejects zero amounts |
| 5 | Payment Initiate - Valid Request | ⚠️ PARTIAL | Returns 422 (Payment gateway request failed) |
| 6 | Payment Verify - Missing customRef | ✅ PASS | Correctly returns 400 with error message |
| 7 | Payment Verify - Valid Structure | ✅ PASS | Returns 200 with verified: false for non-existent booking |

**Total:** 6 passed, 1 partial pass

---

## Detailed API Documentation

### 1. POST /api/payment/initiate

**Purpose:** Initiates a payment transaction with the payment gateway

**Request Body:**
```json
{
  "bookingId": "string (required)",
  "amount": "number (required, > 0)",
  "email": "string (required)",
  "phone": "string (optional, must be Libyan number: +218XXXXXXXXX)"
}
```

**Important:** ⚠️ The payment gateway **only accepts Libyan phone numbers** (format: +218XXXXXXXXX)

**Responses:**

#### Success (200)
```json
{
  "success": true,
  "paymentUrl": "https://payment-gateway.com/pay/...",
  "customRef": "booking-id"
}
```

#### Validation Error (400)
```json
{
  "error": "Missing required fields: bookingId, amount, email"
}
```
or
```json
{
  "error": "Invalid amount"
}
```

#### Configuration Error (500)
```json
{
  "error": "Payment gateway not configured"
}
```

#### Gateway Error (422)
```json
{
  "error": "Payment gateway request failed"
}
```

**Environment Variables Required:**
- `PAYMENT_GATEWAY_ID` - Your payment gateway store ID
- `PAYMENT_GATEWAY_TOKEN` - Your payment gateway authentication token
- `PAYMENT_GATEWAY_URL` - Payment gateway API URL (optional, has default)
- `NEXT_PUBLIC_APP_URL` - Your application URL for callbacks

---

### 2. POST /api/payment/verify

**Purpose:** Verifies the status of a payment transaction

**Request Body:**
```json
{
  "customRef": "string (required) - The booking ID"
}
```

**Responses:**

#### Success (200)
```json
{
  "success": true,
  "verified": true,
  "customRef": "booking-id",
  "details": { /* Payment gateway response */ }
}
```

#### Not Found / Failed (200)
```json
{
  "success": false,
  "verified": false
}
```

#### Validation Error (400)
```json
{
  "error": "Missing customRef (bookingId)"
}
```

#### Configuration Error (500)
```json
{
  "error": "Payment gateway not configured"
}
```

---

## Manual Testing Commands

### Using curl

#### Test 1: Valid Payment Initiation (with Libyan phone number)
```bash
curl -X POST http://localhost:3000/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-123",
    "amount": 150.50,
    "email": "customer@example.com",
    "phone": "+218923345678"
  }'
```

**Note:** ⚠️ Use Libyan phone numbers only (country code +218). Examples: +218912345678, +218923456789

#### Test 2: Missing Fields
```bash
curl -X POST http://localhost:3000/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Test 3: Invalid Amount
```bash
curl -X POST http://localhost:3000/api/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-123",
    "amount": -50,
    "email": "customer@example.com"
  }'
```

#### Test 4: Verify Payment
```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "customRef": "booking-123"
  }'
```

#### Test 5: Missing customRef
```bash
curl -X POST http://localhost:3000/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Configuration Checklist

To fully test with real payment gateway integration, ensure these environment variables are set:

- [ ] `PAYMENT_GATEWAY_ID` - Get from your payment gateway dashboard
- [ ] `PAYMENT_GATEWAY_TOKEN` - Generate from payment gateway settings
- [ ] `PAYMENT_GATEWAY_URL` - Usually provided by payment gateway (optional)
- [ ] `NEXT_PUBLIC_APP_URL` - Your application URL (e.g., https://yourdomain.com)

Add these to your `.env.local` file:

```env
PAYMENT_GATEWAY_ID=your_gateway_id
PAYMENT_GATEWAY_TOKEN=your_gateway_token
PAYMENT_GATEWAY_URL=https://c7drkx2ege.execute-api.eu-west-2.amazonaws.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Test Files Created

1. **test-payment-api.sh** - Automated bash script to test all endpoints
   ```bash
   bash test-payment-api.sh
   ```

2. **payment-api.http** - REST Client file for VS Code
   - Install "REST Client" extension in VS Code
   - Open `payment-api.http`
   - Click "Send Request" above each test

3. **PAYMENT_API_TESTS.md** - This documentation file

---

## Issues Found

### Issue 1: Payment Gateway Configuration
**Status:** ⚠️ Configuration needed

The payment initiate endpoint returns 422 (Payment gateway request failed), which indicates:
- The API is correctly structured
- Validation is working properly
- The payment gateway credentials may be missing or incorrect

**Action Required:**
1. Add environment variables to `.env.local`
2. Verify credentials with your payment gateway provider
3. Ensure the payment gateway URL is correct
4. Test connectivity to the payment gateway

---

## API Health

| Aspect | Status | Notes |
|--------|--------|-------|
| Server Running | ✅ | Server is accessible |
| Input Validation | ✅ | All validation rules working correctly |
| Error Handling | ✅ | Proper error messages returned |
| Response Format | ✅ | Consistent JSON responses |
| Status Codes | ✅ | Appropriate HTTP status codes |
| Gateway Integration | ⚠️ | Requires configuration |

---

## Next Steps

1. **Configure Environment Variables**
   - Add payment gateway credentials to `.env.local`
   - Restart the development server

2. **Test with Real Credentials**
   - Run the test script again: `bash test-payment-api.sh`
   - Verify payment initiation returns a payment URL
   - Test the complete payment flow

3. **Integration Testing**
   - Test the callback endpoint (if implemented)
   - Verify frontend integration
   - Test error scenarios

4. **Security Review**
   - Ensure credentials are never committed to git
   - Verify HTTPS in production
   - Check CORS settings if needed
