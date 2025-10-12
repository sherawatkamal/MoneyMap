# Database Commands Reference

## Quick Access Commands

### Connect to Database
```bash
mysql -u root -h localhost
```

### Basic Database Operations
```sql
-- Use the database
USE moneymap;

-- Show all tables
SHOW TABLES;

-- View users table structure
DESCRIBE users;

-- View all users
SELECT id, username, email, full_name, age, occupation, financial_goal, risk_tolerance FROM users;

-- View specific user
SELECT * FROM users WHERE username = 'john@example.com';

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- View users by age range
SELECT full_name, age, occupation FROM users WHERE age BETWEEN 25 AND 35;

-- View users by financial goal
SELECT full_name, financial_goal, risk_tolerance FROM users WHERE financial_goal = 'retirement';
```

### Administrative Commands
```sql
-- Show database information
SHOW DATABASES;

-- Show current database
SELECT DATABASE();

-- Show table sizes
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'moneymap';

-- Show all users with their creation info
SELECT id, username, full_name, created_at, updated_at FROM users;
```

### Security Note
- Annual income is encrypted in the `annual_income_encrypted` field
- Passwords are hashed using bcrypt
- Never expose these fields in production logs
