// const fetch = require('node-fetch'); // Built-in in Node 18+

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'debug_user_' + Date.now() + '@example.com';
const PASSWORD = 'password123';
const NAME = 'Debug User';

async function run() {
  console.log('--- Starting Debug Script ---');

  // 1. Register
  console.log(`\n1. Registering user: ${EMAIL}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: NAME, email: EMAIL, password: PASSWORD }),
  });
  const regData = await regRes.json();
  console.log('Register Response:', regRes.status, regData);

  // 2. Login
  console.log(`\n2. Logging in`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginRes.status, loginData);

  if (!loginRes.ok) {
    console.error('Login failed, aborting.');
    return;
  }

  const cookie = loginRes.headers.get('set-cookie');
  console.log('Cookie:', cookie);

  // 3. Create Inspection
  console.log(`\n3. Creating Inspection`);
  const inspectionPayload = {
    clientName: 'Debug Client',
    employeeName: NAME,
    location: { city: 'Test City', address: '123 Test St', postcode: '12345' },
    turbine: []
  };

  const createRes = await fetch(`${BASE_URL}/api/inspection`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify(inspectionPayload),
  });
  const createData = await createRes.json();
  console.log('Create Inspection Response:', createRes.status, createData);

  // 4. Get Inspections
  console.log(`\n4. Fetching Inspections`);
  const getRes = await fetch(`${BASE_URL}/api/inspection`, {
    method: 'GET',
    headers: { 
      'Cookie': cookie
    },
  });
  const getData = await getRes.json();
  console.log('Get Inspections Response:', getRes.status, getData);
  
  if (getData.data && getData.data.length > 0) {
      console.log('SUCCESS: Found inspection in list.');
      console.log('Inspection UserID:', getData.data[0].userId);
  } else {
      console.log('FAILURE: Inspection not found in list.');
  }
}

run().catch(console.error);
