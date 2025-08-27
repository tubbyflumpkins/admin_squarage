import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calendarEvents, calendarTypes, eventReminders } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// GET: Fetch all calendar data
export async function GET() {
  try {
    console.log('Fetching calendar data from database...')
    
    // Fetch all calendar types
    const types = await db.select().from(calendarTypes)
    
    // Fetch all events
    const events = await db.select().from(calendarEvents)
    
    // Fetch all reminders
    const reminders = await db.select().from(eventReminders)
    
    console.log(`Found ${events.length} events, ${types.length} calendar types, ${reminders.length} reminders`)
    
    return NextResponse.json({
      events,
      calendarTypes: types,
      reminders,
    })
  } catch (error) {
    console.error('Error fetching calendar data:', error)
    
    // Return empty data on error (fallback)
    return NextResponse.json({
      events: [],
      calendarTypes: [],
      reminders: [],
    })
  }
}

// POST: Save calendar data using UPSERT pattern
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('Saving calendar data to database...')
    console.log(`Received ${data.events?.length || 0} events, ${data.calendarTypes?.length || 0} calendar types, ${data.reminders?.length || 0} reminders`)
    
    // Safety check: Don't allow saving completely empty data if we had data before
    const existingEvents = await db.select().from(calendarEvents)
    const existingTypes = await db.select().from(calendarTypes)
    
    const hasExistingData = existingEvents.length > 0 || existingTypes.length > 0
    const isEmptyUpdate = (!data.events || data.events.length === 0) && 
                          (!data.calendarTypes || data.calendarTypes.length === 0)
    
    if (hasExistingData && isEmptyUpdate) {
      console.error('Blocked attempt to delete all calendar data')
      return NextResponse.json(
        { error: 'Cannot delete all calendar data' },
        { status: 400 }
      )
    }
    
    // Start transaction-like operations
    // Note: Neon doesn't support transactions over HTTP, so we'll do our best with individual operations
    
    try {
      // UPSERT Calendar Types
      if (data.calendarTypes && data.calendarTypes.length > 0) {
        for (const type of data.calendarTypes) {
          await db
            .insert(calendarTypes)
            .values({
              id: type.id,
              name: type.name,
              color: type.color,
              createdAt: type.createdAt ? new Date(type.createdAt) : new Date(),
            })
            .onConflictDoUpdate({
              target: calendarTypes.id,
              set: {
                name: type.name,
                color: type.color,
              }
            })
        }
        
        // Delete calendar types that are no longer in the data
        const typeIds = data.calendarTypes.map((t: any) => t.id)
        if (typeIds.length > 0) {
          await db
            .delete(calendarTypes)
            .where(sql`${calendarTypes.id} NOT IN (${sql.join(typeIds.map(id => sql`${id}`), sql`, `)})`)
        }
      } else if (!hasExistingData) {
        // If no existing data and no new types, that's okay for initial setup
        console.log('No calendar types to save (initial setup)')
      }
      
      // UPSERT Events
      if (data.events && data.events.length > 0) {
        for (const event of data.events) {
          await db
            .insert(calendarEvents)
            .values({
              id: event.id,
              title: event.title,
              description: event.description,
              location: event.location,
              calendarTypeId: event.calendarTypeId,
              startTime: new Date(event.startTime),
              endTime: new Date(event.endTime),
              allDay: event.allDay,
              recurringPattern: event.recurringPattern,
              recurringEndDate: event.recurringEndDate ? new Date(event.recurringEndDate) : null,
              createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
              updatedAt: event.updatedAt ? new Date(event.updatedAt) : new Date(),
            })
            .onConflictDoUpdate({
              target: calendarEvents.id,
              set: {
                title: event.title,
                description: event.description,
                location: event.location,
                calendarTypeId: event.calendarTypeId,
                startTime: new Date(event.startTime),
                endTime: new Date(event.endTime),
                allDay: event.allDay,
                recurringPattern: event.recurringPattern,
                recurringEndDate: event.recurringEndDate ? new Date(event.recurringEndDate) : null,
                updatedAt: new Date(),
              }
            })
        }
        
        // Delete events that are no longer in the data
        const eventIds = data.events.map((e: any) => e.id)
        if (eventIds.length > 0) {
          await db
            .delete(calendarEvents)
            .where(sql`${calendarEvents.id} NOT IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`)
        } else {
          // If no events in the data, delete all events
          await db.delete(calendarEvents).where(sql`1=1`)
        }
      } else {
        // Delete all events if none provided (but only if we're not blocking empty updates)
        if (!hasExistingData) {
          console.log('No events to save (initial setup)')
        }
      }
      
      // UPSERT Reminders
      if (data.reminders && data.reminders.length > 0) {
        for (const reminder of data.reminders) {
          await db
            .insert(eventReminders)
            .values({
              id: reminder.id,
              eventId: reminder.eventId,
              minutesBefore: reminder.minutesBefore,
              createdAt: reminder.createdAt ? new Date(reminder.createdAt) : new Date(),
            })
            .onConflictDoUpdate({
              target: eventReminders.id,
              set: {
                minutesBefore: reminder.minutesBefore,
              }
            })
        }
        
        // Delete reminders that are no longer in the data
        const reminderIds = data.reminders.map((r: any) => r.id)
        if (reminderIds.length > 0) {
          await db
            .delete(eventReminders)
            .where(sql`${eventReminders.id} NOT IN (${sql.join(reminderIds.map(id => sql`${id}`), sql`, `)})`)
        }
      } else {
        // Delete all reminders if none provided
        await db.delete(eventReminders).where(sql`1=1`)
      }
      
      console.log('Calendar data saved successfully')
      return NextResponse.json({ success: true })
      
    } catch (dbError) {
      console.error('Database operation error:', dbError)
      throw dbError
    }
    
  } catch (error) {
    console.error('Error saving calendar data:', error)
    return NextResponse.json(
      { error: 'Failed to save calendar data' },
      { status: 500 }
    )
  }
}