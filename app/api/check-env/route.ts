import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    // Check which env vars are set
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPreview: process.env.DATABASE_URL ?
      `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',

    // Environment info
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'local',
    vercelUrl: process.env.VERCEL_URL || 'local',

    // Full URL that should be used
    expectedNextAuthUrl: process.env.VERCEL_URL ?
      `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',

    // Recommendations
    recommendations: !process.env.NEXTAUTH_URL ? [
      '⚠️ NEXTAUTH_URL is NOT set!',
      `Set it to: https://${process.env.VERCEL_URL || 'your-deployment-url.vercel.app'}`
    ] : [
      '✅ NEXTAUTH_URL is set'
    ]
  })
}