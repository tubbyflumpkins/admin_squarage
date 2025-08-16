// Test script to verify API is working
async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/todos/neon');
    
    if (!response.ok) {
      console.error('API returned error:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:');
    console.log('- Todos count:', data.todos?.length || 0);
    console.log('- Categories count:', data.categories?.length || 0);
    console.log('- Owners count:', data.owners?.length || 0);
    
    if (data.todos && data.todos.length > 0) {
      console.log('\nFirst todo:', data.todos[0]);
    }
    
    if (data.categories && data.categories.length > 0) {
      console.log('\nCategories:', data.categories.map(c => c.name).join(', '));
    }
    
    if (data.owners && data.owners.length > 0) {
      console.log('\nOwners:', data.owners.map(o => o.name).join(', '));
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI();