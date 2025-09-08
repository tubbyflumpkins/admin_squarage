import { NextResponse } from 'next/server'
import { db, isDatabaseConfigured } from '@/lib/db'
import { users } from '@/lib/db/schema'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      databaseConfigured: isDatabaseConfigured(),
      databaseUrlExists: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      dbConnectionExists: !!db,
      nextAuthUrlExists: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not set - using auto-detection',
      nextAuthSecretExists: !!process.env.NEXTAUTH_SECRET,
    }

    // Try to query users table
    if (db) {
      try {
        const userCount = await db.select().from(users)
        debugInfo.userCount = userCount.length
        debugInfo.userEmails = userCount.map(u => u.email)
        debugInfo.databaseConnection = 'SUCCESS'
      } catch (error) {
        debugInfo.databaseConnection = 'FAILED'
        debugInfo.databaseError = error instanceof Error ? error.message : 'Unknown error'
      }
    } else {
      debugInfo.databaseConnection = 'NO_DB_INSTANCE'
    }

    // Test password hash for debugging
    const testPassword = 'test123'
    const testHash = await bcrypt.hash(testPassword, 10)
    debugInfo.testPasswordHash = {
      password: testPassword,
      hash: testHash,
      verifyTest: await bcrypt.compare(testPassword, testHash)
    }

    return NextResponse.json(debugInfo, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}