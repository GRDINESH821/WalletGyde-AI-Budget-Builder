#!/usr/bin/env node

/**
 * Script to set employee role for unlimited messages
 * Usage: node scripts/set-employee-role.js <email> [role]
 * 
 * Examples:
 * node scripts/set-employee-role.js john@company.com EMP
 * node scripts/set-employee-role.js jane@company.com USER
 */

const fetch = require('node-fetch');

async function setEmployeeRole(email, role = 'EMP') {
  try {
    const response = await fetch('http://localhost:5000/api/admin/set-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, role }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success: ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Failed to set role:', error.message);
    console.log('Make sure the server is running on localhost:5000');
  }
}

async function getUserRole(email) {
  try {
    const response = await fetch(`http://localhost:5000/api/user/${encodeURIComponent(email)}/role`);
    const result = await response.json();
    
    if (response.ok) {
      console.log(`📧 ${result.email} has role: ${result.role}`);
    } else {
      console.error(`❌ Error: ${result.message}`);
    }
  } catch (error) {
    console.error('❌ Failed to get role:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage: node scripts/set-employee-role.js <email> [role]

Examples:
  node scripts/set-employee-role.js john@company.com EMP    # Set as employee (unlimited messages)
  node scripts/set-employee-role.js jane@company.com USER   # Set as regular user (10 message limit)
  node scripts/set-employee-role.js admin@company.com ADMIN # Set as admin

Available roles: USER, EMP, ADMIN
  USER: Regular user with 10 message limit
  EMP: Employee with unlimited messages
  ADMIN: Admin user with unlimited messages
`);
  process.exit(1);
}

const email = args[0];
const role = args[1] || 'EMP';

if (!email.includes('@')) {
  console.error('❌ Please provide a valid email address');
  process.exit(1);
}

if (!['USER', 'EMP', 'ADMIN'].includes(role)) {
  console.error('❌ Invalid role. Must be USER, EMP, or ADMIN');
  process.exit(1);
}

console.log(`🔧 Setting role for ${email} to ${role}...`);
setEmployeeRole(email, role).then(() => {
  console.log(`\n📋 Current role status:`);
  getUserRole(email);
});
