import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Button,
  Font,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  discountCode?: string
  customerEmail?: string
}

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://squarage.com'
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.squarage.com'

export const WelcomeEmail = ({
  discountCode = 'WELCOME10-XXXXX',
  customerEmail = 'customer@example.com',
}: WelcomeEmailProps) => {
  const previewText = `Welcome to Squarage! Your exclusive 10% discount code is here`

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Helvetica Neue"
          fallbackFontFamily={["Helvetica", "Arial", "sans-serif"]}
          webFont={{
            url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src="https://admin.squarage.com/images/logo_main.png"
              alt="Squarage"
              width="280"
              height="70"
              style={logo}
            />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Heading style={h1}>Welcome to Squarage!</Heading>
            <Text style={heroText}>
              Thank you for joining our community. We&apos;re excited to have you here.
            </Text>
          </Section>

          {/* Discount Code Section */}
          <Section style={discountSection}>
            <div style={discountBox}>
              <Text style={discountLabel}>Your Exclusive Welcome Offer</Text>
              <Heading style={discountCode}>{discountCode}</Heading>
              <Text style={discountText}>
                Enjoy <strong>10% off</strong> your first order
              </Text>
              <Text style={discountExpiry}>
                Valid for 30 days from today
              </Text>
              <Button
                href={`${baseUrl}/collections?discount=${discountCode}`}
                style={button}
              >
                Shop Now
              </Button>
            </div>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Squarage Studio · Los Angeles, CA
            </Text>
            <div style={socialContainer}>
              <Link href="https://instagram.com/squarage" style={socialLink}>
                Instagram
              </Link>
              <Text style={footerDivider}>·</Text>
              <Link href={`${baseUrl}`} style={socialLink}>
                Website
              </Link>
            </div>
            <Text style={footerText}>
              You&apos;re receiving this email because you signed up at squarage.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#fffaf4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
}

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
  backgroundColor: '#ffffff',
  borderRadius: '12px 12px 0 0',
}

const logo = {
  margin: '0 auto',
  display: 'block' as const,
}

const heroSection = {
  padding: '40px 32px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#4A9B4E',
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '40px',
  margin: '0 0 20px',
}

const heroText = {
  color: '#666666',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const discountSection = {
  padding: '0 32px 40px',
  backgroundColor: '#ffffff',
}

const discountBox = {
  backgroundColor: '#F5F5F0',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  border: '2px dashed #4A9B4E',
}

const discountLabel = {
  color: '#666666',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 16px',
}

const discountCode = {
  color: '#4A9B4E',
  fontSize: '36px',
  fontWeight: '700',
  letterSpacing: '2px',
  margin: '0 0 8px',
  fontFamily: 'monospace',
}

const discountText = {
  color: '#333333',
  fontSize: '18px',
  margin: '0 0 8px',
}

const discountExpiry = {
  color: '#999999',
  fontSize: '14px',
  margin: '0 0 24px',
}

const button = {
  backgroundColor: '#4A9B4E',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 auto',
}

const collectionsSection = {
  padding: '40px 32px',
  backgroundColor: '#ffffff',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333333',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 32px',
}

const blobContainer = {
  display: 'flex',
  justifyContent: 'center',
  gap: '24px',
  marginTop: '32px',
}

const blobButton = {
  display: 'block',
  backgroundColor: '#4A9B4E',
  color: '#ffffff',
  padding: '40px 32px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  transition: 'transform 0.3s',
  width: '200px',
  height: '200px',
  position: 'relative' as const,
}

const blobText = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 8px',
  display: 'block',
}

const blobSubtext = {
  fontSize: '14px',
  color: '#ffffff',
  opacity: '0.9',
  margin: '0',
  display: 'block',
}

const linkReset = {
  textDecoration: 'none',
  color: 'inherit',
}

const aboutSection = {
  padding: '40px 32px',
  backgroundColor: '#ffffff',
  borderTop: '1px solid #F5F5F0',
}

const h3 = {
  color: '#333333',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const aboutText = {
  color: '#666666',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const ctaSection = {
  padding: '32px',
  backgroundColor: '#ffffff',
}

const ctaColumn = {
  width: '50%',
  textAlign: 'center' as const,
}

const ctaLink = {
  color: '#F7901E',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
}

const footer = {
  padding: '32px',
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  borderTop: '1px solid #F5F5F0',
  textAlign: 'center' as const,
}

const socialContainer = {
  marginBottom: '16px',
}

const socialLink = {
  color: '#999999',
  fontSize: '14px',
  textDecoration: 'none',
  margin: '0 8px',
}

const footerDivider = {
  color: '#999999',
  fontSize: '14px',
  margin: '0 4px',
  display: 'inline',
}

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '4px 0',
}

export default WelcomeEmail