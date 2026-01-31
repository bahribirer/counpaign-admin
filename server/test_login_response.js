// Node 18+ has native fetch
async function testLogin() {
    try {
        console.log('Testing login for user: stock');
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'stock', password: 'stock' })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('User Data:', JSON.stringify(data.user, null, 2));

        if (data.user && data.user.businessId) {
            console.log('SUCCESS: businessId is present.');
        } else {
            console.log('FAILURE: businessId is MISSING.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
