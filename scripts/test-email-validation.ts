import { config } from 'dotenv'
import { validateEmail, getEmailErrorMessage } from '@/lib/email-validation'

config({ path: '.env.local' })

const API_KEY = process.env.EMAIL_CAPTURE_API_KEY
const BASE_URL = 'http://localhost:3002'

async function testEmailValidation() {
  console.log('🧪 Testing Email Validation System\n')

  // Test cases
  const testEmails = [
    // Valid emails (using real domains for testing)
    { email: 'valid@gmail.com', shouldPass: true, description: 'Valid email' },
    { email: 'user.name@outlook.com', shouldPass: true, description: 'Valid email with dot' },
    { email: 'user+tag@yahoo.com', shouldPass: true, description: 'Valid email with plus' },
    { email: 'user_name@protonmail.com', shouldPass: true, description: 'Valid email with underscore' },

    // Invalid formats
    { email: '', shouldPass: false, description: 'Empty email' },
    { email: 'notanemail', shouldPass: false, description: 'Missing @ symbol' },
    { email: '@example.com', shouldPass: false, description: 'Missing local part' },
    { email: 'user@', shouldPass: false, description: 'Missing domain' },
    { email: 'user@domain', shouldPass: false, description: 'Missing TLD' },
    { email: 'user space@example.com', shouldPass: false, description: 'Contains space' },
    { email: 'user@domain..com', shouldPass: false, description: 'Double dots in domain' },
    { email: '.user@example.com', shouldPass: false, description: 'Starts with dot' },
    { email: 'user.@example.com', shouldPass: false, description: 'Ends with dot' },
    { email: 'user@@example.com', shouldPass: false, description: 'Double @ symbol' },

    // Disposable emails
    { email: 'test@mailinator.com', shouldPass: false, description: 'Disposable: Mailinator' },
    { email: 'test@10minutemail.com', shouldPass: false, description: 'Disposable: 10MinuteMail' },
    { email: 'test@guerrillamail.com', shouldPass: false, description: 'Disposable: GuerrillaMail' },
    { email: 'test@tempmail.com', shouldPass: false, description: 'Disposable: TempMail' },
    { email: 'test@throwaway.email', shouldPass: false, description: 'Disposable: Throwaway' },
    { email: 'test@yopmail.com', shouldPass: false, description: 'Disposable: YOPmail' },

    // Blocked test domains
    { email: 'test@test.com', shouldPass: false, description: 'Blocked: test.com domain' },
    { email: 'user@example.com', shouldPass: false, description: 'Blocked: example.com domain' },
    { email: 'user@fake.com', shouldPass: false, description: 'Blocked: fake.com domain' },

    // Suspicious prefixes
    { email: 'spam@gmail.com', shouldPass: false, description: 'Suspicious: spam prefix' },
    { email: 'throwaway@outlook.com', shouldPass: false, description: 'Suspicious: throwaway prefix' },
  ]

  console.log('=== Direct Validation Tests ===\n')

  for (const testCase of testEmails) {
    const result = validateEmail(testCase.email)
    const passed = result.isValid === testCase.shouldPass
    const icon = passed ? '✅' : '❌'

    console.log(`${icon} ${testCase.description}`)
    console.log(`   Email: "${testCase.email}"`)

    if (!result.isValid) {
      console.log(`   Error: ${getEmailErrorMessage(result)}`)
      if (result.isDisposable) {
        console.log(`   Disposable: Yes`)
      }
    }
    console.log()
  }

  console.log('\n=== API Endpoint Tests ===\n')

  // Test via API
  const apiTests = [
    { email: 'valid.user@realdomain.com', consent: true, description: 'Valid email via API' },
    { email: 'test@mailinator.com', consent: true, description: 'Disposable email via API' },
    { email: 'user space@example.com', consent: true, description: 'Invalid format via API' },
    { email: '  MiXeD@CaSe.COM  ', consent: true, description: 'Mixed case with spaces' },
  ]

  for (const test of apiTests) {
    console.log(`Testing: ${test.description}`)
    console.log(`Email: "${test.email}"`)

    try {
      const response = await fetch(`${BASE_URL}/api/email-capture/public/subscribe`, {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY!,
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3001',
          'x-forwarded-for': `192.168.1.${Math.floor(Math.random() * 255)}`
        },
        body: JSON.stringify({
          email: test.email,
          consentMarketing: test.consent,
          source: 'validation-test'
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log(`✅ Accepted: ${data.message}`)
      } else {
        console.log(`🚫 Rejected: ${data.message}`)
        if (data.errorCode) {
          console.log(`   Error Code: ${data.errorCode}`)
        }
      }
    } catch (error) {
      console.error(`❌ API Error:`, error)
    }
    console.log()
  }

  console.log('\n📊 Summary:')
  console.log('- Email validation includes format checking')
  console.log('- Disposable domain detection (300+ domains)')
  console.log('- Suspicious pattern detection')
  console.log('- Proper normalization (trim & lowercase)')
  console.log('- User-friendly error messages')
}

// Run the test
testEmailValidation().catch(console.error)