async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dynamicRows: [{ id: 'test', type: 'NEWEST', value: '', title: 'Test', isActive: true, order: 0 }] })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
