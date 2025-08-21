// Test script to check sales loading behavior
const fetch = require('node-fetch');

async function testSalesLoad() {
  try {
    console.log('Testing sales load...');
    
    // First GET to see what's there
    const getResponse = await fetch('http://localhost:3000/api/sales/neon');
    const data = await getResponse.json();
    console.log('Initial GET response:', {
      sales: data.sales?.length || 0,
      collections: data.collections?.length || 0,
      products: data.products?.length || 0
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second GET to see if it's still there
    const getResponse2 = await fetch('http://localhost:3000/api/sales/neon');
    const data2 = await getResponse2.json();
    console.log('Second GET response:', {
      sales: data2.sales?.length || 0,
      collections: data2.collections?.length || 0,
      products: data2.products?.length || 0
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSalesLoad();