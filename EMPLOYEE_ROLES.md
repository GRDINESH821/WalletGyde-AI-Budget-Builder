# Employee Role Management for Unlimited Messages

This feature allows you to give employees unlimited messages in the demo chatbot by setting their role to `EMP`.

## Database Migration

First, you need to apply the database schema changes:

```bash
npm run db:push
```

This will add the `role` column to the `demo_emails` table.

## Setting Employee Roles

### Method 1: Using the Script (Recommended)

1. Make sure your server is running:
   ```bash
   npm run dev
   ```

2. Use the provided script to set employee roles:
   ```bash
   # Set an employee to have unlimited messages
   node scripts/set-employee-role.js john@company.com EMP
   
   # Set a regular user (10 message limit)
   node scripts/set-employee-role.js jane@company.com USER
   
   # Set an admin user (unlimited messages)
   node scripts/set-employee-role.js admin@company.com ADMIN
   ```

### Method 2: Using API Endpoints

You can also use the API endpoints directly:

#### Set User Role
```bash
curl -X POST http://localhost:5000/api/admin/set-role \
  -H "Content-Type: application/json" \
  -d '{"email": "john@company.com", "role": "EMP"}'
```

#### Get User Role
```bash
curl http://localhost:5000/api/user/john@company.com/role
```

## Role Types

- **USER**: Regular users with 10 message limit (default)
- **EMP**: Employees with unlimited messages
- **ADMIN**: Admin users with unlimited messages

## How It Works

1. When a user sends a message, the system checks their role in the `demo_emails` table
2. If the role is `EMP` or `ADMIN`, they get unlimited messages
3. If the role is `USER` (or not set), they are limited to 10 messages
4. The role is checked by email address, so it works across different demo sessions

## Example Usage

```bash
# Give all your employees unlimited access
node scripts/set-employee-role.js employee1@company.com EMP
node scripts/set-employee-role.js employee2@company.com EMP
node scripts/set-employee-role.js employee3@company.com EMP

# Check their roles
node scripts/set-employee-role.js employee1@company.com
```

## Notes

- The role is stored in the `demo_emails` table
- If a user doesn't exist in the `demo_emails` table, they default to `USER` role
- The system automatically creates a `demo_emails` record when setting a role for a new email
- This feature only affects the demo chatbot, not the full authenticated user system
