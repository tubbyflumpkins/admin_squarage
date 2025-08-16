// Seed the database with test data
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seedDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('Seeding database with test data...\n');
    
    // Insert categories
    const categories = [
      { id: 'cat1', name: 'Work', color: '#4A9B4E' },
      { id: 'cat2', name: 'Personal', color: '#F7901E' },
      { id: 'cat3', name: 'Shopping', color: '#01BAD5' }
    ];
    
    for (const cat of categories) {
      await sql`
        INSERT INTO categories (id, name, color) 
        VALUES (${cat.id}, ${cat.name}, ${cat.color})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          color = EXCLUDED.color
      `;
    }
    console.log('✓ Added categories');
    
    // Insert owners
    const owners = [
      { id: 'owner1', name: 'Dylan', color: '#F04E23' },
      { id: 'owner2', name: 'Team', color: '#F5B74C' }
    ];
    
    for (const owner of owners) {
      await sql`
        INSERT INTO owners (id, name, color) 
        VALUES (${owner.id}, ${owner.name}, ${owner.color})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          color = EXCLUDED.color
      `;
    }
    console.log('✓ Added owners');
    
    // Insert todos
    const todos = [
      {
        id: 'todo1',
        title: 'Review quarterly reports - Q4 financial reports',
        notes: 'Go through Q4 financial reports in detail',
        category: 'Work',
        owner: 'Dylan',
        priority: 'high',
        status: 'not_started',
        completed: false,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'todo2',
        title: 'Buy groceries - Milk, eggs, bread',
        notes: 'Get organic milk if available',
        category: 'Shopping',
        owner: 'Dylan',
        priority: 'medium',
        status: 'not_started',
        completed: false,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'todo3',
        title: 'Team meeting preparation',
        notes: 'Prepare slides for Monday meeting',
        category: 'Work',
        owner: 'Team',
        priority: 'high',
        status: 'in_progress',
        completed: false,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'todo4',
        title: 'Dentist appointment - Annual checkup',
        notes: 'Remember to bring insurance card',
        category: 'Personal',
        owner: 'Dylan',
        priority: 'low',
        status: 'not_started',
        completed: false,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const todo of todos) {
      await sql`
        INSERT INTO todos (
          id, title, notes, category, owner, priority, 
          status, completed, due_date, created_at, updated_at
        ) VALUES (
          ${todo.id}, ${todo.title}, ${todo.notes}, ${todo.category}, 
          ${todo.owner}, ${todo.priority}, ${todo.status}, ${todo.completed}, 
          ${todo.dueDate}, ${todo.createdAt}, ${todo.updatedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          notes = EXCLUDED.notes,
          category = EXCLUDED.category,
          owner = EXCLUDED.owner,
          priority = EXCLUDED.priority,
          status = EXCLUDED.status,
          completed = EXCLUDED.completed,
          due_date = EXCLUDED.due_date,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log('✓ Added todos');
    
    console.log('\n✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
  
  process.exit(0);
}

seedDatabase();