import { createAdminApiClient } from '@shopify/admin-api-client'
import type { AdminApiClient } from '@shopify/admin-api-client'

// Lazy initialize Shopify Admin API Client
let shopifyClient: AdminApiClient | null = null

function getShopifyClient(): AdminApiClient {
  if (!shopifyClient) {
    const domain = process.env.SHOPIFY_SHOP_DOMAIN
    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

    if (!domain || !token) {
      throw new Error('Shopify credentials not configured. Please set SHOPIFY_SHOP_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN in environment variables.')
    }

    shopifyClient = createAdminApiClient({
      storeDomain: domain,
      apiVersion: '2024-10',
      accessToken: token,
    })
  }

  return shopifyClient
}

/**
 * Generates a unique discount code string
 */
function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `WELCOME10-${randomPart}`
}

/**
 * Creates a discount code in Shopify for a new email subscriber
 * @param email - The subscriber's email address
 * @returns The generated discount code or null if creation failed
 */
export async function createDiscountCode(email: string): Promise<string | null> {
  try {
    const discountCode = generateUniqueCode()

    // Calculate expiry date (30 days from now)
    const now = new Date()
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const startsAt = now.toISOString()
    const endsAt = expiryDate.toISOString()

    const mutation = `
      mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode {
            id
            codeDiscount {
              ... on DiscountCodeBasic {
                title
                codes(first: 1) {
                  nodes {
                    code
                  }
                }
                customerGets {
                  value {
                    ... on DiscountPercentage {
                      percentage
                    }
                  }
                }
                appliesOncePerCustomer
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `

    const variables = {
      basicCodeDiscount: {
        title: `Welcome discount for ${email}`,
        code: discountCode,
        startsAt: startsAt,
        endsAt: endsAt,
        appliesOncePerCustomer: true,
        customerGets: {
          value: {
            percentage: 0.1 // 10% discount
          },
          items: {
            all: true // Applies to entire order
          }
        },
        customerSelection: {
          all: true // Available to all customers
        }
      }
    }

    const client = getShopifyClient()
    const response = await client.request(mutation, {
      variables: variables,
    })

    // Check for errors
    if (response.errors) {
      console.error('GraphQL errors:', response.errors)

      // Check specifically for permission errors
      const graphQLErrors = (response as any).graphQLErrors
      if (graphQLErrors && graphQLErrors.length > 0) {
        const permissionError = graphQLErrors.find((err: any) =>
          err.message.includes('write_discounts')
        )
        if (permissionError) {
          console.error('\n⚠️  SHOPIFY PERMISSION ERROR:')
          console.error('The Shopify app needs the "write_discounts" access scope.')
          console.error('Please update your app permissions in Shopify Admin:')
          console.error('1. Go to Settings > Apps and sales channels > Develop apps')
          console.error('2. Click on your app')
          console.error('3. Click "Configure Admin API scopes"')
          console.error('4. Enable "write_discounts" scope')
          console.error('5. Save and reinstall the app\n')
        }
      }

      return null
    }

    const result = response.data?.discountCodeBasicCreate

    if (result?.userErrors && result.userErrors.length > 0) {
      console.error('Shopify user errors:', result.userErrors)

      // If the code already exists, try again with a new code
      if (result.userErrors.some((error: any) => error.code === 'TAKEN')) {
        console.log('Discount code already exists, generating new one...')
        return createDiscountCode(email) // Recursive call with new code
      }

      return null
    }

    // Verify the code was created successfully
    const createdCode = result?.codeDiscountNode?.codeDiscount?.codes?.nodes?.[0]?.code

    if (createdCode !== discountCode) {
      console.error('Created code does not match expected code')
      return null
    }

    console.log(`Successfully created discount code ${discountCode} for ${email}`)
    return discountCode

  } catch (error) {
    console.error('Error creating Shopify discount code:', error)

    // Log additional details if available
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return null
  }
}

/**
 * Verifies that the Shopify connection is working
 */
export async function verifyShopifyConnection(): Promise<boolean> {
  try {
    const query = `
      query {
        shop {
          name
          email
          currencyCode
        }
      }
    `

    const client = getShopifyClient()
    const response = await client.request(query)

    if (response.errors) {
      console.error('Shopify connection test failed:', response.errors)
      return false
    }

    console.log('Shopify connection successful. Shop:', response.data?.shop?.name)
    return true

  } catch (error) {
    console.error('Failed to verify Shopify connection:', error)
    return false
  }
}