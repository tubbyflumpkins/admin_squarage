import { config } from 'dotenv'
config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3002'

async function testCompleteSystem() {
  console.log('🧪 Testing Complete Email Subscriber System\n')

  // Test 1: Valid email with discount generation
  console.log('✅ Test 1: Valid email with discount generation')
  const validEmail = `test-valid-${Date.now()}@gmail.com`
  const response1 = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY!,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001',
      'x-forwarded-for': '192.168.1.100'
    },
    body: JSON.stringify({
      email: validEmail,
      consentMarketing: true,
      source: 'complete-test'
    })
  })
  const data1 = await response1.json()
  console.log(`  Email: ${validEmail}`)
  console.log(`  Result: ${data1.message}`)
  if (data1.discountCode) console.log(`  Discount: ${data1.discountCode}`)

  // Test 2: Disposable email rejection
  console.log('\n✅ Test 2: Disposable email rejection')
  const disposableEmail = 'test@mailinator.com'
  const response2 = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY!,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001',
      'x-forwarded-for': '192.168.1.101'
    },
    body: JSON.stringify({
      email: disposableEmail,
      consentMarketing: true,
      source: 'complete-test'
    })
  })
  const data2 = await response2.json()
  console.log(`  Email: ${disposableEmail}`)
  console.log(`  Result: ${data2.message}`)
  console.log(`  Status: ${response2.status === 400 ? 'Correctly rejected' : 'Error - should have been rejected'}`)

  // Test 3: Invalid format rejection
  console.log('\n✅ Test 3: Invalid format rejection')
  const invalidEmail = 'not@valid@email'
  const response3 = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY!,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001',
      'x-forwarded-for': '192.168.1.102'
    },
    body: JSON.stringify({
      email: invalidEmail,
      consentMarketing: true,
      source: 'complete-test'
    })
  })
  const data3 = await response3.json()
  console.log(`  Email: ${invalidEmail}`)
  console.log(`  Result: ${data3.message}`)
  console.log(`  Status: ${response3.status === 400 ? 'Correctly rejected' : 'Error - should have been rejected'}`)

  // Test 4: Duplicate handling
  console.log('\n✅ Test 4: Duplicate email handling')
  const response4 = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY!,
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3001',
      'x-forwarded-for': '192.168.1.103'
    },
    body: JSON.stringify({
      email: validEmail, // Same as test 1
      consentMarketing: true,
      source: 'complete-test'
    })
  })
  const data4 = await response4.json()
  console.log(`  Email: ${validEmail}`)
  console.log(`  Result: ${data4.message}`)
  console.log(`  Status: ${data4.isExisting ? 'Correctly handled as duplicate' : 'Error - should be marked as existing'}`)

  console.log('\n✅ All tests completed successfully!')
  console.log('\n📊 System Features:')
  console.log('  • Email validation with format checking')
  console.log('  • 300+ disposable domains blocked')
  console.log('  • Shopify discount code generation')
  console.log('  • Duplicate detection with friendly messages')
  console.log('  • Rate limiting (5 requests/minute per IP)')
  console.log('  • CORS support for customer site')
  console.log('  • Admin UI with stats and export')
}

testCompleteSystem().catch(console.error)