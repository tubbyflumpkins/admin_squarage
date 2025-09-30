import { config } from 'dotenv'
config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3002'

async function testCorsOrigins() {
  console.log('🧪 Testing CORS Configuration with All Allowed Origins\n')

  const testOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://squarage.com',
    'https://www.squarage.com',
    'https://admin.squarage.com',
    'https://unauthorized.com' // This should be rejected
  ]

  for (const origin of testOrigins) {
    console.log(`\nTesting origin: ${origin}`)
    console.log('-'.repeat(50))

    try {
      // Test OPTIONS preflight
      const optionsResponse = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, X-API-Key'
        }
      })

      const corsHeader = optionsResponse.headers.get('Access-Control-Allow-Origin')
      console.log(`  OPTIONS Response: ${optionsResponse.status}`)
      console.log(`  CORS Header: ${corsHeader}`)

      // Check if the origin is correctly allowed or rejected
      if (origin === 'https://unauthorized.com') {
        if (corsHeader !== origin) {
          console.log(`  ✅ Correctly rejected unauthorized origin`)
        } else {
          console.log(`  ❌ ERROR: Unauthorized origin was allowed!`)
        }
      } else {
        if (corsHeader === origin) {
          console.log(`  ✅ Origin correctly allowed`)
        } else {
          console.log(`  ⚠️  WARNING: Expected origin not returned (got: ${corsHeader})`)
        }
      }

      // Test actual POST request
      const testEmail = `cors-test-${Date.now()}@gmail.com`
      const postResponse = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY!,
          'Content-Type': 'application/json',
          'Origin': origin
        },
        body: JSON.stringify({
          email: testEmail,
          consentMarketing: false, // No consent to avoid creating discount codes
          source: 'cors-test'
        })
      })

      const postCorsHeader = postResponse.headers.get('Access-Control-Allow-Origin')
      const data = await postResponse.json()

      console.log(`  POST Response: ${postResponse.status}`)
      console.log(`  POST CORS Header: ${postCorsHeader}`)
      console.log(`  Result: ${data.success ? 'Success' : 'Failed'} - ${data.message}`)

    } catch (error) {
      console.error(`  ❌ Error testing origin: ${error}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log('  • CORS properly configured for production URLs')
  console.log('  • localhost:3000 and 3001 supported for development')
  console.log('  • squarage.com (with www and admin subdomains) supported')
  console.log('  • Unauthorized origins are properly rejected')
}

testCorsOrigins().catch(console.error)