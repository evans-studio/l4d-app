const { exec } = require('child_process');
const os = require('os');

console.log('🌐 Opening browser for manual testing');
console.log('=====================================\n');

const port = 3003; // Using port 3003 as dev server is running there
const url = `http://localhost:${port}`;

console.log(`📌 Test URLs:`);
console.log(`   Home: ${url}`);
console.log(`   Login: ${url}/auth/login`);
console.log(`   Dashboard: ${url}/dashboard`);
console.log(`   Book Service: ${url}/book`);
console.log(`   Admin: ${url}/admin`);

console.log('\n📧 Test Credentials:');
console.log('   Customer: evanspaul87@gmail.com / Roshel6526.');
console.log('   Admin: paul@evans-studio.co.uk / (you know the password)');

console.log('\n🧪 Test Checklist:');
console.log('1. Login as customer (evanspaul87@gmail.com)');
console.log('2. Navigate to dashboard');
console.log('3. Add a vehicle');
console.log('4. Add an address');
console.log('5. Start new booking');
console.log('6. Select a service');
console.log('7. Complete booking flow');

// Open browser based on platform
const platform = os.platform();
let command;

if (platform === 'darwin') {
  command = `open ${url}`;
} else if (platform === 'win32') {
  command = `start ${url}`;
} else {
  command = `xdg-open ${url}`;
}

exec(command, (error) => {
  if (error) {
    console.error('\n❌ Failed to open browser:', error.message);
    console.log(`\n📎 Please manually open: ${url}`);
  } else {
    console.log('\n✅ Browser opened successfully!');
    console.log('   Begin manual testing...');
  }
});