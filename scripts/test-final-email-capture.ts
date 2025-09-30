import { config } from 'dotenv'

config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3000'

async function testFinalEmailCapture() {
  console.log('🧪 Testing Email Capture API - Final Test\n')
  console.log('API Key:', API_KEY?.substring(0, 10) + '...')

  // Test with the exact curl command format
  console.log('Test: Email subscription with exact curl format')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'finaltest@example.com',
        consentMarketing: true
      })
    })

    const data = await response.json()
    console.log('Response Status:', response.status)
    console.log('Response Body:', data)

    if (response.status === 200 && data.success === true) {
      console.log('✅ Test PASSED - API is working correctly!\n')
    } else {
      console.log('❌ Test FAILED - Unexpected response\n')
    }
  } catch (error) {
    console.error('❌ Test FAILED:', error, '\n')
  }

  // Test CORS headers from different origin
  console.log('Test: CORS headers')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://squarage.com'
      }
    })

    const corsHeader = response.headers.get('Access-Control-Allow-Origin')
    console.log('CORS Allow-Origin:', corsHeader)

    if (corsHeader === 'https://squarage.com') {
      console.log('✅ CORS Test PASSED\n')
    } else {
      console.log('⚠️  CORS header not as expected\n')
    }
  } catch (error) {
    console.error('❌ CORS Test FAILED:', error, '\n')
  }

  console.log('🎉 All tests completed!')
}

testFinalEmailCapture().catch(console.error)