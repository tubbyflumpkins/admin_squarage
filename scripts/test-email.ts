import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testEmail() {
  const testRecipient = process.argv[2] || 'test@example.com'

  console.log('🚀 Testing email system...')
  console.log(`📧 Sending to: ${testRecipient}`)
  console.log(`📤 From: ${process.env.RESEND_FROM_EMAIL}`)

  try {
    const response = await fetch('http://localhost:3000/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: testRecipient,
        templateId: 'welcome-email',
        templateType: 'welcome',
        variables: {
          discountCode: 'TEST-WELCOME-10',
          customerEmail: testRecipient,
        },
        isTest: true,
        skipAuth: true,
      }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log('✅ Email sent successfully!')
      console.log('📋 Details:', data.data)
      console.log('\n👉 Check your inbox for the welcome email!')
      console.log('👉 Check Resend dashboard: https://resend.com/emails')
    } else {
      console.error('❌ Failed to send email:', data.message || 'Unknown error')
      if (data.error) {
        console.error('Error details:', data.error)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\nMake sure the dev server is running on port 3000')
  }
}

// Run with: npx tsx scripts/test-email.ts your-email@gmail.com
testEmail()