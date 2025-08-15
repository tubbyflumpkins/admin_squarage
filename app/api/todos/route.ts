import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'todos.json')

// Ensure data file exists
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    // Create default data if file doesn't exist
    const defaultData = {
      todos: [],
      categories: [
        { id: "1", name: "Website", color: "#264653" },
        { id: "2", name: "Backend", color: "#2A9D8F" },
        { id: "3", name: "Marketing", color: "#E76F51" }
      ],
      owners: [
        { id: "1", name: "Dylan", color: "#E63946" },
        { id: "2", name: "Team", color: "#457B9D" }
      ]
    }
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2))
  }
}

export async function GET() {
  try {
    await ensureDataFile()
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    console.error('Error reading data:', error)
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureDataFile()
    const data = await request.json()
    
    // Create backup before writing
    try {
      const currentData = await fs.readFile(DATA_FILE, 'utf-8')
      const backupFile = path.join(process.cwd(), 'data', `todos-backup-${Date.now()}.json`)
      await fs.writeFile(backupFile, currentData)
      
      // Keep only last 5 backups
      const dataDir = path.dirname(DATA_FILE)
      const files = await fs.readdir(dataDir)
      const backups = files.filter(f => f.startsWith('todos-backup-')).sort()
      if (backups.length > 5) {
        for (let i = 0; i < backups.length - 5; i++) {
          await fs.unlink(path.join(dataDir, backups[i]))
        }
      }
    } catch (error) {
      console.log('Backup creation failed, but continuing:', error)
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving data:', error)
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
  }
}