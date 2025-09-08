import webpush from 'web-push'

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys()

console.log('🔑 VAPID Keys Generated!\n')
console.log('Add these to your .env.local file:\n')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_SUBJECT=mailto:admin@squarage.com`)
console.log('\n⚠️  Keep the private key secret!')
console.log('✅ The public key will be used in the browser for push subscriptions.')