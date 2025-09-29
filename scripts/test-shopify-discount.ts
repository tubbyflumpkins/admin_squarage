import { config } from 'dotenv'
import { verifyShopifyConnection, createDiscountCode } from '@/lib/shopify-admin'

config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3002'

async function testShopifyDiscountGeneration() {
  console.log('🧪 Testing Shopify Discount Code Generation\n')

  // Test 1: Verify Shopify connection
  console.log('Test 1: Verifying Shopify connection...')
  const isConnected = await verifyShopifyConnection()

  if (!isConnected) {
    console.error('❌ Failed to connect to Shopify. Check your credentials.')
    return
  }
  console.log('✅ Shopify connection successful!\n')

  // Test 2: Generate a test discount code directly
  console.log('Test 2: Generating test discount code directly...')
  const testCode = await createDiscountCode('test@example.com')

  if (!testCode) {
    console.error('❌ Failed to generate discount code directly')
  } else {
    console.log(`✅ Generated discount code: ${testCode}\n`)
  }

  // Test 3: Test via API endpoint with new email
  console.log('Test 3: Testing discount generation via API endpoint...')

  const testEmail = `shopify-test-${Date.now()}@gmail.com`

  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify({
        email: testEmail,
        consentMarketing: true,
        source: 'shopify-test'
      })
    })

    const data = await response.json()
    console.log('API Response:', data)

    if (data.success && data.discountCode && !data.discountCode.includes('PENDING')) {
      console.log(`✅ Successfully created subscriber with discount code: ${data.discountCode}`)
      console.log('\n📝 Next steps:')
      console.log(`1. Go to Shopify Admin > Marketing > Discounts`)
      console.log(`2. Search for: ${data.discountCode}`)
      console.log(`3. Verify it's a 10% discount, single-use, expires in 30 days`)
      console.log(`4. Try the code at checkout to confirm it works`)
    } else if (data.discountCode === undefined && data.isExisting) {
      console.log('⚠️  Email already exists, no new discount generated')
    } else {
      console.log('⚠️  Discount code generation may have failed (marked as PENDING)')
    }
  } catch (error) {
    console.error('❌ API test failed:', error)
  }

  // Test 4: Test with marketing consent = false (should not generate code)
  console.log('\nTest 4: Testing without marketing consent (should not generate code)...')

  const noConsentEmail = `no-consent-${Date.now()}@outlook.com`

  try {
    const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      body: JSON.stringify({
        email: noConsentEmail,
        consentMarketing: false,
        source: 'shopify-test'
      })
    })

    const data = await response.json()

    if (data.success && !data.discountCode) {
      console.log('✅ Correctly did not generate discount code without consent')
    } else {
      console.log('⚠️  Unexpected result:', data)
    }
  } catch (error) {
    console.error('❌ No consent test failed:', error)
  }

  console.log('\n🎉 Testing complete!')
}

// Run the test
testShopifyDiscountGeneration().catch(console.error)