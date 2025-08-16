// Check what's actually in the database
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Checking database contents...\n');
    
    // Check todos
    const todos = await sql`SELECT * FROM todos`;
    console.log(`Todos in database: ${todos.length}`);
    if (todos.length > 0) {
      console.log('Sample todo:', todos[0]);
    }
    
    // Check categories
    const categories = await sql`SELECT * FROM categories`;
    console.log(`\nCategories in database: ${categories.length}`);
    if (categories.length > 0) {
      console.log('Categories:', categories.map(c => c.name).join(', '));
    }
    
    // Check owners
    const owners = await sql`SELECT * FROM owners`;
    console.log(`\nOwners in database: ${owners.length}`);
    if (owners.length > 0) {
      console.log('Owners:', owners.map(o => o.name).join(', '));
    }
    
  } catch (error) {
    console.error('Database error:', error);
  }
  
  process.exit(0);
}

checkDatabase();