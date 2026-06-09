const fs = require('fs');

let file = fs.readFileSync('server.ts', 'utf8');

// Schema
if (!file.includes('email_verified BOOLEAN')) {
    const alterStr = `  try {\n    await db.exec('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;');\n  } catch (e) {}\n`;
    file = file.replace('// No alter tables needed', alterStr);
}

// create endpoint
const origCreate = `"INSERT INTO users (username, email, password_hash, role, created_by) VALUES ($1, $2, $3, $4, $5)",`;
const newCreate = `"INSERT INTO users (username, email, password_hash, role, created_by, email_verified) VALUES ($1, $2, $3, $4, $5, true)",`;
file = file.replace(origCreate, newCreate);

fs.writeFileSync('server.ts', file);
