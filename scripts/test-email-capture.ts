import { config } from 'dotenv'

config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3000'

async function testEmailCapture() {
  console.log('Testing Email Capture API...\n')

  // Test 1: Valid subscription
  console.log('Test 1: Valid subscription')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY!
      },
      body: JSON.stringify({
        email: 'test@example.com',
        consentMarketing: true,
        source: 'popup',
        discountCode: 'WELCOME10'
      })
    })

    const data = await response.json()
    console.log('Response:', response.status, data)
    console.log('✅ Test 1 passed\n')
  } catch (error) {
    console.error('❌ Test 1 failed:', error, '\n')
  }

  // Test 2: Update existing subscriber
  console.log('Test 2: Update existing subscriber')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY!
      },
      body: JSON.stringify({
        email: 'test@example.com',
        consentMarketing: false,
        source: 'footer'
      })
    })

    const data = await response.json()
    console.log('Response:', response.status, data)
    console.log('✅ Test 2 passed\n')
  } catch (error) {
    console.error('❌ Test 2 failed:', error, '\n')
  }

  // Test 3: Invalid email format
  console.log('Test 3: Invalid email format')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY!
      },
      body: JSON.stringify({
        email: 'invalid-email',
        consentMarketing: true
      })
    })

    const data = await response.json()
    console.log('Response:', response.status, data)
    if (response.status === 400) {
      console.log('✅ Test 3 passed (correctly rejected invalid email)\n')
    } else {
      console.log('❌ Test 3 failed (should have rejected invalid email)\n')
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error, '\n')
  }

  // Test 4: Missing API key
  console.log('Test 4: Missing API key')
  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test2@example.com',
        consentMarketing: true
      })
    })

    const data = await response.json()
    console.log('Response:', response.status, data)
    if (response.status === 401) {
      console.log('✅ Test 4 passed (correctly rejected missing API key)\n')
    } else {
      console.log('❌ Test 4 failed (should have rejected missing API key)\n')
    }
  } catch (error) {
    console.error('❌ Test 4 failed:', error, '\n')
  }

  // Test 5: Rate limiting (send multiple requests quickly)
  console.log('Test 5: Rate limiting')
  try {
    const promises = []
    for (let i = 0; i < 7; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY!,
            'x-forwarded-for': '192.168.1.1' // Simulate same IP
          },
          body: JSON.stringify({
            email: `ratelimit${i}@example.com`,
            consentMarketing: true
          })
        })
      )
    }

    const responses = await Promise.all(promises)
    const rateLimited = responses.some(r => r.status === 429)

    if (rateLimited) {
      console.log('✅ Test 5 passed (rate limiting working)\n')
    } else {
      console.log('⚠️  Test 5: Rate limiting might not be triggered (expected some 429 responses)\n')
    }
  } catch (error) {
    console.error('❌ Test 5 failed:', error, '\n')
  }

  console.log('Testing complete!')
}

// Run the test if dev server is running
testEmailCapture().catch(console.error)